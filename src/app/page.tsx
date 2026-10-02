import React from 'react';
import prisma from '@/lib/db/prisma';
import { getCurrentSession } from '@/lib/auth/session';
import { Navbar } from '@/components/public/Navbar';
import { HeroSection } from '@/components/public/HeroSection';
import { AboutPlatform } from '@/components/public/AboutPlatform';
import { SpecialtiesSection } from '@/components/public/SpecialtiesSection';
import { HowItWorksSection } from '@/components/public/HowItWorksSection';
import { ConsultantsSection } from '@/components/public/ConsultantsSection';
import { AutoAssignSection } from '@/components/public/AutoAssignSection';
import { ServicesPricingSection } from '@/components/public/ServicesPricingSection';
import { ComprehensiveHighlight } from '@/components/public/ComprehensiveHighlight';
import { PreBookingNotice } from '@/components/public/PreBookingNotice';
import { ReviewsSection } from '@/components/public/ReviewsSection';
import { FAQSection } from '@/components/public/FAQSection';
import { PaymentMethodsSection } from '@/components/public/PaymentMethodsSection';
import { CTASection } from '@/components/public/CTASection';
import { FloatingWhatsApp } from '@/components/public/FloatingWhatsApp';
import { Footer } from '@/components/public/Footer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const session = await getCurrentSession();

  // 1. Fetch Specialties
  const specialties = await prisma.specialty.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  // 2. Fetch Consultants
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
    isActive: c.isActive,
    specialties: c.specialties,
  }));

  // 3. Fetch Services
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  // 4. Fetch Payment Methods
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  // 5. Fetch FAQs
  const faqs = await prisma.fAQ.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  // 6. Fetch Approved Reviews
  const reviews = await prisma.review.findMany({
    where: { status: 'approved' },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  // 7. Fetch Site Settings
  const settings = await prisma.siteSetting.findMany();
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  const whatsappNumber = settingsMap.get('whatsapp_number') || '+970599123456';
  const whatsappMessage =
    settingsMap.get('whatsapp_default_message') ||
    'مرحبًا، أريد الاستفسار عن الاستشارة المناسبة لحالتي.';
  const instagramAliHisham =
    settingsMap.get('instagram_ali_hisham') || 'https://instagram.com/ali_hisham';
  const instagramMasarat =
    settingsMap.get('instagram_masarat_study') ||
    'https://instagram.com/masarat_study';
  const legalDisclaimer =
    settingsMap.get('legal_disclaimer') ||
    'الاستشارة خدمة توجيهية مبنية على المعلومات والوثائق التي يقدمها العميل، ولا تمثل ضمانًا للحصول على قبول أو تأشيرة أو منحة أو لمّ شمل أو موافقة من أي جهة. وفي الحالات التي تحتاج لاستشارة قانونية رسمية يتم توجيه العميل لمحامٍ أو مستشار مرخص حسب الدولة والاختصاص.';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* 1. Header / Navigation */}
      <Navbar userRole={session?.role || null} />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection
          whatsappNumber={whatsappNumber}
          whatsappMessage={whatsappMessage}
        />

        {/* 2. Pre-booking notice */}
        <PreBookingNotice
          instagramAliHisham={instagramAliHisham}
          instagramMasarat={instagramMasarat}
          whatsappNumber={whatsappNumber}
        />

        {/* 3. About Platform */}
        <AboutPlatform />

        {/* 4. Specialties */}
        <SpecialtiesSection specialties={specialties} />

        {/* 5. How It Works */}
        <HowItWorksSection />

        {/* 6. Consultants */}
        <ConsultantsSection consultants={formattedConsultants} />

        {/* 7. Auto Assign Section */}
        <AutoAssignSection />

        {/* 8. Services & Pricing */}
        <ServicesPricingSection services={services} />

        {/* 9. Comprehensive $200 Consultation Highlight */}
        <ComprehensiveHighlight />

        {/* 10. Reviews */}
        <ReviewsSection reviews={reviews} />

        {/* 11. FAQ */}
        <FAQSection faqs={faqs} />

        {/* 12. Payment Methods */}
        <PaymentMethodsSection paymentMethods={paymentMethods} />

        {/* 13. Call To Action */}
        <CTASection
          whatsappNumber={whatsappNumber}
          whatsappMessage={whatsappMessage}
        />
      </main>

      {/* 14. Floating WhatsApp */}
      <FloatingWhatsApp
        whatsappNumber={whatsappNumber}
        defaultMessage={whatsappMessage}
      />

      {/* 15. Footer & Legal Disclaimer */}
      <Footer
        legalDisclaimer={legalDisclaimer}
        instagramAliHisham={instagramAliHisham}
        instagramMasarat={instagramMasarat}
        whatsappNumber={whatsappNumber}
      />
    </div>
  );
}
