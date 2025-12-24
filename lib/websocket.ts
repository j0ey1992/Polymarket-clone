/**
 * WebSocket client for real-time updates
 */

type MessageHandler = (data: unknown) => void;

interface PriceUpdate {
  marketId: string;
  yesPrice: number;
  noPrice: number;
  timestamp: string;
}

interface OrderUpdate {
  id: string;
  status: string;
  filledSize?: number;
}

class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private isConnecting = false;

  constructor(url: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001') {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          this.handleReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(message: { type?: string; [key: string]: unknown }): void {
    const eventType = message.type || 'unknown';
    const handlers = this.messageHandlers.get(eventType);

    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }

    // Also emit to 'all' handlers
    const allHandlers = this.messageHandlers.get('all');
    if (allHandlers) {
      allHandlers.forEach((handler) => handler(message));
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(event: string, data: Record<string, unknown>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: event, ...data }));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }

  on(event: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(event)?.delete(handler);
    };
  }

  off(event: string, handler: MessageHandler): void {
    this.messageHandlers.get(event)?.delete(handler);
  }

  // Market subscriptions
  subscribeToMarket(marketId: string): void {
    this.send('subscribe_market', { marketId });
  }

  unsubscribeFromMarket(marketId: string): void {
    this.send('unsubscribe_market', { marketId });
  }

  // User subscriptions
  subscribeToUser(userId: string): void {
    this.send('subscribe_user', { userId });
  }

  unsubscribeFromUser(userId: string): void {
    this.send('unsubscribe_user', { userId });
  }

  // Convenience methods for typed events
  onPriceUpdate(handler: (update: PriceUpdate) => void): () => void {
    return this.on('price_update', handler as MessageHandler);
  }

  onOrderUpdate(handler: (update: OrderUpdate) => void): () => void {
    return this.on('order_filled', handler as MessageHandler);
  }

  onMarketResolved(handler: (data: { marketId: string; outcome: string }) => void): () => void {
    return this.on('market_resolved', handler as MessageHandler);
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();

export type { PriceUpdate, OrderUpdate };
