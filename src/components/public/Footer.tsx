import React from 'react';
import Link from 'next/link';
import { MessageCircle, ShieldAlert } from 'lucide-react';
import { InstagramIcon } from '@/components/shared/Icons';
import { BrandLogo } from '@/components/shared/BrandLogo';

interface FooterProps {
  legalDisclaimer: string;
  instagramAliHisham: string;
  instagramMasarat: string;
  whatsappNumber: string;
}

export function Footer({
  legalDisclaimer,
  instagramAliHisham,
  instagramMasarat,
  whatsappNumber,
}: FooterProps) {
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <BrandLogo />
            <p className="text-xs text-slate-400 leading-relaxed">
              منصة استشارات متخصصة في توجيه الطلاب والمتقدمين في مجالات التعليم العالي، القبولات الجامعية، المنح، مسارات الهجرة، ولمّ الشمل والفرص الدولية.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={instagramAliHisham}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-pink-400 hover:border-pink-500/40 transition-colors"
                title="Instagram أ. علي هشام"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href={instagramMasarat}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-purple-400 hover:border-purple-500/40 transition-colors"
                title="Instagram مسارات ستدي"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">روابط سريعة</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#specialties" className="hover:text-emerald-400 transition-colors">
                  المجالات والتخصصات
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
                  كيف تعمل المنصة؟
                </a>
              </li>
              <li>
                <a href="#consultants" className="hover:text-emerald-400 transition-colors">
                  فريق المستشارين
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-emerald-400 transition-colors">
                  الباقات والأسعار
                </a>
              </li>
              <li>
                <a href="#comprehensive" className="text-amber-300 hover:text-amber-200 transition-colors">
                  الاستشارة الشاملة ($200)
                </a>
              </li>
              <li>
                <a href="#faqs" className="hover:text-emerald-400 transition-colors">
                  الأسئلة الشائعة
                </a>
              </li>
            </ul>
          </div>

          {/* Consultation Services */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">الباقات المتاحة</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/book?service=quick-10" className="hover:text-emerald-400 transition-colors">
                  الاستشارة السريعة (10 دقائق — $15)
                </Link>
              </li>
              <li>
                <Link href="/book?service=specialized-30" className="hover:text-emerald-400 transition-colors">
                  الاستشارة المتخصصة (30 دقيقة — $50)
                </Link>
              </li>
              <li>
                <Link href="/book?service=comprehensive-60" className="hover:text-amber-300 transition-colors">
                  الاستشارة الشاملة + خارطة الطريق (60 دقيقة — $200)
                </Link>
              </li>
              <li>
                <Link href="/book?autoAssign=true" className="hover:text-teal-400 transition-colors">
                  التوجيه التلقائي للمستشار الأنسب
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals & Legal Access */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">معايير الأمان</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-500">حماية البيانات مشفرة بالكامل</span>
              </li>
              <li>
                <span className="text-slate-500">جلسات مباشرة عبر Google Meet</span>
              </li>
              <li>
                <span className="text-slate-500">تواصل مباشر وإشعارات فورية</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 mb-8">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-200 text-xs mb-1">
                تنبيه وإخلاء مسؤولية قانونية:
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {legalDisclaimer}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} — منصة أ. علي هشام للاستشارات الدولية.
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors">
              سياسة الخصوصية
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
