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
    return null;
  }

  // Calculate effective spread
  let spread = spreadConfig.baseSpread;

  // Volume discount
  if (orderSize >= spreadConfig.volumeDiscountThreshold) {
    spread -= spreadConfig.volumeDiscount;
  }

  // Clamp to bounds
  spread = Math.max(spreadConfig.minSpread, Math.min(spreadConfig.maxSpread, spread));

  // Calculate effective price
  const effectivePrice =
    side === 'BUY' ? marketPrice * (1 + spread) : marketPrice * (1 - spread);

  // Calculate what user gets/pays
  const platformFee = orderSize * spread;

  const spreadPercentage = (spread * 100).toFixed(2);
  const effectivePriceFormatted = (effectivePrice * 100).toFixed(1);
  const marketPriceFormatted = (marketPrice * 100).toFixed(1);

  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">Spread Details</span>
        <span
          className={`text-xs font-bold ${
            spread <= spreadConfig.minSpread
              ? 'text-green-600'
              : spread >= spreadConfig.maxSpread
              ? 'text-red-600'
              : 'text-yellow-600'
          }`}
        >
          {spreadPercentage}%
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Market Price</span>
          <span className="text-gray-700">{marketPriceFormatted}¢</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-gray-500">
            Your {side === 'BUY' ? 'Buy' : 'Sell'} Price
          </span>
          <span
            className={`font-medium ${
              side === 'BUY' ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {effectivePriceFormatted}¢
          </span>
        </div>

        <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
          <span className="text-gray-500">Platform Fee</span>
          <span className="text-gray-700">${platformFee.toFixed(2)}</span>
        </div>
      </div>

      {orderSize >= spreadConfig.volumeDiscountThreshold && (
        <div className="mt-2 flex items-center">
          <span className="text-xs text-green-600">
            ✓ Volume discount applied
          </span>
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-center">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                spread <= spreadConfig.minSpread
                  ? 'bg-green-500'
                  : spread >= spreadConfig.maxSpread
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}
              style={{
                width: `${
                  ((spread - spreadConfig.minSpread) /
                    (spreadConfig.maxSpread - spreadConfig.minSpread)) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>{(spreadConfig.minSpread * 100).toFixed(1)}%</span>
          <span>{(spreadConfig.maxSpread * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default SpreadIndicator;
