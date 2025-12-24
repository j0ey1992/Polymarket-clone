import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useData } from "../contexts/DataContext";

// Icon components
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const PortfolioIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const DiscoverIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function Navbar() {
  const router = useRouter();
  const { account, loadWeb3 } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Markets", href: "/", icon: ChartIcon },
    { name: "Portfolio", href: "/portfolio", icon: PortfolioIcon },
    { name: "Discover", href: "/discover", icon: DiscoverIcon },
  ];

  return (
    <>
      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-dark-700/50 bg-dark-900/80 backdrop-blur-xl">
        <div className="container-app">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" passHref>
              <div className="flex items-center space-x-3 cursor-pointer group">
                {/* Logo Icon */}
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue via-accent-cyan to-accent-purple p-[2px] group-hover:shadow-glow transition-shadow duration-300">
                  <div className="w-full h-full rounded-xl bg-dark-900 flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent-cyan" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                </div>
                {/* Logo Text */}
                <span className="text-xl font-bold text-text-primary hidden sm:block">
                  Predict<span className="gradient-text">Market</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  href={item.href}
                  isActive={router.asPath === item.href}
                  icon={item.icon}
                >
                  {item.name}
                </NavLink>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Search Button */}
              <button className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-xl text-text-muted hover:text-text-secondary transition-all duration-200">
                <SearchIcon />
                <span className="text-sm">Search</span>
                <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-xs text-text-muted bg-dark-700 rounded">
                  ⌘K
                </kbd>
              </button>

              {/* Connect Wallet Button */}
              {account ? (
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-success/20 to-success/10 border border-success/30 rounded-xl cursor-pointer hover:border-success/50 transition-all duration-200">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-success-light hidden sm:block">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                  <span className="text-sm font-medium text-success-light sm:hidden">
                    {account.slice(0, 4)}...
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => loadWeb3()}
                  className="flex items-center space-x-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-glow active:scale-95"
                >
                  <WalletIcon />
                  <span className="hidden sm:block">Connect</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-dark-700 rounded-lg transition-colors duration-200"
              >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-dark-700/50 bg-dark-900/95 backdrop-blur-xl">
            <div className="container-app py-4 space-y-2">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} passHref>
                  <div
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      router.asPath === item.href
                        ? "bg-accent-blue/10 text-accent-blue"
                        : "text-text-secondary hover:bg-dark-800 hover:text-text-primary"
                    }`}
                  >
                    <item.icon />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </Link>
              ))}
              {/* Mobile Search */}
              <div className="pt-2 border-t border-dark-700/50">
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-text-secondary hover:bg-dark-800 hover:text-text-primary rounded-xl transition-all duration-200">
                  <SearchIcon />
                  <span className="font-medium">Search Markets</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

// Desktop Navigation Link Component
interface NavLinkProps {
  href: string;
  isActive: boolean;
  icon: React.FC;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ href, isActive, icon: Icon, children }) => {
  return (
    <Link href={href} passHref>
      <div
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
          isActive
            ? "bg-accent-blue/10 text-accent-blue"
            : "text-text-secondary hover:text-text-primary hover:bg-dark-800/50"
        }`}
      >
        <Icon />
        <span className="font-medium">{children}</span>
      </div>
    </Link>
  );
};

export default Navbar;
