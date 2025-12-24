import Head from "next/head";
import { useMemo, useState } from "react";
import {
  PolymarketHeader,
  CategoryTabs,
  TagFilters,
  MarketGrid,
} from "../components/polymarket";
import { sampleMarkets, Market } from "../types/market";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Trending");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter markets based on search query, category, and tag
  const filteredMarkets = useMemo(() => {
    let filtered = sampleMarkets;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (market) =>
          market.question.toLowerCase().includes(query) ||
          market.category.toLowerCase().includes(query) ||
          market.outcomes?.some((o) =>
            o.name.toLowerCase().includes(query)
          )
      );
    }

    // Filter by category (except Trending which shows all)
    if (activeCategory && activeCategory !== "Trending") {
      filtered = filtered.filter(
        (market) =>
          market.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    return filtered;
  }, [searchQuery, activeCategory, activeTag]);

  return (
    <div className="min-h-screen bg-poly-dark">
      <Head>
        <title>Polymarket - Prediction Markets</title>
        <meta
          name="description"
          content="Polymarket prediction markets platform"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <PolymarketHeader />

      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Tag Filters */}
      <TagFilters
        activeTag={activeTag}
        onTagChange={setActiveTag}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {filteredMarkets.length > 0 ? (
          <MarketGrid markets={filteredMarkets} />
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No markets found</p>
            <p className="text-slate-500 text-sm mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
