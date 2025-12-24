import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';

interface WalletPanelProps {
  className?: string;
}

const WalletPanel: React.FC<WalletPanelProps> = ({ className = '' }) => {
  const { account, usdcBalance, treasuryBalance, depositUSDC, withdrawUSDC, refreshBalances } = useData();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await depositUSDC(amount);
      if (result) {
        setSuccess(`Successfully deposited $${amount} USDC`);
        setAmount('');
      } else {
        setError('Deposit failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(treasuryBalance)) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await withdrawUSDC(amount);
      if (result) {
        setSuccess(`Successfully withdrew $${amount} USDC`);
        setAmount('');
      } else {
        setError('Withdrawal failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return null;
  }

  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Wallet</h3>
          <button
            onClick={refreshBalances}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
            title="Refresh balances"
          >
            <svg className="w-4 h-4 text-dark-500 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Balances */}
      <div className="p-5 border-b border-white/5">
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card !p-4">
            <span className="text-2xs uppercase tracking-wider text-dark-500 font-medium block mb-1">
              Wallet USDC
            </span>
            <span className="text-xl font-bold text-white number-display">
              ${usdcBalance}
            </span>
          </div>
          <div className="stat-card !p-4 !bg-gradient-to-br !from-kris-500/10 !to-accent-purple/10 !border-kris-500/20">
            <span className="text-2xs uppercase tracking-wider text-dark-500 font-medium block mb-1">
              Trading Balance
            </span>
            <span className="text-xl font-bold text-kris-300 number-display">
              ${treasuryBalance}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-5 border-b border-white/5">
        <div className="flex rounded-xl bg-dark-200/50 p-1">
          <button
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'deposit'
                ? 'bg-gradient-to-r from-bull/20 to-bull/10 text-bull-light'
                : 'text-dark-500 hover:text-white'
            }`}
            onClick={() => setActiveTab('deposit')}
          >
            Deposit
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'withdraw'
                ? 'bg-gradient-to-r from-bear/20 to-bear/10 text-bear-light'
                : 'text-dark-500 hover:text-white'
            }`}
            onClick={() => setActiveTab('withdraw')}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="p-5 border-b border-white/5">
        <label className="text-sm font-medium text-dark-500 mb-3 block">
          Amount (USDC)
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full py-4 px-5 pr-20 text-xl font-bold text-white glass-input rounded-xl placeholder-dark-500"
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-kris-500/20 text-kris-300 text-xs font-semibold hover:bg-kris-500/30 transition-colors duration-200"
            onClick={() => setAmount(activeTab === 'deposit' ? usdcBalance : treasuryBalance)}
          >
            Max
          </button>
        </div>

        {/* Quick amounts */}
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

      {/* Action Button */}
      <div className="p-5">
        <button
          onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-200 ${
            loading || !amount || parseFloat(amount) <= 0
              ? 'bg-dark-300 cursor-not-allowed opacity-50'
              : activeTab === 'deposit'
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
          ) : activeTab === 'deposit' ? (
            'Deposit USDC'
          ) : (
            'Withdraw USDC'
          )}
        </button>
      </div>

      {/* Info */}
      <div className="px-5 pb-5">
        <p className="text-2xs text-dark-500 text-center">
          {activeTab === 'deposit'
            ? 'Deposit USDC to your trading balance to place bets'
            : 'Withdraw USDC from your trading balance to your wallet'}
        </p>
      </div>
    </div>
  );
};

export default WalletPanel;
