'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Zap, Keyboard, CheckCircle2, XCircle, Clock, Search, ArrowRight, User
} from 'lucide-react';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SuperEditPage() {
  const queryClient = useQueryClient();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-super-edit-orders'],
    queryFn: async () => {
      const res: any = await api.get('/admin/orders?status=pending,processing&per_page=50');
      return res?.data?.data || res?.data || [];
    }
  });

  const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.data || []);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res: any = await api.put(`/admin/orders/${id}/status`, { status });
      return res.data;
    },
    onSuccess: (data, variables) => {
      const statusText = variables.status === 'confirmed' ? 'Confirmed' : 'Cancelled';
      toast.success(`Order ${statusText}`, { position: 'bottom-right' });
      queryClient.setQueryData(['admin-super-edit-orders'], (oldData: any) => {
        if (!oldData) return oldData;
        const arr = Array.isArray(oldData) ? oldData : (oldData.data || []);
        const filtered = arr.filter((o: any) => o.id !== variables.id);
        return Array.isArray(oldData) ? filtered : { ...oldData, data: filtered };
      });
      // Selected index stays same, effectively moving to next
    },
    onError: () => {
      toast.error('Failed to update order');
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (orders.length === 0 || updateStatusMutation.isPending) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < orders.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const currentOrder = orders[selectedIndex];
        if (currentOrder) {
          updateStatusMutation.mutate({ id: currentOrder.id, status: 'confirmed' });
        }
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        const currentOrder = orders[selectedIndex];
        if (currentOrder) {
          if (confirm(`Cancel order #${currentOrder.order_number}?`)) {
            updateStatusMutation.mutate({ id: currentOrder.id, status: 'cancelled' });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orders, selectedIndex, updateStatusMutation]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-2 border-violet-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-violet-600 font-black">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">SuperEdit Mode</h1>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
              <Keyboard className="w-4 h-4" /> Keyboard-optimized rapid order confirmation
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-xs font-bold text-muted-foreground bg-background/50 p-3 rounded-2xl border border-border">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted rounded border border-border">↑</kbd>
            <kbd className="px-2 py-1 bg-muted rounded border border-border">↓</kbd> Navigate
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-primary/20 text-primary rounded border border-primary/30">Enter</kbd> Confirm
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-rose-500/20 text-rose-600 rounded border border-rose-500/30">C</kbd> Cancel
          </div>
        </div>
      </div>

      <div className="clay-card rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground font-bold animate-pulse">Loading queue...</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
            <h3 className="text-xl font-black text-foreground">Zero Inbox!</h3>
            <p className="text-sm text-muted-foreground mt-2">All pending orders have been processed.</p>
            <Link href="/admin/orders" className="mt-6 neu-btn px-6 py-2 rounded-xl font-bold">Back to Orders</Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order: any, index: number) => {
              const isSelected = index === selectedIndex;
              return (
                <div 
                  key={order.id} 
                  className={`p-4 md:p-6 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isSelected 
                      ? 'bg-violet-500/10 border-l-4 border-l-violet-500' 
                      : 'hover:bg-muted/30 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                      isSelected ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-foreground">{order.order_number}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-700">
                          {order.fulfillment_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-primary">
                          <User className="w-3.5 h-3.5" /> {order.customer_name}
                        </span>
                        <span>•</span>
                        <span className="font-mono">{order.customer_phone}</span>
                      </div>
                      <div className="mt-2 text-xs font-medium max-w-xl text-muted-foreground">
                        {order.shipping_address}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-6 flex-1">
                    <div className="text-right">
                      <div className="text-xs font-bold text-muted-foreground">Payable Amount</div>
                      <div className="text-xl font-black text-primary">{formatBDT(order.total_payable)}</div>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <div className="text-xs font-bold text-muted-foreground">Items</div>
                      <div className="font-bold text-foreground">
                        {order.items?.length || 0} items ({order.items?.reduce((a:any,b:any) => a+b.quantity, 0)} qty)
                      </div>
                    </div>
                    {isSelected && (
                      <div className="hidden md:flex flex-col gap-2">
                        <button 
                          onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'confirmed' })}
                          className="px-4 py-1.5 bg-primary hover:bg-primary text-white rounded-lg text-xs font-black transition-colors"
                        >
                          Confirm (Enter)
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Cancel order?')) updateStatusMutation.mutate({ id: order.id, status: 'cancelled' });
                          }}
                          className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-black transition-colors"
                        >
                          Cancel (C)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
