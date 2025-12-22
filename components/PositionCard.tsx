import React from 'react';
import { Position } from '../lib/api';

interface PositionCardProps {
  position: Position;
  marketQuestion: string;
  currentPrice: number;
  onSell?: () => void;
}

const PositionCard: React.FC<PositionCardProps> = ({
  position,
  marketQuestion,
  currentPrice,
  onSell,
}) => {
  const pnlPercent = ((position.pnl / (position.size * position.avgPrice)) * 100);
  const isProfit = position.pnl >= 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-4">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
            {marketQuestion}
          </h4>
          <span
            className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded ${
              position.side === 'YES'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {position.side}
          </span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            ${position.currentValue.toFixed(2)}
          </div>
          <div
            className={`text-sm font-medium ${
              isProfit ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isProfit ? '+' : ''}
            ${position.pnl.toFixed(2)} ({pnlPercent.toFixed(1)}%)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm border-t border-gray-100 pt-3">
        <div>
          <span className="text-gray-500 block text-xs">Shares</span>
          <span className="font-medium">{position.size.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Avg Price</span>
          <span className="font-medium">{(position.avgPrice * 100).toFixed(1)}¢</span>
        </div>
        <div>
          <span className="text-gray-500 block text-xs">Current</span>
          <span className="font-medium">{(currentPrice * 100).toFixed(1)}¢</span>
        </div>
      </div>

      {onSell && (
        <button
          onClick={onSell}
          className="mt-3 w-full py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          Sell Position
        </button>
      )}
    </div>
  );
};

export default PositionCard;
