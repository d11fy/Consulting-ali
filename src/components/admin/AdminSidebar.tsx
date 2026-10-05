'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Users,
  GraduationCap,
  Briefcase,
  Compass,
  Star,
  HelpCircle,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  FileCheck,
} from 'lucide-react';

interface AdminSidebarProps {
  userRole: string;
  userName: string;
  userEmail: string;
}

export function AdminSidebar({ userRole, userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: 'لوحة المؤشرات', href: '/admin', icon: LayoutDashboard },
    { name: 'إدارة الحجوزات', href: '/admin/bookings', icon: CalendarDays },
    { name: 'إثباتات الدفع', href: '/admin/proofs', icon: FileCheck },
    { name: 'إدارة العملاء (CRM)', href: '/admin/customers', icon: Users },
    { name: 'المستشارون', href: '/admin/consultants', icon: GraduationCap },
    { name: 'الخدمات والأسعار', href: '/admin/services', icon: Briefcase },
    { name: 'المجالات والتخصصات', href: '/admin/specialties', icon: Compass },
    { name: 'طرق الدفع', href: '/admin/payment-methods', icon: CreditCard },
    { name: 'التقييمات والآراء', href: '/admin/reviews', icon: Star },
    { name: 'الأسئلة الشائعة', href: '/admin/faqs', icon: HelpCircle },
    { name: 'سجل العمليات (Audit)', href: '/admin/audit-logs', icon: Shield },
    { name: 'الإعدادات والربط', href: '/admin/settings', icon: Settings },
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
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-base shadow-md">
              ع
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                أ. علي هشام
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">
                لوحة الإدارة العامة
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
              item.href === '/admin'
                ? pathname === '/admin'
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

      {/* User profile & logout */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center">
            {userName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{userName}</div>
            <div className="text-[10px] text-slate-400 truncate">{userRole}</div>
          </div>
        </div>

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
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
            ع
          </div>
          <span className="font-bold text-xs text-white">لوحة الإدارة</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-sm">
          <div className="w-64 h-full bg-slate-950 border-l border-slate-800">
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 bg-slate-950 border-l border-slate-900">
        {navContent}
      </aside>
    </>
  );
}
