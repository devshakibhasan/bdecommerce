'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ShieldAlert, AlertOctagon } from 'lucide-react';
import { formatBDT } from '@/utils/currency';

export default function BlockedOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders-blocked'],
    queryFn: async () => {
      const res: any = await api.get('/admin/orders?status=blocked');
      return res?.data?.data || [];
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <div className="clay-card p-6 rounded-3xl flex items-center gap-4 border-2 border-red-500/20 bg-red-50/10">
        <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-red-600 font-black">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Blocked Orders</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Orders placed by suspicious customers or manually blocked by fraud prevention.
          </p>
        </div>
      </div>

      <div className="clay-card rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">Loading blocked orders...</div>
        ) : data?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <AlertOctagon className="w-12 h-12 text-primary/50 mb-4" />
            <h3 className="text-xl font-black text-foreground">No Blocked Orders</h3>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold">Order Number</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Payable</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((order: any) => (
                <tr key={order.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4 font-bold text-foreground">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {order.customer_name} <br/>
                    <span className="text-[10px] font-mono">{order.customer_phone}</span>
                  </td>
                  <td className="px-6 py-4 font-black">
                    {formatBDT(order.total_payable)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200">
                      {order.fulfillment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
