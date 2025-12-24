import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { useData } from "../contexts/DataContext";

function Navbar() {
  const router = useRouter();
  const { account, connectWallet, disconnectWallet } = useData();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-white/5 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" passHref>
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kris-500 to-accent-purple flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
                  <span className="text-white font-bold text-xl">K</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-kris-500 to-accent-purple rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight">
                  Kris Market
                </span>
                <span className="text-2xs text-dark-500 font-medium tracking-wider uppercase">
                  Prediction Platform
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {!router.asPath.includes("/market") &&
            !router.asPath.includes("/admin") && (
              <div className="hidden md:flex items-center space-x-1">
                <NavLink
                  href="/"
                  isActive={router.asPath === "/"}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  }
                >
                  Markets
                </NavLink>
                <NavLink
                  href="/portfolio"
                  isActive={router.asPath === "/portfolio"}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  }
                >
                  Portfolio
                </NavLink>
              </div>
            )}

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Network Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-dark-200/50 border border-white/5">
              <div className="w-2 h-2 rounded-full bg-bull animate-pulse" />
              <span className="text-xs font-medium text-dark-600">Cronos</span>
            </div>

            {/* Wallet Button */}
            {account ? (
              <div className="relative group">
                <button
                  onClick={disconnectWallet}
                  className="flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-bull/20 to-bull/10 border border-bull/30 hover:border-bull/50 transition-all duration-200 group-hover:shadow-glow-bull"
                >
                  <div className="w-2 h-2 rounded-full bg-bull" />
                  <span className="text-sm font-semibold text-bull-light">
                    {formatAddress(account)}
                  </span>
                  <svg className="w-4 h-4 text-bull-light opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
                <div className="absolute top-full right-0 mt-2 py-2 px-3 rounded-lg glass-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
                  <span className="text-xs text-dark-500">Click to disconnect</span>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="relative group flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-kris-600 to-kris-500 hover:from-kris-500 hover:to-kris-400 text-white font-semibold text-sm shadow-button hover:shadow-glow transition-all duration-200 hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Connect Wallet</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg glass-button"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5 animate-slide-down">
            <div className="flex flex-col space-y-2">
              <MobileNavLink
                href="/"
                isActive={router.asPath === "/"}
                onClick={() => setMobileMenuOpen(false)}
              >
                Markets
              </MobileNavLink>
              <MobileNavLink
                href="/portfolio"
                isActive={router.asPath === "/portfolio"}
                onClick={() => setMobileMenuOpen(false)}
              >
                Portfolio
              </MobileNavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

interface NavLinkProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ href, isActive, children, icon }) => {
  return (
    <Link href={href} passHref>
      <div
        className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
          isActive
            ? "text-white bg-white/10"
            : "text-dark-500 hover:text-white hover:bg-white/5"
        }`}
      >
        {icon}
        <span className="font-medium text-sm">{children}</span>
        {isActive && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-kris-500" />
        )}
      </div>
    </Link>
  );
};

interface MobileNavLinkProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
  onClick: () => void;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({
  href,
  isActive,
  children,
  onClick,
}) => {
  return (
    <Link href={href} passHref>
      <div
        onClick={onClick}
        className={`px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
          isActive
            ? "text-white bg-gradient-to-r from-kris-600/20 to-transparent border-l-2 border-kris-500"
            : "text-dark-500 hover:text-white hover:bg-white/5"
        }`}
      >
        <span className="font-medium">{children}</span>
      </div>
    </Link>
  );
};
