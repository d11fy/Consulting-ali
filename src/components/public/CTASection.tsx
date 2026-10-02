import React from 'react';
import Link from 'next/link';
import { Calendar, MessageCircle, ArrowLeft, Sparkles } from 'lucide-react';

interface CTASectionProps {
  whatsappNumber: string;
  whatsappMessage: string;
}

export function CTASection({ whatsappNumber, whatsappMessage }: CTASectionProps) {
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 p-8 sm:p-16 text-center shadow-2xl overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-6 border border-emerald-500/30">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>ابدأ خطوتك القادمة الآن</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              جاهز لتحديد مسارك الأكاديمي أو الدولي بوضوح؟
            </h2>

            <p className="text-slate-300 text-base sm:text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              لا تترك خطتك للصدف أو التكهنات. احجز جلستك الآن مع المستشار الأنسب واختصر شهورًا من التردد والأخطاء.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-base font-bold shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-3 group"
              >
                <Calendar className="w-5 h-5" />
                <span>احجز موعد استشارتك</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-base font-semibold border border-slate-700 transition-all flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>استفسار سريع عبر واتساب</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
