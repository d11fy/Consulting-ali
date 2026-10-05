'use client';

import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Save,
  Users,
  AlertCircle,
  Hash,
} from 'lucide-react';

export interface SpecialtyConsultantItem {
  id: string;
  consultantId: string;
  consultant: {
    id: string;
    title: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface SpecialtyItem {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  icon?: string | null;
  orderIndex: number;
  isActive: boolean;
  consultants: SpecialtyConsultantItem[];
}

export interface ConsultantOption {
  id: string;
  title: string;
  name: string;
}

interface SpecialtiesManagerProps {
  initialSpecialties: SpecialtyItem[];
  allConsultants: ConsultantOption[];
}

export function SpecialtiesManager({ initialSpecialties, allConsultants }: SpecialtiesManagerProps) {
  const [specialties, setSpecialties] = useState<SpecialtyItem[]>(initialSpecialties);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [selectedConsultantIds, setSelectedConsultantIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingId(null);
    setNameAr('');
    setNameEn('');
    setSlug('');
    setDescription('');
    setOrderIndex(specialties.length);
    setIsActive(true);
    setSelectedConsultantIds([]);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sp: SpecialtyItem) => {
    setEditingId(sp.id);
    setNameAr(sp.nameAr);
    setNameEn(sp.nameEn || '');
    setSlug(sp.slug);
    setDescription(sp.description || '');
    setOrderIndex(sp.orderIndex);
    setIsActive(sp.isActive);
    setSelectedConsultantIds(sp.consultants.map((c) => c.consultant.id));
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleToggleConsultant = (consultantId: string) => {
    setSelectedConsultantIds((prev) =>
      prev.includes(consultantId)
        ? prev.filter((id) => id !== consultantId)
        : [...prev, consultantId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        nameAr,
        nameEn: nameEn || null,
        slug: slug || undefined,
        description: description || null,
        orderIndex,
        isActive,
        consultantIds: selectedConsultantIds,
      };

      const url = editingId
        ? `/api/admin/specialties/${editingId}`
        : '/api/admin/specialties';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشلت العملية، يرجى المحاولة لاحقاً');
      }

      if (editingId) {
        setSpecialties((prev) =>
          prev.map((s) => (s.id === editingId ? data.specialty : s))
        );
        setSuccessMsg('تم تحديث التخصص بنجاح!');
      } else {
        setSpecialties((prev) => [...prev, data.specialty]);
        setSuccessMsg('تمت إضافة التخصص بنجاح!');
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (sp: SpecialtyItem) => {
    const updatedStatus = !sp.isActive;
    try {
      // Optimistic update
      setSpecialties((prev) =>
        prev.map((item) => (item.id === sp.id ? { ...item, isActive: updatedStatus } : item))
      );

      const res = await fetch(`/api/admin/specialties/${sp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedStatus }),
      });

      if (!res.ok) {
        throw new Error('فشل تحديث الحالة');
      }
    } catch (err: any) {
      // Revert on error
      setSpecialties((prev) =>
        prev.map((item) => (item.id === sp.id ? { ...item, isActive: sp.isActive } : item))
      );
      alert('تعذر تحديث حالة التخصص: ' + err.message);
    }
  };

  const handleDelete = async (sp: SpecialtyItem) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المجال والتخصص: "${sp.nameAr}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/specialties/${sp.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'تعذر حذف التخصص');
      }

      setSpecialties((prev) => prev.filter((item) => item.id !== sp.id));
    } catch (err: any) {
      alert('خطأ أثناء الحذف: ' + err.message);
    }
  };

  const activeCount = specialties.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">إدارة مجالات وتخصصات الاستشارة</h1>
          </div>
          <p className="text-xs text-slate-400">
            إضافة، تعديل، وحذف مجالات الاستشارات المعتمدة وتعيين المستشارين المؤهلين لكل تخصص.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
            <span className="text-slate-400">النشطة:</span>
            <span className="font-bold text-emerald-400">{activeCount}</span>
            <span className="text-slate-500">/</span>
            <span className="font-bold text-white">{specialties.length}</span>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تخصص جديد</span>
          </button>
        </div>
      </div>

      {/* Grid of Specialties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specialties.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
            <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">لا توجد مجالات أو تخصصات مسجلة حالياً</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs hover:bg-emerald-500/20"
            >
              إضافة أول تخصص
            </button>
          </div>
        ) : (
          specialties.map((sp) => (
            <div
              key={sp.id}
              className={`bg-slate-900/80 backdrop-blur-xl border ${
                sp.isActive ? 'border-slate-800' : 'border-red-950/40 opacity-75'
              } rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {sp.nameAr}
                      {!sp.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          معطل
                        </span>
                      )}
                    </h3>
                    {sp.nameEn && (
                      <p className="text-xs text-slate-400 font-sans mt-0.5">{sp.nameEn}</p>
                    )}
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-slate-800/80 text-emerald-400/90 border border-slate-700/60">
                    {sp.slug}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[36px]">
                  {sp.description || 'لا يوجد وصف مخصص لهذا التخصص.'}
                </p>

                {/* Assigned Consultants */}
                <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      المستشارون المتاحون:
                    </span>
                    <span className="font-semibold text-slate-300">
                      {sp.consultants.length} مستشار
                    </span>
                  </div>

                  {sp.consultants.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                      {sp.consultants.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{c.consultant.user.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-400/80 italic py-1">
                      لم يتم ربط أي مستشار بهذا التخصص بعد.
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleActive(sp)}
                    title={sp.isActive ? 'تعطيل التخصص' : 'تفعيل التخصص'}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border transition-colors ${
                      sp.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {sp.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>نشط</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>معطل</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                    <Hash className="w-3 h-3" /> {sp.orderIndex}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(sp)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                    title="تعديل التخصص"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sp)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                    title="حذف التخصص"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingId ? 'تعديل بيانات التخصص والمجال' : 'إضافة مجال وتخصص استشاري جديد'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Name AR & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    اسم التخصص (بالعربية) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: الهجرة ولمّ الشمل"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                    placeholder="مثال: Immigration & Family"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Slug & Order Index */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    المعرف اللطيف (Slug)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="تلقائي إن ترك فارغاً"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-left dir-ltr"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    ترتيب الظهور
                  </label>
                  <input
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  وصف مختصر للمجال وما يغطيه
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف تفصيلي للخدمات والنطاقات الاستشارية المشمولة تحت هذا المجال..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Consultants Assignment */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-slate-300 font-semibold">
                  المستشارون المعتمدون لهذا المجال:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 rounded-2xl bg-slate-950/40 border border-slate-800">
                  {allConsultants.map((c) => {
                    const isChecked = selectedConsultantIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleConsultant(c.id)}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className="truncate">
                          {c.name} <span className="text-[10px] text-slate-400">({c.title})</span>
                        </span>
                      </label>
                    );
                  })}
                  {allConsultants.length === 0 && (
                    <div className="col-span-full text-slate-500 text-center py-2">
                      لا يوجد مستشارون مسجلون حالياً.
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>تفعيل هذا المجال للعملاء في المنصة</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingId ? 'حفظ التعديلات' : 'إضافة المجال'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
