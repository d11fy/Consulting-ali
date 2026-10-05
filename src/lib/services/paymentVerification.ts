import prisma from '@/lib/db/prisma';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { createGoogleMeetingEvent } from '@/lib/integrations/google/calendar';
import { notifyPaymentConfirmedTelegram } from '@/lib/integrations/telegram/service';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/integrations/email/service';

export interface ConfirmPaymentOptions {
  paymentId: string;
  adminId: string;
  adminName: string;
  adminNotes?: string;
  idempotencyKey?: string;
  customMeetingLink?: string;
}

export async function confirmBookingPayment({
  paymentId,
  adminId,
  adminName,
  adminNotes,
  idempotencyKey,
  customMeetingLink,
}: ConfirmPaymentOptions) {
  // 1. Fetch Payment and Booking
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          customer: true,
          service: true,
          consultant: {
            include: { user: true },
          },
        },
      },
      proofs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!payment) {
    throw new Error('سجل الدفع غير موجود');
  }

  // Idempotency check: If already confirmed, return gracefully without re-executing
  if (payment.status === PaymentStatus.confirmed && payment.booking.status === BookingStatus.confirmed) {
    return {
      success: true,
      alreadyConfirmed: true,
      booking: payment.booking,
      message: 'تم تأكيد هذا الحجز مسبقًا.',
    };
  }

  const now = new Date();

  // 2. Sequential DB Updates
  // Update Payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.confirmed,
      confirmedAt: now,
      confirmedBy: adminName,
      idempotencyKey: idempotencyKey || payment.idempotencyKey || null,
    },
  });

  // Update Latest Proof to accepted
  if (payment.proofs.length > 0) {
    await prisma.paymentProof.update({
      where: { id: payment.proofs[0].id },
      data: {
        status: 'accepted',
        reviewedAt: now,
        reviewedBy: adminName,
        adminNotes: adminNotes || 'تم التحقق من الدفع واعتماده',
      },
    });
  }

  const cleanedCustomMeetingLink = customMeetingLink?.trim() || null;
  let meetLink = cleanedCustomMeetingLink || payment.booking.meetingLink || null;

  // Update Booking
  const updatedBooking = await prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      status: BookingStatus.confirmed,
      ...(cleanedCustomMeetingLink && { meetingLink: cleanedCustomMeetingLink }),
    },
    include: {
      customer: true,
      service: true,
      consultant: { include: { user: true } },
    },
  });

  if (updatedBooking.meetingLink) {
    meetLink = updatedBooking.meetingLink;
  }

  // Record Status History
  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: updatedBooking.id,
      fromStatus: payment.booking.status,
      toStatus: BookingStatus.confirmed,
      changedBy: adminName,
      note: adminNotes || `تم اعتماد الدفع وتأكيد الحجز رسميًا بواسطة المشرف ${adminName}`,
    },
  });

  // Write Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      actorName: adminName,
      action: 'CONFIRM_PAYMENT',
      entity: 'Payment',
      entityId: payment.id,
      oldValue: JSON.stringify({ status: payment.status, bookingStatus: payment.booking.status }),
      newValue: JSON.stringify({ status: 'confirmed', bookingStatus: 'confirmed' }),
    },
  });

  // 3. Google Calendar & Google Meet (Only if admin did not specify a custom meet link)
  if (!cleanedCustomMeetingLink && !meetLink) {
    try {
      const calResult = await createGoogleMeetingEvent(updatedBooking.id);
      if (calResult.meetLink) {
        meetLink = calResult.meetLink;
      }
    } catch (err) {
      console.error('Google Calendar creation failed non-fatally:', err);
    }
  }

  // 4. Send Confirmation Email to Customer (Using exact custom link, without random fallback)
  try {
    const dateTimeStr = new Date(updatedBooking.slotStartTime).toLocaleString('ar-EG', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    await sendBookingConfirmationEmail({
      id: updatedBooking.id,
      reference: updatedBooking.bookingReference,
      customerName: updatedBooking.customer.fullName,
      customerEmail: updatedBooking.customer.email,
      serviceName: updatedBooking.service.nameAr,
      consultantName: updatedBooking.consultant?.user.name || 'أ. علي هشام',
      dateTimeStr,
      meetingLink: meetLink || null,
    });
  } catch (err) {
    console.error('Confirmation email failed non-fatally:', err);
  }

  // 5. Telegram Notification (Non-blocking resilience)
  try {
    await notifyPaymentConfirmedTelegram({
      id: updatedBooking.id,
      reference: updatedBooking.bookingReference,
      customerName: updatedBooking.customer.fullName,
      serviceName: updatedBooking.service.nameAr,
      consultantName: updatedBooking.consultant?.user.name || 'أ. علي هشام',
      meetingLink: meetLink || undefined,
    });
  } catch (err) {
    console.error('Telegram confirmation failed non-fatally:', err);
  }

  // 6. Admin Notification Email
  try {
    await sendAdminNotificationEmail({
      subject: `✅ تم اعتماد الدفع وتأكيد الحجز [${updatedBooking.bookingReference}]`,
      title: `تم تأكيد حجز واعتماد الدفع بواسطة المشرف: ${adminName}`,
      detailsHtml: `
        <p><strong>الرقم المرجعي:</strong> <code>${updatedBooking.bookingReference}</code></p>
        <p><strong>اسم العميل:</strong> ${updatedBooking.customer.fullName} (${updatedBooking.customer.email})</p>
        <p><strong>الخدمة:</strong> ${updatedBooking.service.nameAr}</p>
        <p><strong>المستشار:</strong> ${updatedBooking.consultant?.user.name || 'أ. علي هشام'}</p>
        <p><strong>الموعد:</strong> ${new Date(updatedBooking.slotStartTime).toLocaleString('ar-EG')}</p>
        ${meetLink ? `<p><strong>رابط الاجتماع المعتمد:</strong> <a href="${meetLink}" style="color: #10b981; font-weight: bold;">${meetLink}</a></p>` : ''}
      `,
      actionUrl: `/admin/bookings/${updatedBooking.id}`,
      actionText: 'عرض تفاصيل الحجز',
    });
  } catch (err) {
    console.error('Admin confirmation email failed non-fatally:', err);
  }

  return {
    success: true,
    booking: updatedBooking,
    meetLink,
    message: 'تم تأكيد الدفع بنجاح ومزامنة الموعد وإرسال الإشعارات.',
  };
}

