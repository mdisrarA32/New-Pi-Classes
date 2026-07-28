'use client';

import { useState, useEffect } from 'react';
import { getAdminBatches, createAdminBatch, toggleBatchStatus, AdminBatchItem } from '@/lib/api';

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<AdminBatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [classLevel, setClassLevel] = useState<'XI' | 'XII'>('XI');
  const [stream, setStream] = useState<'JEE' | 'NEET' | 'Foundation'>('NEET');
  const [timingLabel, setTimingLabel] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await getAdminBatches(true);
      setBatches(data);
    } catch (e) {
      console.error('Failed to fetch batches:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Batch name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdminBatch({
        name: name.trim(),
        class: classLevel,
        stream: stream,
        timingLabel: timingLabel.trim(),
      });

      if (res.success && res.data) {
        setActionSuccess(`Batch "${res.data.name}" created successfully!`);
        setShowModal(false);
        setName('');
        setTimingLabel('');
        fetchBatches();
      } else {
        setFormError(res.error || 'Failed to create batch.');
      }
    } catch (err) {
      setFormError('Network error while creating batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (batch: AdminBatchItem) => {
    const actionLabel = batch.isActive ? 'Archive' : 'Reactivate';
    if (!confirm(`Are you sure you want to ${actionLabel.toLowerCase()} the batch "${batch.name}"?`)) {
      return;
    }

    const success = await toggleBatchStatus(batch.id, batch.isActive);
    if (success) {
      setActionSuccess(`Batch "${batch.name}" ${batch.isActive ? 'archived' : 'reactivated'} successfully!`);
      fetchBatches();
    } else {
      alert(`Failed to ${actionLabel.toLowerCase()} batch.`);
    }
  };

  return (
    <div className="space-y-6 antialiased">
      {/* Page Header */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#E8B84A] uppercase tracking-wider block mb-1">
            Academic Operations
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1B3D]">
            Batch Management
          </h1>
          <p className="text-xs text-[#0F1B3D]/70 mt-1">
            Define Class XI and XII target batches, assign JEE/NEET streams, and track student enrollment.
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
          <span>Create New Batch</span>
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

      {/* Batches Table / Grid */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-4">
          <h2 className="font-display font-bold text-lg text-[#0F1B3D]">
            All Institute Batches ({batches.length})
          </h2>
          <span className="text-xs font-mono text-[#0F1B3D]/60">
            {batches.filter((b) => b.isActive).length} Active • {batches.filter((b) => !b.isActive).length} Archived
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-[#0F1B3D]/60">
            Loading batch records from server...
          </div>
        ) : batches.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <span className="text-3xl block">🏷️</span>
            <p className="font-display font-bold text-base text-[#0F1B3D]">No Batches Created Yet</p>
            <p className="text-xs text-[#0F1B3D]/60">Click &quot;Create New Batch&quot; above to add your first Class XI or XII batch.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] border-b border-[#0F1B3D]/10 text-[#0F1B3D]/70 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Batch Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Stream</th>
                  <th className="py-3 px-4">Timing</th>
                  <th className="py-3 px-4">Enrolled Students</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1B3D]/10 font-sans">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                    <td className="py-3.5 px-4 font-display font-bold text-sm text-[#0F1B3D]">
                      {batch.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      <span className="px-2 py-0.5 rounded bg-[#0F1B3D]/5 border border-[#0F1B3D]/10 text-[#0F1B3D]">
                        Class {batch.class}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          batch.stream === 'NEET'
                            ? 'bg-emerald-100 text-emerald-800'
                            : batch.stream === 'JEE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {batch.stream}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#0F1B3D]/70 font-mono">
                      {batch.timingLabel || 'Standard Schedule'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F1B3D]">
                      👤 {batch.studentCount} students
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          batch.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${batch.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {batch.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(batch)}
                        className={`px-3 py-1 rounded text-[11px] font-semibold font-mono transition-colors ${
                          batch.isActive
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {batch.isActive ? 'Archive' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1B3D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#0F1B3D]/15 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-3">
              <h3 className="font-display font-bold text-lg text-[#0F1B3D]">
                Create New Batch
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

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Class XI NEET Morning Batch"
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
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value as 'XI' | 'XII')}
                    className="w-full bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0F1B3D]"
                  >
                    <option value="XI">Class XI</option>
                    <option value="XII">Class XII</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono font-semibold text-[#0F1B3D] mb-1">
                    Target Stream *
                  </label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value as 'JEE' | 'NEET' | 'Foundation')}
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
                  Timing / Schedule Label (Optional)
                </label>
                <input
                  type="text"
                  value={timingLabel}
                  onChange={(e) => setTimingLabel(e.target.value)}
                  placeholder="e.g. 7:00 AM - 10:00 AM Mon-Sat"
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
                  {isSubmitting ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
