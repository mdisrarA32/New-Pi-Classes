'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTestResult, TestResultPayload } from '@/lib/api';

export default function TestResultPage() {
  const params = useParams();
  const testId = params.id as string;

  const [resultData, setResultData] = useState<TestResultPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await getTestResult(testId);
        if (res.success && res.data) {
          setResultData(res.data);
        } else {
          setErrorMessage(res.error?.message || 'Result not found for this test.');
        }
      } catch (e) {
        setErrorMessage('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center font-mono text-[#0F1B3D] text-sm">
        Calculating Test Performance & Score Breakdown...
      </div>
    );
  }

  if (errorMessage || !resultData) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white border border-[#0F1B3D]/10 rounded-xl p-8 text-center space-y-4 shadow-sm">
        <h2 className="font-display font-bold text-xl text-[#0F1B3D]">
          Result Unavailable
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

  const optionLetters = ['A', 'B', 'C', 'D'];
  const percentage = Math.round((resultData.score / resultData.maxScore) * 100) || 0;

  return (
    <div className="space-y-6 antialiased">
      {/* Header & Score Summary Card (Solid Light Panel, Zero Blur) */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-mono font-bold text-[#E8B84A] uppercase tracking-wider block mb-1">
              Assessment Performance Summary
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1B3D]">
              {resultData.title}
            </h1>
            <p className="text-xs text-[#0F1B3D]/70 mt-1 font-mono">
              Submitted: {new Date(resultData.submittedAt).toLocaleString('en-IN')}
              {resultData.autoSubmitted && ' (Auto-Submitted on Timer Expiration)'}
            </p>
          </div>

          <Link
            href={`/dashboard/tests/${testId}/rankings`}
            className="px-5 py-2.5 rounded-lg bg-[#E8B84A] text-[#0F1B3D] font-bold text-xs hover:bg-[#E8B84A]/90 transition-colors shadow-sm whitespace-nowrap flex items-center space-x-2"
          >
            <span>👑 View Leaderboard & Rankings</span>
            <span>→</span>
          </Link>
        </div>

        {/* Score Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#0F1B3D]/10">
          <div className="bg-[#F7F7F5] border border-[#0F1B3D]/10 rounded-lg p-4 text-center">
            <span className="text-xs font-mono text-[#0F1B3D]/60 block uppercase">
              Total Score
            </span>
            <span className="font-display font-extrabold text-2xl text-[#0F1B3D] block mt-1">
              {resultData.score} / {resultData.maxScore}
            </span>
            <span className="text-[11px] font-mono font-bold text-[#1FAE7A]">
              {percentage}% Marks
            </span>
          </div>

          <div className="bg-[#1FAE7A]/10 border border-[#1FAE7A]/20 rounded-lg p-4 text-center">
            <span className="text-xs font-mono text-[#1FAE7A] block uppercase font-semibold">
              Correct Answers
            </span>
            <span className="font-display font-extrabold text-2xl text-[#1FAE7A] block mt-1">
              {resultData.correctCount}
            </span>
            <span className="text-[11px] font-mono text-[#1FAE7A]/80">
              +{resultData.correctCount * 4} Marks
            </span>
          </div>

          <div className="bg-[#E5556B]/10 border border-[#E5556B]/20 rounded-lg p-4 text-center">
            <span className="text-xs font-mono text-[#E5556B] block uppercase font-semibold">
              Incorrect Answers
            </span>
            <span className="font-display font-extrabold text-2xl text-[#E5556B] block mt-1">
              {resultData.wrongCount}
            </span>
            <span className="text-[11px] font-mono text-[#E5556B]">
              -{resultData.wrongCount} Negative
            </span>
          </div>

          <div className="bg-[#F7F7F5] border border-[#0F1B3D]/10 rounded-lg p-4 text-center">
            <span className="text-xs font-mono text-[#0F1B3D]/60 block uppercase">
              Unattempted
            </span>
            <span className="font-display font-extrabold text-2xl text-[#0F1B3D]/80 block mt-1">
              {resultData.unattemptedCount}
            </span>
            <span className="text-[11px] font-mono text-[#0F1B3D]/50">
              0 Marks
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl text-[#0F1B3D]">
          Detailed Question Review & Unlocked Answers
        </h2>

        {resultData.review.map((q, qIdx) => {
          return (
            <div
              key={q.id}
              className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#0F1B3D]">
                  Question {qIdx + 1}
                </span>

                {q.isCorrect ? (
                  <span className="text-xs font-mono font-bold px-3 py-0.5 rounded bg-[#1FAE7A]/15 text-[#1FAE7A]">
                    ✓ Correct (+4)
                  </span>
                ) : q.isUnattempted ? (
                  <span className="text-xs font-mono font-bold px-3 py-0.5 rounded bg-[#F7F7F5] text-[#0F1B3D]/60 border border-[#0F1B3D]/15">
                    ○ Unattempted (0)
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold px-3 py-0.5 rounded bg-[#E5556B]/15 text-[#E5556B]">
                    ✗ Incorrect (-1)
                  </span>
                )}
              </div>

              <p className="font-display font-bold text-base text-[#0F1B3D]">
                {q.text}
              </p>

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((optText, optIdx) => {
                  const isUserSelected = q.selectedOptionIndex === optIdx;
                  const isCorrectAnswer = q.correctOptionIndex === optIdx;

                  let borderStyle = 'border-[#0F1B3D]/15 bg-[#F7F7F5] text-[#0F1B3D]';
                  if (isCorrectAnswer) {
                    borderStyle = 'border-[#1FAE7A] bg-[#1FAE7A]/15 text-[#0F1B3D] font-bold';
                  } else if (isUserSelected && !isCorrectAnswer) {
                    borderStyle = 'border-[#E5556B] bg-[#E5556B]/15 text-[#E5556B] font-bold';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-lg border flex items-center justify-between ${borderStyle}`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold">{optionLetters[optIdx]}.</span>
                        <span>{optText}</span>
                      </div>
                      {isCorrectAnswer && (
                        <span className="text-[10px] font-mono uppercase bg-[#1FAE7A] text-white px-2 py-0.5 rounded font-bold">
                          Correct Answer
                        </span>
                      )}
                      {isUserSelected && !isCorrectAnswer && (
                        <span className="text-[10px] font-mono uppercase bg-[#E5556B] text-white px-2 py-0.5 rounded font-bold">
                          Your Choice
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
