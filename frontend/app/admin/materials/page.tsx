'use client';

import { useState, useEffect } from 'react';
import {
  getAdminMaterialsList,
  createAdminMaterial,
  deleteAdminMaterial,
  getAdminSubjects,
  getAdminChaptersList,
  createAdminChapter,
  deleteAdminChapter,
  AdminMaterialItem,
  AdminChapterItem,
} from '@/lib/api';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function AdminMaterialsPage() {
  const [activeTab, setActiveTab] = useState<'materials' | 'chapters'>('materials');

  // Core Data
  const [materials, setMaterials] = useState<AdminMaterialItem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<AdminChapterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Success & Error feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // --- Material Upload Form State ---
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'pdf' | 'video' | 'note'>('pdf');
  const [fileUrl, setFileUrl] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cascading Selection State for Material Modal
  const [selectedClass, setSelectedClass] = useState<'XI' | 'XII'>('XI');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');

  // --- Chapter Management Form & Filter State ---
  const [filterClass, setFilterClass] = useState<'all' | 'XI' | 'XII'>('all');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [newChapterClass, setNewChapterClass] = useState<'XI' | 'XII'>('XI');
  const [newChapterSubjectId, setNewChapterSubjectId] = useState<string>('');
  const [newChapterName, setNewChapterName] = useState('');
  const [newChapterOrder, setNewChapterOrder] = useState<number>(1);
  const [chapterFormError, setChapterFormError] = useState<string | null>(null);
  const [isChapterSubmitting, setIsChapterSubmitting] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string; message: string; confirmLabel: string; onConfirm: () => void;
  } | null>(null);

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [mList, sList, cList] = await Promise.all([
        getAdminMaterialsList(),
        getAdminSubjects(),
        getAdminChaptersList(),
      ]);
      setMaterials(mList);
      setSubjects(sList);
      setChapters(cList);

      if (sList.length > 0) {
        if (!selectedSubjectId) setSelectedSubjectId(sList[0].id);
        if (!newChapterSubjectId) setNewChapterSubjectId(sList[0].id);
      }
    } catch (e) {
      console.error('Failed to load materials or chapters:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update cascading available chapters for Material Modal
  const availableChapters = chapters.filter(
    (c) => c.class === selectedClass && (selectedSubjectId ? c.subjectId === selectedSubjectId : true)
  );

  // Automatically update selectedChapterId when cascading filters change
  useEffect(() => {
    if (availableChapters.length > 0) {
      const match = availableChapters.find((c) => c.id === selectedChapterId);
      if (!match) {
        setSelectedChapterId(availableChapters[0].id);
      }
    } else {
      setSelectedChapterId('');
    }
  }, [selectedClass, selectedSubjectId, chapters]);

  // --- Handlers: Study Material ---
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Material title is required.');
      return;
    }
    if (!selectedChapterId) {
      setFormError('Please select a valid linked chapter.');
      return;
    }
    if (type !== 'note' && !fileUrl.trim()) {
      setFormError('Resource URL is required for PDF and Video materials.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdminMaterial({
        title: title.trim(),
        chapterId: selectedChapterId,
        type,
        fileUrl: type !== 'note' ? fileUrl.trim() : undefined,
        noteContent: type === 'note' ? noteContent.trim() : undefined,
      });

      if (res.success && res.data) {
        setActionSuccess(`Material "${res.data.title}" uploaded successfully!`);
        setShowMaterialModal(false);
        setTitle('');
        setFileUrl('');
        setNoteContent('');
        fetchData();
      } else {
        setFormError(res.error || 'Failed to upload material.');
      }
    } catch (err) {
      setFormError('Network error uploading material.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = (mat: AdminMaterialItem) => {
    setPendingConfirm({
      title: 'Delete Study Material',
      message: `Are you sure you want to delete the study material "${mat.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete Material',
      onConfirm: async () => {
        setPendingConfirm(null);
        const ok = await deleteAdminMaterial(mat.id);
        if (ok) {
          setActionSuccess(`Material "${mat.title}" deleted.`);
          fetchData();
        } else {
          alert('Failed to delete material.');
        }
      },
    });
  };

  // --- Handlers: Chapters Management ---
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setChapterFormError(null);

    if (!newChapterName.trim()) {
      setChapterFormError('Chapter name is required.');
      return;
    }
    if (!newChapterSubjectId) {
      setChapterFormError('Subject is required.');
      return;
    }

    setIsChapterSubmitting(true);
    try {
      const res = await createAdminChapter({
        subjectId: newChapterSubjectId,
        class: newChapterClass,
        name: newChapterName.trim(),
        order: Number(newChapterOrder) || 1,
      });

      if (res.success && res.data) {
        setActionSuccess(`Chapter "${res.data.name}" created successfully!`);
        setShowChapterModal(false);
        setNewChapterName('');
        setNewChapterOrder((prev) => prev + 1);
        fetchData();
      } else {
        setChapterFormError(res.error || 'Failed to create chapter.');
      }
    } catch (err) {
      setChapterFormError('Network error creating chapter.');
    } finally {
      setIsChapterSubmitting(false);
    }
  };

  const handleDeleteChapter = (chap: AdminChapterItem) => {
    setPendingConfirm({
      title: 'Delete Chapter',
      message: `Are you sure you want to delete the chapter "${chap.name}"? All materials within this chapter may become orphaned. This action cannot be undone.`,
      confirmLabel: 'Delete Chapter',
      onConfirm: async () => {
        setPendingConfirm(null);
        const ok = await deleteAdminChapter(chap.id);
        if (ok) {
          setActionSuccess(`Chapter "${chap.name}" deleted.`);
          fetchData();
        } else {
          alert('Failed to delete chapter.');
        }
      },
    });
  };

  // Filtered chapter list for Chapters Table
  const filteredChapters = chapters.filter((c) => {
    const classMatch = filterClass === 'all' || c.class === filterClass;
    const subjectMatch = filterSubjectId === 'all' || c.subjectId === filterSubjectId;
    return classMatch && subjectMatch;
  });

  // Helper map for subject name lookup
  const subjectNameMap = new Map<string, string>();
  subjects.forEach((s) => subjectNameMap.set(s.id, s.name));

  return (
    <div className="space-y-6 antialiased">
      {/* Header Banner */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#E8B84A] uppercase tracking-wider block mb-1">
            Content Publishing & Curriculum
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1B3D]">
            Study Materials & Chapters Manager
          </h1>
          <p className="text-xs text-[#0F1B3D]/70 mt-1">
            Manage Class XI & XII subjects, curriculum chapters, and upload PDFs, video modules, and lecture notes.
          </p>
        </div>

        {/* Primary Action Button based on Active Tab */}
        {activeTab === 'materials' ? (
          <button
            onClick={() => {
              setFormError(null);
              setShowMaterialModal(true);
            }}
            className="px-4 py-2.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Upload Material</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setChapterFormError(null);
              setShowChapterModal(true);
            }}
            className="px-4 py-2.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add New Chapter</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Segment Tabs */}
      <div className="flex border-b border-[#0F1B3D]/10 space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 px-1 border-b-2 font-mono transition-colors ${
            activeTab === 'materials'
              ? 'border-[#0F1B3D] text-[#0F1B3D] font-bold'
              : 'border-transparent text-[#0F1B3D]/60 hover:text-[#0F1B3D]'
          }`}
        >
          📚 Study Resources Library ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('chapters')}
          className={`pb-3 px-1 border-b-2 font-mono transition-colors ${
            activeTab === 'chapters'
              ? 'border-[#0F1B3D] text-[#0F1B3D] font-bold'
              : 'border-transparent text-[#0F1B3D]/60 hover:text-[#0F1B3D]'
          }`}
        >
          📖 Curriculum Chapters ({chapters.length})
        </button>
      </div>

      {/* TAB 1: MATERIALS LIBRARY */}
      {activeTab === 'materials' && (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-4">
            <h2 className="font-display font-bold text-lg text-[#0F1B3D]">
              Study Resources Library
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-[#0F1B3D]/60">
              Loading study materials...
            </div>
          ) : materials.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <span className="text-3xl block">📚</span>
              <p className="font-display font-bold text-base text-[#0F1B3D]">No Study Materials Uploaded</p>
              <p className="text-xs text-[#0F1B3D]/60">Click &quot;Upload Material&quot; above to add PDFs or video lectures.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F5] border-b border-[#0F1B3D]/10 text-[#0F1B3D]/70 font-mono uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Chapter</th>
                    <th className="py-3 px-4">Resource Link</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F1B3D]/10 font-sans">
                  {materials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                      <td className="py-3.5 px-4 font-display font-bold text-sm text-[#0F1B3D]">
                        {mat.title}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            mat.type === 'pdf'
                              ? 'bg-red-100 text-red-800'
                              : mat.type === 'video'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {mat.type === 'pdf' ? '📄 PDF' : mat.type === 'video' ? '🎥 VIDEO' : '📝 NOTE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#0F1B3D]/70 font-mono">
                        {mat.chapterName || mat.chapterId}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {mat.fileUrl ? (
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
                          >
                            🔗 Open Resource
                          </a>
                        ) : (
                          <span className="text-[#0F1B3D]/40">No Link</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteMaterial(mat)}
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
      )}

      {/* TAB 2: CHAPTERS MANAGEMENT */}
      {activeTab === 'chapters' && (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#0F1B3D]/10 pb-4">
            <h2 className="font-display font-bold text-lg text-[#0F1B3D]">
              Curriculum Chapters Management
            </h2>

            {/* Filter Controls */}
            <div className="flex items-center gap-3 text-xs">
              <div>
                <label className="font-mono text-[#0F1B3D]/70 mr-1.5">Class:</label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value as any)}
                  className="bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-none"
                >
                  <option value="all">All Classes</option>
                  <option value="XI">Class XI</option>
                  <option value="XII">Class XII</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-[#0F1B3D]/70 mr-1.5">Subject:</label>
                <select
                  value={filterSubjectId}
                  onChange={(e) => setFilterSubjectId(e.target.value)}
                  className="bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-none"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-[#0F1B3D]/60">
              Loading curriculum chapters...
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <span className="text-3xl block">📖</span>
              <p className="font-display font-bold text-base text-[#0F1B3D]">No Chapters Found</p>
              <p className="text-xs text-[#0F1B3D]/60">
                Click &quot;Add New Chapter&quot; above to create chapters for this subject/class filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F5] border-b border-[#0F1B3D]/10 text-[#0F1B3D]/70 font-mono uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Chapter Name</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F1B3D]/10 font-sans">
                  {filteredChapters.map((chap) => (
                    <tr key={chap.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0F1B3D]">
                        #{chap.order}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F1B3D]/5 text-[#0F1B3D]">
                          Class {chap.class}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0F1B3D]">
                        {subjectNameMap.get(chap.subjectId) || chap.subjectId}
                      </td>
                      <td className="py-3.5 px-4 font-display font-bold text-sm text-[#0F1B3D]">
                        {chap.name}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteChapter(chap)}
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
      )}

      {/* MODAL 1: UPLOAD STUDY MATERIAL (CASCADING DROPDOWNS) */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1B3D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#0F1B3D]/15 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-3">
              <h3 className="font-display font-bold text-lg text-[#0F1B3D]">
                Upload Study Material
              </h3>
              <button
                onClick={() => setShowMaterialModal(false)}
                className="text-[#0F1B3D]/60 hover:text-[#0F1B3D] text-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateMaterial} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Material Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Newton's Laws Complete Lecture Notes"
                  required
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Resource Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="video">Video Module</option>
                    <option value="note">Lecture Note</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    1. Select Class *
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value as 'XI' | 'XII')}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D] font-mono"
                  >
                    <option value="XI">Class XI</option>
                    <option value="XII">Class XII</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    2. Select Subject *
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    3. Linked Chapter *
                  </label>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    required
                    disabled={availableChapters.length === 0}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D] disabled:opacity-50"
                  >
                    {availableChapters.length === 0 ? (
                      <option value="">No Chapters Available</option>
                    ) : (
                      availableChapters.map((chap) => (
                        <option key={chap.id} value={chap.id}>
                          #{chap.order} {chap.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {availableChapters.length === 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 font-mono">
                  💡 No chapters exist for Class {selectedClass} in this subject yet. Switch to the &quot;Curriculum Chapters&quot; tab to add chapters first!
                </div>
              )}

              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  {type === 'pdf'
                    ? 'PDF File URL *'
                    : type === 'video'
                    ? 'Video Module URL *'
                    : 'Resource URL *'}
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder={
                    type === 'pdf'
                      ? 'https://example.com/notes.pdf'
                      : 'https://youtube.com/watch?v=...'
                  }
                  required={type !== 'note'}
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#0F1B3D]/10">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || availableChapters.length === 0}
                  className="px-4 py-2 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW CHAPTER */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1B3D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#0F1B3D]/15 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-3">
              <h3 className="font-display font-bold text-lg text-[#0F1B3D]">
                Add Curriculum Chapter
              </h3>
              <button
                onClick={() => setShowChapterModal(false)}
                className="text-[#0F1B3D]/60 hover:text-[#0F1B3D] text-lg"
              >
                ✕
              </button>
            </div>

            {chapterFormError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                ⚠️ {chapterFormError}
              </div>
            )}

            <form onSubmit={handleCreateChapter} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Class Level *
                  </label>
                  <select
                    value={newChapterClass}
                    onChange={(e) => setNewChapterClass(e.target.value as 'XI' | 'XII')}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D] font-mono"
                  >
                    <option value="XI">Class XI</option>
                    <option value="XII">Class XII</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Subject *
                  </label>
                  <select
                    value={newChapterSubjectId}
                    onChange={(e) => setNewChapterSubjectId(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Chapter Name *
                  </label>
                  <input
                    type="text"
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    placeholder="e.g. Thermodynamics & Heat"
                    required
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  />
                </div>

                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Order #
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newChapterOrder}
                    onChange={(e) => setNewChapterOrder(Number(e.target.value))}
                    required
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D] font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#0F1B3D]/10">
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChapterSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 disabled:opacity-50"
                >
                  {isChapterSubmitting ? 'Creating...' : 'Create Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!pendingConfirm}
        title={pendingConfirm?.title || ''}
        message={pendingConfirm?.message || ''}
        confirmLabel={pendingConfirm?.confirmLabel}
        variant="danger"
        onConfirm={() => pendingConfirm?.onConfirm()}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
}
