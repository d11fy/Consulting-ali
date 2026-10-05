import React from 'react';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import Link from 'next/link';
import { format, isToday } from 'date-fns';
import {
  CalendarDays,
  Clock,
  Video,
  FileText,
  User,
  ExternalLink,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Bot,
  Send,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ConsultantDashboardPage() {
  const session = await requireAuth([Role.CONSULTANT, Role.SUPER_ADMIN, Role.ADMIN]);

  const consultant = await prisma.consultant.findUnique({
    where: { userId: session.id },
    include: {
      googleConnection: true,
    },
  });

  const consultantId = consultant?.id;

  // Fetch integration settings
  const siteSettings = await prisma.siteSetting.findMany({
    where: { category: { in: ['telegram', 'google'] } },
  });
  const settingsMap = new Map(siteSettings.map((s) => [s.key, s.value]));
  const telegramConfigured = Boolean(
    settingsMap.get('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN
  );
  const googleConnection = consultant?.googleConnection;

  // Fetch only this consultant's upcoming bookings
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      consultantId: consultantId,
      status: { in: ['confirmed', 'scheduled'] },
      slotStartTime: { gte: new Date() },
    },
    include: {
      customer: true,
      service: true,
      roadmap: true,
      documents: { include: { document: true } },
    },
    orderBy: { slotStartTime: 'asc' },
    take: 10,
  });

  // Fetch pending roadmaps to prepare
  const pendingRoadmaps = await prisma.roadmap.findMany({
    where: {
      consultantId: consultantId,
      status: { notIn: ['delivered', 'roadmap_ready'] },
    },
    include: {
      booking: {
        include: { customer: true, service: true },
      },
    },
    take: 5,
  });

  const totalCompleted = await prisma.booking.count({
    where: {
      consultantId: consultantId,
      status: 'completed',
    },
  });

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">أجندة المواعيد والجلسات القادمة</h1>
        <p className="text-xs text-slate-400 mt-1">
          مرحبًا بك، استعرض جلساتك المجدولة وروابط الاجتماع والوثائق المرفوعة لكل حالة.
        </p>
      </div>

      {/* Integrations Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>مركز الربط والتكامل: Telegram & Google Calendar</span>
            </h3>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-sky-400" />
                <span>إشعارات البوت: {telegramConfigured ? '🟢 جاهزة ومفعّلة' : '🟡 بانتظار الإعداد'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>تقويم Google: {googleConnection?.syncStatus === 'active' ? '🟢 متصل ومزامن' : '🔵 متاح للربط'}</span>
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/consultant/calendar"
          className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0 text-center"
        >
          إدارة وإعداد الربط بالتفصيل
        </Link>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">الجلسات القادمة</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">{upcomingBookings.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">خرائط طريق بانتظار الإعداد ($200)</div>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{pendingRoadmaps.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">الاستشارات المكتملة بنجاح</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{totalCompleted}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Upcoming Sessions List */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center justify-between">
          <span>الجلسات القادمة المؤكدة</span>
          <span className="text-xs font-normal text-slate-400">{upcomingBookings.length} جلسة</span>
        </h3>

        {upcomingBookings.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            لا توجد جلسات مؤكدة مجدولة في الوقت الحالي.
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-sm">{b.customer.fullName}</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {b.service.nameAr} ({b.service.durationMinutes} دقيقة)
                    </span>
                    {b.service.isComprehensive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold">
                        خارطة طريق
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 font-mono text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{format(new Date(b.slotStartTime), 'yyyy-MM-dd HH:mm')}</span>
                    </span>
                    <span>البلد: {b.customer.country}</span>
                    <span>وثائق مرفوعة: {b.documents.length} ملف</span>
                  </div>

                  <div className="text-xs text-slate-300 line-clamp-1 bg-slate-900/60 p-2 rounded-xl">
                    <span className="text-slate-500">السؤال الرئيسي: </span>
                    {b.primaryQuestion}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {b.meetingLink ? (
                    <a
                      href={b.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Video className="w-4 h-4" />
                      <span>Google Meet</span>
                    </a>
                  ) : null}

                  <Link
                    href={`/consultant/bookings/${b.id}`}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                  >
                    <span>ملف الحالة</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roadmaps in Progress ($200 Service) */}
      {pendingRoadmaps.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>مهام إعداد ملف خارطة الطريق: Personal Case Study & Roadmap ($200)</span>
            </h3>
            <Link href="/consultant/roadmaps" className="text-xs text-amber-300 hover:underline">
              عرض الكل
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRoadmaps.map((rm) => (
              <div
                key={rm.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-200">{rm.booking.customer.fullName}</div>
                  <div className="text-[10px] text-slate-400">حجز: {rm.booking.bookingReference}</div>
                </div>
                <Link
                  href={`/consultant/bookings/${rm.booking.id}`}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold"
                >
                  رفع الملف
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
