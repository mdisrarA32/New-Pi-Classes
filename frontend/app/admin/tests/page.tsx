'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminTestsList, AdminTestListItem } from '@/lib/api';

export default function AdminTestsOverviewPage() {
  const [tests, setTests] = useState<AdminTestListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const data = await getAdminTestsList();
      setTests(data);
    } catch (e) {
      console.error('Failed to load admin test list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const getStatusBadge = (status: 'upcoming' | 'active' | 'completed') => {
    switch (status) {
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold font-mono border bg-indigo-50/70 border-indigo-200 text-indigo-700">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Upcoming
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold font-mono border bg-emerald-50/70 border-emerald-200 text-emerald-700 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active Now
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold font-mono border bg-slate-50/70 border-slate-200 text-slate-600">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 antialiased">
      {/* Page Header */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#E8B84A] uppercase tracking-wider block mb-1">
            Test Engine & Question Authoring
          </span>
          <h1 className="font-display font-extrabold text-2xl text-[#0F1B3D]">
            Mock Test Registry
          </h1>
          <p className="text-xs text-[#0F1B3D]/70 mt-1">
            Schedule online exams, define target batches/subjects, configure negative marking, and manage question sheets.
          </p>
        </div>

        <Link
          href="/admin/tests/create"
          className="px-4 py-2.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/95 transition-colors self-start sm:self-center"
        >
          + Schedule New Test
        </Link>
      </div>

      {/* Tests Table / List */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#0F1B3D]/10 flex items-center justify-between">
          <h2 className="font-display font-bold text-sm text-[#0F1B3D]">
            All Scheduled Mock Tests
          </h2>
          <span className="text-[11px] font-mono text-[#0F1B3D]/60">
            Total: {tests.length} tests
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs font-mono text-[#0F1B3D]/60">
            Loading scheduled tests from server...
          </div>
        ) : tests.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#0F1B3D]/60 space-y-2">
            <div className="text-2xl">⏳</div>
            <p className="font-display font-bold text-[#0F1B3D]">No Mock Tests Found</p>
            <p className="text-[11px]">Click &quot;Schedule New Test&quot; above to build your first exam paper.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-[#0F1B3D]/10 text-[#0F1B3D]/70 font-mono uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-semibold">Test Title</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Scheduled Date & Time</th>
                  <th className="p-4 font-semibold">Duration</th>
                  <th className="p-4 font-semibold">Neg. Marking Ratio</th>
                  <th className="p-4 font-semibold">Target Batches</th>
                  <th className="p-4 font-semibold">Questions</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1B3D]/10">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                    <td className="p-4">
                      <Link
                        href={`/admin/tests/${test.id}`}
                        className="font-bold text-[#0F1B3D] hover:underline text-sm block"
                      >
                        {test.title}
                      </Link>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {getStatusBadge(test.status)}
                    </td>
                    <td className="p-4 font-mono text-[#0F1B3D]/80">
                      {new Date(test.scheduledAt).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="p-4 font-mono text-[#0F1B3D]/80">
                      {test.durationMinutes} mins
                    </td>
                    <td className="p-4 font-mono text-[#0F1B3D]/80">
                      {test.negativeMarkingRatio === 0
                        ? 'None'
                        : `${test.negativeMarkingRatio * 100}% (-${test.negativeMarkingRatio}x)`}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {test.batches.map((b, idx) => (
                          <span
                            key={idx}
                            className="bg-[#0F1B3D]/5 text-[#0F1B3D]/80 border border-[#0F1B3D]/10 px-2 py-0.5 rounded text-[10px] font-medium"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-[#0F1B3D]/70 text-center">
                      {test.questionCount}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/tests/${test.id}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D]/80 font-semibold text-[11px] hover:bg-[#0F1B3D]/5 hover:text-[#0F1B3D] transition-all"
                      >
                        👁️ View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
