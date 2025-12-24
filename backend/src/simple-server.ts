/**
 * Simple development server that fetches directly from Polymarket
 * No database required - just proxies Polymarket data
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;

// Polymarket API endpoints
const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';

app.use(cors());
app.use(express.json());

// In-memory stores for development
interface UserBalance {
  tradingBalance: number;
  lockedBalance: number;
}

interface Position {
  id: string;
  marketId: string;
  side: 'YES' | 'NO';
  size: number;
  avgPrice: number;
}

interface Order {
  id: string;
  userId: string;
  marketId: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  size: number;
  price: number;
  effectivePrice: number;
  spreadApplied: number;
  status: string;
  createdAt: Date;
}

const userBalances: Map<string, UserBalance> = new Map();
const userPositions: Map<string, Position[]> = new Map();
const orders: Map<string, Order> = new Map();

// Spread configuration
const SPREAD_CONFIG = {
  baseSpread: 0.02, // 2%
  minSpread: 0.01,
  maxSpread: 0.05,
  volumeDiscountThreshold: 1000,
  volumeDiscount: 0.005,
};

// Cache for markets (refresh every 5 minutes)
let marketsCache: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchMarketsFromPolymarket() {
  const now = Date.now();
  if (marketsCache.length > 0 && now - lastFetch < CACHE_DURATION) {
    return marketsCache;
  }

  try {
    console.log('Fetching markets from Polymarket...');
    const response = await axios.get(`${GAMMA_API}/markets`, {
      params: {
        closed: false,
        limit: 50,
      },
    });

    marketsCache = response.data.map((market: any) => ({
      id: market.conditionId || market.id,
      polymarketConditionId: market.conditionId,
      polymarketTokenIdYes: market.clobTokenIds?.[0] || '',
      polymarketTokenIdNo: market.clobTokenIds?.[1] || '',
      question: market.question,
      description: market.description,
      imageUrl: market.image,
      endDate: market.endDate,
      resolved: market.closed || false,
      outcome: market.outcome,
      volume: parseFloat(market.volume || '0'),
      liquidity: parseFloat(market.liquidity || '0'),
      outcomePrices: market.outcomePrices,
    }));

    lastFetch = now;
    console.log(`Fetched ${marketsCache.length} markets`);
    return marketsCache;
  } catch (error) {
    console.error('Error fetching from Polymarket:', error);
    return marketsCache; // Return cached data on error
  }
}

// Get all markets
app.get('/api/markets', async (req, res) => {
  try {
    const markets = await fetchMarketsFromPolymarket();

    // Parse prices from outcomePrices string
    const marketsWithPrices = markets.map((market: any) => {
      let yesPrice = 0.5;
      let noPrice = 0.5;

      if (market.outcomePrices) {
        try {
          const prices = JSON.parse(market.outcomePrices);
          yesPrice = parseFloat(prices[0]) || 0.5;
          noPrice = parseFloat(prices[1]) || 0.5;
        } catch (e) {
          // Use defaults
        }
      }

      return {
        ...market,
        currentPrice: {
          yes: yesPrice,
          no: noPrice,
        },
      };
    });

    res.json({
      success: true,
      data: {
        data: marketsWithPrices,
        total: marketsWithPrices.length,
        page: 0,
        limit: 50,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch markets' });
  }
});

// Get single market
app.get('/api/markets/:id', async (req, res) => {
  try {
    const markets = await fetchMarketsFromPolymarket();
    const market = markets.find((m: any) => m.id === req.params.id || m.polymarketConditionId === req.params.id);

    if (!market) {
      return res.status(404).json({ success: false, error: 'Market not found' });
    }

    let yesPrice = 0.5;
    let noPrice = 0.5;

    if (market.outcomePrices) {
      try {
        const prices = JSON.parse(market.outcomePrices);
        yesPrice = parseFloat(prices[0]) || 0.5;
        noPrice = parseFloat(prices[1]) || 0.5;
      } catch (e) {}
    }

    res.json({
      success: true,
      data: {
        ...market,
        currentPrice: { yes: yesPrice, no: noPrice },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch market' });
  }
});

// Get positions for user
app.get('/api/positions', (req, res) => {
  const address = req.query.address as string;
  if (!address) {
    return res.json({ success: true, data: [] });
  }

  const positions = userPositions.get(address.toLowerCase()) || [];
  res.json({ success: true, data: positions });
});

// Get user portfolio summary
app.get('/api/positions/user/:userId/summary', (req, res) => {
  const userId = req.params.userId.toLowerCase();
  const positions = userPositions.get(userId) || [];

  const totalValue = positions.reduce((sum, p) => sum + (p.size * (p.side === 'YES' ? 0.5 : 0.5)), 0);
  const totalPnL = positions.reduce((sum, p) => sum + (p.size * (0.5 - p.avgPrice)), 0);

  res.json({
    success: true,
    data: {
      totalValue,
      totalPnL,
      positionCount: positions.length,
      positions,
    },
  });
});

// ============= BALANCE ENDPOINTS =============

// Get user balance
app.get('/api/balance/:userId', (req, res) => {
  const userId = req.params.userId.toLowerCase();
  const balance = userBalances.get(userId) || { tradingBalance: 0, lockedBalance: 0 };

  res.json({
    success: true,
    data: {
      walletBalance: 0, // Wallet balance is from chain, not stored here
      tradingBalance: balance.tradingBalance,
      lockedBalance: balance.lockedBalance,
    },
  });
});

// Deposit to trading balance (called after on-chain deposit)
app.post('/api/balance/:userId/deposit', (req, res) => {
  const userId = req.params.userId.toLowerCase();
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }

  const current = userBalances.get(userId) || { tradingBalance: 0, lockedBalance: 0 };
  current.tradingBalance += amount;
  userBalances.set(userId, current);

  console.log(`Deposited $${amount} for user ${userId}. New balance: $${current.tradingBalance}`);

  res.json({
    success: true,
    data: {
      tradingBalance: current.tradingBalance,
      lockedBalance: current.lockedBalance,
    },
  });
});

// Withdraw from trading balance
app.post('/api/balance/:userId/withdraw', (req, res) => {
  const userId = req.params.userId.toLowerCase();
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }

  const current = userBalances.get(userId) || { tradingBalance: 0, lockedBalance: 0 };

  if (current.tradingBalance < amount) {
    return res.status(400).json({ success: false, error: 'Insufficient balance' });
  }

  current.tradingBalance -= amount;
  userBalances.set(userId, current);

  console.log(`Withdrew $${amount} for user ${userId}. New balance: $${current.tradingBalance}`);

  res.json({
    success: true,
    data: {
      tradingBalance: current.tradingBalance,
      lockedBalance: current.lockedBalance,
    },
  });
});

// ============= ORDER ENDPOINTS =============

// Get quote for an order
app.post('/api/orders/quote', async (req, res) => {
  const { marketId, side, outcome, size } = req.body;

  if (!marketId || !side || !outcome || !size) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const markets = await fetchMarketsFromPolymarket();
  const market = markets.find((m: any) => m.id === marketId || m.polymarketConditionId === marketId);

  if (!market) {
    return res.status(404).json({ success: false, error: 'Market not found' });
  }

  let yesPrice = 0.5;
  let noPrice = 0.5;

  if (market.outcomePrices) {
    try {
      const prices = JSON.parse(market.outcomePrices);
      yesPrice = parseFloat(prices[0]) || 0.5;
      noPrice = parseFloat(prices[1]) || 0.5;
    } catch (e) {}
  }

  const marketPrice = outcome === 'YES' ? yesPrice : noPrice;
  const spread = SPREAD_CONFIG.baseSpread;
  const effectivePrice = side === 'BUY'
    ? marketPrice * (1 + spread)
    : marketPrice * (1 - spread);

  const quote = {
    side,
    size,
    marketPrice,
    effectivePrice,
    spread,
    platformFee: size * spread,
    totalCost: side === 'BUY' ? size : undefined,
    proceeds: side === 'SELL' ? size * effectivePrice : undefined,
  };

  res.json({ success: true, data: quote });
});

// Get spread config
app.get('/api/orders/spread/config', (req, res) => {
  res.json({ success: true, data: SPREAD_CONFIG });
});

// Place order
app.post('/api/orders', async (req, res) => {
  const { userId, marketId, side, outcome, size, signature } = req.body;

  if (!userId || !marketId || !side || !outcome || !size) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const userIdLower = userId.toLowerCase();

  // Check balance for BUY orders
  if (side === 'BUY') {
    const balance = userBalances.get(userIdLower) || { tradingBalance: 0, lockedBalance: 0 };
    if (balance.tradingBalance < size) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Lock the balance
    balance.tradingBalance -= size;
    balance.lockedBalance += size;
    userBalances.set(userIdLower, balance);
  }

  // Check position for SELL orders
  if (side === 'SELL') {
    const positions = userPositions.get(userIdLower) || [];
    const position = positions.find(p => p.marketId === marketId && p.side === outcome);
    if (!position || position.size < size) {
      return res.status(400).json({ success: false, error: 'Insufficient position' });
    }
  }

  const markets = await fetchMarketsFromPolymarket();
  const market = markets.find((m: any) => m.id === marketId || m.polymarketConditionId === marketId);

  let marketPrice = 0.5;
  if (market?.outcomePrices) {
    try {
      const prices = JSON.parse(market.outcomePrices);
      marketPrice = outcome === 'YES' ? parseFloat(prices[0]) : parseFloat(prices[1]);
    } catch (e) {}
  }

  const spread = SPREAD_CONFIG.baseSpread;
  const effectivePrice = side === 'BUY'
    ? marketPrice * (1 + spread)
    : marketPrice * (1 - spread);

  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const order: Order = {
    id: orderId,
    userId: userIdLower,
    marketId,
    side,
    outcome,
    size,
    price: marketPrice,
    effectivePrice,
    spreadApplied: spread,
    status: 'PENDING',
    createdAt: new Date(),
  };

  orders.set(orderId, order);

  // Simulate order fill after a short delay
  setTimeout(() => {
    const savedOrder = orders.get(orderId);
    if (savedOrder && savedOrder.status === 'PENDING') {
      savedOrder.status = 'FILLED';
      orders.set(orderId, savedOrder);

      // Update positions
      const positions = userPositions.get(userIdLower) || [];

      if (side === 'BUY') {
        // Consume locked balance
        const balance = userBalances.get(userIdLower);
        if (balance) {
          balance.lockedBalance -= size;
          userBalances.set(userIdLower, balance);
        }

        // Add/update position
        const existingPos = positions.find(p => p.marketId === marketId && p.side === outcome);
        if (existingPos) {
          const newSize = existingPos.size + size;
          existingPos.avgPrice = (existingPos.avgPrice * existingPos.size + effectivePrice * size) / newSize;
          existingPos.size = newSize;
        } else {
          positions.push({
            id: `pos_${Date.now()}`,
            marketId,
            side: outcome,
            size,
            avgPrice: effectivePrice,
          });
        }
      } else {
        // SELL - reduce position
        const posIndex = positions.findIndex(p => p.marketId === marketId && p.side === outcome);
        if (posIndex >= 0) {
          positions[posIndex].size -= size;
          if (positions[posIndex].size <= 0) {
            positions.splice(posIndex, 1);
          }

          // Credit proceeds to balance
          const balance = userBalances.get(userIdLower) || { tradingBalance: 0, lockedBalance: 0 };
          balance.tradingBalance += size * effectivePrice;
          userBalances.set(userIdLower, balance);
        }
      }

      userPositions.set(userIdLower, positions);
      console.log(`Order ${orderId} filled for ${side} ${size} ${outcome} @ ${effectivePrice}`);
    }
  }, 1000);

  console.log(`Order created: ${orderId}`);
  res.json({ success: true, data: order });
});

// Get order by ID
app.get('/api/orders/:orderId', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

// Get user orders
app.get('/api/orders/user/:userId', (req, res) => {
  const userId = req.params.userId.toLowerCase();
  const userOrders = Array.from(orders.values())
    .filter(o => o.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ success: true, data: userOrders });
});

// Cancel order
app.delete('/api/orders/:orderId', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  if (order.status === 'FILLED' || order.status === 'CANCELLED') {
    return res.status(400).json({ success: false, error: 'Order cannot be cancelled' });
  }

  order.status = 'CANCELLED';
  orders.set(req.params.orderId, order);

  // Release locked balance for BUY orders
  if (order.side === 'BUY') {
    const balance = userBalances.get(order.userId);
    if (balance) {
      balance.lockedBalance -= order.size;
      balance.tradingBalance += order.size;
      userBalances.set(order.userId, balance);
    }
  }

  res.json({ success: true, data: { message: 'Order cancelled' } });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     Cronos Prediction Market - Development Server          ║
║                                                            ║
║     API:      http://localhost:${PORT}                        ║
║     Health:   http://localhost:${PORT}/health                 ║
║     Markets:  http://localhost:${PORT}/api/markets            ║
║                                                            ║
║     Fetching live data from Polymarket                     ║
╚════════════════════════════════════════════════════════════╝
  `);

  // Pre-fetch markets on startup
  fetchMarketsFromPolymarket();
});
