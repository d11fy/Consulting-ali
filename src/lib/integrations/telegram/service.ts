import prisma from '@/lib/db/prisma';

export interface TelegramButton {
  text: string;
  url: string;
}

function getBaseAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://ali.masart.study';
}

function formatArabicDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Gaza',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export async function getTelegramConfig() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      OR: [
        { category: 'telegram' },
        { key: { in: ['telegram_bot_token', 'telegram_chat_id', 'telegram_enabled'] } },
      ],
    },
  });
  const map = new Map(settings.map((s) => [s.key, s.value]));

  const token = (map.get('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (map.get('telegram_chat_id') || process.env.TELEGRAM_CHAT_ID || '').trim();
  const isEnabled = map.get('telegram_enabled') !== 'false';

  return { token, chatId, isEnabled };
}

export async function sendTelegramMessage(
  text: string,
  buttons?: TelegramButton[],
  customChatId?: string,
  customToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getTelegramConfig();
    const token = (customToken || config.token).trim();
    const targetChatId = (customChatId || config.chatId).trim();
    const isEnabled = config.isEnabled;

    if (!isEnabled || !token || !targetChatId) {
      console.log('Telegram notifications not configured or disabled.');
      return { success: false, error: 'Telegram credentials missing or disabled' };
    }

    const payload: any = {
      chat_id: targetChatId,
      text,
      parse_mode: 'HTML',
    };

    // Filter valid URLs (Telegram rejects localhost and invalid URLs in buttons)
    const validButtons = (buttons || []).filter(
      (b) => b.url && (b.url.startsWith('https://') || b.url.startsWith('http://'))
    );

    if (validButtons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: [
          validButtons.map((b) => ({ text: b.text, url: b.url })),
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

      // If Telegram rejected due to buttons (e.g. BUTTON_URL_INVALID), retry without buttons
      if (payload.reply_markup) {
        const retryPayload = { ...payload };
        delete retryPayload.reply_markup;
        const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(retryPayload),
        });
        const retryResult = await retryRes.json();
        if (retryResult.ok) {
          return { success: true };
        }
      }

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
  customerPhone?: string;
  customerCountry?: string;
  serviceName: string;
  amount: number;
  consultantName?: string;
  slotStartTime: string;
  consultantTelegramChatId?: string | null;
}) {
  const appUrl = getBaseAppUrl();
  const formattedTime = formatArabicDateTime(booking.slotStartTime);

  const text = `
🔔 <b>حجز استشارة جديد على المنصة!</b>

📌 <b>نوع الاستشارة:</b> ${booking.serviceName}
🔢 <b>الرقم المرجعي:</b> <code>${booking.reference}</code>
👤 <b>اسم العميل:</b> ${booking.customerName}
${booking.customerPhone ? `📱 <b>رقم واتساب:</b> <code>${booking.customerPhone}</code>\n` : ''}${booking.customerCountry ? `🌍 <b>الدولة:</b> ${booking.customerCountry}\n` : ''}👨‍💼 <b>المستشار:</b> ${booking.consultantName || 'المستشار الأنسب (توجيه تلقائي)'}
💰 <b>الدفع:</b> $${booking.amount} USD (بانتظار التحويل)
📅 <b>الموعد المحدد:</b> ${formattedTime}

⚡ <i>الحجز مسجل وبانتظار تحويل العميل ورفع إشعار الدفع للاعتماد.</i>
  `.trim();

  const buttons: TelegramButton[] = [
    { text: 'عرض تفاصيل الحجز بالإدارة 🔗', url: `${appUrl}/admin/bookings/${booking.id}` },
  ];

  // Send to platform Admin
  const adminResult = await sendTelegramMessage(text, buttons);

  // If the assigned consultant has their own Telegram Chat ID, send them a copy
  if (
    booking.consultantTelegramChatId &&
    booking.consultantTelegramChatId.trim().length > 0
  ) {
    try {
      await sendTelegramMessage(text, buttons, booking.consultantTelegramChatId.trim());
    } catch (cErr) {
      console.error('Failed to notify consultant on their individual telegram chat ID:', cErr);
    }
  }

  return adminResult;
}

