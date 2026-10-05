import React from 'react';
import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { getCurrentSession } from '@/lib/auth/session';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Globe2,
  ArrowLeft,
  Briefcase,
  ShieldCheck,
  Tag,
  BookOpen,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ConsultantProfilePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const rawId = resolvedParams?.id || '';
  const decodedId = decodeURIComponent(rawId);

  const session = await getCurrentSession();

  const consultant = await prisma.consultant.findFirst({
    where: {
      OR: [
        { id: rawId },
        { slug: rawId },
        { slug: decodedId },
      ],
    },
    include: {
      user: true,
      specialties: {
        include: { specialty: true },
      },
      services: {
        include: { service: true },
      },
    },
  });

  const settings = await prisma.siteSetting.findMany();
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  const whatsappNumber = settingsMap.get('whatsapp_number') || '+972567841404';
  const instagramAliHisham = settingsMap.get('instagram_ali_hisham') || 'https://www.instagram.com/ali_hisham.eu';
  const instagramMasarat = settingsMap.get('instagram_masarat_study') || 'https://www.instagram.com/masarat.study';
  const legalDisclaimer = settingsMap.get('legal_disclaimer') || '';

  if (!consultant || !consultant.user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans" dir="rtl">
        <Navbar userRole={session?.role || null} />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Briefcase className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">ملف المستشار غير متوفر</h1>
          <p className="text-xs text-slate-400 max-w-md">
            لم نتمكن من العثور على ملف هذا المستشار، يرجى العودة للرئيسية لاختيار المستشار المناسب.
          </p>
          <Link href="/" className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg">
            العودة للصفحة الرئيسية
          </Link>
        </main>
        <Footer
          legalDisclaimer={legalDisclaimer}
          instagramAliHisham={instagramAliHisham}
          instagramMasarat={instagramMasarat}
          whatsappNumber={whatsappNumber}
        />
      </div>
    );
  }

  const allServices = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  const displayInitials = consultant.initials || consultant.user.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
  const displayTags = (consultant.tags && consultant.tags.length > 0)
    ? consultant.tags
    : consultant.specialties.map((s) => s.specialty.nameAr);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans" dir="rtl">
      <Navbar userRole={session?.role || null} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-10">
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-emerald-400 transition-colors">
            الرئيسية
          </Link>
          <span>/</span>
          <a href="/#consultants" className="hover:text-emerald-400 transition-colors">
            المستشارون
          </a>
          <span>/</span>
          <span className="text-slate-200 font-semibold">{consultant.user.name}</span>
        </div>

        {/* Profile Header Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {consultant.user.avatarUrl ? (
              <img
                src={consultant.user.avatarUrl}
                alt={consultant.user.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-emerald-500/30 shadow-xl shrink-0"
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-slate-900 flex items-center justify-center text-white font-black text-3xl sm:text-4xl shadow-xl ring-4 ring-emerald-500/30 shrink-0 select-none">
                {displayInitials}
              </div>
            )}

            <div className="flex-1 text-center sm:text-right space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                    <span>{consultant.user.name}</span>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  </h1>
                  <p className="text-sm font-semibold text-emerald-400 mt-1">{consultant.title}</p>
                </div>

                <Link
                  href={`/book?consultantId=${consultant.id}`}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>احجز موعد مع هذا المستشار</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{consultant.yearsOfExperience > 2 ? `+${consultant.yearsOfExperience} سنوات خبرة عملية` : `${consultant.yearsOfExperience} سنوات خبرة`}</span>
                </span>
                <span className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Globe2 className="w-4 h-4 text-teal-400" />
                  <span>{consultant.languages.join('، ')}</span>
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-950/40 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                  <span>مستشار معتمد</span>
                </span>
              </div>
            </div>
          </div>

          {/* Full Bio */}
          <div className="mt-8 pt-8 border-t border-slate-800/80 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>النبذة الكاملة عن المستشار:</span>
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal whitespace-pre-line bg-slate-950/40 p-5 rounded-2xl border border-slate-800/60">
              {consultant.bio}
            </p>
          </div>

          {/* Consultation Areas & Tags */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>مجالات الاستشارة والتخصصات الدقيقة:</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {displayTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Available Consultation Services */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              الاستشارات المتاحة للحجز مع {consultant.user.name}
            </h2>
            <span className="text-xs text-slate-400">اختر نوع الجلسة المناسبة لحالتك</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allServices.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white">{s.nameAr}</h3>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-mono">
                      {s.durationMinutes} دقيقة
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white mb-3">${s.price}</div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{s.descriptionAr}</p>
                </div>

                <Link
                  href={`/book?consultantId=${consultant.id}&service=${s.slug}`}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs text-center shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>احجز هذه الجلسة</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer
        legalDisclaimer={legalDisclaimer}
        instagramAliHisham={instagramAliHisham}
        instagramMasarat={instagramMasarat}
        whatsappNumber={whatsappNumber}
      />
    </div>
  );
}
