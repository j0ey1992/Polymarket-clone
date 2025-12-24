import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

export default function Home() {
  const { polymarket, account, loadWeb3, loading } = useData();
  const [markets, setMarkets] = useState<MarketProps[]>([]);
  const [activeCategory, setActiveCategory] = useState("All Markets");
  const [currency, setCurrency] = useState("USD");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [isLoading, setIsLoading] = useState(true);

  const categories = ["All Markets", "Crypto", "Politics", "Sports", "Entertainment", "Technology", "Gainers", "Losers"];

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

  return (
    <div className="min-h-screen bg-[#080d1b]">
      <Head>
        <title>PredictX - Prediction Markets</title>
        <meta name="description" content="Trade on prediction markets" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <GlobalStats />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-12">
        {/* Trending Section */}
        <TrendingSection />

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-[#1F283C]">
          <FilterTabs
            tabs={categories}
            activeTab={activeCategory}
            onTabChange={setActiveCategory}
          />

          <div className="flex items-center space-x-3">
            <DropdownFilter
              value={currency}
              options={["USD", "ETH", "BTC"]}
              onChange={setCurrency}
            />
            <DropdownFilter
              value={categoryFilter}
              options={["All categories", "Crypto", "Politics", "Sports", "Entertainment"]}
              onChange={setCategoryFilter}
            />
          </div>
        </div>

        {/* Markets Table */}
        <div className="bg-[#0B1426] rounded-xl border border-[#1F283C] mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#1F283C] border-t-[#1199FA] rounded-full animate-spin mb-4" />
              <p className="text-[#7B849B] text-sm">Loading markets...</p>
            </div>
          ) : (
            <MarketTable markets={markets} />
          )}
        </div>

        {/* Bottom Promo Sections */}
        <div className="mt-12 space-y-8">
          {/* Balances Section */}
          <div className="bg-[#0B1426] rounded-xl border border-[#1F283C] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold text-lg">Balances</h3>
                <p className="text-[#7B849B] text-sm mt-1">
                  Explore your prediction portfolio with a secure wallet connection
                </p>
              </div>
              <button
                onClick={() => loadWeb3()}
                className="px-6 py-2 bg-[#1199FA] hover:bg-[#0577DA] text-white text-sm font-medium rounded-lg transition-colors"
              >
                View all
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[
                { name: "Trade", icon: "📈" },
                { name: "Deposit", icon: "💰" },
                { name: "Withdraw", icon: "💸" },
                { name: "History", icon: "📋" },
              ].map((action) => (
                <button
                  key={action.name}
                  className="flex flex-col items-center justify-center p-4 bg-[#1F283C]/50 hover:bg-[#1F283C] rounded-xl transition-colors"
                >
                  <span className="text-2xl mb-2">{action.icon}</span>
                  <span className="text-white text-sm font-medium">{action.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Earn Section */}
          <div className="bg-[#0B1426] rounded-xl border border-[#1F283C] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-white font-semibold text-lg">Earn</h3>
                <p className="text-[#7B849B] text-sm mt-1">
                  Securely grow your assets with fixed reward rates and regular payouts.
                </p>
              </div>
              <button className="px-6 py-2 bg-[#1199FA] hover:bg-[#0577DA] text-white text-sm font-medium rounded-lg transition-colors">
                View all
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "Staking", rate: "Up to 12%", icon: "🔐" },
                { name: "Liquidity", rate: "Up to 8%", icon: "💧" },
                { name: "Lending", rate: "Up to 6%", icon: "🏦" },
                { name: "Rewards", rate: "Up to 5%", icon: "🎁" },
              ].map((earn) => (
                <div
                  key={earn.name}
                  className="p-4 bg-[#1F283C]/50 rounded-xl"
                >
                  <span className="text-2xl">{earn.icon}</span>
                  <p className="text-white font-medium mt-2">{earn.name}</p>
                  <p className="text-[#00A68C] text-sm mt-1">{earn.rate}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1F283C] bg-[#0B1426] mt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-8">
            {/* Logo Column */}
            <div className="col-span-2">
              <Link href="/" passHref>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-[#1199FA] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg">PredictX</span>
                </div>
              </Link>
              <p className="text-[#7B849B] text-sm mt-4 max-w-xs">
                The leading prediction markets platform. Trade on the outcomes of real-world events.
              </p>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-white font-semibold mb-4">Products</h4>
              <ul className="space-y-3">
                {["Markets", "Portfolio", "Leaderboard", "API"].map((item) => (
                  <li key={item}>
                    <Link href="#" passHref>
                      <span className="text-[#7B849B] hover:text-white text-sm cursor-pointer transition-colors">
                        {item}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                {["About", "Careers", "Blog", "Press"].map((item) => (
                  <li key={item}>
                    <Link href="#" passHref>
                      <span className="text-[#7B849B] hover:text-white text-sm cursor-pointer transition-colors">
                        {item}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-3">
                {["Documentation", "Help Center", "Community", "Status"].map((item) => (
                  <li key={item}>
                    <Link href="#" passHref>
                      <span className="text-[#7B849B] hover:text-white text-sm cursor-pointer transition-colors">
                        {item}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                {["Terms", "Privacy", "Cookies", "Licenses"].map((item) => (
                  <li key={item}>
                    <Link href="#" passHref>
                      <span className="text-[#7B849B] hover:text-white text-sm cursor-pointer transition-colors">
                        {item}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t border-[#1F283C]">
            <p className="text-[#7B849B] text-sm">
              &copy; 2024 PredictX. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              {/* Social Icons */}
              <a href="#" className="text-[#7B849B] hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="text-[#7B849B] hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
                </svg>
              </a>
              <a href="#" className="text-[#7B849B] hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-[#7B849B] hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            </div>
            {/* Language Selector */}
            <div className="flex items-center space-x-2 text-[#7B849B]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="text-sm">English</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
