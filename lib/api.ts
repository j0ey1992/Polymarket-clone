/**
 * API client for the Cronos Prediction Market backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Market {
  id: string;
  polymarketConditionId: string;
  question: string;
  description: string | null;
  image: string | null;
  endDate: string | null;
  resolved: boolean;
  outcome: 'YES' | 'NO' | 'INVALID' | null;
  volume: number;
  liquidity: number;
  currentPrice?: {
    yes: number;
    no: number;
  };
}

interface OrderBookLevel {
  price: string;
  size: string;
}

interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

interface Position {
  id: string;
  userId: string;
  marketId: string;
  side: 'YES' | 'NO';
  size: number;
  avgPrice: number;
  currentValue: number;
  pnl: number;
}

interface Order {
  id: string;
  userId: string;
  marketId: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  size: number;
  price: number;
  spreadApplied: number;
  effectivePrice: number;
  status: string;
}

interface Quote {
  side: 'BUY' | 'SELL';
  size: number;
  marketPrice: number;
  totalCost?: number;
  proceeds?: number;
  effectivePrice: number;
  spread: number;
  platformFee: number;
}

interface SpreadConfig {
  baseSpread: number;
  minSpread: number;
  maxSpread: number;
  volumeDiscountThreshold: number;
  volumeDiscount: number;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return data.data as T;
}

// Markets API
export async function getMarkets(params?: {
  active?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ data: Market[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.active !== undefined) searchParams.set('active', String(params.active));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  return fetchApi(`/markets?${searchParams.toString()}`);
}

export async function getMarket(id: string): Promise<Market> {
  return fetchApi(`/markets/${id}`);
}

export async function getOrderBook(marketId: string): Promise<{ yes: OrderBook; no: OrderBook }> {
  return fetchApi(`/markets/${marketId}/orderbook`);
}

export async function getPriceHistory(
  marketId: string,
  limit?: number
): Promise<Array<{ yesPrice: number; noPrice: number; timestamp: string }>> {
  const params = limit ? `?limit=${limit}` : '';
  return fetchApi(`/markets/${marketId}/price-history${params}`);
}

// Orders API
export async function placeOrder(order: {
  userId: string;
  marketId: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  size: number;
}): Promise<Order> {
  return fetchApi('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function getOrder(orderId: string): Promise<Order> {
  return fetchApi(`/orders/${orderId}`);
}

export async function cancelOrder(orderId: string): Promise<void> {
  return fetchApi(`/orders/${orderId}`, { method: 'DELETE' });
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  return fetchApi(`/orders/user/${userId}`);
}

export async function getQuote(params: {
  marketId: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  size: number;
}): Promise<Quote> {
  return fetchApi('/orders/quote', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getSpreadConfig(): Promise<SpreadConfig> {
  return fetchApi('/orders/spread/config');
}

// Positions API
export async function getUserPositions(userId: string): Promise<Position[]> {
  return fetchApi(`/positions/user/${userId}`);
}

export async function getPortfolioSummary(userId: string): Promise<{
  totalValue: number;
  totalPnL: number;
  positionCount: number;
  positions: Position[];
}> {
  return fetchApi(`/positions/user/${userId}/summary`);
}

export async function getExitValue(
  userId: string,
  marketId: string,
  side: 'YES' | 'NO'
): Promise<{ grossValue: number; netValue: number; spreadCost: number }> {
  return fetchApi(`/positions/${userId}/${marketId}/${side}/exit-value`);
}

export type { Market, OrderBook, OrderBookLevel, Position, Order, Quote, SpreadConfig };
