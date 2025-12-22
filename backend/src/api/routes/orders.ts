import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { OrderRouterService } from '../../services/OrderRouterService';
import { spreadCalculator } from '../../services/SpreadCalculatorService';
import { ApiResponse, Order } from '../../types';

// Validation schemas
const placeOrderSchema = z.object({
  userId: z.string().uuid(),
  marketId: z.string().uuid(),
  side: z.enum(['BUY', 'SELL']),
  outcome: z.enum(['YES', 'NO']),
  size: z.number().positive(),
});

const getQuoteSchema = z.object({
  marketId: z.string().uuid(),
  side: z.enum(['BUY', 'SELL']),
  outcome: z.enum(['YES', 'NO']),
  size: z.number().positive(),
});

export function createOrderRoutes(orderRouter: OrderRouterService): Router {
  const router = Router();

  /**
   * POST /api/orders
   * Place a new order
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const validation = placeOrderSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.errors.map((e) => e.message).join(', '),
        });
      }

      const order = await orderRouter.placeOrder(validation.data);

      const response: ApiResponse<Order> = {
        success: true,
        data: order,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error placing order:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to place order',
      });
    }
  });

  /**
   * GET /api/orders/:id
   * Get order by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await orderRouter.getOrder(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch order',
      });
    }
  });

  /**
   * DELETE /api/orders/:id
   * Cancel an order
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await orderRouter.cancelOrder(id);

      res.json({
        success: true,
        message: 'Order cancelled',
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel order',
      });
    }
  });

  /**
   * GET /api/orders/user/:userId
   * Get orders for a user
   */
  router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { status, limit } = req.query;

      const orders = await orderRouter.getUserOrders(userId, {
        status: status as 'PENDING' | 'FILLED' | 'CANCELLED' | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
      });
    }
  });

  /**
   * POST /api/orders/quote
   * Get a price quote for an order (includes spread)
   */
  router.post('/quote', async (req: Request, res: Response) => {
    try {
      const validation = getQuoteSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.errors.map((e) => e.message).join(', '),
        });
      }

      const { size, side } = validation.data;

      // For now, use a mock market price
      // In production, this would fetch from the market sync service
      const mockMarketPrice = 0.55;

      let quote;
      if (side === 'BUY') {
        quote = spreadCalculator.calculateBuyCost(size, mockMarketPrice);
      } else {
        quote = spreadCalculator.calculateSellProceeds(size, mockMarketPrice);
      }

      res.json({
        success: true,
        data: {
          side,
          size,
          marketPrice: mockMarketPrice,
          ...quote,
        },
      });
    } catch (error) {
      console.error('Error getting quote:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get quote',
      });
    }
  });

  /**
   * GET /api/orders/spread/config
   * Get current spread configuration
   */
  router.get('/spread/config', async (_req: Request, res: Response) => {
    try {
      const config = spreadCalculator.getConfig();

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      console.error('Error fetching spread config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch spread config',
      });
    }
  });

  /**
   * GET /api/orders/profits
   * Get total spread profits (admin only)
   */
  router.get('/profits', async (_req: Request, res: Response) => {
    try {
      const profits = await orderRouter.getTotalSpreadProfits();

      res.json({
        success: true,
        data: {
          totalProfits: profits,
        },
      });
    } catch (error) {
      console.error('Error fetching profits:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profits',
      });
    }
  });

  return router;
}
