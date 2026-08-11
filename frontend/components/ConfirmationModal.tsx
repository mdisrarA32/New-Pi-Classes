'use client';

import { useEffect, useRef } from 'react';

export type ConfirmVariant = 'danger' | 'warning';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable on-brand confirmation modal for destructive/important admin actions.
 *
 * variant="danger"  → red confirm button  (permanent deletes)
 * variant="warning" → amber confirm button (reversible: deactivate/reactivate)
 */
export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Auto-focus Cancel so pressing Escape / Enter doesn't accidentally confirm
  useEffect(() => {
    if (isOpen) cancelRef.current?.focus();
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[60] bg-[#0F1B3D]/60 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#0F1B3D]/15 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-[#0F1B3D]/10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
              isDanger
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isDanger ? '⚠️' : '⏸️'}
          </div>
          <h3 className="font-display font-bold text-base text-[#0F1B3D]">
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-xs text-[#0F1B3D]/80 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-[#F7F7F5] border border-[#0F1B3D]/15 text-[#0F1B3D] text-xs font-semibold hover:bg-[#0F1B3D]/5 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              isDanger
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
