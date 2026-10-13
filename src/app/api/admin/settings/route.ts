import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { Role } from '@prisma/client';
import { sendTelegramMessage } from '@/lib/integrations/telegram/service';
import { sendEmail } from '@/lib/integrations/email/service';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { settings, action, testEmail, token, chatId } = await request.json();

    // 1. If testing Telegram
    if (action === 'test_telegram') {
      const customToken = token ? String(token).trim() : undefined;
      const customChatId = chatId ? String(chatId).trim() : undefined;

      // If user provided credentials during test, save them directly to site settings
      if (customToken) {
        await prisma.siteSetting.upsert({
          where: { key: 'telegram_bot_token' },
          update: { value: customToken, category: 'telegram' },
          create: { key: 'telegram_bot_token', value: customToken, category: 'telegram' },
        });
      }
      if (customChatId) {
        await prisma.siteSetting.upsert({
          where: { key: 'telegram_chat_id' },
          update: { value: customChatId, category: 'telegram' },
          create: { key: 'telegram_chat_id', value: customChatId, category: 'telegram' },
        });
      }

      const result = await sendTelegramMessage(
        `🚀 <b>نجاح اختبار اتصال بوت تيليجرام!</b>\n\nمرحبًا <b>${session.name}</b>، تم ربط تيليجرام بنجاح.\nستصلك هنا إشعارات فورية بكافة الحجوزات الجديدة لجميع المستشارين، إثباتات الدفع، وتأكيد المواعيد.`,
        undefined,
        customChatId,
        customToken
      );

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'تم إرسال رسالة الاختبار إلى Telegram بنجاح! تفقد محادثة البوت الآن 🚀',
        });
      }

      let friendlyError = result.error || 'فشل إرسال رسالة الاختبار';
      const lowerErr = friendlyError.toLowerCase();
      if (lowerErr.includes('chat not found') || lowerErr.includes('forbidden') || lowerErr.includes('blocked')) {
        friendlyError =
          'لم يتمكن البوت من مراسلتك! تأكد أنك فتحت محادثة البوت في تيليجرام وضغطت زر البدء (/start) أولاً، وتأكد أن Chat ID هو رقم صحيح (وليس اسم مستخدم @).';
      } else if (lowerErr.includes('unauthorized') || lowerErr.includes('not found')) {
        friendlyError =
          'توكن البوت (Bot Token) غير صالح أو تم إدخاله بشكل خاطئ. تأكد من نسخه بدقة من @BotFather.';
      } else if (lowerErr.includes('credentials missing')) {
        friendlyError =
          'يرجى إدخال كل من Bot Token و Chat ID أولاً قبل إجراء الاختبار.';
      }

      return NextResponse.json({ success: false, error: friendlyError }, { status: 400 });
    }

    // 2. If testing SMTP
    if (action === 'test_smtp') {
      const target = testEmail || session.email;
      const result = await sendEmail({
        to: target,
        subject: 'اختبار إعدادات البريد SMTP — منصة أ. علي هشام',
        html: '<div dir="rtl"><h2>تهانينا!</h2><p>تم إرسال هذا البريد بنجاح لتأكيد عمل خادم SMTP.</p></div>',
      });
      if (result.success) {
        return NextResponse.json({ success: true, message: `تم إرسال بريد الاختبار إلى ${target} بنجاح!` });
      }
      return NextResponse.json({ success: false, error: result.error || 'فشل إرسال بريد الاختبار' }, { status: 400 });
    }

    // 3. Save Settings
    if (settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        const strVal = String(value ?? '').trim();
        const cat = key.startsWith('telegram_')
          ? 'telegram'
          : key.startsWith('smtp_')
          ? 'smtp'
          : key.startsWith('google_')
          ? 'google'
          : key.split('_')[0] || 'general';

        await prisma.siteSetting.upsert({
          where: { key },
          update: { value: strVal, category: cat },
          create: {
            key,
            value: strVal,
            category: cat,
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId: session.id,
          actorName: session.name,
          action: 'UPDATE_SITE_SETTINGS',
          entity: 'SiteSetting',
          newValue: 'تم تحديث إعدادات المنصة',
        },
      });

      return NextResponse.json({ success: true, message: 'تم حفظ وتحديث الإعدادات بنجاح.' });
    }

    return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
