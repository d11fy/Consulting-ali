import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await requireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
  } catch {
    redirect('/login?redirect=/admin');
  }

  // Get unread notifications count
  const unreadCount = await prisma.notification.count({
    where: {
      recipientType: 'admin',
      isRead: false,
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* Sidebar */}
      <AdminSidebar userRole={session.role} userName={session.name} userEmail={session.email} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader userName={session.name} userEmail={session.email} unreadNotifications={unreadCount} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
