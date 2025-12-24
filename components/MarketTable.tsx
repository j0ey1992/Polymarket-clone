import Img from "next/image";
import Link from "next/link";
import React from "react";
import Web3 from "web3";
import { MarketProps } from "../pages";

// Mini sparkline chart
const SparklineChart: React.FC<{ trend: "up" | "down" | "neutral" }> = ({ trend }) => {
  const paths = {
    up: "M0,18 L8,16 L16,14 L24,15 L32,11 L40,8 L48,9 L56,5 L64,4",
    down: "M0,4 L8,6 L16,8 L24,7 L32,11 L40,14 L48,13 L56,17 L64,18",
    neutral: "M0,11 L8,10 L16,12 L24,11 L32,10 L40,12 L48,11 L56,10 L64,11",
  };

  const colors = {
    up: "#10b981",
    down: "#ef4444",
    neutral: "#64748b",
  };

  return (
    <svg width="64" height="22" viewBox="0 0 64 22" fill="none">
      <path
        d={paths[trend]}
        stroke={colors[trend]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

interface MarketTableProps {
  markets: MarketProps[];
  showIndex?: boolean;
}

const MarketTable: React.FC<MarketTableProps> = ({ markets, showIndex = true }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-700/50">
            {showIndex && <th className="table-header text-left w-12">#</th>}
            <th className="table-header text-left">Market</th>
            <th className="table-header text-right">Probability</th>
            <th className="table-header text-right hidden sm:table-cell">24H Change</th>
            <th className="table-header text-center hidden md:table-cell">24H Chart</th>
            <th className="table-header text-right hidden lg:table-cell">Volume</th>
            <th className="table-header text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((market, index) => {
            const volume = parseFloat(Web3.utils.fromWei(market.totalAmount, "ether"));
            const yesAmount = parseFloat(Web3.utils.fromWei(market.totalYes, "ether"));
            const noAmount = parseFloat(Web3.utils.fromWei(market.totalNo, "ether"));
            const total = yesAmount + noAmount;
            const yesPercent = total > 0 ? ((yesAmount / total) * 100).toFixed(1) : "50.0";

            // Simulated change (in real app this would come from API)
            const change = (Math.random() - 0.5) * 10;
            const trend = change > 1 ? "up" : change < -1 ? "down" : "neutral";

            return (
              <tr key={market.id} className="table-row group">
                {showIndex && (
                  <td className="table-cell text-text-muted font-medium">
                    {index + 1}
                  </td>
                )}
                <td className="table-cell">
                  <Link href={`/market/${market.id}`} passHref>
                    <div className="flex items-center space-x-3 cursor-pointer">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0 ring-1 ring-dark-600">
                        <Img
                          src={`https://ipfs.infura.io/ipfs/${market.imageHash}`}
                          width={32}
                          height={32}
                          className="object-cover"
                          alt={market.title}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate max-w-[200px] sm:max-w-[300px] group-hover:text-accent-blue transition-colors">
                          {market.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="table-cell text-right">
                  <span className="text-sm font-semibold text-text-primary">
                    {yesPercent}%
                  </span>
                </td>
                <td className="table-cell text-right hidden sm:table-cell">
                  <span className={`text-sm font-medium ${
                    change >= 0 ? "text-success-light" : "text-danger-light"
                  }`}>
                    {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                  </span>
                </td>
                <td className="table-cell hidden md:table-cell">
                  <div className="flex justify-center">
                    <SparklineChart trend={trend} />
                  </div>
                </td>
                <td className="table-cell text-right hidden lg:table-cell">
                  <span className="text-sm text-text-secondary">
                    {volume.toFixed(2)} POLY
                  </span>
                </td>
                <td className="table-cell text-right">
                  <Link href={`/market/${market.id}`} passHref>
                    <button className="px-4 py-1.5 text-sm font-medium text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors duration-200">
                      Trade
                    </button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {markets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">No markets found</p>
        </div>
      )}
    </div>
  );
};

export default MarketTable;
