import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id } = await params;
    const body = await req.json();

    const existingService = await prisma.service.findUnique({ where: { id } });
    if (!existingService) {
      return NextResponse.json({ success: false, error: 'الخدمة غير موجودة' }, { status: 404 });
    }

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

    let parsedFeatures: string[] | undefined = undefined;
    if (features !== undefined) {
      parsedFeatures = Array.isArray(features)
        ? features.map((f: any) => String(f).trim()).filter(Boolean)
        : typeof features === 'string'
        ? features.split('\n').map((f) => f.trim()).filter(Boolean)
        : [];
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...(nameAr && { nameAr: nameAr.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn ? nameEn.trim() : null }),
        ...(slug && { slug: slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') }),
        ...(descriptionAr && { descriptionAr: descriptionAr.trim() }),
        ...(durationMinutes !== undefined && { durationMinutes: parseInt(String(durationMinutes), 10) }),
        ...(price !== undefined && { price: parseFloat(String(price)) }),
        ...(currency && { currency }),
        ...(isPopular !== undefined && { isPopular: Boolean(isPopular) }),
        ...(isComprehensive !== undefined && { isComprehensive: Boolean(isComprehensive) }),
        ...(parsedFeatures !== undefined && { features: parsedFeatures }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(orderIndex !== undefined && { orderIndex: parseInt(String(orderIndex), 10) }),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'UPDATE_SERVICE',
        entity: 'Service',
        entityId: id,
        oldValue: JSON.stringify(existingService),
        newValue: JSON.stringify(updatedService),
      },
    });

    return NextResponse.json({ success: true, service: updatedService });
  } catch (error: any) {
    console.error('Error updating service:', error);
    return NextResponse.json({ success: false, error: error.message || 'حدث خطأ أثناء تعديل الخدمة' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id } = await params;

    const existingService = await prisma.service.findUnique({
      where: { id },
      include: { bookings: { select: { id: true } } },
    });

    if (!existingService) {
      return NextResponse.json({ success: false, error: 'الخدمة غير موجودة' }, { status: 404 });
    }

    // If service has bookings, soft-delete by deactivating it
    if (existingService.bookings.length > 0) {
      const deactivated = await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.id,
          actorName: session.name,
          action: 'DEACTIVATE_SERVICE',
          entity: 'Service',
          oldValue: JSON.stringify(existingService),
          newValue: JSON.stringify(deactivated),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم تعطيل الخدمة وإخفاؤها من الموقع بنجاح (نظراً لوجود حجوزات تاريخية مرتبطة بها).',
        service: deactivated,
      });
    }

    // Otherwise permanently delete
    await prisma.consultantService.deleteMany({ where: { serviceId: id } });
    await prisma.service.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'DELETE_SERVICE',
        entity: 'Service',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, message: 'تم حذف الخدمة نهائيًا بنجاح.' });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ success: false, error: error.message || 'حدث خطأ أثناء حذف الخدمة' }, { status: 500 });
  }
}
