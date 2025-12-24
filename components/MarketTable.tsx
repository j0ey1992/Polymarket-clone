import Img from "next/image";
import Link from "next/link";
import React from "react";
import Web3 from "web3";
import { MarketProps } from "../pages";

// Sparkline chart component
const Sparkline: React.FC<{ trend: "up" | "down" | "neutral" }> = ({ trend }) => {
  const colors = {
    up: "#00A68C",
    down: "#E0485C",
    neutral: "#7B849B",
  };

  const generatePath = () => {
    if (trend === "up") {
      return "M0,20 L10,18 L20,15 L30,16 L40,12 L50,10 L60,8 L70,6 L80,5 L90,3";
    } else if (trend === "down") {
      return "M0,3 L10,5 L20,8 L30,7 L40,12 L50,14 L60,16 L70,18 L80,17 L90,20";
    }
    return "M0,12 L10,11 L20,13 L30,11 L40,12 L50,10 L60,13 L70,11 L80,12 L90,11";
  };

  return (
    <svg width="90" height="24" viewBox="0 0 90 24" className="overflow-visible">
      <path
        d={generatePath()}
        stroke={colors[trend]}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

interface MarketTableProps {
  markets: MarketProps[];
}

const MarketTable: React.FC<MarketTableProps> = ({ markets }) => {
  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#1F283C] text-xs font-medium text-[#7B849B]">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-3">Name</div>
        <div className="col-span-2 text-right">Probability</div>
        <div className="col-span-1 text-right hidden sm:block">24H</div>
        <div className="col-span-1 text-right hidden md:block">1 Week</div>
        <div className="col-span-2 text-right hidden lg:block">Volume</div>
        <div className="col-span-2 text-center hidden md:block">Last 7 days</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-[#1F283C]">
        {markets.map((market, index) => {
          const volume = parseFloat(Web3.utils.fromWei(market.totalAmount, "ether"));
          const yesAmount = parseFloat(Web3.utils.fromWei(market.totalYes, "ether"));
          const noAmount = parseFloat(Web3.utils.fromWei(market.totalNo, "ether"));
          const total = yesAmount + noAmount;
          const yesPercent = total > 0 ? (yesAmount / total) * 100 : 50;

          // Simulated changes
          const change24h = (Math.random() - 0.5) * 10;
          const change7d = (Math.random() - 0.5) * 20;
          const trend = change7d > 2 ? "up" : change7d < -2 ? "down" : "neutral";

          return (
            <Link key={market.id} href={`/market/${market.id}`} passHref>
              <div className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-[#1F283C]/30 cursor-pointer transition-colors items-center">
                {/* Rank */}
                <div className="col-span-1 text-center text-sm text-[#7B849B]">
                  {index + 1}
                </div>

                {/* Name */}
                <div className="col-span-3 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1F283C] flex-shrink-0">
                    <Img
                      src={`https://ipfs.infura.io/ipfs/${market.imageHash}`}
                      width={32}
                      height={32}
                      className="object-cover"
                      alt={market.title}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {market.title}
                    </p>
                  </div>
                </div>

                {/* Probability */}
                <div className="col-span-2 text-right">
                  <span className="text-sm font-medium text-white">
                    {yesPercent.toFixed(1)}%
                  </span>
                </div>

                {/* 24H Change */}
                <div className="col-span-1 text-right hidden sm:block">
                  <span className={`text-sm ${change24h >= 0 ? "text-[#00A68C]" : "text-[#E0485C]"}`}>
                    {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
                  </span>
                </div>

                {/* 1 Week Change */}
                <div className="col-span-1 text-right hidden md:block">
                  <span className={`text-sm ${change7d >= 0 ? "text-[#00A68C]" : "text-[#E0485C]"}`}>
                    {change7d >= 0 ? "+" : ""}{change7d.toFixed(2)}%
                  </span>
                </div>

                {/* Volume */}
                <div className="col-span-2 text-right hidden lg:block">
                  <span className="text-sm text-white">
                    ${(volume * 1.5).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </span>
                </div>

                {/* Sparkline */}
                <div className="col-span-2 hidden md:flex justify-center">
                  <Sparkline trend={trend} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {markets.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#7B849B]">No markets found</p>
        </div>
      )}

      {/* Pagination */}
      {markets.length > 0 && (
        <div className="flex items-center justify-center space-x-2 py-6 border-t border-[#1F283C]">
          <button className="w-8 h-8 flex items-center justify-center text-[#7B849B] hover:text-white hover:bg-[#1F283C] rounded transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className={`w-8 h-8 flex items-center justify-center text-sm rounded transition-colors ${
                page === 1
                  ? "bg-[#1199FA] text-white"
                  : "text-[#7B849B] hover:text-white hover:bg-[#1F283C]"
              }`}
            >
              {page}
            </button>
          ))}
          <span className="text-[#7B849B]">...</span>
          <button className="w-8 h-8 flex items-center justify-center text-sm text-[#7B849B] hover:text-white hover:bg-[#1F283C] rounded transition-colors">
            50
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-[#7B849B] hover:text-white hover:bg-[#1F283C] rounded transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketTable;
