import React from "react";
import Link from "next/link";

// Icon components
const FireIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
  </svg>
);

const TrendingIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

interface TrendingItem {
  name: string;
  category: string;
  probability: number;
  change: number;
  volume: string;
}

interface CategoryCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: TrendingItem[];
  gradient: string;
  iconBg: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  subtitle,
  icon,
  items,
  gradient,
  iconBg,
}) => {
  return (
    <div className={`category-card relative overflow-hidden ${gradient}`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <div className={`w-full h-full ${iconBg} rounded-full blur-2xl`} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-text-primary font-semibold text-base">{title}</h3>
          <p className="text-text-muted text-xs mt-0.5">{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg ${iconBg} bg-opacity-20`}>
          <div className="text-text-primary opacity-80">{icon}</div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <Link key={index} href={`/market/${index}`} passHref>
            <div className="flex items-center justify-between py-2 cursor-pointer hover:bg-dark-700/30 -mx-2 px-2 rounded-lg transition-colors duration-150">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center">
                  <span className="text-xs font-medium text-text-secondary">
                    {item.category.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary truncate max-w-[120px]">
                    {item.name}
                  </p>
                  <p className="text-xs text-text-muted">{item.volume}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text-primary">
                  {item.probability}%
                </p>
                <p
                  className={`text-xs ${
                    item.change >= 0 ? "text-success-light" : "text-danger-light"
                  }`}
                >
                  {item.change >= 0 ? "+" : ""}
                  {item.change}%
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const TrendingSection: React.FC = () => {
  // Sample data - in real app this would come from API
  const categories = [
    {
      title: "Hot Markets",
      subtitle: "Top trending predictions",
      icon: <FireIcon />,
      gradient: "bg-gradient-to-br from-orange-500/10 to-transparent",
      iconBg: "bg-orange-500",
      items: [
        { name: "BTC $100K EOY", category: "Crypto", probability: 68, change: 6.36, volume: "$2.4M" },
        { name: "Fed Rate Cut", category: "Finance", probability: 42, change: -0.18, volume: "$1.8M" },
        { name: "ETH Flippening", category: "Crypto", probability: 12, change: 5510.13, volume: "$890K" },
      ],
    },
    {
      title: "Politics",
      subtitle: "Political predictions",
      icon: <TrendingIcon />,
      gradient: "bg-gradient-to-br from-blue-500/10 to-transparent",
      iconBg: "bg-blue-500",
      items: [
        { name: "2024 Election", category: "US", probability: 52, change: -0.37, volume: "$8.7M" },
        { name: "Senate Control", category: "US", probability: 48, change: -0.01, volume: "$2.1M" },
        { name: "UK Elections", category: "UK", probability: 65, change: -1.20, volume: "$450K" },
      ],
    },
    {
      title: "Top Movers",
      subtitle: "Biggest daily changes",
      icon: <TrendingIcon />,
      gradient: "bg-gradient-to-br from-green-500/10 to-transparent",
      iconBg: "bg-green-500",
      items: [
        { name: "Tech IPO 2024", category: "Tech", probability: 34, change: -0.15, volume: "$340K" },
        { name: "AI Regulation", category: "Tech", probability: 78, change: 5510.13, volume: "$1.2M" },
        { name: "Climate Bill", category: "Policy", probability: 23, change: 3094.99, volume: "$560K" },
      ],
    },
    {
      title: "Ending Soon",
      subtitle: "Markets closing soon",
      icon: <ClockIcon />,
      gradient: "bg-gradient-to-br from-purple-500/10 to-transparent",
      iconBg: "bg-purple-500",
      items: [
        { name: "Super Bowl", category: "Sports", probability: 56, change: 0.00, volume: "$3.2M" },
        { name: "Oscar Winner", category: "Entertainment", probability: 34, change: -3.23, volume: "$780K" },
        { name: "Earnings Beat", category: "Finance", probability: 67, change: 5.54, volume: "$1.5M" },
      ],
    },
  ];

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">Trending Today</h2>
        <Link href="/discover" passHref>
          <span className="text-sm text-accent-blue hover:text-accent-cyan cursor-pointer transition-colors duration-200">
            View all
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category, index) => (
          <CategoryCard key={index} {...category} />
        ))}
      </div>
    </section>
  );
};

export default TrendingSection;
