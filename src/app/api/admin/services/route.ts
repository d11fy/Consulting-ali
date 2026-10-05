import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);

    const services = await prisma.service.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        bookings: { select: { id: true } },
      },
    });

    return NextResponse.json({ success: true, services });
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
      descriptionAr,
      durationMinutes,
      price,
      currency,
      isPopular,
      isComprehensive,
      features,
      isActive,
      orderIndex,
    } = body;

    if (!nameAr || !descriptionAr || price === undefined || !durationMinutes) {
      return NextResponse.json({ success: false, error: 'يرجى ملء جميع الحقول المطلوبة (الاسم، الوصف، السعر، والمدة).' }, { status: 400 });
    }

    const generatedSlug = slug
      ? slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      : (nameEn || nameAr).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const finalSlug = generatedSlug || `service-${Date.now()}`;

    // Check slug uniqueness
    const existing = await prisma.service.findUnique({ where: { slug: finalSlug } });
    const uniqueSlug = existing ? `${finalSlug}-${Date.now().toString(36)}` : finalSlug;

    const parsedFeatures = Array.isArray(features)
      ? features.map((f: any) => String(f).trim()).filter(Boolean)
      : typeof features === 'string'
      ? features.split('\n').map((f) => f.trim()).filter(Boolean)
      : [];

    const newService = await prisma.service.create({
      data: {
        slug: uniqueSlug,
        nameAr: nameAr.trim(),
        nameEn: nameEn ? nameEn.trim() : null,
        descriptionAr: descriptionAr.trim(),
        durationMinutes: parseInt(String(durationMinutes), 10) || 30,
        price: parseFloat(String(price)) || 0,
        currency: currency || 'USD',
        isPopular: Boolean(isPopular),
        isComprehensive: Boolean(isComprehensive),
        features: parsedFeatures,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        orderIndex: parseInt(String(orderIndex), 10) || 0,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'CREATE_SERVICE',
        entity: 'Service',
        entityId: newService.id,
        newValue: JSON.stringify(newService),
      },
    });

    return NextResponse.json({ success: true, service: newService });
  } catch (error: any) {
    console.error('Error creating service:', error);
    return NextResponse.json({ success: false, error: error.message || 'حدث خطأ أثناء إنشاء الخدمة' }, { status: 500 });
  }
}
