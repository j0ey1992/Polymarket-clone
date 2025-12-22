import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';

import { config } from './config';
import { createMarketRoutes } from './api/routes/markets';
import { createOrderRoutes } from './api/routes/orders';
import { createPositionRoutes } from './api/routes/positions';
import { WebSocketServer } from './api/routes/websocket';
import { MarketSyncService } from './services/MarketSyncService';
import { OrderRouterService } from './services/OrderRouterService';
import { PositionManagerService } from './services/PositionManagerService';
import { SettlementService } from './services/SettlementService';
import { polymarketWsClient } from './polymarket/WebSocketClient';

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Initialize services
const marketSyncService = new MarketSyncService(prisma);
const positionManager = new PositionManagerService(prisma);
const orderRouter = new OrderRouterService(prisma);
const settlementService = new SettlementService(prisma, positionManager);

// Initialize WebSocket server
const wsServer = new WebSocketServer(
  httpServer,
  marketSyncService,
  orderRouter,
  settlementService
);

// API Routes
app.use('/api/markets', createMarketRoutes(marketSyncService));
app.use('/api/orders', createOrderRoutes(orderRouter));
app.use('/api/positions', createPositionRoutes(positionManager));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      polymarketWs: polymarketWsClient.getConnectionStatus() ? 'connected' : 'disconnected',
    },
  });
});

// API documentation endpoint
app.get('/api', (_req, res) => {
  res.json({
    name: 'Cronos Prediction Market API',
    version: '1.0.0',
    endpoints: {
      markets: {
        'GET /api/markets': 'Get all markets',
        'GET /api/markets/:id': 'Get market by ID',
        'GET /api/markets/:id/orderbook': 'Get order book for market',
        'GET /api/markets/:id/price-history': 'Get price history',
        'POST /api/markets/sync': 'Trigger market sync (admin)',
      },
      orders: {
        'POST /api/orders': 'Place a new order',
        'GET /api/orders/:id': 'Get order by ID',
        'DELETE /api/orders/:id': 'Cancel an order',
        'GET /api/orders/user/:userId': 'Get user orders',
        'POST /api/orders/quote': 'Get price quote with spread',
        'GET /api/orders/spread/config': 'Get spread configuration',
        'GET /api/orders/profits': 'Get total spread profits (admin)',
      },
      positions: {
        'GET /api/positions/user/:userId': 'Get user positions',
        'GET /api/positions/user/:userId/summary': 'Get portfolio summary',
        'GET /api/positions/market/:marketId': 'Get market positions',
        'GET /api/positions/:userId/:marketId/:side': 'Get specific position',
        'GET /api/positions/:userId/:marketId/:side/exit-value': 'Calculate exit value',
        'GET /api/positions/hedge': 'Get hedge positions (admin)',
        'GET /api/positions/hedge/exposure': 'Get total hedge exposure (admin)',
      },
      websocket: {
        'subscribe_market': 'Subscribe to market price updates',
        'unsubscribe_market': 'Unsubscribe from market updates',
        'subscribe_user': 'Subscribe to user order/position updates',
        'unsubscribe_user': 'Unsubscribe from user updates',
      },
    },
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Startup function
async function start() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Connected to database');

    // Connect to Polymarket WebSocket
    try {
      await polymarketWsClient.connect();
      console.log('Connected to Polymarket WebSocket');
    } catch (error) {
      console.warn('Failed to connect to Polymarket WebSocket:', error);
      console.log('Continuing without real-time Polymarket data...');
    }

    // Start market sync service
    await marketSyncService.start();

    // Start settlement service
    settlementService.start();

    // Start HTTP server
    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`API documentation: http://localhost:${config.port}/api`);
      console.log(`Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down...');

  marketSyncService.stop();
  settlementService.stop();
  polymarketWsClient.disconnect();

  await prisma.$disconnect();

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
start();
