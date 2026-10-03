'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Trash2, RotateCcw, AlertTriangle, ArrowLeft, RefreshCw, 
  Search, Eye, CheckCircle2, ShieldAlert, Package, Phone, 
  MapPin, Clock, Calendar, CheckSquare, Square, X, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatBDT } from '@/utils/currency';

export default function DeletedOrdersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previewOrder, setPreviewOrder] = useState<any | null>(null);
  const [confirmPermanentDeleteId, setConfirmPermanentDeleteId] = useState<number | null>(null);
  const [isConfirmEmptyTrashOpen, setIsConfirmEmptyTrashOpen] = useState(false);

  // 1. Fetch deleted orders
  const { data: orders = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-orders-deleted'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/orders/trashed/list?per_page=100');
        const items = Array.isArray(res?.data?.data) 
          ? res.data.data 
          : Array.isArray(res?.data?.items) 
            ? res.data.items 
            : Array.isArray(res?.data) 
              ? res.data 
              : Array.isArray(res) 
                ? res 
                : [];
        return items;
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load deleted orders');
        return [];
      }
    },
    refetchOnMount: 'always',
  });

  // 2. Restore Single Order Mutation
  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      const res: any = await api.post(`/admin/orders/${id}/restore`);
      return res?.data;
    },
    onSuccess: () => {
      toast.success('Order restored successfully! It is now visible in active orders.');
      queryClient.invalidateQueries({ queryKey: ['admin-orders-deleted'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedIds(prev => prev.filter(item => item !== previewOrder?.id));
      if (previewOrder) setPreviewOrder(null);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to restore order');
    }
  });

  // 3. Force Delete Single Order Mutation
  const forceDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res: any = await api.delete(`/admin/orders/${id}/force`);
      return res?.data;
    },
    onSuccess: () => {
      toast.success('Order permanently removed from database.');
      setConfirmPermanentDeleteId(null);
      if (previewOrder) setPreviewOrder(null);
      queryClient.invalidateQueries({ queryKey: ['admin-orders-deleted'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete order permanently');
    }
  });

  // 4. Bulk Restore Mutation
  const bulkRestoreMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res: any = await api.post('/admin/orders/trashed/bulk-restore', { ids });
      return res?.data;
    },
    onSuccess: () => {
      toast.success(`Successfully restored ${selectedIds.length} orders!`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-orders-deleted'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to restore selected orders');
    }
  });

  // 5. Empty Entire Trash Mutation
  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.delete('/admin/orders/trashed/empty');
      return res?.data;
    },
    onSuccess: () => {
      toast.success('Recycle bin has been completely emptied.');
      setIsConfirmEmptyTrashOpen(false);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-orders-deleted'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to empty recycle bin');
    }
  });

  // Filtered orders based on user search
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o: any) => {
      const num = (o.order_number || '').toLowerCase();
      const name = (o.customer_name || '').toLowerCase();
      const phone = (o.customer_phone || '').toLowerCase();
      const district = (o.district || '').toLowerCase();
      return num.includes(q) || name.includes(q) || phone.includes(q) || district.includes(q);
    });
  }, [orders, searchQuery]);

  // Total value in trash
  const totalTrashValue = useMemo(() => {
    return orders.reduce((acc: number, curr: any) => acc + (Number(curr.total_payable) || Number(curr.total_amount) || 0), 0);
  }, [orders]);

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o: any) => o.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner & Header */}
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 neu-inset rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 font-black shadow-inner">
            <Trash2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground tracking-tight">Deleted Orders Recycle Bin</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-xs">
                {orders.length} in trash
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Safely recover deleted orders or permanently wipe them. Restoring returns them to the active orders list immediately.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Link 
            href="/admin/orders" 
            className="neu-btn px-4 py-2.5 rounded-2xl text-xs font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Active Orders</span>
          </Link>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="neu-btn p-2.5 rounded-2xl text-foreground hover:text-primary transition-colors cursor-pointer"
            title="Refresh Trash"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-primary' : ''}`} />
          </button>

          {orders.length > 0 && (
            <button
              onClick={() => setIsConfirmEmptyTrashOpen(true)}
              className="px-4 py-2.5 rounded-2xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Bin</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clay-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground">Total Deleted Orders</p>
            <h3 className="text-2xl font-black text-foreground mt-1">{orders.length}</h3>
          </div>
          <div className="p-3 neu-inset rounded-xl text-rose-500">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>

        <div className="clay-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground">Total Recoverable Value</p>
            <h3 className="text-2xl font-black text-foreground mt-1">{formatBDT(totalTrashValue)}</h3>
          </div>
          <div className="p-3 neu-inset rounded-xl text-emerald-500">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="clay-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground">Selected for Action</p>
            <h3 className="text-2xl font-black text-primary mt-1">{selectedIds.length} orders</h3>
          </div>
          <div className="p-3 neu-inset rounded-xl text-primary">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Bulk Action Bar */}
      <div className="clay-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, Name, Phone..."
            className="w-full pl-9 pr-4 py-2.5 neu-input rounded-xl text-xs font-semibold focus:outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end animate-fadeIn">
            <span className="text-xs font-bold text-muted-foreground">
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => bulkRestoreMutation.mutate(selectedIds)}
              disabled={bulkRestoreMutation.isPending}
              className="neu-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{bulkRestoreMutation.isPending ? 'Restoring...' : 'Restore Selected'}</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="clay-card rounded-3xl overflow-hidden shadow-lg border border-border/50">
        {isLoading ? (
          <div className="p-16 text-center text-muted-foreground animate-pulse flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-bold">Scanning recycle bin for deleted orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 neu-inset rounded-3xl flex items-center justify-center text-muted-foreground/30 mb-4">
              <Trash2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-foreground">
              {searchQuery ? 'No matching deleted orders found' : 'Recycle Bin is Clean & Empty'}
            </h3>
            <p className="text-xs text-muted-foreground font-medium max-w-sm mt-1.5">
              {searchQuery 
                ? 'Try searching with a different order number, customer name, or phone number.'
                : 'Whenever an order is deleted from the orders dashboard, it will safely appear here for recovery or permanent wiping.'
              }
            </p>
            <Link
              href="/admin/orders"
              className="neu-btn px-6 py-2.5 rounded-2xl text-xs font-bold text-primary mt-6 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go to Active Orders</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b border-border/60">
                <tr>
                  <th className="px-5 py-4 w-12 text-center">
                    <button 
                      type="button" 
                      onClick={handleSelectAll} 
                      className="cursor-pointer text-muted-foreground hover:text-primary"
                    >
                      {selectedIds.length === filteredOrders.length ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-4 font-black">Order #</th>
                  <th className="px-5 py-4 font-black">Customer Details</th>
                  <th className="px-5 py-4 font-black">Line Items</th>
                  <th className="px-5 py-4 font-black">Total Payable</th>
                  <th className="px-5 py-4 font-black">Status Prior</th>
                  <th className="px-5 py-4 font-black">Deleted At</th>
                  <th className="px-5 py-4 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.map((order: any) => {
                  const isSelected = selectedIds.includes(order.id);
                  const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
                  const firstItem = order.items && order.items[0];

                  return (
                    <tr 
                      key={order.id} 
                      className={`transition-colors hover:bg-muted/30 ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(order.id)}
                          className="cursor-pointer text-muted-foreground hover:text-primary"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Order Number */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <button
                            onClick={() => setPreviewOrder(order)}
                            className="font-black text-foreground hover:text-primary transition-colors text-left font-mono text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span>{order.order_number}</span>
                            <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                          </button>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-xs">{order.customer_name}</span>
                          <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {order.customer_phone}
                          </span>
                          {order.district && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              {order.district} {order.thana ? `(${order.thana})` : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col max-w-[200px]">
                          {firstItem ? (
                            <span className="text-xs font-semibold text-foreground truncate" title={firstItem.product_name}>
                              {firstItem.product_name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No item info</span>
                          )}
                          {itemsCount > 1 && (
                            <span className="text-[10px] font-bold text-primary">
                              +{itemsCount - 1} more items
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-xs text-foreground">
                            {formatBDT(Number(order.total_payable) || Number(order.total_amount) || 0)}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            {order.payment_method || 'COD'}
                          </span>
                        </div>
                      </td>

                      {/* Status prior to deletion */}
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                          {order.fulfillment_status || order.status || 'unknown'}
                        </span>
                      </td>

                      {/* Deleted Date */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-rose-500 dark:text-rose-400">
                            {new Date(order.deleted_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(order.deleted_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => restoreMutation.mutate(order.id)}
                            disabled={restoreMutation.isPending}
                            className="px-3 py-1.5 neu-btn rounded-xl text-xs font-bold text-primary hover:text-primary-foreground hover:bg-primary transition-all flex items-center gap-1 cursor-pointer"
                            title="Restore Order back to active list"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Restore</span>
                          </button>

                          <button
                            onClick={() => setConfirmPermanentDeleteId(order.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Permanently Delete this order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Wipe</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ORDER PREVIEW MODAL */}
      {previewOrder && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewOrder(null);
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="clay-card w-full max-w-2xl rounded-3xl p-6 space-y-6 shadow-2xl cursor-default animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 neu-inset rounded-2xl text-rose-500">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    Order Details: {previewOrder.order_number}
                  </h3>
                  <p className="text-xs text-rose-500 font-bold">
                    Deleted on: {new Date(previewOrder.deleted_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewOrder(null)} 
                className="p-2 neu-btn rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{previewOrder.customer_name}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{previewOrder.customer_phone}</p>
                {previewOrder.customer_email && (
                  <p className="text-xs text-muted-foreground mt-0.5">{previewOrder.customer_email}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Shipping Address</p>
                <p className="text-xs text-foreground mt-0.5">{previewOrder.shipping_address || 'No address provided'}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-bold">
                  {previewOrder.district ? `${previewOrder.district}, ${previewOrder.thana || ''}` : ''}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <p className="text-xs font-black text-foreground uppercase tracking-wider">Order Items</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.isArray(previewOrder.items) && previewOrder.items.length > 0 ? (
                  previewOrder.items.map((it: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 neu-tile-inactive rounded-xl text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{it.product_name}</span>
                        {it.variant_name && (
                          <span className="text-[10px] text-muted-foreground">{it.variant_name}</span>
                        )}
                        <span className="text-[10px] font-mono text-muted-foreground">SKU: {it.sku || 'STD'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground">{formatBDT(Number(it.unit_price))} x {it.quantity}</span>
                        <p className="font-black text-primary text-xs">{formatBDT(Number(it.total || (Number(it.unit_price) * Number(it.quantity))))}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No items attached</p>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border">
              <div className="text-xs">
                <span className="text-muted-foreground">Payment: </span>
                <span className="font-bold uppercase text-foreground">{previewOrder.payment_method}</span>
                <span className="text-muted-foreground ml-3">Delivery: </span>
                <span className="font-bold text-foreground">{formatBDT(Number(previewOrder.delivery_fee) || 0)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Total Payable: </span>
                <span className="text-base font-black text-primary">
                  {formatBDT(Number(previewOrder.total_payable) || Number(previewOrder.total_amount) || 0)}
                </span>
              </div>
            </div>

            {/* Actions in Preview */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewOrder(null)}
                className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => restoreMutation.mutate(previewOrder.id)}
                disabled={restoreMutation.isPending}
                className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Order Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM PERMANENT DELETE */}
      {confirmPermanentDeleteId && (
        <div 
          onClick={() => setConfirmPermanentDeleteId(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="clay-card w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl cursor-default animate-scaleUp"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 neu-inset rounded-2xl text-rose-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Permanently Delete Order?</h3>
                <p className="text-xs text-muted-foreground">This action CANNOT be reversed.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will completely remove the order record and all its associated logs from the database forever.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setConfirmPermanentDeleteId(null)}
                className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => forceDeleteMutation.mutate(confirmPermanentDeleteId)}
                disabled={forceDeleteMutation.isPending}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                {forceDeleteMutation.isPending ? 'Wiping...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM EMPTY RECYCLE BIN */}
      {isConfirmEmptyTrashOpen && (
        <div 
          onClick={() => setIsConfirmEmptyTrashOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="clay-card w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl cursor-default animate-scaleUp"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 neu-inset rounded-2xl text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Empty Entire Recycle Bin?</h3>
                <p className="text-xs text-rose-500 font-bold">{orders.length} orders will be permanently wiped.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently wipe all {orders.length} deleted orders? All history, line item records, and financial entries for these deleted orders will be removed permanently.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsConfirmEmptyTrashOpen(false)}
                className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => emptyTrashMutation.mutate()}
                disabled={emptyTrashMutation.isPending}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                {emptyTrashMutation.isPending ? 'Emptying...' : 'Yes, Empty Entire Bin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
