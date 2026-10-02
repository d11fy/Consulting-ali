import React from 'react';
import prisma from '@/lib/db/prisma';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSetting.findMany({
    orderBy: { category: 'asc' },
  });

  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">إعدادات المنصة والتكاملات</h1>
        <p className="text-xs text-slate-400 mt-1">
          إدارة قنوات التواصل، الربط مع Telegram، إعدادات البريد SMTP، والتنبيهات.
        </p>
      </div>

      <SettingsClient initialSettings={settingsMap} />
    </div>
  );
}
