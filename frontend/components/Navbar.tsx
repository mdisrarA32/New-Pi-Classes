'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/courses', label: 'Courses' },
    { href: '/faculty', label: 'Faculty' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact & Demo' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-navy-start/80 border-b border-white/10 shadow-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center shadow-gold-glow text-navy-start font-bold font-display text-xl transition-transform group-hover:scale-105">
            π
          </div>
          <div>
            <span className="font-display font-bold text-xl text-text-dark-primary tracking-wide block">
              New Pi Classes
            </span>
            <span className="text-xs text-gold tracking-widest font-mono uppercase block -mt-1">
              Sheohar • Bihar
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-gold font-semibold border-b-2 border-gold pb-1'
                  : 'text-text-dark-secondary hover:text-text-dark-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth CTA / User Session Badge */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono text-text-dark-secondary bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                👤 {user.username} ({user.role})
              </span>
              <button
                onClick={() => logout()}
                className="text-xs font-semibold text-rose hover:underline"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link href="/signin" className="btn-gold text-sm py-2 px-6">
              Student / Admin Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-text-dark-secondary hover:text-text-dark-primary focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-navy-start/95 backdrop-blur-lg px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(link.href)
                  ? 'bg-white/10 text-gold font-semibold'
                  : 'text-text-dark-secondary hover:text-text-dark-primary hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href="/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-gold w-full text-center block text-sm py-2.5"
            >
              Student / Admin Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
