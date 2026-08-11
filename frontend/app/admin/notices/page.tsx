'use client';

import { useState, useEffect } from 'react';
import {
  getAdminNoticesList,
  createAdminNotice,
  deleteAdminNotice,
  getAdminBatches,
  AdminNoticeItem,
  AdminBatchItem,
} from '@/lib/api';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<AdminNoticeItem[]>([]);
  const [batches, setBatches] = useState<AdminBatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scope, setScope] = useState<'global' | 'batch'>('global');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nList, bList] = await Promise.all([getAdminNoticesList(), getAdminBatches(true)]);
      setNotices(nList);
      setBatches(bList);
      if (bList.length > 0) setSelectedBatchId(bList[0].id);
    } catch (e) {
      console.error('Failed to load notices:', e);
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

    if (!title.trim() || !body.trim()) {
      setFormError('Notice title and content body are required.');
      return;
    }

    if (scope === 'batch' && !selectedBatchId) {
      setFormError('Please select a target batch for scoped notice.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdminNotice({
        title: title.trim(),
        body: body.trim(),
        scope,
        batchIds: scope === 'batch' ? [selectedBatchId] : [],
      });

      if (res.success && res.data) {
        setActionSuccess(`Announcement "${res.data.title}" posted successfully!`);
        setShowModal(false);
        setTitle('');
        setBody('');
        fetchData();
      } else {
        setFormError(res.error || 'Failed to post notice.');
      }
    } catch (err) {
      setFormError('Network error posting notice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (notice: AdminNoticeItem) => {
    setPendingConfirm({
      title: 'Delete Announcement',
      message: `Are you sure you want to delete the announcement "${notice.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete Notice',
      onConfirm: async () => {
        setPendingConfirm(null);
        const ok = await deleteAdminNotice(notice.id);
        if (ok) {
          setActionSuccess(`Notice "${notice.title}" deleted.`);
          fetchData();
        } else {
          alert('Failed to delete notice.');
        }
      },
    });
  };

  return (
    <div className="space-y-6 antialiased">
      {/* Header Banner */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#E8B84A] uppercase tracking-wider block mb-1">
            Communication Center
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1B3D]">
            Notice Board & Announcements
          </h1>
          <p className="text-xs text-[#0F1B3D]/70 mt-1">
            Broadcast global institute notices or post targeted updates scoped to specific student batches.
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
          <span>Post Announcement</span>
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

      {/* Notices List Table */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-4">
          <h2 className="font-display font-bold text-lg text-[#0F1B3D]">
            All Posted Announcements ({notices.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-[#0F1B3D]/60">
            Loading announcements...
          </div>
        ) : notices.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <span className="text-3xl block">📢</span>
            <p className="font-display font-bold text-base text-[#0F1B3D]">No Notices Posted Yet</p>
            <p className="text-xs text-[#0F1B3D]/60">Click &quot;Post Announcement&quot; above to issue global or batch notices.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] border-b border-[#0F1B3D]/10 text-[#0F1B3D]/70 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Target Scope</th>
                  <th className="py-3 px-4">Content Preview</th>
                  <th className="py-3 px-4">Posted Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1B3D]/10 font-sans">
                {notices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                    <td className="py-3.5 px-4 font-display font-bold text-sm text-[#0F1B3D]">
                      {notice.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          notice.scope === 'global'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-[#E8B84A]/20 text-[#0F1B3D] border border-[#E8B84A]/40'
                        }`}
                      >
                        {notice.scope === 'global' ? '🌍 Global Notice' : '🎯 Batch Scoped'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#0F1B3D]/80 max-w-xs truncate">
                      {notice.body}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#0F1B3D]/60 text-[11px]">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(notice)}
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

      {/* Post Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1B3D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#0F1B3D]/15 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-3">
              <h3 className="font-display font-bold text-lg text-[#0F1B3D]">
                Post Announcement Notice
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
                  Notice Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule Change for JEE Mock Exam"
                  required
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                />
              </div>

              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Notice Scope *
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as 'global' | 'batch')}
                  className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                >
                  <option value="global">Global (All Enrolled Students)</option>
                  <option value="batch">Batch Scoped (Target Specific Batch)</option>
                </select>
              </div>

              {scope === 'batch' && (
                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Target Batch *
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    required
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.class} - {b.stream})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Content Body *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Write the notice details here..."
                  required
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
                  {isSubmitting ? 'Posting...' : 'Post Notice'}
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
