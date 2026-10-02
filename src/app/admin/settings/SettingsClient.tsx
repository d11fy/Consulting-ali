'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  MessageCircle,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { TelegramIcon, InstagramIcon } from '@/components/shared/Icons';

interface SettingsClientProps {
  initialSettings: Record<string, string>;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();

  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل حفظ الإعدادات' });
      }
    } catch {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال بالخادم' });
    } finally {
      setSaving(false);
    }
  };

  const testTelegram = async () => {
    setTestingTelegram(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_telegram' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل اختبار Telegram' });
      }
    } catch {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء اختبار Telegram' });
    } finally {
      setTestingTelegram(false);
    }
  };

  const testSmtp = async () => {
    setTestingSmtp(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_smtp' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل اختبار SMTP' });
      }
    } catch {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء اختبار البريد' });
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/60 border-red-500/30 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Contact & Social Channels */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-400" />
          <span>قنوات التواصل وشبكات التواصل</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-2">رقم WhatsApp المعتمد</label>
            <input
              type="text"
              value={settings['whatsapp_number'] || ''}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">رسالة WhatsApp التلقائية</label>
            <input
              type="text"
              value={settings['whatsapp_default_message'] || ''}
              onChange={(e) => handleChange('whatsapp_default_message', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
              <InstagramIcon className="w-4 h-4 text-pink-400" />
              <span>Instagram أ. علي هشام</span>
            </label>
            <input
              type="text"
              value={settings['instagram_ali_hisham'] || ''}
              onChange={(e) => handleChange('instagram_ali_hisham', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
              <InstagramIcon className="w-4 h-4 text-purple-400" />
              <span>Instagram مسارات ستدي</span>
            </label>
            <input
              type="text"
              value={settings['instagram_masarat_study'] || ''}
              onChange={(e) => handleChange('instagram_masarat_study', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left"
            />
          </div>
        </div>
      </div>

      {/* 2. Telegram Bot Integration */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TelegramIcon className="w-5 h-5 text-blue-400" />
            <span>ربط بوت تيليغرام (Telegram Notifications)</span>
          </h3>
          <button
            type="button"
            disabled={testingTelegram}
            onClick={testTelegram}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {testingTelegram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>اختبار إرسال إشعار Telegram</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Bot Token</label>
            <input
              type="text"
              value={settings['telegram_bot_token'] || ''}
              onChange={(e) => handleChange('telegram_bot_token', e.target.value)}
              placeholder="123456789:ABCdefGhI..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">Chat ID</label>
            <input
              type="text"
              value={settings['telegram_chat_id'] || ''}
              onChange={(e) => handleChange('telegram_chat_id', e.target.value)}
              placeholder="-100123456789"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. SMTP Email Configuration */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-400" />
            <span>إعدادات خادم البريد (SMTP)</span>
          </h3>
          <button
            type="button"
            disabled={testingSmtp}
            onClick={testSmtp}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {testingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>إرسال بريد تجريبي (Test Email)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-2">SMTP Host</label>
            <input
              type="text"
              value={settings['smtp_host'] || ''}
              onChange={(e) => handleChange('smtp_host', e.target.value)}
              placeholder="smtp.example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">SMTP Port</label>
            <input
              type="text"
              value={settings['smtp_port'] || '587'}
              onChange={(e) => handleChange('smtp_port', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">From Email / Name</label>
            <input
              type="text"
              value={settings['smtp_from'] || ''}
              onChange={(e) => handleChange('smtp_from', e.target.value)}
              placeholder="أ. علي هشام <info@alihisham.com>"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">Username</label>
            <input
              type="text"
              value={settings['smtp_user'] || ''}
              onChange={(e) => handleChange('smtp_user', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">Password</label>
            <input
              type="password"
              value={settings['smtp_pass'] || ''}
              onChange={(e) => handleChange('smtp_pass', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left"
            />
          </div>
        </div>
      </div>

      {/* 4. Booking Rules & Legal Disclaimer */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>سياسات الحجز والتنبيه القانوني</span>
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              مهلة حجز الموعد وتجميده قبل رفع إثبات الدفع (بالدقائق)
            </label>
            <input
              type="number"
              value={settings['booking_expiration_minutes'] || '120'}
              onChange={(e) => handleChange('booking_expiration_minutes', e.target.value)}
              className="w-48 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              إذا لم يرفع العميل إشعار الدفع خلال هذه المدة يتم تحرير الموعد تلقائيًا.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              نص التنبيه وإخلاء المسؤولية القانونية (المعروض في الموقع والإيميلات)
            </label>
            <textarea
              rows={3}
              value={settings['legal_disclaimer'] || ''}
              onChange={(e) => handleChange('legal_disclaimer', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>حفظ وتحديث الإعدادات</span>
        </button>
      </div>
    </form>
  );
}
