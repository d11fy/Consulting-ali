import React from 'react';
import Link from 'next/link';
import { FileText, CheckCircle2, Sparkles, Download, Calendar, ArrowLeft, Star, ShieldCheck } from 'lucide-react';

export function ComprehensiveHighlight() {
  const roadmapPoints = [
    'ملخص الحالة وتشخيص الوضع الحالي بدقة',
    'تحليل الفرص والمسارات الأكاديمية أو القانونية الأنسب',
    'قائمة الوثائق والمتطلبات والشروط الدقيقة لتجنب الرفض',
    'تحديد نقاط القوة لتعزيزها ونقاط الضعف لتداركها',
    'خارطة طريق زمنية مرتبة بالأولويات للخطوات القادمة',
  ];

  return (
    <section id="comprehensive" className="py-20 lg:py-28 relative bg-slate-950/90 overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950 border border-amber-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-4 border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>الخدمة الأكثر شمولًا وعمقًا ($200)</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4">
              الاستشارة الشاملة ليست مجرد مكالمة عادية!
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              إنها ملف استراتيجي متكامل: <strong>دراسة حالة + تحليل خيارات + جلسة شخصية 60 دقيقة + خارطة طريق + ملف مخصص</strong> (Personal Case Study & Roadmap).
            </p>
          </div>

          {/* 3 Pillars: Before, During, After */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* 1. Before */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-white">قبل الجلسة: دراسة مسبقة</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                يقوم المستشار بمراجعة كافة الوثائق والملفات المرفوعة (الشهادات، كشوف الدرجات، السيرة الذاتية) وتحليل الحالة وتحديد نقاط القوة والنواقص قبل بدء اللقاء.
              </p>
            </div>

            {/* 2. During */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-white">أثناء الجلسة: حوار 60 دقيقة</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                جلسة مباشرة ومغلقة عبر Google Meet للإجابة على كل الأسئلة، ومناقشة تفاصيل الخيارات والمسارات، وحسم القرارات المصيرية بكل وضوح.
              </p>
            </div>

            {/* 3. After */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-950/30 to-slate-900 border border-amber-500/30 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-amber-300">بعد الجلسة: ملف خارطة الطريق</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                يقوم المستشار بإعداد وتوثيق وثيقة <strong>Personal Case Study & Roadmap</strong> الخاصة بك ورفعها على النظام لتنزيلها عبر رابط خاص ومحمي.
              </p>
            </div>
          </div>

          {/* Document Roadmap Preview Box */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/80 border border-slate-800 mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    محتويات وثيقة: Personal Case Study & Roadmap
                  </h4>
                  <p className="text-xs text-slate-400">
                    ملف PDF موثق وشامل يُعد خصيصًا لكل عميل بعد انتهاء الجلسة الاستشارية
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
                <span>تنزيل آمن ومحمي</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              {roadmapPoints.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link
              href="/book?service=comprehensive-60"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-base font-bold shadow-xl shadow-amber-500/25 transition-all group"
            >
              <Calendar className="w-5 h-5" />
              <span>احجز الاستشارة الشاملة الآن ($200)</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
