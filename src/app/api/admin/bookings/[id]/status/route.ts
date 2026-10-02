import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { Role, BookingStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id: bookingId } = await params;

    const body = await request.json();
    const { status, cancellationReason } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'الحجز غير موجود' }, { status: 404 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: status as BookingStatus,
        cancellationReason: cancellationReason || null,
        completedAt: status === 'completed' ? new Date() : booking.completedAt,
        cancelledAt: status === 'cancelled' ? new Date() : booking.cancelledAt,
      },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: booking.status,
        toStatus: status as BookingStatus,
        changedBy: session.name,
        note: `تم تغيير الحالة إلى ${status} بواسطة المشرف ${session.name}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'UPDATE_BOOKING_STATUS',
        entity: 'Booking',
        entityId: bookingId,
        oldValue: JSON.stringify({ status: booking.status }),
        newValue: JSON.stringify({ status }),
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
