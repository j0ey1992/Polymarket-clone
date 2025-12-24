import moment from "moment";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import TradePanel from "../../components/TradePanel";
import OrderBook from "../../components/OrderBook";
import { useData, Market } from "../../contexts/DataContext";

const MarketDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const { account, getMarket, connectWallet } = useData();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO'>('YES');

  useEffect(() => {
    if (id && typeof id === "string") {
      setLoading(true);
      getMarket(id).then((data) => {
        setMarket(data);
        setLoading(false);
      });
    }
  }, [id, getMarket]);

  const formatVolume = (vol: number | undefined) => {
    if (!vol) return "$0";
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const yesPrice = market?.currentPrice?.yes || 0.5;
  const noPrice = market?.currentPrice?.no || 0.5;

  const getImageUrl = (url: string | undefined) => {
    if (!url) return "/vercel.svg";
    if (url.startsWith("http")) return url;
    return "/vercel.svg";
  };

  return (
    <div className="min-h-screen">
      <Head>
        <title>{market?.question || "Market"} - Kris Market</title>
        <meta name="description" content={market?.description || "Prediction market"} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="animate-pulse">
            {/* Back button skeleton */}
            <div className="h-10 w-32 bg-dark-300/50 rounded-xl mb-6" />

            {/* Header skeleton */}
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-20 h-20 rounded-xl bg-dark-300/50" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-dark-300/50 rounded w-3/4" />
                  <div className="h-4 bg-dark-300/50 rounded w-1/2" />
                </div>
              </div>
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card rounded-2xl p-6 h-96" />
              <div className="glass-card rounded-2xl p-6 h-96" />
            </div>
          </div>
        ) : !market ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-200/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Market not found</h3>
            <p className="text-dark-500 mb-6">The market you're looking for doesn't exist or has been removed.</p>
            <Link href="/" passHref>
              <button className="btn-gradient">
                Back to Markets
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Back Button */}
            <Link href="/" passHref>
              <button className="flex items-center space-x-2 text-dark-500 hover:text-white transition-colors duration-200 mb-6 group">
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back to Markets</span>
              </button>
            </Link>

            {/* Market Header */}
            <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-up">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden ring-2 ring-white/10">
                    <img
                      src={getImageUrl(market.imageUrl)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/vercel.svg";
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-dark-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-bull animate-pulse" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white mb-3">{market.question}</h1>
                  <div className="flex flex-wrap gap-3">
                    <div className="stat-card !p-3 !rounded-lg">
                      <span className="text-2xs uppercase tracking-wider text-dark-500 font-medium block">
                        Volume
                      </span>
                      <span className="text-sm font-bold text-white number-display">
                        {formatVolume(market.volume)}
                      </span>
                    </div>
                    <div className="stat-card !p-3 !rounded-lg">
                      <span className="text-2xs uppercase tracking-wider text-dark-500 font-medium block">
                        Ends
                      </span>
                      <span className="text-sm font-bold text-white">
                        {market.endDate ? moment(market.endDate).format("MMM D, YYYY") : "N/A"}
                      </span>
                    </div>
                    <div className="stat-card !p-3 !rounded-lg">
                      <span className="text-2xs uppercase tracking-wider text-dark-500 font-medium block">
                        Spread
                      </span>
                      <span className="text-sm font-bold text-white">2%</span>
                    </div>
                  </div>
                </div>

                {/* Quick Price Display */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <div className="price-tag-bull px-5 py-3 rounded-xl text-center min-w-[100px]">
                    <div className="text-2xl font-bold number-display">
                      {(yesPrice * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs font-medium opacity-75">YES</div>
                  </div>
                  <div className="price-tag-bear px-5 py-3 rounded-xl text-center min-w-[100px]">
                    <div className="text-2xl font-bold number-display">
                      {(noPrice * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs font-medium opacity-75">NO</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Market Info & Order Book */}
              <div className="lg:col-span-2 space-y-6">
                {/* Price Display */}
                <div className="glass-card rounded-2xl p-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                  <h3 className="text-lg font-bold text-white mb-4">Current Prices</h3>

                  {/* Large Price Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div
                      className={`p-6 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedOutcome === 'YES'
                          ? 'bg-gradient-to-br from-bull/20 to-bull/5 border-2 border-bull/50 shadow-glow-bull/30'
                          : 'bg-dark-200/30 border border-white/5 hover:border-white/10'
                      }`}
                      onClick={() => setSelectedOutcome('YES')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-dark-500">YES</span>
                        {selectedOutcome === 'YES' && (
                          <svg className="w-5 h-5 text-bull" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className={`text-4xl font-bold number-display ${
                        selectedOutcome === 'YES' ? 'text-bull-light' : 'text-white'
                      }`}>
                        {(yesPrice * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div
                      className={`p-6 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedOutcome === 'NO'
                          ? 'bg-gradient-to-br from-bear/20 to-bear/5 border-2 border-bear/50 shadow-glow-bear/30'
                          : 'bg-dark-200/30 border border-white/5 hover:border-white/10'
                      }`}
                      onClick={() => setSelectedOutcome('NO')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-dark-500">NO</span>
                        {selectedOutcome === 'NO' && (
                          <svg className="w-5 h-5 text-bear" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className={`text-4xl font-bold number-display ${
                        selectedOutcome === 'NO' ? 'text-bear-light' : 'text-white'
                      }`}>
                        {(noPrice * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-dark-500 uppercase tracking-wider mb-3">
                      Description
                    </h4>
                    <p className="text-dark-600 leading-relaxed whitespace-pre-wrap">
                      {market.description || "No description available for this market."}
                    </p>
                  </div>
                </div>

                {/* Order Book */}
                <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
                  <OrderBook
                    marketId={market.id}
                    outcome={selectedOutcome}
                  />
                </div>
              </div>

              {/* Right Column - Trade Panel */}
              <div className="lg:col-span-1 animate-fade-up" style={{ animationDelay: "0.15s" }}>
                <div className="sticky top-24">
                  <TradePanel
                    marketId={market.id}
                    question={market.question}
                    yesPrice={yesPrice}
                    noPrice={noPrice}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MarketDetails;
