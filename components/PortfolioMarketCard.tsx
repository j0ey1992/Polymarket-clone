import moment from "moment";
import Img from "next/image";
import Link from "next/link";
import React from "react";
import Web3 from "web3";

export interface MarketProps {
  id: string;
  title: string;
  imageHash: string;
  totalAmount: string;
  totalYes: string;
  totalNo: string;
  userYes: string;
  userNo: string;
  hasResolved?: boolean;
  timestamp: string;
  endTimestamp: string;
}

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const PortfolioMarketCard: React.FC<MarketProps> = ({
  title,
  userYes,
  userNo,
  id,
  imageHash,
  totalYes,
  totalNo,
  totalAmount,
  hasResolved,
  timestamp,
  endTimestamp,
}) => {
  const endingOn = moment(parseInt(endTimestamp));
  const now = moment(new Date());
  const daysLeft = moment.duration(endingOn.diff(now)).asDays().toFixed(0);
  const isExpired = parseInt(daysLeft) <= 0;

  const outcome = userYes ? "YES" : "NO";
  const amount = userYes ?? userNo;
  const amountFormatted = Web3.utils.fromWei(amount);

  // Calculate current probability
  const yesAmount = parseFloat(Web3.utils.fromWei(totalYes, "ether"));
  const noAmount = parseFloat(Web3.utils.fromWei(totalNo, "ether"));
  const total = yesAmount + noAmount;
  const currentProb = outcome === "YES"
    ? (total > 0 ? (yesAmount / total) * 100 : 50)
    : (total > 0 ? (noAmount / total) * 100 : 50);

  // Simulated P&L (in real app this would be calculated from entry price)
  const pnlPercent = (Math.random() - 0.3) * 20;
  const pnlPositive = pnlPercent >= 0;

  return (
    <div className="glass-card-hover p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Market Info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-700 flex-shrink-0 ring-1 ring-dark-600">
            <Img
              src={`https://ipfs.infura.io/ipfs/${imageHash}`}
              width={48}
              height={48}
              className="object-cover"
              alt={title}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/market/${id}`} passHref>
              <h3 className="text-sm font-medium text-text-primary truncate hover:text-accent-blue transition-colors cursor-pointer">
                {title}
              </h3>
            </Link>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                outcome === "YES"
                  ? "bg-success/20 text-success-light"
                  : "bg-danger/20 text-danger-light"
              }`}>
                {outcome}
              </span>
              <span className="text-xs text-text-muted">
                {currentProb.toFixed(1)}% probability
              </span>
            </div>
          </div>
        </div>

        {/* Position Details */}
        <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8">
          {/* Amount */}
          <div className="text-left sm:text-right">
            <span className="text-xs text-text-muted block">Position</span>
            <span className="text-sm font-semibold text-text-primary">
              {parseFloat(amountFormatted).toFixed(2)} POLY
            </span>
          </div>

          {/* P&L */}
          <div className="text-left sm:text-right">
            <span className="text-xs text-text-muted block">P&L</span>
            <span className={`text-sm font-semibold ${
              pnlPositive ? "text-success-light" : "text-danger-light"
            }`}>
              {pnlPositive ? "+" : ""}{pnlPercent.toFixed(2)}%
            </span>
          </div>

          {/* Time Left */}
          <div className="text-left sm:text-right hidden md:block">
            <span className="text-xs text-text-muted block">Status</span>
            <div className="flex items-center space-x-1">
              {hasResolved ? (
                <span className="text-sm font-medium text-accent-purple">Resolved</span>
              ) : isExpired ? (
                <span className="text-sm font-medium text-warning">Ended</span>
              ) : (
                <>
                  <ClockIcon />
                  <span className="text-sm font-medium text-text-primary">{daysLeft}d left</span>
                </>
              )}
            </div>
          </div>

          {/* Trade Button */}
          <Link href={`/market/${id}`} passHref>
            <button className="px-4 py-2 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue text-sm font-medium rounded-lg transition-colors duration-200">
              Trade
            </button>
          </Link>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 pt-4 border-t border-dark-600/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-muted">Market Probability</span>
          <span className="text-xs text-text-secondary">
            {(total > 0 ? (yesAmount / total) * 100 : 50).toFixed(1)}% Yes
          </span>
        </div>
        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-success to-success-light rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? (yesAmount / total) * 100 : 50}%` }}
          />
        </div>
      </div>

      {/* Entry Info */}
      <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
        <span>
          Entered: {timestamp ? moment(parseInt(timestamp) * 1000).format("MMM D, YYYY h:mm A") : "N/A"}
        </span>
        <span>
          Ends: {endTimestamp ? moment(parseInt(endTimestamp)).format("MMM D, YYYY") : "N/A"}
        </span>
      </div>
    </div>
  );
};
