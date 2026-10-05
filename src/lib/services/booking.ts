import prisma from '@/lib/db/prisma';
import { addMinutes } from 'date-fns';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { notifyNewBookingTelegram } from '@/lib/integrations/telegram/service';
import { sendAdminNotificationEmail } from '@/lib/integrations/email/service';

export interface CreateBookingInput {
  serviceId: string;
  consultantId?: string | null;
  isAutoAssign?: boolean;
  slotStartTime: string; // ISO string in UTC
  customerTimezone: string;
  fullName: string;
  email: string;
  whatsappPhone: string;
  country: string;
  age?: number | null;
  caseDescription: string;
  primaryQuestion: string;
  desiredOutcome: string;
  additionalNotes?: string | null;
  documentIds?: string[];
}

export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MS-${year}-${randomChars}`;
}

export async function createNewBooking(input: CreateBookingInput) {
  const startTime = new Date(input.slotStartTime);
  const now = new Date();

  // 1. Get Service
  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
  });

  if (!service || !service.isActive) {
    throw new Error('الخدمة المطلوبة غير متوفرة حاليًا');
  }

  const endTime = addMinutes(startTime, service.durationMinutes);

  // 2. Resolve Consultant
  let targetConsultantId = input.consultantId;
  const isAuto = input.isAutoAssign || !targetConsultantId;

  if (isAuto) {
    const autoEligible = await prisma.consultant.findFirst({
      where: { isActive: true, isAutoAssignEligible: true },
      select: { id: true },
    });
    if (!autoEligible) {
      throw new Error('لا يوجد مستشار مؤهل متاح حاليًا');
    }
    targetConsultantId = autoEligible.id;
  }

  // 3. Expiration minutes from settings
  const expirationSetting = await prisma.siteSetting.findUnique({
    where: { key: 'booking_expiration_minutes' },
  });
  const expirationMinutes = parseInt(expirationSetting?.value || '120', 10);
  const slotExpiresAt = addMinutes(now, expirationMinutes);

  // 4. Transactional creation with anti-collision lock
  const booking = await prisma.$transaction(async (tx) => {
    // Check collision
    const existingConflict = await tx.booking.findFirst({
      where: {
        consultantId: targetConsultantId,
        status: { notIn: ['cancelled', 'refunded'] },
        slotStartTime: { lt: endTime },
        slotEndTime: { gt: startTime },
        OR: [
          {
            status: {
              in: [
                'confirmed',
                'scheduled',
                'payment_uploaded',
                'payment_under_review',
                'completed',
              ],
            },
          },
          {
            status: { in: ['pending_payment', 'draft'] },
            slotExpiresAt: { gt: now },
          },
        ],
      },
    });

    if (existingConflict) {
      throw new Error('عذرًا، تم حجز هذا الموعد للتو من قبل عميل آخر. يرجى اختيار موعد آخر.');
    }

    // Upsert Customer
    let customer = await tx.customer.findFirst({
      where: { email: input.email.trim().toLowerCase() },
    });

    if (!customer) {
      customer = await tx.customer.create({
        data: {
          fullName: input.fullName.trim(),
          email: input.email.trim().toLowerCase(),
          whatsappPhone: input.whatsappPhone.trim(),
          country: input.country.trim(),
          age: input.age || null,
        },
      });
    } else {
      customer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          fullName: input.fullName.trim(),
          whatsappPhone: input.whatsappPhone.trim(),
          country: input.country.trim(),
          age: input.age || customer.age,
        },
      });
    }

    // Create Booking
    const bookingRef = generateBookingReference();
    const newBooking = await tx.booking.create({
      data: {
        bookingReference: bookingRef,
        customerId: customer.id,
        consultantId: targetConsultantId,
        serviceId: service.id,
        isAutoAssign: isAuto,
        status: BookingStatus.pending_payment,
        slotStartTime: startTime,
        slotEndTime: endTime,
        customerTimezone: input.customerTimezone || 'Asia/Gaza',
        slotExpiresAt,
        caseDescription: input.caseDescription,
        primaryQuestion: input.primaryQuestion,
        desiredOutcome: input.desiredOutcome,
        additionalNotes: input.additionalNotes || null,
      },
    });

    // Create Initial Payment
    await tx.payment.create({
      data: {
        bookingId: newBooking.id,
        amount: service.price,
        currency: service.currency,
        status: PaymentStatus.pending,
      },
    });

    // Create Status History
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: newBooking.id,
        fromStatus: BookingStatus.draft,
        toStatus: BookingStatus.pending_payment,
        changedBy: customer.fullName,
        note: 'تم إنشاء الحجز الأولي بنجاح وبانتظار رفع إشعار الدفع',
      },
    });

    // Link uploaded documents if any
    if (input.documentIds && input.documentIds.length > 0) {
      for (const docId of input.documentIds) {
        await tx.bookingDocument.create({
          data: {
            bookingId: newBooking.id,
            documentId: docId,
          },
        });
      }
    }

    // If service is $200 comprehensive, initialize Roadmap record
    if (service.isComprehensive) {
      await tx.roadmap.create({
        data: {
          bookingId: newBooking.id,
          consultantId: targetConsultantId!,
          status: 'awaiting_documents',
        },
      });
    }

    return newBooking;
  }, {
    timeout: 25000,
    maxWait: 10000,
  });

  // 5. Notifications to Admin (Telegram, Email, In-app)
  try {
    // In-app notification
    await prisma.notification.create({
      data: {
        recipientType: 'admin',
        title: 'حجز جديد بانتظار الدفع',
        message: `قام العميل ${input.fullName} بحجز ${service.nameAr} بقيمة $${service.price}. المرجع: ${booking.bookingReference}`,
        type: 'booking_created',
        linkUrl: `/admin/bookings/${booking.id}`,
      },
    });

    // Fetch assigned consultant details for notification text
    const consultant = targetConsultantId
      ? await prisma.consultant.findUnique({
          where: { id: targetConsultantId },
          include: { user: true },
        })
      : null;

    // Telegram Bot notification to Admin
    try {
      await notifyNewBookingTelegram({
        id: booking.id,
        reference: booking.bookingReference,
        customerName: input.fullName,
        serviceName: service.nameAr,
        amount: service.price,
        consultantName: consultant?.user?.name || 'توجيه تلقائي',
        slotStartTime: startTime.toISOString(),
      });
    } catch (tgErr) {
      console.error('Failed to send telegram notification for new booking:', tgErr);
    }

    // Admin Notification Email
    try {
      await sendAdminNotificationEmail({
        subject: `🔔 حجز استشارة جديد بانتظار الدفع [${booking.bookingReference}]`,
        title: `تم تسجيل حجز استشارة جديد بانتظار التحويل والدفع`,
        detailsHtml: `
          <p><strong>الرقم المرجعي:</strong> <code>${booking.bookingReference}</code></p>
          <p><strong>اسم العميل:</strong> ${input.fullName} (${input.email})</p>
          <p><strong>رقم الهاتف / واتساب:</strong> ${input.whatsappPhone}</p>
          <p><strong>نوع الاستشارة:</strong> ${service.nameAr}</p>
          <p><strong>المستشار:</strong> ${consultant?.user?.name || 'توجيه تلقائي'}</p>
          <p><strong>المبلغ المطلوب:</strong> $${service.price} USD</p>
          <p><strong>الموعد المحجوز:</strong> ${startTime.toLocaleString('ar-EG')}</p>
        `,
        actionUrl: `/admin/bookings/${booking.id}`,
        actionText: 'عرض تفاصيل الحجز',
      });
    } catch (mailErr) {
      console.error('Failed to send admin email notification for new booking:', mailErr);
    }
  } catch (err) {
    console.error('Failed to process notifications for new booking:', err);
  }

  return booking;
}
