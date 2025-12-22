import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import SpreadIndicator from './SpreadIndicator';
import { getQuote, placeOrder, Quote } from '../lib/api';

interface TradePanelProps {
  marketId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  onTradeComplete?: () => void;
}

const TradePanel: React.FC<TradePanelProps> = ({
  marketId,
  question,
  yesPrice,
  noPrice,
  onTradeComplete,
}) => {
  const { account } = useData();
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState<string>('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentPrice = outcome === 'YES' ? yesPrice : noPrice;
  const amountNum = parseFloat(amount) || 0;

  // Debounced quote fetching
  useEffect(() => {
    if (amountNum <= 0) {
      setQuote(null);
      return;
    }

    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const q = await getQuote({
          marketId,
          side,
          outcome,
          size: amountNum,
        });
        setQuote(q);
        setError(null);
      } catch (err) {
        console.error('Error fetching quote:', err);
        // Use local calculation as fallback
        const spread = 0.02;
        const effectivePrice =
          side === 'BUY' ? currentPrice * (1 + spread) : currentPrice * (1 - spread);
        setQuote({
          side,
          size: amountNum,
          marketPrice: currentPrice,
          effectivePrice,
          spread,
          platformFee: amountNum * spread,
          ...(side === 'BUY'
            ? { totalCost: amountNum * effectivePrice }
            : { proceeds: amountNum * effectivePrice }),
        });
      } finally {
        setQuoteLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [amount, side, outcome, marketId, currentPrice, amountNum]);

  const handleTrade = useCallback(async () => {
    if (!account) {
      setError('Please connect your wallet');
      return;
    }

    if (amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const order = await placeOrder({
        userId: account,
        marketId,
        side,
        outcome,
        size: amountNum,
      });

      setSuccess(`Order placed! ID: ${order.id.slice(0, 8)}...`);
      setAmount('');
      onTradeComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  }, [account, amountNum, marketId, side, outcome, onTradeComplete]);

  const formatPrice = (price: number) => (price * 100).toFixed(1) + '¢';

  // Calculate estimated shares/proceeds
  const estimatedShares =
    quote && side === 'BUY'
      ? amountNum / quote.effectivePrice
      : amountNum;
  const estimatedPayout =
    side === 'BUY'
      ? estimatedShares * 1 // $1 per share if wins
      : quote?.proceeds || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-lg">Trade</h3>
      </div>

      {/* Side Toggle */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              side === 'BUY'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setSide('BUY')}
          >
            Buy
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              side === 'SELL'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setSide('SELL')}
          >
            Sell
          </button>
        </div>
      </div>

      {/* Outcome Selection */}
      <div className="p-4 border-b border-gray-100">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Pick Outcome
        </label>
        <div className="space-y-2">
          <button
            className={`w-full py-3 px-4 rounded-lg flex justify-between items-center transition-colors ${
              outcome === 'YES'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setOutcome('YES')}
          >
            <span className="font-semibold">YES</span>
            <span>{formatPrice(yesPrice)}</span>
          </button>
          <button
            className={`w-full py-3 px-4 rounded-lg flex justify-between items-center transition-colors ${
              outcome === 'NO'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setOutcome('NO')}
          >
            <span className="font-semibold">NO</span>
            <span>{formatPrice(noPrice)}</span>
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="p-4 border-b border-gray-100">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          {side === 'BUY' ? 'Amount (USDC)' : 'Shares to Sell'}
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full py-3 px-4 pr-20 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <span className="text-gray-500 text-sm">
              {side === 'BUY' ? 'USDC' : 'Shares'}
            </span>
            <button
              className="text-blue-600 text-sm font-medium hover:text-blue-800"
              onClick={() => setAmount('100')} // Example max
            >
              Max
            </button>
          </div>
        </div>
      </div>

      {/* Spread Indicator */}
      {amountNum > 0 && (
        <div className="p-4 border-b border-gray-100">
          <SpreadIndicator
            orderSize={amountNum}
            side={side}
            marketPrice={currentPrice}
          />
        </div>
      )}

      {/* Order Summary */}
      {quote && amountNum > 0 && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="space-y-2">
            {side === 'BUY' ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">You Pay</span>
                  <span className="font-medium">${amountNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Est. Shares</span>
                  <span className="font-medium">
                    {quoteLoading ? '...' : estimatedShares.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Potential Return</span>
                  <span className="font-medium text-green-600">
                    ${quoteLoading ? '...' : estimatedPayout.toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shares to Sell</span>
                  <span className="font-medium">{amountNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">You Receive</span>
                  <span className="font-medium text-green-600">
                    ${quoteLoading ? '...' : estimatedPayout.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border-b border-green-100">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {/* Trade Button */}
      <div className="p-4">
        <button
          onClick={handleTrade}
          disabled={loading || amountNum <= 0 || !account}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
            loading || amountNum <= 0 || !account
              ? 'bg-gray-400 cursor-not-allowed'
              : side === 'BUY'
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {loading
            ? 'Processing...'
            : !account
            ? 'Connect Wallet'
            : `${side === 'BUY' ? 'Buy' : 'Sell'} ${outcome}`}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-400 text-center">
          Trading involves risk. Platform takes a small spread on each trade.
        </p>
      </div>
    </div>
  );
};

export default TradePanel;
