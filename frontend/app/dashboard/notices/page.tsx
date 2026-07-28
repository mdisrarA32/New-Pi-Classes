'use client';

import { useState, useEffect } from 'react';
import { getStudentNotices, NoticeItem } from '@/lib/api';

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getStudentNotices();
        setNotices(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm">
        <h1 className="font-display font-extrabold text-2xl text-[#0F1B3D]">
          Notice Board & Announcements
        </h1>
        <p className="text-xs text-[#0F1B3D]/70 mt-1">
          Official institute announcements and batch-specific updates from NPC Sheohar administration.
        </p>
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-12 text-center text-xs font-mono text-[#0F1B3D]/70">
          Loading notice board...
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-12 text-center text-xs text-[#0F1B3D]/70">
          <p className="text-base font-display font-bold text-[#0F1B3D] mb-1">
            No Active Notices
          </p>
          <p>There are no current announcements posted for your batch or institute.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <div
              key={n.id}
              className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm hover:border-[#0F1B3D]/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-0.5 rounded-full ${
                    n.scope === 'global'
                      ? 'bg-[#E8B84A]/20 text-[#0F1B3D] border border-[#E8B84A]/40'
                      : 'bg-[#4DA8FF]/20 text-[#0F1B3D] border border-[#4DA8FF]/40'
                  }`}
                >
                  {n.scope === 'global' ? '🌐 Institute Global' : '🎯 Batch Specific'}
                </span>

                <span className="text-xs font-mono text-[#0F1B3D]/50">
                  {new Date(n.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h3 className="font-display font-bold text-lg text-[#0F1B3D] mb-2">
                {n.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#0F1B3D]/80 leading-relaxed whitespace-pre-line">
                {n.body}
              </p>

              <div className="mt-4 pt-3 border-t border-[#0F1B3D]/10 flex items-center justify-between text-[11px] text-[#0F1B3D]/60 font-mono">
                <span>Posted by: {n.postedBy || 'Admin Office'}</span>
                <span>Sheohar Center</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
