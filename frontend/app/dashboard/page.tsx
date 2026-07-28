'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import quotesData from '@/data/quotes.json';

export default function StudentDashboardHome() {
  const { user } = useAuth();
  const [currentQuote, setCurrentQuote] = useState(quotesData[0]);

  // Daily Quote Persistence via localStorage
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('npc_quote_date');
    const savedIndex = localStorage.getItem('npc_quote_index');

    if (savedDate === todayStr && savedIndex !== null) {
      const idx = parseInt(savedIndex, 10);
      if (quotesData[idx]) {
        setCurrentQuote(quotesData[idx]);
        return;
      }
    }

    // Pick new quote for today
    const randomIdx = Math.floor(Math.random() * quotesData.length);
    localStorage.setItem('npc_quote_date', todayStr);
    localStorage.setItem('npc_quote_index', randomIdx.toString());
    setCurrentQuote(quotesData[randomIdx]);
  }, []);

  const handleRefreshQuote = () => {
    const nextIdx = (quotesData.findIndex((q) => q.id === currentQuote.id) + 1) % quotesData.length;
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('npc_quote_date', todayStr);
    localStorage.setItem('npc_quote_index', nextIdx.toString());
    setCurrentQuote(quotesData[nextIdx]);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-[#E8B84A] uppercase tracking-wider block mb-1">
              Student Dashboard Overview
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1B3D]">
              Welcome back, {user?.fullName || 'Student'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#0F1B3D]/70 mt-1">
              Class {user?.class || 'XI'} Aspirant • New Pi Classes Sheohar
            </p>
          </div>

          <div className="bg-[#F7F7F5] border border-[#0F1B3D]/10 px-4 py-2 rounded-lg text-xs font-mono text-[#0F1B3D]">
            <span className="text-[#0F1B3D]/60 block">Status</span>
            <span className="font-bold text-[#1FAE7A]">● Active Enrollment</span>
          </div>
        </div>
      </div>

      {/* Daily Motivational Quote Banner */}
      <div className="bg-[#0F1B3D] text-white rounded-xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#E8B84A]">
              <span>💡 Daily Thought for Aspirants ({currentQuote.language})</span>
            </div>
            <p className="font-display text-base sm:text-lg italic leading-relaxed text-[#F7F7F5]">
              "{currentQuote.quote}"
            </p>
            <p className="text-xs font-mono text-[#E8B84A]/90">
              — {currentQuote.author}
            </p>
          </div>

          <button
            onClick={handleRefreshQuote}
            title="Refresh Quote"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#E8B84A] text-xs font-mono transition-colors flex-shrink-0"
          >
            🔄 New Quote
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Grid (Solid Light Panels, Crisp Borders, Zero Blur) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Study Materials Card */}
        <Link
          href="/dashboard/materials"
          className="bg-white border border-[#0F1B3D]/10 hover:border-[#0F1B3D]/30 rounded-xl p-6 flex flex-col justify-between transition-all group shadow-sm"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#4DA8FF]/15 text-[#4DA8FF] flex items-center justify-center text-xl mb-4">
              📚
            </div>
            <h3 className="font-display font-bold text-lg text-[#0F1B3D] mb-2 group-hover:text-[#4DA8FF] transition-colors">
              Study Materials
            </h3>
            <p className="text-xs text-[#0F1B3D]/70 leading-relaxed">
              Access Class {user?.class || 'XI'} PDFs, lecture notes, formula sheets, and video modules.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#0F1B3D]/10 flex items-center justify-between text-xs font-semibold text-[#0F1B3D]">
            <span>Browse Materials</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* PYQ Bank Card */}
        <Link
          href="/dashboard/pyqs"
          className="bg-white border border-[#0F1B3D]/10 hover:border-[#0F1B3D]/30 rounded-xl p-6 flex flex-col justify-between transition-all group shadow-sm"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#E8B84A]/15 text-[#E8B84A] flex items-center justify-center text-xl mb-4">
              📝
            </div>
            <h3 className="font-display font-bold text-lg text-[#0F1B3D] mb-2 group-hover:text-[#E8B84A] transition-colors">
              PYQ Question Bank
            </h3>
            <p className="text-xs text-[#0F1B3D]/70 leading-relaxed">
              Solve Previous Year Questions for JEE & NEET with detailed solutions.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#0F1B3D]/10 flex items-center justify-between text-xs font-semibold text-[#0F1B3D]">
            <span>Practice PYQs</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* Notices Card */}
        <Link
          href="/dashboard/notices"
          className="bg-white border border-[#0F1B3D]/10 hover:border-[#0F1B3D]/30 rounded-xl p-6 flex flex-col justify-between transition-all group shadow-sm"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#1FAE7A]/15 text-[#1FAE7A] flex items-center justify-center text-xl mb-4">
              📢
            </div>
            <h3 className="font-display font-bold text-lg text-[#0F1B3D] mb-2 group-hover:text-[#1FAE7A] transition-colors">
              Notice Board
            </h3>
            <p className="text-xs text-[#0F1B3D]/70 leading-relaxed">
              Stay updated on exam schedules, holiday notices, and batch announcements.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#0F1B3D]/10 flex items-center justify-between text-xs font-semibold text-[#0F1B3D]">
            <span>View Notices</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
