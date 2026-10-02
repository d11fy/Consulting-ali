import React from 'react';
import prisma from '@/lib/db/prisma';
import { HelpCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminFAQsPage() {
  const faqs = await prisma.fAQ.findMany({
    orderBy: { orderIndex: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">إدارة الأسئلة الشائعة (FAQs)</h1>
        <p className="text-xs text-slate-400 mt-1">
          الأسئلة والأجوبة الديناميكية المعروضة في الصفحة الرئيسية للموقع.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((f, idx) => (
          <div
            key={f.id}
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                <span>{f.questionAr}</span>
              </h3>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                معروض في الموقع
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pr-8">
              {f.answerAr}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
