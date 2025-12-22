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

    // Refresh every 5 seconds
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
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const bids = orderBook?.bids?.slice(0, 8) || [];
  const asks = orderBook?.asks?.slice(0, 8) || [];
  const maxBidSize = getMaxSize(bids);
  const maxAskSize = getMaxSize(asks);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-sm text-gray-700">
          Order Book - {outcome}
        </h3>
      </div>

      <div className="p-2">
        {/* Header */}
        <div className="flex justify-between text-xs text-gray-500 px-2 mb-2">
          <span>Price</span>
          <span>Size</span>
        </div>

        {/* Asks (sell orders) - shown in reverse */}
        <div className="space-y-0.5 mb-2">
          {asks
            .slice()
            .reverse()
            .map((level, i) => {
              const sizePercent = (parseFloat(level.size) / maxAskSize) * 100;
              return (
                <div
                  key={`ask-${i}`}
                  className="relative flex justify-between items-center px-2 py-1 hover:bg-red-50 cursor-pointer rounded"
                  onClick={() => onPriceSelect?.(parseFloat(level.price))}
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-red-100 opacity-50"
                    style={{ width: `${sizePercent}%` }}
                  />
                  <span className="relative text-sm text-red-600 font-medium">
                    {formatPrice(level.price)}
                  </span>
                  <span className="relative text-sm text-gray-600">
                    {formatSize(level.size)}
                  </span>
                </div>
              );
            })}
        </div>

        {/* Spread indicator */}
        {bids.length > 0 && asks.length > 0 && (
          <div className="flex justify-center items-center py-2 border-t border-b border-gray-100">
            <span className="text-xs text-gray-500">
              Spread:{' '}
              {(
                (parseFloat(asks[0]?.price || '0') -
                  parseFloat(bids[0]?.price || '0')) *
                100
              ).toFixed(2)}
              ¢
            </span>
          </div>
        )}

        {/* Bids (buy orders) */}
        <div className="space-y-0.5 mt-2">
          {bids.map((level, i) => {
            const sizePercent = (parseFloat(level.size) / maxBidSize) * 100;
            return (
              <div
                key={`bid-${i}`}
                className="relative flex justify-between items-center px-2 py-1 hover:bg-green-50 cursor-pointer rounded"
                onClick={() => onPriceSelect?.(parseFloat(level.price))}
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-green-100 opacity-50"
                  style={{ width: `${sizePercent}%` }}
                />
                <span className="relative text-sm text-green-600 font-medium">
                  {formatPrice(level.price)}
                </span>
                <span className="relative text-sm text-gray-600">
                  {formatSize(level.size)}
                </span>
              </div>
            );
          })}
        </div>

        {bids.length === 0 && asks.length === 0 && (
          <div className="text-center py-4 text-gray-400 text-sm">
            No orders available
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderBook;
