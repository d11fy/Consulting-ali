import React from 'react';
import prisma from '@/lib/db/prisma';
import { ConsultantsManager } from '@/components/admin/ConsultantsManager';

export const dynamic = 'force-dynamic';

export default async function AdminConsultantsPage() {
  const consultants = await prisma.consultant.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      specialties: {
        include: { specialty: true },
      },
      googleConnection: {
        select: { syncStatus: true },
      },
      bookings: {
        where: { status: 'confirmed' },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const formattedConsultants = consultants.map((c) => ({
    id: c.id,
    slug: c.slug,
    userId: c.userId,
    title: c.title,
    initials: c.initials,
    shortBio: c.shortBio,
    bio: c.bio,
    tags: c.tags,
    languages: c.languages,
    yearsOfExperience: c.yearsOfExperience,
    isActive: c.isActive,
    user: c.user,
    googleConnection: c.googleConnection,
    bookings: c.bookings,
  }));

  return <ConsultantsManager initialConsultants={formattedConsultants} />;
}
