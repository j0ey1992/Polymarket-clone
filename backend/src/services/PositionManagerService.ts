import { PrismaClient } from '@prisma/client';
import { Position, OrderOutcome } from '../types';
import { spreadCalculator } from './SpreadCalculatorService';

/**
 * Service responsible for managing user positions
 * and calculating portfolio values
 */
export class PositionManagerService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get all positions for a user
   */
  async getUserPositions(userId: string): Promise<Position[]> {
    const positions = await this.prisma.position.findMany({
      where: { userId },
      include: { market: true },
    });

    const positionsWithValue = await Promise.all(
      positions.map(async (p) => {
        const currentPrice = await this.getCurrentPrice(p.marketId, p.side as OrderOutcome);
        const currentValue = Number(p.size) * currentPrice;
        const costBasis = Number(p.size) * Number(p.avgPrice);
        const pnl = currentValue - costBasis;

        return {
          id: p.id,
          userId: p.userId,
          marketId: p.marketId,
          side: p.side as OrderOutcome,
          size: Number(p.size),
          avgPrice: Number(p.avgPrice),
          currentValue,
          pnl,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      })
    );

    return positionsWithValue;
  }

  /**
   * Get a specific position
   */
  async getPosition(
    userId: string,
    marketId: string,
    side: OrderOutcome
  ): Promise<Position | null> {
    const position = await this.prisma.position.findUnique({
      where: {
        userId_marketId_side: {
          userId,
          marketId,
          side,
        },
      },
    });

    if (!position) {
      return null;
    }

    const currentPrice = await this.getCurrentPrice(marketId, side);
    const currentValue = Number(position.size) * currentPrice;
    const costBasis = Number(position.size) * Number(position.avgPrice);
    const pnl = currentValue - costBasis;

    return {
      id: position.id,
      userId: position.userId,
      marketId: position.marketId,
      side: position.side as OrderOutcome,
      size: Number(position.size),
      avgPrice: Number(position.avgPrice),
      currentValue,
      pnl,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    };
  }

  /**
   * Get portfolio summary for a user
   */
  async getPortfolioSummary(userId: string): Promise<{
    totalValue: number;
    totalPnL: number;
    positionCount: number;
    positions: Position[];
  }> {
    const positions = await this.getUserPositions(userId);

    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);

    return {
      totalValue,
      totalPnL,
      positionCount: positions.length,
      positions,
    };
  }

  /**
   * Get positions for a specific market
   */
  async getMarketPositions(marketId: string): Promise<Position[]> {
    const positions = await this.prisma.position.findMany({
      where: { marketId },
    });

    const currentYesPrice = await this.getCurrentPrice(marketId, 'YES');
    const currentNoPrice = await this.getCurrentPrice(marketId, 'NO');

    return positions.map((p) => {
      const currentPrice = p.side === 'YES' ? currentYesPrice : currentNoPrice;
      const currentValue = Number(p.size) * currentPrice;
      const costBasis = Number(p.size) * Number(p.avgPrice);
      const pnl = currentValue - costBasis;

      return {
        id: p.id,
        userId: p.userId,
        marketId: p.marketId,
        side: p.side as OrderOutcome,
        size: Number(p.size),
        avgPrice: Number(p.avgPrice),
        currentValue,
        pnl,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });
  }

  /**
   * Calculate potential exit value for a position
   */
  async calculateExitValue(
    userId: string,
    marketId: string,
    side: OrderOutcome
  ): Promise<{
    grossValue: number;
    netValue: number;
    spreadCost: number;
  } | null> {
    const position = await this.getPosition(userId, marketId, side);

    if (!position) {
      return null;
    }

    const currentPrice = await this.getCurrentPrice(marketId, side);
    const grossValue = position.size * currentPrice;

    // Calculate spread cost on exit
    const sellCalc = spreadCalculator.calculateSellProceeds(position.size, currentPrice);

    return {
      grossValue,
      netValue: sellCalc.proceeds,
      spreadCost: sellCalc.platformFee,
    };
  }

  /**
   * Get current price for a market outcome
   */
  private async getCurrentPrice(marketId: string, side: OrderOutcome): Promise<number> {
    const latestPrice = await this.prisma.priceHistory.findFirst({
      where: { marketId },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestPrice) {
      return 0.5; // Default to 50/50
    }

    return side === 'YES' ? Number(latestPrice.yesPrice) : Number(latestPrice.noPrice);
  }

  /**
   * Get hedge positions (our Polymarket positions)
   */
  async getHedgePositions(): Promise<
    Array<{
      marketId: string;
      side: string;
      size: number;
      avgPrice: number;
      currentValue: number;
    }>
  > {
    const hedgePositions = await this.prisma.hedgePosition.findMany({
      include: { market: true },
    });

    return Promise.all(
      hedgePositions.map(async (h) => {
        const currentPrice = await this.getCurrentPrice(h.marketId, h.side as OrderOutcome);
        return {
          marketId: h.marketId,
          side: h.side,
          size: Number(h.size),
          avgPrice: Number(h.avgPrice),
          currentValue: Number(h.size) * currentPrice,
        };
      })
    );
  }

  /**
   * Calculate total exposure across all hedge positions
   */
  async getTotalHedgeExposure(): Promise<{
    totalYesExposure: number;
    totalNoExposure: number;
    netExposure: number;
  }> {
    const hedgePositions = await this.getHedgePositions();

    const totalYesExposure = hedgePositions
      .filter((h) => h.side === 'YES')
      .reduce((sum, h) => sum + h.currentValue, 0);

    const totalNoExposure = hedgePositions
      .filter((h) => h.side === 'NO')
      .reduce((sum, h) => sum + h.currentValue, 0);

    return {
      totalYesExposure,
      totalNoExposure,
      netExposure: totalYesExposure - totalNoExposure,
    };
  }

  /**
   * Get positions that will be affected by market resolution
   */
  async getPositionsForSettlement(
    marketId: string
  ): Promise<Array<{ userId: string; side: string; size: number }>> {
    const positions = await this.prisma.position.findMany({
      where: { marketId },
    });

    return positions.map((p) => ({
      userId: p.userId,
      side: p.side,
      size: Number(p.size),
    }));
  }

  /**
   * Delete positions for a resolved market
   */
  async clearMarketPositions(marketId: string): Promise<void> {
    await this.prisma.position.deleteMany({
      where: { marketId },
    });

    await this.prisma.hedgePosition.deleteMany({
      where: { marketId },
    });
  }
}
