import React from 'react';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { Users, Mail, Phone, MapPin, DollarSign, Calendar, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      bookings: {
        include: {
          payment: true,
          service: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">إدارة العملاء (Customer CRM)</h1>
          <p className="text-xs text-slate-400 mt-1">سجل العملاء، إجمالي الإنفاق، وتاريخ الاستشارات المحجوزة.</p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          إجمالي العملاء: {customers.length}
        </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 pr-2">الاسم الكامل</th>
                <th className="pb-3 px-2">البريد الإلكتروني</th>
                <th className="pb-3 px-2">WhatsApp</th>
                <th className="pb-3 px-2">الدولة</th>
                <th className="pb-3 px-2">عدد الحجوزات</th>
                <th className="pb-3 px-2">إجمالي المدفوع</th>
                <th className="pb-3 px-2">تاريخ التسجيل</th>
                <th className="pb-3 pl-2 text-left">التواصل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                    لا يوجد عملاء مسجلين حتى الآن.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const confirmedPayments = c.bookings
                    .filter((b) => b.payment?.status === 'confirmed')
                    .reduce((acc, b) => acc + (b.payment?.amount || 0), 0);

                  return (
                    <tr key={c.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 pr-2 font-bold text-white">
                        {c.fullName}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-slate-300 dir-ltr text-right">
                        {c.email}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-emerald-400 dir-ltr text-right">
                        <a
                          href={`https://wa.me/${c.whatsappPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1.5 justify-end"
                        >
                          <span>{c.whatsappPhone}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3.5 px-2 text-slate-300">
                        {c.country}
                      </td>
                      <td className="py-3.5 px-2 font-bold text-white font-mono">
                        {c.bookings.length}
                      </td>
                      <td className="py-3.5 px-2 font-black text-emerald-400 font-mono">
                        ${confirmedPayments}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-[11px] text-slate-400">
                        {format(new Date(c.createdAt), 'yyyy-MM-dd')}
                      </td>
                      <td className="py-3.5 pl-2 text-left">
                        <Link
                          href={`/admin/bookings?search=${encodeURIComponent(c.email)}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                        >
                          سجل الحجوزات
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
