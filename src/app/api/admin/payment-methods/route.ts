import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);

    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        payments: {
          select: { id: true },
        },
      },
    });

    return NextResponse.json({ success: true, paymentMethods });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'غير مصرح' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const body = await req.json();

    const {
      code,
      nameAr,
      nameEn,
      instructionsAr,
      accountDetails,
      isActive,
      orderIndex,
    } = body;

    if (!nameAr || !instructionsAr) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال اسم طريقة الدفع والتعليمات.' }, { status: 400 });
    }

    const generatedCode = code
      ? code.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')
      : (nameEn || nameAr).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');

    const finalCode = generatedCode || `pm_${Date.now()}`;

    // Check code uniqueness
    const existing = await prisma.paymentMethod.findUnique({ where: { code: finalCode } });
    const uniqueCode = existing ? `${finalCode}_${Date.now().toString(36)}` : finalCode;

    let parsedAccountDetails = accountDetails;
    if (typeof accountDetails === 'string') {
      try {
        parsedAccountDetails = JSON.parse(accountDetails);
      } catch {
        parsedAccountDetails = { raw: accountDetails };
      }
    }

    const newMethod = await prisma.paymentMethod.create({
      data: {
        code: uniqueCode,
        nameAr: nameAr.trim(),
        nameEn: nameEn ? nameEn.trim() : null,
        instructionsAr: instructionsAr.trim(),
        accountDetails: parsedAccountDetails || {},
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        orderIndex: parseInt(String(orderIndex), 10) || 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'CREATE_PAYMENT_METHOD',
        entity: 'PaymentMethod',
        entityId: newMethod.id,
        newValue: JSON.stringify(newMethod),
      },
    });

    return NextResponse.json({ success: true, paymentMethod: newMethod });
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    return NextResponse.json({ success: false, error: error.message || 'حدث خطأ أثناء إضافة طريقة الدفع' }, { status: 500 });
  }
}
