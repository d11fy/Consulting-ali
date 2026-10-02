import React from 'react';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileText, Download, CheckCircle2, ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ConsultantRoadmapsPage() {
  const session = await requireAuth([Role.CONSULTANT, Role.SUPER_ADMIN, Role.ADMIN]);

  const consultant = await prisma.consultant.findUnique({
    where: { userId: session.id },
  });

  const roadmaps = await prisma.roadmap.findMany({
    where: {
      consultantId: consultant?.id,
    },
    include: {
      booking: {
        include: { customer: true, service: true },
      },
      roadmapDocument: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">خوارط الطريق وملفات دراسة الحالة ($200)</h1>
        <p className="text-xs text-slate-400 mt-1">
          إدارة وتوثيق ملفات Personal Case Study & Roadmap المخصصة للعملاء.
        </p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 pr-2">المرجع</th>
                <th className="pb-3 px-2">العميل</th>
                <th className="pb-3 px-2">الحالة</th>
                <th className="pb-3 px-2">الملف</th>
                <th className="pb-3 px-2">تاريخ التسليم</th>
                <th className="pb-3 pl-2 text-left">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {roadmaps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    لا توجد طلبات استشارة شاملة ($200) حاليًا.
                  </td>
                </tr>
              ) : (
                roadmaps.map((rm) => (
                  <tr key={rm.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 pr-2 font-mono font-bold text-white">
                      {rm.booking.bookingReference}
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-slate-200">
                      {rm.booking.customer.fullName}
                    </td>
                    <td className="py-3.5 px-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          rm.status === 'delivered' || rm.status === 'roadmap_ready'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}
                      >
                        {rm.status === 'delivered' ? 'تم التسليم' : 'بانتظار الإعداد'}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-slate-300">
                      {rm.roadmapDocument ? (
                        <a
                          href={`/api/documents/download?id=${rm.roadmapDocument.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{rm.roadmapDocument.originalName}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">لم يرفع بعد</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 font-mono text-[11px] text-slate-400">
                      {rm.deliveredAt ? format(new Date(rm.deliveredAt), 'yyyy-MM-dd') : '-'}
                    </td>
                    <td className="py-3.5 pl-2 text-left">
                      <Link
                        href={`/consultant/bookings/${rm.booking.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <span>إدارة الوثيقة</span>
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
