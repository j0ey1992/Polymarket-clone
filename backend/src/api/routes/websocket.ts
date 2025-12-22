import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { MarketSyncService } from '../../services/MarketSyncService';
import { OrderRouterService } from '../../services/OrderRouterService';
import { SettlementService } from '../../services/SettlementService';

interface SubscriptionData {
  marketId?: string;
  userId?: string;
}

/**
 * WebSocket server for real-time updates
 */
export class WebSocketServer {
  private io: SocketIOServer;
  private marketSyncService: MarketSyncService;
  private orderRouter: OrderRouterService;
  private settlementService: SettlementService;

  constructor(
    httpServer: HttpServer,
    marketSyncService: MarketSyncService,
    orderRouter: OrderRouterService,
    settlementService: SettlementService
  ) {
    this.marketSyncService = marketSyncService;
    this.orderRouter = orderRouter;
    this.settlementService = settlementService;

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventListeners();
    this.setupSocketHandlers();
  }

  /**
   * Set up event listeners from services
   */
  private setupEventListeners(): void {
    // Market price updates
    this.marketSyncService.on('priceUpdate', (data) => {
      this.io.to(`market:${data.marketId}`).emit('price_update', {
        marketId: data.marketId,
        yesPrice: data.yesPrice,
        noPrice: data.noPrice,
        timestamp: new Date().toISOString(),
      });
    });

    // Order book updates
    this.marketSyncService.on('orderBookUpdate', (data) => {
      this.io.to(`market:${data.tokenId}`).emit('orderbook_update', data);
    });

    // Market resolution
    this.marketSyncService.on('marketResolved', (data) => {
      this.io.to(`market:${data.marketId}`).emit('market_resolved', data);
      this.io.emit('market_resolved_global', data);
    });

    // Order updates
    this.orderRouter.on('orderCreated', (order) => {
      this.io.to(`user:${order.userId}`).emit('order_created', order);
    });

    this.orderRouter.on('orderFilled', (order) => {
      this.io.to(`user:${order.userId}`).emit('order_filled', order);
    });

    this.orderRouter.on('orderPartiallyFilled', (data) => {
      this.io.emit('order_partially_filled', data);
    });

    this.orderRouter.on('orderCancelled', (data) => {
      this.io.emit('order_cancelled', data);
    });

    this.orderRouter.on('orderFailed', (data) => {
      this.io.emit('order_failed', data);
    });

    // Settlement updates
    this.settlementService.on('marketSettled', (result) => {
      this.io.to(`market:${result.marketId}`).emit('market_settled', result);

      // Notify each user of their payout
      result.userPayouts.forEach((payout) => {
        this.io.to(`user:${payout.userId}`).emit('payout_available', {
          marketId: result.marketId,
          outcome: result.outcome,
          amount: payout.amount,
        });
      });
    });
  }

  /**
   * Set up socket connection handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Subscribe to market updates
      socket.on('subscribe_market', async (data: SubscriptionData) => {
        if (data.marketId) {
          socket.join(`market:${data.marketId}`);
          console.log(`Client ${socket.id} subscribed to market ${data.marketId}`);

          // Send current price immediately
          const price = await this.marketSyncService.getCurrentPrice(data.marketId);
          if (price) {
            socket.emit('price_update', {
              marketId: data.marketId,
              yesPrice: price.yesPrice,
              noPrice: price.noPrice,
              timestamp: new Date().toISOString(),
            });
          }

          // Subscribe to Polymarket WebSocket for this market
          await this.marketSyncService.subscribeToMarket(data.marketId);
        }
      });

      // Unsubscribe from market updates
      socket.on('unsubscribe_market', (data: SubscriptionData) => {
        if (data.marketId) {
          socket.leave(`market:${data.marketId}`);
          console.log(`Client ${socket.id} unsubscribed from market ${data.marketId}`);
        }
      });

      // Subscribe to user updates (orders, positions)
      socket.on('subscribe_user', (data: SubscriptionData) => {
        if (data.userId) {
          socket.join(`user:${data.userId}`);
          console.log(`Client ${socket.id} subscribed to user ${data.userId}`);
        }
      });

      // Unsubscribe from user updates
      socket.on('unsubscribe_user', (data: SubscriptionData) => {
        if (data.userId) {
          socket.leave(`user:${data.userId}`);
          console.log(`Client ${socket.id} unsubscribed from user ${data.userId}`);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });

      // Ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(event: string, data: unknown): void {
    this.io.emit(event, data);
  }

  /**
   * Send a message to a specific room (market or user)
   */
  sendToRoom(room: string, event: string, data: unknown): void {
    this.io.to(room).emit(event, data);
  }

  /**
   * Get the Socket.IO server instance
   */
  getIO(): SocketIOServer {
    return this.io;
  }
}
