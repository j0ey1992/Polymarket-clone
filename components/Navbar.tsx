import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useData } from "../contexts/DataContext";

function Navbar() {
  const router = useRouter();
  const { account, loadWeb3 } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Markets", href: "/" },
    { name: "Trade", href: "/trade" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Learn", href: "/learn" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0B1426] border-b border-[#1F283C]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" passHref>
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#1199FA] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg hidden sm:block">PredictX</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} passHref>
                <span
                  className={`px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${
                    router.asPath === link.href
                      ? "text-white"
                      : "text-[#7B849B] hover:text-white"
                  }`}
                >
                  {link.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <button className="p-2 text-[#7B849B] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Wallet Button */}
            {account ? (
              <button className="flex items-center space-x-2 px-4 py-2 bg-[#1F283C] text-white text-sm font-medium rounded-lg">
                <span className="w-2 h-2 bg-[#00A68C] rounded-full"></span>
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadWeb3()}
                  className="px-4 py-2 text-sm font-medium text-white hover:text-[#1199FA] transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => loadWeb3()}
                  className="px-4 py-2 bg-[#1199FA] hover:bg-[#0577DA] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#7B849B] hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B1426] border-t border-[#1F283C] py-2">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} passHref>
              <div
                onClick={() => setMobileMenuOpen(false)}
                className={`px-6 py-3 cursor-pointer ${
                  router.asPath === link.href ? "text-white" : "text-[#7B849B]"
                }`}
              >
                {link.name}
              </div>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
