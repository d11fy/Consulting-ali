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

export async function sendBookingConfirmationEmail(booking: {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  consultantName: string;
  dateTimeStr: string;
  meetingLink: string;
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

        <div style="text-align: center; margin: 32px 0;">
          <a href="${booking.meetingLink}" style="background: linear-gradient(to right, #10b981, #14b8a6); color: #020617; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 15px;">
            الانضمام للجلسة عبر Google Meet
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #334155; padding-top: 20px;">
          يرجى التواجد قبل الموعد بـ 5 دقائق والتأكد من جودة اتصال الإنترنت والميكروفون. نتمنى لك جلسة مثمرة!
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: booking.customerEmail, subject, html });
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
