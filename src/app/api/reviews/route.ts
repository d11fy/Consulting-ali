import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parsed.data.bookingId },
      include: { customer: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'الحجز غير موجود' }, { status: 404 });
    }

    // Check if review already exists
    const existing = await prisma.review.findUnique({
      where: { bookingId: booking.id },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'تم إرسال تقييم لهذا الحجز مسبقًا.' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        customerName: booking.customer.fullName,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
        status: 'pending', // Requires admin approval to be public
      },
    });

    // Notify admin
    await prisma.notification.create({
      data: {
        recipientType: 'admin',
        title: 'تقييم عميل جديد بانتظار الاعتماد',
        message: `أضاف العميل ${booking.customer.fullName} تقييمًا جديدًا (${parsed.data.rating} نجوم).`,
        type: 'review_pending',
        linkUrl: '/admin/reviews',
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'شكرًا لك! تم إرسال تقييمك بنجاح وسيتم نشره بعد المراجعة.',
      reviewId: review.id,
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
