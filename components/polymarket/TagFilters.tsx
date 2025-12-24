import React, { useRef, useState } from "react";
import { tags } from "../../types/market";

const SearchIcon: React.FC = () => (
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
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const FilterIcon: React.FC = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
    />
  </svg>
);

const BookmarkIcon: React.FC = () => (
  <svg
    className="w-5 h-5"
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

const ChevronLeftIcon: React.FC = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const ChevronRightIcon: React.FC = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

interface TagFiltersProps {
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const TagFilters: React.FC<TagFiltersProps> = ({
  activeTag,
  onTagChange,
  searchQuery,
  onSearchChange,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="bg-poly-dark py-3">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="relative w-48 flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>

          {/* Filter & Bookmark Icons */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
              <FilterIcon />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
              <BookmarkIcon />
            </button>
          </div>

          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            className="p-1 text-slate-400 hover:text-slate-200 flex-shrink-0"
          >
            <ChevronLeftIcon />
          </button>

          {/* Tags Container */}
          <div
            ref={scrollContainerRef}
            className="flex items-center space-x-2 overflow-x-auto scrollbar-hide flex-1"
          >
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  onTagChange(activeTag === tag ? null : tag)
                }
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTag === tag
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            className="p-1 text-slate-400 hover:text-slate-200 flex-shrink-0"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagFilters;
