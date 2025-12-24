import React from "react";
import { Market } from "../../types/market";
import { PolymarketCard } from "./PolymarketCard";

interface MarketGridProps {
  markets: Market[];
}

export const MarketGrid: React.FC<MarketGridProps> = ({ markets }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {markets.map((market) => (
        <PolymarketCard key={market.id} market={market} />
      ))}
    </div>
  );
};

export default MarketGrid;
