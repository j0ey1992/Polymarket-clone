import Head from "next/head";
import { useEffect, useState } from "react";
import { Filter } from "../components/Filter";
import { MarketCard } from "../components/MarketCard";
import Navbar from "../components/Navbar";
import { useData } from "../contexts/DataContext";

export default function Home() {
  const { markets, loading, fetchMarkets } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Volume");

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const filteredMarkets = markets.filter((market) =>
    market.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Head>
        <title>Kris Market - Prediction Platform</title>
        <meta name="description" content="Trade on future events with Kris Market prediction platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-glow opacity-40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-up">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-card mb-6">
              <div className="w-2 h-2 rounded-full bg-bull animate-pulse" />
              <span className="text-sm font-medium text-dark-600">Live Markets</span>
              <span className="text-sm font-bold text-white">{markets.length}</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Predict the{" "}
              <span className="text-gradient">Future</span>
            </h1>
            <p className="text-xl text-dark-500 max-w-2xl mx-auto leading-relaxed">
              Trade on real-world events with the most advanced prediction market platform.
              Powered by Cronos blockchain.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="stat-card min-w-[160px]">
                <div className="text-3xl font-bold text-white number-display">$2.4M+</div>
                <div className="text-sm text-dark-500 mt-1">Total Volume</div>
              </div>
              <div className="stat-card min-w-[160px]">
                <div className="text-3xl font-bold text-white number-display">{markets.length}</div>
                <div className="text-sm text-dark-500 mt-1">Active Markets</div>
              </div>
              <div className="stat-card min-w-[160px]">
                <div className="text-3xl font-bold text-white number-display">2%</div>
                <div className="text-sm text-dark-500 mt-1">Platform Spread</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Search and Filters */}
        <div className="glass-card rounded-2xl p-6 mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                <svg className="w-5 h-5 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 px-4 pl-12 text-white glass-input rounded-xl placeholder-dark-500"
                placeholder="Search markets..."
                autoComplete="off"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Filter
                list={["All", "Crypto", "Sports", "Politics", "Entertainment"]}
                activeItem={category}
                category="Category"
                onChange={setCategory}
              />
              <Filter
                list={["Volume", "Newest", "Expiring"]}
                activeItem={sortBy}
                category="Sort By"
                onChange={setSortBy}
              />
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-white">Markets</h2>
            <span className="px-3 py-1 rounded-full glass-card text-sm font-medium text-dark-600">
              {filteredMarkets.length} results
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-bull animate-pulse" />
            <span className="text-sm text-dark-500">Live</span>
          </div>
        </div>

        {/* Market Grid */}
        {loading ? (
          <div className="flex flex-wrap -mx-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full sm:w-1/2 lg:w-1/3 p-2">
                <div className="glass-card rounded-2xl p-5 h-[240px] animate-pulse">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-dark-300/50" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-dark-300/50 rounded w-3/4" />
                      <div className="h-4 bg-dark-300/50 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-2 bg-dark-300/50 rounded-full mb-4" />
                  <div className="flex justify-between">
                    <div className="h-8 w-20 bg-dark-300/50 rounded" />
                    <div className="flex space-x-2">
                      <div className="h-8 w-16 bg-dark-300/50 rounded" />
                      <div className="h-8 w-16 bg-dark-300/50 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-200/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No markets found</h3>
            <p className="text-dark-500">
              {searchQuery
                ? "Try adjusting your search query"
                : "Start the backend to sync from Polymarket"}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap -mx-2">
            {filteredMarkets.map((market, index) => (
              <MarketCard
                key={market.id}
                id={market.id}
                title={market.question}
                imageHash={market.imageUrl || ""}
                totalAmount={market.volume?.toString() || "0"}
                totalYes={market.currentPrice?.yes?.toString() || "0.5"}
                totalNo={market.currentPrice?.no?.toString() || "0.5"}
              />
            ))}
          </div>
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
}
