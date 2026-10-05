import React, { Suspense } from 'react';
import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { BookingTrackerClient } from './BookingTrackerClient';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { getCurrentSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentSession();

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: true,
      consultant: {
        include: {
          user: {
            select: { name: true, avatarUrl: true },
          },
        },
      },
      customer: true,
      payment: {
        include: {
          paymentMethod: true,
          proofs: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      documents: {
        include: {
          document: {
            select: {
              id: true,
              originalName: true,
              sizeBytes: true,
              mimeType: true,
              category: true,
            },
          },
        },
      },
      roadmap: {
        include: {
          roadmapDocument: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  // Check if pending_payment is expired
  const now = new Date();
  let currentStatus = booking.status;
  if (
    booking.status === 'pending_payment' &&
    booking.slotExpiresAt &&
    booking.slotExpiresAt < now
  ) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'cancelled', cancellationReason: 'انتهت مهلة رفع إثبات الدفع وتم تحرير الموعد تلقائيًا' },
    });
    currentStatus = 'cancelled';
  }

  // Fetch active payment methods
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  // Settings for WhatsApp & footer
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
        <Suspense fallback={<div className="text-center py-20 text-slate-400">جاري تحميل بيانات الحجز...</div>}>
          <BookingTrackerClient
            booking={{
              ...booking,
              status: currentStatus,
            }}
            paymentMethods={paymentMethods}
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
