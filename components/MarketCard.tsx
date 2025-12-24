import Link from "next/link";
import React from "react";

interface MarketCardProps {
  id: string;
  title: string;
  totalAmount: string;
  totalYes: string;
  totalNo: string;
  imageHash: string;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  id,
  title,
  totalAmount,
  totalYes,
  totalNo,
  imageHash,
}) => {
  const formatVolume = (vol: string) => {
    const num = parseFloat(vol) || 0;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price) || 0.5;
    return `${(num * 100).toFixed(0)}`;
  };

  const getImageUrl = (url: string) => {
    if (!url || url === "QmPlaceholder") {
      return "/vercel.svg";
    }
    if (url.startsWith("http")) {
      return url;
    }
    return `https://ipfs.io/ipfs/${url}`;
  };

  const yesPercent = parseFloat(totalYes) || 0.5;
  const noPercent = parseFloat(totalNo) || 0.5;

  return (
    <div className="w-full sm:w-1/2 lg:w-1/3 p-2">
      <Link href={`/market/${id}`} passHref>
        <div className="group relative glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer h-full">
          {/* Animated gradient border on hover */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-kris-500/0 via-kris-500/0 to-accent-purple/0 group-hover:from-kris-500/20 group-hover:via-accent-purple/20 group-hover:to-accent-cyan/20 transition-all duration-500" />

          {/* Content */}
          <div className="relative p-5">
            {/* Header with image and title */}
            <div className="flex items-start space-x-4 mb-4">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-white/10 group-hover:ring-kris-500/30 transition-all duration-300">
                  <img
                    src={getImageUrl(imageHash)}
                    alt=""
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/vercel.svg";
                    }}
                  />
                </div>
                {/* Live indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-dark-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-bull animate-pulse" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-kris-300 transition-colors duration-200">
                  {title}
                </h3>
              </div>
            </div>

            {/* Price Progress Bar */}
            <div className="relative h-2 rounded-full overflow-hidden mb-4 bg-dark-300/50">
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-bull to-bull-light transition-all duration-500"
                style={{ width: `${yesPercent * 100}%` }}
              />
              <div
                className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-bear to-bear-light transition-all duration-500"
                style={{ width: `${noPercent * 100}%` }}
              />
              {/* Center divider */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-dark-100 transform -translate-x-1/2" />
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between">
              {/* Volume */}
              <div className="flex flex-col">
                <span className="text-2xs uppercase tracking-wider text-dark-500 font-medium mb-0.5">
                  Volume
                </span>
                <span className="text-sm font-bold text-white number-display">
                  {formatVolume(totalAmount)}
                </span>
              </div>

              {/* Yes/No Prices */}
              <div className="flex items-center space-x-2">
                <div className="price-tag-bull px-3 py-1.5 rounded-lg">
                  <div className="flex items-center space-x-1.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-bold number-display">
                      {formatPrice(totalYes)}%
                    </span>
                  </div>
                </div>

                <div className="price-tag-bear px-3 py-1.5 rounded-lg">
                  <div className="flex items-center space-x-1.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-bold number-display">
                      {formatPrice(totalNo)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Trade Buttons - Show on Hover */}
            <div className="mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <div className="flex space-x-2">
                <button
                  className="flex-1 py-2 rounded-lg bg-bull/20 hover:bg-bull/30 border border-bull/30 text-bull-light text-xs font-semibold transition-all duration-200"
                  onClick={(e) => e.preventDefault()}
                >
                  Buy Yes
                </button>
                <button
                  className="flex-1 py-2 rounded-lg bg-bear/20 hover:bg-bear/30 border border-bear/30 text-bear-light text-xs font-semibold transition-all duration-200"
                  onClick={(e) => e.preventDefault()}
                >
                  Buy No
                </button>
              </div>
            </div>
          </div>

          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-kris-500/50 to-transparent" />
            <div className="absolute inset-y-0 -right-px w-px bg-gradient-to-b from-transparent via-accent-purple/50 to-transparent" />
          </div>
        </div>
      </Link>
    </div>
  );
};
