'use client';

import { useState, useEffect } from 'react';
import { getStudentMaterials, MaterialItem } from '@/lib/api';

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getStudentMaterials();
        setMaterials(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Extract unique subjects
  const subjects = Array.from(
    new Set(materials.map((m) => m.subject?.name).filter(Boolean))
  );

  const filteredMaterials = materials.filter(
    (m) => selectedSubject === 'All' || m.subject?.name === selectedSubject
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm">
        <h1 className="font-display font-extrabold text-2xl text-[#0F1B3D]">
          Study Materials & Course Notes
        </h1>
        <p className="text-xs text-[#0F1B3D]/70 mt-1">
          Scoped to your class and stream. Download PDFs or open video lecture links.
        </p>

        {/* Subject Tabs */}
        {subjects.length > 0 && (
          <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-[#0F1B3D]/10 overflow-x-auto">
            <button
              onClick={() => setSelectedSubject('All')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedSubject === 'All'
                  ? 'bg-[#0F1B3D] text-white'
                  : 'bg-[#F7F7F5] text-[#0F1B3D]/70 hover:bg-[#0F1B3D]/10'
              }`}
            >
              All Subjects
            </button>
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedSubject === subj
                    ? 'bg-[#0F1B3D] text-white'
                    : 'bg-[#F7F7F5] text-[#0F1B3D]/70 hover:bg-[#0F1B3D]/10'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-12 text-center text-xs font-mono text-[#0F1B3D]/70">
          Loading study materials...
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-12 text-center text-xs text-[#0F1B3D]/70">
          <p className="text-base font-display font-bold text-[#0F1B3D] mb-1">
            No Study Materials Available
          </p>
          <p>There are no uploaded materials matching your class/subject right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#0F1B3D]/10 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:border-[#0F1B3D]/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#4DA8FF]/15 text-[#4DA8FF]">
                    {item.subject?.name || 'Science'}
                  </span>
                  <span
                    className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                      item.type === 'pdf'
                        ? 'bg-[#E5556B]/10 text-[#E5556B]'
                        : 'bg-[#1FAE7A]/10 text-[#1FAE7A]'
                    }`}
                  >
                    {item.type.toUpperCase()}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base text-[#0F1B3D] mb-1">
                  {item.title}
                </h3>

                {item.chapter?.name && (
                  <p className="text-xs text-[#0F1B3D]/70 font-mono mb-4">
                    Chapter: {item.chapter.name}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[#0F1B3D]/10 flex items-center justify-between">
                <span className="text-[11px] text-[#0F1B3D]/50 font-mono">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>

                {item.type === 'pdf' && item.fileUrl ? (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 transition-colors inline-flex items-center space-x-1"
                  >
                    <span>📄 View PDF</span>
                  </a>
                ) : item.videoUrl ? (
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-[#1FAE7A] text-white text-xs font-semibold hover:bg-[#1FAE7A]/90 transition-colors inline-flex items-center space-x-1"
                  >
                    <span>▶ Watch Video</span>
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
