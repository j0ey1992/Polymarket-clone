import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/cronos_prediction_market',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Cronos Chain
  cronos: {
    rpcUrl: process.env.CRONOS_RPC_URL || 'https://evm.cronos.org',
    chainId: parseInt(process.env.CRONOS_CHAIN_ID || '25', 10),
    predictionMarketAddress: process.env.PREDICTION_MARKET_ADDRESS || '',
    treasuryAddress: process.env.TREASURY_ADDRESS || '',
    privateKey: process.env.CRONOS_PRIVATE_KEY || '',
  },

  // Polymarket
  polymarket: {
    clobBaseUrl: process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com',
    gammaBaseUrl: process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com',
    wsUrl: process.env.POLYMARKET_WS_URL || 'wss://ws-subscriptions-clob.polymarket.com',
    liveDataWsUrl: process.env.POLYMARKET_LIVE_WS_URL || 'wss://ws-live-data.polymarket.com',
    polygonChainId: 137,
    privateKey: process.env.POLYMARKET_PRIVATE_KEY || '',
    funderAddress: process.env.POLYMARKET_FUNDER_ADDRESS || '',
  },

  // Spread Configuration
  spread: {
    baseSpread: parseFloat(process.env.BASE_SPREAD || '0.02'), // 2%
    minSpread: parseFloat(process.env.MIN_SPREAD || '0.01'), // 1%
    maxSpread: parseFloat(process.env.MAX_SPREAD || '0.05'), // 5%
    volumeDiscountThreshold: parseFloat(process.env.VOLUME_DISCOUNT_THRESHOLD || '1000'),
    volumeDiscount: parseFloat(process.env.VOLUME_DISCOUNT || '0.005'), // 0.5%
    volatilityPremium: parseFloat(process.env.VOLATILITY_PREMIUM || '0.01'), // 1%
  },

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Market Sync
  marketSync: {
    intervalMs: parseInt(process.env.MARKET_SYNC_INTERVAL_MS || '30000', 10), // 30 seconds
    maxMarketsToSync: parseInt(process.env.MAX_MARKETS_TO_SYNC || '100', 10),
  },

  // Order Processing
  orders: {
    slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE || '0.01'), // 1%
    minOrderSize: parseFloat(process.env.MIN_ORDER_SIZE || '1'), // $1 minimum
    maxOrderSize: parseFloat(process.env.MAX_ORDER_SIZE || '10000'), // $10,000 maximum
  },
};

export type Config = typeof config;
