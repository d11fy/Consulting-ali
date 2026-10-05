import React from 'react';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import CalendarIntegrationsClient from './CalendarIntegrationsClient';

export const dynamic = 'force-dynamic';

export default async function ConsultantCalendarPage() {
  const session = await requireAuth([Role.CONSULTANT, Role.SUPER_ADMIN, Role.ADMIN]);

  const consultant = await prisma.consultant.findUnique({
    where: { userId: session.id },
    include: {
      googleConnection: true,
    },
  });

  const settings = await prisma.siteSetting.findMany({
    where: {
      category: { in: ['telegram', 'google', 'general'] },
    },
  });

  const map = new Map(settings.map((s) => [s.key, s.value]));

  const initialSettings = {
    telegram_bot_token: map.get('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN || '',
    telegram_chat_id: map.get('telegram_chat_id') || process.env.TELEGRAM_CHAT_ID || '',
    telegram_enabled: map.get('telegram_enabled') !== 'false',
    google_client_id: map.get('google_client_id') || process.env.GOOGLE_CLIENT_ID || '',
    google_client_secret: map.get('google_client_secret') || process.env.GOOGLE_CLIENT_SECRET || '',
    google_enabled: map.get('google_enabled') !== 'false',
  };

  const connection = consultant?.googleConnection;

  return (
    <CalendarIntegrationsClient
      initialSettings={initialSettings}
      googleConnectionStatus={{
        isConnected: connection?.syncStatus === 'active',
        email: connection?.email,
        lastSyncedAt: connection?.lastSyncedAt,
      }}
    />
  );
}
