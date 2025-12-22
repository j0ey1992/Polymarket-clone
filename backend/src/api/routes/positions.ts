import { Router, Request, Response } from 'express';
import { PositionManagerService } from '../../services/PositionManagerService';
import { ApiResponse, Position } from '../../types';

export function createPositionRoutes(positionManager: PositionManagerService): Router {
  const router = Router();

  /**
   * GET /api/positions/user/:userId
   * Get all positions for a user
   */
  router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const positions = await positionManager.getUserPositions(userId);

      const response: ApiResponse<Position[]> = {
        success: true,
        data: positions,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching user positions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch positions',
      });
    }
  });

  /**
   * GET /api/positions/user/:userId/summary
   * Get portfolio summary for a user
   */
  router.get('/user/:userId/summary', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const summary = await positionManager.getPortfolioSummary(userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolio summary',
      });
    }
  });

  /**
   * GET /api/positions/market/:marketId
   * Get all positions for a market
   */
  router.get('/market/:marketId', async (req: Request, res: Response) => {
    try {
      const { marketId } = req.params;
      const positions = await positionManager.getMarketPositions(marketId);

      res.json({
        success: true,
        data: positions,
      });
    } catch (error) {
      console.error('Error fetching market positions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch market positions',
      });
    }
  });

  /**
   * GET /api/positions/:userId/:marketId/:side
   * Get a specific position
   */
  router.get('/:userId/:marketId/:side', async (req: Request, res: Response) => {
    try {
      const { userId, marketId, side } = req.params;

      if (side !== 'YES' && side !== 'NO') {
        return res.status(400).json({
          success: false,
          error: 'Side must be YES or NO',
        });
      }

      const position = await positionManager.getPosition(userId, marketId, side);

      if (!position) {
        return res.status(404).json({
          success: false,
          error: 'Position not found',
        });
      }

      res.json({
        success: true,
        data: position,
      });
    } catch (error) {
      console.error('Error fetching position:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch position',
      });
    }
  });

  /**
   * GET /api/positions/:userId/:marketId/:side/exit-value
   * Calculate potential exit value for a position
   */
  router.get('/:userId/:marketId/:side/exit-value', async (req: Request, res: Response) => {
    try {
      const { userId, marketId, side } = req.params;

      if (side !== 'YES' && side !== 'NO') {
        return res.status(400).json({
          success: false,
          error: 'Side must be YES or NO',
        });
      }

      const exitValue = await positionManager.calculateExitValue(userId, marketId, side);

      if (!exitValue) {
        return res.status(404).json({
          success: false,
          error: 'Position not found',
        });
      }

      res.json({
        success: true,
        data: exitValue,
      });
    } catch (error) {
      console.error('Error calculating exit value:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate exit value',
      });
    }
  });

  /**
   * GET /api/positions/hedge
   * Get all hedge positions (admin only)
   */
  router.get('/hedge', async (_req: Request, res: Response) => {
    try {
      const hedgePositions = await positionManager.getHedgePositions();

      res.json({
        success: true,
        data: hedgePositions,
      });
    } catch (error) {
      console.error('Error fetching hedge positions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch hedge positions',
      });
    }
  });

  /**
   * GET /api/positions/hedge/exposure
   * Get total hedge exposure (admin only)
   */
  router.get('/hedge/exposure', async (_req: Request, res: Response) => {
    try {
      const exposure = await positionManager.getTotalHedgeExposure();

      res.json({
        success: true,
        data: exposure,
      });
    } catch (error) {
      console.error('Error fetching hedge exposure:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch hedge exposure',
      });
    }
  });

  return router;
}
