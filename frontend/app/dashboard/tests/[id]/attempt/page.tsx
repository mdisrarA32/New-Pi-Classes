'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getTestAttempt, submitTestAttempt, TestAttemptPayload, TestQuestion } from '@/lib/api';

export default function TestAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestAttemptPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);

  // Exam state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load test questions
  useEffect(() => {
    async function loadTest() {
      try {
        const res = await getTestAttempt(testId);
        if (res.success && res.data) {
          if (res.data.submitted) {
            setIsAlreadySubmitted(true);
          } else {
            setTestData(res.data);
            setTimeLeft(res.data.remainingSeconds);
            // Initialize answer state
            const initialAnswers: Record<string, number | null> = {};
            res.data.questions.forEach((q) => {
              initialAnswers[q.id] = null;
            });
            setAnswers(initialAnswers);
          }
        } else {
          if (res.error?.code === 'ALREADY_SUBMITTED') {
            setIsAlreadySubmitted(true);
          } else {
            setErrorMessage(res.error?.message || 'Unable to load test attempt.');
          }
        }
      } catch (e) {
        setErrorMessage('Failed to connect to test server.');
      } fontLoading: false;
      setLoading(false);
    }
    loadTest();
  }, [testId]);

  // Server-Synced Timer Effect
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitting || isAlreadySubmitted || !testData) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          handleFinalSubmit(true); // Auto-submit on expiration
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isSubmitting, isAlreadySubmitted, testData]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === optionIndex ? null : optionIndex,
    }));
  };

  const handleClearResponse = (questionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: null }));
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleFinalSubmit = async (autoSubmitted = false) => {
    if (isSubmitting || !testData) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    const payloadAnswers = testData.questions.map((q) => ({
      questionId: q.id,
      selectedOptionIndex: answers[q.id] ?? null,
    }));

    try {
      const res = await submitTestAttempt(testId, payloadAnswers, autoSubmitted);
      if (res.success) {
        router.replace(`/dashboard/tests/${testId}/result`);
      } else {
        if (res.error?.code === 'ALREADY_SUBMITTED') {
          setIsAlreadySubmitted(true);
        } else {
          setErrorMessage(res.error?.message || 'Failed to submit test.');
          setIsSubmitting(false);
        }
      }
    } catch (e) {
      setErrorMessage('Network error during submission.');
      setIsSubmitting(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center font-mono text-[#0F1B3D] text-sm">
        Initializing Secure Exam Interface...
      </div>
    );
  }

  if (isAlreadySubmitted) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white border border-[#0F1B3D]/10 rounded-xl p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#1FAE7A]/15 text-[#1FAE7A] flex items-center justify-center text-2xl mx-auto">
          ✅
        </div>
        <h2 className="font-display font-bold text-2xl text-[#0F1B3D]">
          Test Already Submitted
        </h2>
        <p className="text-xs text-[#0F1B3D]/70 max-w-md mx-auto">
          You have already completed and submitted your responses for this test. Double-submission is blocked.
        </p>
        <div className="pt-4 flex items-center justify-center space-x-4">
          <Link
            href={`/dashboard/tests/${testId}/result`}
            className="px-5 py-2.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-bold hover:bg-[#0F1B3D]/90 transition-colors"
          >
            View Result & Answer Review
          </Link>
          <Link
            href="/dashboard/tests"
            className="px-5 py-2.5 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] text-xs font-semibold hover:bg-[#0F1B3D]/10 transition-colors"
          >
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  if (errorMessage || !testData) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white border border-[#E5556B]/30 rounded-xl p-8 text-center space-y-4 shadow-sm">
        <div className="text-2xl">⚠️</div>
        <h2 className="font-display font-bold text-xl text-[#0F1B3D]">
          Test Access Error
        </h2>
        <p className="text-xs text-[#E5556B] font-mono">{errorMessage}</p>
        <Link
          href="/dashboard/tests"
          className="inline-block px-4 py-2 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold"
        >
          Return to Test List
        </Link>
      </div>
    );
  }

  const currentQuestion = testData.questions[currentIndex];
  const answeredCount = Object.values(answers).filter((a) => a !== null).length;

  return (
    <div className="space-y-6 antialiased selection:bg-[#E8B84A] selection:text-[#0F1B3D]">
      {/* Top Fixed Distraction-Free Header Bar (Solid White, Zero Blur) */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[11px] font-mono font-bold text-[#E8B84A] uppercase tracking-wider block">
            NPC Examination Mode • Distraction Free
          </span>
          <h1 className="font-display font-extrabold text-xl text-[#0F1B3D]">
            {testData.title}
          </h1>
        </div>

        {/* Timer & Submit CTA */}
        <div className="flex items-center space-x-4 w-full sm:w-auto justify-between">
          <div
            className={`px-4 py-2 rounded-lg border font-mono text-sm font-bold flex items-center space-x-2 ${
              timeLeft < 300
                ? 'bg-[#E5556B]/15 border-[#E5556B] text-[#E5556B] animate-pulse'
                : 'bg-[#F7F7F5] border-[#0F1B3D]/15 text-[#0F1B3D]'
            }`}
          >
            <span>⏱️ Time Remaining:</span>
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-[#1FAE7A] text-white text-xs font-bold hover:bg-[#1FAE7A]/90 transition-colors shadow-sm disabled:opacity-50"
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Main Exam Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Active Question Panel */}
        <div className="lg:col-span-3 bg-white border border-[#0F1B3D]/10 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm min-h-[450px]">
          <div>
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-4 mb-6">
              <span className="text-xs font-mono font-bold text-[#0F1B3D]">
                Question {currentIndex + 1} of {testData.questions.length}
              </span>
              <span className="text-xs font-mono text-[#0F1B3D]/60 bg-[#F7F7F5] px-2.5 py-1 rounded">
                +{currentQuestion.marks || 4} Marks / -1 Negative
              </span>
            </div>

            {/* Question Text */}
            <div className="font-display font-bold text-lg sm:text-xl text-[#0F1B3D] leading-relaxed mb-6">
              {currentQuestion.text}
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion.options.map((optText, optIdx) => {
                const isSelected = answers[currentQuestion.id] === optIdx;
                const optionLetters = ['A', 'B', 'C', 'D'];

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                    className={`w-full p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                      isSelected
                        ? 'bg-[#0F1B3D] text-white border-[#0F1B3D]'
                        : 'bg-[#F7F7F5] text-[#0F1B3D] border-[#0F1B3D]/15 hover:border-[#0F1B3D]/40'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 border ${
                        isSelected
                          ? 'bg-[#E8B84A] text-[#0F1B3D] border-[#E8B84A]'
                          : 'bg-white text-[#0F1B3D] border-[#0F1B3D]/20'
                      }`}
                    >
                      {optionLetters[optIdx]}
                    </span>
                    <span className="text-sm font-medium leading-relaxed pt-0.5">
                      {optText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Action Buttons */}
          <div className="pt-6 border-t border-[#0F1B3D]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleMarkForReview(currentQuestion.id)}
                className={`px-3.5 py-2 rounded-lg border font-semibold transition-colors ${
                  markedForReview[currentQuestion.id]
                    ? 'bg-[#E8B84A] text-[#0F1B3D] border-[#E8B84A]'
                    : 'bg-[#F7F7F5] border-[#0F1B3D]/15 text-[#0F1B3D]/70 hover:bg-[#0F1B3D]/10'
                }`}
              >
                {markedForReview[currentQuestion.id] ? '★ Marked for Review' : '☆ Mark for Review'}
              </button>

              {answers[currentQuestion.id] !== null && (
                <button
                  onClick={() => handleClearResponse(currentQuestion.id)}
                  className="px-3.5 py-2 rounded-lg bg-[#E5556B]/10 text-[#E5556B] font-semibold hover:bg-[#E5556B]/20 transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="px-4 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] font-semibold disabled:opacity-40"
              >
                ← Previous
              </button>
              <button
                disabled={currentIndex === testData.questions.length - 1}
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-4 py-2 rounded-lg bg-[#0F1B3D] text-white font-semibold disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette Navigation (Solid White Panel) */}
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 space-y-6 shadow-sm h-fit">
          <h3 className="font-display font-bold text-base text-[#0F1B3D] border-b border-[#0F1B3D]/10 pb-3">
            Question Palette
          </h3>

          <div className="grid grid-cols-5 gap-2">
            {testData.questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;
              const isMarked = markedForReview[q.id];
              const isCurrent = idx === currentIndex;

              let btnClass = 'bg-[#F7F7F5] border-[#0F1B3D]/15 text-[#0F1B3D]';
              if (isMarked) {
                btnClass = 'bg-[#E8B84A] text-[#0F1B3D] border-[#E8B84A] font-bold';
              } else if (isAnswered) {
                btnClass = 'bg-[#1FAE7A] text-white border-[#1FAE7A] font-bold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-lg border text-xs font-mono font-semibold flex items-center justify-center transition-all ${btnClass} ${
                    isCurrent ? 'ring-2 ring-[#0F1B3D] ring-offset-1' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="pt-4 border-t border-[#0F1B3D]/10 space-y-2 text-[11px] font-mono text-[#0F1B3D]/70">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-[#1FAE7A]"></span>
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-[#E8B84A]"></span>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-[#F7F7F5] border border-[#0F1B3D]/20"></span>
              <span>Unattempted ({testData.questions.length - answeredCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-[#0F1B3D]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#0F1B3D]/20 rounded-xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-lg">
            <h3 className="font-display font-bold text-xl text-[#0F1B3D]">
              Confirm Test Submission?
            </h3>
            <div className="text-xs text-[#0F1B3D]/70 space-y-2 font-mono bg-[#F7F7F5] p-4 rounded-lg">
              <p>Total Questions: {testData.questions.length}</p>
              <p className="text-[#1FAE7A] font-bold">Answered: {answeredCount}</p>
              <p className="text-[#0F1B3D]/60">
                Unattempted: {testData.questions.length - answeredCount}
              </p>
            </div>
            <p className="text-xs text-[#0F1B3D]/80 leading-relaxed">
              Are you sure you want to submit? Once submitted, your answers cannot be altered.
            </p>
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] text-xs font-semibold"
              >
                Continue Exam
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-[#1FAE7A] text-white text-xs font-bold hover:bg-[#1FAE7A]/90 transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
