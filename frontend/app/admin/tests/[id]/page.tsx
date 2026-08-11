'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getAdminTestById, AdminTestDetail } from '@/lib/api';

export default function AdminTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [test, setTest] = useState<AdminTestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTest() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getAdminTestById(id);
        setTest(data);
      } catch (e) {
        console.error('Failed to load test details:', e);
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 text-center text-xs font-mono text-[#0F1B3D]/60">
        Loading test details...
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-12 text-center text-xs text-[#0F1B3D]/60 space-y-3">
        <p className="text-base font-display font-bold text-[#0F1B3D]">Test Not Found</p>
        <p>The mock test you requested does not exist or has been removed.</p>
        <Link
          href="/admin/tests"
          className="inline-flex px-4 py-2 bg-[#0F1B3D] text-white rounded-lg font-semibold"
        >
          Return to Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 antialiased max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-5 shadow-sm">
        <Link
          href="/admin/tests"
          className="text-xs text-[#0F1B3D]/60 hover:text-[#0F1B3D] font-semibold flex items-center gap-1.5 mb-1"
        >
          ← Back to Registry
        </Link>
        <h1 className="font-display font-extrabold text-2xl text-[#0F1B3D]">
          {test.title}
        </h1>
        <p className="text-xs text-[#0F1B3D]/70 mt-1">
          Detailed examination parameters and curriculum question sheet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Test Parameters Left Bar */}
        <div className="md:col-span-1 bg-white border border-[#0F1B3D]/10 rounded-xl p-5 shadow-sm space-y-4 h-fit">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0F1B3D]/60 border-b border-[#0F1B3D]/10 pb-2">
            Exam Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#0F1B3D]/60 block font-mono text-[10px]">Start Time</span>
              <span className="font-mono text-[#0F1B3D] font-semibold">
                {new Date(test.scheduledAt).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>

            <div>
              <span className="text-[#0F1B3D]/60 block font-mono text-[10px]">Duration</span>
              <span className="font-mono text-[#0F1B3D] font-semibold">{test.durationMinutes} minutes</span>
            </div>

            <div>
              <span className="text-[#0F1B3D]/60 block font-mono text-[10px]">Negative Marking</span>
              <span className="font-mono text-[#0F1B3D] font-semibold">
                {test.negativeMarkingRatio === 0
                  ? 'Disabled (0%)'
                  : `${test.negativeMarkingRatio * 100}% (-${test.negativeMarkingRatio}x)`}
              </span>
            </div>

            <div>
              <span className="text-[#0F1B3D]/60 block font-mono text-[10px]">Targeted Batches</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {test.batchIds.map((b) => (
                  <span
                    key={b._id}
                    className="bg-[#0F1B3D]/5 text-[#0F1B3D] border border-[#0F1B3D]/15 px-2 py-0.5 rounded text-[10px] font-semibold font-mono"
                  >
                    {b.name} ({b.class} • {b.stream})
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[#0F1B3D]/60 block font-mono text-[10px]">Subjects</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {test.subjectIds.map((s) => (
                  <span
                    key={s._id}
                    className="bg-[#E8B84A]/10 text-[#0F1B3D] border border-[#E8B84A]/25 px-2 py-0.5 rounded text-[10px] font-semibold"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[#0F1B3D]/60 block font-mono text-[10px]">Created Date</span>
              <span className="font-mono text-[#0F1B3D] text-[11px]">
                {test.createdAt ? new Date(test.createdAt as any).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Question Review Sheet Right Panel */}
        <div className="md:col-span-2 bg-white border border-[#0F1B3D]/10 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0F1B3D]/60 border-b border-[#0F1B3D]/10 pb-2">
            Question Review Sheet ({test.questions.length} questions)
          </h3>

          <div className="space-y-6">
            {test.questions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-[#F7F7F5]/50 border border-[#0F1B3D]/10 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#0F1B3D]/5 pb-1">
                  <span className="font-mono text-xs font-bold text-[#0F1B3D]/80">
                    Question {idx + 1} <span className="text-[#0F1B3D]/50 font-normal">({q.id})</span>
                  </span>
                  <span className="font-mono text-[10px] font-semibold bg-[#0F1B3D]/5 border border-[#0F1B3D]/15 px-2 py-0.5 rounded text-[#0F1B3D]/80">
                    +{q.marks} Marks
                  </span>
                </div>

                <p className="text-xs text-[#0F1B3D] font-medium leading-relaxed">
                  {q.text}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = oIdx === q.correctOptionIndex;
                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-lg border text-xs leading-relaxed transition-colors ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                            : 'bg-white border-[#0F1B3D]/15 text-[#0F1B3D]/80'
                        }`}
                      >
                        <span className="font-mono font-bold mr-1.5 text-[11px] uppercase">
                          {String.fromCharCode(97 + oIdx)}.
                        </span>
                        {opt}
                        {isCorrect && (
                          <span className="ml-1.5 font-mono text-[10px] text-emerald-600 tracking-wide font-bold">
                            ✓ CORRECT ANSWER
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
