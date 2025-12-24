import Link from "next/link";
import React from "react";
import { Market } from "../../types/market";

interface PolymarketCardProps {
  market: Market;
}

const YesNoButtons: React.FC<{ small?: boolean }> = ({ small = true }) => (
  <div className={`flex ${small ? 'space-x-1' : 'space-x-2 flex-1'}`}>
    <button
      className={`${
        small
          ? 'px-2 py-0.5 text-xs'
          : 'flex-1 py-2 text-sm font-medium'
      } bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors`}
    >
      Yes
    </button>
    <button
      className={`${
        small
          ? 'px-2 py-0.5 text-xs'
          : 'flex-1 py-2 text-sm font-medium'
      } bg-rose-500/20 text-rose-400 rounded hover:bg-rose-500/30 transition-colors`}
    >
      No
    </button>
  </div>
);

const ChanceBadge: React.FC<{ probability: number }> = ({ probability }) => (
  <div className="absolute top-3 right-3 w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-600 flex flex-col items-center justify-center">
    <span className="text-lg font-bold text-white">
      {Math.round(probability * 100)}%
    </span>
    <span className="text-[10px] text-slate-400">chance</span>
  </div>
);

const OutcomeRow: React.FC<{
  name: string;
  probability: number;
  showButtons?: boolean;
}> = ({ name, probability, showButtons = true }) => (
  <div className="flex justify-between items-center py-1.5">
    <span className="text-sm text-slate-300 truncate flex-1 mr-2">{name}</span>
    <div className="flex items-center space-x-2">
      <span className="text-white font-semibold text-sm">
        {Math.round(probability * 100)}%
      </span>
      {showButtons && <YesNoButtons small />}
    </div>
  </div>
);

const BookmarkIcon: React.FC = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
    />
  </svg>
);

const GiftIcon: React.FC = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
    />
  </svg>
);

const ShareIcon: React.FC = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

export const PolymarketCard: React.FC<PolymarketCardProps> = ({ market }) => {
  const isBinary = market.type === 'binary';
  const isSports = market.type === 'sports';

  return (
    <Link href={`/market/${market.id}`} passHref>
      <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-4 hover:border-slate-600 transition-colors cursor-pointer relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-slate-700 flex-shrink-0 overflow-hidden">
            {market.image ? (
              <img
                src={market.image}
                alt={market.question}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
            )}
          </div>
          <h3 className="text-white font-medium text-sm leading-tight line-clamp-2 flex-1 pr-8">
            {market.question}
          </h3>
        </div>

        {/* Chance Badge for Binary Markets */}
        {isBinary && market.probability !== undefined && (
          <ChanceBadge probability={market.probability} />
        )}

        {/* Body */}
        <div className="flex-1">
          {/* Sports Card */}
          {isSports && market.homeTeam && market.awayTeam && (
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{market.homeTeam.flag}</span>
                  <span className="text-white">{market.homeTeam.score}</span>
                  <span className="text-slate-300">{market.homeTeam.name}</span>
                </div>
                <span className="text-white font-semibold">
                  {market.outcomes?.[0] && Math.round(market.outcomes[0].probability * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{market.awayTeam.flag}</span>
                  <span className="text-white">{market.awayTeam.score}</span>
                  <span className="text-slate-300">{market.awayTeam.name}</span>
                </div>
                <span className="text-white font-semibold">
                  {market.outcomes?.[1] && Math.round(market.outcomes[1].probability * 100)}%
                </span>
              </div>
              <div className="flex space-x-2 mt-3">
                <button className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg font-medium hover:bg-green-500/30 transition-colors">
                  {market.homeTeam.name}
                </button>
                <button className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors">
                  DRAW
                </button>
                <button className="flex-1 py-2 bg-amber-500/20 text-amber-400 rounded-lg font-medium hover:bg-amber-500/30 transition-colors">
                  {market.awayTeam.name}
                </button>
              </div>
              {market.matchTime && (
                <div className="flex items-center space-x-2 mt-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-slate-400 text-xs">{market.matchTime}</span>
                </div>
              )}
            </div>
          )}

          {/* Multiple Outcomes Card */}
          {market.type === 'multiple' && market.outcomes && (
            <div className="space-y-0.5">
              {market.outcomes.slice(0, 2).map((outcome, index) => (
                <OutcomeRow
                  key={index}
                  name={outcome.name}
                  probability={outcome.probability}
                />
              ))}
            </div>
          )}

          {/* Binary Card - Large Yes/No Buttons */}
          {isBinary && (
            <div className="mt-4">
              <YesNoButtons small={false} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-xs">{market.volume}</span>
            {isSports && (
              <span className="text-slate-500 text-xs">• ACN</span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            {!isSports && (
              <button className="hover:text-slate-300 transition-colors p-1">
                <ShareIcon />
              </button>
            )}
            <button className="hover:text-slate-300 transition-colors p-1">
              <GiftIcon />
            </button>
            <button className="hover:text-slate-300 transition-colors p-1">
              <BookmarkIcon />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PolymarketCard;
