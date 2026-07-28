'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminBatches, getAdminStudents, AdminBatchItem } from '@/lib/api';

export default function AdminOverviewPage() {
  const [batches, setBatches] = useState<AdminBatchItem[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [batchList, studentRes] = await Promise.all([
          getAdminBatches(true),
          getAdminStudents({ status: 'active', limit: '1' }),
        ]);
        setBatches(batchList);
        setTotalStudents(studentRes.total);
      } catch (e) {
        console.error('Failed to load admin metrics:', e);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const activeBatches = batches.filter((b) => b.isActive).length;
  const archivedBatches = batches.filter((b) => !b.isActive).length;

  return (
    <div className="space-y-8 antialiased">
      {/* Header Banner */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#E8B84A] uppercase tracking-wider block mb-1">
            System Administration Overview
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1B3D]">
            Institute Control Center
          </h1>
          <p className="text-xs text-[#0F1B3D]/70 mt-1">
            Manage batches, student accounts, study resources, and online exams for New Pi Classes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/batches"
            className="px-4 py-2.5 rounded-lg bg-[#0F1B3D] text-white text-xs font-semibold hover:bg-[#0F1B3D]/90 transition-colors"
          >
            + Create Batch
          </Link>
          <Link
            href="/admin/students"
            className="px-4 py-2.5 rounded-lg bg-[#E8B84A] text-[#0F1B3D] text-xs font-bold hover:bg-[#E8B84A]/90 transition-colors"
          >
            + Add Student
          </Link>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm">
          <span className="text-[11px] font-mono text-[#0F1B3D]/60 uppercase tracking-wider block mb-1">
            Active Batches
          </span>
          <div className="font-display font-extrabold text-3xl text-[#0F1B3D]">
            {loading ? '...' : activeBatches}
          </div>
          <span className="text-xs font-mono text-[#0F1B3D]/50 mt-1 block">
            {archivedBatches} archived batches
          </span>
        </div>

        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm">
          <span className="text-[11px] font-mono text-[#0F1B3D]/60 uppercase tracking-wider block mb-1">
            Enrolled Students
          </span>
          <div className="font-display font-extrabold text-3xl text-[#0F1B3D]">
            {loading ? '...' : totalStudents}
          </div>
          <span className="text-xs font-mono text-[#0F1B3D]/50 mt-1 block">
            Active student accounts
          </span>
        </div>

        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm">
          <span className="text-[11px] font-mono text-[#0F1B3D]/60 uppercase tracking-wider block mb-1">
            Target Classes
          </span>
          <div className="font-display font-extrabold text-3xl text-[#0F1B3D]">
            Class XI & XII
          </div>
          <span className="text-xs font-mono text-[#0F1B3D]/50 mt-1 block">
            JEE & NEET Streams
          </span>
        </div>

        <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm">
          <span className="text-[11px] font-mono text-[#0F1B3D]/60 uppercase tracking-wider block mb-1">
            System Status
          </span>
          <div className="font-display font-bold text-lg text-emerald-600 flex items-center gap-1.5 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational
          </div>
          <span className="text-xs font-mono text-[#0F1B3D]/50 mt-1 block">
            MongoDB Atlas Connected
          </span>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-white border border-[#0F1B3D]/10 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-lg text-[#0F1B3D] border-b border-[#0F1B3D]/10 pb-3">
          Quick Management Shortcuts
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/batches"
            className="p-5 rounded-xl bg-[#F7F7F5] border border-[#0F1B3D]/10 hover:border-[#0F1B3D]/30 transition-all group"
          >
            <div className="text-2xl mb-2">🏷️</div>
            <h3 className="font-display font-bold text-sm text-[#0F1B3D] group-hover:text-[#E8B84A] transition-colors">
              Batch Management →
            </h3>
            <p className="text-xs text-[#0F1B3D]/70 mt-1">
              Create new batches, assign Class/Stream, view enrollment count, or archive inactive batches.
            </p>
          </Link>

          <Link
            href="/admin/students"
            className="p-5 rounded-xl bg-[#F7F7F5] border border-[#0F1B3D]/10 hover:border-[#0F1B3D]/30 transition-all group"
          >
            <div className="text-2xl mb-2">🎓</div>
            <h3 className="font-display font-bold text-sm text-[#0F1B3D] group-hover:text-[#E8B84A] transition-colors">
              Student Directory →
            </h3>
            <p className="text-xs text-[#0F1B3D]/70 mt-1">
              Enroll students with auto-generated usernames, filter by batch, or trigger one-time password resets.
            </p>
          </Link>

          <Link
            href="/admin/tests"
            className="p-5 rounded-xl bg-[#F7F7F5] border border-[#0F1B3D]/10 hover:border-[#0F1B3D]/30 transition-all group"
          >
            <div className="text-2xl mb-2">⏱️</div>
            <h3 className="font-display font-bold text-sm text-[#0F1B3D] group-hover:text-[#E8B84A] transition-colors">
              Test Scheduler →
            </h3>
            <p className="text-xs text-[#0F1B3D]/70 mt-1">
              Author mock tests, set questions and correct option keys, and schedule batch exam windows.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
