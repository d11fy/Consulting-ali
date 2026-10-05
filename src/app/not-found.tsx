import React from 'react';
import Link from 'next/link';
import { ArrowRight, Home, SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 font-sans" dir="rtl">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md text-center space-y-6">
        <div className="inline-flex p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-emerald-400">
          <SearchX className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/20">
            خطأ 404 — الصفحة غير موجودة
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            الصفحة المطلوبة غير متاحة
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            عذرًا، يبدو أن الرابط الذي حاولت الوصول إليه قد تغيّر، أو أن الصفحة غير موجودة حاليًا.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
