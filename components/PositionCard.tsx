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
    <div className="glass-card glass-card-hover rounded-2xl overflow-hidden group">
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-4">
            <h4 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-kris-300 transition-colors duration-200">
              {marketQuestion}
            </h4>
            <div className="flex items-center space-x-2 mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg ${
                  position.side === 'YES'
                    ? 'price-tag-bull'
                    : 'price-tag-bear'
                }`}
              >
                {position.side === 'YES' ? (
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {position.side}
              </span>
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
                <span className="text-2xs text-dark-500">Active</span>
              </div>
            </div>
          </div>

          {/* Value and P&L */}
          <div className="text-right">
            <div className="text-xl font-bold text-white number-display">
              ${position.currentValue.toFixed(2)}
            </div>
            <div
              className={`flex items-center justify-end space-x-1 text-sm font-semibold mt-1 ${
                isProfit ? 'text-bull-light' : 'text-bear-light'
              }`}
            >
              {isProfit ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className="number-display">
                {isProfit ? '+' : ''}${position.pnl.toFixed(2)}
              </span>
              <span className="text-xs opacity-75">
                ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
          <div className="stat-card !p-3">
            <span className="text-2xs uppercase tracking-wider text-dark-500 font-medium block mb-1">
              Shares
            </span>
            <span className="text-sm font-bold text-white number-display">
              {position.size.toFixed(2)}
            </span>
          </div>
          <div className="stat-card !p-3">
            <span className="text-2xs uppercase tracking-wider text-dark-500 font-medium block mb-1">
              Avg Price
            </span>
            <span className="text-sm font-bold text-white number-display">
              {(position.avgPrice * 100).toFixed(1)}¢
            </span>
          </div>
          <div className="stat-card !p-3">
            <span className="text-2xs uppercase tracking-wider text-dark-500 font-medium block mb-1">
              Current
            </span>
            <span className={`text-sm font-bold number-display ${
              currentPrice > position.avgPrice ? 'text-bull-light' : 'text-bear-light'
            }`}>
              {(currentPrice * 100).toFixed(1)}¢
            </span>
          </div>
        </div>

        {/* Sell Button */}
        {onSell && (
          <button
            onClick={onSell}
            className="mt-4 w-full py-3 text-sm font-semibold rounded-xl bg-bear/10 text-bear-light border border-bear/20 hover:bg-bear/20 hover:border-bear/40 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Sell Position</span>
          </button>
        )}
      </div>

      {/* Glow effect based on P&L */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
        isProfit ? 'shadow-glow-bull' : 'shadow-glow-bear'
      }`} />
    </div>
  );
};

export default PositionCard;
