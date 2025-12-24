import React, { useEffect, useState } from 'react';
import { getOrderBook, OrderBook as OrderBookType, OrderBookLevel } from '../lib/api';

interface OrderBookProps {
  marketId: string;
  outcome: 'YES' | 'NO';
  onPriceSelect?: (price: number) => void;
}

const OrderBook: React.FC<OrderBookProps> = ({ marketId, outcome, onPriceSelect }) => {
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderBook = async () => {
      try {
        setLoading(true);
        const data = await getOrderBook(marketId);
        setOrderBook(outcome === 'YES' ? data.yes : data.no);
        setError(null);
      } catch (err) {
        setError('Failed to load order book');
        console.error('Error fetching order book:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 5000);
    return () => clearInterval(interval);
  }, [marketId, outcome]);

  const formatPrice = (price: string) => {
    return (parseFloat(price) * 100).toFixed(1) + '¢';
  };

  const formatSize = (size: string) => {
    const num = parseFloat(size);
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  };

  const getMaxSize = (levels: OrderBookLevel[]) => {
    if (levels.length === 0) return 1;
    return Math.max(...levels.map((l) => parseFloat(l.size)));
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="h-5 w-32 bg-dark-300/50 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 bg-dark-300/30 rounded animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center space-x-2 text-bear-light">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  const bids = orderBook?.bids?.slice(0, 8) || [];
  const asks = orderBook?.asks?.slice(0, 8) || [];
  const maxBidSize = getMaxSize(bids);
  const maxAskSize = getMaxSize(asks);

  const spread = bids.length > 0 && asks.length > 0
    ? ((parseFloat(asks[0]?.price || '0') - parseFloat(bids[0]?.price || '0')) * 100).toFixed(2)
    : null;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-bold text-white">Order Book</h3>
          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
            outcome === 'YES' ? 'price-tag-bull' : 'price-tag-bear'
          }`}>
            {outcome}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
          <span className="text-2xs text-dark-500">Live</span>
        </div>
      </div>

      <div className="p-3">
        {/* Column Headers */}
        <div className="flex justify-between text-2xs text-dark-500 px-2 mb-2 uppercase tracking-wider font-medium">
          <span>Price</span>
          <span>Size</span>
        </div>

        {/* Asks (sell orders) */}
        <div className="space-y-0.5 mb-2">
          {asks
            .slice()
            .reverse()
            .map((level, i) => {
              const sizePercent = (parseFloat(level.size) / maxAskSize) * 100;
              return (
                <div
                  key={`ask-${i}`}
                  className="relative flex justify-between items-center px-3 py-2 rounded-lg cursor-pointer group transition-all duration-150 hover:bg-bear/10"
                  onClick={() => onPriceSelect?.(parseFloat(level.price))}
                >
                  {/* Background bar */}
                  <div
                    className="absolute right-0 top-0 bottom-0 rounded-lg bg-bear/10 transition-all duration-300"
                    style={{ width: `${sizePercent}%` }}
                  />
                  <span className="relative text-sm font-semibold text-bear-light number-display group-hover:text-bear">
                    {formatPrice(level.price)}
                  </span>
                  <span className="relative text-sm text-dark-600 number-display">
                    {formatSize(level.size)}
                  </span>
                </div>
              );
            })}
        </div>

        {/* Spread indicator */}
        {spread && (
          <div className="flex items-center justify-center py-3 my-2 border-y border-white/5">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-sm font-medium text-dark-600">
                Spread: <span className="text-white number-display">{spread}¢</span>
              </span>
            </div>
          </div>
        )}

        {/* Bids (buy orders) */}
        <div className="space-y-0.5 mt-2">
          {bids.map((level, i) => {
            const sizePercent = (parseFloat(level.size) / maxBidSize) * 100;
            return (
              <div
                key={`bid-${i}`}
                className="relative flex justify-between items-center px-3 py-2 rounded-lg cursor-pointer group transition-all duration-150 hover:bg-bull/10"
                onClick={() => onPriceSelect?.(parseFloat(level.price))}
              >
                {/* Background bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 rounded-lg bg-bull/10 transition-all duration-300"
                  style={{ width: `${sizePercent}%` }}
                />
                <span className="relative text-sm font-semibold text-bull-light number-display group-hover:text-bull">
                  {formatPrice(level.price)}
                </span>
                <span className="relative text-sm text-dark-600 number-display">
                  {formatSize(level.size)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {bids.length === 0 && asks.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-dark-200/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-dark-500 text-sm">No orders available</p>
            <p className="text-dark-600 text-xs mt-1">Be the first to place an order</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderBook;
