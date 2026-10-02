import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { Role, ReviewStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id: reviewId } = await params;

    const { status, isFeatured } = await request.json();

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: status ? (status as ReviewStatus) : undefined,
        isFeatured: typeof isFeatured === 'boolean' ? isFeatured : undefined,
        approvedBy: status === 'approved' ? session.name : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorName: session.name,
        action: 'UPDATE_REVIEW_STATUS',
        entity: 'Review',
        entityId: reviewId,
        newValue: JSON.stringify({ status, isFeatured }),
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
