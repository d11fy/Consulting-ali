import React from 'react';
import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Download,
  Video,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { BookingDetailActions } from './BookingDetailActions';

export const dynamic = 'force-dynamic';

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [booking, consultants, services] = await Promise.all([
    prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        service: true,
        consultant: { include: { user: true } },
        payment: {
          include: {
            paymentMethod: true,
            proofs: { orderBy: { createdAt: 'desc' } },
          },
        },
        documents: {
          include: {
            document: true,
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        roadmap: {
          include: { roadmapDocument: true },
        },
      },
    }),
    prisma.consultant.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true } } },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, nameAr: true, price: true },
      orderBy: { orderIndex: 'asc' },
    }),
  ]);

  if (!booking) {
    notFound();
  }

  const latestProof = booking.payment?.proofs?.[0];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href="/admin/bookings" className="hover:text-emerald-400 transition-colors">
              الحجوزات
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-mono">{booking.bookingReference}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>تفاصيل حجز الاستشارة</span>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
              {booking.status}
            </span>
          </h1>
        </div>

        <Link
          href={`/booking/${booking.id}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
        >
          <span>عرض صفحة العميل</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Case Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Dossier */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>بيانات العميل (Customer Profile)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-slate-500 text-[10px]">الاسم الكامل</div>
                  <div className="font-semibold text-slate-200 text-sm">{booking.customer.fullName}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-slate-500 text-[10px]">البريد الإلكتروني</div>
                  <div className="font-semibold text-slate-200 text-sm font-mono dir-ltr text-right">
                    {booking.customer.email}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-slate-500 text-[10px]">رقم WhatsApp</div>
                  <div className="font-semibold text-emerald-400 text-sm font-mono dir-ltr text-right">
                    <a
                      href={`https://wa.me/${booking.customer.whatsappPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1.5 justify-end"
                    >
                      <span>{booking.customer.whatsappPhone}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-slate-500 text-[10px]">الدولة / بلد الإقامة</div>
                  <div className="font-semibold text-slate-200 text-sm">{booking.customer.country}</div>
                </div>
              </div>
            </div>

            {/* Questions & Desired Outcome */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-400 block mb-1">وصف الحالة:</span>
                <p className="text-slate-200 leading-relaxed">{booking.caseDescription}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-400 block mb-1">السؤال الرئيسي:</span>
                <p className="text-slate-200 leading-relaxed">{booking.primaryQuestion}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-400 block mb-1">النتيجة المرجوة:</span>
                <p className="text-slate-200 leading-relaxed">{booking.desiredOutcome}</p>
              </div>
            </div>
          </div>

          {/* Attached Confidential Documents */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>الوثائق والملفات المرفقة ({booking.documents.length})</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>حماية مشفرة وخاصة</span>
              </span>
            </h3>

            {booking.documents.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                لم يقم العميل برفع أي وثائق أولية مع هذا الحجز.
              </div>
            ) : (
              <div className="space-y-2">
                {booking.documents.map((bd) => (
                  <div
                    key={bd.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-900 text-emerald-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{bd.document.originalName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {(bd.document.sizeBytes / 1024 / 1024).toFixed(2)} MB • {bd.document.category}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`/api/documents/download?id=${bd.document.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تنزيل</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline & Status History */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">سجل الحالات والأنشطة (Timeline)</h3>

            <div className="space-y-3 text-xs">
              {booking.statusHistory.map((h) => (
                <div key={h.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400">{h.toStatus}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {format(new Date(h.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                  </div>
                  <div className="text-slate-300">{h.note}</div>
                  {h.changedBy && (
                    <div className="text-[10px] text-slate-500">بواسطة: {h.changedBy}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Actions, Payment Proof & Meeting Details */}
        <div className="space-y-6">
          {/* Actions component */}
          <BookingDetailActions
            booking={booking}
            consultants={consultants.map((c) => ({ id: c.id, name: c.user.name }))}
            services={services}
          />

          {/* Meeting Link Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-400" />
              <span>جلسة Google Meet المباشرة</span>
            </h4>

            {booking.meetingLink ? (
              <div className="space-y-2">
                <a
                  href={booking.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>فتح رابط Google Meet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <div className="text-[10px] text-slate-500 break-all dir-ltr text-center">
                  {booking.meetingLink}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                لم يتم إنشاء رابط الاجتماع بعد (يتم إنشاؤه تلقائيًا عند اعتماد الدفع).
              </div>
            )}
          </div>

          {/* Latest Payment Proof Review Card */}
          {latestProof && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-bold text-white">إشعار التحويل البنكي المرفوع</h4>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">اسم المحول:</span>
                  <span className="font-bold text-white">{latestProof.senderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المبلغ:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {latestProof.amount} {latestProof.currency}
                  </span>
                </div>
                {latestProof.transactionNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الحوالة:</span>
                    <span className="font-mono text-slate-300">{latestProof.transactionNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">تاريخ الدفع:</span>
                  <span className="text-slate-300 font-mono">
                    {format(new Date(latestProof.paymentDate), 'yyyy-MM-dd')}
                  </span>
                </div>
              </div>

              {/* View receipt file */}
              <div>
                <a
                  href={`/api/documents/download?receiptProofId=${latestProof.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>معاينة صورة الإيصال</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
