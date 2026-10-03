'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  ArrowLeft, FileText, CheckCircle2, AlertTriangle, Wallet,
  Calendar, Info, Download, Layers
} from 'lucide-react';
import { formatBDT } from '@/utils/currency';
import Link from 'next/link';

export default function ReconciliationDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: settlement, isLoading } = useQuery({
    queryKey: ['admin-reconciliation-detail', id],
    queryFn: async () => {
      const res: any = await api.get(`/admin/courier-reconciliations/${id}`);
      return res?.data?.data || res?.data || null;
    }
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center clay-card rounded-3xl animate-pulse">
        Loading reconciliation report...
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="p-12 text-center clay-card rounded-3xl">
        <h2 className="text-xl font-black text-foreground">Report Not Found</h2>
        <Link href="/admin/settlements" className="mt-4 text-primary font-bold hover:underline inline-block">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/settlements" className="p-3 neu-btn rounded-2xl text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Settlement Report: {settlement.batch_id}
            </h1>
            <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-2">
              <span>{settlement.courier_name}</span>
              <span>•</span>
              <span>Processed {new Date(settlement.created_at).toLocaleString('en-GB')}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="clay-card p-6 rounded-3xl bg-primary/10/50 dark:bg-primary/10/20 border-2 border-primary/30 dark:border-primary/20 text-center">
          <div className="w-10 h-10 neu-inset rounded-full mx-auto flex items-center justify-center text-primary mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-primary dark:text-primary">Total Settled</h3>
          <p className="text-2xl font-black text-primary dark:text-primary mt-1">
            {formatBDT(settlement.total_settled_amount || 0)}
          </p>
        </div>
        
        <div className="clay-card p-6 rounded-3xl text-center">
          <div className="w-10 h-10 neu-inset rounded-full mx-auto flex items-center justify-center text-primary mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-muted-foreground">Orders Matched</h3>
          <p className="text-2xl font-black text-foreground mt-1">
            {settlement.items_count || 0}
          </p>
        </div>

        <div className="clay-card p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900 text-center">
          <div className="w-10 h-10 neu-inset rounded-full mx-auto flex items-center justify-center text-amber-500 mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400">Discrepancies</h3>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-500 mt-1">
            {settlement.discrepancies_count || 0}
          </p>
        </div>
      </div>

      <div className="clay-card rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>Matched Consignments</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold">Consignment / Order</th>
                <th className="px-6 py-4 font-bold text-right">System Expected</th>
                <th className="px-6 py-4 font-bold text-right">Courier Collected</th>
                <th className="px-6 py-4 font-bold text-right">Courier Charge</th>
                <th className="px-6 py-4 font-bold text-right">Paid to Bank</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {settlement.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">
                      {item.tracking_code}
                    </div>
                    {item.order?.order_number && (
                      <Link href={`/admin/orders/${item.order.id}`} className="text-[10px] font-mono text-primary hover:underline">
                        Order #{item.order.order_number}
                      </Link>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {formatBDT(item.expected_amount || item.order?.total_payable || 0)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-primary">
                    {formatBDT(item.collected_amount)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-rose-500">
                    {formatBDT(item.cod_charge + item.delivery_charge)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-foreground">
                    {formatBDT(item.settled_amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.has_discrepancy ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-700 flex items-center justify-center gap-1 w-max mx-auto">
                        <AlertTriangle className="w-3 h-3" />
                        Discrepancy
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-primary/20 text-primary flex items-center justify-center gap-1 w-max mx-auto">
                        <CheckCircle2 className="w-3 h-3" />
                        Matched
                      </span>
                    )}
                    {item.discrepancy_note && (
                      <div className="text-[9px] text-amber-600 mt-1 max-w-[150px] mx-auto leading-tight truncate" title={item.discrepancy_note}>
                        {item.discrepancy_note}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
