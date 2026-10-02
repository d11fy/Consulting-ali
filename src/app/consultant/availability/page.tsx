import React from 'react';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const DAYS_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default async function ConsultantAvailabilityPage() {
  const session = await requireAuth([Role.CONSULTANT, Role.SUPER_ADMIN, Role.ADMIN]);

  const consultant = await prisma.consultant.findUnique({
    where: { userId: session.id },
    include: {
      availabilityRules: { orderBy: { dayOfWeek: 'asc' } },
      blockedSlots: { orderBy: { startDateTime: 'asc' } },
    },
  });

  const rules = consultant?.availabilityRules || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">أوقات العمل وجدول المواعيد المتاحة</h1>
        <p className="text-xs text-slate-400 mt-1">
          الأوقات وفترات الراحة الأسبوعية التي يستطيع العملاء حجز مواعيدهم خلالها.
        </p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>ساعات العمل الأسبوعية (المنطقة الزمنية: {consultant?.timezone || 'Asia/Gaza'})</span>
        </h3>

        <div className="space-y-3">
          {DAYS_NAMES.map((dayName, dayIndex) => {
            const rule = rules.find((r) => r.dayOfWeek === dayIndex);
            const isWorking = rule && rule.isActive;

            return (
              <div
                key={dayIndex}
                className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                  isWorking
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/40 border-slate-900 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isWorking ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  ></div>
                  <span className="font-bold text-sm text-slate-200">{dayName}</span>
                </div>

                {isWorking ? (
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-300">
                      من <strong className="text-white">{rule.startTime}</strong> إلى <strong className="text-white">{rule.endTime}</strong>
                    </span>
                    {rule.breakStartTime && (
                      <span className="text-slate-500 text-[11px]">
                        (استراحة: {rule.breakStartTime} - {rule.breakEndTime})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-600 font-semibold">يوم عطلة / غير متاح</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
