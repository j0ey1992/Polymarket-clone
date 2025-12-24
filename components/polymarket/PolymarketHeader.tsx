import Link from "next/link";
import React from "react";

const SearchIcon: React.FC = () => (
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
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const InfoIcon: React.FC = () => (
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
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const MenuIcon: React.FC = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const PolymarketLogo: React.FC = () => (
  <div className="flex items-center space-x-2">
    <svg
      className="w-8 h-8 text-white"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
    </svg>
    <span className="text-xl font-semibold text-white">Polymarket</span>
  </div>
);

export const PolymarketHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-poly-dark border-b border-slate-800">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" passHref>
          <a className="flex-shrink-0">
            <PolymarketLogo />
          </a>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-8 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search polymarket"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-slate-500 text-sm font-mono">/</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* How it works */}
          <button className="hidden sm:flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 transition-colors">
            <InfoIcon />
            <span className="text-sm">How it works</span>
          </button>

          {/* Auth Buttons */}
          <button className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
            Log In
          </button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Sign Up
          </button>

          {/* Menu */}
          <button className="text-slate-400 hover:text-white transition-colors p-1">
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  );
};

export default PolymarketHeader;
