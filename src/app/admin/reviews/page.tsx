import React from 'react';
import prisma from '@/lib/db/prisma';
import { AdminReviewsClient } from './AdminReviewsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: {
      booking: {
        include: {
          service: true,
          consultant: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">إدارة واعتماد التقييمات</h1>
        <p className="text-xs text-slate-400 mt-1">
          مراجعة تقييمات العملاء واعتمادها لتظهر في الصفحة الرئيسية للموقع.
        </p>
      </div>

      <AdminReviewsClient initialReviews={reviews} />
    </div>
  );
}
