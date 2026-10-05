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

    const existing = await prisma.specialty.findUnique({
      where: { id },
      include: { consultants: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'المجال / التخصص غير موجود' }, { status: 404 });
    }

    const {
      nameAr,
      nameEn,
      slug,
      description,
      orderIndex,
      isActive,
      consultantIds,
    } = body;

    let finalSlug: string | undefined = undefined;
    if (slug && slug.trim() !== existing.slug) {
      const cleaned = slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const slugCheck = await prisma.specialty.findFirst({
        where: { slug: cleaned, NOT: { id } },
      });
      finalSlug = slugCheck ? `${cleaned}-${Date.now().toString(36)}` : cleaned;
    }

    const updated = await prisma.specialty.update({
      where: { id },
      data: {
        ...(nameAr && { nameAr: nameAr.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn ? nameEn.trim() : null }),
        ...(finalSlug && { slug: finalSlug }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(orderIndex !== undefined && { orderIndex: parseInt(String(orderIndex), 10) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
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

    // Update consultant relations if consultantIds is explicitly provided
    if (Array.isArray(consultantIds)) {
      // Delete existing relations
      await prisma.consultantSpecialty.deleteMany({
        where: { specialtyId: id },
      });

      // Insert new relations
      if (consultantIds.length > 0) {
        await prisma.consultantSpecialty.createMany({
          data: consultantIds.map((cId: string) => ({
            consultantId: cId,
            specialtyId: id,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Refetch full object
    const finalResult = await prisma.specialty.findUnique({
      where: { id },
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
        action: 'UPDATE_SPECIALTY',
        entity: 'Specialty',
        entityId: id,
        oldValue: JSON.stringify(existing),
        newValue: JSON.stringify(finalResult),
      },
    });

    return NextResponse.json({ success: true, specialty: finalResult });
  } catch (error: any) {
    console.error('Error updating specialty:', error);
    return NextResponse.json({ success: false, error: error.message || 'حدث خطأ أثناء تعديل المجال' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id } = await params;

    const existing = await prisma.specialty.findUnique({
      where: { id },
      include: { consultants: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'المجال غير موجود' }, { status: 404 });
    }

    // Delete specialty (ConsultantSpecialty cascades automatically)
    await prisma.specialty.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'DELETE_SPECIALTY',
        entity: 'Specialty',
        entityId: id,
        oldValue: JSON.stringify(existing),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المجال والتخصص بنجاح.',
    });
  } catch (error: any) {
    console.error('Error deleting specialty:', error);
    return NextResponse.json({ success: false, error: error.message || 'حدث خطأ أثناء حذف المجال' }, { status: 500 });
  }
}
