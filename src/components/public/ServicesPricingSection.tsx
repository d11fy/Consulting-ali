import React from 'react';
import Link from 'next/link';
import { Check, Clock, Sparkles, ArrowLeft, ShieldCheck } from 'lucide-react';

interface ServiceItem {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  descriptionAr: string;
  durationMinutes: number;
  price: number;
  currency: string;
  isPopular: boolean;
  isComprehensive: boolean;
  features: string[];
}

interface ServicesPricingSectionProps {
  services: ServiceItem[];
}

export function ServicesPricingSection({ services }: ServicesPricingSectionProps) {
  return (
    <section id="services" className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خيارات شفافة ومحددة</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            أنواع الاستشارات والباقات
          </h2>
          <p className="text-slate-400 text-base">
            اختر الجلسة التي تغطي حجم استفسارك وحالتك، مع ضمان أعلى درجات الاحترافية والاهتمام الفردي.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {services.map((s) => {
            const isHighlighted = s.isPopular || s.isComprehensive;
            return (
              <div
                key={s.id}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  s.isComprehensive
                    ? 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-xl shadow-amber-500/10'
                    : s.isPopular
                    ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10'
                    : 'glass-panel border border-slate-800'
                }`}
              >
                {/* Badge top */}
                {s.isPopular && (
                  <div className="absolute -top-3.5 right-1/2 translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs shadow-md">
                    الأكثر طلبًا واختيارًا
                  </div>
                )}
                {s.isComprehensive && (
                  <div className="absolute -top-3.5 right-1/2 translate-x-1/2 px-4 py-1 rounded-full bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>دراسة حالة + خارطة طريق</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                      {s.nameAr}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.durationMinutes} دقيقة</span>
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                    {s.descriptionAr}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-slate-800/80">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white">
                      ${s.price}
                    </span>
                    <span className="text-xs text-slate-400">
                      / استشارة فردية
                    </span>
                  </div>

                  {/* Features list */}
                  <div className="space-y-3 mb-8">
                    {s.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            s.isComprehensive
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-slate-300 leading-relaxed">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking Button */}
                <div className="pt-4 border-t border-slate-800/60">
                  <Link
                    href={`/book?service=${s.slug}`}
                    className={`w-full py-4 px-4 rounded-2xl text-center font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                      s.isComprehensive
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20'
                        : s.isPopular
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>احجز الآن (${s.price})</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
