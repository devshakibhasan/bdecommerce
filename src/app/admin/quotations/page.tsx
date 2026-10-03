'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FileText, Plus, Eye, Download, CheckCircle2 } from 'lucide-react';
import { formatBDT } from '@/utils/currency';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function QuotationsPage() {
  const queryClient = useQueryClient();

  const { data: quotationsData, isLoading } = useQuery({
    queryKey: ['admin-quotations'],
    queryFn: async () => {
      const res: any = await api.get('/admin/quotations');
      return res.data;
    }
  });

  const quotations = quotationsData?.data || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-blue-600 font-black">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Quotations</h1>
            <p className="text-xs text-slate-500 font-medium">Create and manage bulk order quotes for B2B customers.</p>
          </div>
        </div>
        <button className="neu-btn-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 opacity-50 cursor-not-allowed">
          <Plus className="w-4 h-4" /> Create Quotation (WIP)
        </button>
      </div>

      <div className="clay-card rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Loading quotations...</div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No Quotations</h3>
            <p className="text-sm text-slate-500">You haven't generated any wholesale quotations yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 tracking-wider font-black">
                <tr>
                  <th className="px-6 py-4">Quote #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4">Valid Until</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {quotations.map((q: any) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {q.quotation_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{q.customer_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{q.customer_phone || q.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-primary">
                      {formatBDT(q.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        q.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                        q.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        q.status === 'expired' ? 'bg-slate-100 text-slate-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                      <button className="p-2 neu-inset rounded-xl text-slate-500 hover:text-primary transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 neu-inset rounded-xl text-slate-500 hover:text-primary transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
