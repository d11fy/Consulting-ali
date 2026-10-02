import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { Role } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id: bookingId } = await params;

    const { consultantId } = await request.json();

    const consultant = await prisma.consultant.findUnique({
      where: { id: consultantId },
      include: { user: true },
    });

    if (!consultant) {
      return NextResponse.json({ success: false, error: 'المستشار غير موجود' }, { status: 404 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        consultantId,
        isAutoAssign: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'ASSIGN_CONSULTANT',
        entity: 'Booking',
        entityId: bookingId,
        newValue: JSON.stringify({ consultantId, consultantName: consultant.user.name }),
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
