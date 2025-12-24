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

  const estimatedShares =
    quote && side === 'BUY'
      ? amountNum / quote.effectivePrice
      : amountNum;
  const estimatedPayout =
    side === 'BUY'
      ? estimatedShares * 1
      : quote?.proceeds || 0;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Trade</h3>
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-bull animate-pulse" />
            <span className="text-xs text-dark-500">Live</span>
          </div>
        </div>
      </div>

      {/* Side Toggle */}
      <div className="p-5 border-b border-white/5">
        <div className="flex rounded-xl bg-dark-200/50 p-1">
          <button
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              side === 'BUY'
                ? 'bg-gradient-to-r from-bull/20 to-bull/10 text-bull-light shadow-glow-bull/30'
                : 'text-dark-500 hover:text-white'
            }`}
            onClick={() => setSide('BUY')}
          >
            Buy
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              side === 'SELL'
                ? 'bg-gradient-to-r from-bear/20 to-bear/10 text-bear-light shadow-glow-bear/30'
                : 'text-dark-500 hover:text-white'
            }`}
            onClick={() => setSide('SELL')}
          >
            Sell
          </button>
        </div>
      </div>

      {/* Outcome Selection */}
      <div className="p-5 border-b border-white/5">
        <label className="text-sm font-medium text-dark-500 mb-3 block">
          Pick Outcome
        </label>
        <div className="space-y-2">
          <button
            className={`w-full py-4 px-5 rounded-xl flex justify-between items-center transition-all duration-200 ${
              outcome === 'YES'
                ? 'bg-gradient-to-r from-bull/20 to-bull/5 border-2 border-bull/50 shadow-glow-bull/20'
                : 'bg-dark-200/30 border border-white/5 hover:border-white/10 hover:bg-dark-200/50'
            }`}
            onClick={() => setOutcome('YES')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                outcome === 'YES' ? 'bg-bull' : 'bg-dark-300'
              }`}>
                {outcome === 'YES' && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`font-bold ${outcome === 'YES' ? 'text-bull-light' : 'text-white'}`}>
                YES
              </span>
            </div>
            <span className={`font-bold number-display ${outcome === 'YES' ? 'text-bull-light' : 'text-dark-600'}`}>
              {formatPrice(yesPrice)}
            </span>
          </button>
          <button
            className={`w-full py-4 px-5 rounded-xl flex justify-between items-center transition-all duration-200 ${
              outcome === 'NO'
                ? 'bg-gradient-to-r from-bear/20 to-bear/5 border-2 border-bear/50 shadow-glow-bear/20'
                : 'bg-dark-200/30 border border-white/5 hover:border-white/10 hover:bg-dark-200/50'
            }`}
            onClick={() => setOutcome('NO')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                outcome === 'NO' ? 'bg-bear' : 'bg-dark-300'
              }`}>
                {outcome === 'NO' && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`font-bold ${outcome === 'NO' ? 'text-bear-light' : 'text-white'}`}>
                NO
              </span>
            </div>
            <span className={`font-bold number-display ${outcome === 'NO' ? 'text-bear-light' : 'text-dark-600'}`}>
              {formatPrice(noPrice)}
            </span>
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="p-5 border-b border-white/5">
        <label className="text-sm font-medium text-dark-500 mb-3 block">
          {side === 'BUY' ? 'Amount (USDC)' : 'Shares to Sell'}
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full py-4 px-5 pr-24 text-xl font-bold text-white glass-input rounded-xl placeholder-dark-500"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-3">
            <span className="text-dark-500 text-sm font-medium">
              {side === 'BUY' ? 'USDC' : 'Shares'}
            </span>
            <button
              className="px-3 py-1.5 rounded-lg bg-kris-500/20 text-kris-300 text-xs font-semibold hover:bg-kris-500/30 transition-colors duration-200"
              onClick={() => setAmount('100')}
            >
              Max
            </button>
          </div>
        </div>
        {/* Quick amount buttons */}
        <div className="flex space-x-2 mt-3">
          {['10', '25', '50', '100'].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                amount === val
                  ? 'bg-kris-500/20 text-kris-300 border border-kris-500/30'
                  : 'bg-dark-200/30 text-dark-500 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              ${val}
            </button>
          ))}
        </div>
      </div>

      {/* Spread Indicator */}
      {amountNum > 0 && (
        <div className="p-5 border-b border-white/5">
          <SpreadIndicator
            orderSize={amountNum}
            side={side}
            marketPrice={currentPrice}
          />
        </div>
      )}

      {/* Order Summary */}
      {quote && amountNum > 0 && (
        <div className="p-5 border-b border-white/5 bg-dark-100/30">
          <div className="space-y-3">
            {side === 'BUY' ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">You Pay</span>
                  <span className="font-semibold text-white number-display">${amountNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Est. Shares</span>
                  <span className="font-semibold text-white number-display">
                    {quoteLoading ? (
                      <span className="inline-block w-16 h-4 bg-dark-300/50 rounded animate-pulse" />
                    ) : (
                      estimatedShares.toFixed(2)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-white/5">
                  <span className="text-dark-500">Potential Return</span>
                  <span className="font-bold text-bull-light number-display">
                    {quoteLoading ? (
                      <span className="inline-block w-20 h-4 bg-dark-300/50 rounded animate-pulse" />
                    ) : (
                      `$${estimatedPayout.toFixed(2)}`
                    )}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Shares to Sell</span>
                  <span className="font-semibold text-white number-display">{amountNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-white/5">
                  <span className="text-dark-500">You Receive</span>
                  <span className="font-bold text-bull-light number-display">
                    {quoteLoading ? (
                      <span className="inline-block w-20 h-4 bg-dark-300/50 rounded animate-pulse" />
                    ) : (
                      `$${estimatedPayout.toFixed(2)}`
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="px-5 py-4 bg-bear/10 border-b border-bear/20">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-bear" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-bear-light text-sm">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="px-5 py-4 bg-bull/10 border-b border-bull/20">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-bull" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-bull-light text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Trade Button */}
      <div className="p-5">
        <button
          onClick={handleTrade}
          disabled={loading || amountNum <= 0 || !account}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-200 relative overflow-hidden ${
            loading || amountNum <= 0 || !account
              ? 'bg-dark-300 cursor-not-allowed opacity-50'
              : side === 'BUY'
              ? 'btn-gradient btn-bull'
              : 'btn-gradient btn-bear'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Processing...</span>
            </div>
          ) : !account ? (
            'Connect Wallet'
          ) : (
            `${side === 'BUY' ? 'Buy' : 'Sell'} ${outcome}`
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="px-5 pb-5">
        <p className="text-2xs text-dark-500 text-center">
          Trading involves risk. Platform takes a small spread on each trade.
        </p>
      </div>
    </div>
  );
};

export default TradePanel;
