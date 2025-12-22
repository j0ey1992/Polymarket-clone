import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
import { polymarketWsClient, PriceUpdate, OrderBookUpdate } from '../polymarket/WebSocketClient';

const SPREAD = 0.05; // 5% spread

/**
 * Real-time price service that:
 * 1. Connects to Polymarket WebSocket
 * 2. Updates Redis cache instantly
 * 3. Broadcasts to connected users
 */
export class RealtimePriceService extends EventEmitter {
  private prisma: PrismaClient;
  private redis: Redis;
  private io: SocketIOServer;
  private subscribedMarkets: Set<string> = new Set();
  private tokenLookup: Map<string, { marketId: string; isYes: boolean }> = new Map();
  private priceBuffer: Map<string, { yesPrice: number; noPrice: number; timestamp: number }> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient, redis: Redis, io: SocketIOServer) {
    super();
    this.prisma = prisma;
    this.redis = redis;
    this.io = io;
  }

  /**
   * Start the real-time price service
   */
  async start(): Promise<void> {
    console.log('Starting real-time price service...');

    // Build token lookup first
    await this.buildTokenLookup();

    // Try to connect to Polymarket WebSocket
    try {
      await polymarketWsClient.connect();
      console.log('✓ Connected to Polymarket WebSocket');
      this.setupEventHandlers();
      await this.subscribeToActiveMarkets();
    } catch (error) {
      console.warn('⚠ Could not connect to Polymarket WebSocket:', error);
      console.log('  Falling back to polling-only mode');
    }

    // Start database flush interval (batch writes every 5 seconds)
    this.flushInterval = setInterval(() => this.flushPriceBuffer(), 5000);

    console.log('Real-time price service started');
  }

  /**
   * Set up event handlers for Polymarket WebSocket
   */
  private setupEventHandlers(): void {
    // Handle price updates
    polymarketWsClient.on('priceUpdate', (update: PriceUpdate) => {
      this.handlePriceUpdate(update);
    });

    // Handle order book updates
    polymarketWsClient.on('orderBookUpdate', (update: OrderBookUpdate) => {
      this.handleOrderBookUpdate(update);
    });

    // Handle disconnection
    polymarketWsClient.on('disconnected', () => {
      console.warn('Polymarket WebSocket disconnected');
      this.emit('disconnected');
    });
  }

  /**
   * Handle incoming price update from Polymarket
   */
  private async handlePriceUpdate(update: PriceUpdate): Promise<void> {
    const { tokenId, price } = update;

    // Look up which market this token belongs to
    const tokenInfo = this.tokenLookup.get(tokenId);
    if (!tokenInfo) return;

    const { marketId, isYes } = tokenInfo;

    // Calculate prices
    const yesPrice = isYes ? price : 1 - price;
    const noPrice = 1 - yesPrice;
    const yourYesPrice = yesPrice * (1 - SPREAD);
    const yourNoPrice = noPrice * (1 - SPREAD);

    const priceData = {
      yesPrice,
      noPrice,
      yourYesPrice,
      yourNoPrice,
      polymarketYesPrice: yesPrice,
      polymarketNoPrice: noPrice,
      timestamp: Date.now(),
    };

    // Update Redis cache (instant)
    await this.redis.setex(`price:${marketId}`, 10, JSON.stringify(priceData));

    // Buffer for database (batched writes)
    this.priceBuffer.set(marketId, { yesPrice, noPrice, timestamp: Date.now() });

    // Broadcast to connected clients
    this.io.to(`market:${marketId}`).emit('price_update', {
      marketId,
      ...priceData,
    });
  }

  /**
   * Handle order book update
   */
  private async handleOrderBookUpdate(update: OrderBookUpdate): Promise<void> {
    const { tokenId, bids, asks } = update;

    const tokenInfo = this.tokenLookup.get(tokenId);
    if (!tokenInfo) return;

    const { marketId, isYes } = tokenInfo;

    // Calculate mid price from order book
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 1;
    const midPrice = (bestBid + bestAsk) / 2;
    const yourPrice = midPrice * (1 - SPREAD);

    // Cache order book
    const bookData = {
      bids: bids.slice(0, 10), // Top 10 levels
      asks: asks.slice(0, 10),
      midPrice,
      yourPrice,
      spread: bestAsk - bestBid,
      timestamp: Date.now(),
    };

    await this.redis.setex(
      `orderbook:${marketId}:${isYes ? 'yes' : 'no'}`,
      5,
      JSON.stringify(bookData)
    );

    // Broadcast to clients
    this.io.to(`market:${marketId}`).emit('orderbook_update', {
      marketId,
      side: isYes ? 'YES' : 'NO',
      ...bookData,
    });
  }

  /**
   * Flush price buffer to database (batched writes)
   */
  private async flushPriceBuffer(): Promise<void> {
    if (this.priceBuffer.size === 0) return;

    const updates = Array.from(this.priceBuffer.entries());
    this.priceBuffer.clear();

    // Batch update database
    for (const [marketId, prices] of updates) {
      try {
        await this.prisma.market.update({
          where: { id: marketId },
          data: {
            yesPrice: prices.yesPrice,
            noPrice: prices.noPrice,
            yourYesPrice: prices.yesPrice * (1 - SPREAD),
            yourNoPrice: prices.noPrice * (1 - SPREAD),
          },
        });

        // Also add to price history (for charts)
        await this.prisma.priceHistory.create({
          data: {
            marketId,
            yesPrice: prices.yesPrice,
            noPrice: prices.noPrice,
          },
        });
      } catch (error) {
        // Ignore individual errors, continue with others
      }
    }
  }

  /**
   * Build token ID → market ID lookup table
   */
  private async buildTokenLookup(): Promise<void> {
    const markets = await this.prisma.market.findMany({
      where: { active: true },
      select: {
        id: true,
        polymarketTokenIdYes: true,
        polymarketTokenIdNo: true,
      },
    });

    this.tokenLookup.clear();
    for (const market of markets) {
      this.tokenLookup.set(market.polymarketTokenIdYes, { marketId: market.id, isYes: true });
      this.tokenLookup.set(market.polymarketTokenIdNo, { marketId: market.id, isYes: false });
    }

    console.log(`Built token lookup for ${markets.length} markets`);
  }

  /**
   * Subscribe to all active markets on Polymarket WebSocket
   */
  private async subscribeToActiveMarkets(): Promise<void> {
    const markets = await this.prisma.market.findMany({
      where: { active: true, closed: false },
      select: {
        id: true,
        polymarketTokenIdYes: true,
        polymarketTokenIdNo: true,
      },
    });

    for (const market of markets) {
      polymarketWsClient.subscribeToOrderBook(market.polymarketTokenIdYes);
      polymarketWsClient.subscribeToOrderBook(market.polymarketTokenIdNo);
      polymarketWsClient.subscribeToPriceUpdates(market.polymarketTokenIdYes);
      this.subscribedMarkets.add(market.id);
    }

    console.log(`Subscribed to ${markets.length} markets for real-time updates`);
  }

  /**
   * Get current price from cache (fast path)
   */
  async getPrice(marketId: string): Promise<{
    yesPrice: number;
    noPrice: number;
    yourYesPrice: number;
    yourNoPrice: number;
  } | null> {
    // Try Redis first
    const cached = await this.redis.get(`price:${marketId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fall back to database
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
      select: { yesPrice: true, noPrice: true, yourYesPrice: true, yourNoPrice: true },
    });

    if (!market) return null;

    const result = {
      yesPrice: Number(market.yesPrice),
      noPrice: Number(market.noPrice),
      yourYesPrice: Number(market.yourYesPrice),
      yourNoPrice: Number(market.yourNoPrice),
    };

    // Cache it
    await this.redis.setex(`price:${marketId}`, 10, JSON.stringify(result));

    return result;
  }

  /**
   * Get order book from cache
   */
  async getOrderBook(marketId: string, side: 'yes' | 'no'): Promise<{
    bids: Array<{ price: number; size: number }>;
    asks: Array<{ price: number; size: number }>;
    midPrice: number;
    yourPrice: number;
  } | null> {
    const cached = await this.redis.get(`orderbook:${marketId}:${side}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  /**
   * Subscribe a new market (when discovered by incremental sync)
   */
  async subscribeToMarket(marketId: string): Promise<void> {
    if (this.subscribedMarkets.has(marketId)) return;

    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
      select: {
        polymarketTokenIdYes: true,
        polymarketTokenIdNo: true,
      },
    });

    if (market) {
      this.tokenLookup.set(market.polymarketTokenIdYes, { marketId, isYes: true });
      this.tokenLookup.set(market.polymarketTokenIdNo, { marketId, isYes: false });
      polymarketWsClient.subscribeToOrderBook(market.polymarketTokenIdYes);
      polymarketWsClient.subscribeToOrderBook(market.polymarketTokenIdNo);
      this.subscribedMarkets.add(marketId);
    }
  }

  /**
   * Stop the service
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    polymarketWsClient.disconnect();
    this.subscribedMarkets.clear();
    this.tokenLookup.clear();
    this.priceBuffer.clear();
    console.log('Real-time price service stopped');
  }
}
