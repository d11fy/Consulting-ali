import React from 'react';
import prisma from '@/lib/db/prisma';
import { format } from 'date-fns';
import { Shield, User, Clock, Terminal } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">سجل الرقابة والعمليات الحساسة (Audit Logs)</h1>
          <p className="text-xs text-slate-400 mt-1">
            توثيق كامل لكل الإجراءات الإدارية، تأكيد الدفع، تنزيل الوثائق، وتغييرات النظام.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 pr-2">التاريخ والوقت</th>
                <th className="pb-3 px-2">المنفذ (Actor)</th>
                <th className="pb-3 px-2">العملية (Action)</th>
                <th className="pb-3 px-2">الكيان (Entity)</th>
                <th className="pb-3 px-2">التفاصيل والتغييرات</th>
                <th className="pb-3 pl-2 text-left">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-sans text-xs">
                    لا توجد سجلات رقابية بعد.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 pr-2 text-[11px] text-slate-400 whitespace-nowrap">
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="py-3 px-2 font-sans font-semibold text-slate-200">
                      {log.actorName || 'نظام / عميل'}
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-300">
                      {log.entity}
                    </td>
                    <td className="py-3 px-2 text-slate-400 text-[11px] max-w-xs truncate">
                      {log.newValue || log.oldValue || '-'}
                    </td>
                    <td className="py-3 pl-2 text-left text-slate-500 text-[10px]">
                      {log.ipAddress || '127.0.0.1'}
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
