'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  AlertTriangle, Search, Clock, Box, Truck, FileText, ArrowRight, ScanBarcode
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function MissingScansPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAuthStore(state => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const roles = user.roles?.map((r: string) => r.toLowerCase()) || [];
      const hasAccess = roles.some((r: string) => 
        r.includes('super_admin') || 
        r === 'admin' || 
        r.includes('order') || 
        r.includes('pack') || 
        r.includes('dispatch') || 
        r.includes('return')
      );
      if (!hasAccess) {
        toast.error('Unauthorized access. Redirecting to dashboard.');
        router.push('/admin');
      }
    }
  }, [user, router]);


  const { data, isLoading } = useQuery({
    queryKey: ['admin-missing-scans'],
    queryFn: async () => {
      const res: any = await api.get('/admin/orders/missing-scans');
      return res?.data?.data || res?.data || [];
    },
    refetchInterval: 3000 // Real-time polling sync (3 seconds) 
  });

  const orders = Array.isArray(data) ? data : [];
  
  const filteredOrders = orders.filter((order: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (order.order_number && order.order_number.toLowerCase().includes(q)) ||
      (order.consignment_id && order.consignment_id.toLowerCase().includes(q)) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
      (order.customer_phone && order.customer_phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-rose-500">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Missing Scans Alert</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Orders stuck in facility (missed Dispatch scan) or stuck at Courier (missed Return scan).
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search missing scans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="clay-card rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse font-semibold">Scanning facility...</div>
        ) : orders?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Box className="w-12 h-12 text-primary/50 mb-3" />
            <h3 className="text-lg font-black text-foreground">Facility is Clear</h3>
            <p className="text-sm text-muted-foreground mt-1">No orders are currently missing scans.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-medium">
            No matching orders found for "{searchQuery}"
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-bold">Order #</th>
                  <th className="px-6 py-4 font-bold">Source</th>
                  <th className="px-6 py-4 font-bold">Customer Info</th>
                  <th className="px-6 py-4 font-bold">Current Status</th>
                  <th className="px-6 py-4 font-bold">Missing Scan Type</th>
                  <th className="px-6 py-4 font-bold text-center">Days Stuck</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-foreground flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary" />
                        {order.order_number || `ORD-${order.id}`}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {order.consignment_id || 'No Tracking'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize px-2.5 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                        {order.source || 'Web'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{order.customer_name}</div>
                      <div className="text-[10px] text-muted-foreground">{order.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${order.missing_type.includes('Dispatch') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'}`}>
                        {order.missing_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-rose-600 font-bold">
                        <Clock className="w-4 h-4" />
                        {order.days_pending} Days
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/scan?barcode=${order.consignment_id || order.order_number}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-colors mr-2"
                      >
                        Scan Now <ScanBarcode className="w-3.5 h-3.5" />
                      </Link>
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-colors"
                      >
                        Inspect <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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
