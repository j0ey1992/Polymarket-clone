import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { clobClient, Side } from '../polymarket/ClobClient';
import { spreadCalculator } from './SpreadCalculatorService';
import { config } from '../config';
import { Order, OrderRequest, OrderStatus } from '../types';

/**
 * Service responsible for routing orders to Polymarket
 * and managing the order lifecycle
 */
export class OrderRouterService extends EventEmitter {
  private prisma: PrismaClient;
  private pendingOrders: Map<string, NodeJS.Timeout> = new Map();

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  /**
   * Place a new order
   */
  async placeOrder(request: OrderRequest): Promise<Order> {
    // Validate order
    await this.validateOrder(request);

    // Get market details
    const market = await this.prisma.market.findUnique({
      where: { id: request.marketId },
    });

    if (!market) {
      throw new Error('Market not found');
    }

    if (market.resolved) {
      throw new Error('Market is already resolved');
    }

    // Get current market price
    const tokenId =
      request.outcome === 'YES'
        ? market.polymarketTokenIdYes
        : market.polymarketTokenIdNo;

    const marketPrice = await clobClient.getMidPrice(tokenId);

    // Calculate spread
    const spreadCalc = spreadCalculator.calculateSpread(
      request.size,
      marketPrice,
      request.side
    );

    // Create order record
    const order = await this.prisma.order.create({
      data: {
        userId: request.userId,
        marketId: request.marketId,
        side: request.side,
        outcome: request.outcome,
        size: request.size,
        price: marketPrice,
        spreadApplied: spreadCalc.spread,
        effectivePrice: spreadCalc.effectivePrice,
        status: 'PENDING',
      },
    });

    // Route to Polymarket asynchronously
    this.routeToPolymarket(order.id, tokenId, request.side, request.size, marketPrice);

    this.emit('orderCreated', this.toOrder(order));

    return this.toOrder(order);
  }

  /**
   * Route order to Polymarket CLOB
   */
  private async routeToPolymarket(
    orderId: string,
    tokenId: string,
    side: 'BUY' | 'SELL',
    size: number,
    price: number
  ): Promise<void> {
    try {
      // Update order status to PLACED
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PLACED' },
      });

      // Place order on Polymarket
      const polymarketSide = side === 'BUY' ? Side.BUY : Side.SELL;
      const result = await clobClient.placeMarketOrder(tokenId, polymarketSide, size);

