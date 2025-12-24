import React from "react";

interface FilterTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  variant?: "pills" | "underline";
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = "pills",
}) => {
  if (variant === "underline") {
    return (
      <div className="flex items-center space-x-6 border-b border-dark-700/50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`relative pb-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === tab
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue rounded-full" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`pill-tab ${
            activeTab === tab ? "pill-tab-active" : "pill-tab-inactive"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

// Dropdown filter for secondary filters
interface DropdownFilterProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export const DropdownFilter: React.FC<DropdownFilterProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-dark-800 border border-dark-600 rounded-xl px-4 py-2 pr-10 text-sm text-text-primary hover:border-dark-500 focus:border-accent-blue/50 focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200 cursor-pointer"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {label}: {option}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="w-4 h-4 text-text-muted"
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
      </div>
    </div>
  );
};

export default FilterTabs;
