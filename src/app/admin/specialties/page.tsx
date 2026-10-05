import React from 'react';
import prisma from '@/lib/db/prisma';
import { SpecialtiesManager } from '@/components/admin/SpecialtiesManager';

export const dynamic = 'force-dynamic';

export default async function AdminSpecialtiesPage() {
  const specialties = await prisma.specialty.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      consultants: {
        include: {
          consultant: {
            include: { user: true },
          },
        },
      },
    },
  });

  const consultants = await prisma.consultant.findMany({
    where: { isActive: true },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const consultantOptions = consultants.map((c) => ({
    id: c.id,
    title: c.title,
    name: c.user.name,
  }));

  return (
    <SpecialtiesManager
      initialSpecialties={specialties as any}
      allConsultants={consultantOptions}
    />
  );
}
