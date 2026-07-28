'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStudentTests, TestListItem } from '@/lib/api';

export default function StudentTestsPage() {
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getStudentTests();
        setTests(data);
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
          Online Mock Tests & Assessments
        </h1>
        <p className="text-xs text-[#0F1B3D]/70 mt-1">
          Take live scheduled tests, review detailed question feedback, and track your batch ranking.
        </p>
      </div>

      {/* Test Cards List */}
      {loading ? (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-12 text-center text-xs font-mono text-[#0F1B3D]/70">
          Loading assigned tests...
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-12 text-center text-xs text-[#0F1B3D]/70">
          <p className="text-base font-display font-bold text-[#0F1B3D] mb-1">
            No Tests Assigned
          </p>
          <p>There are no active or upcoming tests scheduled for your batch currently.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((t) => {
            const isLive = t.status === 'active' && !t.hasSubmitted;
            const isSubmitted = t.hasSubmitted;
            const isUpcoming = t.status === 'upcoming';
            const isEnded = t.status === 'ended' && !t.hasSubmitted;

            return (
              <div
                key={t.id}
                className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm hover:border-[#0F1B3D]/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    {isSubmitted ? (
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#1FAE7A]/15 text-[#1FAE7A]">
                        ✅ Completed
                      </span>
                    ) : isLive ? (
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#1FAE7A] text-white animate-pulse">
                        🟢 Live & Attemptable
                      </span>
                    ) : isUpcoming ? (
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#E8B84A]/20 text-[#0F1B3D]">
                        ⏳ Scheduled Upcoming
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#E5556B]/15 text-[#E5556B]">
                        🔴 Test Ended
                      </span>
                    )}

                    <span className="text-xs font-mono text-[#0F1B3D]/60">
                      {t.questionCount} Questions • {t.durationMinutes} Mins
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-[#0F1B3D]">
                    {t.title}
                  </h3>

                  <p className="text-xs text-[#0F1B3D]/70 font-mono">
                    Scheduled: {new Date(t.scheduledAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  {isSubmitted ? (
                    <>
                      <Link
                        href={`/dashboard/tests/${t.id}/result`}
                        className="px-4 py-2 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 transition-colors"
                      >
                        View Result
                      </Link>
                      <Link
                        href={`/dashboard/tests/${t.id}/rankings`}
                        className="px-4 py-2 rounded-lg bg-[#E8B84A]/20 text-[#0F1B3D] text-xs font-semibold hover:bg-[#E8B84A]/30 transition-colors"
                      >
                        👑 Leaderboard
                      </Link>
                    </>
                  ) : isLive ? (
                    <Link
                      href={`/dashboard/tests/${t.id}/attempt`}
                      className="px-5 py-2.5 rounded-lg bg-[#1FAE7A] text-white text-xs font-bold hover:bg-[#1FAE7A]/90 transition-colors shadow-sm"
                    >
                      Start Test Attempt →
                    </Link>
                  ) : isUpcoming ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/10 text-[#0F1B3D]/40 text-xs font-semibold cursor-not-allowed"
                    >
                      Opens at Scheduled Time
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/10 text-[#E5556B]/60 text-xs font-semibold cursor-not-allowed"
                    >
                      Missed / Expired
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
