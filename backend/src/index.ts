import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

import { config } from './config';
import { createMarketRoutes } from './api/routes/markets';
import { createOrderRoutes } from './api/routes/orders';
import { createPositionRoutes } from './api/routes/positions';
import { WebSocketServer } from './api/routes/websocket';
import { MarketSyncService } from './services/MarketSyncService';
import { OrderRouterService } from './services/OrderRouterService';
import { PositionManagerService } from './services/PositionManagerService';
import { SettlementService } from './services/SettlementService';
import { IncrementalSyncService } from './services/IncrementalSyncService';
import { RealtimePriceService } from './services/RealtimePriceService';
import { BulkSyncService } from './services/BulkSyncService';

// Initialize clients
const prisma = new PrismaClient();
const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 100, 3000);
  },
  lazyConnect: true,
});

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: config.nodeEnv === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Initialize services
const marketSyncService = new MarketSyncService(prisma);
const positionManager = new PositionManagerService(prisma);
const orderRouter = new OrderRouterService(prisma);
const settlementService = new SettlementService(prisma, positionManager);
const incrementalSync = new IncrementalSyncService(prisma, redis);
const bulkSync = new BulkSyncService(prisma, redis);

// Initialize WebSocket server
const wsServer = new WebSocketServer(
  httpServer,
  marketSyncService,
  orderRouter,
  settlementService
);

// Initialize real-time price service
const realtimePriceService = new RealtimePriceService(prisma, redis, wsServer.getIO());

// API Routes
app.use('/api/markets', createMarketRoutes(marketSyncService));
app.use('/api/orders', createOrderRoutes(orderRouter));
app.use('/api/positions', createPositionRoutes(positionManager));

// Health check endpoint
app.get('/health', async (_req, res) => {
  const redisOk = redis.status === 'ready';
  let dbOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const status = redisOk && dbOk ? 'healthy' : 'degraded';
  const statusCode = status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbOk ? 'connected' : 'disconnected',
      redis: redisOk ? 'connected' : 'disconnected',
    },
  });
});

// Stats endpoint
app.get('/api/stats', async (_req, res) => {
  try {
    const [marketCount, activeMarkets, categories] = await Promise.all([
      prisma.market.count(),
      prisma.market.count({ where: { active: true } }),
      prisma.category.findMany({ orderBy: { marketCount: 'desc' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalMarkets: marketCount,
        activeMarkets,
        categories: categories.map(c => ({
          name: c.name,
          slug: c.slug,
          icon: c.icon,
          count: c.marketCount,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Admin sync endpoint
app.post('/api/admin/sync', async (req, res) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.ADMIN_TOKEN;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const { type } = req.body as { type?: string };

    if (type === 'full') {
      bulkSync.fullSync().catch(console.error);
      res.json({ success: true, message: 'Full sync started in background' });
    } else {
      await incrementalSync.syncPrices();
      res.json({ success: true, message: 'Price sync complete' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
});

// API documentation endpoint
app.get('/api', (_req, res) => {
  res.json({
    name: 'Cronos Prediction Market API',
    version: '1.0.0',
    description: 'Polymarket mirror with 5% spread',
    endpoints: {
      markets: {
        'GET /api/markets': 'List all markets',
        'GET /api/markets/:id': 'Get market with prices',
        'GET /api/markets/:id/orderbook': 'Get order book',
        'GET /api/markets/:id/price-history': 'Price history for charts',
      },
      orders: {
        'POST /api/orders': 'Place order',
        'GET /api/orders/:id': 'Get order status',
        'DELETE /api/orders/:id': 'Cancel order',
        'POST /api/orders/quote': 'Get quote with spread',
      },
      positions: {
        'GET /api/positions/user/:userId': 'User positions',
        'GET /api/positions/user/:userId/summary': 'Portfolio summary',
      },
      admin: {
        'POST /api/admin/sync': 'Trigger sync (requires ADMIN_TOKEN)',
      },
    },
  });
});

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Startup
async function start() {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('  CRONOS PREDICTION MARKET');
    console.log('═══════════════════════════════════════════');

    // Connect to database
    await prisma.$connect();
    console.log('✓ PostgreSQL connected');

    // Connect to Redis
    await redis.connect();
    console.log('✓ Redis connected');

    // Check market count
    const marketCount = await prisma.market.count();
    if (marketCount === 0) {
      console.log('');
      console.log('⚠ No markets in database!');
      console.log('  Run: npm run sync:full');
      console.log('');
    } else {
      console.log(`✓ ${marketCount} markets loaded`);
    }

    // Start services
    await realtimePriceService.start();
    console.log('✓ Real-time prices started');

    incrementalSync.start(30000);
    console.log('✓ Incremental sync started (30s)');

    settlementService.start();
    console.log('✓ Settlement service started');

    // Start server
    httpServer.listen(config.port, () => {
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log(`  Listening on port ${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log('═══════════════════════════════════════════');
    });
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down...`);

  realtimePriceService.stop();
  incrementalSync.stop();
  settlementService.stop();

  await redis.quit();
  await prisma.$disconnect();

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
