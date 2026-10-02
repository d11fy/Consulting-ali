import React from 'react';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ConsultantBookingsListPage() {
  const session = await requireAuth([Role.CONSULTANT, Role.SUPER_ADMIN, Role.ADMIN]);

  const consultant = await prisma.consultant.findUnique({
    where: { userId: session.id },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      consultantId: consultant?.id,
    },
    include: {
      customer: true,
      service: true,
      roadmap: true,
    },
    orderBy: { slotStartTime: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">سجل الاستشارات الخاصة بي</h1>
        <p className="text-xs text-slate-400 mt-1">كافة المواعيد والجلسات المرتبطة بحسابك.</p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 pr-2">المرجع</th>
                <th className="pb-3 px-2">العميل</th>
                <th className="pb-3 px-2">الخدمة</th>
                <th className="pb-3 px-2">الموعد</th>
                <th className="pb-3 px-2">الحالة</th>
                <th className="pb-3 pl-2 text-left">الملف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    لا توجد استشارات مسجلة لك بعد.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 pr-2 font-mono font-bold text-white">
                      {b.bookingReference}
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-slate-200">
                      {b.customer.fullName}
                    </td>
                    <td className="py-3.5 px-2 text-slate-300">
                      {b.service.nameAr}
                    </td>
                    <td className="py-3.5 px-2 font-mono text-slate-400">
                      {format(new Date(b.slotStartTime), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-2 text-left">
                      <Link
                        href={`/consultant/bookings/${b.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <span>فتح الملف</span>
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
