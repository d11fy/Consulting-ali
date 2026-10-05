'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarDays,
  Users,
  FileText,
  Clock,
  LogOut,
  Calendar,
  X,
  Menu,
  CheckCircle2,
} from 'lucide-react';

interface ConsultantSidebarProps {
  userName: string;
  userTitle: string;
  userEmail: string;
}

export function ConsultantSidebar({ userName, userTitle, userEmail }: ConsultantSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: 'جدول مواعيدي القادمة', href: '/consultant', icon: CalendarDays },
    { name: 'استشاراتي والعملاء', href: '/consultant/bookings', icon: Users },
    { name: 'خوارط الطريق ($200)', href: '/consultant/roadmaps', icon: FileText },
    { name: 'أوقات العمل والإجازات', href: '/consultant/availability', icon: Clock },
    { name: 'ربط Google Calendar والتلجرام', href: '/consultant/calendar', icon: Calendar },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-6">
        {/* Brand */}
        <div className="px-3 py-2 flex items-center justify-between">
          <Link href="/consultant" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-slate-950 font-bold text-base shadow-md">
              {userName[0]}
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                {userName}
              </div>
              <div className="text-[10px] text-teal-400 font-semibold line-clamp-1">
                {userTitle}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              item.href === '/consultant'
                ? pathname === '/consultant'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-xs text-white">بوابة المستشار</span>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl bg-slate-800 text-slate-300">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-sm">
          <div className="w-64 h-full bg-slate-950 border-l border-slate-800">
            {navContent}
          </div>
        </div>
      )}

      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 bg-slate-950 border-l border-slate-900">
        {navContent}
      </aside>
    </>
  );
}
