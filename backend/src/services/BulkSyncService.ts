import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { config } from '../config';

const SPREAD = 0.05; // 5% spread

// Rate limit configuration (conservative - well under Polymarket limits)
const RATE_LIMITS = {
  events: { requests: 20, perSeconds: 10 },    // Limit: 300/10s
  markets: { requests: 20, perSeconds: 10 },   // Limit: 300/10s
  book: { requests: 100, perSeconds: 10 },     // Limit: 1500/10s
};

interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  closed: boolean;
  featured: boolean;
  markets: PolymarketMarket[];
}

interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  description?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  closed: boolean;
  volume?: string;
  liquidity?: string;
  outcomePrices?: string;
  resolutionSource?: string;
  tokens?: Array<{ token_id: string; outcome: string }>;
}

interface SyncStats {
  eventsTotal: number;
  eventsSynced: number;
  marketsTotal: number;
  marketsSynced: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

/**
 * Bulk sync service for fetching all Polymarket data
 * Handles rate limiting, retries, and incremental updates
 */
export class BulkSyncService extends EventEmitter {
  private prisma: PrismaClient;
  private redis: Redis;
  private gamma: AxiosInstance;
  private clob: AxiosInstance;
  private stats: SyncStats;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(prisma: PrismaClient, redis: Redis) {
    super();
    this.prisma = prisma;
    this.redis = redis;

    this.gamma = axios.create({
      baseURL: config.polymarket.gammaBaseUrl,
      timeout: 30000,
    });

    this.clob = axios.create({
      baseURL: config.polymarket.clobBaseUrl,
      timeout: 30000,
    });

    this.stats = this.initStats();
  }

  private initStats(): SyncStats {
    return {
      eventsTotal: 0,
      eventsSynced: 0,
      marketsTotal: 0,
      marketsSynced: 0,
      errors: 0,
      startTime: new Date(),
    };
  }

