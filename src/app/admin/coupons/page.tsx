'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '@/components/admin/DataTable';
import { 
  Ticket, Plus, Trash2, Edit, X, Search, CheckCircle2, 
  XCircle, Sparkles, Copy, Check, Percent, Tag, 
  Calendar, Flame, DollarSign, Users, Award 
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    type: 'Percentage',
    value: 15,
    min_spend: 1000,
    max_discount: 500,
    starts_at: new Date().toISOString().slice(0, 10),
    ends_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    usage_limit: 1000,
    is_active: true,
  });

  // Fetch Coupons
  const { data: couponsData = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/coupons');
        if (res?.data) {
          return Array.isArray(res.data) 
            ? res.data 
            : (res.data.items || res.data.data || []);
        }
      } catch (err) {
        /* silenced */
        try {
          const pubRes: any = await api.get('/coupons');
          if (pubRes?.data) {
            return Array.isArray(pubRes.data) ? pubRes.data : (pubRes.data.items || pubRes.data.data || []);
          }
        } catch (pubErr) {}
      }
      return [];
    }
  });

  // Create Coupon Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/admin/coupons', payload);
    },
    onSuccess: () => {
      toast.success('Coupon promo created successfully!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to create coupon';
      const validationDetails = err?.errors
        ? '\n' + Object.values(err.errors).flat().join(', ')
        : '';
      toast.error(msg + validationDetails);
    }
  });

  // Update Coupon Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      return await api.put(`/admin/coupons/${id}`, payload);
    },
    onSuccess: () => {
      toast.success('Coupon promo updated!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update coupon');
    }
  });

  // Toggle Status Mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.put(`/admin/coupons/${id}/toggle-status`, {});
    },
    onSuccess: () => {
      toast.success('Coupon status toggled');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to toggle status');
    }
  });

  // Delete Coupon Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/admin/coupons/${id}`);
    },
    onSuccess: () => {
      toast.success('Coupon deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete coupon');
    }
  });

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      type: 'Percentage',
      value: 15,
      min_spend: 1000,
      max_discount: 500,
      starts_at: new Date().toISOString().slice(0, 10),
      ends_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      usage_limit: 1000,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type || 'Percentage',
      value: Number(coupon.value || 0),
      min_spend: Number(coupon.min_spend || 0),
      max_discount: Number(coupon.max_discount || 0),
      starts_at: coupon.valid_from ? new Date(coupon.valid_from).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      ends_at: coupon.valid_until ? new Date(coupon.valid_until).toISOString().slice(0, 10) : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      usage_limit: Number(coupon.usage_limit || 1000),
      is_active: Boolean(coupon.is_active),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon "${code}" copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    const payload = {
      code: formData.code.toUpperCase().trim(),
      type: formData.type,
      value: Number(formData.value),
      min_spend: Number(formData.min_spend) || 0,
      max_discount: Number(formData.max_discount) || null,
      starts_at: formData.starts_at,
      ends_at: formData.ends_at,
      usage_limit: Number(formData.usage_limit) || null,
      is_active: formData.is_active,
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, code: string) => {
    if (window.confirm(`Delete coupon promo "${code}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  // Filtered List
  const filteredCoupons = couponsData.filter((c: any) => 
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.type?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<any>[] = [
    { 
      key: 'code', 
      label: 'Promo Code & Details', 
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-sm text-primary px-3 py-1 rounded-xl clay-inset inline-flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" />
              <span>{row.code}</span>
            </span>
            <button
              onClick={() => handleCopyCode(row.code)}
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Copy Code"
            >
              {copiedCode === row.code ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-2">
            <span>Min Spend: ৳{row.min_spend || 0}</span>
            {row.max_discount && <span>• Max Cap: ৳{row.max_discount}</span>}
          </div>
        </div>
      )
    },
    { 
      key: 'type', 
      label: 'Discount Structure', 
      render: (row) => {
        const typeStr = String(row.type || 'Percentage').toLowerCase();
        const isPct = typeStr.includes('percent');
        return (
          <div className="space-y-1">
            <span className="font-black text-sm text-foreground">
              {isPct ? `${row.value}% Discount` : `৳${row.value} Flat Off`}
            </span>
            <div className="text-[10px] uppercase font-bold text-muted-foreground">
              {typeStr.replace('_', ' ')}
            </div>
          </div>
        );
      }
    },
    { 
      key: 'usage', 
      label: 'Redemptions / Limit', 
      render: (row) => (
        <div className="space-y-1">
          <div className="font-mono font-bold text-xs text-foreground">
            {row.used_count || 0} / {row.usage_limit ? row.usage_limit : '∞ Unlimited'}
          </div>
          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${Math.min(100, ((row.used_count || 0) / (row.usage_limit || 100)) * 100)}%` }} 
            />
          </div>
        </div>
      )
    },
    { 
      key: 'validity', 
      label: 'Validity Window', 
      render: (row) => {
        const until = row.valid_until ? new Date(row.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Expiry';
        return (
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 font-mono">
            <Calendar className="w-3 h-3 text-primary" />
            <span>Until {until}</span>
          </span>
        );
      }
    },
    { 
      key: 'is_active', 
      label: 'Status', 
      render: (row) => (
        <button
          onClick={() => toggleMutation.mutate(row.id)}
          className={`px-3 py-1 rounded-full text-[11px] font-black uppercase transition-all cursor-pointer ${
            row.is_active 
              ? 'bg-primary/15 text-primary border border-primary/30' 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {row.is_active ? 'Active' : 'Disabled'}
        </button>
      )
    },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openEditModal(row)}
            className="p-2 clay-btn rounded-xl text-primary hover:bg-primary/10 transition-all"
            title="Edit Coupon"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id, row.code)}
            className="p-2 clay-btn rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
            title="Delete Coupon"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary">
              <Ticket className="w-6 h-6" />
            </div>
            <span>Coupons & Promotion Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
            Manage promo codes, percentage discounts, flat cashback, and minimum spend rules
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="clay-btn-primary px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Coupon</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center text-primary">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Total Active Coupons</span>
            <h3 className="text-xl font-black text-foreground">{couponsData.filter((c: any) => c.is_active).length} Campaigns</h3>
          </div>
        </div>

        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center text-primary">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Total Redemptions</span>
            <h3 className="text-xl font-black text-foreground">
              {couponsData.reduce((sum: number, c: any) => sum + (c.used_count || 0), 0)} Used
            </h3>
          </div>
        </div>

        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center text-amber-500">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Top Code</span>
            <h3 className="text-xl font-mono font-black text-primary">
              {couponsData[0]?.code || 'EID2026'}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="clay-card rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search promo codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 clay-input rounded-2xl text-xs font-medium"
          />
        </div>
        <span className="text-xs text-muted-foreground font-bold">
          Showing {filteredCoupons.length} of {couponsData.length} coupons
        </span>
      </div>

      {/* Data Table */}
      <div className="clay-card rounded-3xl p-6">
        <DataTable columns={columns} data={filteredCoupons} isLoading={isLoading} />
      </div>

      {/* ========================================================================= */}
      {/* CREATE & EDIT COUPON MODAL */}
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
            className="neu-modal rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl neu-card-inset flex items-center justify-center text-primary">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground">
                    {editingCoupon ? 'Edit Promo Coupon' : 'Create New Promo Coupon'}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Configure discount rules, spend tiers, and usage caps
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Coupon Promo Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER50"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 neu-input text-xs font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 neu-input text-xs font-semibold"
                  >
                    <option value="Percentage">Percentage Discount (%)</option>
                    <option value="Flat">Flat Cash Discount (৳)</option>
                    <option value="MfsDiscount">bKash/Nagad MFS Discount</option>
                    <option value="Bogo">Buy 1 Get 1 (BOGO)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">
                    {formData.type === 'Percentage' ? 'Discount %' : 'Discount ৳'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 neu-input text-xs font-mono font-bold text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">
                    Min Spend (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.min_spend}
                    onChange={(e) => setFormData({ ...formData, min_spend: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 neu-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">
                    Max Cap (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 neu-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-4 py-2.5 neu-input text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-4 py-2.5 neu-input text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Total Redemption Usage Limit
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500 (Leave blank for unlimited)"
                  value={formData.usage_limit || ''}
                  onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 neu-input text-xs font-medium"
                />
              </div>

              <div className="neu-card-inset p-3 rounded-2xl flex items-center gap-3 cursor-pointer">
                <input
                  id="coupon_active_checkbox"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
                />
                <label htmlFor="coupon_active_checkbox" className="text-xs font-bold text-foreground cursor-pointer select-none">
                  Activate coupon immediately for customer checkouts
                </label>
              </div>

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
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
