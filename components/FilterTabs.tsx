import React from "react";

interface FilterTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === tab
              ? "bg-[#1F283C] text-white"
              : "text-[#7B849B] hover:text-white hover:bg-[#1F283C]/50"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

// Dropdown filter
interface DropdownFilterProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export const DropdownFilter: React.FC<DropdownFilterProps> = ({
  value,
  options,
  onChange,
}) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#0B1426] border border-[#1F283C] rounded-lg px-3 py-2 pr-8 text-sm text-white hover:border-[#323C52] focus:border-[#1199FA] focus:outline-none transition-colors cursor-pointer"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="w-4 h-4 text-[#7B849B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default FilterTabs;
