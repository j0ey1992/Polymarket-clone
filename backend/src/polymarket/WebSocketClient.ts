import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { config } from '../config';

export interface PriceUpdate {
  tokenId: string;
  price: number;
  timestamp: Date;
}

export interface OrderBookUpdate {
  tokenId: string;
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  timestamp: Date;
}

export interface TradeUpdate {
  tokenId: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
  timestamp: Date;
}

/**
 * WebSocket client for real-time Polymarket data
 */
export class PolymarketWebSocketClient extends EventEmitter {
  private marketWs: WebSocket | null = null;
  private liveDataWs: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscribedTokens: Set<string> = new Set();
  private isConnected = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  /**
   * Connect to Polymarket WebSocket feeds
   */
  async connect(): Promise<void> {
    await Promise.all([this.connectMarketWs(), this.connectLiveDataWs()]);
  }

  /**
   * Connect to market order book WebSocket
   */
  private async connectMarketWs(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.marketWs = new WebSocket(config.polymarket.wsUrl);

      this.marketWs.on('open', () => {
        console.log('Connected to Polymarket market WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      });

      this.marketWs.on('message', (data) => {
        this.handleMarketMessage(data.toString());
      });

      this.marketWs.on('close', () => {
        console.log('Polymarket market WebSocket closed');
        this.isConnected = false;
        this.stopHeartbeat();
        this.handleReconnect('market');
      });

      this.marketWs.on('error', (error) => {
        console.error('Polymarket market WebSocket error:', error);
        reject(error);
      });
    });
  }

  /**
   * Connect to live price data WebSocket
   */
  private async connectLiveDataWs(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.liveDataWs = new WebSocket(config.polymarket.liveDataWsUrl);

      this.liveDataWs.on('open', () => {
        console.log('Connected to Polymarket live data WebSocket');
        resolve();
      });

      this.liveDataWs.on('message', (data) => {
        this.handleLiveDataMessage(data.toString());
      });

      this.liveDataWs.on('close', () => {
        console.log('Polymarket live data WebSocket closed');
        this.handleReconnect('liveData');
      });

      this.liveDataWs.on('error', (error) => {
        console.error('Polymarket live data WebSocket error:', error);
        reject(error);
      });
    });
  }

  /**
   * Subscribe to order book updates for a token
   */
  subscribeToOrderBook(tokenId: string): void {
    if (!this.marketWs || this.marketWs.readyState !== WebSocket.OPEN) {
      console.error('Market WebSocket not connected');
      return;
    }

    const subscribeMessage = JSON.stringify({
      type: 'subscribe',
      channel: 'book',
      market: tokenId,
    });

    this.marketWs.send(subscribeMessage);
    this.subscribedTokens.add(tokenId);
    console.log(`Subscribed to order book for token: ${tokenId}`);
  }

  /**
   * Unsubscribe from order book updates for a token
   */
  unsubscribeFromOrderBook(tokenId: string): void {
    if (!this.marketWs || this.marketWs.readyState !== WebSocket.OPEN) {
      return;
    }

    const unsubscribeMessage = JSON.stringify({
      type: 'unsubscribe',
      channel: 'book',
      market: tokenId,
    });

    this.marketWs.send(unsubscribeMessage);
    this.subscribedTokens.delete(tokenId);
    console.log(`Unsubscribed from order book for token: ${tokenId}`);
  }

  /**
   * Subscribe to price updates for a token
   */
  subscribeToPriceUpdates(tokenId: string): void {
    if (!this.liveDataWs || this.liveDataWs.readyState !== WebSocket.OPEN) {
      console.error('Live data WebSocket not connected');
      return;
    }

    const subscribeMessage = JSON.stringify({
      type: 'subscribe',
      channel: 'prices',
      asset_id: tokenId,
    });

    this.liveDataWs.send(subscribeMessage);
    console.log(`Subscribed to price updates for token: ${tokenId}`);
  }

  /**
   * Handle incoming market WebSocket messages
   */
  private handleMarketMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.type === 'book') {
        const update: OrderBookUpdate = {
          tokenId: message.market,
          bids: message.bids?.map((b: { price: string; size: string }) => ({
            price: parseFloat(b.price),
            size: parseFloat(b.size),
          })) || [],
          asks: message.asks?.map((a: { price: string; size: string }) => ({
            price: parseFloat(a.price),
            size: parseFloat(a.size),
          })) || [],
          timestamp: new Date(),
        };
        this.emit('orderBookUpdate', update);
      } else if (message.type === 'trade') {
        const trade: TradeUpdate = {
          tokenId: message.market,
          price: parseFloat(message.price),
          size: parseFloat(message.size),
          side: message.side,
          timestamp: new Date(message.timestamp),
        };
        this.emit('trade', trade);
      }
    } catch (error) {
      console.error('Error parsing market WebSocket message:', error);
    }
  }

  /**
   * Handle incoming live data WebSocket messages
   */
  private handleLiveDataMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.type === 'price_update') {
        const update: PriceUpdate = {
          tokenId: message.asset_id,
          price: parseFloat(message.price),
          timestamp: new Date(),
        };
        this.emit('priceUpdate', update);
      }
    } catch (error) {
      console.error('Error parsing live data WebSocket message:', error);
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(type: 'market' | 'liveData'): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${type} WebSocket`);
      this.emit('disconnected', type);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Reconnecting ${type} WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (type === 'market') {
        this.connectMarketWs().then(() => {
          // Resubscribe to all tokens
          this.subscribedTokens.forEach((tokenId) => {
            this.subscribeToOrderBook(tokenId);
          });
        });
      } else {
        this.connectLiveDataWs();
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.marketWs && this.marketWs.readyState === WebSocket.OPEN) {
        this.marketWs.ping();
      }
      if (this.liveDataWs && this.liveDataWs.readyState === WebSocket.OPEN) {
        this.liveDataWs.ping();
      }
    }, 30000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Disconnect from all WebSocket feeds
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.marketWs) {
      this.marketWs.close();
      this.marketWs = null;
    }

    if (this.liveDataWs) {
      this.liveDataWs.close();
      this.liveDataWs = null;
    }

    this.isConnected = false;
    this.subscribedTokens.clear();
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const polymarketWsClient = new PolymarketWebSocketClient();
