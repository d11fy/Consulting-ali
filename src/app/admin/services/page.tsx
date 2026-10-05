import React from 'react';
import prisma from '@/lib/db/prisma';
import { ServicesManager } from '@/components/admin/ServicesManager';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      bookings: {
        select: { id: true },
      },
    },
  });

  return <ServicesManager initialServices={services} />;
}
