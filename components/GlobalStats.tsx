import React from "react";

interface StatItem {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

const GlobalStats: React.FC = () => {
  // These would come from an API in a real app
  const stats: StatItem[] = [
    { label: "Total Markets", value: "2,847" },
    { label: "24H Volume", value: "$12.5M", change: "+8.2%", isPositive: true },
    { label: "Active Traders", value: "45,892", change: "+2.1%", isPositive: true },
    { label: "Open Interest", value: "$89.2M" },
    { label: "Markets Resolved", value: "1,234" },
  ];

  return (
    <div className="w-full border-b border-dark-700/50 bg-dark-850/50">
      <div className="container-app">
        <div className="flex items-center justify-between py-3 overflow-x-auto scrollbar-hide">
          <div className="flex items-center space-x-8 min-w-max">
            {/* Main stat */}
            <div className="flex items-center space-x-2">
              <span className="text-text-secondary text-sm">
                Total prediction market volume
              </span>
              <span className="text-text-primary font-semibold">$125.6M</span>
              <span className="text-danger-light text-sm">-0.18%</span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-dark-600" />

            {/* Other stats */}
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-text-muted text-sm whitespace-nowrap">
                  {stat.label}
                </span>
                <span className="text-text-primary font-medium whitespace-nowrap">
                  {stat.value}
                </span>
                {stat.change && (
                  <span
                    className={`text-sm ${
                      stat.isPositive ? "text-success-light" : "text-danger-light"
                    }`}
                  >
                    {stat.change}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Fear & Greed indicator */}
          <div className="hidden lg:flex items-center space-x-2 ml-8">
            <span className="text-text-muted text-sm">Market Sentiment</span>
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-warning/20 rounded-full">
              <div className="w-2 h-2 bg-warning rounded-full" />
              <span className="text-warning-light text-sm font-medium">Neutral</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalStats;