  /**
   * Rate limiter - waits if we're approaching limits
   */
  private async rateLimit(endpoint: 'events' | 'markets' | 'book'): Promise<void> {
    const limit = RATE_LIMITS[endpoint];
    const now = Date.now();
    const key = endpoint;

    let state = this.requestCounts.get(key);
    if (!state || now > state.resetTime) {
      state = { count: 0, resetTime: now + (limit.perSeconds * 1000) };
      this.requestCounts.set(key, state);
    }

    if (state.count >= limit.requests) {
      const waitTime = state.resetTime - now;
      console.log(`Rate limit reached for ${endpoint}, waiting ${waitTime}ms...`);
      await this.sleep(waitTime);
      state = { count: 0, resetTime: Date.now() + (limit.perSeconds * 1000) };
      this.requestCounts.set(key, state);
    }

    state.count++;
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * MAIN: Full initial sync of all Polymarket data
   */
  async fullSync(): Promise<SyncStats> {
    this.stats = this.initStats();
    console.log('═══════════════════════════════════════════');
    console.log('  STARTING FULL POLYMARKET SYNC');
    console.log('═══════════════════════════════════════════');

    try {
      // Step 1: Seed categories
      await this.seedCategories();

      // Step 2: Fetch all events (paginated)
      const events = await this.fetchAllEvents();
      this.stats.eventsTotal = events.length;
      console.log(`Found ${events.length} events to sync`);

      // Step 3: Process each event and its markets
      for (const event of events) {
        try {
          await this.syncEvent(event);
          this.stats.eventsSynced++;
          this.emit('progress', { ...this.stats });
        } catch (error) {
          console.error(`Error syncing event ${event.id}:`, error);
          this.stats.errors++;
        }
      }

      // Step 4: Fetch prices for all markets
      await this.updateAllPrices();

      // Step 5: Update category counts
      await this.updateCategoryCounts();

      this.stats.endTime = new Date();
      const duration = (this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000;

      console.log('═══════════════════════════════════════════');
      console.log('  SYNC COMPLETE');
      console.log(`  Events: ${this.stats.eventsSynced}/${this.stats.eventsTotal}`);
      console.log(`  Markets: ${this.stats.marketsSynced}/${this.stats.marketsTotal}`);
      console.log(`  Errors: ${this.stats.errors}`);
      console.log(`  Duration: ${duration.toFixed(1)}s`);
      console.log('═══════════════════════════════════════════');

      this.emit('complete', this.stats);
      return this.stats;

    } catch (error) {
      console.error('Full sync failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Fetch all events with pagination
   */
  private async fetchAllEvents(): Promise<PolymarketEvent[]> {
    const allEvents: PolymarketEvent[] = [];
    let offset = 0;
    const limit = 50; // Polymarket page size

    console.log('Fetching all events from Polymarket...');

    while (true) {
      await this.rateLimit('events');

      const response = await this.withRetry(() =>
        this.gamma.get('/events', {
          params: {
            limit,
            offset,
            active: true,
            closed: false,
          },
        })
      );

      const events = response.data as PolymarketEvent[];
      if (events.length === 0) break;

      allEvents.push(...events);
      console.log(`  Fetched ${allEvents.length} events...`);

      if (events.length < limit) break;
      offset += limit;
    }

    // Also fetch closed/resolved events for history
    offset = 0;
    console.log('Fetching closed events...');

    while (true) {
      await this.rateLimit('events');

      const response = await this.withRetry(() =>
        this.gamma.get('/events', {
          params: {
            limit,
            offset,
            closed: true,
          },
        })
      );

      const events = response.data as PolymarketEvent[];
      if (events.length === 0) break;

      // Only add if not already present
      for (const event of events) {
        if (!allEvents.find(e => e.id === event.id)) {
          allEvents.push(event);
        }
      }

      if (events.length < limit) break;
      offset += limit;

      // Limit historical data
      if (offset > 500) break;
    }

    return allEvents;
  }

  /**
   * Sync a single event and all its markets
   */
  private async syncEvent(polyEvent: PolymarketEvent): Promise<void> {
    const categorySlug = this.detectCategory(polyEvent);
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    // Upsert the event
    const event = await this.prisma.event.upsert({
      where: { polymarketId: polyEvent.id },
      create: {
        polymarketId: polyEvent.id,
        slug: polyEvent.slug || polyEvent.id,
        title: polyEvent.title,
        description: polyEvent.description,
        image: polyEvent.image,
        categoryId: category?.id,
        startDate: polyEvent.startDate ? new Date(polyEvent.startDate) : null,
        endDate: polyEvent.endDate ? new Date(polyEvent.endDate) : null,
        active: polyEvent.active,
        featured: polyEvent.featured,
      },
      update: {
        title: polyEvent.title,
        description: polyEvent.description,
        image: polyEvent.image,
        active: polyEvent.active,
        featured: polyEvent.featured,
        categoryId: category?.id,
      },
    });

    // Count markets for this event
    this.stats.marketsTotal += (polyEvent.markets || []).length;

    // Sync each market
    for (const polyMarket of polyEvent.markets || []) {
      try {
        await this.syncMarket(polyMarket, event.id, category?.id);
        this.stats.marketsSynced++;
      } catch (error) {
        console.error(`Error syncing market ${polyMarket.id}:`, error);
        this.stats.errors++;
      }
    }

    // Update event stats
    await this.prisma.event.update({
      where: { id: event.id },
      data: {
        marketCount: (polyEvent.markets || []).length,
        totalVolume: (polyEvent.markets || []).reduce(
          (sum, m) => sum + parseFloat(m.volume || '0'),
          0
        ),
      },
    });
  }

  /**
   * Sync a single market
   */
  private async syncMarket(
    polyMarket: PolymarketMarket,
    eventId?: string,
    categoryId?: string
  ): Promise<void> {
    const tokens = polyMarket.tokens || [];
    const yesToken = tokens.find(t => t.outcome === 'Yes');
    const noToken = tokens.find(t => t.outcome === 'No');

    if (!yesToken || !noToken) {
      console.warn(`Market ${polyMarket.id} missing tokens, skipping`);
      return;
    }

    // Parse prices from Polymarket
    let yesPrice = 0.5;
    let noPrice = 0.5;

    try {
      const prices = JSON.parse(polyMarket.outcomePrices || '[0.5, 0.5]');
      yesPrice = parseFloat(prices[0]) || 0.5;
      noPrice = parseFloat(prices[1]) || 0.5;
    } catch {
      // Use defaults
    }

    // Calculate YOUR prices (5% worse for users)
    const yourYesPrice = yesPrice * (1 - SPREAD);
    const yourNoPrice = noPrice * (1 - SPREAD);

    await this.prisma.market.upsert({
      where: { polymarketConditionId: polyMarket.conditionId },
      create: {
        polymarketConditionId: polyMarket.conditionId,
        polymarketTokenIdYes: yesToken.token_id,
        polymarketTokenIdNo: noToken.token_id,
        eventId,
        categoryId,
        question: polyMarket.question,
        description: polyMarket.description,
        image: polyMarket.image,
        slug: polyMarket.slug,
        startDate: polyMarket.startDate ? new Date(polyMarket.startDate) : null,
        endDate: polyMarket.endDate ? new Date(polyMarket.endDate) : null,
        active: polyMarket.active,
        closed: polyMarket.closed,
        resolved: false,
        yesPrice,
        noPrice,
        yourYesPrice,
        yourNoPrice,
        totalVolume: parseFloat(polyMarket.volume || '0'),
        liquidity: parseFloat(polyMarket.liquidity || '0'),
        resolutionSource: polyMarket.resolutionSource,
        tags: this.extractTags(polyMarket.question),
      },
      update: {
        eventId,
        categoryId,
        question: polyMarket.question,
        description: polyMarket.description,
        image: polyMarket.image,
        active: polyMarket.active,
        closed: polyMarket.closed,
        yesPrice,
        noPrice,
        yourYesPrice,
        yourNoPrice,
        totalVolume: parseFloat(polyMarket.volume || '0'),
        liquidity: parseFloat(polyMarket.liquidity || '0'),
      },
    });

    // Cache in Redis for fast access
    await this.redis.setex(
      `market:${polyMarket.conditionId}`,
      300, // 5 min TTL
      JSON.stringify({
        yesPrice,
        noPrice,
        yourYesPrice,
        yourNoPrice,
        volume: polyMarket.volume,
      })
    );
  }

  /**
   * Update live prices from CLOB order books
   */
  private async updateAllPrices(): Promise<void> {
    console.log('Updating live prices from CLOB...');

    const markets = await this.prisma.market.findMany({
      where: { active: true, closed: false },
      select: {
        id: true,
        polymarketTokenIdYes: true,
        polymarketTokenIdNo: true,
      },
    });

    let updated = 0;
    for (const market of markets) {
      try {
        await this.rateLimit('book');

        const bookResponse = await this.withRetry(() =>
          this.clob.get('/book', {
            params: { token_id: market.polymarketTokenIdYes },
          })
        );

        const book = bookResponse.data;
        const bestBid = book.bids?.[0] ? parseFloat(book.bids[0].price) : 0;
        const bestAsk = book.asks?.[0] ? parseFloat(book.asks[0].price) : 1;
        const yesPrice = (bestBid + bestAsk) / 2;
        const noPrice = 1 - yesPrice;

        await this.prisma.market.update({
          where: { id: market.id },
          data: {
            yesPrice,
            noPrice,
            yourYesPrice: yesPrice * (1 - SPREAD),
            yourNoPrice: noPrice * (1 - SPREAD),
          },
        });

        updated++;
        if (updated % 50 === 0) {
          console.log(`  Updated ${updated}/${markets.length} prices...`);
        }
      } catch (error) {
        // Non-critical, continue
      }
    }

    console.log(`Updated ${updated} market prices`);
  }

  /**
   * Seed categories
   */
  private async seedCategories(): Promise<void> {
    const categories = [
      { slug: 'politics', name: 'Politics', icon: '🏛️' },
      { slug: 'sports', name: 'Sports', icon: '⚽' },
      { slug: 'crypto', name: 'Crypto', icon: '₿' },
      { slug: 'pop-culture', name: 'Pop Culture', icon: '🎬' },
      { slug: 'business', name: 'Business', icon: '💼' },
      { slug: 'science', name: 'Science', icon: '🔬' },
      { slug: 'gaming', name: 'Gaming', icon: '🎮' },
      { slug: 'global', name: 'Global', icon: '🌍' },
    ];

    for (const cat of categories) {
      await this.prisma.category.upsert({
        where: { slug: cat.slug },
        create: cat,
        update: cat,
      });
    }
    console.log('Categories seeded');
  }

  /**
   * Update category market counts
   */
  private async updateCategoryCounts(): Promise<void> {
    const categories = await this.prisma.category.findMany();

    for (const category of categories) {
      const count = await this.prisma.market.count({
        where: { categoryId: category.id },
      });

      await this.prisma.category.update({
        where: { id: category.id },
        data: { marketCount: count },
      });
    }
  }

  /**
   * Detect category from event content
   */
  private detectCategory(event: PolymarketEvent): string {
    const text = `${event.title} ${event.description || ''}`.toLowerCase();

    if (text.match(/election|president|congress|senate|vote|biden|trump|politic|governor|mayor/)) {
      return 'politics';
    }
    if (text.match(/bitcoin|ethereum|crypto|token|defi|nft|blockchain|coin/)) {
      return 'crypto';
    }
    if (text.match(/nfl|nba|mlb|nhl|soccer|football|championship|super bowl|world cup|game|match|sport/)) {
      return 'sports';
    }
    if (text.match(/movie|oscar|grammy|emmy|celebrity|album|tv show|netflix|film|actor|music/)) {
      return 'pop-culture';
    }
    if (text.match(/stock|company|ipo|earnings|market|fed|interest rate|gdp|inflation|economy/)) {
      return 'business';
    }
    if (text.match(/space|nasa|climate|research|study|scientist|discovery|ai|artificial/)) {
      return 'science';
    }
    if (text.match(/esports|gaming|twitch|streamer|game|xbox|playstation|nintendo/)) {
      return 'gaming';
    }

    return 'global';
  }

  /**
   * Extract searchable tags
   */
  private extractTags(question: string): string[] {
    const stopWords = new Set(['will', 'the', 'be', 'to', 'in', 'a', 'an', 'of', 'for', 'on', 'by', 'at', 'or', 'and', 'is', 'it', 'this', 'that', 'with']);
    return question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
