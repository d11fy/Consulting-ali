import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        consultant: {
          include: {
            user: {
              select: { name: true, avatarUrl: true },
            },
          },
        },
        customer: {
          select: {
            fullName: true,
            email: true,
            whatsappPhone: true,
            country: true,
          },
        },
        payment: {
          include: {
            paymentMethod: true,
            proofs: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        documents: {
          include: {
            document: {
              select: {
                id: true,
                originalName: true,
                sizeBytes: true,
                mimeType: true,
                category: true,
              },
            },
          },
        },
        roadmap: {
          select: {
            id: true,
            status: true,
            downloadToken: true,
            deliveredAt: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'الحجز غير موجود' },
        { status: 404 }
      );
    }

    // Auto-release expired pending_payment bookings
    const now = new Date();
    if (
      booking.status === 'pending_payment' &&
      booking.slotExpiresAt &&
      booking.slotExpiresAt < now
    ) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled', cancellationReason: 'انتهاء مهلة رفع إثبات الدفع' },
      });
      booking.status = 'cancelled';
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب بيانات الحجز' },
      { status: 500 }
    );
  }
}
