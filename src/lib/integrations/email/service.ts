import nodemailer from 'nodemailer';
import prisma from '@/lib/db/prisma';

export async function getEmailTransporter() {
  const settings = await prisma.siteSetting.findMany({
    where: { category: 'smtp' },
  });
  const map = new Map(settings.map((s) => [s.key, s.value]));

  const host = map.get('smtp_host') || process.env.SMTP_HOST || 'smtp.ethereal.email';
  const port = parseInt(map.get('smtp_port') || process.env.SMTP_PORT || '587', 10);
  const user = map.get('smtp_user') || process.env.SMTP_USER || '';
  const pass = map.get('smtp_pass') || process.env.SMTP_PASS || '';
  const secure = map.get('smtp_secure') === 'true' || process.env.SMTP_SECURE === 'true';
  const from = map.get('smtp_from') || process.env.SMTP_FROM || 'استشارات أ. علي هشام <info@alihisham.com>';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  });

  return { transporter, from };
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { transporter, from } = await getEmailTransporter();
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err: any) {
    console.error('Email sending error:', err.message);
    return { success: false, error: err.message };
  }
}

export function renderEmailTemplate(
  templateHtml: string,
  variables: Record<string, string>
): string {
  let output = templateHtml;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    output = output.replace(regex, value);
  }
  return output;
}

export async function getAdminNotificationEmails(): Promise<string[]> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'admin_notification_email' },
    });
    if (setting?.value && setting.value.trim()) {
      return setting.value.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    }
    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      return [process.env.ADMIN_NOTIFICATION_EMAIL.trim()];
    }
    const admins = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
      select: { email: true },
    });
    const emails = admins.map((a) => a.email);
    return emails.length > 0 ? emails : ['info@alihisham.com'];
  } catch (err) {
    console.error('Failed to get admin emails:', err);
    return ['info@alihisham.com'];
  }
}

