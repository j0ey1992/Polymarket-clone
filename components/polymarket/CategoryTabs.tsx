import React, { useState } from "react";
import { categories } from "../../types/market";

const TrendingIcon: React.FC = () => (
  <svg
    className="w-4 h-4 mr-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

const ChevronDownIcon: React.FC = () => (
  <svg
    className="w-4 h-4 ml-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="border-b border-slate-800 bg-poly-dark">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-2">
          {categories.map((category, index) => (
            <React.Fragment key={category.name}>
              {category.divider && (
                <div className="h-6 w-px bg-slate-700 mx-2" />
              )}
              <button
                onClick={() => onCategoryChange(category.name)}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category.name
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {category.icon === "chart" && <TrendingIcon />}
                {category.name}
                {category.icon === "chevron" && <ChevronDownIcon />}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;
