import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { confirmBookingPayment } from '@/lib/services/paymentVerification';
import { Role } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id: paymentId } = await params;

    const body = await request.json().catch(() => ({}));
    const adminNotes = body.adminNotes;
    const idempotencyKey = body.idempotencyKey || request.headers.get('x-idempotency-key') || undefined;

    const result = await confirmBookingPayment({
      paymentId,
      adminId: session.id,
      adminName: session.name,
      adminNotes,
      idempotencyKey,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ success: false, error: 'غير مصرح لك بتنفيذ هذه العملية' }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء اعتماد الدفع' },
      { status: 500 }
    );
  }
}
