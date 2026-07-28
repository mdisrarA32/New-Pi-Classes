'use client';

import { useState, useEffect } from 'react';
import { getStudentPYQs, PYQItem } from '@/lib/api';

export default function StudentPYQPage() {
  const [pyqs, setPyqs] = useState<PYQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedExamType, setSelectedExamType] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getStudentPYQs();
        setPyqs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const subjects = Array.from(new Set(pyqs.map((p) => p.subject?.name).filter(Boolean)));
  const years = Array.from(new Set(pyqs.map((p) => p.year).filter(Boolean))).sort((a, b) => b - a);

  const filteredPYQs = pyqs.filter((p) => {
    const subjMatch = selectedSubject === 'All' || p.subject?.name === selectedSubject;
    const examMatch = selectedExamType === 'All' || p.examType === selectedExamType;
    const yearMatch = selectedYear === 'All' || p.year.toString() === selectedYear;
    return subjMatch && examMatch && yearMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm">
        <h1 className="font-display font-extrabold text-2xl text-[#0F1B3D]">
          Previous Year Questions (PYQ Bank)
        </h1>
        <p className="text-xs text-[#0F1B3D]/70 mt-1">
          Practice past JEE & NEET exam papers with step-by-step solutions.
        </p>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#0F1B3D]/10 text-xs">
          {/* Exam Type Filter (Strictly JEE & NEET per Schema) */}
          <div>
            <label className="block text-[#0F1B3D]/70 font-mono mb-1 font-semibold">
              Exam Type
            </label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] focus:outline-none focus:border-[#0F1B3D]"
            >
              <option value="All">All Exam Types</option>
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[#0F1B3D]/70 font-mono mb-1 font-semibold">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] focus:outline-none focus:border-[#0F1B3D]"
            >
              <option value="All">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[#0F1B3D]/70 font-mono mb-1 font-semibold">
              Exam Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] focus:outline-none focus:border-[#0F1B3D]"
            >
              <option value="All">All Years</option>
              {years.map((y) => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* PYQ Cards List */}
      {loading ? (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-12 text-center text-xs font-mono text-[#0F1B3D]/70">
          Loading PYQ bank...
        </div>
      ) : filteredPYQs.length === 0 ? (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-12 text-center text-xs text-[#0F1B3D]/70">
          <p className="text-base font-display font-bold text-[#0F1B3D] mb-1">
            No PYQs Found
          </p>
          <p>No questions matched your selected filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPYQs.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#0F1B3D]/10 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:border-[#0F1B3D]/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#E8B84A]/20 text-[#0F1B3D]">
                    {item.examType} • {item.year}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-[#0F1B3D]/70">
                    Class {item.class}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base text-[#0F1B3D] mb-1">
                  {item.title}
                </h3>

                <p className="text-xs text-[#0F1B3D]/70 font-mono mb-4">
                  Subject: {item.subject?.name || 'General'}
                  {item.chapter?.name ? ` — ${item.chapter.name}` : ''}
                </p>
              </div>

              <div className="pt-4 border-t border-[#0F1B3D]/10 flex items-center justify-between">
                <span className="text-[11px] text-[#0F1B3D]/50 font-mono">
                  Verified Paper
                </span>

                {item.fileUrl && (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 transition-colors inline-flex items-center space-x-1"
                  >
                    <span>📥 Download Paper</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
