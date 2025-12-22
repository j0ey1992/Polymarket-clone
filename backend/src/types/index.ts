// Market types
export interface Market {
  id: string;
  polymarketConditionId: string;
  polymarketTokenIdYes: string;
  polymarketTokenIdNo: string;
  question: string;
  description: string | null;
  image: string | null;
  category: string | null;
  endDate: Date | null;
  resolved: boolean;
  outcome: 'YES' | 'NO' | 'INVALID' | null;
  volume: number;
  liquidity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketPrice {
  marketId: string;
  yesPrice: number;
  noPrice: number;
  spread: number;
  lastUpdated: Date;
}

// Order types
export type OrderSide = 'BUY' | 'SELL';
export type OrderOutcome = 'YES' | 'NO';
export type OrderStatus = 'PENDING' | 'PLACED' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'FAILED';

export interface Order {
  id: string;
  userId: string;
  marketId: string;
  side: OrderSide;
  outcome: OrderOutcome;
  size: number;
  price: number;
  spreadApplied: number;
  effectivePrice: number;
  status: OrderStatus;
  polymarketOrderId: string | null;
  cronosTxHash: string | null;
  createdAt: Date;
  filledAt: Date | null;
}

export interface OrderRequest {
  userId: string;
  marketId: string;
  side: OrderSide;
  outcome: OrderOutcome;
  size: number;
}

// Position types
export interface Position {
  id: string;
  userId: string;
  marketId: string;
  side: OrderOutcome;
  size: number;
  avgPrice: number;
  currentValue: number;
  pnl: number;
  createdAt: Date;
  updatedAt: Date;
}

// User types
export interface User {
  id: string;
  cronosAddress: string;
  createdAt: Date;
}

// Spread types
export interface SpreadConfig {
  baseSpread: number;
  minSpread: number;
  maxSpread: number;
  volumeDiscountThreshold: number;
  volumeDiscount: number;
  volatilityPremium: number;
}

export interface SpreadCalculation {
  spread: number;
  effectivePrice: number;
  userReceives: number;
  platformProfit: number;
}

// Polymarket types
export interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource: string;
  endDate: string;
  liquidity: string;
  startDate: string;
  image: string;
  icon: string;
  description: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  active: boolean;
  closed: boolean;
  marketType: string;
  tokens: PolymarketToken[];
}

export interface PolymarketToken {
  token_id: string;
  outcome: string;
  price: number;
}

export interface PolymarketOrderBook {
  market: string;
  asset_id: string;
  bids: PolymarketOrderBookLevel[];
  asks: PolymarketOrderBookLevel[];
  timestamp: string;
}

export interface PolymarketOrderBookLevel {
  price: string;
  size: string;
}

// Hedge position types
export interface HedgePosition {
  id: string;
  marketId: string;
  side: OrderOutcome;
  size: number;
  avgPrice: number;
  updatedAt: Date;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  data: unknown;
}

export interface WSMarketUpdate {
  type: 'MARKET_UPDATE';
  data: {
    marketId: string;
    yesPrice: number;
    noPrice: number;
  };
}

export interface WSOrderUpdate {
  type: 'ORDER_UPDATE';
  data: {
    orderId: string;
    status: OrderStatus;
    filledSize?: number;
  };
}

export interface WSPositionUpdate {
  type: 'POSITION_UPDATE';
  data: Position;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Settlement types
export interface SettlementResult {
  marketId: string;
  outcome: 'YES' | 'NO' | 'INVALID';
  totalPayout: number;
  userPayouts: UserPayout[];
}

export interface UserPayout {
  userId: string;
  amount: number;
  positionSize: number;
}
