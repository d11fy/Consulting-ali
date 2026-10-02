import React from 'react';
import { Target, Award, Compass, Shield, Check } from 'lucide-react';

export function AboutPlatform() {
  const points = [
    'استشارات مبنية على خبرة واقعية تزيد عن 8 سنوات في المنظومة الدولية.',
    'دراسة مخصصة لكل حالة وظروفها دون تعميم أو نصائح تقليدية مكررة.',
    'حماية وسرية تامة لكافة الوثائق والملفات الشخصية والأكاديمية الحساسة.',
    'خارطة طريق واضحة وقابلة للتطبيق تضع يدك على الخطوات الملموسة التالية.',
  ];

  return (
    <section className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-emerald-400 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>نبذة عن المنصة ورؤيتنا</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              أكثر من مجرد نصيحة عابرة.. <br className="hidden sm:inline" />
              <span className="text-emerald-400">شريكك الموثوق لتحديد بوصلتك الدولية</span>
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              تأسست المنصة تحت إشراف <strong>أ. علي هشام</strong> لتقديم استشارات توجيهية متقدمة في مجالات القبولات الجامعية، منح البكالوريوس والدراسات العليا، مسارات الهجرة النظامية، لمّ الشمل العائلي، والفرص الإنسانية حول العالم.
            </p>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              ندرك جيدًا أن كل حالة لها خصوصيتها وتفاصيلها التي تصنع الفارق بين القبول والرفض. هدفنا تجنيبك إهدار الوقت والمال في مسارات غير مناسبة، ومساعدتك على اتخاذ القرار الصحيح في التوقيت المناسب.
            </p>

            <div className="space-y-3 pt-2">
              {points.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-200 text-sm font-medium">{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Card / Visual */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-xl opacity-30"></div>
              <div className="relative glass-panel rounded-3xl p-8 border border-slate-800 space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    ع.هـ
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">أ. علي هشام</h4>
                    <p className="text-xs text-emerald-400">مؤسس المنصة وخبير الاستشارات الدولية</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">غزة / فلسطين وخدمات دولية أونلاين</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-slate-300">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-200">فريق مستشارين متخصص</div>
                      <div className="text-slate-400 mt-0.5">شبكة من الخبراء في مجالات التعليم والهجرة والتأشيرات.</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <Target className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-200">منهجية تحليل دقيقة</div>
                      <div className="text-slate-400 mt-0.5">لا نعتمد على الحظ بل على دراسة الشروط واللوائح الحالية.</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-200">الشفافية والواقعية</div>
                      <div className="text-slate-400 mt-0.5">نخبرك بالحقيقة بوضوح ونحدد نقاط القوة والضعف في ملفك.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
