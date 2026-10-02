import React from 'react';
import prisma from '@/lib/db/prisma';
import { Compass, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminSpecialtiesPage() {
  const specialties = await prisma.specialty.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      consultants: {
        include: {
          consultant: { include: { user: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">إدارة مجالات وتخصصات الاستشارة</h1>
        <p className="text-xs text-slate-400 mt-1">
          المجالات المعتمدة في المنصة (التعليم، الهجرة، لمّ الشمل، التأشيرات، فحص الملفات، الفرص الدولية).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specialties.map((sp) => (
          <div
            key={sp.id}
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white">{sp.nameAr}</h3>
                <span className="text-[10px] text-slate-500 font-mono">{sp.slug}</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {sp.description}
              </p>

              <div className="border-t border-slate-800/80 pt-3 space-y-1.5 text-xs">
                <span className="text-[11px] text-slate-500 block mb-1">المستشارون المتاحون في هذا المجال:</span>
                {sp.consultants.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{c.consultant.user.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-4 flex justify-between text-xs text-slate-500">
              <span>الترتيب: {sp.orderIndex}</span>
              <span className="text-emerald-400 font-semibold">نشط</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
