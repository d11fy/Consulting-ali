'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  UserCheck,
  Loader2,
  FileCheck,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Video,
} from 'lucide-react';

interface BookingDetailActionsProps {
  booking: any;
  consultants: { id: string; name: string }[];
}

export function BookingDetailActions({ booking, consultants }: BookingDetailActionsProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Confirm modal state with custom Google Meet link
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [customMeetingLink, setCustomMeetingLink] = useState(booking.meetingLink || '');
  const [confirmNotes, setConfirmNotes] = useState('تم التحقق من التحويل وتأكيد الموعد');

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('المبلغ غير مطابق أو صورة الإشعار غير واضحة.');

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState('');

  // Assign consultant state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedConsultantId, setAssignedConsultantId] = useState(booking.consultantId || consultants[0]?.id || '');

  // Note state
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // 1. Confirm Payment
  const handleConfirmPayment = async () => {
    if (!booking.payment) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/payments/${booking.payment.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customMeetingLink: customMeetingLink.trim() || undefined,
          adminNotes: confirmNotes.trim() || 'تم الاعتماد والتأكيد بواسطة الإدارة',
          idempotencyKey: `confirm-${booking.id}-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowConfirmModal(false);
        setSuccess(data.message || 'تم اعتماد الدفع وتأكيد الحجز بنجاح.');
        setTimeout(() => router.refresh(), 1000);
      } else {
        setError(data.error || 'فشل اعتماد الدفع');
      }
    } catch {
      setError('حدث خطأ أثناء اعتماد الدفع');
    } finally {
      setLoading(false);
    }
  };

  // 2. Reject Payment
  const handleRejectPayment = async () => {
    if (!booking.payment) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/payments/${booking.payment.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowRejectModal(false);
        setSuccess('تم رفض إشعار الدفع وإتاحة فرصة جديدة للعميل.');
        setTimeout(() => router.refresh(), 1000);
      } else {
        setError(data.error || 'فشل رفض الدفع');
      }
    } catch {
      setError('حدث خطأ أثناء رفض الدفع');
    } finally {
      setLoading(false);
    }
  };

  // 3. Complete Consultation
  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('تم تغيير حالة الجلسة إلى مكتملة.');
        setTimeout(() => router.refresh(), 1000);
      } else {
        setError(data.error || 'فشل تحديث الحالة');
      }
    } catch {
      setError('حدث خطأ أثناء إكمال الجلسة');
    } finally {
      setLoading(false);
    }
  };

  // 4. Assign / Change Consultant
  const handleAssignConsultant = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultantId: assignedConsultantId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowAssignModal(false);
        setSuccess('تم تعيين المستشار بنجاح.');
        setTimeout(() => router.refresh(), 1000);
      } else {
        setError(data.error || 'فشل تعيين المستشار');
      }
    } catch {
      setError('حدث خطأ أثناء تعيين المستشار');
    } finally {
      setLoading(false);
    }
  };

  // 5. Add Internal Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNoteContent('');
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">إجراءات الحجز والتحقق</h3>

        <div className="flex flex-wrap items-center gap-3">
          {/* If payment needs verification */}
          {(booking.status === 'payment_uploaded' || booking.status === 'pending_payment') && (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد الدفع وتأكيد الحجز</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-red-950/40 text-red-400 border border-red-500/30 font-semibold text-xs transition-colors cursor-pointer"
              >
                رفض الإشعار
              </button>
            </>
          )}

          {/* If confirmed or scheduled */}
          {(booking.status === 'confirmed' || booking.status === 'scheduled') && (
            <button
              type="button"
              disabled={loading}
              onClick={handleComplete}
              className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>إكمال الاستشارة</span>
            </button>
          )}

          {/* Assign / Change Consultant */}
          <button
            type="button"
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>تعيين / تغيير المستشار</span>
          </button>
        </div>
      </div>

      {/* Internal Notes Box */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>الملاحظات الداخلية (سرية للإدارة والمستشار)</span>
        </h4>

        {booking.notes && booking.notes.length > 0 ? (
          <div className="space-y-2">
            {booking.notes.map((n: any) => (
              <div key={n.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-200">{n.content}</div>
                <div className="text-[10px] text-slate-500">
                  {new Date(n.createdAt).toLocaleString('ar-EG')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500">لا توجد ملاحظات داخلية بعد.</div>
        )}

        <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
          <input
            type="text"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="أضف ملاحظة داخلية جديدة..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={addingNote || !noteContent.trim()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs disabled:opacity-50"
          >
            {addingNote ? 'جاري الحفظ...' : 'إضافة'}
          </button>
        </form>
      </div>

      {/* Confirm Payment & Add Meeting Link Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">اعتماد الدفع وتأكيد الحجز</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  أدخل رابط الاجتماع الحقيقي ليتم إرساله للعميل عبر البريد الإلكتروني.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Custom Google Meet Link Input */}
              <div>
                <label className="block text-slate-200 font-bold mb-1.5 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>رابط Google Meet المعتمد للجلسة</span>
                </label>
                <input
                  type="url"
                  value={customMeetingLink}
                  onChange={(e) => setCustomMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 dir-ltr text-left font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  💡 ضع هنا رابط Google Meet الفعلي الذي ستلتقي فيه مع العميل، وسيصل للعميل مباشرة في رسالة تأكيد الحجز على بريده الإلكتروني.
                </p>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-slate-200 font-bold mb-1.5">
                  ملاحظات الإدارة والاعتماد (اختياري)
                </label>
                <input
                  type="text"
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  placeholder="تم التحقق من التحويل وتأكيد الموعد"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Client & Booking Summary Info */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>العميل:</span>
                  <span className="text-slate-200 font-semibold">{booking.customer?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span>البريد الإلكتروني:</span>
                  <span className="text-slate-200 font-mono">{booking.customer?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>المبلغ المطلوب:</span>
                  <span className="text-emerald-400 font-bold">${booking.service?.price} USD</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmPayment}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>تأكيد الحجز وإرسال الرابط للعميل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">رفض إشعار التحويل</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              يرجى كتابة سبب الرفض بوضوح ليتم إبلاغ العميل به وإعطائه فرصة جديدة لإعادة رفع الإشعار الصحيح.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleRejectPayment}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Consultant Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">تعيين أو تغيير المستشار</h3>
            <p className="text-xs text-slate-400">
              اختر المستشار المسؤول عن إدارة ومتابعة هذه الاستشارة:
            </p>
            <select
              value={assignedConsultantId}
              onChange={(e) => setAssignedConsultantId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleAssignConsultant}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                حفظ التعيين
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
