import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);

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

    return NextResponse.json({ success: true, specialties });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'غير مصرح' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const body = await req.json();

    const {
      nameAr,
      nameEn,
      slug,
      description,
      orderIndex,
      isActive = true,
      consultantIds = [],
    } = body;

    if (!nameAr || !nameAr.trim()) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال اسم المجال بالعربية.' }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = slug
      ? slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      : (nameEn || nameAr).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const finalSlug = baseSlug || `spec-${Date.now()}`;
    const existing = await prisma.specialty.findUnique({ where: { slug: finalSlug } });
    const uniqueSlug = existing ? `${finalSlug}-${Date.now().toString(36)}` : finalSlug;

    const specialty = await prisma.specialty.create({
      data: {
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || null,
        slug: uniqueSlug,
        description: description?.trim() || null,
        orderIndex: orderIndex !== undefined ? parseInt(String(orderIndex), 10) : 0,
        isActive: Boolean(isActive),
        ...(Array.isArray(consultantIds) && consultantIds.length > 0 && {
          consultants: {
            create: consultantIds.map((cId: string) => ({
              consultantId: cId,
            })),
          },
        }),
      },
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

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'CREATE_SPECIALTY',
        entity: 'Specialty',
        entityId: specialty.id,
        newValue: JSON.stringify(specialty),
      },
    });

    return NextResponse.json({ success: true, specialty });
  } catch (error: any) {
    console.error('Error creating specialty:', error);
    return NextResponse.json({ success: false, error: error.message || 'حدث خطأ أثناء إضافة المجال' }, { status: 500 });
  }
}
