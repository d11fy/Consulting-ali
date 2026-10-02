'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, Clock, Globe2, Award, UserCheck, XCircle } from 'lucide-react';

export interface ConsultantItem {
  id: string;
  slug?: string | null;
  name: string;
  title: string;
  initials?: string | null;
  shortBio?: string | null;
  bio: string;
  tags?: string[];
  avatarUrl?: string | null;
  languages: string[];
  yearsOfExperience: number;
  hourlyRate?: number;
  isActive?: boolean;
  specialties?: {
    specialty: {
      nameAr: string;
      slug: string;
    };
  }[];
}

interface ConsultantsSectionProps {
  consultants: ConsultantItem[];
}

export function ConsultantsSection({ consultants }: ConsultantsSectionProps) {
  return (
    <section id="consultants" className="py-20 lg:py-28 relative bg-slate-950/80 border-t border-slate-900/60" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Award className="w-3.5 h-3.5" />
            <span>فريق المستشارين المعتمد</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            نخبة من الخبراء في خدمتكم
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            اختر المستشار المناسب لنوع ملفك وتخصصك الأكاديمي، أو استخدم خيار التعيين التلقائي.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {consultants.map((c) => {
            const isAvailable = c.isActive !== false;
            const displayShortBio = c.shortBio || c.bio;
            const displayInitials = c.initials || c.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
            const displayTags = (c.tags && c.tags.length > 0)
              ? c.tags
              : c.specialties?.map((s) => s.specialty.nameAr) || [];
            const consultantProfileUrl = `/consultants/${c.slug || c.id}`;
            const bookingUrl = `/book?consultantId=${c.id}`;

            return (
              <div
                key={c.id}
                className="glass-panel glass-panel-hover rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-slate-800/90 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/40"
              >
                <div>
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                        isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {isAvailable ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>متاح للحجز</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>غير متاح حاليًا</span>
                        </>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {c.yearsOfExperience > 2 ? `+${c.yearsOfExperience} سنوات خبرة` : `${c.yearsOfExperience} سنوات خبرة`}
                    </span>
                  </div>

                  {/* Header with Avatar & Details */}
                  <div className="flex items-start gap-4 mb-5">
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        alt={c.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 flex items-center justify-center text-white font-extrabold text-xl sm:text-2xl ring-2 ring-emerald-500/30 shadow-lg shrink-0 select-none">
                        {displayInitials}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{c.name}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      </h3>

                      <p className="text-xs sm:text-sm font-semibold text-emerald-400 line-clamp-2 mt-1 leading-snug">
                        {c.title}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{c.languages.join('، ')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Short Bio */}
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 line-clamp-3 bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/60">
                    {displayShortBio}
                  </p>

                  {/* Tags */}
                  {displayTags.length > 0 && (
                    <div className="mb-6">
                      <div className="text-[11px] font-bold text-slate-400 mb-2">التخصصات والخدمات:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {displayTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-5 border-t border-slate-800/80 flex items-center gap-3">
                  <Link
                    href={bookingUrl}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm text-center shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>احجز مع هذا المستشار</span>
                  </Link>

                  <Link
                    href={consultantProfileUrl}
                    className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-xs sm:text-sm font-semibold transition-all text-center"
                  >
                    الملف
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
