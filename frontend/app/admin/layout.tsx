'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboardLayout({
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
      } else if (user.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1B3D] flex items-center justify-center font-mono text-white text-sm">
        Authenticating Admin Credentials...
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  const navItems = [
    { href: '/admin', label: 'Overview', icon: '📊' },
    { href: '/admin/batches', label: 'Batches', icon: '🏷️' },
    { href: '/admin/students', label: 'Student Directory', icon: '🎓' },
    { href: '/admin/materials', label: 'Study Materials', icon: '📚' },
    { href: '/admin/pyqs', label: 'PYQ Bank', icon: '📝' },
    { href: '/admin/notices', label: 'Notice Announcements', icon: '📢' },
    { href: '/admin/enquiries', label: 'Enquiries CRM', icon: '📬' },
    { href: '/admin/marketing', label: 'Public Courses & Testimonials', icon: '🌟' },
    { href: '/admin/tests', label: 'Test Scheduler & Authoring', icon: '⏱️' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin';
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#0F1B3D] flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#0F1B3D] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#E8B84A] flex items-center justify-center font-bold font-display text-sm text-[#0F1B3D]">
            π
          </div>
          <span className="font-display font-bold text-base text-white">
            Admin Portal
          </span>
        </Link>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-1.5 rounded-lg border border-white/20 text-white"
        >
          {mobileNavOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`${
          mobileNavOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-[#0F1B3D] text-white flex-shrink-0 flex flex-col justify-between z-30 sticky top-0 h-auto md:h-screen`}
      >
        <div>
          {/* Sidebar Header Brand */}
          <div className="p-6 border-b border-white/10 hidden md:flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#E8B84A] flex items-center justify-center font-bold font-display text-xl text-[#0F1B3D]">
              π
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white leading-tight block">
                New Pi Classes
              </span>
              <span className="text-xs text-[#E8B84A] font-mono font-semibold uppercase tracking-wider block">
                🛡️ Admin Control Panel
              </span>
            </div>
          </div>

          {/* Admin Profile Card */}
          <div className="p-4 m-4 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="font-bold text-white text-sm font-display mb-0.5">
              {user.fullName}
            </div>
            <div className="text-[#E8B84A] font-mono">@{user.username}</div>
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="px-2 py-0.5 rounded bg-[#E8B84A]/20 text-[#E8B84A] font-mono font-bold">
                Role: Admin
              </span>
              <span className="text-white/60 font-mono">System Owner</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive(item.href)
                    ? 'bg-[#E8B84A] text-[#0F1B3D] font-bold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-colors border border-red-500/30"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
