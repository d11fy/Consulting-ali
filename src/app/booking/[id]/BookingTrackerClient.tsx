'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Video,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Download,
  Info,
  Star,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface BookingTrackerClientProps {
  booking: any;
  paymentMethods: any[];
}

export function BookingTrackerClient({ booking, paymentMethods }: BookingTrackerClientProps) {
  const router = useRouter();

  // Selected payment method for details display
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    booking.payment?.paymentMethodId || paymentMethods[0]?.id || ''
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Proof form
  const [senderName, setSenderName] = useState(booking.customer?.fullName || '');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofSuccess, setProofSuccess] = useState<string | null>(null);

  // Expiration Countdown
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (booking.status !== 'pending_payment' || !booking.slotExpiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(booking.slotExpiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('انتهت المهلة');
        clearInterval(interval);
        router.refresh();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking.status, booking.slotExpiresAt, router]);

  // Copy text helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Submit Payment Proof
  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile || !booking.payment) {
      setProofError('يرجى إرفاق صورة أو مستند إشعار التحويل');
      return;
    }

    setSubmittingProof(true);
    setProofError(null);
    setProofSuccess(null);

    const formData = new FormData();
    formData.append('senderName', senderName);
    formData.append('paymentMethodId', selectedMethodId);
    formData.append('amount', booking.payment.amount.toString());
    formData.append('currency', booking.payment.currency);
    formData.append('transactionNumber', transactionNumber);
    formData.append('notes', proofNotes);
    formData.append('receipt', receiptFile);

    try {
      const res = await fetch(`/api/payments/${booking.payment.id}/proof`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProofSuccess(data.message);
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setProofError(data.error || 'فشل رفع الإشعار، يرجى المحاولة لاحقًا');
      }
    } catch {
      setProofError('حدث خطأ أثناء رفع إثبات الدفع');
    } finally {
      setSubmittingProof(false);
    }
  };

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);

  // Status mapping
  const statusConfig: Record<string, { label: string; color: string; desc: string }> = {
    pending_payment: {
      label: 'بانتظار رفع إشعار الدفع',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      desc: 'تم حجز وتجميد هذا الموعد مؤقتًا. يرجى التحويل ورفع الإشعار قبل انتهاء المهلة المحددة.',
    },
    payment_uploaded: {
      label: 'إشعار الدفع قيد التدقيق',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      desc: 'تم استلام إشعار التحويل بنجاح، ويقوم فريق الإدارة بمراجعته الآن. سيتم تأكيد الموعد فور التحقق.',
    },
    payment_under_review: {
      label: 'إشعار الدفع قيد المراجعة',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      desc: 'الإيصال قيد المراجعة من المحاسب المعتمد.',
    },
    confirmed: {
      label: 'الحجز مؤكد وجاهز',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      desc: 'تم اعتماد الدفع وتأكيد الحجز بنجاح، ومزامنة الموعد في التقويم.',
    },
    scheduled: {
      label: 'تمت الجدولة بنجاح',
      color: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      desc: 'موعدك مجدول ورابط الاجتماع متاح أدناه.',
    },
    completed: {
      label: 'اكتملت الاستشارة بنجاح',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      desc: 'تم عقد الجلسة الاستشارية بنجاح.',
    },
    cancelled: {
      label: 'تم إلغاء الحجز',
      color: 'bg-red-500/10 text-red-400 border-red-500/30',
      desc: booking.cancellationReason || 'تم إلغاء هذا الحجز.',
    },
  };

  const statusInfo = statusConfig[booking.status] || {
    label: booking.status,
    color: 'bg-slate-800 text-slate-300 border-slate-700',
    desc: '',
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Banner / Status Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="text-xs text-slate-400 mb-1">الرقم المرجعي للحجز:</div>
            <div className="text-2xl font-black text-white font-mono flex items-center gap-2">
              <span>{booking.bookingReference}</span>
              <button
                type="button"
                onClick={() => handleCopy(booking.bookingReference, 'ref')}
                className="p-1 hover:text-emerald-400 text-slate-500 transition-colors"
                title="نسخ الرقم المرجعي"
              >
                {copiedKey === 'ref' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Status Badge */}
          <div className="text-right sm:text-left">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold border ${statusInfo.color}`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              <span>{statusInfo.label}</span>
            </span>
          </div>
        </div>

        {/* Status description */}
        <p className="text-xs sm:text-sm text-slate-300 pt-4 leading-relaxed">
          {statusInfo.desc}
        </p>

        {/* Expiration countdown warning if pending */}
        {booking.status === 'pending_payment' && timeLeft && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>الوقت المتبقي لرفع إثبات الدفع وتثبيت الموعد:</span>
            </div>
            <div className="font-mono font-bold text-sm bg-amber-900/60 px-3 py-1 rounded-xl border border-amber-500/30">
              {timeLeft}
            </div>
          </div>
        )}
      </div>

      {/* Confirmed Meeting Link Banner (if confirmed) */}
      {(booking.status === 'confirmed' || booking.status === 'scheduled') && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Video className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  رابط الجلسة الاستشارية المباشرة (Google Meet)
                </h3>
                <p className="text-xs text-slate-300">
                  يمكنك الدخول مباشرة إلى الجلسة عبر الرابط في الموعد المحدد.
                </p>
              </div>
            </div>

            {booking.meetingLink ? (
              <a
                href={booking.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <span>الانضمام للجلسة الآن</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div className="text-xs text-slate-400 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                جاري توليد رابط الاجتماع تلقائيًا...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Details & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>تفاصيل الاستشارة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 mb-1">نوع الاستشارة:</div>
                <div className="font-bold text-white text-sm">{booking.service.nameAr}</div>
                <div className="text-[11px] text-emerald-400 mt-0.5">{booking.service.durationMinutes} دقيقة</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 mb-1">المستشار:</div>
                <div className="font-bold text-white text-sm">
                  {booking.isAutoAssign ? 'تعيين تلقائي (المستشار الأنسب)' : booking.consultant?.user?.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {booking.consultant?.title || 'طاقم المستشارين المعتمد'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 mb-1">الموعد المحدد:</div>
                <div className="font-bold text-white text-sm font-mono dir-ltr text-right">
                  {format(new Date(booking.slotStartTime), 'yyyy-MM-dd HH:mm')}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  المنطقة الزمنية: {booking.customerTimezone}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 mb-1">المبلغ المطلوب:</div>
                <div className="font-black text-emerald-400 text-lg">
                  ${booking.payment?.amount} {booking.payment?.currency}
                </div>
              </div>
            </div>

            {/* Case Questions */}
            <div className="pt-2 space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-400">وصف الحالة: </span>
                <span className="text-slate-200">{booking.caseDescription}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-400">السؤال الرئيسي: </span>
                <span className="text-slate-200">{booking.primaryQuestion}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-semibold text-slate-400">الهدف المرجو: </span>
                <span className="text-slate-200">{booking.desiredOutcome}</span>
              </div>
            </div>
          </div>

          {/* $200 Case Study & Roadmap Status (if comprehensive) */}
          {booking.service.isComprehensive && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>وثيقة: Personal Case Study & Roadmap ($200)</span>
                </h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {booking.roadmap?.status === 'delivered' || booking.roadmap?.status === 'roadmap_ready'
                    ? 'جاهزة للتنزيل'
                    : 'قيد الإعداد بعد الجلسة'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                في هذه الباقة الشاملة يقوم المستشار بعد عقد اللقاء المباشر بإعداد ملف توثيقي كامل لحالتك يتضمن التشخيص، نقاط القوة والضعف، والخيارات وخارطة الطريق.
              </p>

              {booking.roadmap?.downloadToken ? (
                <div className="pt-2">
                  <a
                    href={`/api/documents/download?token=${booking.roadmap.downloadToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل ملف خارطة الطريق (PDF)</span>
                  </a>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 text-slate-400 text-xs border border-slate-800">
                  سيتم تفعيل زر تنزيل الملف الخاص بك هنا فور انتهاء الجلسة ورفع الوثيقة من قبل المستشار.
                </div>
              )}
            </div>
          )}

          {/* Post-Consultation Review Prompt */}
          {booking.status === 'completed' && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">كيف كانت تجربتك في الاستشارة؟</h4>
                <p className="text-xs text-slate-400">
                  رأيك يهمنا ويساعدنا على تطوير الخدمة ومساعدة الآخرين.
                </p>
              </div>
              <a
                href={`/review/${booking.id}`}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 shrink-0"
              >
                <Star className="w-3.5 h-3.5 fill-emerald-400" />
                <span>تقييم الاستشارة</span>
              </a>
            </div>
          )}
        </div>

        {/* Right 1 Col: Payment Methods & Upload Proof */}
        <div className="space-y-6">
          {/* Payment Methods Box */}
          {booking.status === 'pending_payment' && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>طرق التحويل المعتمدة</span>
              </h3>

              <div className="space-y-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedMethodId(pm.id)}
                    className={`w-full p-3 rounded-xl text-right text-xs font-semibold transition-all border flex items-center justify-between ${
                      selectedMethodId === pm.id
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{pm.nameAr}</span>
                    {selectedMethodId === pm.id && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                ))}
              </div>

              {/* Account Details Box */}
              {selectedMethod && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-slate-200 mb-1">{selectedMethod.nameAr}:</div>
                  <div className="text-slate-400 text-[11px] leading-relaxed mb-3">
                    {selectedMethod.instructionsAr}
                  </div>

                  {typeof selectedMethod.accountDetails === 'object' &&
                    Object.entries(selectedMethod.accountDetails).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-slate-300 font-mono text-[11px]"
                      >
                        <span className="text-slate-500">{key}:</span>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[150px]">{String(val)}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(String(val), key)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            {copiedKey === key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Proof Form */}
          {booking.status === 'pending_payment' && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>رفع إشعار الدفع</span>
              </h3>

              {proofError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
                  {proofError}
                </div>
              )}

              {proofSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs">
                  {proofSuccess}
                </div>
              )}

              <form onSubmit={handleProofSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    اسم المحول الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="الاسم المسجل في إشعار البنك"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    رقم الحوالة أو الرقم المرجعي (اختياري)
                  </label>
                  <input
                    type="text"
                    value={transactionNumber}
                    onChange={(e) => setTransactionNumber(e.target.value)}
                    placeholder="TxID / Reference No."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 dir-ltr text-left"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    صورة الإيصال أو ملف PDF *
                  </label>
                  <input
                    type="file"
                    required
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-400 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    placeholder="أي ملاحظة تود إيصالها للإدارة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingProof}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingProof ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري رفع الإشعار...</span>
                    </>
                  ) : (
                    <span>تأكيد وإرسال إشعار الدفع</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Uploaded Proofs History if exists */}
          {booking.payment?.proofs && booking.payment.proofs.length > 0 && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-3">
              <h4 className="text-xs font-bold text-white">إيصالات الدفع المرفوعة</h4>
              {booking.payment.proofs.map((proof: any) => (
                <div
                  key={proof.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-300">{proof.senderName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        proof.status === 'accepted'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : proof.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {proof.status === 'accepted'
                        ? 'معتمد'
                        : proof.status === 'rejected'
                        ? 'مرفوض'
                        : 'قيد المراجعة'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {proof.amount} {proof.currency} • {format(new Date(proof.paymentDate), 'yyyy-MM-dd')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
