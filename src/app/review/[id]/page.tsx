import React from 'react';
import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { ReviewFormClient } from './ReviewFormClient';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';

export const dynamic = 'force-dynamic';

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: true,
      consultant: { include: { user: true } },
      customer: true,
      review: true,
    },
  });

  if (!booking) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans" dir="rtl">
      <Navbar />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full">
        <ReviewFormClient
          bookingId={booking.id}
          bookingRef={booking.bookingReference}
          serviceName={booking.service.nameAr}
          consultantName={booking.consultant?.user.name || 'أ. علي هشام'}
          customerName={booking.customer.fullName}
          existingReview={booking.review}
        />
      </main>

      <Footer
        legalDisclaimer="الاستشارة خدمة توجيهية واستشارية مبنية على البيانات والوثائق المقدمة."
        instagramAliHisham="https://instagram.com/ali_hisham"
        instagramMasarat="https://instagram.com/masarat_study"
        whatsappNumber="+970599123456"
      />
    </div>
  );
}
