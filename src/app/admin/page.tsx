import React from 'react';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  DollarSign,
  Users,
  GraduationCap,
  ArrowLeft,
  FileCheck,
  ChevronLeft,
} from 'lucide-react';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // 1. Metrics queries
  const [
    bookingsToday,
    upcomingBookings,
    pendingPaymentsCount,
    confirmedCount,
    completedCount,
    cancelledCount,
    totalCustomers,
    totalConsultants,
    recentBookings,
    pendingProofs,
  ] = await Promise.all([
    prisma.booking.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.booking.count({
      where: {
        slotStartTime: { gte: now },
        status: { in: ['confirmed', 'scheduled'] },
      },
    }),
    prisma.booking.count({
      where: {
        status: { in: ['payment_uploaded', 'payment_under_review'] },
      },
    }),
    prisma.booking.count({
      where: { status: 'confirmed' },
    }),
    prisma.booking.count({
      where: { status: 'completed' },
    }),
    prisma.booking.count({
      where: { status: 'cancelled' },
    }),
    prisma.customer.count(),
    prisma.consultant.count({ where: { isActive: true } }),
    prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        service: true,
        consultant: { include: { user: true } },
        payment: true,
      },
    }),
    prisma.paymentProof.findMany({
      where: { status: 'pending' },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        payment: {
          include: {
            booking: {
              include: { customer: true, service: true },
            },
          },
        },
      },
    }),
  ]);

  // Total Revenue calculation from confirmed payments
  const confirmedPayments = await prisma.payment.findMany({
    where: { status: 'confirmed' },
    select: { amount: true },
  });
  const totalRevenue = confirmedPayments.reduce((acc, p) => acc + p.amount, 0);

  const stats = [
    {
      title: 'حجوزات اليوم',
      value: bookingsToday,
      icon: CalendarDays,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'مواعيد قادمة مؤكدة',
      value: upcomingBookings,
      icon: Clock,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    },
    {
      title: 'إثباتات دفع بانتظار الاعتماد',
      value: pendingPaymentsCount,
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      highlight: pendingPaymentsCount > 0,
    },
    {
      title: 'إجمالي الإيرادات المؤكدة',
      value: `$${totalRevenue}`,
      icon: DollarSign,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'الاستشارات المكتملة',
      value: completedCount,
      icon: CheckCircle2,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'الحجوزات الملغاة',
      value: cancelledCount,
      icon: XCircle,
      color: 'text-red-400 bg-red-500/10 border-red-500/20',
    },
    {
      title: 'عدد العملاء الكلي',
      value: totalCustomers,
      icon: Users,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'المستشارون المتاحون',
      value: totalConsultants,
      icon: GraduationCap,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
  ];

  const statusBadges: Record<string, { label: string; class: string }> = {
    pending_payment: { label: 'بانتظار الدفع', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    payment_uploaded: { label: 'إشعار مرفوع', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    payment_under_review: { label: 'قيد المراجعة', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    confirmed: { label: 'مؤكد', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    scheduled: { label: 'مجدول', class: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    completed: { label: 'مكتمل', class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    cancelled: { label: 'ملغي', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">لوحة مؤشرات المنصة</h1>
          <p className="text-xs text-slate-400 mt-1">نظرة عامة على نشاط الحجوزات، التحويلات المالية، والعملاء.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/bookings"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
          >
            <span>عرض كل الحجوزات</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Pending Proofs Alert Bar (if any pending review) */}
      {pendingProofs.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  يوجد {pendingProofs.length} إشعار دفع جديد بحاجة للتدقيق والاعتماد!
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  يرجى تدقيق الوصل وتأكيد الحجز ليتم إنشاء رابط Meet ومزامنة التقويم فورًا.
                </p>
              </div>
            </div>
            <Link
              href="/admin/proofs"
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 transition-colors"
            >
              مراجعة الكل
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {pendingProofs.map((pf) => (
              <div
                key={pf.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-200">
                    {pf.senderName} ({pf.amount} {pf.currency})
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    حجز: {pf.payment.booking.bookingReference} • {pf.payment.booking.customer.fullName}
                  </div>
                </div>
                <Link
                  href={`/admin/bookings/${pf.payment.booking.id}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 font-semibold text-[11px]"
                >
                  فحص واعتماد
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-slate-900/80 border transition-all ${
                st.highlight ? 'border-amber-500/50 shadow-lg shadow-amber-500/5' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">{st.title}</span>
                <div className={`p-2 rounded-xl border ${st.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white font-mono">{st.value}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">أحدث الحجوزات المسجلة</h3>
          <Link href="/admin/bookings" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
            عرض كافة السجلات ←
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 pr-2">المرجع</th>
                <th className="pb-3 px-2">العميل</th>
                <th className="pb-3 px-2">الخدمة</th>
                <th className="pb-3 px-2">المستشار</th>
                <th className="pb-3 px-2">الموعد</th>
                <th className="pb-3 px-2">الحالة</th>
                <th className="pb-3 pl-2 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentBookings.map((b) => {
                const badge = statusBadges[b.status] || { label: b.status, class: 'bg-slate-800 text-slate-300' };
                return (
                  <tr key={b.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 pr-2 font-mono font-bold text-white">
                      {b.bookingReference}
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-200">{b.customer.fullName}</div>
                      <div className="text-[10px] text-slate-500">{b.customer.whatsappPhone}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-300">
                      {b.service.nameAr}
                    </td>
                    <td className="py-3 px-2 text-slate-300">
                      {b.consultant?.user?.name || 'توجيه تلقائي'}
                    </td>
                    <td className="py-3 px-2 font-mono text-[11px] text-slate-400">
                      {format(new Date(b.slotStartTime), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.class}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 pl-2 text-left">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
                      >
                        تفاصيل
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
