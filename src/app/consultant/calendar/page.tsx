import React from 'react';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { Calendar, Video, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ConsultantCalendarPage() {
  const session = await requireAuth([Role.CONSULTANT, Role.SUPER_ADMIN, Role.ADMIN]);

  const consultant = await prisma.consultant.findUnique({
    where: { userId: session.id },
    include: {
      googleConnection: true,
    },
  });

  const connection = consultant?.googleConnection;
  const isConnected = connection && connection.syncStatus === 'active';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">ربط وتكامل Google Calendar و Google Meet</h1>
        <p className="text-xs text-slate-400 mt-1">
          مزامنة المواعيد المباشرة وإنشاء روابط Google Meet تلقائيًا عند تأكيد الحجوزات.
        </p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-teal-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                تكامل تقويم Google الرسمي (OAuth 2.0)
              </h3>
              <p className="text-xs text-slate-400">
                {isConnected
                  ? `متصل بالحساب: ${connection.email}`
                  : 'غير مرتبط بحساب Google مخصص بعد (المنصة تعمل بروابط Meet مباشرة تلقائيًا)'}
              </p>
            </div>
          </div>

          <div>
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isConnected ? 'متصل بنشاط ومزامن' : 'متاح للتفعيل'}
            </span>
          </div>
        </div>

        {/* Integration Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-200">1. قراءة المواعيد المشغولة</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              يقوم النظام تلقائيًا بقراءة Busy Slots من تقويمك وحجبها لمنع أي تعارض في المواعيد.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-200">2. توليد رابط Google Meet</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              بمجرد اعتماد الدفع يتم إنشاء حدث وتقويم خاص للجلسة وتوليد رابط Meet رسمي تلقائيًا.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-200">3. المزامنة عند إعادة الجدولة</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              عند تغيير موعد الحجز يقوم النظام بتحديث الحدث القائم في تقويمك بدون تكرار الأحداث.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>المنصة تعتمد نظام OAuth 2.0 الآمن والمشفر دون الحاجة لتخزين كلمات المرور.</span>
        </div>
      </div>
    </div>
  );
}
