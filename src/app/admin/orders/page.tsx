'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/admin/DataTable';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { formatBDT } from '@/utils/currency';
import { Order } from '@/types';
import { api } from '@/lib/api';
import Link from 'next/link';
import { 
  ShoppingCart, Eye, Plus, Search, Filter, Trash2, CheckCircle2, 
  Clock, Truck, Package, XCircle, FileText, Phone, MapPin, User,
  Sparkles, RefreshCw, X, AlertTriangle, ArrowRight, Palette, Ruler, Layers,
  Printer, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { OrderPrintSlip } from '@/components/admin/OrderPrintSlip';
import { BarcodePrintModal } from '@/components/admin/BarcodePrintModal';
import { CustomerRiskBadge } from '@/components/admin/CustomerRiskBadge';
import { Tag, Scan, Zap, ScanBarcode } from 'lucide-react';


function TrackingInput({ row, onSuccess }: { row: any, onSuccess: () => void }) {
  const [val, setVal] = useState(row.tracking_code || '');
  const [saving, setSaving] = useState(false);

  // Sync state if external polling updates it
  useMemo(() => {
    setVal(row.tracking_code || '');
  }, [row.tracking_code]);

  const save = async (newVal: string) => {
    if (newVal === (row.tracking_code || '')) return;
    setSaving(true);
    try {
      await api.put(`/admin/orders/${row.id}`, { tracking_code: newVal });
      toast.success(`Tracking saved for ${row.order_number}`);
      onSuccess();
    } catch (err: any) {
      toast.error('Failed to save tracking code');
      setVal(row.tracking_code || '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex items-center mt-1">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        placeholder="Enter Tracking..."
        className="text-[11px] font-mono bg-muted px-2 py-1 rounded-md text-foreground font-bold border border-transparent focus:border-primary focus:outline-none w-32 disabled:opacity-50"
        disabled={saving}
      />
      {saving && <RefreshCw className="w-3 h-3 absolute right-2 animate-spin text-muted-foreground" />}
    </div>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [courierFilter, setCourierFilter] = useState('');
  const [printFilter, setPrintFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [slipOrder, setSlipOrder] = useState<any | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeOrders, setBarcodeOrders] = useState<any[]>([]);

  // Modal States
  const [isComplainModalOpen, setIsComplainModalOpen] = useState(false);
  const [complainData, setComplainData] = useState<{ orderId: number | null; description: string; complain_type: string }>({ orderId: null, description: '', complain_type: 'delayed' });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<{ orderId: number | null; amount: string; method: string }>({ orderId: null, amount: '', method: 'bkash' });

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockData, setBlockData] = useState<{ type: string; reason: string; target: string; orderId: number | null }>({ type: 'ip', reason: '', target: '', orderId: null });

  // Form state for creating a manual order
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address: '',
    district: 'Dhaka',
    thana: 'Dhanmondi',
    shipping_zone: 'inside_dhaka',
    payment_method: 'cod',
    fulfillment_status: 'confirmed',
    delivery_fee: 80,
    discount_amount: 0,
    notes: '',
    items: [
      { product_id: undefined as number | undefined, variant_id: undefined as number | undefined, product_name: '', sku: '', color: '', size: '', variant_name: '', unit_price: 500, quantity: 1 }
    ]
  });

  // Fetch catalog products with multiple variants
  const { data: catalogProducts = [] } = useQuery({
    queryKey: ['admin-catalog-products-for-orders'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/products?per_page=150');
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  // 1. Fetch Orders from Backend
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', page, statusFilter, paymentFilter, sourceFilter, search, startDate, endDate, courierFilter, printFilter],
    refetchInterval: 3000, // REAL-TIME POLLING SYNC
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', String(page));
        queryParams.append('per_page', '15');
        if (statusFilter && statusFilter !== 'all') queryParams.append('status', statusFilter);
        if (paymentFilter) queryParams.append('payment_status', paymentFilter);
        if (sourceFilter) queryParams.append('source', sourceFilter);
        if (startDate) queryParams.append('start_date', startDate);
        if (endDate) queryParams.append('end_date', endDate);
        if (courierFilter) queryParams.append('courier_name', courierFilter);
        if (printFilter) queryParams.append('is_printed', printFilter === 'printed' ? '1' : '0');
        if (search.trim()) queryParams.append('search', search.trim());

        const res: any = await api.get(`/admin/orders?${queryParams.toString()}`);
        if (res?.data) {
          const items = Array.isArray(res.data) 
            ? res.data 
            : (res.data.items || res.data.data || []);
          
          const meta = res.data.pagination || res.data.meta || {
            current_page: page,
            last_page: 1,
            total: items.length,
            per_page: 15
          };
          
          const counts = res.data.counts || {};

          return { data: items, meta, counts };
        }
      } catch (err) {
        /* silenced */
      }

      return { data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 15 } };
    }
  });

  // Trashed Orders Live Count
  const { data: trashedCount = 0 } = useQuery({
    queryKey: ['admin-orders-deleted-count'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/orders/trashed/list?per_page=1');
        return res?.data?.pagination?.total ?? res?.data?.total ?? 0;
      } catch {
        return 0;
      }
    },
    refetchInterval: 10000,
  });

  // 2. Status Mutation with Auto-Inventory Notification
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: number; status: string; note?: string }) => {
      return await api.put(`/admin/orders/${id}/status`, { status, note });
    },
    onSuccess: (res: any, vars) => {
      toast.success(`Order status updated to ${vars.status.replace(/_/g, ' ')} (Stock auto-synced)`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: () => {
      toast.error('Failed to update order status');
    }
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const promises = selectedOrderIds.map(id => api.put(`/admin/orders/${id}/status`, { status }));
      return await Promise.all(promises);
    },
    onSuccess: (res: any, status) => {
      toast.success(`${selectedOrderIds.length} orders updated to ${status.replace(/_/g, ' ')}`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrderIds([]); // Clear selection after successful bulk update
    },
    onError: () => {
      toast.error('Failed to apply bulk status update');
    }
  });

  const bulkDispatchMutation = useMutation({
    mutationFn: async (courierName: string) => {
      const payload = {
        order_ids: selectedOrderIds,
        courier_name: courierName
      };
      return await api.post(`/admin/orders/bulk-dispatch`, payload);
    },
    onSuccess: (res: any) => {
      if (res?.success) {
        toast.success(res?.message || `Dispatched orders to courier!`);
      } else {
        toast.error(`Dispatch failed: ${res?.message || 'Unknown error'}`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrderIds([]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to dispatch to courier');
    }
  });

  // 3. Delete Order Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/admin/orders/${id}`);
    },
    onSuccess: () => {
      toast.success(
        (t) => (
          <div className="flex items-center gap-2 text-xs">
            <span>Order moved to Recycle Bin!</span>
            <Link 
              href="/admin/orders/deleted" 
              onClick={() => toast.dismiss(t.id)}
              className="underline font-bold text-primary hover:text-primary/80"
            >
              View Trash
            </Link>
          </div>
        ),
        { duration: 6000 }
      );
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-deleted'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-deleted-count'] });
    },
    onError: () => {
      toast.error('Failed to delete order');
    }
  });

  const complainMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post(`/admin/orders/${data.orderId}/complaints`, data);
    },
    onSuccess: () => {
      toast.success('Complaint added');
      setIsComplainModalOpen(false);
    }
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post(`/admin/orders/${data.orderId}/payments`, data);
    },
    onSuccess: () => {
      toast.success('Payment added');
      setIsPaymentModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    }
  });

  const blockMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post(`/admin/blocks`, data);
    },
    onSuccess: () => {
      toast.success('Block added');
      setIsBlockModalOpen(false);
    }
  });

  // 4. Create Manual Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderPayload: any) => {
      return await api.post('/admin/orders', orderPayload);
    },
    onSuccess: () => {
      toast.success('Manual order created successfully!');
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create order');
    }
  });

  const handleAddItem = () => {
    const firstProd = catalogProducts[0];
    const firstVar = firstProd?.variants?.[0];
    setNewOrder(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: firstProd?.id,
          variant_id: firstVar?.id,
          product_name: firstProd?.name_en || '',
          sku: firstVar?.sku || firstProd?.sku_prefix || 'SKU-01',
          color: firstVar?.color || '',
          size: firstVar?.size || '',
          variant_name: firstVar ? [firstVar.color ? `Color: ${firstVar.color}` : '', firstVar.size ? `Size: ${firstVar.size}` : ''].filter(Boolean).join(' | ') : '',
          unit_price: Number(firstVar?.price || firstProd?.base_price || 500),
          quantity: 1,
        }
      ]
    }));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = catalogProducts.find((p: any) => String(p.id) === productId);
    if (prod) {
      const v = prod.variants?.[0];
      setNewOrder(prev => {
        const updated = [...prev.items];
        updated[index] = {
          ...updated[index],
          product_id: prod.id,
          variant_id: v?.id,
          product_name: prod.name_en,
          sku: v?.sku || prod.sku_prefix || 'SKU-01',
          color: v?.color || '',
          size: v?.size || '',
          variant_name: v ? [v.color ? `Color: ${v.color}` : '', v.size ? `Size: ${v.size}` : ''].filter(Boolean).join(' | ') : '',
          unit_price: Number(v?.price || prod.base_price || 500),
        };
        return { ...prev, items: updated };
      });
    }
  };

  const handleVariantSelect = (index: number, variantId: string, prod: any) => {
    const v = prod?.variants?.find((vr: any) => String(vr.id) === variantId);
    if (v) {
      setNewOrder(prev => {
        const updated = [...prev.items];
        updated[index] = {
          ...updated[index],
          variant_id: v.id,
          sku: v.sku,
          color: v.color || '',
          size: v.size || '',
          variant_name: [v.color ? `Color: ${v.color}` : '', v.size ? `Size: ${v.size}` : ''].filter(Boolean).join(' | '),
          unit_price: Number(v.price),
        };
        return { ...prev, items: updated };
      });
    }
  };

  const handleColorSelect = (index: number, newColor: string, prod: any) => {
    if (!prod || !prod.variants) return;
    const currentSize = newOrder.items[index]?.size || '';

    let matching = prod.variants.find((v: any) => 
      (!newColor || v.color?.toLowerCase() === newColor.toLowerCase()) &&
      (!currentSize || v.size?.toLowerCase() === currentSize.toLowerCase())
    );

    if (!matching && newColor) {
      matching = prod.variants.find((v: any) => v.color?.toLowerCase() === newColor.toLowerCase());
    }

    if (!matching) {
      matching = prod.variants[0];
    }

    if (matching) {
      setNewOrder(prev => {
        const updated = [...prev.items];
        updated[index] = {
          ...updated[index],
          variant_id: matching.id,
          sku: matching.sku,
          color: matching.color || newColor || '',
          size: matching.size || '',
          variant_name: [matching.color ? `Color: ${matching.color}` : '', matching.size ? `Size: ${matching.size}` : ''].filter(Boolean).join(' | '),
          unit_price: Number(matching.price),
        };
        return { ...prev, items: updated };
      });
    }
  };

  const handleSizeSelect = (index: number, newSize: string, prod: any) => {
    if (!prod || !prod.variants) return;
    const currentColor = newOrder.items[index]?.color || '';

    let matching = prod.variants.find((v: any) => 
      (!currentColor || v.color?.toLowerCase() === currentColor.toLowerCase()) &&
      (!newSize || v.size?.toLowerCase() === newSize.toLowerCase())
    );

    if (!matching && newSize) {
      matching = prod.variants.find((v: any) => v.size?.toLowerCase() === newSize.toLowerCase());
    }

    if (!matching) {
      matching = prod.variants[0];
    }

    if (matching) {
      setNewOrder(prev => {
        const updated = [...prev.items];
        updated[index] = {
          ...updated[index],
          variant_id: matching.id,
          sku: matching.sku,
          color: matching.color || '',
          size: matching.size || newSize || '',
          variant_name: [matching.color ? `Color: ${matching.color}` : '', matching.size ? `Size: ${matching.size}` : ''].filter(Boolean).join(' | '),
          unit_price: Number(matching.price),
        };
        return { ...prev, items: updated };
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    if (newOrder.items.length <= 1) return;
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setNewOrder(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const calculateSubtotal = () => {
    return newOrder.items.reduce((acc, it) => acc + ((Number(it.unit_price) || 0) * (Number(it.quantity) || 1)), 0);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() + (Number(newOrder.delivery_fee) || 0) - (Number(newOrder.discount_amount) || 0));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customer_name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!newOrder.customer_phone.trim()) {
      toast.error('Customer phone number is required');
      return;
    }
    if (!newOrder.shipping_address.trim()) {
      toast.error('Shipping address is required');
      return;
    }

    createOrderMutation.mutate(newOrder);
  };

  const columns: Column<Order>[] = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={data?.data?.length > 0 && selectedOrderIds.length === data?.data?.length}
          onChange={(e: any) => {
            if (e.target.checked) {
              setSelectedOrderIds((data?.data || []).map((o: any) => o.id));
            } else {
              setSelectedOrderIds([]);
            }
          }}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedOrderIds.includes(row.id)}
          onChange={(e: any) => {
            e.stopPropagation();
            setSelectedOrderIds(prev => 
              prev.includes(row.id) ? prev.filter(id => id !== row.id) : [...prev, row.id]
            );
          }}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
        />
      ),
      className: 'w-12 px-4'
    },
    { 
      key: 'order_number', 
      label: 'Order # & Source', 
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href={`/admin/orders/${row.id}`} className="font-black text-primary hover:underline flex items-center gap-1">
              <span>{row.order_number}</span>
            </Link>
            {row.source === 'meta_message' ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 shadow-xs" title="Generated from Meta Message Campaign">
                <span>💬 Meta Msg</span>
              </span>
            ) : row.source === 'google_ads' ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs" title="Attributed to Google Ads">
                🔍 Google
              </span>
            ) : row.source === 'tiktok_ads' ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-xs" title="Attributed to TikTok Ads">
                🎵 TikTok
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                🌐 Web
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {row.tracking_code || <span className="text-slate-400 dark:text-slate-500 font-sans italic text-[10px]">No Tracking</span>}
          </span>
        </div>
      )
    },
    { 
      key: 'customer_name', 
      label: 'Customer', 
      render: (row) => (
        <div>
          <div className="font-bold text-foreground flex items-center gap-1.5 flex-wrap">
            <span>{row.customer_name}</span>
            {row.customer_phone && <CustomerRiskBadge phone={row.customer_phone} size="sm" />}
          </div>
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-3 mt-1">
            <a 
              href={`tel:${row.customer_phone}`}
              className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
              title="Call Customer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{row.customer_phone}</span>
            </a>
            
            <a 
              href={`https://api.whatsapp.com/send?phone=88${row.customer_phone}&text=${encodeURIComponent(`We have confirmed your order. Total: ${row.total_payable} TK`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
              title="Message on WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z"/><path d="M14 14a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1Z"/><path d="M9.5 13.5c1.5 1.5 3 1.5 4.5 0"/></svg>
            </a>
          </div>
          {row.shipping_address && (
            <div className="text-[10px] text-muted-foreground mt-1 line-clamp-1 max-w-[200px]" title={row.shipping_address}>
              <MapPin className="w-3 h-3 inline mr-1" />
              {row.shipping_address}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'total_payable', 
      label: 'Payable / Items & Variants', 
      render: (row) => (
        <div className="max-w-[240px] space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-foreground">{formatBDT(row.total_payable)}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">({row.items?.length || 1} item{row.items?.length === 1 ? '' : 's'})</span>
          </div>
          {row.items && row.items.length > 0 ? (
            <div className="space-y-1">
              {row.items.slice(0, 2).map((it: any, idx: number) => {
                const varColor = it.color || it.variant?.color;
                const varSize = it.size || it.variant?.size;
                return (
                  <div key={idx} className="text-[11px] leading-tight text-foreground/90 font-medium">
                    <div className="line-clamp-1 flex items-center gap-1">
                      <span>• {it.product_name || 'Product'}</span>
                      <span className="text-muted-foreground font-mono font-bold text-[10px]">×{it.quantity}</span>
                    </div>
                    {(varColor || varSize) && (
                      <div className="pl-2 flex flex-wrap items-center gap-1 mt-0.5">
                        {varColor && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary border border-primary/20">
                            {varColor}
                          </span>
                        )}
                        {varSize && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-foreground border border-border/40">
                            {varSize}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {row.items.length > 2 && (
                <div className="text-[10px] text-primary font-bold pl-2">
                  +{row.items.length - 2} more item(s)
                </div>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground">
              {row.shipping_zone === 'inside_dhaka' ? 'Dhaka' : 'Outside'}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'payment_method', 
      label: 'Payment', 
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className={`uppercase text-[10px] font-black px-2 py-0.5 rounded-md inline-block w-fit ${
            row.payment_method === 'bkash' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-400' :
            row.payment_method === 'nagad' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400' :
            'bg-muted text-muted-foreground'
          }`}>
            {row.payment_method}
          </span>
          <span className={`text-[10px] font-bold capitalize ${
            row.payment_status === 'paid' ? 'text-primary dark:text-primary' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {row.payment_status}
          </span>
        </div>
      )
    },
    { 
      key: 'fulfillment_status', 
      label: 'Fulfillment Status', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={row.fulfillment_status} />
          <select 
            value={row.fulfillment_status}
            onChange={(e) => updateStatusMutation.mutate({ id: row.id, status: e.target.value })}
            className="text-[11px] py-1 px-1.5 bg-muted/60 border border-border/50 rounded-lg text-foreground font-semibold cursor-pointer focus:outline-none"
            title="Quick update status (auto-syncs stock)"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="handed_to_courier">Handed to Courier</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
            <option value="partial_return">Partial Return</option>
            <option value="blocked">Blocked</option>
            
            <option disabled>--- New Legacy Options ---</option>
            <option value="confirm">Confirm</option>
            <option value="packing">Packing</option>
            <option value="courier">Courier</option>
            <option value="return_received">Return Received</option>
            <option value="pending_return">Pending Return</option>
            <option value="partials">Partials</option>
            <option value="draft">Draft</option>
            <option value="on_hold">On-Hold</option>
            <option value="exchange">Exchange</option>
            <option value="incompleted">Incompleted</option>
          </select>
        </div>
      ) 
    },
    { 
      key: 'created_at', 
      label: 'Placed Date', 
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (row) => (
        <div className="relative group inline-block">
          <button className="px-3 py-1.5 neu-btn rounded-xl text-xs font-bold flex items-center gap-1">
            Actions <span className="ml-1 text-[10px]">▼</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-border/50 rounded-xl shadow-xl py-1 z-[60] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col">
            <Link href={`/admin/orders/${row.id}`} className="text-left px-3 py-1.5 hover:bg-muted text-xs font-bold text-primary flex items-center justify-between">
              <span>Edit Order</span>
              <Edit3 className="w-3.5 h-3.5" />
            </Link>
            <Link href={`/admin/orders/${row.id}`} className="text-left px-3 py-1.5 hover:bg-muted text-xs">View Details</Link>
            <button onClick={() => alert('Courier Check')} className="text-left px-3 py-1.5 hover:bg-muted text-xs">Courier Check</button>
            {((row as any).status === 'handed_to_courier' || row.fulfillment_status === 'handed_to_courier') && (
              <button 
                onClick={() => {
                  setBarcodeOrders([row]);
                  setIsBarcodeModalOpen(true);
                }} 
                className="text-left px-3 py-1.5 hover:bg-muted text-xs text-primary font-bold"
              >
                Label Print
              </button>
            )}
            <button onClick={() => { setComplainData({ ...complainData, orderId: row.id }); setIsComplainModalOpen(true); }} className="text-left px-3 py-1.5 hover:bg-muted text-xs">Add Complain</button>
            <button onClick={() => updateStatusMutation.mutate({ id: row.id, status: 'delivered' })} className="text-left px-3 py-1.5 hover:bg-muted text-xs">Update Complete</button>
            <button onClick={() => alert('View Payment')} className="text-left px-3 py-1.5 hover:bg-muted text-xs">View Payment</button>
            <button onClick={() => { setPaymentData({ ...paymentData, orderId: row.id }); setIsPaymentModalOpen(true); }} className="text-left px-3 py-1.5 hover:bg-muted text-xs">Add Payment</button>
            <button onClick={() => { setBlockData({ type: 'ip', reason: '', target: (row as any).ip_address || '', orderId: row.id }); setIsBlockModalOpen(true); }} className="text-left px-3 py-1.5 hover:bg-muted text-xs text-red-600">Block IP</button>
            <button onClick={() => { setBlockData({ type: 'phone', reason: '', target: row.customer_phone, orderId: row.id }); setIsBlockModalOpen(true); }} className="text-left px-3 py-1.5 hover:bg-muted text-xs text-red-600">Number Block</button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="space-y-6 print:hidden">
        {/* Header Banner */}
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-primary font-black">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Orders & Fulfillment</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Real-time order consignments, automated inventory sync & courier dispatch across all 64 BD districts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Link href="/admin/orders/super-edit" className="neu-btn px-3 py-2 rounded-xl text-xs font-black text-violet-600 hover:text-violet-700 flex items-center gap-2 border border-violet-500/20 bg-violet-500/10" title="Fast Keyboard Order Processing">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">SuperEdit Mode</span>
          </Link>
          <Link
            href="/admin/scan"
            className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-foreground hover:text-primary flex items-center gap-2"
            title="Open Warehouse Barcode Scanner Station"
          >
            <Scan className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Scanner Station</span>
          </Link>
          <Link
            href="/admin/orders/deleted"
            className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors"
            title="View Deleted Orders Recycle Bin"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">Trash</span>
            {Number(trashedCount) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white leading-none">
                {trashedCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => refetch()}
            className="p-2 neu-btn rounded-xl text-foreground hover:text-primary transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Action Buttons (Legacy Match) */}
      <div className="flex flex-wrap items-center gap-2 clay-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-border/50 shadow-sm">
        <Link href="/admin/pos" className="neu-btn-primary px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Sale
        </Link>
        <button onClick={() => alert('Assign Update')} className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-foreground flex items-center gap-1">
          <User className="w-4 h-4" /> Assign Update
        </button>
        <button onClick={() => document.getElementById('bulk-status-update-btn')?.click()} className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-foreground flex items-center gap-1">
          <RefreshCw className="w-4 h-4" /> Status Update
        </button>
        <button onClick={() => {
           if(selectedOrderIds.length > 0) {
             bulkDispatchMutation.mutate('steadfast');
           } else {
             toast.error('Select orders first');
           }
        }} className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-blue-600 flex items-center gap-1" disabled={bulkDispatchMutation.isPending}>
          {bulkDispatchMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />} 
          {bulkDispatchMutation.isPending ? 'Sending...' : 'Send To Courier'}
        </button>
        <button onClick={() => {
           if(selectedOrderIds.length > 0) {
             bulkStatusMutation.mutate('returned');
           } else {
             toast.error('Select orders first');
           }
        }} className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-amber-600 flex items-center gap-1">
          <XCircle className="w-4 h-4" /> Return Received
        </button>
        <button onClick={() => {
           if(selectedOrderIds.length > 0) {
             bulkStatusMutation.mutate('delivered');
           } else {
             toast.error('Select orders first');
           }
        }} className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" /> Delivered
        </button>
        <button onClick={() => { 
          if(selectedOrderIds.length > 0) {
            const selected = (data?.data || []).find((o: any) => o.id === selectedOrderIds[0]);
            if(selected) setSlipOrder(selected);
          } else {
            toast.error('Select an order to print');
          }
        }} className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-foreground flex items-center gap-1">
          <Printer className="w-4 h-4" /> Print
        </button>
        {selectedOrderIds.length > 0 && selectedOrderIds.every(id => (data?.data || []).find((o: any) => o.id === id)?.status === 'handed_to_courier') && (
          <button onClick={() => {
            const selected = (data?.data || []).filter((o: any) => selectedOrderIds.includes(o.id));
            setBarcodeOrders(selected);
            setIsBarcodeModalOpen(true);
          }} className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-foreground flex items-center gap-1">
            <Tag className="w-4 h-4" /> Label Print
          </button>
        )}
      </div>

      {/* Batch Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="clay-card p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
              {selectedOrderIds.length}
            </span>
            <span className="text-xs font-bold text-foreground">
              orders selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            
            <div className="relative group">
              <button id="bulk-status-update-btn" className="neu-btn px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md bg-white dark:bg-slate-800 text-primary border border-border/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bulk Update Status</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-border/50 rounded-xl shadow-xl p-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {['pending', 'confirmed', 'processing', 'handed_to_courier', 'in_transit', 'delivered', 'cancelled', 'returned', 'partial_return', 'blocked', 'confirm', 'packing', 'courier', 'return_received', 'pending_return', 'partials', 'draft', 'on_hold', 'exchange', 'incompleted'].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      if (confirm(`Update ${selectedOrderIds.length} orders to ${s.replace(/_/g, ' ')}?`)) {
                        bulkStatusMutation.mutate(s);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-[11px] font-bold text-foreground hover:bg-muted rounded-lg capitalize"
                  >
                    Mark as {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {selectedOrderIds.every(id => (data?.data || []).find((o: any) => o.id === id)?.status === 'handed_to_courier') && (
              <button
                onClick={() => {
                  const selected = (data?.data || []).filter((o: any) => selectedOrderIds.includes(o.id));
                  const missingTracking = selected.filter((o: any) => !o.consignment?.consignment_id && !o.tracking_code);
                  
                  if (missingTracking.length > 0) {
                    toast.error(`${missingTracking.length} order(s) missing Live Tracking Code. Please update Live Tracking Code / Consignment ID first.`);
                    return;
                  }
                  
                  setBarcodeOrders(selected);
                  setIsBarcodeModalOpen(true);
                }}
                className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
              >
                <ScanBarcode className="w-3.5 h-3.5" />
                <span>Print Thermal Stickers ({selectedOrderIds.length})</span>
              </button>
            )}
            <button
              onClick={() => setSelectedOrderIds([])}
              className="neu-btn px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'pending', label: 'Pending' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'processing', label: 'Processing' },
          { id: 'handed_to_courier', label: 'Handed to Courier' },
          { id: 'in_transit', label: 'In Transit' },
          { id: 'delivered', label: 'Delivered' },
          { id: 'cancelled', label: 'Cancelled' },
          { id: 'returned', label: 'Returned' },
          { id: 'partial_return', label: 'Partial Return' },
          { id: 'blocked', label: 'Blocked' },
          { id: 'confirm', label: 'Confirm' },
          { id: 'packing', label: 'Packing' },
          { id: 'courier', label: 'Courier' },
          { id: 'return_received', label: 'Return Received' },
          { id: 'pending_return', label: 'Pending Return' },
          { id: 'partials', label: 'Partials' },
          { id: 'draft', label: 'Draft' },
          { id: 'on_hold', label: 'On-Hold' },
          { id: 'exchange', label: 'Exchange' },
          { id: 'incompleted', label: 'Incompleted' },
          { id: 'all', label: 'All' },
        ].map((tab) => {
          const count = data?.counts?.[tab.id] || 0;
          return (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-black transition-all border flex items-center gap-2 ${
                statusFilter === tab.id 
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                  : 'bg-white dark:bg-slate-800 text-muted-foreground border-border/50 hover:border-primary/50 hover:text-foreground'
              }`}
            >
              <span>{count}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="clay-card p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by order #, phone, customer, tracking..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 neu-input rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="neu-input px-3 py-2.5 rounded-2xl text-xs font-bold text-foreground cursor-pointer focus:outline-none"
              title="Start Date"
            />
            <span className="text-muted-foreground text-xs font-bold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="neu-input px-3 py-2.5 rounded-2xl text-xs font-bold text-foreground cursor-pointer focus:outline-none"
              title="End Date"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="neu-input px-3 py-2.5 rounded-2xl text-xs font-bold text-foreground cursor-pointer focus:outline-none"
          >
            <option value="">All Sale Type</option>
            <option value="web">Storefront Web</option>
            <option value="manual">Manual Creation</option>
            <option value="meta_message">Meta Message Ads</option>
            <option value="google_ads">Google Ads</option>
          </select>

          <select
            value={courierFilter}
            onChange={(e) => { setCourierFilter(e.target.value); setPage(1); }}
            className="neu-input px-3 py-2.5 rounded-2xl text-xs font-bold text-foreground cursor-pointer focus:outline-none"
          >
            <option value="">All Couriers</option>
            <option value="steadfast">Steadfast</option>
            <option value="pathao">Pathao</option>
            <option value="redx">RedX</option>
            <option value="ecourier">eCourier</option>
          </select>

          <select
            value={printFilter}
            onChange={(e) => { setPrintFilter(e.target.value); setPage(1); }}
            className="neu-input px-3 py-2.5 rounded-2xl text-xs font-bold text-foreground cursor-pointer focus:outline-none"
          >
            <option value="">All Print Status</option>
            <option value="printed">Printed</option>
            <option value="unprinted">Unprinted</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="neu-input px-3 py-2.5 rounded-2xl text-xs font-bold text-foreground cursor-pointer focus:outline-none"
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {(search || statusFilter !== 'all' || paymentFilter || sourceFilter || startDate || endDate || courierFilter || printFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setPaymentFilter(''); setSourceFilter(''); setStartDate(''); setEndDate(''); setCourierFilter(''); setPrintFilter(''); setPage(1); }}
            className="px-3 py-2 neu-btn rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Orders Data Table */}
      <div className="clay-card p-6 rounded-3xl">
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          currentPage={data?.meta?.current_page || 1}
          totalPages={data?.meta?.last_page || 1}
          onPageChange={(p: number) => setPage(p)}
        />
      </div>

      

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingId(null);
          }}
          className="fixed inset-0 z-[110] neu-backdrop flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-md w-full p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="w-12 h-12 mx-auto neu-card-inset rounded-2xl flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-foreground">Delete Order</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete this order? If items were previously deducted from inventory, they will be automatically restocked.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 neu-modal-footer">
              <button
                onClick={() => setDeletingId(null)}
                className="neu-btn-secondary px-5 py-2.5 text-xs font-bold"
              >
                Keep Order
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2.5 bg-red-600 text-white rounded-2xl text-xs font-bold hover:bg-red-700 active:translate-y-0.5 transition-all shadow-md cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div> {/* End print:hidden */}

      {/* PRINT SLIP PREVIEW MODAL */}
      {slipOrder && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSlipOrder(null);
          }}
          className="fixed inset-0 z-[120] neu-backdrop flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:hidden cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 neu-modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl neu-card-inset text-primary flex items-center justify-center font-black">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    Official Print Slip & Consignment Preview
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Order #{slipOrder.order_number} &bull; Items Matrix, Customer & Destination, Payment & Financials
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="neu-btn-primary px-4 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSlipOrder(null)}
                  className="neu-close-btn"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Slip */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70 dark:bg-slate-900/70 flex justify-center">
              <div className="shadow-2xl bg-white text-slate-900 rounded-2xl overflow-hidden max-w-3xl w-full border border-slate-300">
                <OrderPrintSlip order={{
                  ...slipOrder,
                  items: Array.isArray(slipOrder.items) ? slipOrder.items : []
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <BarcodePrintModal 
        isOpen={isBarcodeModalOpen} 
        onClose={() => setIsBarcodeModalOpen(false)} 
        orders={barcodeOrders} 
      />

      {/* PRINT-ONLY CONTAINER: Active during window.print() */}
      {slipOrder && (
        <div className="hidden print:block w-full">
          <OrderPrintSlip order={{
            ...slipOrder,
            items: Array.isArray(slipOrder.items) ? slipOrder.items : []
          }} />
        </div>
      )}

      {/* Modals for new actions */}
      {isComplainModalOpen && (
        <div className="fixed inset-0 z-[150] neu-backdrop flex items-center justify-center p-4">
          <div className="neu-modal rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black">Add Complain</h3>
            <select
              value={complainData.complain_type}
              onChange={(e) => setComplainData({ ...complainData, complain_type: e.target.value })}
              className="w-full neu-input py-2 px-3 rounded-xl text-sm font-semibold focus:outline-none"
            >
              <option value="delayed">Delayed Delivery</option>
              <option value="damaged">Damaged Product</option>
              <option value="missing">Missing Item</option>
              <option value="other">Other</option>
            </select>
            <textarea
              value={complainData.description}
              onChange={(e) => setComplainData({ ...complainData, description: e.target.value })}
              placeholder="Description..."
              className="w-full neu-input py-2 px-3 rounded-xl text-sm font-semibold focus:outline-none"
              rows={3}
            ></textarea>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsComplainModalOpen(false)} className="px-4 py-2 neu-btn rounded-xl text-sm font-bold">Cancel</button>
              <button onClick={() => complainMutation.mutate(complainData)} className="px-4 py-2 neu-btn-primary rounded-xl text-sm font-bold">Submit</button>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[150] neu-backdrop flex items-center justify-center p-4">
          <div className="neu-modal rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black">Add Payment</h3>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              placeholder="Amount..."
              className="w-full neu-input py-2 px-3 rounded-xl text-sm font-semibold focus:outline-none"
            />
            <select
              value={paymentData.method}
              onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
              className="w-full neu-input py-2 px-3 rounded-xl text-sm font-semibold focus:outline-none"
            >
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 neu-btn rounded-xl text-sm font-bold">Cancel</button>
              <button onClick={() => paymentMutation.mutate(paymentData)} className="px-4 py-2 neu-btn-primary rounded-xl text-sm font-bold">Submit</button>
            </div>
          </div>
        </div>
      )}

      {isBlockModalOpen && (
        <div className="fixed inset-0 z-[150] neu-backdrop flex items-center justify-center p-4">
          <div className="neu-modal rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black">Block User ({blockData.type.toUpperCase()})</h3>
            <p className="text-sm font-semibold text-muted-foreground">Target: {blockData.target || 'N/A'}</p>
            <input
              type="text"
              value={blockData.reason}
              onChange={(e) => setBlockData({ ...blockData, reason: e.target.value })}
              placeholder="Reason..."
              className="w-full neu-input py-2 px-3 rounded-xl text-sm font-semibold focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsBlockModalOpen(false)} className="px-4 py-2 neu-btn rounded-xl text-sm font-bold">Cancel</button>
              <button onClick={() => blockMutation.mutate(blockData)} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-all rounded-xl text-sm font-bold">Block</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
