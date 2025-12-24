import Head from "next/head";
import Link from "next/link";
import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import PositionCard from "../components/PositionCard";
import { useData } from "../contexts/DataContext";

const Portfolio = () => {
  const { account, positions, loading, fetchPositions, connectWallet } = useData();

  useEffect(() => {
    if (account) {
      fetchPositions();
    }
  }, [account, fetchPositions]);

  const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalPnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

  return (
    <div className="min-h-screen">
      <Head>
        <title>Portfolio - Kris Market</title>
        <meta name="description" content="Your prediction market positions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!account ? (
          /* Connect Wallet CTA */
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="glass-card rounded-3xl p-12 max-w-md w-full text-center animate-fade-up">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-kris-500/20 to-accent-purple/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-kris-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
              <p className="text-dark-500 mb-8 leading-relaxed">
                Connect your wallet to view your positions, track P&L, and manage your portfolio.
              </p>
              <button
                onClick={connectWallet}
                className="btn-gradient w-full py-4 text-lg"
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>Connect Wallet</span>
                </span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Page Header */}
            <div className="mb-8 animate-fade-up">
              <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
              <p className="text-dark-500">Track your positions and manage your trades</p>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              {/* Portfolio Value */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-kris-500/20 to-transparent rounded-full transform translate-x-8 -translate-y-8" />
                <div className="relative">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-kris-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-kris-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-dark-500">Portfolio Value</span>
                  </div>
                  <div className="text-3xl font-bold text-white number-display">
                    ${totalValue.toFixed(2)}
                  </div>
                  <div className="text-sm text-dark-600 mt-1">USDC</div>
                </div>
              </div>

              {/* Total P&L */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full transform translate-x-8 -translate-y-8 ${
                  totalPnl >= 0 ? 'bg-gradient-to-br from-bull/20 to-transparent' : 'bg-gradient-to-br from-bear/20 to-transparent'
                }`} />
                <div className="relative">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      totalPnl >= 0 ? 'bg-bull/20' : 'bg-bear/20'
                    }`}>
                      {totalPnl >= 0 ? (
                        <svg className="w-5 h-5 text-bull" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-bear" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-dark-500">Total P&L</span>
                  </div>
                  <div className={`text-3xl font-bold number-display ${
                    totalPnl >= 0 ? 'text-bull-light' : 'text-bear-light'
                  }`}>
                    {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
                  </div>
                  <div className={`text-sm mt-1 ${
                    totalPnl >= 0 ? 'text-bull-light/60' : 'text-bear-light/60'
                  }`}>
                    {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Open Positions */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-purple/20 to-transparent rounded-full transform translate-x-8 -translate-y-8" />
                <div className="relative">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-dark-500">Open Positions</span>
                  </div>
                  <div className="text-3xl font-bold text-white number-display">
                    {positions.length}
                  </div>
                  <div className="text-sm text-dark-600 mt-1">Active trades</div>
                </div>
              </div>
            </div>

            {/* Positions Section */}
            <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-white">Your Positions</h2>
                  {positions.length > 0 && (
                    <span className="px-3 py-1 rounded-full glass-card text-sm font-medium text-dark-600">
                      {positions.length}
                    </span>
                  )}
                </div>
                <Link href="/" passHref>
                  <button className="flex items-center space-x-2 text-kris-400 hover:text-kris-300 transition-colors duration-200">
                    <span className="text-sm font-medium">Explore Markets</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-dark-300/50 rounded w-3/4" />
                          <div className="h-6 bg-dark-300/50 rounded w-16" />
                        </div>
                        <div className="space-y-2 text-right">
                          <div className="h-6 bg-dark-300/50 rounded w-20" />
                          <div className="h-4 bg-dark-300/50 rounded w-16" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="h-12 bg-dark-300/50 rounded" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : positions.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-200/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No positions yet</h3>
                  <p className="text-dark-500 mb-6">Start trading to see your positions here</p>
                  <Link href="/" passHref>
                    <button className="btn-gradient">
                      Explore Markets
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {positions.map((position) => (
                    <PositionCard
                      key={position.id}
                      position={position}
                      marketQuestion={position.marketId}
                      currentPrice={position.avgPrice * 1.1}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kris-500 to-accent-purple flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-sm text-dark-500">
                Kris Market - Prediction Platform
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm text-dark-600">Powered by Cronos</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-bull animate-pulse" />
                <span className="text-sm text-dark-500">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;
