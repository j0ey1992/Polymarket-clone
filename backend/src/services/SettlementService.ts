import { PrismaClient, Prisma } from '@prisma/client';
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
  private payoutProcessingInterval: NodeJS.Timeout | null = null;

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

    // Process pending payouts every 30 seconds
    this.payoutProcessingInterval = setInterval(async () => {
      await this.processPendingPayouts();
    }, 30000);

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
    if (this.payoutProcessingInterval) {
      clearInterval(this.payoutProcessingInterval);
      this.payoutProcessingInterval = null;
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
   * Record payouts in the database and queue for processing
   */
  private async recordPayouts(marketId: string, payouts: UserPayout[]): Promise<void> {
    for (const payout of payouts) {
      // Create payout record
      await this.prisma.payout.create({
        data: {
          userId: payout.userId,
          marketId,
          amount: new Prisma.Decimal(payout.amount),
          positionSize: new Prisma.Decimal(payout.positionSize),
          status: 'PENDING',
        },
      });

      console.log(
        `Payout queued for user ${payout.userId}: $${payout.amount.toFixed(2)} ` +
          `(${payout.positionSize} shares)`
      );
    }

    // Immediately process payouts
    await this.processPendingPayouts();
  }

  /**
   * Process pending payouts - credit user balances
   */
  async processPendingPayouts(): Promise<void> {
    const pendingPayouts = await this.prisma.payout.findMany({
      where: { status: 'PENDING' },
      take: 50, // Process in batches
    });

    for (const payout of pendingPayouts) {
      try {
        // Mark as processing
        await this.prisma.payout.update({
          where: { id: payout.id },
          data: { status: 'PROCESSING' },
        });

        // Credit user's trading balance
        await this.creditUserBalance(payout.userId, Number(payout.amount));

        // Mark as completed
        await this.prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });

        console.log(`Payout completed for user ${payout.userId}: $${payout.amount}`);
        this.emit('payoutCompleted', {
          userId: payout.userId,
          amount: Number(payout.amount),
          marketId: payout.marketId,
        });
      } catch (error) {
        console.error(`Failed to process payout ${payout.id}:`, error);
        await this.prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  }

  /**
   * Credit user's trading balance
   */
  private async creditUserBalance(userId: string, amount: number): Promise<void> {
    // Upsert balance record
    await this.prisma.balance.upsert({
      where: { userId },
      create: {
        userId,
        tradingBalance: new Prisma.Decimal(amount),
        lockedBalance: new Prisma.Decimal(0),
      },
      update: {
        tradingBalance: {
          increment: new Prisma.Decimal(amount),
        },
      },
    });
  }

  /**
   * Get user's current trading balance
   */
  async getUserBalance(userId: string): Promise<{ tradingBalance: number; lockedBalance: number }> {
    const balance = await this.prisma.balance.findUnique({
      where: { userId },
    });

    return {
      tradingBalance: balance ? Number(balance.tradingBalance) : 0,
      lockedBalance: balance ? Number(balance.lockedBalance) : 0,
    };
  }

  /**
   * Lock balance for an order
   */
  async lockBalance(userId: string, amount: number): Promise<boolean> {
    const balance = await this.prisma.balance.findUnique({
      where: { userId },
    });

    if (!balance || Number(balance.tradingBalance) < amount) {
      return false;
    }

    await this.prisma.balance.update({
      where: { userId },
      data: {
        tradingBalance: { decrement: new Prisma.Decimal(amount) },
        lockedBalance: { increment: new Prisma.Decimal(amount) },
      },
    });

    return true;
  }

  /**
   * Release locked balance (order cancelled or failed)
   */
  async releaseLockedBalance(userId: string, amount: number): Promise<void> {
    await this.prisma.balance.update({
      where: { userId },
      data: {
        tradingBalance: { increment: new Prisma.Decimal(amount) },
        lockedBalance: { decrement: new Prisma.Decimal(amount) },
      },
    });
  }

  /**
   * Consume locked balance (order filled)
   */
  async consumeLockedBalance(userId: string, amount: number): Promise<void> {
    await this.prisma.balance.update({
      where: { userId },
      data: {
        lockedBalance: { decrement: new Prisma.Decimal(amount) },
      },
    });
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
      id: string;
      marketId: string;
      amount: number;
      status: string;
      createdAt: Date;
    }>
  > {
    const payouts = await this.prisma.payout.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payouts.map((p) => ({
      id: p.id,
      marketId: p.marketId,
      amount: Number(p.amount),
      status: p.status,
      createdAt: p.createdAt,
    }));
  }

  /**
   * Get all payouts for a user
   */
  async getUserPayoutHistory(
    userId: string
  ): Promise<
    Array<{
      id: string;
      marketId: string;
      amount: number;
      status: string;
      createdAt: Date;
      processedAt: Date | null;
    }>
  > {
    const payouts = await this.prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return payouts.map((p) => ({
      id: p.id,
      marketId: p.marketId,
      amount: Number(p.amount),
      status: p.status,
      createdAt: p.createdAt,
      processedAt: p.processedAt,
    }));
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
    const result = await this.prisma.payout.aggregate({
      where: { status: { in: ['PENDING', 'PROCESSING'] } },
      _sum: { amount: true },
    });

    return result._sum.amount ? Number(result._sum.amount) : 0;
  }

  /**
   * Deposit funds to user's trading balance
   */
  async depositToBalance(userId: string, amount: number): Promise<void> {
    await this.prisma.balance.upsert({
      where: { userId },
      create: {
        userId,
        tradingBalance: new Prisma.Decimal(amount),
        lockedBalance: new Prisma.Decimal(0),
      },
      update: {
        tradingBalance: { increment: new Prisma.Decimal(amount) },
      },
    });
  }

  /**
   * Withdraw funds from user's trading balance
   */
  async withdrawFromBalance(userId: string, amount: number): Promise<boolean> {
    const balance = await this.prisma.balance.findUnique({
      where: { userId },
    });

    if (!balance || Number(balance.tradingBalance) < amount) {
      return false;
    }

    await this.prisma.balance.update({
      where: { userId },
      data: {
        tradingBalance: { decrement: new Prisma.Decimal(amount) },
      },
    });

    return true;
  }
}
