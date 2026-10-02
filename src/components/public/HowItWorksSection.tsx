import React from 'react';
import Link from 'next/link';
import { UserCheck, CalendarCheck, CreditCard, Video, Sparkles, ArrowLeft } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'حدد حالتك ومجال استشارتك',
      description: 'اختر المجال الأقرب لحالتك (تعليم، هجرة، لم شمل، سفر، مراجعة ملفات) واكتب ملخصًا موجزًا عما ترغب في الوصول إليه.',
      icon: <UserCheck className="w-6 h-6 text-emerald-400" />,
    },
    {
      number: '02',
      title: 'اختر المستشار أو دعنا نرشح لك',
      description: 'يمكنك اختيار أ. علي هشام أو أحد المستشارين المتخصصين، أو اختيار (اختاروا لي المستشار الأنسب) لنوجه طلبك للأكثر خبرة ببلد دراستك.',
      icon: <Sparkles className="w-6 h-6 text-teal-400" />,
      badge: 'خيار التوجيه الذكي متاح',
    },
    {
      number: '03',
      title: 'اختر الموعد وادفع يدويًا',
      description: 'حدد التاريخ والوقت المناسب لمنطقتك الزمنية، واختر وسيلة الدفع (بنك فلسطين، PalPay، جوال باي، USDT، وغيرها) وارفع إشعار التحويل.',
      icon: <CreditCard className="w-6 h-6 text-cyan-400" />,
    },
    {
      number: '04',
      title: 'احضر جلستك عبر Google Meet',
      description: 'بمجرد تأكيد الدفع يصلك رابط الجلسة فوريًا عبر البريد، مع تذكيرات تلقائية قبل الموعد بـ 24 ساعة وساعة واحدة، وفي باقة الـ $200 تستلم خارطة الطريق.',
      icon: <Video className="w-6 h-6 text-amber-400" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-4">
            <span>خطوات واضحة وبسيطة</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            كيف تعمل منصة استشارات مسارات؟
          </h2>
          <p className="text-slate-400 text-base">
            صممنا رحلة الحجز لتكون سهلة وسريعة ومؤتمتة من هاتفك في 4 خطوات بسيطة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-3xl p-6 sm:p-7 relative flex flex-col justify-between border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {st.icon}
                  </div>
                  <span className="text-2xl font-black font-mono text-slate-700 group-hover:text-emerald-500/40 transition-colors">
                    {st.number}
                  </span>
                </div>

                {st.badge && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 text-[10px] font-medium border border-teal-500/20 mb-3">
                    {st.badge}
                  </span>
                )}

                <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  {st.title}
                </h3>

                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                  {st.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500">
                  الخطوة {st.number} من 04
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA banner below steps */}
        <div className="mt-12 text-center">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-emerald-500/30 text-sm font-bold hover:scale-105 transition-all shadow-lg"
          >
            <span>ابدأ الآن وحدد حالتك</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
