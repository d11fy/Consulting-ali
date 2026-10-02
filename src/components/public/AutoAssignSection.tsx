import React from 'react';
import Link from 'next/link';
import { HelpCircle, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';

export function AutoAssignSection() {
  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 p-8 sm:p-12 shadow-2xl">
          {/* Subtle background circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-4 border border-emerald-500/30">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>الخدمة الذكية لاختيار المستشار</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-snug">
                مش عارف أي مستشار مناسب لحالتك؟ <br />
                <span className="text-emerald-400">خلينا نختار لك المستشار الأنسب!</span>
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                أدخل تفاصيل حالتك والدولة التي تستهدفها، وسيقوم نظام المنصة وإدارتها بتعيين المستشار الأكثر خبرة وتخصصًا في نفس الجامعة أو البلد لضمان حصولك على أعلى قيمة وأدق توجيه.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>توجيه فوري حسب البلد المستهدف</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>توفير وقت البحث والمقارنة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>دراسة أولية لنوع المشكلة قبل التعيين</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ضمان توافق التخصص الدقيق</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <Link
                href="/book?autoAssign=true"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-base font-bold shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-3 group"
              >
                <span>اختاروا لي المستشار المناسب</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
