import React from 'react';
import { MessageCircle, Info, ExternalLink } from 'lucide-react';
import { InstagramIcon } from '@/components/shared/Icons';

interface PreBookingNoticeProps {
  instagramAliHisham: string;
  instagramMasarat: string;
  whatsappNumber: string;
}

export function PreBookingNotice({
  instagramAliHisham,
  instagramMasarat,
  whatsappNumber,
}: PreBookingNoticeProps) {
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحبًا، أريد الاستفسار عن محتوى الاستشارات.')}`;

  return (
    <section className="py-12 bg-slate-900/60 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-teal-950/40 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 text-right">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                  قبل ما تحجز استشارتك
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  ممكن تلاقي إجابة سؤالك أصلًا في المحتوى الغني والمجاني الموجود على حساباتنا الرسمية. ننصحك بالاطلاع عليها أولًا:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={instagramAliHisham}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 hover:border-pink-500/50 hover:text-pink-300 transition-all flex items-center gap-2"
              >
                <InstagramIcon className="w-4 h-4 text-pink-400" />
                <span>Instagram أ. علي هشام</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <a
                href={instagramMasarat}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 hover:border-purple-500/50 hover:text-purple-300 transition-all flex items-center gap-2"
              >
                <InstagramIcon className="w-4 h-4 text-purple-400" />
                <span>Instagram مسارات ستدي</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-300 transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>واتساب الاستفسارات السريعة</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
