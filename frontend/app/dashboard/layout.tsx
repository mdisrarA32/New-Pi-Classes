'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ChatWidget from '@/components/ChatWidget';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user) {
        router.replace('/signin');
      } else if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center font-mono text-[#0F1B3D] text-sm">
        Loading Student Portal...
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'student') {
    return null; // Will redirect via useEffect
  }

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: '📊' },
    { href: '/dashboard/materials', label: 'Study Materials', icon: '📚' },
    { href: '/dashboard/pyqs', label: 'PYQ Bank', icon: '📝' },
    { href: '/dashboard/notices', label: 'Notices & Updates', icon: '📢' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#0F1B3D] flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-[#0F1B3D]/10 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#E8B84A] flex items-center justify-center font-bold font-display text-sm text-[#0F1B3D]">
            π
          </div>
          <span className="font-display font-bold text-base text-[#0F1B3D]">
            Student Portal
          </span>
        </Link>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-1.5 rounded-lg border border-[#0F1B3D]/15 text-[#0F1B3D]"
        >
          {mobileNavOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`${
          mobileNavOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white border-r border-[#0F1B3D]/10 flex-shrink-0 flex flex-col justify-between z-30 sticky top-0 h-auto md:h-screen`}
      >
        <div>
          {/* Sidebar Header Brand */}
          <div className="p-6 border-b border-[#0F1B3D]/10 hidden md:flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#E8B84A] flex items-center justify-center font-bold font-display text-xl text-[#0F1B3D]">
              π
            </div>
            <div>
              <span className="font-display font-bold text-lg text-[#0F1B3D] leading-tight block">
                New Pi Classes
              </span>
              <span className="text-xs text-[#E8B84A] font-mono font-semibold uppercase tracking-wider block">
                Student Dashboard
              </span>
            </div>
          </div>

          {/* Student Profile Card (Zero Blur Solid Light Card) */}
          <div className="p-4 m-4 rounded-xl bg-[#F7F7F5] border border-[#0F1B3D]/10 text-xs">
            <div className="font-bold text-[#0F1B3D] text-sm font-display mb-0.5">
              {user.fullName}
            </div>
            <div className="text-[#0F1B3D]/70 font-mono">@{user.username}</div>
            <div className="mt-2 pt-2 border-t border-[#0F1B3D]/10 flex items-center justify-between text-[11px]">
              <span className="px-2 py-0.5 rounded bg-[#E8B84A]/20 text-[#0F1B3D] font-mono font-bold">
                Class {user.class || 'XI'}
              </span>
              <span className="text-[#0F1B3D]/60 font-mono">Enrolled</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive(item.href)
                    ? 'bg-[#0F1B3D] text-white'
                    : 'text-[#0F1B3D]/70 hover:bg-[#F7F7F5] hover:text-[#0F1B3D]'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#0F1B3D]/10">
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-[#E5556B]/10 hover:bg-[#E5556B]/20 text-[#E5556B] text-xs font-semibold transition-colors"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>

      {/* Floating AI STEM Tutor Widget */}
      <ChatWidget />
    </div>
  );
}