export async function rejectBookingPayment({
  paymentId,
  adminId,
  adminName,
  rejectionReason,
}: {
  paymentId: string;
  adminId: string;
  adminName: string;
  rejectionReason: string;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: true,
      proofs: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!payment) throw new Error('سجل الدفع غير موجود');

  const now = new Date();

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.rejected,
      rejectionReason,
    },
  });

  if (payment.proofs.length > 0) {
    await prisma.paymentProof.update({
      where: { id: payment.proofs[0].id },
      data: {
        status: 'rejected',
        reviewedAt: now,
        reviewedBy: adminName,
        adminNotes: rejectionReason,
      },
    });
  }

  // Revert booking to pending_payment with fresh 2-hour window for customer to re-upload
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      status: BookingStatus.pending_payment,
      slotExpiresAt: new Date(Date.now() + 120 * 60 * 1000),
    },
  });

  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: payment.bookingId,
      fromStatus: payment.booking.status,
      toStatus: BookingStatus.pending_payment,
      changedBy: adminName,
      note: `تم رفض إشعار الدفع بسبب: ${rejectionReason}. تم إتاحة مهلة جديدة للعميل لإعادة الرفع.`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      actorName: adminName,
      action: 'REJECT_PAYMENT',
      entity: 'Payment',
      entityId: payment.id,
      newValue: JSON.stringify({ rejectionReason }),
    },
  });

  return { success: true };
}
