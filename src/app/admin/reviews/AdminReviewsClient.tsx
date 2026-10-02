'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, CheckCircle2, EyeOff, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AdminReviewsClientProps {
  initialReviews: any[];
}

export function AdminReviewsClient({ initialReviews }: AdminReviewsClientProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 pr-2">العميل</th>
              <th className="pb-3 px-2">التقييم</th>
              <th className="pb-3 px-2">التعليق والملاحظات</th>
              <th className="pb-3 px-2">الاستشارة</th>
              <th className="pb-3 px-2">الحالة</th>
              <th className="pb-3 pl-2 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  لا توجد تقييمات مسجلة حتى الآن.
                </td>
              </tr>
            ) : (
              reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 pr-2 font-bold text-white whitespace-nowrap">
                    {rev.customerName}
                  </td>
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-2 text-slate-300 max-w-sm">
                    {rev.comment || <span className="text-slate-500">بدون تعليق مكتوب</span>}
                  </td>
                  <td className="py-3.5 px-2 text-slate-400 whitespace-nowrap">
                    {rev.booking?.service?.nameAr}
                  </td>
                  <td className="py-3.5 px-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        rev.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : rev.status === 'hidden'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {rev.status === 'approved'
                        ? 'معتمد وعلني'
                        : rev.status === 'hidden'
                        ? 'مخفي'
                        : 'بانتظار الموافقة'}
                    </span>
                  </td>
                  <td className="py-3.5 pl-2 text-left whitespace-nowrap">
                    <div className="flex items-center gap-2 justify-end">
                      {rev.status !== 'approved' && (
                        <button
                          type="button"
                          disabled={actionLoading === rev.id}
                          onClick={() => updateStatus(rev.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] transition-colors"
                        >
                          اعتماد
                        </button>
                      )}
                      {rev.status !== 'hidden' && (
                        <button
                          type="button"
                          disabled={actionLoading === rev.id}
                          onClick={() => updateStatus(rev.id, 'hidden')}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-[11px] transition-colors"
                        >
                          إخفاء
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
