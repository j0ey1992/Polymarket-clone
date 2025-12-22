import { PrismaClient } from '@prisma/client';
import { gammaClient } from '../polymarket/GammaClient';
import { clobClient } from '../polymarket/ClobClient';
import { polymarketWsClient } from '../polymarket/WebSocketClient';
import { config } from '../config';
import { Market, PolymarketMarket } from '../types';
import { EventEmitter } from 'events';

/**
 * Service responsible for syncing markets from Polymarket
 * and maintaining local market data
 */
export class MarketSyncService extends EventEmitter {
  private prisma: PrismaClient;
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  /**
   * Start the market sync service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Market sync service is already running');
      return;
    }

    console.log('Starting market sync service...');
    this.isRunning = true;

    // Initial sync
    await this.syncMarkets();

    // Set up periodic sync
    this.syncInterval = setInterval(async () => {
      await this.syncMarkets();
    }, config.marketSync.intervalMs);

    // Set up WebSocket listeners for real-time updates
    this.setupWebSocketListeners();

    console.log('Market sync service started');
  }

  /**
   * Stop the market sync service
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('Market sync service stopped');
  }

  /**
   * Sync all active markets from Polymarket
   */
  async syncMarkets(): Promise<void> {
    try {
      console.log('Syncing markets from Polymarket...');

      // Fetch active markets from Polymarket
      const polymarketMarkets = await gammaClient.getMarkets({
        active: true,
        limit: config.marketSync.maxMarketsToSync,
        order: 'volume',
      });

      let synced = 0;
      let created = 0;

      for (const pmMarket of polymarketMarkets) {
        const result = await this.syncMarket(pmMarket);
        if (result.created) {
          created++;
        }
        synced++;
      }

      console.log(`Synced ${synced} markets (${created} new)`);
      this.emit('syncComplete', { synced, created });
    } catch (error) {
      console.error('Error syncing markets:', error);
      this.emit('syncError', error);
    }
  }

  /**
   * Sync a single market from Polymarket
   */
  async syncMarket(pmMarket: PolymarketMarket): Promise<{ market: Market; created: boolean }> {
    // Parse tokens to get YES/NO token IDs
    const tokens = pmMarket.tokens || [];
    const yesToken = tokens.find((t) => t.outcome === 'Yes');
    const noToken = tokens.find((t) => t.outcome === 'No');

    if (!yesToken || !noToken) {
      throw new Error(`Market ${pmMarket.id} is missing YES or NO tokens`);
    }

    // Check if market already exists
    const existingMarket = await this.prisma.market.findFirst({
      where: { polymarketConditionId: pmMarket.conditionId },
    });

    const marketData = {
      polymarketConditionId: pmMarket.conditionId,
      polymarketTokenIdYes: yesToken.token_id,
      polymarketTokenIdNo: noToken.token_id,
      question: pmMarket.question,
      description: pmMarket.description || null,
      image: pmMarket.image || null,
      category: null, // Category from event
      endDate: pmMarket.endDate ? new Date(pmMarket.endDate) : null,
      resolved: pmMarket.closed,
      volume: parseFloat(pmMarket.volume || '0'),
      liquidity: parseFloat(pmMarket.liquidity || '0'),
    };

    let market;
    let created = false;

    if (existingMarket) {
      // Update existing market
      market = await this.prisma.market.update({
        where: { id: existingMarket.id },
        data: {
          ...marketData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new market
      market = await this.prisma.market.create({
        data: marketData,
      });
      created = true;
      console.log(`Created new market: ${pmMarket.question.substring(0, 50)}...`);
    }

    // Fetch and store current prices
    await this.updateMarketPrices(market.id, yesToken.token_id, noToken.token_id);

    return {
      market: this.toMarket(market),
      created,
    };
  }

  /**
   * Update market prices from CLOB
   */
  async updateMarketPrices(
    marketId: string,
    yesTokenId: string,
    noTokenId: string
  ): Promise<void> {
    try {
      const yesPrice = await clobClient.getMidPrice(yesTokenId);
      const noPrice = await clobClient.getMidPrice(noTokenId);

      // Store in price history
      await this.prisma.priceHistory.create({
        data: {
          marketId,
          yesPrice,
          noPrice,
        },
      });

      this.emit('priceUpdate', { marketId, yesPrice, noPrice });
    } catch (error) {
      console.error(`Error updating prices for market ${marketId}:`, error);
    }
  }

  /**
   * Set up WebSocket listeners for real-time updates
   */
  private setupWebSocketListeners(): void {
    polymarketWsClient.on('priceUpdate', async (update) => {
      // Find market by token ID and update prices
      const market = await this.prisma.market.findFirst({
        where: {
          OR: [
            { polymarketTokenIdYes: update.tokenId },
            { polymarketTokenIdNo: update.tokenId },
          ],
        },
      });

      if (market) {
        const isYes = market.polymarketTokenIdYes === update.tokenId;
        await this.prisma.priceHistory.create({
          data: {
            marketId: market.id,
            yesPrice: isYes ? update.price : 1 - update.price,
            noPrice: isYes ? 1 - update.price : update.price,
          },
        });

        this.emit('priceUpdate', {
          marketId: market.id,
          yesPrice: isYes ? update.price : 1 - update.price,
          noPrice: isYes ? 1 - update.price : update.price,
        });
      }
    });

    polymarketWsClient.on('orderBookUpdate', (update) => {
      this.emit('orderBookUpdate', update);
    });
  }

  /**
   * Subscribe to real-time updates for a market
   */
  async subscribeToMarket(marketId: string): Promise<void> {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
    });

    if (!market) {
      throw new Error(`Market ${marketId} not found`);
    }

    polymarketWsClient.subscribeToOrderBook(market.polymarketTokenIdYes);
    polymarketWsClient.subscribeToOrderBook(market.polymarketTokenIdNo);
    polymarketWsClient.subscribeToPriceUpdates(market.polymarketTokenIdYes);
    polymarketWsClient.subscribeToPriceUpdates(market.polymarketTokenIdNo);
  }

  /**
   * Get all synced markets
   */
  async getMarkets(options?: {
    active?: boolean;
    limit?: number;
    offset?: number;
    orderBy?: 'volume' | 'createdAt' | 'endDate';
  }): Promise<Market[]> {
    const markets = await this.prisma.market.findMany({
      where: options?.active !== undefined ? { resolved: !options.active } : undefined,
      take: options?.limit || 100,
      skip: options?.offset || 0,
      orderBy: {
        [options?.orderBy || 'volume']: 'desc',
      },
    });

    return markets.map((m) => this.toMarket(m));
  }

  /**
   * Get a single market by ID
   */
  async getMarket(marketId: string): Promise<Market | null> {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
    });

