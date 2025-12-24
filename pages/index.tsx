import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { MarketCard } from "../components/MarketCard";
import MarketTable from "../components/MarketTable";
import Navbar from "../components/Navbar";
import GlobalStats from "../components/GlobalStats";
import TrendingSection from "../components/TrendingSection";
import FilterTabs, { DropdownFilter } from "../components/FilterTabs";
import { useData } from "../contexts/DataContext";

export interface MarketProps {
  id: string;
  title: string;
  imageHash: string;
  totalAmount: string;
  totalYes: string;
  totalNo: string;
}

// View toggle icons
const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function Home() {
  const { polymarket, account, loadWeb3, loading } = useData();
  const [markets, setMarkets] = useState<MarketProps[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Markets");
  const [sortBy, setSortBy] = useState("Volume");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isLoading, setIsLoading] = useState(true);

  const categories = ["All Markets", "Crypto", "Politics", "Sports", "Entertainment", "Technology"];

  const getMarkets = useCallback(async () => {
    try {
      setIsLoading(true);
      var totalQuestions = await polymarket.methods
        .totalQuestions()
        .call({ from: account });
      var dataArray: MarketProps[] = [];
      for (var i = 0; i < totalQuestions; i++) {
        var data = await polymarket.methods.questions(i).call({ from: account });
        dataArray.push({
          id: data.id,
          title: data.question,
          imageHash: data.creatorImageHash,
          totalAmount: data.totalAmount,
          totalYes: data.totalYesAmount,
          totalNo: data.totalNoAmount,
        });
      }
      setMarkets(dataArray);
    } catch (error) {
      console.error("Error fetching markets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [account, polymarket]);

  useEffect(() => {
    loadWeb3().then(() => {
      if (!loading) getMarkets();
    });
  }, [loading]);

  // Filter markets based on search
  const filteredMarkets = markets.filter((market) =>
    market.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark-900">
      <Head>
        <title>PredictMarket - Prediction Markets Platform</title>
        <meta name="description" content="Trade on the outcomes of real-world events" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <GlobalStats />

      <main className="container-app py-6">
        {/* Trending Section */}
        <TrendingSection />

        {/* Markets Section */}
        <section className="mt-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-text-primary">All Markets</h2>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search markets..."
                className="input-dark pl-12"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <FilterTabs
              tabs={categories}
              activeTab={activeCategory}
              onTabChange={setActiveCategory}
            />

            <div className="flex items-center space-x-3">
              <DropdownFilter
                label="Sort"
                value={sortBy}
                options={["Volume", "Newest", "Ending Soon", "Most Active"]}
                onChange={setSortBy}
              />

              {/* View Toggle */}
              <div className="flex items-center bg-dark-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-dark-600 text-text-primary"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  <GridIcon />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-dark-600 text-text-primary"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  <ListIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Markets Display */}
          {isLoading ? (
            <div className="py-20">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-dark-600 border-t-accent-blue rounded-full animate-spin" />
                <p className="text-text-muted">Loading markets...</p>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="flex flex-wrap -mx-2">
              {filteredMarkets.length > 0 ? (
                filteredMarkets.map((market) => (
                  <MarketCard
                    key={market.id}
                    id={market.id}
                    title={market.title}
                    totalAmount={market.totalAmount}
                    totalYes={market.totalYes}
                    totalNo={market.totalNo}
                    imageHash={market.imageHash}
                  />
                ))
              ) : (
                <div className="w-full text-center py-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-800 mb-4">
                    <SearchIcon />
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">No markets found</h3>
                  <p className="text-text-muted">
                    {searchQuery
                      ? `No markets match "${searchQuery}"`
                      : "There are no markets available yet"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <MarketTable markets={filteredMarkets} />
            </div>
          )}

          {/* Load More Button */}
          {filteredMarkets.length > 0 && (
            <div className="flex justify-center mt-8">
              <button className="btn-secondary">
                Load More Markets
              </button>
            </div>
          )}
        </section>

        {/* Bottom CTA Section */}
        <section className="mt-16 mb-8">
          <div className="glass-card p-8 text-center relative overflow-hidden">
            {/* Background gradient decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/10 via-accent-purple/10 to-accent-cyan/10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-purple/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-text-primary mb-3">
                Ready to start trading?
              </h2>
              <p className="text-text-secondary mb-6 max-w-lg mx-auto">
                Connect your wallet and start trading on the outcomes of real-world events.
                Earn rewards by predicting correctly.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button className="btn-primary">
                  Get Started
                </button>
                <button className="btn-secondary">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-700/50 py-8">
        <div className="container-app">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-text-primary font-semibold">PredictMarket</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-text-muted hover:text-text-primary transition-colors text-sm">
                Terms
              </a>
              <a href="#" className="text-text-muted hover:text-text-primary transition-colors text-sm">
                Privacy
              </a>
              <a href="#" className="text-text-muted hover:text-text-primary transition-colors text-sm">
                Docs
              </a>
              <a href="#" className="text-text-muted hover:text-text-primary transition-colors text-sm">
                Support
              </a>
            </div>
            <p className="text-text-muted text-sm">
              &copy; 2024 PredictMarket. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
