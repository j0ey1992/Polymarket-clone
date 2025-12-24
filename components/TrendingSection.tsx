import React from "react";
import Link from "next/link";

interface TrendingItem {
  name: string;
  symbol: string;
  change: number;
  icon?: string;
}

interface TrendingCardProps {
  title: string;
  items: TrendingItem[];
  type: "gainers" | "losers" | "trending" | "new";
}

const TrendingCard: React.FC<TrendingCardProps> = ({ title, items, type }) => {
  const getGradient = () => {
    switch (type) {
      case "gainers":
        return "from-[#00A68C]/10 to-transparent";
      case "losers":
        return "from-[#E0485C]/10 to-transparent";
      case "trending":
        return "from-[#1199FA]/10 to-transparent";
      case "new":
        return "from-[#C288F9]/10 to-transparent";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "gainers":
        return (
          <svg className="w-5 h-5 text-[#00A68C]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
        );
      case "losers":
        return (
          <svg className="w-5 h-5 text-[#E0485C]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
          </svg>
        );
      case "trending":
        return (
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case "new":
        return (
          <svg className="w-5 h-5 text-[#C288F9]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
    }
  };

  return (
    <div className={`bg-gradient-to-br ${getGradient()} bg-[#0B1426] rounded-xl p-4 border border-[#1F283C]`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        {getIcon()}
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <Link key={idx} href="/market/1" passHref>
            <div className="flex items-center justify-between cursor-pointer hover:bg-[#1F283C]/50 -mx-2 px-2 py-1 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#1F283C] flex items-center justify-center text-xs font-medium text-white">
                  {item.symbol.slice(0, 2)}
                </div>
                <span className="text-white text-sm font-medium">{item.name}</span>
              </div>
              <span className={`text-sm font-medium ${item.change >= 0 ? "text-[#00A68C]" : "text-[#E0485C]"}`}>
                {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const TrendingSection: React.FC = () => {
  const trendingData = {
    gainers: [
      { name: "BTC $100K EOY", symbol: "BTC", change: 15.32 },
      { name: "ETH Merge Success", symbol: "ETH", change: 8.45 },
      { name: "Fed Rate Cut", symbol: "FED", change: 6.21 },
    ],
    trending: [
      { name: "2024 Election", symbol: "POL", change: 2.15 },
      { name: "AI Regulation", symbol: "AI", change: -1.23 },
      { name: "Climate Bill", symbol: "ENV", change: 0.87 },
    ],
    losers: [
      { name: "Recession 2024", symbol: "ECO", change: -12.45 },
      { name: "Bank Crisis", symbol: "BNK", change: -8.32 },
      { name: "Tech Layoffs", symbol: "TEC", change: -5.67 },
    ],
    new: [
      { name: "Super Bowl Winner", symbol: "NFL", change: 0.00 },
      { name: "Oscar Best Picture", symbol: "OSC", change: 0.00 },
      { name: "Grammy Awards", symbol: "MUS", change: 0.00 },
    ],
  };

  return (
    <section className="py-6">
      <h2 className="text-white font-semibold text-lg mb-4">Trending today</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TrendingCard title="Top Gainers" items={trendingData.gainers} type="gainers" />
        <TrendingCard title="Trending in X" items={trendingData.trending} type="trending" />
        <TrendingCard title="Top losers" items={trendingData.losers} type="losers" />
        <TrendingCard title="Newly listed" items={trendingData.new} type="new" />
      </div>
    </section>
  );
};

export default TrendingSection;
