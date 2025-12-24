import React from "react";

const GlobalStats: React.FC = () => {
  return (
    <div className="bg-[#080d1b] border-b border-[#1F283C] py-2">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center space-x-6 text-xs overflow-x-auto scrollbar-hide">
          <span className="text-[#7B849B] whitespace-nowrap">
            The global prediction market cap is{" "}
            <span className="text-white">$125.6M</span>
            <span className="text-[#E0485C] ml-1">-0.18%</span>
          </span>

          <span className="text-[#7B849B] whitespace-nowrap">
            24h Volume:{" "}
            <span className="text-white">$12.5M</span>
          </span>

          <span className="text-[#7B849B] whitespace-nowrap">
            # Markets:{" "}
            <span className="text-white">2,847</span>
          </span>

          <span className="text-[#7B849B] whitespace-nowrap hidden sm:inline">
            Active Traders:{" "}
            <span className="text-white">45,892</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalStats;
