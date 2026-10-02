import React from 'react';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
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
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { ConsultantRoadmapUploader } from './ConsultantRoadmapUploader';

export const dynamic = 'force-dynamic';

export default async function ConsultantBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth([Role.CONSULTANT, Role.SUPER_ADMIN, Role.ADMIN]);
  const { id } = await params;

  const consultant = await prisma.consultant.findUnique({
    where: { userId: session.id },
  });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      service: true,
      documents: { include: { document: true } },
      notes: { orderBy: { createdAt: 'desc' } },
      roadmap: { include: { roadmapDocument: true } },
    },
  });

  if (!booking) {
    notFound();
  }

  // Strict Consultant Data Isolation
  if (session.role === Role.CONSULTANT && booking.consultantId !== consultant?.id) {
    redirect('/consultant');
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href="/consultant" className="hover:text-emerald-400 transition-colors">
              جدول مواعيدي
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-mono">{booking.bookingReference}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>ملف العميل واستشارة: {booking.customer.fullName}</span>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
              {booking.status}
            </span>
          </h1>
        </div>

        {booking.meetingLink && (
          <a
            href={booking.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            <Video className="w-4 h-4" />
            <span>بدء لقاء Google Meet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Case Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>معلومات العميل والحالة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">الاسم:</span>
                <span className="font-semibold text-white text-sm">{booking.customer.fullName}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">الدولة:</span>
                <span className="font-semibold text-white text-sm">{booking.customer.country}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">نوع الاستشارة:</span>
                <span className="font-semibold text-emerald-400 text-sm">{booking.service.nameAr} ({booking.service.durationMinutes} دقيقة)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">الموعد:</span>
                <span className="font-semibold text-white text-sm font-mono dir-ltr text-right">
                  {format(new Date(booking.slotStartTime), 'yyyy-MM-dd HH:mm')}
                </span>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-400 block mb-1">وصف الحالة وظروفها:</span>
                <p className="text-slate-200 leading-relaxed">{booking.caseDescription}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-400 block mb-1">السؤال الرئيسي المطلوب الإجابة عنه:</span>
                <p className="text-slate-200 leading-relaxed">{booking.primaryQuestion}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-400 block mb-1">النتيجة والهدف المنشود:</span>
                <p className="text-slate-200 leading-relaxed">{booking.desiredOutcome}</p>
              </div>
            </div>
          </div>

          {/* $200 Roadmap Section */}
          {booking.service.isComprehensive && (
            <ConsultantRoadmapUploader
              bookingId={booking.id}
              roadmap={booking.roadmap}
              customerEmail={booking.customer.email}
              customerName={booking.customer.fullName}
            />
          )}
        </div>

        {/* Right 1 Col: Documents Vault */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>ملفات ووثائق العميل ({booking.documents.length})</span>
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h3>

            {booking.documents.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                لم يرفع العميل أي وثائق مع هذا الحجز.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {booking.documents.map((bd) => (
                  <div
                    key={bd.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="truncate pl-2">
                      <div className="font-semibold text-slate-200 truncate">{bd.document.originalName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {(bd.document.sizeBytes / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <a
                      href={`/api/documents/download?id=${bd.document.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 shrink-0"
                      title="تنزيل الملف"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
