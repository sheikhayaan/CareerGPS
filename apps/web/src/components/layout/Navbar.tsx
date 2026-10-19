'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Sparkles, Menu, X, BarChart3, BookOpen, LayoutDashboard, Map, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/planner', label: 'Career Planner', icon: Compass, highlight: true },
  { href: '/explore', label: 'Explore Careers', icon: BarChart3 },
  { href: '/my-roadmaps', label: 'My Roadmaps', icon: Map },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(6,9,18,0.92)'
            : 'rgba(6,9,18,0.7)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: scrolled
            ? '1px solid rgba(99,102,241,0.2)'
            : '1px solid rgba(255,255,255,0.05)',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0" id="nav-brand">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:rotate-3"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              }}
            >
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-black text-lg tracking-tight text-white"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  CareerGPS
                </span>
                <span
                  className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(99,102,241,0.2)',
                    color: '#818CF8',
                    border: '1px solid rgba(99,102,241,0.3)',
                  }}
                >
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 -mt-0.5 hidden sm:block">
                Evidence-backed career intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center gap-0.5 p-1 rounded-2xl"
            style={{
              background: 'rgba(14,21,37,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className="relative px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 group"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #6366F1, #4F46E5)'
                      : 'transparent',
                    color: isActive ? '#fff' : '#94A3B8',
                    boxShadow: isActive ? '0 2px 12px rgba(99,102,241,0.35)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = '#fff';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  {link.highlight && !isActive && (
                    <Sparkles className="w-3 h-3 text-accent animate-pulse" />
                  )}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/profile"
                  id="nav-profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 transition-all duration-200"
                  style={{ background: 'rgba(14,21,37,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)';
                    (e.currentTarget as HTMLElement).style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                    (e.currentTarget as HTMLElement).style.color = '#E2E8F0';
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
                  >
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[90px] truncate">{user.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 transition-colors rounded-lg hover:bg-red-500/10"
                  id="nav-signout"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  id="nav-signin"
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-surface/60"
                >
                  Sign in
                </Link>
                <Link
                  href="/planner"
                  id="nav-get-started"
                  className="btn-magnetic inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white transition-colors hover:bg-surface/60"
              id="nav-mobile-menu"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(6,9,18,0.95)', backdropFilter: 'blur(20px)' }}
        >
          {/* Close area */}
          <div className="h-16" onClick={() => setMenuOpen(false)} />

          <div className="px-6 py-6 space-y-2">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  id={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 animate-fade-in-up"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(79,70,229,0.15))'
                      : 'rgba(14,21,37,0.6)',
                    border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    color: isActive ? '#818CF8' : '#94A3B8',
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isActive ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)' }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: isActive ? '#818CF8' : '#64748B' }} />
                  </div>
                  <span className="font-semibold text-sm">{link.label}</span>
                  {link.highlight && !isActive && (
                    <span className="ml-auto text-[10px] font-bold text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded-full">
                      Start Here
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 border-t border-white/5 space-y-2">
              {user ? (
                <>
                  <div className="px-5 py-3 text-xs text-slate-400">
                    Signed in as <strong className="text-white">{user.email}</strong>
                  </div>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full text-left px-5 py-3.5 rounded-2xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                    style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-2xl text-sm font-semibold text-slate-300"
                    style={{ background: 'rgba(14,21,37,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
                    id="mobile-signin">
                    Sign In
                  </Link>
                  <Link href="/signup" className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-2xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
                    id="mobile-signup">
                    <Sparkles className="w-4 h-4" />
                    Create Free Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
