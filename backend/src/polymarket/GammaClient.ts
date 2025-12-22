import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { PolymarketEvent, PolymarketMarket } from '../types';

/**
 * Client for Polymarket's Gamma API
 * Used for fetching market data, events, and metadata
 */
export class GammaClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.polymarket.gammaBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch all active events with their markets
   */
  async getEvents(params?: {
    active?: boolean;
    closed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PolymarketEvent[]> {
    const response = await this.client.get('/events', {
      params: {
        active: params?.active ?? true,
        closed: params?.closed ?? false,
        limit: params?.limit ?? 100,
        offset: params?.offset ?? 0,
      },
    });
    return response.data;
  }

  /**
   * Fetch a specific event by ID
   */
  async getEvent(eventId: string): Promise<PolymarketEvent> {
    const response = await this.client.get(`/events/${eventId}`);
    return response.data;
  }

  /**
   * Fetch all active markets
   */
  async getMarkets(params?: {
    active?: boolean;
    closed?: boolean;
    limit?: number;
    offset?: number;
    order?: string;
  }): Promise<PolymarketMarket[]> {
    const response = await this.client.get('/markets', {
      params: {
        active: params?.active ?? true,
        closed: params?.closed ?? false,
        limit: params?.limit ?? 100,
        offset: params?.offset ?? 0,
        order: params?.order ?? 'volume',
      },
    });
    return response.data;
  }

  /**
   * Fetch a specific market by ID
   */
  async getMarket(marketId: string): Promise<PolymarketMarket> {
    const response = await this.client.get(`/markets/${marketId}`);
    return response.data;
  }

  /**
   * Fetch market by condition ID
   */
  async getMarketByConditionId(conditionId: string): Promise<PolymarketMarket | null> {
    const response = await this.client.get('/markets', {
      params: {
        condition_id: conditionId,
      },
    });
    return response.data[0] || null;
  }

  /**
   * Fetch markets by slug
   */
  async getMarketBySlug(slug: string): Promise<PolymarketMarket | null> {
    const response = await this.client.get('/markets', {
      params: {
        slug,
      },
    });
    return response.data[0] || null;
  }

  /**
   * Fetch featured markets
   */
  async getFeaturedMarkets(): Promise<PolymarketMarket[]> {
    const events = await this.getEvents({ active: true, limit: 20 });
    const featuredMarkets: PolymarketMarket[] = [];

    for (const event of events) {
      if (event.featured && event.markets) {
        featuredMarkets.push(...event.markets);
      }
    }

    return featuredMarkets;
  }

  /**
   * Fetch market price data
   */
  async getMarketPrices(marketId: string): Promise<{ yes: number; no: number }> {
    const market = await this.getMarket(marketId);

    if (market.outcomePrices) {
      const prices = JSON.parse(market.outcomePrices);
      return {
        yes: parseFloat(prices[0] || '0.5'),
        no: parseFloat(prices[1] || '0.5'),
      };
    }

    return { yes: 0.5, no: 0.5 };
  }

  /**
   * Search markets by query
   */
  async searchMarkets(query: string): Promise<PolymarketMarket[]> {
    const response = await this.client.get('/markets', {
      params: {
        _q: query,
        active: true,
        limit: 50,
      },
    });
    return response.data;
  }

  /**
   * Check if market is resolved
   */
  async isMarketResolved(marketId: string): Promise<{ resolved: boolean; outcome?: string }> {
    const market = await this.getMarket(marketId);

    if (market.closed) {
      // Parse outcomes to determine winner
      const outcomes = JSON.parse(market.outcomes || '[]');
      const prices = JSON.parse(market.outcomePrices || '[]');

      // If one outcome has price 1 and other has price 0, market is resolved
      const yesPrice = parseFloat(prices[0] || '0');
      const noPrice = parseFloat(prices[1] || '0');

      if (yesPrice === 1) {
        return { resolved: true, outcome: 'YES' };
      } else if (noPrice === 1) {
        return { resolved: true, outcome: 'NO' };
      }
    }

    return { resolved: false };
  }
}

export const gammaClient = new GammaClient();
