import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { ConsultantSidebar } from '@/components/consultant/ConsultantSidebar';

export const dynamic = 'force-dynamic';

export default async function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await requireAuth([Role.CONSULTANT, Role.SUPER_ADMIN, Role.ADMIN]);
  } catch {
    redirect('/login?redirect=/consultant');
  }

  // Find consultant profile
  const consultant = await prisma.consultant.findUnique({
    where: { userId: session.id },
  });

  if (!consultant && session.role === Role.CONSULTANT) {
    redirect('/login');
  }

  const consultantName = session.name;
  const consultantTitle = consultant?.title || 'مستشار معتمد';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* Consultant Sidebar */}
      <ConsultantSidebar
        userName={consultantName}
        userTitle={consultantTitle}
        userEmail={session.email}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between z-30 sticky top-0">
          <div className="text-xs text-slate-400">
            بوابة المستشار — <span className="text-emerald-400 font-bold">{consultantName}</span>
          </div>
          <Link
            href="/"
            target="_blank"
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 transition-colors"
          >
            الموقع العام
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
