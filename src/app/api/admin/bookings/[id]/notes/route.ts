import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { Role } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN, Role.CONSULTANT]);
    const { id: bookingId } = await params;

    const { content } = await request.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'المحتوى مطلوب' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { consultant: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'الحجز غير موجود' }, { status: 404 });
    }

    const targetConsultantId = booking.consultantId || (await prisma.consultant.findFirst({ select: { id: true } }))?.id;

    if (!targetConsultantId) {
      return NextResponse.json({ success: false, error: 'لا يوجد مستشار محدد لهذا الحجز' }, { status: 400 });
    }

    const note = await prisma.consultantNote.create({
      data: {
        bookingId,
        consultantId: targetConsultantId,
        content: content.trim(),
        isSharedWithAdmin: true,
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
