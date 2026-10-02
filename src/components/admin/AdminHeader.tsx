'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, Search, Globe, User, Check, ExternalLink } from 'lucide-react';

interface AdminHeaderProps {
  userName: string;
  userEmail: string;
  unreadNotifications: number;
}

export function AdminHeader({ userName, userEmail, unreadNotifications }: AdminHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between z-30 sticky top-0">
      {/* Search / Status */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 hidden sm:inline">نظام إدارة الاستشارات — أ. علي هشام</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* View public site */}
        <Link
          href="/"
          target="_blank"
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="معاينة الموقع العام"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">الموقع العام</span>
        </Link>

        {/* Notifications Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 relative transition-colors"
            title="الإشعارات"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 text-xs z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="font-bold text-white">مركز الإشعارات</span>
                <span className="text-[10px] text-slate-400">{unreadNotifications} غير مقروء</span>
              </div>
              <div className="text-center py-6 text-slate-500">
                لا توجد إشعارات جديدة بانتظار اتخاذ إجراء.
              </div>
              <div className="pt-2 border-t border-slate-800 text-center">
                <Link
                  href="/admin/bookings"
                  onClick={() => setShowNotifications(false)}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px]"
                >
                  عرض جميع الحجوزات والأنشطة
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