export async function sendAdminNotificationEmail({
  subject,
  title,
  detailsHtml,
  actionUrl,
  actionText,
}: {
  subject: string;
  title: string;
  detailsHtml: string;
  actionUrl?: string;
  actionText?: string;
}) {
  try {
    const adminEmails = await getAdminNotificationEmails();
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const fullActionUrl = actionUrl?.startsWith('http') ? actionUrl : `${appUrl}${actionUrl}`;

    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 20px; padding: 32px; border: 1px solid #1e293b;">
          <h2 style="color: #10b981; margin-top: 0; font-size: 20px;">${title}</h2>
          <div style="background-color: #020617; border-radius: 14px; padding: 20px; margin: 20px 0; border: 1px solid #1e293b; font-size: 14px; line-height: 1.8; color: #cbd5e1;">
            ${detailsHtml}
          </div>
          ${actionUrl ? `
            <div style="text-align: center; margin: 28px 0;">
              <a href="${fullActionUrl}" style="background: linear-gradient(to right, #10b981, #14b8a6); color: #020617; padding: 12px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px;">
                ${actionText || 'عرض التفاصيل في لوحة الإدارة'}
              </a>
            </div>
          ` : ''}
          <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">
            إشعار نظام آلي لمنصة استشارات أ. علي هشام — مسارات غزة
          </p>
        </div>
      </div>
    `;

    for (const email of adminEmails) {
      await sendEmail({ to: email, subject, html });
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to send admin notification email:', err);
    return { success: false, error: err.message };
  }
}

export async function sendBookingConfirmationEmail(booking: {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  consultantName: string;
  dateTimeStr: string;
  meetingLink?: string | null;
}) {
  const subject = `تأكيد حجز استشارتك — أ. علي هشام [${booking.reference}]`;
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 20px; padding: 32px; border: 1px solid #334155;">
        <h2 style="color: #10b981; margin-top: 0; font-size: 24px;">مرحبًا ${booking.customerName}،</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          يسعدنا إبلاغك بأنه قد تم اعتماد الدفع وتأكيد موعد استشارتك بنجاح!
        </p>

        <div style="background-color: #0f172a; border-radius: 16px; padding: 20px; margin: 24px 0; border: 1px solid #334155;">
          <p style="margin: 8px 0; color: #94a3b8; font-size: 13px;">الرقم المرجعي: <strong style="color: #f8fafc;">${booking.reference}</strong></p>
          <p style="margin: 8px 0; color: #94a3b8; font-size: 13px;">نوع الاستشارة: <strong style="color: #f8fafc;">${booking.serviceName}</strong></p>
          <p style="margin: 8px 0; color: #94a3b8; font-size: 13px;">المستشار: <strong style="color: #10b981;">${booking.consultantName}</strong></p>
          <p style="margin: 8px 0; color: #94a3b8; font-size: 13px;">الموعد: <strong style="color: #f8fafc;">${booking.dateTimeStr}</strong></p>
        </div>

        ${booking.meetingLink ? `
          <div style="text-align: center; margin: 32px 0;">
            <a href="${booking.meetingLink}" style="background: linear-gradient(to right, #10b981, #14b8a6); color: #020617; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 15px;">
              الانضمام للجلسة عبر Google Meet
            </a>
          </div>
        ` : `
          <div style="text-align: center; margin: 24px 0; padding: 16px; background-color: #020617; border-radius: 12px; border: 1px dashed #334155;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">
              سيتم تزويدك برابط الجلسة عبر صفحة متابعة الحجز وتذكيرات البريد قبل موعد الاستشارة.
            </p>
          </div>
        `}

        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #334155; padding-top: 20px;">
          يرجى التواجد قبل الموعد بـ 5 دقائق والتأكد من جودة اتصال الإنترنت والميكروفون. نتمنى لك جلسة مثمرة!
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: booking.customerEmail, subject, html });
}

export async function sendConsultantReminderEmail(data: {
  to: string;
  consultantName: string;
  customerName: string;
  serviceName: string;
  dateTimeStr: string;
  meetingLink?: string | null;
  bookingReference: string;
}) {
  const subject = `⏰ تذكير: لديك جلسة استشارية بعد 30 دقيقة مع العميل ${data.customerName} [${data.bookingReference}]`;
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px 16px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 24px; border: 1px solid #334155;">
        <h2 style="color: #f59e0b; margin-top: 0;">تنبيه: جلستك القادمة تبدأ بعد 30 دقيقة</h2>
        <p>مرحبًا ${data.consultantName}،</p>
        <p>نود تذكيرك بأن لديك جلسة استشارية مجدولة تبدأ خلال 30 دقيقة.</p>
        <div style="background-color: #0f172a; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #334155;">
          <p style="margin: 6px 0; color: #cbd5e1; font-size: 13px;">العميل: <strong>${data.customerName}</strong></p>
          <p style="margin: 6px 0; color: #cbd5e1; font-size: 13px;">نوع الاستشارة: <strong>${data.serviceName}</strong></p>
          <p style="margin: 6px 0; color: #cbd5e1; font-size: 13px;">الموعد: <strong>${data.dateTimeStr}</strong></p>
          <p style="margin: 6px 0; color: #94a3b8; font-size: 12px;">الرقم المرجعي: <code>${data.bookingReference}</code></p>
        </div>
        ${data.meetingLink ? `
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.meetingLink}" style="background: linear-gradient(to right, #10b981, #14b8a6); color: #020617; padding: 12px 28px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block;">
              فتح رابط Google Meet الآن
            </a>
          </div>
        ` : ''}
        <p style="font-size: 12px; color: #94a3b8;">يرجى فتح غرفة الاجتماع والتأكد من الجاهزية لاستقبال العميل.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: data.to, subject, html });
}

export async function sendRoadmapReadyEmail(booking: {
  customerName: string;
  customerEmail: string;
  reference: string;
  downloadUrl: string;
}) {
  const subject = `وثيقة خارطة الطريق الشخصية جاهزة للتنزيل [${booking.reference}]`;
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 20px; padding: 32px; border: 1px solid #334155;">
        <h2 style="color: #f59e0b; margin-top: 0; font-size: 24px;">مرحبًا ${booking.customerName}،</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          أكمل المستشار إعداد ملفك التوثيقي المخصص <strong>Personal Case Study & Roadmap</strong> الخاص بحالتك والخيارات المدروسة.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${booking.downloadUrl}" style="background-color: #f59e0b; color: #020617; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 15px;">
            تنزيل وثيقة خارطة الطريق (PDF)
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #334155; padding-top: 20px;">
          هذا الرابط مشفر وخاص بك. يمكنك دائمًا الرجوع لصفحة متابعة الحجز للوصول إلى الملف في أي وقت.
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: booking.customerEmail, subject, html });
}
