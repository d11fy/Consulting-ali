'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  Bot,
  Key,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  Video,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CalendarIntegrationsClientProps {
  initialSettings?: {
    telegram_bot_token: string;
    telegram_chat_id: string;
    telegram_enabled: boolean;
    google_client_id: string;
    google_client_secret: string;
    google_enabled: boolean;
  };
  googleConnectionStatus?: {
    isConnected: boolean;
    email?: string;
    lastSyncedAt?: Date | null;
  };
}

export default function CalendarIntegrationsClient({
  initialSettings,
  googleConnectionStatus,
}: CalendarIntegrationsClientProps) {
  const [activeTab, setActiveTab] = useState<'telegram' | 'google'>('telegram');

  // Form states
  const [telegramToken, setTelegramToken] = useState(initialSettings?.telegram_bot_token || '');
  const [telegramChatId, setTelegramChatId] = useState(initialSettings?.telegram_chat_id || '');
  const [telegramEnabled, setTelegramEnabled] = useState(initialSettings?.telegram_enabled ?? true);

  const [googleClientId, setGoogleClientId] = useState(initialSettings?.google_client_id || '');
  const [googleClientSecret, setGoogleClientSecret] = useState(initialSettings?.google_client_secret || '');
  const [googleEnabled, setGoogleEnabled] = useState(initialSettings?.google_enabled ?? true);

  // Statuses
  const [loading, setLoading] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingGoogle, setTestingGoogle] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Expandable help sections
  const [showTelegramGuide, setShowTelegramGuide] = useState(true);
  const [showGoogleGuide, setShowGoogleGuide] = useState(true);

  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/integrations/google/callback`
    : 'https://ali.masarat.study/api/integrations/google/callback';

  // Load latest settings on mount
  useEffect(() => {
    fetch('/api/consultant/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setTelegramToken(data.settings.telegram_bot_token || '');
          setTelegramChatId(data.settings.telegram_chat_id || '');
          setTelegramEnabled(data.settings.telegram_enabled ?? true);
          setGoogleClientId(data.settings.google_client_id || '');
          setGoogleClientSecret(data.settings.google_client_secret || '');
          setGoogleEnabled(data.settings.google_enabled ?? true);
        }
      })
      .catch(() => {});
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/consultant/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            telegram_bot_token: telegramToken,
            telegram_chat_id: telegramChatId,
            telegram_enabled: telegramEnabled,
            google_client_id: googleClientId,
            google_client_secret: googleClientSecret,
            google_enabled: googleEnabled,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'تم حفظ الإعدادات وتفعيل الربط بنجاح!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'حدث خطأ أثناء حفظ الإعدادات.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'فشل الاتصال بالخادم، يرجى المحاولة لاحقًا.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setMessage(null);

    try {
      const res = await fetch('/api/consultant/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_telegram',
          settings: {
            telegram_bot_token: telegramToken,
            telegram_chat_id: telegramChatId,
            telegram_enabled: telegramEnabled,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '✅ ' + data.message });
      } else {
        setMessage({ type: 'error', text: '❌ ' + (data.error || 'فشل إرسال رسالة الاختبار.') });
      }
    } catch {
      setMessage({ type: 'error', text: 'فشل الاتصال بـ Telegram API' });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleTestGoogle = async () => {
    setTestingGoogle(true);
    setMessage(null);

    try {
      const res = await fetch('/api/consultant/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_google',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '⚡ ' + data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل فحص حالة تقويم Google.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء فحص اتصال Google.' });
    } finally {
      setTestingGoogle(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مركز التحكم المباشر والربط التلقائي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              ربط Telegram Bot و Google Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              قم بإعداد وإدارة بوت الإشعارات الفورية على التلجرام، ومزامنة تقويم Google وروابط اجتماعات Google Meet لكل حجز تلقائيًا.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${telegramToken && telegramChatId ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">إشعارات التلجرام</div>
                <div className="text-xs font-bold text-white">
                  {telegramToken && telegramChatId ? 'مفعّلة ونشطة' : 'بحاجة لإعداد'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${googleConnectionStatus?.isConnected ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Google Calendar & Meet</div>
                <div className="text-xs font-bold text-white">
                  {googleConnectionStatus?.isConnected ? 'متصل ومزامن' : 'متاح للربط'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/60 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('telegram')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'telegram'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>إعدادات بوت التلجرام (Telegram Bot)</span>
        </button>

        <button
          onClick={() => setActiveTab('google')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'google'
              ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-slate-950 shadow-lg shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Google Calendar & Meet</span>
        </button>
      </div>

      {/* TAB 1: TELEGRAM BOT */}
      {activeTab === 'telegram' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-teal-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    إشعارات بوت تلجرام الفورية (Telegram Notifications)
                  </h3>
                  <p className="text-xs text-slate-400">
                    تلقّ تنبيهًا فوريًا عند حجز جلسة جديدة، أو رفع إشعار دفع جديد، أو استلام مواعيد مؤكدة.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramEnabled}
                    onChange={(e) => setTelegramEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="mr-3 text-xs font-bold text-slate-300">
                    {telegramEnabled ? 'مفعل' : 'معطل'}
                  </span>
                </label>
              </div>
            </div>

            {/* Inputs Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-sky-400" />
                  <span>توكن البوت (Telegram Bot Token)</span>
                </label>
                <input
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="مثال: 7123456789:AAFgXxxxxxxxxxxxxxx"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 font-mono text-left dir-ltr"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  احصل عليه من بوت <strong className="text-sky-400">@BotFather</strong> عبر الأمر <code className="bg-slate-800 px-1 py-0.5 rounded text-sky-300">/newbot</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>معرّف المحادثة (Telegram Chat ID)</span>
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="مثال: 987654321 أو -100123456789"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 font-mono text-left dir-ltr"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  احصل على معرّفك الخاص عبر بوت <strong className="text-sky-400">@userinfobot</strong> أو <strong className="text-sky-400">@GetIDBot</strong>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={testingTelegram || !telegramToken || !telegramChatId}
                className="px-5 py-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {testingTelegram ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال الإشعار التجريبي...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>اختبار إرسال إشعار تلجرام مباشر 🚀</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={loading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ إعدادات التلجرام</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* STEP BY STEP GUIDE: TELEGRAM */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <button
              onClick={() => setShowTelegramGuide(!showTelegramGuide)}
              className="w-full flex items-center justify-between text-right font-bold text-sm text-white hover:text-emerald-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>دليل وقائمة خطوات إنشاء وتفعيل بوت التلجرام (خطوة بخطوة)</span>
              </div>
              {showTelegramGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTelegramGuide && (
              <div className="space-y-4 pt-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1 */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sky-400">
                      <span className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-[11px]">1</span>
                      <span>افتح BotFather في التلجرام</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      ابحث في تطبيق تلجرام عن الحساب الرسمي <strong className="text-white font-mono">@BotFather</strong> وابدأ محادثة معه.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sky-400">
                      <span className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-[11px]">2</span>
                      <span>أرسل الأمر /newbot</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      أرسل كلمة <code className="bg-slate-800 px-1 py-0.5 rounded text-sky-300">/newbot</code> ثم اختر اسمًا للبوت (مثال: <strong className="text-white">مسارات استشارات</strong>)، ثم اختر اسم مستخدم ينتهي بكلمة bot (مثال: <strong className="text-white font-mono">masarat_consult_bot</strong>).
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sky-400">
                      <span className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-[11px]">3</span>
                      <span>احصل على API Token</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      سيقوم BotFather بإرسال رمز التوكن الخاص ببوتك (API Token). انسخه وضعه في حقل <strong>توكن البوت</strong> أعلاه.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sky-400">
                      <span className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-[11px]">4</span>
                      <span>احصل على Chat ID الخاص بك</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      ابحث في التلجرام عن البوت <strong className="text-white font-mono">@userinfobot</strong> وأرسل له أي رسالة، وسيرد عليك بالـ <strong className="text-emerald-400">Id</strong> الخاص بك. انسخ هذا الرقم وضعه في حقل <strong>Chat ID</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-sky-200 text-xs flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>ملاحظة هامة:</strong> تأكد من الضغط على زر <strong className="text-white">Start</strong> في البوت الجديد الذي أنشأته حتى يستطيع إرسال الرسائل الإشعارية إليك مباشرة فور حدوث أي حجز جديد!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE CALENDAR & MEET */}
      {activeTab === 'google' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-teal-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    تكامل وتقويم Google Calendar & Google Meet
                  </h3>
                  <p className="text-xs text-slate-400">
                    مزامنة المواعيد مع تقويمك الشخصي وإنشاء روابط اجتماع Google Meet معتمدة للعملاء تلقائيًا.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={googleEnabled}
                    onChange={(e) => setGoogleEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  <span className="mr-3 text-xs font-bold text-slate-300">
                    {googleEnabled ? 'مفعل' : 'معطل'}
                  </span>
                </label>
              </div>
            </div>

            {/* Features Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-blue-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>1. حجب المواعيد المشغولة</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  يقوم النظام تلقائيًا بقراءة المواعيد المشغولة في تقويم Google الشخصي وحجبها من أوقات الحجز لمنع أي تعارض.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Video className="w-4 h-4" />
                  <span>2. توليد رابط Google Meet</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  عند تأكيد الحجز واعتماد الإشعار يتم توليد رابط اجتماع خاص عبر Google Meet وإرساله فورًا إلى العميل والمستشار.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-teal-400 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4" />
                  <span>3. المزامنة عند إعادة الجدولة</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  عند تغيير أو تعديل أي موعد استشارة، يتم تحديث الموعد مباشرة في تقويم Google تلقائيًا دون تكرار الأحداث.
                </p>
              </div>
            </div>

            {/* OAuth Redirect URI Helper */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">رابط إعادة التوجيه المعتمد (Authorized Redirect URI)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(redirectUri, 'uri')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedText === 'uri' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 dir-ltr text-left overflow-x-auto">
                {redirectUri}
              </div>
            </div>

            {/* Google OAuth Credentials Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Google Client ID
                </label>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="xxxxxxxxx.apps.googleusercontent.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 font-mono text-left dir-ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Google Client Secret
                </label>
                <input
                  type="password"
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 font-mono text-left dir-ltr"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleTestGoogle}
                disabled={testingGoogle}
                className="px-5 py-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                {testingGoogle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري فحص الاتصال وتقويم Google...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>فحص اتصال وتقويم Google 🧪</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={loading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ إعدادات Google Calendar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* STEP BY STEP GUIDE: GOOGLE CALENDAR */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <button
              onClick={() => setShowGoogleGuide(!showGoogleGuide)}
              className="w-full flex items-center justify-between text-right font-bold text-sm text-white hover:text-blue-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span>دليل إعداد ربط Google Cloud Console والتراخيص (خطوة بخطوة)</span>
              </div>
              {showGoogleGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showGoogleGuide && (
              <div className="space-y-4 pt-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1 */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-blue-400">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[11px]">1</span>
                      <span>ادخل إلى Google Cloud Console</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      انتقل إلى <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a> وقم بإنشاء مشروع جديد باسم <strong className="text-white">Masarat Consultations</strong>.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-blue-400">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[11px]">2</span>
                      <span>تفعيل Google Calendar API</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      من قائمة <strong className="text-white">APIs & Services</strong> ابحث عن مكتبة <strong className="text-emerald-400">Google Calendar API</strong> واضغط على زر <strong className="text-white">Enable</strong>.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-blue-400">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[11px]">3</span>
                      <span>إنشاء OAuth 2.0 Credentials</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      من قسم Credentials اضغط <strong>Create Credentials</strong> واختر <strong>OAuth client ID</strong>، وحدد نوع التطبيق <strong>Web Application</strong>.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-blue-400">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[11px]">4</span>
                      <span>إضافة Authorized Redirect URI</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      في خانة <strong className="text-white">Authorized redirect URIs</strong> قم بإضافة الرابط: <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300 font-mono">{redirectUri}</code> ثم اضغط Save وانسخ Client ID و Client Secret إلى المنصة هنا.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>حماية وخصوصية:</strong> جميع بيانات الترخيص ومفاتيح الربط مشفرة بالكامل. يتم استخدام الربط فقط لقراءة الأوقات المشغولة وإنشاء روابط اجتماعات Google Meet الرسمية لعملائك.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