    return market ? this.toMarket(market) : null;
  }

  /**
   * Get current price for a market
   */
  async getCurrentPrice(
    marketId: string
  ): Promise<{ yesPrice: number; noPrice: number } | null> {
    const latestPrice = await this.prisma.priceHistory.findFirst({
      where: { marketId },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestPrice) {
      return null;
    }

    return {
      yesPrice: Number(latestPrice.yesPrice),
      noPrice: Number(latestPrice.noPrice),
    };
  }

  /**
   * Get price history for a market
   */
  async getPriceHistory(
    marketId: string,
    limit = 100
  ): Promise<Array<{ yesPrice: number; noPrice: number; timestamp: Date }>> {
    const history = await this.prisma.priceHistory.findMany({
      where: { marketId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return history.map((h) => ({
      yesPrice: Number(h.yesPrice),
      noPrice: Number(h.noPrice),
      timestamp: h.timestamp,
    }));
  }

  /**
   * Check for resolved markets
   */
  async checkResolutions(): Promise<void> {
    const unresolvedMarkets = await this.prisma.market.findMany({
      where: { resolved: false },
    });

    for (const market of unresolvedMarkets) {
      try {
        const resolution = await gammaClient.isMarketResolved(market.polymarketConditionId);

        if (resolution.resolved) {
          await this.prisma.market.update({
            where: { id: market.id },
            data: {
              resolved: true,
              outcome: resolution.outcome,
            },
          });

          this.emit('marketResolved', {
            marketId: market.id,
            outcome: resolution.outcome,
          });

          console.log(
            `Market resolved: ${market.question.substring(0, 50)}... -> ${resolution.outcome}`
          );
        }
      } catch (error) {
        console.error(`Error checking resolution for market ${market.id}:`, error);
      }
    }
  }

  /**
   * Convert Prisma model to Market type
   */
  private toMarket(prismaMarket: {
    id: string;
    polymarketConditionId: string;
    polymarketTokenIdYes: string;
    polymarketTokenIdNo: string;
    question: string;
    description: string | null;
    image: string | null;
    category: string | null;
    endDate: Date | null;
    resolved: boolean;
    outcome: string | null;
    volume: unknown;
    liquidity: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): Market {
    return {
      id: prismaMarket.id,
      polymarketConditionId: prismaMarket.polymarketConditionId,
      polymarketTokenIdYes: prismaMarket.polymarketTokenIdYes,
      polymarketTokenIdNo: prismaMarket.polymarketTokenIdNo,
      question: prismaMarket.question,
      description: prismaMarket.description,
      image: prismaMarket.image,
      category: prismaMarket.category,
      endDate: prismaMarket.endDate,
      resolved: prismaMarket.resolved,
      outcome: prismaMarket.outcome as 'YES' | 'NO' | 'INVALID' | null,
      volume: Number(prismaMarket.volume),
      liquidity: Number(prismaMarket.liquidity),
      createdAt: prismaMarket.createdAt,
      updatedAt: prismaMarket.updatedAt,
    };
  }
}