export async function notifyPaymentProofTelegram(booking: {
  id: string;
  reference: string;
  customerName: string;
  senderName: string;
  amount: number;
  currency: string;
  serviceName?: string;
  consultantName?: string;
  slotStartTime?: string;
  transactionNumber?: string;
  consultantTelegramChatId?: string | null;
}) {
  const appUrl = getBaseAppUrl();
  const formattedTime = booking.slotStartTime ? formatArabicDateTime(booking.slotStartTime) : null;

  const text = `
💳 <b>إشعار دفع جديد بانتظار المراجعة والاعتماد!</b>

${booking.serviceName ? `📌 <b>نوع الاستشارة:</b> ${booking.serviceName}\n` : ''}🔢 <b>الرقم المرجعي:</b> <code>${booking.reference}</code>
👤 <b>اسم العميل:</b> ${booking.customerName}
${booking.consultantName ? `👨‍💼 <b>المستشار:</b> ${booking.consultantName}\n` : ''}💵 <b>المبلغ المحول:</b> ${booking.amount} ${booking.currency}
👤 <b>اسم المحول:</b> ${booking.senderName}
${booking.transactionNumber ? `🧾 <b>رقم الحوالة:</b> <code>${booking.transactionNumber}</code>\n` : ''}${formattedTime ? `📅 <b>موعد الجلسة:</b> ${formattedTime}\n` : ''}
⚡ <b>يرجى مراجعة إيصال التحويل واعتماد الحجز لإنشاء رابط الاجتماع ومزامنة التقويم فورًا.</b>
  `.trim();

  const buttons: TelegramButton[] = [
    { text: 'مراجعة الدفع والاعتماد الآن 💳', url: `${appUrl}/admin/bookings/${booking.id}` },
  ];

  const adminResult = await sendTelegramMessage(text, buttons);

  if (booking.consultantTelegramChatId && booking.consultantTelegramChatId.trim().length > 0) {
    try {
      await sendTelegramMessage(text, buttons, booking.consultantTelegramChatId.trim());
    } catch (cErr) {
      console.error('Failed to notify consultant on payment proof telegram:', cErr);
    }
  }

  return adminResult;
}

export async function notifyPaymentConfirmedTelegram(booking: {
  id: string;
  reference: string;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  consultantName: string;
  amount?: number;
  slotStartTime?: string;
  meetingLink?: string;
  consultantTelegramChatId?: string | null;
}) {
  const appUrl = getBaseAppUrl();
  const formattedTime = booking.slotStartTime ? formatArabicDateTime(booking.slotStartTime) : null;

  const text = `
✅ <b>تم اعتماد الدفع وتأكيد الحجز بنجاح!</b>

📌 <b>نوع الاستشارة:</b> ${booking.serviceName}
🔢 <b>الرقم المرجعي:</b> <code>${booking.reference}</code>
👤 <b>العميل:</b> ${booking.customerName}
${booking.customerPhone ? `📱 <b>رقم واتساب:</b> <code>${booking.customerPhone}</code>\n` : ''}👨‍💼 <b>المستشار:</b> ${booking.consultantName}
${booking.amount ? `💰 <b>المبلغ المؤكد:</b> $${booking.amount} USD\n` : ''}${formattedTime ? `📅 <b>الموعد المؤكد:</b> ${formattedTime}\n` : ''}${booking.meetingLink ? `🔗 <b>رابط الاجتماع (Google Meet):</b> ${booking.meetingLink}\n` : ''}
🎉 <b>تم تحديث حالة الحجز ومزامنة الموعد في التقويم بنجاح.</b>
  `.trim();

  const buttons: TelegramButton[] = [];
  if (booking.meetingLink) {
    buttons.push({ text: 'دخول الاجتماع 🎥', url: booking.meetingLink });
  }
  buttons.push({ text: 'عرض تفاصيل الحجز 📄', url: `${appUrl}/admin/bookings/${booking.id}` });

  const adminResult = await sendTelegramMessage(text, buttons);

  if (booking.consultantTelegramChatId && booking.consultantTelegramChatId.trim().length > 0) {
    try {
      await sendTelegramMessage(text, buttons, booking.consultantTelegramChatId.trim());
    } catch (cErr) {
      console.error('Failed to notify consultant on payment confirmed telegram:', cErr);
    }
  }

  return adminResult;
}

export async function notifyConsultantUpcomingSessionTelegram(data: {
  consultantName: string;
  customerName: string;
  serviceName: string;
  meetingLink?: string | null;
  slotStartTime: string;
  minutesRemaining: number;
  telegramChatId?: string | null;
}) {
  const formattedTime = formatArabicDateTime(data.slotStartTime);
  const text = `
⏰ <b>تنبيه موعد استشارة قادمة</b>

مرحبًا <b>${data.consultantName}</b>،
نود تذكيرك بأن لديك جلسة استشارية ستبدأ بعد <b>${data.minutesRemaining} دقيقة</b>!

👤 <b>العميل:</b> ${data.customerName}
📋 <b>الخدمة:</b> ${data.serviceName}
🕒 <b>الموعد:</b> ${formattedTime}
${data.meetingLink ? `🔗 <b>رابط Google Meet:</b> ${data.meetingLink}` : ''}

يرجى فتح غرفة الاجتماع والتأكد من الجاهزية.
  `.trim();

  const buttons: TelegramButton[] = [];
  if (data.meetingLink) {
    buttons.push({ text: 'الانضمام للاجتماع 🎥', url: data.meetingLink });
  }

  return sendTelegramMessage(text, buttons.length > 0 ? buttons : undefined, data.telegramChatId || undefined);
}
