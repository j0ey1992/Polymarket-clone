import { Router, Request, Response } from 'express';
import { MarketSyncService } from '../../services/MarketSyncService';
import { clobClient } from '../../polymarket/ClobClient';
import { ApiResponse, PaginatedResponse, Market } from '../../types';

export function createMarketRoutes(marketSyncService: MarketSyncService): Router {
  const router = Router();

  /**
   * GET /api/markets
   * Get all markets with optional filters
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { active, limit, offset, orderBy } = req.query;

      const markets = await marketSyncService.getMarkets({
        active: active === 'true' ? true : active === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
        orderBy: orderBy as 'volume' | 'createdAt' | 'endDate' | undefined,
      });

      const response: ApiResponse<PaginatedResponse<Market>> = {
        success: true,
        data: {
          data: markets,
          total: markets.length,
          page: offset ? Math.floor(parseInt(offset as string, 10) / (parseInt(limit as string, 10) || 100)) : 0,
          limit: limit ? parseInt(limit as string, 10) : 100,
          hasMore: false,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching markets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch markets',
      });
    }
  });

  /**
   * GET /api/markets/:id
   * Get a single market by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const market = await marketSyncService.getMarket(id);

      if (!market) {
        return res.status(404).json({
          success: false,
          error: 'Market not found',
        });
      }

      // Get current price
      const price = await marketSyncService.getCurrentPrice(id);

      const response: ApiResponse<Market & { currentPrice?: { yes: number; no: number } }> = {
        success: true,
        data: {
          ...market,
          currentPrice: price ? { yes: price.yesPrice, no: price.noPrice } : undefined,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching market:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch market',
      });
    }
  });

  /**
   * GET /api/markets/:id/orderbook
   * Get the order book for a market
   */
  router.get('/:id/orderbook', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const market = await marketSyncService.getMarket(id);

      if (!market) {
        return res.status(404).json({
          success: false,
          error: 'Market not found',
        });
      }

      // Fetch order books for both YES and NO tokens
      const [yesOrderBook, noOrderBook] = await Promise.all([
        clobClient.getOrderBook(market.polymarketTokenIdYes),
        clobClient.getOrderBook(market.polymarketTokenIdNo),
      ]);

      res.json({
        success: true,
        data: {
          yes: yesOrderBook,
          no: noOrderBook,
        },
      });
    } catch (error) {
      console.error('Error fetching order book:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch order book',
      });
    }
  });

  /**
   * GET /api/markets/:id/price-history
   * Get price history for a market
   */
  router.get('/:id/price-history', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit } = req.query;

      const history = await marketSyncService.getPriceHistory(
        id,
        limit ? parseInt(limit as string, 10) : 100
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error('Error fetching price history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch price history',
      });
    }
  });

  /**
   * POST /api/markets/sync
   * Trigger a manual market sync (admin only)
   */
  router.post('/sync', async (req: Request, res: Response) => {
    try {
      await marketSyncService.syncMarkets();

      res.json({
        success: true,
        message: 'Market sync triggered',
      });
    } catch (error) {
      console.error('Error syncing markets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync markets',
      });
    }
  });

  return router;
}
