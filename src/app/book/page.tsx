import React, { Suspense } from 'react';
import prisma from '@/lib/db/prisma';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { getCurrentSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function BookPage() {
  const session = await getCurrentSession();

  // Fetch all active data from PostgreSQL
  const specialties = await prisma.specialty.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  const consultants = await prisma.consultant.findMany({
    where: { isActive: true },
    include: {
      user: {
        select: { name: true, avatarUrl: true },
      },
      specialties: {
        include: {
          specialty: {
            select: { nameAr: true, slug: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const formattedConsultants = consultants.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.user.name,
    title: c.title,
    initials: c.initials,
    shortBio: c.shortBio,
    bio: c.bio,
    avatarUrl: c.user.avatarUrl,
    languages: c.languages,
    yearsOfExperience: c.yearsOfExperience,
    hourlyRate: c.hourlyRate,
    tags: c.tags,
    specialties: c.specialties.map((s) => s.specialty.nameAr),
  }));

  const settings = await prisma.siteSetting.findMany();
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  const whatsappNumber = settingsMap.get('whatsapp_number') || '+972567841404';
  const instagramAliHisham = settingsMap.get('instagram_ali_hisham') || 'https://www.instagram.com/ali_hisham.eu?stkn=MTQzd3MzMW44MjF4dw%3D%3D&utm_source=qr';
  const instagramMasarat = settingsMap.get('instagram_masarat_study') || 'https://www.instagram.com/masarat.study?stkn=MTN4OHc5a3pyYnMyMw==';
  const legalDisclaimer = settingsMap.get('legal_disclaimer') || '';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar userRole={session?.role || null} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <Suspense fallback={<div className="text-center py-20 text-slate-400">جاري تحميل نظام الحجز...</div>}>
          <BookingWizard
            specialties={specialties}
            services={services}
            consultants={formattedConsultants}
          />
        </Suspense>
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
