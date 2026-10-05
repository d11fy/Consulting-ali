'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Save,
  Building2,
  Wallet,
  AlertCircle,
  Globe,
} from 'lucide-react';

export interface PaymentMethodItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  instructionsAr: string;
  accountDetails: any;
  isActive: boolean;
  orderIndex: number;
  payments?: { id: string }[];
}

interface PaymentMethodsManagerProps {
  initialPaymentMethods: PaymentMethodItem[];
}

export function PaymentMethodsManager({ initialPaymentMethods }: PaymentMethodsManagerProps) {
  const [methods, setMethods] = useState<PaymentMethodItem[]>(initialPaymentMethods);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [code, setCode] = useState('');
  const [instructionsAr, setInstructionsAr] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swift, setSwift] = useState('');
  const [walletNumber, setWalletNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingId(null);
    setNameAr('');
    setNameEn('');
    setCode('');
    setInstructionsAr('');
    setBankName('');
    setAccountName('علي هشام');
    setAccountNumber('');
    setIban('');
    setSwift('');
    setWalletNumber('');
    setIsActive(true);
    setOrderIndex(methods.length);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pm: PaymentMethodItem) => {
    setEditingId(pm.id);
    setNameAr(pm.nameAr);
    setNameEn(pm.nameEn || '');
    setCode(pm.code);
    setInstructionsAr(pm.instructionsAr);
    const details = pm.accountDetails || {};
    setBankName(details.bankName || '');
    setAccountName(details.accountName || details.beneficiaryName || '');
    setAccountNumber(details.accountNumber || '');
    setIban(details.iban || '');
    setSwift(details.swift || '');
    setWalletNumber(details.walletNumber || details.phone || details.address || '');
    setIsActive(pm.isActive);
    setOrderIndex(pm.orderIndex);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const accountDetails: any = {};
    if (bankName) accountDetails.bankName = bankName.trim();
    if (accountName) accountDetails.accountName = accountName.trim();
    if (accountNumber) accountDetails.accountNumber = accountNumber.trim();
    if (iban) accountDetails.iban = iban.trim();
    if (swift) accountDetails.swift = swift.trim();
    if (walletNumber) accountDetails.walletNumber = walletNumber.trim();

    const payload = {
      nameAr,
      nameEn: nameEn || null,
      code: code || undefined,
      instructionsAr,
      accountDetails,
      isActive,
      orderIndex: Number(orderIndex),
    };

    try {
      const url = editingId ? `/api/admin/payment-methods/${editingId}` : '/api/admin/payment-methods';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (editingId) {
          setMethods((prev) =>
            prev.map((item) => (item.id === editingId ? { ...item, ...data.paymentMethod } : item))
          );
          setSuccessMsg('تم تحديث طريقة الدفع بنجاح.');
        } else {
          setMethods((prev) => [...prev, data.paymentMethod]);
          setSuccessMsg('تمت إضافة طريقة الدفع الجديدة بنجاح.');
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

  const toggleActive = async (pm: PaymentMethodItem) => {
    try {
      const res = await fetch(`/api/admin/payment-methods/${pm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !pm.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMethods((prev) =>
          prev.map((item) => (item.id === pm.id ? { ...item, isActive: !pm.isActive } : item))
        );
      }
    } catch (err) {
      console.error('Error toggling payment method status:', err);
    }
  };

  const handleDelete = async (pm: PaymentMethodItem) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف أو تعطيل طريقة الدفع "${pm.nameAr}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/payment-methods/${pm.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.paymentMethod) {
          setMethods((prev) =>
            prev.map((item) => (item.id === pm.id ? { ...item, isActive: false } : item))
          );
        } else {
          setMethods((prev) => prev.filter((item) => item.id !== pm.id));
        }
      } else {
        alert(data.error || 'فشل حذف طريقة الدفع');
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
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <span>إدارة طرق وحسابات الدفع المعتمدة</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إضافة حسابات بنكية، محافظ إلكترونية، USDT، أو حوالات دولية، وتعديل التعليمات والآيبان وتفعيل/تعطيل كل طريقة.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة طريقة دفع جديدة</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {methods.map((pm) => {
          const details = pm.accountDetails || {};
          return (
            <div
              key={pm.id}
              className={`rounded-3xl p-6 border flex flex-col justify-between transition-all ${
                !pm.isActive
                  ? 'bg-slate-950/60 border-slate-800/60 opacity-60'
                  : 'bg-slate-900/80 border-slate-800 shadow-xl'
              }`}
            >
              <div>
                {/* Status & Code */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                    {pm.code}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      pm.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {pm.isActive ? 'نشط' : 'معطل'}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-base font-extrabold text-white mb-1 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pm.nameAr}</span>
                </h3>
                {pm.nameEn && <div className="text-[11px] text-slate-500 mb-3">{pm.nameEn}</div>}

                {/* Instructions */}
                <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
                  {pm.instructionsAr}
                </p>

                {/* Account Details Box */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
                  {details.bankName && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">البنك / الجهة:</span>
                      <span className="text-slate-200 font-semibold">{details.bankName}</span>
                    </div>
                  )}
                  {details.accountName && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">اسم الحساب:</span>
                      <span className="text-slate-200 font-semibold">{details.accountName}</span>
                    </div>
                  )}
                  {details.accountNumber && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">رقم الحساب:</span>
                      <span className="text-slate-200 font-mono">{details.accountNumber}</span>
                    </div>
                  )}
                  {details.iban && (
                    <div className="flex flex-col text-[11px] pt-1 border-t border-slate-800/60">
                      <span className="text-slate-500">IBAN:</span>
                      <span className="text-emerald-400 font-mono text-[10px] break-all">{details.iban}</span>
                    </div>
                  )}
                  {details.walletNumber && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">المحفظة / العنوان:</span>
                      <span className="text-amber-400 font-mono text-[10px] break-all">{details.walletNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-800/80 mt-5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  الترتيب: {pm.orderIndex}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleActive(pm)}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      pm.isActive
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/30'
                    }`}
                    title={pm.isActive ? 'تعطيل طريقة الدفع' : 'تفعيل طريقة الدفع'}
                  >
                    {pm.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(pm)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تعديل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(pm)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/40 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                    title="حذف طريقة الدفع"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full my-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>{editingId ? 'تعديل طريقة الدفع والبيانات البنكية' : 'إضافة طريقة دفع جديدة'}</span>
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
                    اسم طريقة الدفع (عربي) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: بنك فلسطين (Bank of Palestine)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    الرمز التعريفي (Code) *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="bop أو palpay أو usdt"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    اسم البنك / الشبكة
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="بنك فلسطين / شبكة TRC20"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    اسم صاحب الحساب / المستفيد
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="علي هشام"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    رقم الحساب
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="1234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    رقم المحفظة / عنوان العملة المشفرة
                  </label>
                  <input
                    type="text"
                    value={walletNumber}
                    onChange={(e) => setWalletNumber(e.target.value)}
                    placeholder="رقم المحفظة أو عنوان المحفظة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    رقم الآيبان (IBAN) الدولي
                  </label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="PS00PALS000000000000000000000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 dir-ltr text-left font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  تعليمات التحويل للعميل *
                </label>
                <textarea
                  rows={3}
                  required
                  value={instructionsAr}
                  onChange={(e) => setInstructionsAr(e.target.value)}
                  placeholder="يرجى كتابة رقم الحجز في خانة الملاحظات عند التحويل، ثم رفع صورة الإيصال أو كشف التحويل..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span className="text-slate-300 font-semibold">طريقة دفع نشطة ومتاحة للعملاء</span>
                </label>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">ترتيب الظهور في الموقع</label>
                  <input
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
                  />
                </div>
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
                  <span>{editingId ? 'حفظ التعديلات' : 'إضافة طريقة الدفع'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
