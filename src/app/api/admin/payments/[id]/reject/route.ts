import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { rejectBookingPayment } from '@/lib/services/paymentVerification';
import { Role } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { id: paymentId } = await params;

    const body = await request.json().catch(() => ({}));
    const rejectionReason = body.rejectionReason || 'بيانات الإشعار غير مطابقة للمبلغ أو الحساب.';

    await rejectBookingPayment({
      paymentId,
      adminId: session.id,
      adminName: session.name,
      rejectionReason,
    });

    return NextResponse.json({ success: true, message: 'تم رفض إشعار الدفع وإشعار العميل.' });
  } catch (error: any) {
    console.error('Error rejecting payment:', error);
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء رفض الدفع' },
      { status: 500 }
    );
  }
}
