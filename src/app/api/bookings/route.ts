import { NextRequest, NextResponse } from 'next/server';
import { createNewBooking } from '@/lib/services/booking';
import { z } from 'zod';

const bookingSchema = z.object({
  serviceId: z.string().min(1, 'يرجى اختيار نوع الاستشارة'),
  consultantId: z.string().nullable().optional(),
  isAutoAssign: z.boolean().optional(),
  slotStartTime: z.string().min(1, 'يرجى اختيار التاريخ والوقت'),
  customerTimezone: z.string().default('Asia/Gaza'),
  fullName: z.string().min(2, 'الاسم الكامل مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  whatsappPhone: z.string().min(6, 'رقم واتساب مطلوب'),
  country: z.string().min(2, 'يرجى تحديد الدولة'),
  age: z.coerce.number().optional().nullable(),
  caseDescription: z.string().min(5, 'يرجى كتابة وصف موجز للحالة'),
  primaryQuestion: z.string().min(5, 'يرجى كتابة السؤال الرئيسي'),
  desiredOutcome: z.string().min(3, 'يرجى تحديد النتيجة المرجوة'),
  additionalNotes: z.string().optional().nullable(),
  documentIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const booking = await createNewBooking(parsed.data);

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      redirectUrl: `/booking/${booking.id}`,
    });
  } catch (error: any) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'حدث خطأ أثناء إنشاء الحجز، يرجى المحاولة لاحقًا',
      },
      { status: 400 }
    );
  }
}
