import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { config } from '../config';

const SPREAD = 0.05;

/**
 * Incremental sync service for ongoing updates
 * Runs periodically to keep data fresh without full resync
 */
export class IncrementalSyncService {
  private prisma: PrismaClient;
  private redis: Redis;
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * Start the incremental sync service
   */
  start(intervalMs = 30000): void {
    if (this.isRunning) return;

    console.log(`Starting incremental sync (every ${intervalMs / 1000}s)...`);
    this.isRunning = true;

    // Initial sync
    this.syncPrices();

    // Set up interval
    this.syncInterval = setInterval(() => {
      this.syncPrices();
      this.checkForNewMarkets();
      this.checkResolutions();
    }, intervalMs);
  }

  /**
   * Stop the service
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('Incremental sync stopped');
  }

  /**
   * Sync prices for active markets
   */
  async syncPrices(): Promise<void> {
    try {
      // Get all active markets from Gamma API (single request)
      const response = await axios.get(`${config.polymarket.gammaBaseUrl}/markets`, {
        params: { active: true, limit: 500 },
      });

      const markets = response.data;
      let updated = 0;

      for (const polyMarket of markets) {
        try {
          const prices = JSON.parse(polyMarket.outcomePrices || '[0.5, 0.5]');
          const yesPrice = parseFloat(prices[0]) || 0.5;
          const noPrice = parseFloat(prices[1]) || 0.5;

          // Update database
          await this.prisma.market.updateMany({
            where: { polymarketConditionId: polyMarket.conditionId },
            data: {
              yesPrice,
              noPrice,
              yourYesPrice: yesPrice * (1 - SPREAD),
              yourNoPrice: noPrice * (1 - SPREAD),
              totalVolume: parseFloat(polyMarket.volume || '0'),
              liquidity: parseFloat(polyMarket.liquidity || '0'),
            },
          });

          // Update Redis cache
          await this.redis.setex(
            `price:${polyMarket.conditionId}`,
            60, // 1 min TTL
            JSON.stringify({
              yesPrice,
              noPrice,
              yourYesPrice: yesPrice * (1 - SPREAD),
              yourNoPrice: noPrice * (1 - SPREAD),
            })
          );

          updated++;
        } catch {
          // Continue on individual market error
        }
      }

      console.log(`[Sync] Updated ${updated} market prices`);
    } catch (error) {
      console.error('[Sync] Price sync error:', error);
    }
  }

  /**
   * Check for new markets that we don't have
   */
  async checkForNewMarkets(): Promise<void> {
    try {
      const response = await axios.get(`${config.polymarket.gammaBaseUrl}/events`, {
        params: { active: true, limit: 100 },
      });

      const events = response.data;
      let newMarkets = 0;

      for (const event of events) {
        for (const market of event.markets || []) {
          const exists = await this.prisma.market.findUnique({
            where: { polymarketConditionId: market.conditionId },
          });

          if (!exists) {
            // New market found - add it
            const tokens = market.tokens || [];
            const yesToken = tokens.find((t: { outcome: string }) => t.outcome === 'Yes');
            const noToken = tokens.find((t: { outcome: string }) => t.outcome === 'No');

            if (yesToken && noToken) {
              const prices = JSON.parse(market.outcomePrices || '[0.5, 0.5]');
              const yesPrice = parseFloat(prices[0]) || 0.5;
              const noPrice = parseFloat(prices[1]) || 0.5;

              await this.prisma.market.create({
                data: {
                  polymarketConditionId: market.conditionId,
                  polymarketTokenIdYes: yesToken.token_id,
                  polymarketTokenIdNo: noToken.token_id,
                  question: market.question,
                  description: market.description,
                  image: market.image,
                  slug: market.slug,
                  active: true,
                  yesPrice,
                  noPrice,
                  yourYesPrice: yesPrice * (1 - SPREAD),
                  yourNoPrice: noPrice * (1 - SPREAD),
                  totalVolume: parseFloat(market.volume || '0'),
                  liquidity: parseFloat(market.liquidity || '0'),
                  tags: [],
                },
              });
              newMarkets++;
              console.log(`[Sync] New market: ${market.question.substring(0, 50)}...`);
            }
          }
        }
      }

      if (newMarkets > 0) {
        console.log(`[Sync] Added ${newMarkets} new markets`);
      }
    } catch (error) {
      console.error('[Sync] New market check error:', error);
    }
  }

  /**
   * Check for resolved markets
   */
  async checkResolutions(): Promise<void> {
    try {
      // Get our unresolved markets
      const unresolvedMarkets = await this.prisma.market.findMany({
        where: { resolved: false, closed: false },
        select: { id: true, polymarketConditionId: true, question: true },
      });

      // Check each against Polymarket
      const response = await axios.get(`${config.polymarket.gammaBaseUrl}/markets`, {
        params: { closed: true, limit: 200 },
      });

      const closedMarkets = new Map(
        response.data.map((m: { conditionId: string; outcomePrices: string }) => [
          m.conditionId,
          m.outcomePrices,
        ])
      );

      for (const market of unresolvedMarkets) {
        const priceData = closedMarkets.get(market.polymarketConditionId);
        if (priceData) {
          try {
            const prices = JSON.parse(priceData);
            const yesPrice = parseFloat(prices[0]);

            let outcome: string | null = null;
            if (yesPrice >= 0.99) outcome = 'YES';
            else if (yesPrice <= 0.01) outcome = 'NO';

            if (outcome) {
              await this.prisma.market.update({
                where: { id: market.id },
                data: {
                  resolved: true,
                  closed: true,
                  outcome,
                  yesPrice,
                  noPrice: 1 - yesPrice,
                },
              });
              console.log(`[Sync] Market resolved: ${market.question.substring(0, 40)}... → ${outcome}`);
            }
          } catch {
            // Parse error, skip
          }
        }
      }
    } catch (error) {
      console.error('[Sync] Resolution check error:', error);
    }
  }

  /**
   * Get cached price (fast path for API)
   */
  async getCachedPrice(conditionId: string): Promise<{
    yesPrice: number;
    noPrice: number;
    yourYesPrice: number;
    yourNoPrice: number;
  } | null> {
    const cached = await this.redis.get(`price:${conditionId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }
}
