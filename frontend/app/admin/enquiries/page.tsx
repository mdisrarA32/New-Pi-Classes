'use client';

import { useState, useEffect } from 'react';
import {
  getAdminEnquiriesList,
  updateAdminEnquiryStatus,
  deleteAdminEnquiry,
  AdminEnquiryItem,
} from '@/lib/api';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<AdminEnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const list = await getAdminEnquiriesList();
      setEnquiries(list);
    } catch (e) {
      console.error('Failed to fetch enquiries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleStatusChange = async (enquiry: AdminEnquiryItem, newStatus: 'new' | 'contacted' | 'enrolled' | 'closed') => {
    const ok = await updateAdminEnquiryStatus(enquiry.id, newStatus);
    if (ok) {
      setActionSuccess(`Status for ${enquiry.name} updated to "${newStatus.toUpperCase()}".`);
      fetchEnquiries();
    } else {
      alert('Failed to update enquiry status.');
    }
  };

  const handleDeleteEnquiry = (enquiry: AdminEnquiryItem) => {
    setPendingConfirm({
      title: 'Delete Enquiry',
      message: `Are you sure you want to delete the enquiry from "${enquiry.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete Enquiry',
      onConfirm: async () => {
        setPendingConfirm(null);
        const ok = await deleteAdminEnquiry(enquiry.id);
        if (ok) {
          setActionSuccess(`Enquiry from "${enquiry.name}" deleted.`);
          fetchEnquiries();
        } else {
          alert('Failed to delete enquiry.');
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
            Lead Management
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1B3D]">
            Enquiries CRM
          </h1>
          <p className="text-xs text-[#0F1B3D]/70 mt-1">
            Track student demo class requests, follow up with parent inquiries, and update enrollment pipeline statuses.
          </p>
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

      {/* Enquiries Data Table */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#0F1B3D]/10 pb-4">
          <h2 className="font-display font-bold text-lg text-[#0F1B3D]">
            Website Demo Requests ({enquiries.length})
          </h2>
          <span className="text-xs font-mono text-[#0F1B3D]/60">
            {enquiries.filter((e) => e.status === 'new').length} New Leads
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-[#0F1B3D]/60">
            Loading enquiries...
          </div>
        ) : enquiries.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <span className="text-3xl block">📬</span>
            <p className="font-display font-bold text-base text-[#0F1B3D]">No Enquiries Submitted Yet</p>
            <p className="text-xs text-[#0F1B3D]/60">Public website demo requests submitted on the contact page will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] border-b border-[#0F1B3D]/10 text-[#0F1B3D]/70 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Class & Stream</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Pipeline Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1B3D]/10 font-sans">
                {enquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                    <td className="py-3.5 px-4 font-display font-bold text-sm text-[#0F1B3D]">
                      {enq.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#0F1B3D]">
                      📞 {enq.phone}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      Class {enq.classInterested} - {enq.streamInterested}
                    </td>
                    <td className="py-3.5 px-4 text-[#0F1B3D]/75 max-w-xs truncate">
                      {enq.message || 'No additional message'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#0F1B3D]/60 text-[11px]">
                      {new Date(enq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={enq.status}
                        onChange={(e) => handleStatusChange(enq, e.target.value as any)}
                        className={`font-mono font-bold text-[11px] px-2.5 py-1 rounded-lg border focus:outline-none transition-colors ${
                          enq.status === 'new'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : enq.status === 'contacted'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : enq.status === 'enrolled'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        <option value="new">🆕 New</option>
                        <option value="contacted">📞 Contacted</option>
                        <option value="enrolled">🎓 Enrolled</option>
                        <option value="closed">🔒 Closed</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteEnquiry(enq)}
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
