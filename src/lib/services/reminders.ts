import prisma from '@/lib/db/prisma';
import { addHours, subHours, subMinutes, isAfter, isBefore } from 'date-fns';
import { sendEmail } from '@/lib/integrations/email/service';

export async function processAppointmentReminders() {
  const now = new Date();

  // 1. Process 24-hour reminders:
  // Bookings that are confirmed/scheduled, happening between 23h and 25h from now, and reminder24hSent is false.
  const target24hStart = addHours(now, 23);
  const target24hEnd = addHours(now, 25);

  const bookings24h = await prisma.booking.findMany({
    where: {
      status: { in: ['confirmed', 'scheduled'] },
      reminder24hSent: false,
      slotStartTime: {
        gte: target24hStart,
        lte: target24hEnd,
      },
    },
    include: {
      customer: true,
      service: true,
      consultant: { include: { user: true } },
    },
  });

  let sent24hCount = 0;
  for (const b of bookings24h) {
    try {
      const dateTimeStr = new Date(b.slotStartTime).toLocaleString('ar-EG', {
        dateStyle: 'full',
        timeStyle: 'short',
      });

      const subject = `تذكير: موعد استشارتك غدًا — ${b.service.nameAr} [${b.bookingReference}]`;
      const html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px 16px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 24px; border: 1px solid #334155;">
            <h2 style="color: #10b981; margin-top: 0;">تذكير بموعد استشارتك (خلال 24 ساعة)</h2>
            <p>مرحبًا ${b.customer.fullName}،</p>
            <p>نود تذكيرك بموعد جلستك الاستشارية غدًا مع المستشار <strong>${b.consultant?.user.name || 'أ. علي هشام'}</strong>.</p>
            <div style="background-color: #0f172a; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <p style="margin: 4px 0;">الموعد: <strong>${dateTimeStr}</strong></p>
              <p style="margin: 4px 0;">المنطقة الزمنية: <strong>${b.customerTimezone}</strong></p>
            </div>
            ${b.meetingLink ? `
              <div style="text-align: center; margin: 24px 0;">
                <a href="${b.meetingLink}" style="background-color: #10b981; color: #020617; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none;">
                  رابط الجلسة (Google Meet)
                </a>
              </div>
            ` : ''}
            <p style="font-size: 12px; color: #94a3b8;">يرجى تحضير أية أسئلة إضافية والتواجد قبل الموعد بدقائق.</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: b.customer.email,
        subject,
        html,
      });

      await prisma.booking.update({
        where: { id: b.id },
        data: { reminder24hSent: true },
      });
      sent24hCount++;
    } catch (err) {
      console.error(`Failed to send 24h reminder for booking ${b.id}:`, err);
    }
  }

  // 2. Process 1-hour reminders:
  // Bookings happening between 50 minutes and 75 minutes from now, reminder1hSent is false.
  const target1hStart = addHours(now, 0.8);
  const target1hEnd = addHours(now, 1.3);

  const bookings1h = await prisma.booking.findMany({
    where: {
      status: { in: ['confirmed', 'scheduled'] },
      reminder1hSent: false,
      slotStartTime: {
        gte: target1hStart,
        lte: target1hEnd,
      },
    },
    include: {
      customer: true,
      service: true,
      consultant: { include: { user: true } },
    },
  });

  let sent1hCount = 0;
  for (const b of bookings1h) {
    try {
      const subject = `تنبيه عاجل: تبدأ استشارتك خلال ساعة واحدة! [${b.bookingReference}]`;
      const html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px 16px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 24px; border: 1px solid #334155;">
            <h2 style="color: #f59e0b; margin-top: 0;">تبدأ جلستك الاستشارية بعد ساعة</h2>
            <p>مرحبًا ${b.customer.fullName}،</p>
            <p>نذكرك بأن جلستك المباشرة ستبدأ خلال 60 دقيقة.</p>
            ${b.meetingLink ? `
              <div style="text-align: center; margin: 24px 0;">
                <a href="${b.meetingLink}" style="background-color: #f59e0b; color: #020617; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none;">
                  الانضمام إلى Google Meet الآن
                </a>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      await sendEmail({
        to: b.customer.email,
        subject,
        html,
      });

      await prisma.booking.update({
        where: { id: b.id },
        data: { reminder1hSent: true },
      });
      sent1hCount++;
    } catch (err) {
      console.error(`Failed to send 1h reminder for booking ${b.id}:`, err);
    }
  }

  // 3. Process Slot Expiration Cleanup:
  // Auto-cancel bookings waiting for payment where slotExpiresAt < now
  const expiredBookings = await prisma.booking.updateMany({
    where: {
      status: 'pending_payment',
      slotExpiresAt: { lt: now },
    },
    data: {
      status: 'cancelled',
      cancellationReason: 'انتهاء مهلة رفع إثبات الدفع وتم تحرير الموعد تلقائيًا',
    },
  });

  return {
    sent24hCount,
    sent1hCount,
    expiredSlotsReleased: expiredBookings.count,
  };
}
