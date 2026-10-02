import React from 'react';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { Search, Filter, Calendar, User, ChevronLeft } from 'lucide-react';
import { BookingsFilterClient } from './BookingsFilterClient';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    consultantId?: string;
    search?: string;
  }>;
}) {
  const { status, consultantId, search } = await searchParams;

  const whereClause: any = {};

  if (status && status !== 'all') {
    whereClause.status = status;
  }

  if (consultantId && consultantId !== 'all') {
    whereClause.consultantId = consultantId;
  }

  if (search) {
    whereClause.OR = [
      { bookingReference: { contains: search, mode: 'insensitive' } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { customer: { email: { contains: search, mode: 'insensitive' } } },
      { customer: { whatsappPhone: { contains: search } } },
    ];
  }

  const [bookings, consultants, services] = await Promise.all([
    prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: true,
        service: true,
        consultant: { include: { user: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.consultant.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true } } },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, nameAr: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">إدارة وسجل الحجوزات</h1>
          <p className="text-xs text-slate-400 mt-1">البحث والفلترة ومتابعة كافة المواعيد والاستشارات.</p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          إجمالي النتائج: {bookings.length}
        </div>
      </div>

      {/* Filter and Search Bar Client */}
      <BookingsFilterClient
        consultants={consultants.map((c) => ({ id: c.id, name: c.user.name }))}
        currentStatus={status || 'all'}
        currentConsultant={consultantId || 'all'}
        currentSearch={search || ''}
      />

      {/* Bookings Table & Mobile Cards */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 pr-2">المرجع</th>
                <th className="pb-3 px-2">العميل</th>
                <th className="pb-3 px-2">الخدمة</th>
                <th className="pb-3 px-2">المستشار</th>
                <th className="pb-3 px-2">الموعد والتاريخ</th>
                <th className="pb-3 px-2">المبلغ</th>
                <th className="pb-3 px-2">الحالة</th>
                <th className="pb-3 pl-2 text-left">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                    لا توجد حجوزات مطابقة لمعايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 pr-2 font-mono font-bold text-white">
                      {b.bookingReference}
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="font-semibold text-slate-200">{b.customer.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{b.customer.whatsappPhone}</div>
                    </td>
                    <td className="py-3.5 px-2 text-slate-300">
                      {b.service.nameAr}
                    </td>
                    <td className="py-3.5 px-2 text-slate-300">
                      {b.consultant?.user?.name || (
                        <span className="text-amber-400 text-[10px] font-semibold">بانتظار التعيين</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 font-mono text-[11px] text-slate-400">
                      {format(new Date(b.slotStartTime), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="py-3.5 px-2 font-mono font-bold text-emerald-400">
                      ${b.payment?.amount || b.service.price}
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-2 text-left">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <span>إدارة</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
