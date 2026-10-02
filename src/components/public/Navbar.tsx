'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { Calendar, LogIn, Menu, X } from 'lucide-react';

interface NavbarProps {
  userRole?: string | null;
}

export function Navbar({ userRole }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <BrandLogo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#specialties" className="hover:text-emerald-400 transition-colors">
            المجالات
          </a>
          <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
            كيف نعمل؟
          </a>
          <a href="#consultants" className="hover:text-emerald-400 transition-colors">
            المستشارون
          </a>
          <a href="#services" className="hover:text-emerald-400 transition-colors">
            الباقات والأسعار
          </a>
          <a href="#comprehensive" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-amber-300">الاستشارة الشاملة</span>
          </a>
          <a href="#faqs" className="hover:text-emerald-400 transition-colors">
            الأسئلة الشائعة
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {userRole ? (
            <Link
              href={userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' ? '/admin' : '/consultant'}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>لوحة التحكم</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              تسجيل الدخول
            </Link>
          )}

          <Link
            href="/book"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>احجز استشارتك</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/book"
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold"
          >
            احجز الآن
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-6 space-y-4">
          <a
            href="#specialties"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            المجالات
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            كيف نعمل؟
          </a>
          <a
            href="#consultants"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            المستشارون
          </a>
          <a
            href="#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            الباقات والأسعار
          </a>
          <a
            href="#comprehensive"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-amber-300 hover:text-amber-200"
          >
            الاستشارة الشاملة ($200)
          </a>
          <a
            href="#faqs"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            الأسئلة الشائعة
          </a>
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              تسجيل دخول المشرفين والمستشارين
            </Link>
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              احجز موعد
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
