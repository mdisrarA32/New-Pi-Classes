'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTestRankings, TestRankingsPayload } from '@/lib/api';

export default function TestRankingsPage() {
  const params = useParams();
  const testId = params.id as string;

  const [rankingsData, setRankingsData] = useState<TestRankingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadRankings() {
      try {
        const res = await getTestRankings(testId);
        if (res.success && res.data) {
          setRankingsData(res.data);
        } else {
          setErrorMessage(res.error?.message || 'Rankings unavailable for this test.');
        }
      } catch (e) {
        setErrorMessage('Failed to connect to rankings server.');
      } finally {
        setLoading(false);
      }
    }
    loadRankings();
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center font-mono text-[#0F1B3D] text-sm">
        Computing Leaderboard & Tiebreaker Rankings...
      </div>
    );
  }

  if (errorMessage || !rankingsData) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white border border-[#0F1B3D]/10 rounded-xl p-8 text-center space-y-4 shadow-sm">
        <h2 className="font-display font-bold text-xl text-[#0F1B3D]">
          Leaderboard Unavailable
        </h2>
        <p className="text-xs text-[#0F1B3D]/70">{errorMessage}</p>
        <Link
          href="/dashboard/tests"
          className="inline-block px-4 py-2 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold"
        >
          Back to Test List
        </Link>
      </div>
    );
  }

  const { top10, myRank, myScore, totalParticipants } = rankingsData;

  const actualRank =
    typeof myRank === 'object' && myRank !== null
      ? (myRank as { rank: number; score: number }).rank
      : typeof myRank === 'number'
      ? myRank
      : null;

  const actualScore =
    myScore !== undefined
      ? myScore
      : typeof myRank === 'object' && myRank !== null
      ? (myRank as { rank: number; score: number }).score
      : undefined;

  const isTop10 = actualRank !== null && actualRank <= 10;

  return (
    <div className="space-y-6 antialiased">
      {/* Header & Personal Rank Card (Solid Light Panel, Zero Blur) */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-[#E8B84A] uppercase tracking-wider block mb-1">
              Official Batch Leaderboard
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1B3D]">
              {rankingsData.title}
            </h1>
            <p className="text-xs text-[#0F1B3D]/70 mt-1">
              Top 10 Rankings • Total Participants: {totalParticipants}
            </p>
          </div>

          <Link
            href={`/dashboard/tests/${testId}/result`}
            className="px-4 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] text-xs font-semibold hover:bg-[#0F1B3D]/10 transition-colors"
          >
            ← Back to My Answer Review
          </Link>
        </div>

        {/* Student's Personal Rank Highlight Banner */}
        <div className="bg-[#0F1B3D] text-white rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-[#E8B84A] uppercase tracking-wider block mb-1">
              Your Personal Performance Result
            </span>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
              {actualRank !== null ? `Your Rank: #${actualRank}` : 'Unranked / Not Attempted'}
            </h2>
            <p className="text-xs text-[#F7F7F5]/80 mt-1 font-mono">
              {isTop10
                ? '🏆 Outstanding! You are in the Top 10 Batch Leaderboard.'
                : actualRank !== null
                ? 'Rank Privacy Enforced: Your score is shown privately below.'
                : ''}
            </p>
          </div>

          {actualScore !== undefined && (
            <div className="bg-white/10 border border-white/20 px-6 py-3 rounded-xl text-center">
              <span className="text-[11px] font-mono text-[#E8B84A] block uppercase">
                Your Score
              </span>
              <span className="font-display font-extrabold text-2xl text-white">
                {actualScore} pts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top 10 Leaderboard Table */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-xl text-[#0F1B3D] border-b border-[#0F1B3D]/10 pb-3">
          Top 10 Batch Leaderboard
        </h2>

        {top10.length === 0 ? (
          <p className="text-xs text-[#0F1B3D]/60 py-6 text-center">
            No submissions recorded yet for this test.
          </p>
        ) : (
          <div className="space-y-2">
            {top10.map((entry) => {
              const isFirst = entry.rank === 1;
              const isSecond = entry.rank === 2;
              const isThird = entry.rank === 3;

              let crownBadge = null;
              let rowStyle = 'bg-[#F7F7F5] border-[#0F1B3D]/10 text-[#0F1B3D]';

              if (isFirst) {
                crownBadge = <span className="text-xl">👑 🥇</span>;
                rowStyle = 'bg-[#E8B84A]/15 border-[#E8B84A] text-[#0F1B3D] font-bold';
              } else if (isSecond) {
                crownBadge = <span className="text-xl">🥈</span>;
                rowStyle = 'bg-slate-100 border-slate-300 text-[#0F1B3D] font-bold';
              } else if (isThird) {
                crownBadge = <span className="text-xl">🥉</span>;
                rowStyle = 'bg-amber-50 border-amber-200 text-[#0F1B3D] font-bold';
              }

              return (
                <div
                  key={entry.rank}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${rowStyle}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#0F1B3D]/15 font-mono text-sm font-extrabold flex items-center justify-center text-[#0F1B3D]">
                      #{entry.rank}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-display font-bold text-base text-[#0F1B3D]">
                          {entry.fullName}
                        </span>
                        {crownBadge}
                      </div>
                      <span className="text-xs font-mono text-[#0F1B3D]/60 block">
                        {entry.username ? `@${entry.username}` : ''}
                        {entry.tiebreakerReason && ` • Tiebreaker: ${entry.tiebreakerReason}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-display font-extrabold text-xl text-[#0F1B3D] block">
                      {entry.score} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
