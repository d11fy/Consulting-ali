'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export interface FAQItem {
  id: string;
  questionAr: string;
  answerAr: string;
}

interface FAQSectionProps {
  faqs?: FAQItem[];
}

export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    questionAr: 'هل الاستشارة متاحة من خارج فلسطين؟',
    answerAr:
      'نعم، الاستشارات أونلاين بالكامل عبر Google Meet، ومتاحة للطلاب من أي دولة. وبنوفر طرق دفع متعددة تشمل الحوالات الدولية والعملات الرقمية (USDT).',
  },
  {
    id: 'faq-2',
    questionAr: 'هل يجب أن أحجز مع أ. علي هشام بالتحديد؟',
    answerAr:
      'لا، تقدر تختار المستشار الأنسب لموضوعك من المستشارين المتاحين على المنصة. إذا كان سؤالك عن المنح والقبولات الجامعية أو تجهيز ملف التقديم، فالحجز مع أ. علي هشام مناسب لهاي المواضيع.',
  },
  {
    id: 'faq-3',
    questionAr: 'هل يمكن إرسال الملفات والوثائق قبل الموعد؟',
    answerAr:
      'نعم، وننصح فيها. بعد تأكيد الحجز تقدر تبعت شهاداتك وسيرتك الذاتية وأي وثائق متعلقة بطلبك، عشان المستشار يراجعها قبل الجلسة ونستغل وقت الاستشارة بأفضل شكل.',
  },
  {
    id: 'faq-4',
    questionAr: 'هل الاستشارة تضمن الحصول على تأشيرة أو قبول أو منحة؟',
    answerAr:
      'لا. الاستشارة بتساعدك تختار الفرص المناسبة وتجهز ملفك بشكل صحيح وتتجنب الأخطاء الشائعة، لكن قرار القبول أو المنحة بيرجع للجامعة أو الجهة المانحة، وقرار التأشيرة بيرجع للسفارة. أي جهة بتوعدك بضمان، انتبه منها.',
  },
  {
    id: 'faq-5',
    questionAr: 'هل يمكن إلغاء الموعد أو إعادة جدولته؟',
    answerAr:
      'نعم، تقدر تلغي الموعد أو تغيّره قبل 24 ساعة على الأقل من وقته، ومن غير أي رسوم. إذا كان الإلغاء خلال آخر 24 ساعة أو ما حضرت الجلسة، ممكن ما ينسترد المبلغ.',
  },
];

export function FAQSection({ faqs }: FAQSectionProps) {
  const displayFaqs = faqs && faqs.length > 0 ? faqs : DEFAULT_FAQS;
  const [openId, setOpenId] = useState<string | null>(displayFaqs[0]?.id || 'faq-1');

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faqs" className="py-20 lg:py-28 relative bg-slate-950/70 border-t border-slate-900/60" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>إجابات واضحة لجميع استفساراتك</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            الأسئلة الشائعة
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            كل ما تحتاج معرفته حول آلية الجلسات، التحويل، المستشارين، والسرية.
          </p>
        </div>

        <div className="space-y-4">
          {displayFaqs.map((f) => {
            const isOpen = openId === f.id;
            return (
              <div
                key={f.id}
                onClick={() => toggleItem(f.id)}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer select-none ${
                  isOpen
                    ? 'border-emerald-500/50 bg-slate-900/90 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4">
                  <span
                    className={`text-sm sm:text-base font-bold transition-colors ${
                      isOpen ? 'text-emerald-400' : 'text-white'
                    }`}
                  >
                    {f.questionAr}
                  </span>
                  <div
                    className={`p-2 rounded-xl border shrink-0 transition-all duration-300 ${
                      isOpen
                        ? 'rotate-180 text-emerald-400 border-emerald-500/40 bg-emerald-950/80 shadow-md'
                        : 'text-slate-400 border-slate-800 bg-slate-900/80'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4 bg-slate-950/40 animate-fadeIn">
                    {f.answerAr}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
