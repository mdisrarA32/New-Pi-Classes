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
  getAdminFacultyList,
  createAdminFaculty,
  updateAdminFaculty,
  deleteAdminFaculty,
  AdminTestimonialItem,
  AdminCourseItem,
  FacultyItem,
} from '@/lib/api';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<'testimonials' | 'courses' | 'faculty'>('testimonials');

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

  // Faculty State
  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyName, setFacultyName] = useState('');
  const [facultyRole, setFacultyRole] = useState('');
  const [facultySubject, setFacultySubject] = useState<'Physics' | 'Chemistry' | 'Biology' | 'Mathematics'>('Physics');
  const [facultyQual, setFacultyQual] = useState('');
  const [facultySpec, setFacultySpec] = useState('');
  const [facultyBio, setFacultyBio] = useState('');

  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string; message: string; confirmLabel: string; onConfirm: () => void;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tList, cList, fList] = await Promise.all([
        getAdminTestimonialsList(),
        getAdminCoursesList(),
        getAdminFacultyList(),
      ]);
      setTestimonials(tList);
      setCourses(cList);
      setFacultyList(fList);
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
        isPublished: true,
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

  const handleDeleteTestimonial = (t: AdminTestimonialItem) => {
    setPendingConfirm({
      title: 'Delete Testimonial',
      message: `Are you sure you want to delete the testimonial for "${t.studentName}"? This will remove it from the public site if published.`,
      confirmLabel: 'Delete Testimonial',
      onConfirm: async () => {
        setPendingConfirm(null);
        const ok = await deleteAdminTestimonial(t.id);
        if (ok) {
          setActionSuccess(`Testimonial for "${t.studentName}" deleted.`);
          fetchData();
        } else {
          alert('Failed to delete testimonial.');
        }
      },
    });
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

  const handleDeleteCourse = (c: AdminCourseItem) => {
    setPendingConfirm({
      title: 'Delete Course',
      message: `Are you sure you want to delete the course "${c.name}"? This will remove it from the public fee catalog.`,
      confirmLabel: 'Delete Course',
      onConfirm: async () => {
        setPendingConfirm(null);
        const ok = await deleteAdminCourse(c.id);
        if (ok) {
          setActionSuccess(`Course "${c.name}" deleted.`);
          fetchData();
        } else {
          alert('Failed to delete course.');
        }
      },
    });
  };

  /* --- Faculty Handlers --- */
  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!facultyName.trim() || !facultyRole.trim() || !facultyQual.trim() || !facultyBio.trim()) {
      setFormError('Name, title/role, qualification, and bio are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdminFaculty({
        name: facultyName.trim(),
        role: facultyRole.trim(),
        subject: facultySubject,
        qualification: facultyQual.trim(),
        specialization: facultySpec.trim() || undefined,
        bio: facultyBio.trim(),
        isPublished: true,
      });

      if (res.success && res.data) {
        setActionSuccess(`Faculty member "${res.data.name}" added to directory!`);
        setShowFacultyModal(false);
        setFacultyName('');
        setFacultyRole('');
        setFacultyQual('');
        setFacultySpec('');
        setFacultyBio('');
        fetchData();
      } else {
        setFormError(res.error || 'Failed to add faculty member.');
      }
    } catch (err) {
      setFormError('Network error creating faculty member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFacultyPublish = async (f: FacultyItem) => {
    const nextState = !f.isPublished;
    const ok = await updateAdminFaculty(f.id, { isPublished: nextState });
    if (ok) {
      setActionSuccess(`Faculty "${f.name}" ${nextState ? 'PUBLISHED to public site' : 'UNPUBLISHED'}.`);
      fetchData();
    } else {
      alert('Failed to update publish status.');
    }
  };

  const handleDeleteFaculty = (f: FacultyItem) => {
    setPendingConfirm({
      title: 'Delete Faculty Member',
      message: `Are you sure you want to delete "${f.name}" (${f.role})? This will remove them from the public faculty page.`,
      confirmLabel: 'Delete Faculty Member',
      onConfirm: async () => {
        setPendingConfirm(null);
        const ok = await deleteAdminFaculty(f.id);
        if (ok) {
          setActionSuccess(`Faculty member "${f.name}" deleted.`);
          fetchData();
        } else {
          alert('Failed to delete faculty member.');
        }
      },
    });
  };

  return (
    <div className="space-y-6 antialiased">
      {/* Page Header */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#E8B84A] uppercase tracking-wider block mb-1">
            Public Website Content
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1B3D]">
            Marketing & Public Content Management
          </h1>
          <p className="text-xs text-[#0F1B3D]/70 mt-1">
            Manage public course offerings, fee structures, faculty directory, and student success testimonials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'testimonials' && (
            <button
              onClick={() => { setFormError(null); setShowTestimonialModal(true); }}
              className="px-4 py-2.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 transition-colors shadow-sm"
            >
              + Add Testimonial
            </button>
          )}
          {activeTab === 'courses' && (
            <button
              onClick={() => { setFormError(null); setShowCourseModal(true); }}
              className="px-4 py-2.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 transition-colors shadow-sm"
            >
              + Add Public Course
            </button>
          )}
          {activeTab === 'faculty' && (
            <button
              onClick={() => { setFormError(null); setShowFacultyModal(true); }}
              className="px-4 py-2.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 transition-colors shadow-sm"
            >
              + Add Faculty Member
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-lg flex items-center justify-between">
          <span>✅ {actionSuccess}</span>
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
        <button
          onClick={() => setActiveTab('faculty')}
          className={`pb-3 px-4 transition-colors border-b-2 ${
            activeTab === 'faculty'
              ? 'border-[#0F1B3D] text-[#0F1B3D]'
              : 'border-transparent text-[#0F1B3D]/60 hover:text-[#0F1B3D]'
          }`}
        >
          👨‍🏫 Faculty Members ({facultyList.length})
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((t) => (
                <div key={t.id} className="border border-[#0F1B3D]/10 rounded-xl p-5 space-y-3 bg-[#F7F7F5]/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-base text-[#0F1B3D]">{t.studentName}</h4>
                      <span className="text-xs font-mono font-bold text-[#E8B84A] px-2.5 py-0.5 rounded bg-[#0F1B3D]">
                        {t.resultText}
                      </span>
                    </div>
                    <p className="text-xs text-[#0F1B3D]/70 italic mt-2 leading-relaxed">&quot;{t.quote}&quot;</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#0F1B3D]/10">
                    <button
                      onClick={() => handleTogglePublish(t)}
                      className={`text-xs font-mono font-semibold px-2.5 py-1 rounded transition-colors ${
                        t.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {t.isPublished ? 'Published' : 'Draft'}
                    </button>
                    <button
                      onClick={() => handleDeleteTestimonial(t)}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold font-mono bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Courses Tab Content */}
      {activeTab === 'courses' && (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-4">
            <h2 className="font-display font-bold text-lg text-[#0F1B3D]">
              Public Course Catalog ({courses.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-[#0F1B3D]/60">
              Loading courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <span className="text-3xl block">🎓</span>
              <p className="font-display font-bold text-base text-[#0F1B3D]">No Public Courses</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((c) => (
                <div key={c.id} className="border border-[#0F1B3D]/10 rounded-xl p-5 space-y-3 bg-[#F7F7F5]/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-display font-bold text-base text-[#0F1B3D]">{c.name}</h4>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ₹{c.fee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#0F1B3D]/60 mb-2">
                      <span>Class {c.class}</span>
                      <span>•</span>
                      <span>{c.stream} Stream</span>
                    </div>
                    <p className="text-xs text-[#0F1B3D]/70">{c.description}</p>
                  </div>
                  <div className="flex items-center justify-end pt-3 border-t border-[#0F1B3D]/10">
                    <button
                      onClick={() => handleDeleteCourse(c)}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold font-mono bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Faculty Tab Content */}
      {activeTab === 'faculty' && (
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-4">
            <h2 className="font-display font-bold text-lg text-[#0F1B3D]">
              Faculty Members Directory ({facultyList.length})
            </h2>
            <span className="text-xs font-mono text-[#0F1B3D]/60">
              {facultyList.filter((f) => f.isPublished).length} Published to Public Site
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-[#0F1B3D]/60">
              Loading faculty directory...
            </div>
          ) : facultyList.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <span className="text-3xl block">👨‍🏫</span>
              <p className="font-display font-bold text-base text-[#0F1B3D]">No Faculty Members Added</p>
              <p className="text-xs text-[#0F1B3D]/60">Click &quot;Add Faculty Member&quot; above to add instructors to the public site.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#0F1B3D]/10 text-[11px] font-mono font-bold text-[#0F1B3D]/60 uppercase tracking-wider">
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Qualification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F1B3D]/10 text-xs">
                  {facultyList.map((f) => (
                    <tr key={f.id} className="hover:bg-[#F7F7F5]/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-display font-bold text-[#0F1B3D] text-sm">{f.name}</p>
                        <p className="text-[11px] text-[#0F1B3D]/60 font-mono">{f.role}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E8B84A]/20 text-[#0F1B3D] border border-[#E8B84A]/40">
                          {f.subject}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#0F1B3D]/80">
                        {f.qualification}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleFacultyPublish(f)}
                          className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded transition-colors ${
                            f.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {f.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteFaculty(f)}
                          className="px-2.5 py-1 rounded text-[11px] font-semibold font-mono bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                        >
                          🗑️ Delete
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
        <div className="fixed inset-0 z-50 bg-[#0F1B3D]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#0F1B3D]/10 space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0F1B3D]">Add Student Testimonial</h3>
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-lg">{formError}</div>
            )}
            <form onSubmit={handleCreateTestimonial} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Rank / Exam Tag *</label>
                <input
                  type="text"
                  required
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="e.g. AIR 452, NEET 2025"
                  className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Testimonial Quote *</label>
                <textarea
                  required
                  rows={3}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Quote from the student..."
                  className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestimonialModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0F1B3D] text-white hover:bg-[#0F1B3D]/90"
                >
                  {isSubmitting ? 'Posting...' : 'Post Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1B3D]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#0F1B3D]/10 space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0F1B3D]">Add Public Course Offering</h3>
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-lg">{formError}</div>
            )}
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Class XI NEET Target Batch"
                  className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Class Level *</label>
                  <select
                    value={courseClass}
                    onChange={(e) => setCourseClass(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    <option value="XI">Class XI</option>
                    <option value="XII">Class XII</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Stream *</label>
                  <select
                    value={courseStream}
                    onChange={(e) => setCourseStream(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                    <option value="Foundation">Foundation</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Tuition Fee (₹) *</label>
                <input
                  type="number"
                  required
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  placeholder="e.g. 45000"
                  className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief course overview..."
                  className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0F1B3D] text-white hover:bg-[#0F1B3D]/90"
                >
                  {isSubmitting ? 'Saving...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
      {showFacultyModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1B3D]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#0F1B3D]/10 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-[#0F1B3D]">Add Faculty Member</h3>
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-lg">{formError}</div>
            )}
            <form onSubmit={handleCreateFaculty} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Faculty Full Name *</label>
                <input
                  type="text"
                  required
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  placeholder="e.g. Er. Rajesh Sharma"
                  className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Title / Role *</label>
                <input
                  type="text"
                  required
                  value={facultyRole}
                  onChange={(e) => setFacultyRole(e.target.value)}
                  placeholder="e.g. Senior Physics Faculty & Co-Founder"
                  className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Subject *</label>
                  <select
                    value={facultySubject}
                    onChange={(e) => setFacultySubject(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Qualification *</label>
                  <input
                    type="text"
                    required
                    value={facultyQual}
                    onChange={(e) => setFacultyQual(e.target.value)}
                    placeholder="e.g. B.Tech (IIT Kanpur)"
                    className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Specialization</label>
                <input
                  type="text"
                  value={facultySpec}
                  onChange={(e) => setFacultySpec(e.target.value)}
                  placeholder="e.g. Mechanics & Optics for JEE Advanced"
                  className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#0F1B3D]/70 mb-1">Bio / Description *</label>
                <textarea
                  required
                  rows={3}
                  value={facultyBio}
                  onChange={(e) => setFacultyBio(e.target.value)}
                  placeholder="Faculty bio and teaching methodology intuition..."
                  className="w-full px-3 py-2 rounded-lg border border-[#0F1B3D]/20 text-xs focus:outline-none focus:border-[#0F1B3D]"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFacultyModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0F1B3D] text-white hover:bg-[#0F1B3D]/90"
                >
                  {isSubmitting ? 'Saving...' : 'Add Faculty Member'}
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
