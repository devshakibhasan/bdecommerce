'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, Trash2, ShoppingBag, Building2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Modal } from '@/components/admin/Modal';

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: '',
    advance_paid: 0,
    items: [{ product_id: '', variant_id: '', quantity: 1, unit_price: 0 }]
  });

  // New Supplier Quick Modal State
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    status: 'active'
  });

  const { data: suppliers = [], isLoading: isSuppliersLoading, refetch: refetchSuppliers } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: async () => {
      const res: any = await api.get('/admin/purchases/suppliers');
      const data = res?.data?.data || res?.data || [];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0,
    refetchOnMount: 'always'
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['admin-products-dropdown'],
    queryFn: async () => {
      const res: any = await api.get('/admin/products?per_page=1000');
      const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      return Array.isArray(items) ? items : [];
    }
  });

  // Create Supplier Mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      const res: any = await api.post('/admin/purchases/suppliers', data);
      return res.data;
    },
    onSuccess: (data: any) => {
      const createdSup = data?.data || data;
      toast.success('Supplier added successfully!');
      setIsNewSupplierModalOpen(false);
      setNewSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '', status: 'active' });
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      refetchSuppliers();
      if (createdSup?.id) {
        setForm(prev => ({ ...prev, supplier_id: createdSup.id.toString() }));
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add supplier');
    }
  });

  // Create PO Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const supId = Number(payload.supplier_id);
      if (!supId || isNaN(supId) || supId <= 0) {
        throw new Error('Please select a supplier from the list, or add a new supplier.');
      }

      // Check that the selected supplier exists in the loaded list
      const supplierExists = suppliers.some((s: any) => s.id.toString() === supId.toString());
      if (!supplierExists) {
        throw new Error('The selected supplier is not found in the database. Please select from the dropdown.');
      }

      // Normalize payload
      const cleaned = {
        supplier_id: supId,
        order_date: payload.order_date,
        expected_delivery_date: payload.expected_delivery_date || null,
        notes: payload.notes || null,
        advance_paid: Number(payload.advance_paid) || 0,
        items: payload.items.map((it: any) => ({
          product_id: Number(it.product_id),
          variant_id: it.variant_id ? Number(it.variant_id) : null,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
        }))
      };
      const res: any = await api.post('/admin/purchases/orders', cleaned);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Purchase Order Created Successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-purchases-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      router.push('/admin/purchases');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create PO');
    }
  });

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { product_id: '', variant_id: '', quantity: 1, unit_price: 0 }] });
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    const newItems = [...form.items];
    newItems.splice(index, 1);
    setForm({ ...form, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems: any = [...form.items];
    newItems[index][field] = value;

    // Auto-fill variant and unit price if product is selected
    if (field === 'product_id') {
      const product = products.find((p: any) => p.id.toString() === value.toString());
      if (product) {
        if (product.variants && product.variants.length > 0) {
          // If only 1 variant exists, auto-select it
          if (product.variants.length === 1) {
            newItems[index].variant_id = product.variants[0].id.toString();
            newItems[index].unit_price = Number(product.variants[0].cost_price || product.variants[0].price || product.cost_price || product.base_price || 0);
          } else {
            newItems[index].variant_id = '';
            newItems[index].unit_price = Number(product.cost_price || product.base_price || 0);
          }
        } else {
          newItems[index].variant_id = '';
          newItems[index].unit_price = Number(product.cost_price || product.base_price || 0);
        }
      } else {
        newItems[index].variant_id = '';
        newItems[index].unit_price = 0;
      }
    }

    // Auto-fill unit price if specific variant is selected
    if (field === 'variant_id' && value) {
      const product = products.find((p: any) => p.id.toString() === newItems[index].product_id.toString());
      if (product && product.variants) {
        const variant = product.variants.find((v: any) => v.id.toString() === value.toString());
        if (variant) {
          newItems[index].unit_price = Number(variant.cost_price || variant.price || product.cost_price || product.base_price || 0);
        }
      }
    }

    setForm({ ...form, items: newItems });
  };

  const totalAmount = form.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
  const dueAmount = Math.max(0, totalAmount - Number(form.advance_paid || 0));

  const isFormValid = Boolean(
    form.supplier_id && 
    Number(form.supplier_id) > 0 && 
    form.items.length > 0 && 
    form.items.every(it => it.product_id && it.quantity > 0 && it.unit_price >= 0)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier_id || Number(form.supplier_id) <= 0) {
      toast.error('Please select a supplier from the list.');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/purchases" className="p-2 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-primary" /> Create Purchase Order
            </h1>
            <p className="text-xs text-slate-500 font-medium">Add a new PO to restock product inventory from suppliers.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={createMutation.isPending || !isFormValid}
          className="neu-btn-primary px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Confirm & Create PO
        </button>
      </div>

      {/* Main Form Fields */}
      <div className="clay-card p-6 rounded-3xl space-y-6 bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Supplier *</label>
              <button
                type="button"
                onClick={() => setIsNewSupplierModalOpen(true)}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> New Supplier
              </button>
            </div>
            <select
              required
              value={form.supplier_id}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option value="">{isSuppliersLoading ? 'Loading suppliers...' : 'Select a supplier...'}</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id.toString()}>
                  {s.name} {s.contact_person ? `(${s.contact_person})` : ''} {s.phone ? ` - ${s.phone}` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <div className="mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Order Date *</label>
            </div>
            <input
              required
              type="date"
              value={form.order_date}
              onChange={(e) => setForm({ ...form, order_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expected Delivery Date</label>
            <input
              type="date"
              value={form.expected_delivery_date}
              onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Advance Paid (BDT)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.advance_paid}
              onChange={(e) => setForm({ ...form, advance_paid: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
        </div>
        
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes / Remarks</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none min-h-[70px]"
            placeholder="Any special procurement instructions or invoice references..."
          />
        </div>
      </div>

      {/* Items List */}
      <div className="clay-card p-6 rounded-3xl space-y-4 bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white">Order Items</h3>
            <p className="text-xs text-slate-500">Specify products, sizes/colors, quantity, and agreed purchase price.</p>
          </div>
          <button onClick={addItem} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-5">Product</div>
            <div className="col-span-3">Variant (Size / Color)</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-1 text-right">Cost (BDT)</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          {form.items.map((item, idx) => {
            const selectedProd = products.find((p: any) => p.id.toString() === item.product_id?.toString());
            const hasVariants = selectedProd?.variants && selectedProd.variants.length > 0;

            return (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center px-1">
                {/* Product Dropdown */}
                <div className="col-span-5">
                  <select
                    required
                    value={item.product_id}
                    onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none"
                  >
                    <option value="">{isProductsLoading ? 'Loading products...' : 'Select product...'}</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id.toString()}>{p.name_en || p.name_bn || `Product #${p.id}`}</option>
                    ))}
                  </select>
                </div>

                {/* Variant Dropdown */}
                <div className="col-span-3">
                  {hasVariants ? (
                    <select
                      value={item.variant_id}
                      onChange={(e) => updateItem(idx, 'variant_id', e.target.value)}
                      className="w-full px-2 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none"
                    >
                      <option value="">Default / First Variant</option>
                      {selectedProd.variants.map((v: any) => (
                        <option key={v.id} value={v.id.toString()}>
                          {v.size ? `Size: ${v.size}` : ''} {v.color ? `(${v.color})` : ''} {v.sku ? `[${v.sku}]` : ''} - Stock: {v.stock ?? 0}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic px-2">No variants</span>
                  )}
                </div>

                {/* Quantity */}
                <div className="col-span-1">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    className="w-full px-2 py-2 text-center rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none"
                  />
                </div>

                {/* Unit Price */}
                <div className="col-span-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                    className="w-full px-2 py-2 text-right rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none"
                  />
                </div>

                {/* Row Subtotal */}
                <div className="col-span-1 text-right font-black text-xs text-slate-800 dark:text-slate-200">
                  {(Number(item.quantity || 0) * Number(item.unit_price || 0)).toLocaleString()}
                </div>

                {/* Delete Row */}
                <div className="col-span-1 flex justify-end">
                  <button 
                    type="button"
                    onClick={() => removeItem(idx)} 
                    disabled={form.items.length === 1} 
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial Calculation Cards */}
        <div className="pt-6 mt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total PO Value</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              BDT {totalAmount.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Advance Paid</div>
            <div className="text-xl font-black text-blue-700 dark:text-blue-300">
              BDT {Number(form.advance_paid || 0).toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Payable Due Amount</div>
            <div className="text-xl font-black text-amber-700 dark:text-amber-300">
              BDT {dueAmount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ADD SUPPLIER MODAL */}
      <Modal
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        title="Add New Supplier"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSupplierMutation.mutate(newSupplierForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Supplier Name *</label>
            <input
              required
              type="text"
              value={newSupplierForm.name}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Apex Spinning & Knitting Mills"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Contact Person</label>
            <input
              type="text"
              value={newSupplierForm.contact_person}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contact_person: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Md. Rafiqul Islam"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Phone</label>
              <input
                type="text"
                value={newSupplierForm.phone}
                onChange={(e) => setNewSupplierForm({ ...newSupplierForm, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="017XXXXXXXX"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                value={newSupplierForm.email}
                onChange={(e) => setNewSupplierForm({ ...newSupplierForm, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="supplier@domain.com"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Address / Location</label>
            <textarea
              value={newSupplierForm.address}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, address: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/50 min-h-[60px]"
              placeholder="Factory / Office address"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewSupplierModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSupplierMutation.isPending}
              className="neu-btn-primary px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"
            >
              {createSupplierMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
