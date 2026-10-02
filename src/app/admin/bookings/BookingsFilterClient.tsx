'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';

interface BookingsFilterClientProps {
  consultants: { id: string; name: string }[];
  currentStatus: string;
  currentConsultant: string;
  currentSearch: string;
}

export function BookingsFilterClient({
  consultants,
  currentStatus,
  currentConsultant,
  currentSearch,
}: BookingsFilterClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState(currentSearch);
  const [status, setStatus] = useState(currentStatus);
  const [consultantId, setConsultantId] = useState(currentConsultant);

  const applyFilters = (newStatus?: string, newConsultant?: string) => {
    const params = new URLSearchParams();
    const st = newStatus !== undefined ? newStatus : status;
    const cons = newConsultant !== undefined ? newConsultant : consultantId;

    if (st && st !== 'all') params.set('status', st);
    if (cons && cons !== 'all') params.set('consultantId', cons);
    if (search.trim()) params.set('search', search.trim());

    router.push(`/admin/bookings?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setConsultantId('all');
    router.push('/admin/bookings');
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم، البريد، واتساب أو الرقم المرجعي..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
      </form>

      {/* Status Filter */}
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          applyFilters(e.target.value, undefined);
        }}
        className="w-full md:w-44 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
      >
        <option value="all">كافة الحالات</option>
        <option value="pending_payment">بانتظار الدفع</option>
        <option value="payment_uploaded">إشعار دفع مرفوع</option>
        <option value="payment_under_review">قيد المراجعة</option>
        <option value="confirmed">مؤكد</option>
        <option value="scheduled">مجدول</option>
        <option value="completed">مكتمل</option>
        <option value="cancelled">ملغي</option>
      </select>

      {/* Consultant Filter */}
      <select
        value={consultantId}
        onChange={(e) => {
          setConsultantId(e.target.value);
          applyFilters(undefined, e.target.value);
        }}
        className="w-full md:w-44 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
      >
        <option value="all">كافة المستشارين</option>
        {consultants.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Clear Button */}
      {(search || status !== 'all' || consultantId !== 'all') && (
        <button
          type="button"
          onClick={resetFilters}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="إعادة التعيين"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
