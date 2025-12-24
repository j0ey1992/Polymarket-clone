import Img from "next/image";
import Link from "next/link";
import React from "react";
import Web3 from "web3";
import { MarketProps } from "../pages";

// Chart mini sparkline component
const MiniChart: React.FC<{ trend: "up" | "down" | "neutral" }> = ({ trend }) => {
  const paths = {
    up: "M0,20 L10,18 L20,15 L30,16 L40,12 L50,8 L60,10 L70,5 L80,3",
    down: "M0,5 L10,7 L20,10 L30,8 L40,12 L50,15 L60,14 L70,18 L80,20",
    neutral: "M0,12 L10,11 L20,13 L30,12 L40,11 L50,13 L60,12 L70,11 L80,12",
  };

  const colors = {
    up: "#10b981",
    down: "#ef4444",
    neutral: "#64748b",
  };

  return (
    <svg width="80" height="24" viewBox="0 0 80 24" fill="none" className="opacity-60">
      <path
        d={paths[trend]}
        stroke={colors[trend]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export const MarketCard: React.FC<MarketProps> = ({
  id,
  title,
  totalAmount,
  totalYes,
  totalNo,
  imageHash,
}) => {
  const volume = parseFloat(Web3.utils.fromWei(totalAmount, "ether"));
  const yesAmount = parseFloat(Web3.utils.fromWei(totalYes, "ether"));
  const noAmount = parseFloat(Web3.utils.fromWei(totalNo, "ether"));
  const total = yesAmount + noAmount;
  const yesPercent = total > 0 ? ((yesAmount / total) * 100).toFixed(0) : "50";
  const noPercent = total > 0 ? ((noAmount / total) * 100).toFixed(0) : "50";

  // Determine trend based on yes percentage
  const trend = parseInt(yesPercent) > 50 ? "up" : parseInt(yesPercent) < 50 ? "down" : "neutral";

  return (
    <div className="w-full sm:w-1/2 lg:w-1/3 p-2">
      <Link href={`/market/${id}`} passHref>
        <div className="glass-card-hover p-4 cursor-pointer group h-full">
          {/* Header with image and title */}
          <div className="flex items-start space-x-3 mb-4">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-700 ring-1 ring-dark-600">
                <Img
                  src={`https://ipfs.infura.io/ipfs/${imageHash}`}
                  width={40}
                  height={40}
                  className="object-cover"
                  alt={title}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-accent-blue transition-colors duration-200">
                {title}
              </h3>
            </div>
          </div>

          {/* Probability Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-success-light">{yesPercent}%</span>
                <span className="text-xs text-text-muted">Yes</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-text-muted">No</span>
                <span className="text-lg font-medium text-danger-light">{noPercent}%</span>
              </div>
            </div>
            <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-success to-success-light rounded-full transition-all duration-500"
                style={{ width: `${yesPercent}%` }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between pt-3 border-t border-dark-600/50">
            <div className="flex flex-col">
              <span className="text-2xs text-text-muted uppercase tracking-wider">Volume</span>
              <span className="text-sm font-medium text-text-primary">
                {volume.toFixed(2)} <span className="text-text-muted">POLY</span>
              </span>
            </div>
            <MiniChart trend={trend} />
          </div>
        </div>
      </Link>
    </div>
  );
};

// Alternative grid card for a more compact view
export const MarketCardCompact: React.FC<MarketProps & { change?: number }> = ({
  id,
  title,
  totalAmount,
  totalYes,
  totalNo,
  imageHash,
  change = 0,
}) => {
  const volume = parseFloat(Web3.utils.fromWei(totalAmount, "ether"));
  const yesAmount = parseFloat(Web3.utils.fromWei(totalYes, "ether"));
  const noAmount = parseFloat(Web3.utils.fromWei(totalNo, "ether"));
  const total = yesAmount + noAmount;
  const yesPercent = total > 0 ? ((yesAmount / total) * 100).toFixed(1) : "50.0";

  return (
    <Link href={`/market/${id}`} passHref>
      <div className="glass-card-hover p-3 cursor-pointer flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0">
          <Img
            src={`https://ipfs.infura.io/ipfs/${imageHash}`}
            width={32}
            height={32}
            className="object-cover"
            alt={title}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-text-primary truncate">{title}</h4>
          <span className="text-xs text-text-muted">{volume.toFixed(2)} POLY</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-text-primary">{yesPercent}%</p>
          <p className={`text-xs ${change >= 0 ? "text-success-light" : "text-danger-light"}`}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </p>
        </div>
      </div>
    </Link>
  );
};

export default MarketCard;
