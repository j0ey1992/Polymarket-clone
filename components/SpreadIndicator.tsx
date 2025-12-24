import React, { useEffect, useState } from 'react';
import { getSpreadConfig, SpreadConfig } from '../lib/api';

interface SpreadIndicatorProps {
  orderSize: number;
  side: 'BUY' | 'SELL';
  marketPrice: number;
  className?: string;
}

const SpreadIndicator: React.FC<SpreadIndicatorProps> = ({
  orderSize,
  side,
  marketPrice,
  className = '',
}) => {
  const [spreadConfig, setSpreadConfig] = useState<SpreadConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getSpreadConfig();
        setSpreadConfig(config);
      } catch (error) {
        console.error('Error fetching spread config:', error);
      }
    };
    fetchConfig();
  }, []);

  if (!spreadConfig) {
    return (
      <div className={`bg-dark-200/30 rounded-xl p-4 animate-pulse ${className}`}>
        <div className="h-4 w-24 bg-dark-300/50 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-dark-300/50 rounded" />
          <div className="h-3 w-3/4 bg-dark-300/50 rounded" />
        </div>
      </div>
    );
  }

  let spread = spreadConfig.baseSpread;
  if (orderSize >= spreadConfig.volumeDiscountThreshold) {
    spread -= spreadConfig.volumeDiscount;
  }
  spread = Math.max(spreadConfig.minSpread, Math.min(spreadConfig.maxSpread, spread));

  const effectivePrice =
    side === 'BUY' ? marketPrice * (1 + spread) : marketPrice * (1 - spread);
  const platformFee = orderSize * spread;

  const spreadPercentage = (spread * 100).toFixed(2);
  const effectivePriceFormatted = (effectivePrice * 100).toFixed(1);
  const marketPriceFormatted = (marketPrice * 100).toFixed(1);

  const spreadLevel = spread <= spreadConfig.minSpread
    ? 'low'
    : spread >= spreadConfig.maxSpread
    ? 'high'
    : 'medium';

  const spreadColors = {
    low: { text: 'text-bull-light', bg: 'bg-bull', border: 'border-bull/30' },
    medium: { text: 'text-yellow-400', bg: 'bg-yellow-500', border: 'border-yellow-500/30' },
    high: { text: 'text-bear-light', bg: 'bg-bear', border: 'border-bear/30' },
  };

  return (
    <div className={`bg-dark-200/30 rounded-xl p-4 border border-white/5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider">
          Spread Details
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${spreadColors[spreadLevel].text} bg-white/5 border ${spreadColors[spreadLevel].border}`}>
          {spreadPercentage}%
        </span>
      </div>

      {/* Price Details */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-sm">
          <span className="text-dark-500">Market Price</span>
          <span className="text-white font-medium number-display">{marketPriceFormatted}¢</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-dark-500">
            Your {side === 'BUY' ? 'Buy' : 'Sell'} Price
          </span>
          <span className={`font-semibold number-display ${side === 'BUY' ? 'text-bear-light' : 'text-bull-light'}`}>
            {effectivePriceFormatted}¢
          </span>
        </div>

        <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5">
          <span className="text-dark-500">Platform Fee</span>
          <span className="text-white font-medium number-display">${platformFee.toFixed(2)}</span>
        </div>
      </div>

      {/* Volume Discount */}
      {orderSize >= spreadConfig.volumeDiscountThreshold && (
        <div className="mt-3 flex items-center space-x-2 px-3 py-2 rounded-lg bg-bull/10 border border-bull/20">
          <svg className="w-4 h-4 text-bull" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium text-bull-light">
            Volume discount applied
          </span>
        </div>
      )}

      {/* Spread Progress Bar */}
      <div className="mt-4">
        <div className="relative h-2 rounded-full bg-dark-300/50 overflow-hidden">
          <div
            className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ${spreadColors[spreadLevel].bg}`}
            style={{
              width: `${
                ((spread - spreadConfig.minSpread) /
                  (spreadConfig.maxSpread - spreadConfig.minSpread)) *
                100
              }%`,
            }}
          />
          {/* Glow effect */}
          <div
            className={`absolute top-0 bottom-0 rounded-full blur-sm transition-all duration-500 ${spreadColors[spreadLevel].bg} opacity-50`}
            style={{
              width: `${
                ((spread - spreadConfig.minSpread) /
                  (spreadConfig.maxSpread - spreadConfig.minSpread)) *
                100
              }%`,
            }}
          />
        </div>
        <div className="flex justify-between text-2xs text-dark-500 mt-1.5">
          <span>{(spreadConfig.minSpread * 100).toFixed(1)}%</span>
          <span>{(spreadConfig.maxSpread * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default SpreadIndicator;
