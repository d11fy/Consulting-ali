'use client';

import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Loader2,
  X,
  Save,
  Briefcase,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export interface ServiceItem {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  descriptionAr: string;
  durationMinutes: number;
  price: number;
  currency: string;
  isPopular: boolean;
  isComprehensive: boolean;
  features: string[];
  isActive: boolean;
  orderIndex: number;
  bookings?: { id: string }[];
}

interface ServicesManagerProps {
  initialServices: ServiceItem[];
}

export function ServicesManager({ initialServices }: ServicesManagerProps) {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState<number | string>(50);
  const [durationMinutes, setDurationMinutes] = useState<number | string>(45);
  const [descriptionAr, setDescriptionAr] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isComprehensive, setIsComprehensive] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingId(null);
    setNameAr('');
    setNameEn('');
    setSlug('');
    setPrice(50);
    setDurationMinutes(45);
    setDescriptionAr('');
    setFeaturesText('');
    setIsPopular(false);
    setIsComprehensive(false);
    setIsActive(true);
    setOrderIndex(services.length);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingId(service.id);
    setNameAr(service.nameAr);
    setNameEn(service.nameEn || '');
    setSlug(service.slug);
    setPrice(service.price);
    setDurationMinutes(service.durationMinutes);
    setDescriptionAr(service.descriptionAr);
    setFeaturesText(service.features.join('\n'));
    setIsPopular(service.isPopular);
    setIsComprehensive(service.isComprehensive);
    setIsActive(service.isActive);
    setOrderIndex(service.orderIndex);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      nameAr,
      nameEn: nameEn || null,
      slug: slug || undefined,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      descriptionAr,
      features,
      isPopular,
      isComprehensive,
      isActive,
      orderIndex: Number(orderIndex),
    };

    try {
      const url = editingId ? `/api/admin/services/${editingId}` : '/api/admin/services';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (editingId) {
          setServices((prev) =>
            prev.map((s) => (s.id === editingId ? { ...s, ...data.service } : s))
          );
          setSuccessMsg('تم تحديث الخدمة بنجاح.');
        } else {
          setServices((prev) => [...prev, data.service]);
          setSuccessMsg('تم إنشاء الخدمة الجديدة بنجاح.');
        }
        setIsModalOpen(false);
      } else {
        setErrorMsg(data.error || 'حدث خطأ أثناء حفظ الخدمة');
      }
    } catch {
      setErrorMsg('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (service: ServiceItem) => {
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, isActive: !service.isActive } : s))
        );
      }
    } catch (err) {
      console.error('Error toggling service status:', err);
    }
  };

  const handleDelete = async (service: ServiceItem) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف أو تعطيل خدمة "${service.nameAr}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.service) {
          // Deactivated
          setServices((prev) =>
            prev.map((s) => (s.id === service.id ? { ...s, isActive: false } : s))
          );
        } else {
          // Permanently deleted
          setServices((prev) => prev.filter((s) => s.id !== service.id));
        }
      } else {
        alert(data.error || 'فشل حذف الخدمة');
      }
    } catch {
      alert('فشل الاتصال بالخادم');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            <span>إدارة الخدمات والأسعار والباقات</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إضافة خدمات جديدة، تعديل الأسعار، المميزات، المدة الزمنية، وتفعيل/تعطيل الباقات على المنصة.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة باقة / خدمة جديدة</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => (
          <div
            key={s.id}
            className={`rounded-3xl p-6 border flex flex-col justify-between transition-all relative ${
              !s.isActive
                ? 'bg-slate-950/60 border-slate-800/60 opacity-60'
                : s.isComprehensive
                ? 'bg-gradient-to-b from-amber-950/20 to-slate-900/90 border-amber-500/40 shadow-xl'
                : s.isPopular
                ? 'bg-gradient-to-b from-emerald-950/20 to-slate-900/90 border-emerald-500/40 shadow-xl'
                : 'bg-slate-900/80 border-slate-800 shadow-lg'
            }`}
          >
            <div>
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {s.isComprehensive && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    خارطة طريق كاملة (Roadmap)
                  </span>
                )}
                {s.isPopular && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    الأكثر طلباً
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold mr-auto ${
                    s.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {s.isActive ? 'نشط' : 'معطل'}
                </span>
              </div>

              {/* Title & Duration */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-extrabold text-white">{s.nameAr}</h3>
                <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {s.durationMinutes} دقيقة
                </span>
              </div>

              {/* Price */}
              <div className="text-3xl font-black text-white mb-2">
                ${s.price}{' '}
                <span className="text-xs font-normal text-slate-400">{s.currency}</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {s.descriptionAr}
              </p>

              {/* Features List */}
              <div className="space-y-1.5 border-t border-slate-800/80 pt-3 text-xs">
                <div className="font-semibold text-slate-300 text-[11px] mb-1.5">
                  المميزات المشمولة:
                </div>
                {s.features.map((f, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800/80 mt-5 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 font-mono">
                {s.bookings ? `${s.bookings.length} حجز` : ''}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleActive(s)}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    s.isActive
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/30'
                  }`}
                  title={s.isActive ? 'تعطيل الخدمة' : 'تفعيل الخدمة'}
                >
                  {s.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(s)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تعديل</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(s)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/40 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                  title="حذف الخدمة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full my-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <span>{editingId ? 'تعديل الخدمة والأسعار' : 'إضافة خدمة استشارية جديدة'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    اسم الخدمة (عربي) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: الاستشارة المتخصصة والمباشرة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    الاسم بالإنجليزية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Specialized 1-on-1 Consultation"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    السعر ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="50"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    مدة الجلسة (بالدقائق) *
                  </label>
                  <input
                    type="number"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="45"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  الوصف العربي للخدمة *
                </label>
                <textarea
                  rows={3}
                  required
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder="جلسة زووم أو قوقل ميت مخصصة لدراسة ملفك وخياراتك والإجابة على استفساراتك..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  المميزات (ميزة واحدة في كل سطر)
                </label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder={`جلسة فيديو مباشرة عبر Google Meet\nمراجعة مسبقة للوثائق والملفات\nتسجيل الجلسة وإرسال التوصيات`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-emerald-500 leading-relaxed font-mono"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span className="text-slate-300 font-semibold">باقة شائعة / مميزة</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isComprehensive}
                    onChange={(e) => setIsComprehensive(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span className="text-slate-300 font-semibold">تتضمن خارطة طريق</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span className="text-slate-300 font-semibold">نشطة ومتاحة للحجز</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingId ? 'حفظ التعديلات' : 'إنشاء الباقة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
