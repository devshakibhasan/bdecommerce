'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Building2, ShoppingBag, Plus, ArrowRight, FileText, CheckCircle2, User, PackagePlus, 
  Loader2, Search, Trash2, Edit2, Eye, Printer, AlertCircle, X, Check, Truck, Clock, RefreshCw
} from 'lucide-react';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';
import { Modal } from '@/components/admin/Modal';
import Link from 'next/link';

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');

  // Search & Filter States for Orders
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState<string>('all');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');

  // Modals for Orders
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [editOrderForm, setEditOrderForm] = useState<any>({
    id: null,
    notes: '',
    expected_delivery_date: '',
    advance_paid: 0,
    status: 'pending',
  });

  // Search & Filter States for Suppliers
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    status: 'active',
  });

  // --- QUERIES ---

  const { data: suppliers = [], isLoading: isSuppliersLoading, refetch: refetchSuppliers } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: async () => {
      const res: any = await api.get('/admin/purchases/suppliers');
      const data = res?.data?.data || res?.data || [];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: orders = [], isLoading: isOrdersLoading, isRefetching: isOrdersRefetching, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-purchases-orders'],
    queryFn: async () => {
      const res: any = await api.get('/admin/purchases/orders');
      const data = res?.data?.data || res?.data || [];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // --- MUTATIONS: SUPPLIERS ---

  const saveSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingSupplierId) {
        const res: any = await api.put(`/admin/purchases/suppliers/${editingSupplierId}`, data);
        return res.data;
      } else {
        const res: any = await api.post('/admin/purchases/suppliers', data);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(editingSupplierId ? 'Supplier updated successfully!' : 'Supplier added successfully!');
      setIsSupplierModalOpen(false);
      setEditingSupplierId(null);
      setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '', status: 'active' });
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save supplier');
    }
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      const res: any = await api.delete(`/admin/purchases/suppliers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Supplier deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Cannot delete supplier');
    }
  });

  // --- MUTATIONS: ORDERS ---

  const receiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res: any = await api.post(`/admin/purchases/orders/${id}/receive`);
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success('Goods received (GRN)! Stock credited and ledger updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-purchases-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      if (selectedOrder) {
        setIsDetailModalOpen(false);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to receive PO');
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res: any = await api.put(`/admin/purchases/orders/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Purchase Order updated successfully');
      setIsEditOrderModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-purchases-orders'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update PO');
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      const res: any = await api.delete(`/admin/purchases/orders/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Purchase Order deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-purchases-orders'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete PO');
    }
  });

  // --- HANDLERS ---

  const handleOpenAddSupplier = () => {
    setEditingSupplierId(null);
    setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '', status: 'active' });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup: any) => {
    setEditingSupplierId(sup.id);
    setSupplierForm({
      name: sup.name || '',
      contact_person: sup.contact_person || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      status: sup.status || 'active',
    });
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = (sup: any) => {
    if (confirm(`Are you sure you want to delete supplier "${sup.name}"?`)) {
      deleteSupplierMutation.mutate(sup.id);
    }
  };

  const handleOpenOrderDetail = (po: any) => {
    setSelectedOrder(po);
    setIsDetailModalOpen(true);
  };

  const handleOpenEditOrder = (po: any) => {
    setEditOrderForm({
      id: po.id,
      supplier_id: po.supplier_id,
      order_date: po.order_date ? po.order_date.split('T')[0] : '',
      expected_delivery_date: po.expected_delivery_date ? po.expected_delivery_date.split('T')[0] : '',
      notes: po.notes || '',
      advance_paid: Number(po.advance_paid || 0),
      status: po.status || 'pending',
    });
    setIsEditOrderModalOpen(true);
  };

  const handleDeleteOrder = (po: any) => {
    if (po.status === 'received') {
      toast.error('Cannot delete a received Purchase Order (inventory has already been credited)');
      return;
    }
    if (confirm(`Are you sure you want to delete PO "${po.po_number}"? This will cancel and permanently remove the record.`)) {
      deleteOrderMutation.mutate(po.id);
    }
  };

  // --- FILTERED DATA ---

  const filteredOrders = orders.filter((po: any) => {
    const matchesSearch = !orderSearch || 
      (po.po_number || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (po.supplier?.name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (po.notes || '').toLowerCase().includes(orderSearch.toLowerCase());

    const matchesStatus = orderStatus === 'all' || po.status === orderStatus;
    const matchesSupplier = selectedSupplierFilter === 'all' || po.supplier_id?.toString() === selectedSupplierFilter;

    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const filteredSuppliers = suppliers.filter((s: any) => {
    if (!supplierSearch) return true;
    const q = supplierSearch.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) ||
      (s.contact_person || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.address || '').toLowerCase().includes(q);
  });

  // Calculate Metrics
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o: any) => o.status !== 'received' && o.status !== 'cancelled').length;
  const receivedOrdersCount = orders.filter((o: any) => o.status === 'received').length;
  const totalPayableBalance = suppliers.reduce((sum: number, s: any) => sum + Number(s.ledger_balance || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-primary font-black bg-primary/10">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Procurement & Purchases</h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage supplier relationships, track purchase orders, and receive goods directly into inventory stock.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetchOrders()} 
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isOrdersRefetching ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/admin/purchases/create" className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Create Purchase Order
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clay-card p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-primary" /> Total POs
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalOrdersCount}</div>
        </div>
        <div className="clay-card p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending / Transit
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingOrdersCount}</div>
        </div>
        <div className="clay-card p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Received (GRN)
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{receivedOrdersCount}</div>
        </div>
        <div className="clay-card p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Supplier Payable
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatBDT(totalPayableBalance)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Purchase Orders ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'suppliers' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Suppliers Directory ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="clay-card rounded-3xl overflow-hidden bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm space-y-0">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search PO#, supplier or notes..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-primary"
                />
              </div>

              {/* Status Filter */}
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending / Transit</option>
                <option value="draft">Draft</option>
                <option value="received">Received (GRN)</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Supplier Filter */}
              <select
                value={selectedSupplierFilter}
                onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-medium"
              >
                <option value="all">All Suppliers</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id.toString()}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="text-xs font-bold text-slate-500">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>

          {/* Orders Table */}
          {isOrdersLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-bold text-slate-500">Loading purchase orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <PackagePlus className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">No Purchase Orders Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {orderSearch || orderStatus !== 'all' ? 'Try adjusting your search filters.' : 'Create your first purchase order to order stock from suppliers.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3 font-bold">PO Number</th>
                    <th className="px-5 py-3 font-bold">Supplier</th>
                    <th className="px-5 py-3 font-bold">Dates</th>
                    <th className="px-5 py-3 font-bold">Items</th>
                    <th className="px-5 py-3 font-bold text-right">Total / Due</th>
                    <th className="px-5 py-3 font-bold text-center">Status</th>
                    <th className="px-5 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredOrders.map((po: any) => {
                    const isReceived = po.status === 'received';
                    const isCancelled = po.status === 'cancelled';

                    return (
                      <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* PO Number */}
                        <td className="px-5 py-3.5">
                          <button 
                            onClick={() => handleOpenOrderDetail(po)}
                            className="font-mono font-bold text-primary hover:underline text-left"
                          >
                            {po.po_number}
                          </button>
                          {po.notes && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{po.notes}</div>
                          )}
                        </td>

                        {/* Supplier */}
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{po.supplier?.name || 'N/A'}</div>
                          <div className="text-[10px] text-slate-400">{po.supplier?.phone || po.supplier?.contact_person || ''}</div>
                        </td>

                        {/* Dates */}
                        <td className="px-5 py-3.5">
                          <div className="text-slate-700 dark:text-slate-300 font-medium">
                            {po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}
                          </div>
                          {po.expected_delivery_date && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400">
                              Exp: {new Date(po.expected_delivery_date).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        {/* Items */}
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                            {po.items?.length || 0} product{po.items?.length !== 1 ? 's' : ''}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="font-black text-slate-900 dark:text-white">
                            {formatBDT(po.total_amount)}
                          </div>
                          {Number(po.due_amount || 0) > 0 ? (
                            <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                              Due: {formatBDT(po.due_amount)}
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-emerald-600">Paid in full</div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isReceived 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : isCancelled
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {isReceived && <Check className="w-3 h-3" />}
                            {po.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details */}
                            <button
                              onClick={() => handleOpenOrderDetail(po)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                              title="View PO Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Receive Goods GRN Button */}
                            {!isReceived && !isCancelled && (
                              <button
                                onClick={() => {
                                  if (confirm(`Receive all goods for PO "${po.po_number}" into inventory stock?`)) {
                                    receiveMutation.mutate(po.id);
                                  }
                                }}
                                disabled={receiveMutation.isPending}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                                title="Receive Goods (GRN)"
                              >
                                {receiveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck className="w-3 h-3" />}
                                Receive
                              </button>
                            )}

                            {/* Edit PO */}
                            {!isReceived && (
                              <button
                                onClick={() => handleOpenEditOrder(po)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                                title="Edit PO"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete PO */}
                            {!isReceived && (
                              <button
                                onClick={() => handleDeleteOrder(po)}
                                disabled={deleteOrderMutation.isPending}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 rounded-lg"
                                title="Delete PO"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
      )}

      {/* TAB 2: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="clay-card rounded-3xl overflow-hidden bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm space-y-0">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-3 items-center justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search suppliers by name, phone..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-primary"
              />
            </div>

            <button
              onClick={handleOpenAddSupplier}
              className="neu-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Supplier
            </button>
          </div>

          {/* Suppliers Table */}
          {isSuppliersLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-bold text-slate-500">Loading suppliers...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <User className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">No Suppliers Found</h3>
              <p className="text-xs text-slate-500 mt-1">Add your fabric and inventory suppliers to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3 font-bold">Supplier Name</th>
                    <th className="px-5 py-3 font-bold">Contact Person</th>
                    <th className="px-5 py-3 font-bold">Phone / Email</th>
                    <th className="px-5 py-3 font-bold">Address</th>
                    <th className="px-5 py-3 font-bold text-center">Active Orders</th>
                    <th className="px-5 py-3 font-bold text-right">Payable Balance</th>
                    <th className="px-5 py-3 font-bold text-center">Status</th>
                    <th className="px-5 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSuppliers.map((sup: any) => (
                    <tr key={sup.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        {sup.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                        {sup.contact_person || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-mono font-medium text-slate-800 dark:text-slate-200">{sup.phone || '—'}</div>
                        {sup.email && <div className="text-[10px] text-slate-400">{sup.email}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 max-w-[180px] truncate">
                        {sup.address || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          {sup.active_orders_count || 0} active
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-rose-600 dark:text-rose-400">
                        {formatBDT(sup.ledger_balance)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          sup.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {sup.status || 'active'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditSupplier(sup)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(sup)}
                            disabled={deleteSupplierMutation.isPending}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 rounded-lg"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: PO DETAILS & PRINTABLE VIEW */}
      {selectedOrder && (
        <Modal 
          isOpen={isDetailModalOpen} 
          onClose={() => setIsDetailModalOpen(false)} 
          title={`Purchase Order: ${selectedOrder.po_number}`}
          size="lg"
        >
          <div className="space-y-6 text-xs" id="printable-po">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order Reference</span>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{selectedOrder.po_number}</div>
                <div className="text-[11px] text-slate-500">Date: {new Date(selectedOrder.order_date).toLocaleDateString()}</div>
              </div>
              <div className="flex flex-col sm:items-end gap-1">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  selectedOrder.status === 'received' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : selectedOrder.status === 'cancelled'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedOrder.status}
                </span>
                {selectedOrder.expected_delivery_date && (
                  <div className="text-[11px] text-slate-500">
                    Exp. Delivery: {new Date(selectedOrder.expected_delivery_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Supplier Details */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Supplier Details</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{selectedOrder.supplier?.name}</div>
                <div className="text-slate-600 dark:text-slate-400">Contact: {selectedOrder.supplier?.contact_person || 'N/A'}</div>
                <div className="text-slate-600 dark:text-slate-400">Phone: {selectedOrder.supplier?.phone || 'N/A'}</div>
                {selectedOrder.supplier?.email && <div className="text-slate-600 dark:text-slate-400">Email: {selectedOrder.supplier.email}</div>}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Shipping & Notes</div>
                <div className="text-slate-600 dark:text-slate-400">Address: {selectedOrder.supplier?.address || 'N/A'}</div>
                <div className="text-slate-600 dark:text-slate-400 mt-1">
                  Notes: <span className="italic">{selectedOrder.notes || 'No special instructions.'}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-500 mb-2">Order Line Items</div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Variant / Spec</th>
                      <th className="p-3 text-center">Ordered</th>
                      <th className="p-3 text-center">Received</th>
                      <th className="p-3 text-right">Unit Cost</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedOrder.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {item.product?.name_en || item.product?.name_bn || `Product #${item.product_id}`}
                        </td>
                        <td className="p-3 text-slate-500">
                          {item.variant ? (
                            <span>{item.variant.size ? `Size: ${item.variant.size}` : ''} {item.variant.color ? `(${item.variant.color})` : ''}</span>
                          ) : (
                            <span className="italic text-slate-400">Default Variant</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold">{item.quantity_ordered}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">{item.quantity_received || 0}</td>
                        <td className="p-3 text-right font-medium">{formatBDT(item.unit_price)}</td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-white">{formatBDT(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500">
                Payment Status: {Number(selectedOrder.due_amount || 0) === 0 ? 'Full Advance Settled' : 'Payment Due Pending'}
              </div>
              <div className="w-full sm:w-auto space-y-1 text-right">
                <div className="flex justify-between sm:justify-end gap-6">
                  <span className="text-slate-500 font-bold">Total Amount:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatBDT(selectedOrder.total_amount)}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-6 text-blue-600">
                  <span className="font-bold">Advance Paid:</span>
                  <span className="font-bold">{formatBDT(selectedOrder.advance_paid)}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-6 text-rose-600 text-sm font-black border-t border-slate-200 dark:border-slate-800 pt-1">
                  <span>Payable Due:</span>
                  <span>{formatBDT(selectedOrder.due_amount)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Printer className="w-4 h-4" /> Print PO Slip
              </button>

              <div className="flex items-center gap-2">
                {selectedOrder.status !== 'received' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      if (confirm(`Receive goods for PO "${selectedOrder.po_number}" and update inventory stock?`)) {
                        receiveMutation.mutate(selectedOrder.id);
                      }
                    }}
                    disabled={receiveMutation.isPending}
                    className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    {receiveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                    Receive Goods (GRN)
                  </button>
                )}
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: EDIT PO */}
      <Modal
        isOpen={isEditOrderModalOpen}
        onClose={() => setIsEditOrderModalOpen(false)}
        title="Edit Purchase Order"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateOrderMutation.mutate({
              id: editOrderForm.id,
              data: {
                notes: editOrderForm.notes,
                expected_delivery_date: editOrderForm.expected_delivery_date || null,
                advance_paid: Number(editOrderForm.advance_paid) || 0,
                status: editOrderForm.status,
              }
            });
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Status</label>
            <select
              value={editOrderForm.status}
              onChange={(e) => setEditOrderForm({ ...editOrderForm, status: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none"
            >
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Expected Delivery Date</label>
            <input
              type="date"
              value={editOrderForm.expected_delivery_date}
              onChange={(e) => setEditOrderForm({ ...editOrderForm, expected_delivery_date: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Advance Paid (BDT)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={editOrderForm.advance_paid}
              onChange={(e) => setEditOrderForm({ ...editOrderForm, advance_paid: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Notes / Remarks</label>
            <textarea
              value={editOrderForm.notes}
              onChange={(e) => setEditOrderForm({ ...editOrderForm, notes: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none min-h-[70px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOrderModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateOrderMutation.isPending}
              className="neu-btn-primary px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"
            >
              {updateOrderMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: ADD / EDIT SUPPLIER */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplierId ? 'Edit Supplier' : 'Add New Supplier'}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSupplierMutation.mutate(supplierForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Supplier Name *</label>
            <input
              required
              type="text"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Bengal Fabrics Ltd"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Contact Person</label>
            <input
              type="text"
              value={supplierForm.contact_person}
              onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Md. Tariqul Islam"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Phone</label>
              <input
                type="text"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="017XXXXXXXX"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="supplier@domain.com"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Address / Location</label>
            <textarea
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/50 min-h-[60px]"
              placeholder="Factory / Office address"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Status</label>
            <select
              value={supplierForm.status}
              onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveSupplierMutation.isPending}
              className="neu-btn-primary px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"
            >
              {saveSupplierMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingSupplierId ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
