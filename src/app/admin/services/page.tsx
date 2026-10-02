import React from 'react';
import prisma from '@/lib/db/prisma';
import { Briefcase, Clock, DollarSign, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      bookings: {
        select: { id: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">إدارة الخدمات والباقات والأسعار</h1>
          <p className="text-xs text-slate-400 mt-1">
            الباقات المتاحة للمتقدمين (الاستشارة السريعة $15، المتخصصة $50، الشاملة $200).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((s) => (
          <div
            key={s.id}
            className={`rounded-3xl p-6 border flex flex-col justify-between ${
              s.isComprehensive
                ? 'bg-amber-950/20 border-amber-500/40 shadow-xl'
                : s.isPopular
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-xl'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">{s.nameAr}</h3>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  {s.durationMinutes} دقيقة
                </span>
              </div>

              <div className="text-3xl font-black text-white mb-2">
                ${s.price} <span className="text-xs font-normal text-slate-400">USD</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {s.descriptionAr}
              </p>

              <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs">
                <div className="font-semibold text-slate-300 mb-2">المميزات المشمولة:</div>
                {s.features.map((f, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 mt-6 flex justify-between text-xs text-slate-400">
              <span>إجمالي الحجوزات:</span>
              <span className="font-bold text-white font-mono">{s.bookings.length}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
