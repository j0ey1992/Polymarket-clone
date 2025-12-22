import axios, { AxiosInstance } from 'axios';
import { ethers } from 'ethers';
import { config } from '../config';
import { PolymarketOrderBook } from '../types';

/**
 * Order side for Polymarket CLOB
 */
export enum Side {
  BUY = 'BUY',
  SELL = 'SELL',
}

/**
 * Order type for Polymarket CLOB
 */
export enum OrderType {
  GTC = 'GTC', // Good Till Cancelled
  GTD = 'GTD', // Good Till Date
  FOK = 'FOK', // Fill Or Kill
}

export interface ClobOrder {
  tokenId: string;
  price: number;
  size: number;
  side: Side;
  orderType?: OrderType;
  expiration?: number;
}

export interface ClobOrderResponse {
  orderID: string;
  status: string;
  filledSize?: number;
  remainingSize?: number;
}

export interface ApiCredentials {
  apiKey: string;
  apiSecret: string;
  apiPassphrase: string;
}

/**
 * Client for Polymarket's CLOB (Central Limit Order Book) API
 * Used for placing orders and getting order book data
 */
export class ClobClient {
  private client: AxiosInstance;
  private wallet: ethers.Wallet | null = null;
  private credentials: ApiCredentials | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.polymarket.clobBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.initializeWallet();
  }

  private async initializeWallet(): Promise<void> {
    if (config.polymarket.privateKey) {
      const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
      this.wallet = new ethers.Wallet(config.polymarket.privateKey, provider);
    }
  }

  /**
   * Derive or create API credentials for the CLOB
   */
  async deriveApiCredentials(): Promise<ApiCredentials> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    // In production, you would use the official @polymarket/clob-client
    // to derive credentials. This is a simplified version.
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `Signing this message confirms your intention to use the Polymarket API.\n\nTimestamp: ${timestamp}`;

    const signature = await this.wallet.signMessage(message);

    const response = await this.client.post('/auth/derive-api-key', {
      address: this.wallet.address,
      signature,
      timestamp,
    });

    this.credentials = {
      apiKey: response.data.apiKey,
      apiSecret: response.data.secret,
      apiPassphrase: response.data.passphrase,
    };

    return this.credentials;
  }

  /**
   * Set API credentials directly
   */
  setCredentials(credentials: ApiCredentials): void {
    this.credentials = credentials;
  }

  /**
   * Get headers for authenticated requests
   */
  private getAuthHeaders(): Record<string, string> {
    if (!this.credentials) {
      throw new Error('API credentials not set');
    }

    const timestamp = Date.now().toString();

    return {
      'POLY_API_KEY': this.credentials.apiKey,
      'POLY_PASSPHRASE': this.credentials.apiPassphrase,
      'POLY_TIMESTAMP': timestamp,
    };
  }

  /**
   * Get order book for a token
   */
  async getOrderBook(tokenId: string): Promise<PolymarketOrderBook> {
    const response = await this.client.get('/book', {
      params: { token_id: tokenId },
    });
    return response.data;
  }

  /**
   * Get mid-market price for a token
   */
  async getMidPrice(tokenId: string): Promise<number> {
    const orderBook = await this.getOrderBook(tokenId);

    const bestBid = orderBook.bids[0] ? parseFloat(orderBook.bids[0].price) : 0;
    const bestAsk = orderBook.asks[0] ? parseFloat(orderBook.asks[0].price) : 1;

    return (bestBid + bestAsk) / 2;
  }

  /**
   * Get the best bid and ask prices
   */
  async getBestPrices(tokenId: string): Promise<{ bid: number; ask: number; spread: number }> {
    const orderBook = await this.getOrderBook(tokenId);

    const bid = orderBook.bids[0] ? parseFloat(orderBook.bids[0].price) : 0;
    const ask = orderBook.asks[0] ? parseFloat(orderBook.asks[0].price) : 1;

    return {
      bid,
      ask,
      spread: ask - bid,
    };
  }

  /**
   * Get price quote for a specific size
   */
  async getPrice(tokenId: string, side: Side, size: number): Promise<number> {
    const response = await this.client.get('/price', {
      params: {
        token_id: tokenId,
        side,
        amount: size,
      },
    });
    return parseFloat(response.data.price);
  }

  /**
   * Place a limit order
   */
  async placeOrder(order: ClobOrder): Promise<ClobOrderResponse> {
    if (!this.credentials) {
      throw new Error('API credentials not set. Call deriveApiCredentials first.');
    }

    const orderPayload = {
      tokenID: order.tokenId,
      price: order.price.toString(),
      size: order.size.toString(),
      side: order.side,
      orderType: order.orderType || OrderType.GTC,
      expiration: order.expiration,
    };

    const response = await this.client.post('/order', orderPayload, {
      headers: this.getAuthHeaders(),
    });

    return {
      orderID: response.data.orderID,
      status: response.data.status,
      filledSize: response.data.filledSize ? parseFloat(response.data.filledSize) : undefined,
      remainingSize: response.data.remainingSize
        ? parseFloat(response.data.remainingSize)
        : undefined,
    };
  }

  /**
   * Place a market order (FOK at market price)
   */
  async placeMarketOrder(
    tokenId: string,
    side: Side,
    size: number
  ): Promise<ClobOrderResponse> {
    // Get current market price
    const price = await this.getPrice(tokenId, side, size);

    // Add slippage tolerance
    const slippageTolerance = config.orders.slippageTolerance;
    const adjustedPrice =
      side === Side.BUY ? price * (1 + slippageTolerance) : price * (1 - slippageTolerance);

    return this.placeOrder({
      tokenId,
      price: adjustedPrice,
      size,
      side,
      orderType: OrderType.FOK,
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('API credentials not set');
    }

    const response = await this.client.delete(`/order/${orderId}`, {
      headers: this.getAuthHeaders(),
    });

    return response.data.success;
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<ClobOrderResponse> {
    const response = await this.client.get(`/order/${orderId}`);

    return {
      orderID: response.data.orderID,
      status: response.data.status,
      filledSize: response.data.filledSize ? parseFloat(response.data.filledSize) : undefined,
      remainingSize: response.data.remainingSize
        ? parseFloat(response.data.remainingSize)
        : undefined,
    };
  }

  /**
   * Get all open orders for the authenticated user
   */
  async getOpenOrders(): Promise<ClobOrderResponse[]> {
    if (!this.credentials) {
      throw new Error('API credentials not set');
    }

    const response = await this.client.get('/orders', {
      headers: this.getAuthHeaders(),
    });

    return response.data.map((order: Record<string, unknown>) => ({
      orderID: order.orderID,
      status: order.status,
      filledSize: order.filledSize ? parseFloat(order.filledSize as string) : undefined,
      remainingSize: order.remainingSize ? parseFloat(order.remainingSize as string) : undefined,
    }));
  }

  /**
   * Get trade history
   */
  async getTradeHistory(): Promise<unknown[]> {
    if (!this.credentials) {
      throw new Error('API credentials not set');
    }

    const response = await this.client.get('/trades', {
      headers: this.getAuthHeaders(),
    });

    return response.data;
  }

  /**
   * Check if we have sufficient balance to place an order
   */
  async checkBalance(tokenId: string, side: Side, size: number): Promise<boolean> {
    // This would check USDC balance for BUY orders
    // or token balance for SELL orders
    // In a real implementation, you'd query the smart contract
    return true; // Placeholder
  }
}

export const clobClient = new ClobClient();