      // Check order status
      if (result.status === 'FILLED') {
        await this.handleOrderFilled(orderId, result.orderID);
      } else if (result.status === 'PARTIALLY_FILLED') {
        await this.handleOrderPartiallyFilled(
          orderId,
          result.orderID,
          result.filledSize || 0
        );
        // Set up polling for remaining fill
        this.startOrderPolling(orderId, result.orderID);
      } else {
        // Order is open, start polling
        await this.prisma.order.update({
          where: { id: orderId },
          data: { polymarketOrderId: result.orderID },
        });
        this.startOrderPolling(orderId, result.orderID);
      }
    } catch (error) {
      console.error(`Error routing order ${orderId} to Polymarket:`, error);
      await this.handleOrderFailed(orderId, error);
    }
  }

  /**
   * Handle a filled order
   */
  private async handleOrderFilled(orderId: string, polymarketOrderId: string): Promise<void> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'FILLED',
        polymarketOrderId,
        filledAt: new Date(),
      },
    });

    // Record spread profit
    await this.recordSpreadProfit(order);

    // Update user position
    await this.updateUserPosition(order);

    // Update hedge position
    await this.updateHedgePosition(order);

    this.emit('orderFilled', this.toOrder(order));
    console.log(`Order ${orderId} filled`);
  }

  /**
   * Handle a partially filled order
   */
  private async handleOrderPartiallyFilled(
    orderId: string,
    polymarketOrderId: string,
    filledSize: number
  ): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PARTIALLY_FILLED',
        polymarketOrderId,
      },
    });

    this.emit('orderPartiallyFilled', { orderId, filledSize });
    console.log(`Order ${orderId} partially filled: ${filledSize}`);
  }

  /**
   * Handle a failed order
   */
  private async handleOrderFailed(orderId: string, error: unknown): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'FAILED' },
    });

    this.emit('orderFailed', { orderId, error });
    console.error(`Order ${orderId} failed:`, error);
  }

  /**
   * Start polling for order status
   */
  private startOrderPolling(orderId: string, polymarketOrderId: string): void {
    const pollInterval = setInterval(async () => {
      try {
        const status = await clobClient.getOrderStatus(polymarketOrderId);

        if (status.status === 'FILLED') {
          await this.handleOrderFilled(orderId, polymarketOrderId);
          this.stopOrderPolling(orderId);
        } else if (status.status === 'CANCELLED') {
          await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
          });
          this.stopOrderPolling(orderId);
          this.emit('orderCancelled', { orderId });
        }
      } catch (error) {
        console.error(`Error polling order ${orderId}:`, error);
      }
    }, 5000); // Poll every 5 seconds

    this.pendingOrders.set(orderId, pollInterval);

    // Set a timeout to cancel after 5 minutes
    setTimeout(() => {
      if (this.pendingOrders.has(orderId)) {
        this.cancelOrder(orderId);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop polling for an order
   */
  private stopOrderPolling(orderId: string): void {
    const interval = this.pendingOrders.get(orderId);
    if (interval) {
      clearInterval(interval);
      this.pendingOrders.delete(orderId);
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'FILLED' || order.status === 'CANCELLED') {
      throw new Error('Order cannot be cancelled');
    }

    // Cancel on Polymarket if order was placed
    if (order.polymarketOrderId) {
      await clobClient.cancelOrder(order.polymarketOrderId);
    }

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    // Stop polling
    this.stopOrderPolling(orderId);

    this.emit('orderCancelled', { orderId });
    return true;
  }

  /**
   * Record spread profit from a filled order
   */
  private async recordSpreadProfit(order: {
    id: string;
    size: unknown;
    spreadApplied: unknown;
  }): Promise<void> {
    const profitAmount = Number(order.size) * Number(order.spreadApplied);

    await this.prisma.spreadProfit.create({
      data: {
        orderId: order.id,
        amount: profitAmount,
      },
    });

    console.log(`Recorded spread profit: $${profitAmount.toFixed(4)}`);
  }

  /**
   * Update user position after order fill
   */
  private async updateUserPosition(order: {
    userId: string;
    marketId: string;
    outcome: string;
    side: string;
    size: unknown;
    effectivePrice: unknown;
  }): Promise<void> {
    const existingPosition = await this.prisma.position.findUnique({
      where: {
        userId_marketId_side: {
          userId: order.userId,
          marketId: order.marketId,
          side: order.outcome,
        },
      },
    });

    const orderSize = Number(order.size);
    const orderPrice = Number(order.effectivePrice);

    if (order.side === 'BUY') {
      if (existingPosition) {
        // Add to existing position
        const newSize = Number(existingPosition.size) + orderSize;
        const newAvgPrice =
          (Number(existingPosition.size) * Number(existingPosition.avgPrice) +
            orderSize * orderPrice) /
          newSize;

        await this.prisma.position.update({
          where: { id: existingPosition.id },
          data: {
            size: newSize,
            avgPrice: newAvgPrice,
          },
        });
      } else {
        // Create new position
        await this.prisma.position.create({
          data: {
            userId: order.userId,
            marketId: order.marketId,
            side: order.outcome,
            size: orderSize,
            avgPrice: orderPrice,
          },
        });
      }
    } else {
      // SELL - reduce position
      if (existingPosition) {
        const newSize = Number(existingPosition.size) - orderSize;

        if (newSize <= 0) {
          // Position fully closed
          await this.prisma.position.delete({
            where: { id: existingPosition.id },
          });
        } else {
          await this.prisma.position.update({
            where: { id: existingPosition.id },
            data: { size: newSize },
          });
        }
      }
    }
  }

  /**
   * Update hedge position (our Polymarket position)
   */
  private async updateHedgePosition(order: {
    marketId: string;
    outcome: string;
    side: string;
    size: unknown;
    price: unknown;
  }): Promise<void> {
    const existingHedge = await this.prisma.hedgePosition.findUnique({
      where: {
        marketId_side: {
          marketId: order.marketId,
          side: order.outcome,
        },
      },
    });

    const orderSize = Number(order.size);
    const orderPrice = Number(order.price);

    if (order.side === 'BUY') {
      // We bought on Polymarket to hedge user's buy
      if (existingHedge) {
        const newSize = Number(existingHedge.size) + orderSize;
        const newAvgPrice =
          (Number(existingHedge.size) * Number(existingHedge.avgPrice) +
            orderSize * orderPrice) /
          newSize;

        await this.prisma.hedgePosition.update({
          where: { id: existingHedge.id },
          data: {
            size: newSize,
            avgPrice: newAvgPrice,
          },
        });
      } else {
        await this.prisma.hedgePosition.create({
          data: {
            marketId: order.marketId,
            side: order.outcome,
            size: orderSize,
            avgPrice: orderPrice,
          },
        });
      }
    } else {
      // We sold on Polymarket to hedge user's sell
      if (existingHedge) {
        const newSize = Number(existingHedge.size) - orderSize;

        if (newSize <= 0) {
          await this.prisma.hedgePosition.delete({
            where: { id: existingHedge.id },
          });
        } else {
          await this.prisma.hedgePosition.update({
            where: { id: existingHedge.id },
            data: { size: newSize },
          });
        }
      }
    }
  }

  /**
   * Validate an order request
   */
  private async validateOrder(request: OrderRequest): Promise<void> {
    // Check minimum order size
    if (request.size < config.orders.minOrderSize) {
      throw new Error(`Minimum order size is $${config.orders.minOrderSize}`);
    }

    // Check maximum order size
    if (request.size > config.orders.maxOrderSize) {
      throw new Error(`Maximum order size is $${config.orders.maxOrderSize}`);
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // For SELL orders, check if user has sufficient position
    if (request.side === 'SELL') {
      const position = await this.prisma.position.findUnique({
        where: {
          userId_marketId_side: {
            userId: request.userId,
            marketId: request.marketId,
            side: request.outcome,
          },
        },
      });

      if (!position || Number(position.size) < request.size) {
        throw new Error('Insufficient position for sell order');
      }
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    return order ? this.toOrder(order) : null;
  }

  /**
   * Get orders for a user
   */
  async getUserOrders(
    userId: string,
    options?: { status?: OrderStatus; limit?: number }
  ): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        status: options?.status,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
    });

    return orders.map((o) => this.toOrder(o));
  }

  /**
   * Get total spread profits
   */
  async getTotalSpreadProfits(): Promise<number> {
    const result = await this.prisma.spreadProfit.aggregate({
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  /**
   * Convert Prisma order to Order type
   */
  private toOrder(prismaOrder: {
    id: string;
    userId: string;
    marketId: string;
    side: string;
    outcome: string;
    size: unknown;
    price: unknown;
    spreadApplied: unknown;
    effectivePrice: unknown;
    status: string;
    polymarketOrderId: string | null;
    cronosTxHash: string | null;
    createdAt: Date;
    filledAt: Date | null;
  }): Order {
    return {
      id: prismaOrder.id,
      userId: prismaOrder.userId,
      marketId: prismaOrder.marketId,
      side: prismaOrder.side as 'BUY' | 'SELL',
      outcome: prismaOrder.outcome as 'YES' | 'NO',
      size: Number(prismaOrder.size),
      price: Number(prismaOrder.price),
      spreadApplied: Number(prismaOrder.spreadApplied),
      effectivePrice: Number(prismaOrder.effectivePrice),
      status: prismaOrder.status as OrderStatus,
      polymarketOrderId: prismaOrder.polymarketOrderId,
      cronosTxHash: prismaOrder.cronosTxHash,
      createdAt: prismaOrder.createdAt,
      filledAt: prismaOrder.filledAt,
    };
  }
}
