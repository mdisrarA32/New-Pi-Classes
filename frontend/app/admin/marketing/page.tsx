'use client';

import { useState, useEffect } from 'react';
import {
  getAdminTestimonialsList,
  createAdminTestimonial,
  updateAdminTestimonial,
  deleteAdminTestimonial,
  getAdminCoursesList,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  AdminTestimonialItem,
  AdminCourseItem,
} from '@/lib/api';

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<'testimonials' | 'courses'>('testimonials');

  // Testimonials State
  const [testimonials, setTestimonials] = useState<AdminTestimonialItem[]>([]);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [resultText, setResultText] = useState('');
  const [quote, setQuote] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Courses State
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseClass, setCourseClass] = useState<'XI' | 'XII'>('XI');
  const [courseStream, setCourseStream] = useState<'JEE' | 'NEET' | 'Foundation'>('NEET');
  const [fee, setFee] = useState<number>(45000);
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tList, cList] = await Promise.all([
        getAdminTestimonialsList(),
        getAdminCoursesList(),
      ]);
      setTestimonials(tList);
      setCourses(cList);
    } catch (e) {
      console.error('Failed to load marketing data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Testimonials Handlers --- */
  const handleCreateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!studentName.trim() || !resultText.trim() || !quote.trim()) {
      setFormError('Student name, rank/result text, and testimonial quote are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdminTestimonial({
        studentName: studentName.trim(),
        resultText: resultText.trim(),
        quote: quote.trim(),
        photoUrl: photoUrl.trim() || undefined,
        isPublished: true, // Published by default on create
      });

      if (res.success && res.data) {
        setActionSuccess(`Testimonial for "${res.data.studentName}" created & published!`);
        setShowTestimonialModal(false);
        setStudentName('');
        setResultText('');
        setQuote('');
        setPhotoUrl('');
        fetchData();
      } else {
        setFormError(res.error || 'Failed to create testimonial.');
      }
    } catch (err) {
      setFormError('Network error creating testimonial.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (t: AdminTestimonialItem) => {
    const nextState = !t.isPublished;
    const ok = await updateAdminTestimonial(t.id, { isPublished: nextState });
    if (ok) {
      setActionSuccess(`Testimonial for "${t.studentName}" ${nextState ? 'PUBLISHED to public site' : 'UNPUBLISHED'}.`);
      fetchData();
    } else {
      alert('Failed to update publish state.');
    }
  };

  const handleDeleteTestimonial = async (t: AdminTestimonialItem) => {
    if (!confirm(`Delete testimonial for "${t.studentName}"?`)) return;
    const ok = await deleteAdminTestimonial(t.id);
    if (ok) {
      setActionSuccess(`Testimonial for "${t.studentName}" deleted.`);
      fetchData();
    } else {
      alert('Failed to delete testimonial.');
    }
  };

  /* --- Courses Handlers --- */
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!courseName.trim() || !fee) {
      setFormError('Course name and tuition fee are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdminCourse({
        name: courseName.trim(),
        class: courseClass,
        stream: courseStream,
        fee: Number(fee),
        description: description.trim(),
      });

      if (res.success && res.data) {
        setActionSuccess(`Course "${res.data.name}" added to public catalog!`);
        setShowCourseModal(false);
        setCourseName('');
        setDescription('');
        fetchData();
      } else {
        setFormError(res.error || 'Failed to create course.');
      }
    } catch (err) {
      setFormError('Network error creating course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (c: AdminCourseItem) => {
    if (!confirm(`Delete course "${c.name}"?`)) return;
    const ok = await deleteAdminCourse(c.id);
    if (ok) {
      setActionSuccess(`Course "${c.name}" deleted.`);
      fetchData();
    } else {
      alert('Failed to delete course.');
    }
  };

  return (
    <div className="space-y-6 antialiased">
      {/* Header Banner */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#E8B84A] uppercase tracking-wider block mb-1">
            Marketing & Website Content
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1B3D]">
            Public Site & Testimonials
          </h1>
          <p className="text-xs text-[#0F1B3D]/70 mt-1">
            Manage public course offerings, fee structures, and publish/unpublish student success testimonials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFormError(null);
              setShowTestimonialModal(true);
            }}
            className="px-4 py-2.5 rounded-lg bg-[#E8B84A] text-[#0F1B3D] text-xs font-bold hover:bg-[#E8B84A]/90 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add Testimonial</span>
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setShowCourseModal(true);
            }}
            className="px-4 py-2.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#0F1B3D]/10 font-mono text-xs font-bold">
        <button
          onClick={() => setActiveTab('testimonials')}
          className={`pb-3 px-4 transition-colors border-b-2 ${
            activeTab === 'testimonials'
              ? 'border-[#0F1B3D] text-[#0F1B3D]'
              : 'border-transparent text-[#0F1B3D]/60 hover:text-[#0F1B3D]'
          }`}
        >
          🌟 Testimonials ({testimonials.length})
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 px-4 transition-colors border-b-2 ${
            activeTab === 'courses'
              ? 'border-[#0F1B3D] text-[#0F1B3D]'
              : 'border-transparent text-[#0F1B3D]/60 hover:text-[#0F1B3D]'
          }`}
        >
          🎓 Public Courses ({courses.length})
        </button>
      </div>

      {/* Testimonials Tab Content */}
      {activeTab === 'testimonials' && (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-4">
            <h2 className="font-display font-bold text-lg text-[#0F1B3D]">
              Student Success Stories & Testimonials ({testimonials.length})
            </h2>
            <span className="text-xs font-mono text-[#0F1B3D]/60">
              {testimonials.filter((t) => t.isPublished).length} Published to Homepage
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-[#0F1B3D]/60">
              Loading testimonials...
            </div>
          ) : testimonials.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <span className="text-3xl block">🌟</span>
              <p className="font-display font-bold text-base text-[#0F1B3D]">No Testimonials Added</p>
              <p className="text-xs text-[#0F1B3D]/60">Click &quot;Add Testimonial&quot; above to create public student reviews.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F5] border-b border-[#0F1B3D]/10 text-[#0F1B3D]/70 font-mono uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Result / AIR</th>
                    <th className="py-3 px-4">Quote</th>
                    <th className="py-3 px-4">Homepage Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F1B3D]/10 font-sans">
                  {testimonials.map((t) => (
                    <tr key={t.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                      <td className="py-3.5 px-4 font-display font-bold text-sm text-[#0F1B3D]">
                        {t.studentName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#E8B84A]">
                        {t.resultText}
                      </td>
                      <td className="py-3.5 px-4 text-[#0F1B3D]/80 max-w-xs italic truncate">
                        &quot;{t.quote}&quot;
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <button
                          onClick={() => handleTogglePublish(t)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                            t.isPublished
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${t.isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {t.isPublished ? 'Published ON' : 'Unpublished OFF'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteTestimonial(t)}
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

      {/* Courses Tab Content */}
      {activeTab === 'courses' && (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-4">
            <h2 className="font-display font-bold text-lg text-[#0F1B3D]">
              Public Course Offerings ({courses.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-[#0F1B3D]/60">
              Loading courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <span className="text-3xl block">🎓</span>
              <p className="font-display font-bold text-base text-[#0F1B3D]">No Public Courses Configured</p>
              <p className="text-xs text-[#0F1B3D]/60">Click &quot;Add Course&quot; above to define course fees and descriptions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F5] border-b border-[#0F1B3D]/10 text-[#0F1B3D]/70 font-mono uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Course Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Stream</th>
                    <th className="py-3 px-4">Tuition Fee</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F1B3D]/10 font-sans">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                      <td className="py-3.5 px-4 font-display font-bold text-sm text-[#0F1B3D]">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold">
                        Class {c.class}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#E8B84A]">
                        {c.stream}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-[#0F1B3D]">
                        ₹{c.fee.toLocaleString()} / year
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCourse(c)}
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

      {/* Add Testimonial Modal */}
      {showTestimonialModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1B3D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#0F1B3D]/15 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-3">
              <h3 className="font-display font-bold text-lg text-[#0F1B3D]">
                Add Student Testimonial
              </h3>
              <button onClick={() => setShowTestimonialModal(false)} className="text-[#0F1B3D]/60 hover:text-[#0F1B3D] text-lg">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateTestimonial} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Ananya Roy"
                  required
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Result / Rank Text *
                </label>
                <input
                  type="text"
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="e.g. NEET 2025 AIR 640 • 680/720 Marks"
                  required
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Testimonial Quote *
                </label>
                <textarea
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  rows={3}
                  placeholder="e.g. The doubt sessions and mock test series at NPC made all the difference..."
                  required
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Student Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/student-photo.jpg"
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#0F1B3D]/10">
                <button
                  type="button"
                  onClick={() => setShowTestimonialModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add & Publish Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1B3D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#0F1B3D]/15 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-3">
              <h3 className="font-display font-bold text-lg text-[#0F1B3D]">
                Add Public Course
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="text-[#0F1B3D]/60 hover:text-[#0F1B3D] text-lg">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. 2-Year Integrated NEET Medical Program"
                  required
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Class *
                  </label>
                  <select
                    value={courseClass}
                    onChange={(e) => setCourseClass(e.target.value as 'XI' | 'XII')}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    <option value="XI">Class XI</option>
                    <option value="XII">Class XII</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Stream *
                  </label>
                  <select
                    value={courseStream}
                    onChange={(e) => setCourseStream(e.target.value as 'JEE' | 'NEET' | 'Foundation')}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    <option value="NEET">NEET</option>
                    <option value="JEE">JEE</option>
                    <option value="Foundation">Foundation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Annual Tuition Fee (₹) *
                </label>
                <input
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  placeholder="45000"
                  required
                  min={0}
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Course highlights, test series, and batch timing details..."
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#0F1B3D]/10">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
