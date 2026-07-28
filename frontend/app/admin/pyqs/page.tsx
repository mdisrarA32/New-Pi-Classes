'use client';

import { useState, useEffect } from 'react';
import {
  getAdminPYQsList,
  createAdminPYQ,
  deleteAdminPYQ,
  getAdminSubjects,
  AdminPYQItem,
} from '@/lib/api';

export default function AdminPYQsPage() {
  const [pyqs, setPyqs] = useState<AdminPYQItem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [examTypeFilter, setExamTypeFilter] = useState<'all' | 'JEE' | 'NEET'>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [classLevel, setClassLevel] = useState<'XI' | 'XII'>('XI');
  const [examType, setExamType] = useState<'JEE' | 'NEET'>('NEET');
  const [subjectId, setSubjectId] = useState('');
  const [year, setYear] = useState<number>(2024);
  const [fileUrl, setFileUrl] = useState('');
  const [solutionUrl, setSolutionUrl] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pList, sList] = await Promise.all([getAdminPYQsList(), getAdminSubjects()]);
      setPyqs(pList);
      setSubjects(sList);
      if (sList.length > 0) setSubjectId(sList[0].id);
    } catch (e) {
      console.error('Failed to load PYQs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !subjectId || !fileUrl.trim() || !year) {
      setFormError('Title, subject, year, and paper PDF URL are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdminPYQ({
        title: title.trim(),
        class: classLevel,
        examType: examType,
        subjectId,
        year: Number(year),
        fileUrl: fileUrl.trim(),
        solutionUrl: solutionUrl.trim() || undefined,
      });

      if (res.success && res.data) {
        setActionSuccess(`PYQ paper "${res.data.title}" added to question bank!`);
        setShowModal(false);
        setTitle('');
        setFileUrl('');
        setSolutionUrl('');
        fetchData();
      } else {
        setFormError(res.error || 'Failed to add PYQ.');
      }
    } catch (err) {
      setFormError('Network error creating PYQ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (pyq: AdminPYQItem) => {
    if (!confirm(`Delete PYQ paper "${pyq.title}"?`)) return;
    const ok = await deleteAdminPYQ(pyq.id);
    if (ok) {
      setActionSuccess(`PYQ paper "${pyq.title}" deleted.`);
      fetchData();
    } else {
      alert('Failed to delete PYQ.');
    }
  };

  const filteredPYQs = pyqs.filter((p) => {
    if (examTypeFilter !== 'all' && p.examType !== examTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 antialiased">
      {/* Header Banner */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#E8B84A] uppercase tracking-wider block mb-1">
            Exam Prep Management
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1B3D]">
            PYQ Bank Management
          </h1>
          <p className="text-xs text-[#0F1B3D]/70 mt-1">
            Manage Previous Year Question papers and detailed solution keys for JEE and NEET aspirants.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setShowModal(true);
          }}
          className="px-4 py-2.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Add PYQ Paper</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-4 shadow-sm flex items-center gap-3">
        <span className="text-xs font-mono font-semibold text-[#0F1B3D]/70">Filter Exam Type:</span>
        <div className="flex items-center gap-2">
          {(['all', 'JEE', 'NEET'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setExamTypeFilter(type)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                examTypeFilter === type
                  ? 'bg-[#0F1B3D] text-white'
                  : 'bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D]/70 hover:bg-[#0F1B3D]/10'
              }`}
            >
              {type === 'all' ? 'All Exams' : type}
            </button>
          ))}
        </div>
      </div>

      {/* PYQ List Table */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-4">
          <h2 className="font-display font-bold text-lg text-[#0F1B3D]">
            PYQ Bank Papers ({filteredPYQs.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-[#0F1B3D]/60">
            Loading PYQ papers...
          </div>
        ) : filteredPYQs.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <span className="text-3xl block">📝</span>
            <p className="font-display font-bold text-base text-[#0F1B3D]">No PYQ Papers Found</p>
            <p className="text-xs text-[#0F1B3D]/60">Click &quot;Add PYQ Paper&quot; above to add JEE or NEET exam papers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] border-b border-[#0F1B3D]/10 text-[#0F1B3D]/70 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Exam Type</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Question Paper</th>
                  <th className="py-3 px-4">Solution Key</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1B3D]/10 font-sans">
                {filteredPYQs.map((pyq) => (
                  <tr key={pyq.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                    <td className="py-3.5 px-4 font-display font-bold text-sm text-[#0F1B3D]">
                      {pyq.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold ${
                          pyq.examType === 'NEET'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {pyq.examType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      Class {pyq.class}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F1B3D]">
                      {pyq.year}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <a
                        href={pyq.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-[11px]"
                      >
                        📄 Download Paper
                      </a>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {pyq.solutionUrl ? (
                        <a
                          href={pyq.solutionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline text-[11px]"
                        >
                          💡 Solution PDF
                        </a>
                      ) : (
                        <span className="text-[#0F1B3D]/40">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(pyq)}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold font-mono bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add PYQ Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1B3D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#0F1B3D]/15 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-3">
              <h3 className="font-display font-bold text-lg text-[#0F1B3D]">
                Add PYQ Paper
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#0F1B3D]/60 hover:text-[#0F1B3D] text-lg">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Paper Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. NEET 2024 Physics Question Paper with Solutions"
                  required
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Exam Type *
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as 'JEE' | 'NEET')}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    <option value="NEET">NEET</option>
                    <option value="JEE">JEE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Class *
                  </label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value as 'XI' | 'XII')}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    <option value="XI">Class XI</option>
                    <option value="XII">Class XII</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10))}
                    required
                    min={2000}
                    max={2030}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Subject *
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Class {s.class})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Paper PDF URL *
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://example.com/neet-2024-physics.pdf"
                  required
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Solution Key PDF URL (Optional)
                </label>
                <input
                  type="url"
                  value={solutionUrl}
                  onChange={(e) => setSolutionUrl(e.target.value)}
                  placeholder="https://example.com/neet-2024-solutions.pdf"
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#0F1B3D]/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add PYQ Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
