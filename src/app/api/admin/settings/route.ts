import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { Role } from '@prisma/client';
import { sendTelegramMessage } from '@/lib/integrations/telegram/service';
import { sendEmail } from '@/lib/integrations/email/service';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
    const { settings, action, testEmail } = await request.json();

    // 1. If testing Telegram
    if (action === 'test_telegram') {
      const result = await sendTelegramMessage('اختبار اتصال منصة أ. علي هشام — بوت تيليغرام يعمل بنجاح! 🚀');
      if (result.success) {
        return NextResponse.json({ success: true, message: 'تم إرسال رسالة الاختبار إلى Telegram بنجاح!' });
      }
      return NextResponse.json({ success: false, error: result.error || 'فشل إرسال رسالة الاختبار' }, { status: 400 });
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
        await prisma.siteSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: {
            key,
            value: String(value),
            category: key.split('_')[0] || 'general',
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
