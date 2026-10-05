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
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  Globe,
  Briefcase,
  FileText,
  X,
  Save,
} from 'lucide-react';

interface BookingDetailActionsProps {
  booking: any;
  consultants: { id: string; name: string }[];
  services?: { id: string; nameAr: string; price: number }[];
}

function toDatetimeLocal(isoString?: string | Date | null) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

const STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'بانتظار الدفع (pending_payment)' },
  { value: 'payment_uploaded', label: 'تم رفع إشعار الدفع (payment_uploaded)' },
  { value: 'payment_under_review', label: 'قيد مراجعة الدفع (payment_under_review)' },
  { value: 'confirmed', label: 'مؤكد ومعتمد (confirmed)' },
  { value: 'scheduled', label: 'مجدول (scheduled)' },
  { value: 'completed', label: 'مكتمل بنجاح (completed)' },
  { value: 'rescheduled', label: 'معاد جدولته (rescheduled)' },
  { value: 'cancelled', label: 'ملغي (cancelled)' },
  { value: 'no_show', label: 'لم يحضر العميل (no_show)' },
  { value: 'refunded', label: 'مسترد (refunded)' },
];

export function BookingDetailActions({ booking, consultants, services = [] }: BookingDetailActionsProps) {
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

  // Assign consultant state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedConsultantId, setAssignedConsultantId] = useState(booking.consultantId || consultants[0]?.id || '');

  // Full Edit Modal State
  const [showFullEditModal, setShowFullEditModal] = useState(false);
  const [editStatus, setEditStatus] = useState(booking.status || 'pending_payment');
  const [editSlotStart, setEditSlotStart] = useState(toDatetimeLocal(booking.slotStartTime));
  const [editSlotEnd, setEditSlotEnd] = useState(toDatetimeLocal(booking.slotEndTime));
  const [editMeetingLink, setEditMeetingLink] = useState(booking.meetingLink || '');
  const [editConsultantId, setEditConsultantId] = useState(booking.consultantId || '');
  const [editServiceId, setEditServiceId] = useState(booking.serviceId || (services[0]?.id || ''));
  const [editCustomerName, setEditCustomerName] = useState(booking.customer?.fullName || '');
  const [editCustomerEmail, setEditCustomerEmail] = useState(booking.customer?.email || '');
  const [editCustomerPhone, setEditCustomerPhone] = useState(booking.customer?.whatsappPhone || '');
  const [editCustomerCountry, setEditCustomerCountry] = useState(booking.customer?.country || '');
  const [editCaseDescription, setEditCaseDescription] = useState(booking.caseDescription || '');
  const [editCancellationReason, setEditCancellationReason] = useState(booking.cancellationReason || '');

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

  // 6. Full Edit Save
  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        status: editStatus,
        slotStartTime: editSlotStart ? new Date(editSlotStart).toISOString() : undefined,
        slotEndTime: editSlotEnd ? new Date(editSlotEnd).toISOString() : undefined,
        meetingLink: editMeetingLink.trim() || null,
        consultantId: editConsultantId || null,
        serviceId: editServiceId || undefined,
        customerName: editCustomerName.trim() || undefined,
        customerEmail: editCustomerEmail.trim() || undefined,
        customerPhone: editCustomerPhone.trim() || undefined,
        customerCountry: editCustomerCountry.trim() || undefined,
        caseDescription: editCaseDescription.trim() || null,
        cancellationReason: editCancellationReason.trim() || null,
      };

      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تحديث بيانات الحجز');
      }

      setSuccess('تم تحديث كافة بيانات وتفاصيل الحجز بنجاح!');
      setShowFullEditModal(false);
      setTimeout(() => router.refresh(), 800);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تعديل الحجز');
    } finally {
      setLoading(false);
    }
  };

  // 7. Delete Booking
  const handleDeleteBooking = async () => {
    if (!confirm('تحذير شديد: هل أنت متأكد من رغبتك في حذف هذا الحجز نهائياً من قاعدة البيانات مع كافة الملاحظات وإيصالات الدفع؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل حذف الحجز');
      }

      alert('تم حذف الحجز بنجاح.');
      router.push('/admin/bookings');
      router.refresh();
    } catch (err: any) {
      alert('خطأ أثناء الحذف: ' + err.message);
      setLoading(false);
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">إجراءات وإدارة الحجز</h3>
          <button
            type="button"
            onClick={() => setShowFullEditModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>تعديل تفاصيل الحجز بالكامل</span>
          </button>
        </div>

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

          {/* Delete Booking */}
          <button
            type="button"
            disabled={loading}
            onClick={handleDeleteBooking}
            className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer mr-auto"
            title="حذف هذا الحجز نهائياً"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف الحجز</span>
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
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs disabled:opacity-50 cursor-pointer"
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

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>العميل:</span>
                  <span className="text-slate-200 font-semibold">{booking.customer?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span>المبلغ المستحق:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {booking.payment?.amount} {booking.payment?.currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmPayment}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>اعتماد الدفع وإرسال الإيميل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">رفض إشعار الدفع</h3>
            <p className="text-xs text-slate-400">
              حدد سبب الرفض ليتم إرساله للعميل عبر البريد الإلكتروني وتمكينه من رفع إشعار جديد:
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
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                حفظ التعيين
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Booking Modal */}
      {showFullEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">تعديل كافة بيانات الحجز والموعد</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    المرجع: <span className="font-mono text-emerald-400 font-bold">{booking.bookingReference}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFullEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSaveFullEdit} className="overflow-y-auto space-y-4 text-xs pr-1">
              {/* Status */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  حالة الحجز (Status)
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slot Start & End */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تاريخ ووقت بدء الجلسة</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editSlotStart}
                    onChange={(e) => setEditSlotStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تاريخ ووقت انتهاء الجلسة</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editSlotEnd}
                    onChange={(e) => setEditSlotEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  <span>رابط Google Meet المباشر</span>
                </label>
                <input
                  type="url"
                  value={editMeetingLink}
                  onChange={(e) => setEditMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 dir-ltr text-left font-mono"
                />
              </div>

              {/* Consultant & Service */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>المستشار المعيّن</span>
                  </label>
                  <select
                    value={editConsultantId}
                    onChange={(e) => setEditConsultantId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">بدون مستشار (غير معيّن)</option>
                    {consultants.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                    <span>نوع الخدمة</span>
                  </label>
                  <select
                    value={editServiceId}
                    onChange={(e) => setEditServiceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr} (${s.price})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Profile Section */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تعديل بيانات العميل المقترنة</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">اسم العميل</label>
                    <input
                      type="text"
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={editCustomerEmail}
                      onChange={(e) => setEditCustomerEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono text-left dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">رقم الهاتف / WhatsApp</label>
                    <input
                      type="text"
                      value={editCustomerPhone}
                      onChange={(e) => setEditCustomerPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono text-left dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">الدولة أو الإقامة</label>
                    <input
                      type="text"
                      value={editCustomerCountry}
                      onChange={(e) => setEditCustomerCountry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Case Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تفاصيل واستفسار العميل المكتوب</span>
                </label>
                <textarea
                  rows={3}
                  value={editCaseDescription}
                  onChange={(e) => setEditCaseDescription(e.target.value)}
                  placeholder="نص استفسار العميل..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Cancellation Reason if cancelled */}
              {editStatus === 'cancelled' && (
                <div>
                  <label className="block text-red-300 font-semibold mb-1.5">
                    سبب الإلغاء (يظهر للعميل)
                  </label>
                  <textarea
                    rows={2}
                    value={editCancellationReason}
                    onChange={(e) => setEditCancellationReason(e.target.value)}
                    placeholder="سبب إلغاء الحجز..."
                    className="w-full bg-slate-950 border border-red-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-400"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFullEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>حفظ كافة التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
