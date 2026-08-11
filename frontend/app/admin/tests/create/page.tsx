'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminBatches, getAdminSubjects, createAdminTest, AdminBatchItem } from '@/lib/api';

interface QuestionFormState {
  text: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
}

export default function AdminCreateTestPage() {
  const router = useRouter();

  // Settings
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [negativeMarkingRatio, setNegativeMarkingRatio] = useState<number>(0.25);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Metadata arrays
  const [batches, setBatches] = useState<AdminBatchItem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Question sheet
  const [questions, setQuestions] = useState<QuestionFormState[]>([
    { text: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 4 },
  ]);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [bList, sList] = await Promise.all([
          getAdminBatches(false), // only active batches
          getAdminSubjects(),
        ]);
        setBatches(bList);
        setSubjects(sList);
      } catch (e) {
        console.error('Failed to load initial data for test scheduler:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handlers for dynamic questions
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 4 },
    ]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestionText = (idx: number, val: string) => {
    const updated = [...questions];
    updated[idx].text = val;
    setQuestions(updated);
  };

  const updateQuestionOption = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = val;
    setQuestions(updated);
  };

  const updateQuestionCorrectIndex = (qIdx: number, val: number) => {
    const updated = [...questions];
    updated[qIdx].correctOptionIndex = val;
    setQuestions(updated);
  };

  const updateQuestionMarks = (qIdx: number, val: number) => {
    const updated = [...questions];
    updated[qIdx].marks = val;
    setQuestions(updated);
  };

  const toggleBatch = (id: string) => {
    if (selectedBatches.includes(id)) {
      setSelectedBatches(selectedBatches.filter((b) => b !== id));
    } else {
      setSelectedBatches([...selectedBatches, id]);
    }
  };

  const toggleSubject = (id: string) => {
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== id));
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!title.trim()) {
      setFormError('Test Title is required.');
      return;
    }
    if (selectedBatches.length === 0) {
      setFormError('Please select at least one target batch.');
      return;
    }
    if (selectedSubjects.length === 0) {
      setFormError('Please select at least one subject tag.');
      return;
    }
    if (!scheduledAt) {
      setFormError('Please set a scheduled start date & time.');
      return;
    }
    if (durationMinutes <= 0) {
      setFormError('Duration must be greater than 0 minutes.');
      return;
    }

    // Question sheets validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setFormError(`Question #${i + 1} text cannot be blank.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setFormError(`Question #${i + 1}, Option ${j + 1} cannot be blank.`);
          return;
        }
      }
      if (q.marks <= 0) {
        setFormError(`Question #${i + 1} marks must be greater than 0.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        subjectIds: selectedSubjects,
        batchIds: selectedBatches,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(durationMinutes),
        negativeMarkingRatio: Number(negativeMarkingRatio),
        questions: questions.map((q, idx) => ({
          id: `q${idx + 1}`,
          text: q.text.trim(),
          options: q.options.map((o) => o.trim()),
          correctOptionIndex: q.correctOptionIndex,
          marks: Number(q.marks),
        })),
      };

      const res = await createAdminTest(payload);

      if (res.success) {
        router.push('/admin/tests');
      } else {
        setFormError(res.error || 'Failed to schedule test.');
      }
    } catch (err) {
      setFormError('Network error scheduling test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs font-mono text-[#0F1B3D]/60">
        Loading scheduler metadata...
      </div>
    );
  }

  return (
    <div className="space-y-6 antialiased max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <Link
            href="/admin/tests"
            className="text-xs text-[#0F1B3D]/60 hover:text-[#0F1B3D] font-semibold flex items-center gap-1.5 mb-1"
          >
            ← Back to Tests
          </Link>
          <h1 className="font-display font-extrabold text-2xl text-[#0F1B3D]">
            Schedule Mock Test
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {formError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-mono">
            ⚠️ {formError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0F1B3D]/60 border-b border-[#0F1B3D]/10 pb-2">
                1. Test Settings
              </h3>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-[#0F1B3D] mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JEE Main Mock Test - 01"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-[#0F1B3D] mb-1">
                  Scheduled Start Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[#0F1B3D] mb-1">
                    Duration (mins) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[#0F1B3D] mb-1">
                    Neg. Marking Ratio
                  </label>
                  <select
                    value={negativeMarkingRatio}
                    onChange={(e) => setNegativeMarkingRatio(Number(e.target.value))}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    <option value={0}>No Penalty (0%)</option>
                    <option value={0.25}>IIT-JEE / NEET Style (-25%)</option>
                    <option value={0.33}>Boards/Other Style (-33%)</option>
                    <option value={0.5}>Severe Penalty (-50%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Target Batches Selection */}
            <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0F1B3D]/60 border-b border-[#0F1B3D]/10 pb-2">
                2. Target Batches *
              </h3>
              {batches.length === 0 ? (
                <p className="text-[11px] font-mono text-amber-600">No active batches available. Create a batch first.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {batches.map((b) => (
                    <label key={b.id} className="flex items-center space-x-2.5 text-xs text-[#0F1B3D] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBatches.includes(b.id)}
                        onChange={() => toggleBatch(b.id)}
                        className="rounded border-[#0F1B3D]/15 text-[#0F1B3D] focus:ring-0 w-3.5 h-3.5"
                      />
                      <span>
                        <span className="font-bold">{b.name}</span>
                        <span className="text-[#0F1B3D]/60 ml-1 font-mono">({b.class} • {b.stream})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Target Subjects Selection */}
            <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0F1B3D]/60 border-b border-[#0F1B3D]/10 pb-2">
                3. Subject Tags *
              </h3>
              {subjects.length === 0 ? (
                <p className="text-[11px] font-mono text-amber-600">No subjects seeded. Seed database first.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {subjects.map((s) => (
                    <label key={s.id} className="flex items-center space-x-2.5 text-xs text-[#0F1B3D] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(s.id)}
                        onChange={() => toggleSubject(s.id)}
                        className="rounded border-[#0F1B3D]/15 text-[#0F1B3D] focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="font-bold">{s.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Question Builder Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-2">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0F1B3D]/60">
                  4. Question Sheet Builder
                </h3>
                <span className="text-[11px] font-mono font-bold text-[#E8B84A]">
                  Total Questions: {questions.length}
                </span>
              </div>

              <div className="space-y-6">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 bg-[#F7F7F5]/50 border border-[#0F1B3D]/10 rounded-xl space-y-3 relative group">
                    <div className="flex items-center justify-between border-b border-[#0F1B3D]/5 pb-1.5">
                      <span className="font-mono text-xs font-bold text-[#0F1B3D]/80">
                        Question #{qIdx + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="text-[10px] font-mono font-bold text-rose-600 hover:text-rose-800 transition-colors uppercase"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-semibold text-[#0F1B3D]/60 uppercase mb-1">
                        Question Text *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={q.text}
                        onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                        placeholder="e.g. A particle moves along a straight line. Its position is given by..."
                        className="w-full bg-white border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((option, oIdx) => (
                        <div key={oIdx}>
                          <label className="block text-[10px] font-mono font-semibold text-[#0F1B3D]/60 uppercase mb-1">
                            Option {oIdx + 1} *
                          </label>
                          <input
                            type="text"
                            required
                            value={option}
                            onChange={(e) => updateQuestionOption(qIdx, oIdx, e.target.value)}
                            placeholder={`e.g. Value ${oIdx + 1}`}
                            className="w-full bg-white border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#0F1B3D]/5">
                      <div>
                        <label className="block text-[10px] font-mono font-semibold text-[#0F1B3D]/60 uppercase mb-1">
                          Correct Answer Index *
                        </label>
                        <select
                          value={q.correctOptionIndex}
                          onChange={(e) => updateQuestionCorrectIndex(qIdx, Number(e.target.value))}
                          className="w-full bg-white border border-[#0F1B3D]/15 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#0F1B3D] font-semibold"
                        >
                          <option value={0}>Option 1</option>
                          <option value={1}>Option 2</option>
                          <option value={2}>Option 3</option>
                          <option value={3}>Option 4</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-semibold text-[#0F1B3D]/60 uppercase mb-1">
                          Marks Awarded *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={q.marks}
                          onChange={(e) => updateQuestionMarks(qIdx, Number(e.target.value))}
                          className="w-full bg-white border border-[#0F1B3D]/15 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#0F1B3D] font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="w-full py-2.5 border border-dashed border-[#0F1B3D]/30 hover:border-[#0F1B3D]/60 text-[#0F1B3D]/70 hover:text-[#0F1B3D] text-xs font-semibold rounded-lg font-mono transition-all flex items-center justify-center gap-1 bg-[#F7F7F5]/30 hover:bg-[#F7F7F5]/70"
              >
                ➕ Add Question Card
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Link
                href="/admin/tests"
                className="px-4 py-2.5 rounded-lg border border-[#0F1B3D]/15 text-xs font-semibold hover:bg-[#0F1B3D]/5 transition-all text-[#0F1B3D]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Scheduling...' : 'Confirm & Schedule Test'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
