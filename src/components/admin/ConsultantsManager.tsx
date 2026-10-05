'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  X,
  Save,
  Tag,
  Globe,
  Clock,
  Mail,
  Phone,
  User,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

export interface ConsultantAdminData {
  id: string;
  slug?: string | null;
  userId: string;
  title: string;
  initials?: string | null;
  shortBio?: string | null;
  bio: string;
  tags: string[];
  languages: string[];
  yearsOfExperience: number;
  isActive: boolean;
  telegramChatId?: string | null;
  user: {
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  googleConnection?: {
    syncStatus: string;
  } | null;
  bookings: { id: string }[];
}

interface ConsultantsManagerProps {
  initialConsultants: ConsultantAdminData[];
}

export function ConsultantsManager({ initialConsultants }: ConsultantsManagerProps) {
  const [consultants, setConsultants] = useState<ConsultantAdminData[]>(initialConsultants);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [initials, setInitials] = useState('');
  const [shortBio, setShortBio] = useState('');
  const [bio, setBio] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(2);
  const [languagesInput, setLanguagesInput] = useState('العربية، الإنجليزية');
  const [tagsInput, setTagsInput] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/consultants/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAvatarUrl(data.url);
      } else {
        setErrorMsg(data.error || 'فشل رفع الصورة');
      }
    } catch {
      setErrorMsg('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setAvatarUrl('');
    setTitle('');
    setSlug('');
    setInitials('');
    setShortBio('');
    setBio('');
    setYearsOfExperience(2);
    setLanguagesInput('العربية، الإنجليزية');
    setTagsInput('');
    setTelegramChatId('');
    setIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: ConsultantAdminData) => {
    setEditingId(c.id);
    setName(c.user.name);
    setEmail(c.user.email);
    setPassword('');
    setPhone(c.user.phone || '');
    setAvatarUrl(c.user.avatarUrl || '');
    setTitle(c.title);
    setSlug(c.slug || '');
    setInitials(c.initials || '');
    setShortBio(c.shortBio || '');
    setBio(c.bio);
    setYearsOfExperience(c.yearsOfExperience);
    setLanguagesInput(c.languages.join('، '));
    setTagsInput(c.tags.join('، '));
    setTelegramChatId(c.telegramChatId || '');
    setIsActive(c.isActive);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const languages = languagesInput.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
    const tags = tagsInput.split(/[,،]/).map((s) => s.trim()).filter(Boolean);

    const payload = {
      name,
      email,
      password: password || undefined,
      phone: phone || null,
      avatarUrl: avatarUrl || null,
      title,
      slug: slug || name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
      initials: initials || null,
      shortBio: shortBio || null,
      bio,
      yearsOfExperience: Number(yearsOfExperience),
      languages,
      tags,
      telegramChatId: telegramChatId || null,
      isActive,
    };

    try {
      const url = editingId ? `/api/admin/consultants/${editingId}` : '/api/admin/consultants';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (editingId) {
          setConsultants((prev) =>
            prev.map((c) => (c.id === editingId ? { ...c, ...data.consultant } : c))
          );
        } else {
          setConsultants((prev) => [...prev, data.consultant]);
        }
        setIsModalOpen(false);
      } else {
        setErrorMsg(data.error || 'حدث خطأ أثناء حفظ البيانات');
      }
    } catch {
      setErrorMsg('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (c: ConsultantAdminData) => {
    try {
      const res = await fetch(`/api/admin/consultants/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConsultants((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, isActive: !c.isActive } : item))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            إدارة فريق المستشارين
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إضافة مستشارين جدد، تعديل بياناتهم والنبذة، التخصصات، وحالة التوفر.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مستشار جديد</span>
        </button>
      </div>

      {/* Consultants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consultants.map((c) => {
          const displayInitials = c.initials || c.user.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
          return (
            <div
              key={c.id}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl relative"
            >
              <div>
                {/* Status bar */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    onClick={() => toggleStatus(c)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                      c.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                    }`}
                    title="انقر لتغيير حالة المستشار"
                  >
                    {c.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{c.isActive ? 'متاح' : 'غير متاح'}</span>
                  </span>

                  <span className="text-[10px] text-slate-500 font-mono">
                    /{c.slug || c.id}
                  </span>
                </div>

                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-4">
                  {c.user.avatarUrl ? (
                    <img
                      src={c.user.avatarUrl}
                      alt={c.user.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 select-none">
                      {displayInitials}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-white truncate">{c.user.name}</h3>
                    <p className="text-xs text-emerald-400 mt-0.5 line-clamp-1">{c.title}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.user.email}</p>
                  </div>
                </div>

                {/* Short Bio */}
                <p className="text-slate-300 text-xs line-clamp-3 mb-4 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  {c.shortBio || c.bio}
                </p>

                {/* Details */}
                <div className="space-y-2 text-xs py-3 border-y border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">سنوات الخبرة:</span>
                    <span className="font-semibold text-slate-200">{c.yearsOfExperience} سنوات</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">اللغات:</span>
                    <span className="font-semibold text-slate-200">{c.languages.join('، ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الحجوزات المؤكدة:</span>
                    <span className="font-bold text-emerald-400 font-mono">{c.bookings?.length || 0}</span>
                  </div>
                </div>

                {/* Tags */}
                {c.tags && c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(c)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تعديل</span>
                </button>

                <Link
                  href={`/consultants/${c.slug || c.id}`}
                  target="_blank"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                  title="معاينة الملف العام"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-extrabold text-white">
                {editingId ? 'تعديل بيانات المستشار' : 'إضافة مستشار جديد'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/30 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    اسم المستشار *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="د. علاء الدين الزطمة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alaa@alihisham.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-emerald-500 dir-ltr text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    كلمة المرور {!editingId && '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingId ? 'اترك فارغًا لإبقاء الحالية' : 'Consultant@123456'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-emerald-500 dir-ltr text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+970599..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-emerald-500 dir-ltr text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    المسمى الوظيفي / التخصص *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مستشار المنح والقبولات واختبارات اللغة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    الأحرف المختصرة / Avatar
                  </label>
                  <input
                    type="text"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value)}
                    placeholder="دع"
                    maxLength={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-emerald-500 text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    الرابط المخصص (Slug)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="alaa-alzatma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-emerald-500 dir-ltr text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    معرف تيليجرام لتنبيهات المواعيد (Telegram Chat ID)
                  </label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="123456789 (اختياري)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-emerald-500 dir-ltr text-left font-mono"
                  />
                </div>
              </div>

              {/* Consultant Avatar & Image Upload Section */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>صورة المستشار الشخصية</span>
                  </label>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    المقاس المناسب: 400 × 400 بكسل (مربع 1:1)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Preview / Avatar Initials */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="صورة المستشار"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-500 font-bold text-lg">
                        {initials || name?.slice(0, 2) || 'صورة'}
                      </div>
                    )}
                  </div>

                  {/* Upload Controls & URL Input */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>جاري رفع الصورة...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>اختر وصوّر / ارفع صورة</span>
                          </>
                        )}
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 text-xs transition-colors"
                        >
                          إزالة الصورة
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="أو أدخل رابط الصورة مباشرة (URL)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:border-emerald-500 dir-ltr text-left"
                    />

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      💡 <strong>تنبيه مقاس الصورة:</strong> يفضل استخدام صورة أبعادها <strong>400 × 400 بكسل</strong> (بنسبة 1:1) بحد أقصى 5 ميغابايت (JPG/PNG/WebP) لكي تظهر الصورة بشكل متناسق تماماً في كروت المستشارين وصفحة الحجز.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    سنوات الخبرة *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={50}
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    اللغات (مفصولة بفواصل)
                  </label>
                  <input
                    type="text"
                    value={languagesInput}
                    onChange={(e) => setLanguagesInput(e.target.value)}
                    placeholder="العربية، الإنجليزية"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الوسوم / التخصصات (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="المنح الدراسية، القبولات الجامعية، التحضير لـ IELTS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  النبذة المختصرة (تظهر في البطاقات) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value)}
                  placeholder="محاضر جامعي ومترجم معتمد بخبرة تزيد عن 10 سنوات..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  النبذة الكاملة (تظهر في صفحة الملف) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="النبذة التفصيلية الكاملة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-200 cursor-pointer">
                  المستشار متاح ويظهر للعملاء في المنصة والنظام
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>حفظ البيانات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
