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

    const existingMethod = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!existingMethod) {
      return NextResponse.json({ success: false, error: 'طريقة الدفع غير موجودة' }, { status: 404 });
    }

    const {
      code,
      nameAr,
      nameEn,
      instructionsAr,
      accountDetails,
      isActive,
      orderIndex,
    } = body;

    let parsedAccountDetails = accountDetails;
    if (accountDetails !== undefined && typeof accountDetails === 'string') {
      try {
        parsedAccountDetails = JSON.parse(accountDetails);
      } catch {
        parsedAccountDetails = { raw: accountDetails };
      }
    }

    const updated = await prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(nameAr && { nameAr: nameAr.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn ? nameEn.trim() : null }),
        ...(code && { code: code.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '') }),
        ...(instructionsAr && { instructionsAr: instructionsAr.trim() }),
        ...(parsedAccountDetails !== undefined && { accountDetails: parsedAccountDetails }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(orderIndex !== undefined && { orderIndex: parseInt(String(orderIndex), 10) }),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'UPDATE_PAYMENT_METHOD',
        entity: 'PaymentMethod',
        entityId: id,
        oldValue: JSON.stringify(existingMethod),
        newValue: JSON.stringify(updated),
      },
    });

    return NextResponse.json({ success: true, paymentMethod: updated });
  } catch (error: any) {
    console.error('Error updating payment method:', error);
    return NextResponse.json({ success: false, error: error.message || 'حدث خطأ أثناء تعديل طريقة الدفع' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id } = await params;

    const existingMethod = await prisma.paymentMethod.findUnique({
      where: { id },
      include: { payments: { select: { id: true } } },
    });

    if (!existingMethod) {
      return NextResponse.json({ success: false, error: 'طريقة الدفع غير موجودة' }, { status: 404 });
    }

    // If method has payments attached, soft-delete by deactivating
    if (existingMethod.payments.length > 0) {
      const deactivated = await prisma.paymentMethod.update({
        where: { id },
        data: { isActive: false },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.id,
          actorName: session.name,
          action: 'DEACTIVATE_PAYMENT_METHOD',
          entity: 'PaymentMethod',
          oldValue: JSON.stringify(existingMethod),
          newValue: JSON.stringify(deactivated),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم تعطيل طريقة الدفع بنجاح وإخفاؤها من الموقع (لوجود دفعات سابقة مرتبطة بها).',
        paymentMethod: deactivated,
      });
    }

    // Otherwise permanently delete
    await prisma.paymentMethod.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'DELETE_PAYMENT_METHOD',
        entity: 'PaymentMethod',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, message: 'تم حذف طريقة الدفع نهائيًا بنجاح.' });
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json({ success: false, error: error.message || 'حدث خطأ أثناء حذف طريقة الدفع' }, { status: 500 });
  }
}
