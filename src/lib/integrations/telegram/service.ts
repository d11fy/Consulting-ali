import prisma from '@/lib/db/prisma';

export interface TelegramButton {
  text: string;
  url: string;
}

export async function getTelegramConfig() {
  const settings = await prisma.siteSetting.findMany({
    where: { category: 'telegram' },
  });
  const map = new Map(settings.map((s) => [s.key, s.value]));

  const token = map.get('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN || '';
  const chatId = map.get('telegram_chat_id') || process.env.TELEGRAM_CHAT_ID || '';
  const isEnabled = map.get('telegram_enabled') !== 'false';

  return { token, chatId, isEnabled };
}

export async function sendTelegramMessage(
  text: string,
  buttons?: TelegramButton[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { token, chatId, isEnabled } = await getTelegramConfig();

    if (!isEnabled || !token || !chatId) {
      console.log('Telegram notifications not configured or disabled.');
      return { success: false, error: 'Telegram credentials missing or disabled' };
    }

    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };

    if (buttons && buttons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: [
          buttons.map((b) => ({ text: b.text, url: b.url })),
        ],
      };
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('Telegram API error:', result.description);
      return { success: false, error: result.description };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error sending Telegram notification:', err.message);
    return { success: false, error: err.message };
  }
}

export async function notifyNewBookingTelegram(booking: {
  id: string;
  reference: string;
  customerName: string;
  serviceName: string;
  amount: number;
  consultantName?: string;
  slotStartTime: string;
}) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const text = `
<b>🔔 حجز استشارة جديد بانتظار الدفع</b>

<b>الرقم المرجعي:</b> <code>${booking.reference}</code>
<b>العميل:</b> ${booking.customerName}
<b>الخدمة:</b> ${booking.serviceName}
<b>المستشار:</b> ${booking.consultantName || 'المستشار الأنسب (تلقائي)'}
<b>المبلغ المطلوب:</b> $${booking.amount} USD
<b>الموعد:</b> ${new Date(booking.slotStartTime).toLocaleString('ar-EG')}

<i>الحجز بانتظار تحويل العميل ورفع إشعار الدفع.</i>
  `.trim();

  const buttons: TelegramButton[] = [
    { text: 'عرض الحجز في الإدارة', url: `${appUrl}/admin/bookings/${booking.id}` },
  ];

  return sendTelegramMessage(text, buttons);
}

export async function notifyPaymentProofTelegram(booking: {
  id: string;
  reference: string;
  customerName: string;
  senderName: string;
  amount: number;
  currency: string;
  transactionNumber?: string;
}) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const text = `
<b>💳 إشعار دفع جديد بانتظار المراجعة والاعتماد!</b>

<b>الرقم المرجعي:</b> <code>${booking.reference}</code>
<b>العميل:</b> ${booking.customerName}
<b>اسم المحول:</b> ${booking.senderName}
<b>المبلغ المحول:</b> ${booking.amount} ${booking.currency}
${booking.transactionNumber ? `<b>رقم الحوالة:</b> <code>${booking.transactionNumber}</code>\n` : ''}
⚡ <b>يرجى مراجعة الإيصال واعتماد الحجز لإنشاء رابط الجلسة ومزامنة التقويم.</b>
  `.trim();

  const buttons: TelegramButton[] = [
    { text: 'مراجعة الدفع الآن', url: `${appUrl}/admin/bookings/${booking.id}` },
  ];

  return sendTelegramMessage(text, buttons);
}

export async function notifyPaymentConfirmedTelegram(booking: {
  id: string;
  reference: string;
  customerName: string;
  serviceName: string;
  consultantName: string;
  meetingLink?: string;
}) {
  const text = `
<b>✅ تم اعتماد الدفع وتأكيد الحجز بنجاح</b>

<b>الرقم المرجعي:</b> <code>${booking.reference}</code>
<b>العميل:</b> ${booking.customerName}
<b>الخدمة:</b> ${booking.serviceName}
<b>المستشار:</b> ${booking.consultantName}
${booking.meetingLink ? `<b>رابط الاجتماع:</b> ${booking.meetingLink}` : ''}
  `.trim();

  return sendTelegramMessage(text);
}
