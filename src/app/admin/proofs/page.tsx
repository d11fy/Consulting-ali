import React from 'react';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileCheck, Download, ExternalLink, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentProofsPage() {
  const proofs = await prisma.paymentProof.findMany({
    include: {
      payment: {
        include: {
          booking: {
            include: { customer: true, service: true },
          },
          paymentMethod: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">إدارة إثباتات والتحويلات المالية</h1>
          <p className="text-xs text-slate-400 mt-1">مراجعة وتدقيق وصولات التحويل البنكي والعملات الرقمية والمحافظ.</p>
        </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 pr-2">تاريخ الدفع</th>
                <th className="pb-3 px-2">المرجع</th>
                <th className="pb-3 px-2">العميل</th>
                <th className="pb-3 px-2">اسم المحول</th>
                <th className="pb-3 px-2">وسيلة الدفع</th>
                <th className="pb-3 px-2">المبلغ</th>
                <th className="pb-3 px-2">الإيصال</th>
                <th className="pb-3 px-2">الحالة</th>
                <th className="pb-3 pl-2 text-left">فحص واعتماد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {proofs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 text-xs">
                    لا توجد إثباتات دفع مسجلة حاليًا.
                  </td>
                </tr>
              ) : (
                proofs.map((pf) => (
                  <tr key={pf.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 pr-2 font-mono text-[11px] text-slate-400">
                      {format(new Date(pf.paymentDate), 'yyyy-MM-dd')}
                    </td>
                    <td className="py-3.5 px-2 font-mono font-bold text-white">
                      {pf.payment.booking.bookingReference}
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-slate-200">
                      {pf.payment.booking.customer.fullName}
                    </td>
                    <td className="py-3.5 px-2 text-slate-300">
                      {pf.senderName}
                    </td>
                    <td className="py-3.5 px-2 text-slate-400">
                      {pf.payment.paymentMethod?.nameAr || 'تحويل يدوي'}
                    </td>
                    <td className="py-3.5 px-2 font-mono font-bold text-emerald-400">
                      {pf.amount} {pf.currency}
                    </td>
                    <td className="py-3.5 px-2">
                      <a
                        href={`/api/documents/download?receiptProofId=${pf.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </a>
                    </td>
                    <td className="py-3.5 px-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          pf.status === 'accepted'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : pf.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {pf.status === 'accepted' ? 'معتمد' : pf.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="py-3.5 pl-2 text-left">
                      <Link
                        href={`/admin/bookings/${pf.payment.booking.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-all"
                      >
                        فتح الحجز
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
