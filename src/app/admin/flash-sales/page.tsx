'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Zap, Clock, Plus, Tag, CheckCircle2, XCircle, 
  Trash2, Edit, X, Sparkles, ShoppingBag, Flame, 
  Layers, Search, AlertCircle, Percent, Eye, ArrowRight,
  TrendingUp, Calendar, Check
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminFlashSalesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title_en: '',
    title_bn: '',
    slug: '',
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
    is_active: true,
    selected_products: [] as { product_id: number; name: string; base_price: number; special_price: number; quantity_limit: number }[]
  });

  // Fetch Flash Sales List
  const { data: salesData = [], isLoading } = useQuery({
    queryKey: ['admin-flash-sales-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/flash-sales');
        if (res?.data) {
          return Array.isArray(res.data) 
            ? res.data 
            : (res.data.items || res.data.data || []);
        }
      } catch (err) {
        /* silenced */
        try {
          const pubRes: any = await api.get('/flash-sales');
          if (pubRes?.data) {
            return Array.isArray(pubRes.data) ? pubRes.data : (pubRes.data.items || pubRes.data.data || []);
          }
        } catch (pubErr) {}
      }
      return [];
    }
  });

  // Fetch Catalog Products for inclusion in flash sale
  const { data: productsData = [] } = useQuery({
    queryKey: ['admin-products-for-flash'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/products?per_page=100');
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  // Create Campaign Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/admin/flash-sales', payload);
    },
    onSuccess: () => {
      toast.success('Flash sale campaign created successfully!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sales-list'] });
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to create flash sale';
      const validationDetails = err?.errors
        ? '\n' + Object.values(err.errors).flat().join(', ')
        : '';
      toast.error(msg + validationDetails);
    }
  });

  // Update Campaign Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      return await api.put(`/admin/flash-sales/${id}`, payload);
    },
    onSuccess: () => {
      toast.success('Flash sale campaign updated!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sales-list'] });
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to update flash sale';
      toast.error(msg);
    }
  });

  // Toggle Status Mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.put(`/admin/flash-sales/${id}/toggle-status`, {});
    },
    onSuccess: () => {
      toast.success('Campaign status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sales-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to toggle status');
    }
  });

  // Delete Campaign Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/admin/flash-sales/${id}`);
    },
    onSuccess: () => {
      toast.success('Flash sale deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sales-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete flash sale');
    }
  });

  const openCreateModal = () => {
    setEditingSale(null);
    setProductSearch('');
    setFormData({
      title_en: '',
      title_bn: '',
      slug: '',
      starts_at: new Date().toISOString().slice(0, 16),
      ends_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      is_active: true,
      selected_products: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sale: any) => {
    setEditingSale(sale);
    setProductSearch('');
    const existingProds = (sale.products || []).map((p: any) => ({
      product_id: p.id,
      name: p.name_en,
      base_price: Number(p.base_price || 0),
      special_price: Number(p.pivot?.special_price || p.base_price * 0.8),
      quantity_limit: Number(p.pivot?.quantity_limit || 50)
    }));

    setFormData({
      title_en: sale.title_en,
      title_bn: sale.title_bn || '',
      slug: sale.slug,
      starts_at: sale.starts_at ? new Date(sale.starts_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      ends_at: sale.ends_at ? new Date(sale.ends_at).toISOString().slice(0, 16) : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      is_active: Boolean(sale.is_active),
      selected_products: existingProds
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
  };

  const addProductToDeal = (productId: number) => {
    const prod = productsData.find((p: any) => p.id === productId);
    if (!prod) return;
    if (formData.selected_products.some(p => p.product_id === productId)) {
      toast.error('Product already added to this campaign');
      return;
    }

    const baseP = Number(prod.base_price || prod.current_price || 1000);
    const specialP = Math.round(baseP * 0.75); // 25% default discount

    setFormData(prev => ({
      ...prev,
      selected_products: [
        ...prev.selected_products,
        {
          product_id: productId,
          name: prod.name_en,
          base_price: baseP,
          special_price: specialP,
          quantity_limit: 50
        }
      ]
    }));
  };

  const removeProductFromDeal = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      selected_products: prev.selected_products.filter((_, i) => i !== idx)
    }));
  };

  const updateProductDeal = (idx: number, field: string, value: number) => {
    const updated = [...formData.selected_products];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData(prev => ({ ...prev, selected_products: updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_en.trim()) {
      toast.error('Campaign title is required');
      return;
    }

    const baseSlug = formData.slug || formData.title_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const cleanSlug = editingSale ? baseSlug : `${baseSlug}-${Date.now().toString(36)}`;

    const payload = {
      title_en: formData.title_en.trim(),
      title_bn: (formData.title_bn || formData.title_en).trim(),
      slug: cleanSlug,
      starts_at: formData.starts_at,
      ends_at: formData.ends_at,
      is_active: formData.is_active,
      products: formData.selected_products.map(p => ({
        product_id: p.product_id,
        special_price: Number(p.special_price),
        quantity_limit: Number(p.quantity_limit) || 50
      }))
    };

    if (editingSale) {
      updateMutation.mutate({ id: editingSale.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, title: string) => {
    if (window.confirm(`Delete flash sale campaign "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCatalog = productsData.filter((p: any) => 
    !formData.selected_products.some(sp => sp.product_id === p.id) &&
    (p.name_en?.toLowerCase().includes(productSearch.toLowerCase()) || 
     p.slug?.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-amber-500">
              <Flame className="w-6 h-6" />
            </div>
            <span>Flash Sales & Limited Time Offers</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
            Manage real-time countdown flash sales, deal prices, and inventory limits across Bangladesh
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="clay-btn-primary px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Flash Sale</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="clay-card rounded-3xl p-6 h-64 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : salesData.length === 0 ? (
        <div className="clay-card rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl clay-inset flex items-center justify-center mx-auto text-muted-foreground">
            <Zap className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-base text-foreground">No Flash Sales Created Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Launch a high-conversion flash deal campaign with discounted products and countdown urgency.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="clay-btn-primary px-6 py-2.5 rounded-2xl text-xs font-black inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Campaign</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {salesData.map((sale: any) => {
            const products = sale.products || [];
            const isLive = Boolean(sale.is_active);
            const startDate = sale.starts_at ? new Date(sale.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Immediate';
            const endDate = sale.ends_at ? new Date(sale.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Ongoing';

            return (
              <div key={sale.id} className="clay-card rounded-3xl p-6 sm:p-7 space-y-5 relative overflow-hidden flex flex-col justify-between">
                
                {/* Top Badge & Title */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 ${
                      isLive 
                        ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Flame className="w-3 h-3" />
                      <span>{isLive ? 'ACTIVE DEAL' : 'PAUSED'}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleMutation.mutate(sale.id)}
                        className="text-[11px] font-bold px-3 py-1 rounded-xl clay-btn text-muted-foreground hover:text-foreground"
                        title="Toggle Active Status"
                      >
                        {isLive ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => openEditModal(sale)}
                        className="p-2 rounded-xl clay-btn text-primary hover:bg-primary/10 transition-all"
                        title="Edit Campaign"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sale.id, sale.title_en)}
                        className="p-2 rounded-xl clay-btn text-red-500 hover:bg-red-500/10 transition-all"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-foreground">{sale.title_en}</h2>
                    {sale.title_bn && (
                      <p className="text-xs text-muted-foreground font-semibold">{sale.title_bn}</p>
                    )}
                  </div>
                </div>

                {/* Timeline & Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="clay-inset rounded-2xl p-3 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary" /> Start Date
                    </div>
                    <div className="font-mono font-bold text-foreground">{startDate}</div>
                  </div>
                  <div className="clay-inset rounded-2xl p-3 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-500" /> End Date
                    </div>
                    <div className="font-mono font-bold text-foreground">{endDate}</div>
                  </div>
                </div>

                {/* Attached Products List Preview */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                      <span>{products.length} Campaign Product{products.length !== 1 ? 's' : ''}</span>
                    </span>
                    <span className="text-[11px] text-primary font-mono font-bold">
                      Slug: /{sale.slug}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {products.map((p: any, idx: number) => {
                      const specPrice = p.pivot?.special_price || p.base_price * 0.8;
                      const origPrice = p.base_price || 0;
                      const discountPct = origPrice > 0 ? Math.round(((origPrice - specPrice) / origPrice) * 100) : 0;

                      return (
                        <div key={idx} className="flex items-center justify-between clay-inset rounded-xl px-3 py-2 text-xs">
                          <span className="font-medium text-foreground truncate max-w-[200px]">
                            {p.name_en}
                          </span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="line-through text-muted-foreground text-[11px]">
                              {formatBDT(origPrice)}
                            </span>
                            <span className="font-black text-primary">
                              {formatBDT(specPrice)}
                            </span>
                            {discountPct > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-600 text-[10px] font-black">
                                -{discountPct}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE & EDIT FLASH SALE MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl neu-card-inset flex items-center justify-center text-amber-500">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground">
                    {editingSale ? 'Edit Flash Sale Campaign' : 'Create New Flash Sale Campaign'}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Configure campaign dates, product discounts, and stock allocations
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Campaign Title (EN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eid Mega Flash Deals"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    className="w-full px-4 py-2.5 neu-input text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Campaign Title (বাংলা)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমনঃ ঈদ মেগা ফ্ল্যাশ সেল"
                    value={formData.title_bn}
                    onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                    className="w-full px-4 py-2.5 neu-input text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Campaign Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-4 py-2.5 neu-input text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Campaign End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-4 py-2.5 neu-input text-xs font-medium"
                  />
                </div>
              </div>

              {/* Product Inclusion Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                    <span>Attach Products to Flash Sale ({formData.selected_products.length})</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Set exclusive flash sale prices
                  </span>
                </div>

                {/* Product Search & Dropdown Picker */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Search catalog products to attach..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 neu-input text-xs font-medium"
                    />
                  </div>

                  {productSearch.trim() && filteredCatalog.length > 0 && (
                    <div className="neu-card-inset rounded-2xl max-h-40 overflow-y-auto p-2 space-y-1 divide-y divide-border/40">
                      {filteredCatalog.slice(0, 8).map((prod: any) => (
                        <div key={prod.id} className="flex items-center justify-between p-2 text-xs">
                          <div>
                            <div className="font-bold text-foreground">{prod.name_en}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              Base: {formatBDT(prod.base_price || 0)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              addProductToDeal(prod.id);
                              setProductSearch('');
                            }}
                            className="neu-btn-primary px-3 py-1 rounded-xl text-[11px] font-bold"
                          >
                            + Add to Deal
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Products Table / List */}
                {formData.selected_products.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {formData.selected_products.map((p, idx) => {
                      const discountPct = p.base_price > 0 ? Math.round(((p.base_price - p.special_price) / p.base_price) * 100) : 0;

                      return (
                        <div key={p.product_id} className="neu-card-inset rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                          <div className="font-bold text-foreground truncate max-w-[200px]">
                            {p.name}
                            <span className="block text-[10px] font-mono text-muted-foreground">
                              Base: {formatBDT(p.base_price)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            <div>
                              <span className="text-[10px] text-muted-foreground block font-bold">Deal Price (৳)</span>
                              <input
                                type="number"
                                required
                                min={1}
                                value={p.special_price}
                                onChange={(e) => updateProductDeal(idx, 'special_price', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 neu-input text-xs font-mono font-bold text-primary"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-muted-foreground block font-bold">Qty Cap</span>
                              <input
                                type="number"
                                min={1}
                                value={p.quantity_limit}
                                onChange={(e) => updateProductDeal(idx, 'quantity_limit', parseInt(e.target.value) || 50)}
                                className="w-16 px-2 py-1 neu-input text-xs font-mono"
                              />
                            </div>

                            <span className="px-2 py-1 rounded-lg bg-red-500/15 text-red-600 font-mono font-black text-xs">
                              -{discountPct}%
                            </span>

                            <button
                              type="button"
                              onClick={() => removeProductFromDeal(idx)}
                              className="p-1.5 text-red-500 hover:text-red-700 neu-btn rounded-xl"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="neu-card-inset rounded-2xl p-4 text-center text-xs text-muted-foreground">
                    Search and pick products from catalog above to include in this deal.
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="neu-card-inset p-3 rounded-2xl flex items-center gap-3 cursor-pointer">
                <input
                  id="flash_sale_active_checkbox"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
                />
                <label htmlFor="flash_sale_active_checkbox" className="text-xs font-bold text-foreground cursor-pointer select-none">
                  Publish campaign as active deal immediately
                </label>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={closeModal}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="neu-btn-primary px-7 py-2.5 text-xs font-black shadow-lg disabled:opacity-60 cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingSale ? 'Update Campaign' : 'Publish Flash Sale'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
