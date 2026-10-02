import React from 'react';
import Link from 'next/link';
import { Calendar, MessageCircle, ShieldCheck, CheckCircle2, Star, Sparkles, ArrowLeft } from 'lucide-react';

interface HeroSectionProps {
  whatsappNumber: string;
  whatsappMessage: string;
}

export function HeroSection({ whatsappNumber, whatsappMessage }: HeroSectionProps) {
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  const badges = [
    'تعليم',
    'هجرة',
    'لمّ شمل',
    'سفر',
    'قبول جامعي',
    'منح',
    'ملفات',
    'فرص دولية',
  ];

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Trust badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium mb-8 backdrop-blur-sm animate-fade-in shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>منصة استشارات معتمدة وموثوقة لعملاء الداخل والخارج</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto mb-6">
          عندك حالة ومش عارف <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">من وين تبدأ؟</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          احجز استشارة مع المستشار المناسب لحالتك، وافهم خياراتك والخطوات التي تحتاجها بشكل واضح ومدروس.
        </p>

        {/* Badges ticker */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-3xl mx-auto mb-10">
          {badges.map((badge, idx) => (
            <span
              key={idx}
              className="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-xs sm:text-sm font-medium hover:border-emerald-500/40 hover:text-emerald-300 transition-all cursor-default"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            href="/book"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-base font-bold shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            <Calendar className="w-5 h-5" />
            <span>احجز استشارتك الآن</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-base font-semibold border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-3"
          >
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            <span>تواصل معنا عبر WhatsApp</span>
          </a>
        </div>

        {/* Stats & Trust Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">+1,200</div>
            <div className="text-xs text-slate-400">استشارة ناجحة ومكتملة</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-1">98%</div>
            <div className="text-xs text-slate-400">نسبة رضا وتقييمات إيجابية</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <div className="text-2xl sm:text-3xl font-bold text-teal-400 mb-1">+35</div>
            <div className="text-xs text-slate-400">دولة يدرس ويعيش فيها عملاؤنا</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 mb-1">100%</div>
            <div className="text-xs text-slate-400">سرية وأمان للوثائق الشخصية</div>
          </div>
        </div>
      </div>
    </section>
  );
}
