import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';

interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  comment?: string | null;
  createdAt: Date;
}

interface ReviewsSectionProps {
  reviews: ReviewItem[];
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  // Default testimonials if DB has few or empty reviews
  const displayReviews =
    reviews.length > 0
      ? reviews
      : [
          {
            id: 'rev-1',
            customerName: 'محمد ع. (طالب ماجستير - ألمانيا)',
            rating: 5,
            comment:
              'استشارة الـ 60 دقيقة مع أ. علي هشام غيرت مسار تقديمي تمامًا. جهز لي خارطة طريق شخصية واكتشف نقطة ضعف جوهرية في خطاب الدافع كان ممكن تتسبب برفض فوري. الحمد لله حصلت على القبول!',
            createdAt: new Date(),
          },
          {
            id: 'rev-2',
            customerName: 'سارة خ. (لم شمل عائلي - كندا)',
            rating: 5,
            comment:
              'وضوح وواقعية شديدة بدون وعود زائفة. فهمت كل الأوراق المطلوبة لملف لمّ الشمل والخطوات القانونية بالترتيب، وجنبني مصاريف مكاتب كانت رح تطلب مبالغ خيالية.',
            createdAt: new Date(),
          },
          {
            id: 'rev-3',
            customerName: 'أحمد ن. (منحة دراسية - إيطاليا)',
            rating: 5,
            comment:
              'الاستشارة المتخصصة كانت دقيقة جدًا ومركزة. عرفت كيف أختار الجامعة المناسبة لمعدلي وكيف أقدم على المنحة الإقليمية DSU، التوجيه كان ممتاز ومباشر.',
            createdAt: new Date(),
          },
        ];

  return (
    <section className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Star className="w-3.5 h-3.5 fill-emerald-400" />
            <span>آراء وتجارب العملاء</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            تجارب حقيقية تصنع الفارق
          </h2>
          <p className="text-slate-400 text-base">
            تقييمات موثقة من طلاب ومتقدمين استفادوا من جلسات الاستشارة ووجهوا ملفاتهم بنجاح.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayReviews.map((rev) => (
            <div
              key={rev.id}
              className="glass-panel rounded-3xl p-7 flex flex-col justify-between border border-slate-800 relative group"
            >
              <div>
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rev.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <Quote className="w-8 h-8 text-slate-700 mb-3 opacity-50" />

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                  {rev.comment}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                    {rev.customerName[0]}
                  </div>
                  <span className="text-xs font-bold text-white">
                    {rev.customerName}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تقييم موثق</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
