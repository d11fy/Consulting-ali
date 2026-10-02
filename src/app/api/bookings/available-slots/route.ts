import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getConsultantAvailableSlots } from '@/lib/services/availability';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    let consultantId = searchParams.get('consultantId');
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date'); // YYYY-MM-DD
    const timezone = searchParams.get('timezone') || 'Asia/Gaza';
    const isAutoAssign = searchParams.get('isAutoAssign') === 'true';

    if (!serviceId || !date) {
      return NextResponse.json(
        { success: false, error: 'serviceId and date are required' },
        { status: 400 }
      );
    }

    // If auto-assign or no consultant provided, find first eligible consultant
    if (isAutoAssign || !consultantId) {
      const eligible = await prisma.consultant.findFirst({
        where: { isActive: true, isAutoAssignEligible: true },
        select: { id: true },
      });
      if (!eligible) {
        return NextResponse.json(
          { success: false, error: 'لا يوجد مستشارين متاحين حاليًا' },
          { status: 404 }
        );
      }
      consultantId = eligible.id;
    }

    const slots = await getConsultantAvailableSlots(consultantId, serviceId, date, timezone);

    return NextResponse.json({
      success: true,
      consultantId,
      date,
      timezone,
      slots,
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء فحص المواعيد المتاحة' },
      { status: 500 }
    );
  }
}
