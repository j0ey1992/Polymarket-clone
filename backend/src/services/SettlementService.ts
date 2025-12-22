import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { gammaClient } from '../polymarket/GammaClient';
import { PositionManagerService } from './PositionManagerService';
import { SettlementResult, UserPayout } from '../types';

/**
 * Service responsible for handling market resolution and settlement
 */
export class SettlementService extends EventEmitter {
  private prisma: PrismaClient;
  private positionManager: PositionManagerService;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient, positionManager: PositionManagerService) {
    super();
    this.prisma = prisma;
    this.positionManager = positionManager;
  }

  /**
   * Start the settlement monitoring service
   */
  start(): void {
    console.log('Starting settlement service...');

    // Check for resolved markets every minute
    this.checkInterval = setInterval(async () => {
      await this.checkForResolutions();
    }, 60000);

    console.log('Settlement service started');
  }

  /**
   * Stop the settlement service
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('Settlement service stopped');
  }

  /**
   * Check for resolved markets on Polymarket
   */
  async checkForResolutions(): Promise<void> {
    const unresolvedMarkets = await this.prisma.market.findMany({
      where: { resolved: false },
    });

    for (const market of unresolvedMarkets) {
      try {
        const resolution = await gammaClient.isMarketResolved(market.polymarketConditionId);

        if (resolution.resolved && resolution.outcome) {
          console.log(
            `Market resolved: ${market.question.substring(0, 50)}... -> ${resolution.outcome}`
          );
          await this.settleMarket(market.id, resolution.outcome as 'YES' | 'NO');
        }
      } catch (error) {
        console.error(`Error checking resolution for market ${market.id}:`, error);
      }
    }
  }

  /**
   * Settle a market and calculate payouts
   */
  async settleMarket(
    marketId: string,
    outcome: 'YES' | 'NO' | 'INVALID'
  ): Promise<SettlementResult> {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
    });

    if (!market) {
      throw new Error('Market not found');
    }

    if (market.resolved) {
      throw new Error('Market is already resolved');
    }

    // Get all positions for this market
    const positions = await this.positionManager.getPositionsForSettlement(marketId);

    // Calculate payouts
    const userPayouts: UserPayout[] = [];
    let totalPayout = 0;

    if (outcome === 'INVALID') {
      // Refund all positions at their average entry price
      for (const position of positions) {
        const positionData = await this.prisma.position.findFirst({
          where: {
            userId: position.userId,
            marketId,
            side: position.side,
          },
        });

        if (positionData) {
          const refundAmount = Number(positionData.size) * Number(positionData.avgPrice);
          userPayouts.push({
            userId: position.userId,
            amount: refundAmount,
            positionSize: position.size,
          });
          totalPayout += refundAmount;
        }
      }
    } else {
      // Pay out winning positions at $1 per share
      const winningSide = outcome;

      for (const position of positions) {
        if (position.side === winningSide) {
          const payoutAmount = position.size; // Each winning share pays $1
          userPayouts.push({
            userId: position.userId,
            amount: payoutAmount,
            positionSize: position.size,
          });
          totalPayout += payoutAmount;
        }
        // Losing positions get nothing
      }
    }

    // Update market status
    await this.prisma.market.update({
      where: { id: marketId },
      data: {
        resolved: true,
        outcome,
      },
    });

    // Record payouts (in a real implementation, this would trigger Cronos contract calls)
    await this.recordPayouts(marketId, userPayouts);

    // Clear positions
    await this.positionManager.clearMarketPositions(marketId);

    const result: SettlementResult = {
      marketId,
      outcome,
      totalPayout,
      userPayouts,
    };

    this.emit('marketSettled', result);

    return result;
  }

  /**
   * Record payouts in the database
   */
  private async recordPayouts(marketId: string, payouts: UserPayout[]): Promise<void> {
    // In a production system, this would:
    // 1. Queue payouts for processing
    // 2. Call the Cronos smart contract to release funds
    // 3. Record the transaction hashes

    // For now, just log the payouts
    for (const payout of payouts) {
      console.log(
        `Payout for user ${payout.userId}: $${payout.amount.toFixed(2)} ` +
          `(${payout.positionSize} shares)`
      );
    }
  }

  /**
   * Manually trigger settlement for a market
   */
  async manualSettle(
    marketId: string,
    outcome: 'YES' | 'NO' | 'INVALID'
  ): Promise<SettlementResult> {
    console.log(`Manual settlement triggered for market ${marketId} with outcome ${outcome}`);
    return this.settleMarket(marketId, outcome);
  }

  /**
   * Get settlement history
   */
  async getSettlementHistory(): Promise<
    Array<{
      marketId: string;
      question: string;
      outcome: string;
      settledAt: Date;
    }>
  > {
    const resolvedMarkets = await this.prisma.market.findMany({
      where: { resolved: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return resolvedMarkets.map((m) => ({
      marketId: m.id,
      question: m.question,
      outcome: m.outcome || 'UNKNOWN',
      settledAt: m.updatedAt,
    }));
  }

  /**
   * Get pending payouts for a user
   */
  async getUserPendingPayouts(
    userId: string
  ): Promise<
    Array<{
      marketId: string;
      outcome: string;
      amount: number;
      claimed: boolean;
    }>
  > {
    // In a production system, this would query a payouts table
    // For now, return empty array as payouts are instant
    return [];
  }

  /**
   * Calculate expected payout for a position if market resolves to a given outcome
   */
  async calculateExpectedPayout(
    userId: string,
    marketId: string,
    outcome: 'YES' | 'NO'
  ): Promise<number> {
    const position = await this.prisma.position.findFirst({
      where: {
        userId,
        marketId,
        side: outcome,
      },
    });

    if (!position) {
      return 0;
    }

    // Winning positions pay $1 per share
    return Number(position.size);
  }

  /**
   * Get total unrealized payouts across all resolved markets
   */
  async getTotalUnclaimedPayouts(): Promise<number> {
    // In a production system with delayed claims
    return 0;
  }
}
