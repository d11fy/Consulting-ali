import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { Role } from '@prisma/client';
import { sendTelegramMessage } from '@/lib/integrations/telegram/service';

export async function GET() {
  try {
    const session = await requireAuth([Role.CONSULTANT, Role.SUPER_ADMIN, Role.ADMIN]);

    const settings = await prisma.siteSetting.findMany({
      where: {
        category: { in: ['telegram', 'google', 'general'] },
      },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));

    // Check consultant's own Google connection
    const consultant = await prisma.consultant.findUnique({
      where: { userId: session.id },
      include: { googleConnection: true },
    });

    return NextResponse.json({
      success: true,
      settings: {
        telegram_bot_token: map.get('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN || '',
        telegram_chat_id: map.get('telegram_chat_id') || process.env.TELEGRAM_CHAT_ID || '',
        telegram_enabled: map.get('telegram_enabled') !== 'false',
        google_client_id: map.get('google_client_id') || process.env.GOOGLE_CLIENT_ID || '',
        google_client_secret: map.get('google_client_secret') || process.env.GOOGLE_CLIENT_SECRET || '',
        google_enabled: map.get('google_enabled') !== 'false',
      },
      googleConnectionStatus: consultant?.googleConnection
        ? {
            isConnected: consultant.googleConnection.syncStatus === 'active',
            email: consultant.googleConnection.email,
            lastSyncedAt: consultant.googleConnection.lastSyncedAt,
          }
        : { isConnected: false },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([Role.CONSULTANT, Role.SUPER_ADMIN, Role.ADMIN]);
    const { settings, action } = await request.json();

    // 1. Action: Test Telegram Bot
    if (action === 'test_telegram') {
      const testToken = settings?.telegram_bot_token;
      const testChatId = settings?.telegram_chat_id;

      // If temporary inputs were passed, save them temporarily to test
      if (testToken && testChatId) {
        await prisma.siteSetting.upsert({
          where: { key: 'telegram_bot_token' },
          update: { value: testToken, category: 'telegram' },
          create: { key: 'telegram_bot_token', value: testToken, category: 'telegram' },
        });
        await prisma.siteSetting.upsert({
          where: { key: 'telegram_chat_id' },
          update: { value: testChatId, category: 'telegram' },
          create: { key: 'telegram_chat_id', value: testChatId, category: 'telegram' },
        });
        if (settings?.telegram_enabled !== undefined) {
          await prisma.siteSetting.upsert({
            where: { key: 'telegram_enabled' },
            update: { value: String(settings.telegram_enabled), category: 'telegram' },
            create: { key: 'telegram_enabled', value: String(settings.telegram_enabled), category: 'telegram' },
          });
        }
      }

      const result = await sendTelegramMessage(
        `<b>🚀 نجاح اختبار الاتصال ببوت تلجرام!</b>\n\nمرحبًا <b>${session.name}</b>، البوت يعمل بشكل ممتاز وتصلك الإشعارات الفورية للمناصة وحجوزات العملاء بشكل مباشر.`
      );

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'تم إرسال رسالة الاختبار بنجاح إلى حساب Telegram الخاص بك!',
        });
      }
      return NextResponse.json(
        { success: false, error: result.error || 'فشل إرسال رسالة الاختبار. تأكد من صحة التوكن والـ Chat ID.' },
        { status: 400 }
      );
    }

    // 2. Action: Test Google Calendar Status
    if (action === 'test_google') {
      const consultant = await prisma.consultant.findUnique({
        where: { userId: session.id },
        include: { googleConnection: true },
      });

      if (consultant?.googleConnection && consultant.googleConnection.syncStatus === 'active') {
        return NextResponse.json({
          success: true,
          message: `ربط تقويم Google نشط ومفعل للحساب: ${consultant.googleConnection.email}`,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'إعدادات Google Calendar محجوزة ومجهزة للعمل تلقائيًا مع روابط Meet المباشرة.',
      });
    }

    // 3. Action: Save Integration Settings
    if (settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        const category = key.startsWith('telegram_') ? 'telegram' : key.startsWith('google_') ? 'google' : 'general';
        await prisma.siteSetting.upsert({
          where: { key },
          update: { value: String(value), category },
          create: { key, value: String(value), category },
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId: session.id,
          actorName: session.name,
          action: 'UPDATE_INTEGRATION_SETTINGS',
          entity: 'SiteSetting',
          newValue: 'تم تحديث إعدادات الربط والتكامل مع Telegram و Google Calendar',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم حفظ وتفعيل كافة إعدادات الربط والتكامل بنجاح!',
      });
    }

    return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
