'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatBDT } from '@/utils/currency';
import { 
  Boxes, AlertTriangle, XCircle, CheckCircle2, 
  Search, Plus, Minus, RefreshCw, Layers, Edit, Trash2,
  PackagePlus, Filter, X, ArrowUpRight, Barcode, Scale,
  Tag, DollarSign, Check, SlidersHorizontal
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface VariantItem {
  id: number;
  product_id: number;
  product?: {
    id: number;
    name_en: string;
    name_bn: string;
    slug: string;
    sku: string;
    price: number;
    category?: {
      id: number;
      name_en: string;
      name_bn: string;
    };
  };
  sku: string;
  barcode?: string;
  color?: string;
  size?: string;
  weight_grams?: number;
  price: number;
  cost_price?: number;
  stock: number;
  reserved_stock?: number;
  low_stock_threshold: number;
  available_stock: number;
  is_active: boolean;
  is_low_stock: boolean;
}

export default function AdminInventoryPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, low_stock, out_of_stock, in_stock
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkRestockOpen, setIsBulkRestockOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VariantItem | null>(null);
  const [selectedForBulk, setSelectedForBulk] = useState<number[]>([]);
  const [bulkAddUnits, setBulkAddUnits] = useState(10);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    product_id: '',
    sku: '',
    barcode: '',
    color: '',
    size: '',
    weight_grams: '',
    price: '',
    cost_price: '',
    stock: '',
    low_stock_threshold: '10',
    is_active: true,
  });

  // Fetch Inventory Data
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-inventory', page, search, filter],
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', String(page));
        queryParams.append('per_page', '30');
        if (search.trim()) queryParams.append('search', search.trim());
        if (filter !== 'all') queryParams.append('filter', filter);

        const res: any = await api.get(`/admin/inventory?${queryParams.toString()}`);
        if (res?.data) {
          const items: VariantItem[] = Array.isArray(res.data) 
            ? res.data 
            : (res.data.items || res.data.data || []);
          
          return {
            items,
            summary: res.data.summary || {
              total_items: 0,
              total_skus: 0,
              low_stock_count: 0,
              out_of_stock_count: 0,
            },
            pagination: res.data.pagination || res.data.meta || {
              total: items.length,
              current_page: page,
              last_page: 1,
            }
          };
        }
      } catch (err) {
        /* silenced */
      }

      return {
        items: [],
        summary: { total_items: 0, total_skus: 0, low_stock_count: 0, out_of_stock_count: 0 },
        pagination: { total: 0, current_page: 1, last_page: 1 }
      };
    }
  });

  // Fetch Products for the Add Variant Modal
  const { data: productsData = [] } = useQuery({
    queryKey: ['admin-products-for-inventory'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/products?per_page=100');
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  // Adjust Stock Mutation (+ / - delta)
  const adjustMutation = useMutation({
    mutationFn: async ({ id, delta }: { id: number; delta: number }) => {
      return await api.post(`/admin/inventory/${id}/adjust`, { delta });
    },
    onSuccess: () => {
      toast.success('Stock adjusted');
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to adjust stock');
    }
  });

  // Update Direct Stock Mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: number; stock: number }) => {
      return await api.put(`/admin/inventory/${id}/stock`, { stock });
    },
    onSuccess: () => {
      toast.success('Stock level saved');
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save stock');
    }
  });

  // Create Variant Mutation (CRUD: Create)
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        product_id: parseInt(formData.product_id),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim() || null,
        color: formData.color.trim() || null,
        size: formData.size.trim() || null,
        weight_grams: formData.weight_grams ? parseInt(formData.weight_grams) : null,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        stock: parseInt(formData.stock) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
        is_active: formData.is_active,
      };
      return await api.post('/admin/inventory', payload);
    },
    onSuccess: () => {
      toast.success('New product variant added to inventory!');
      setIsAddModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to add variant');
    }
  });

  // Update Variant Mutation (CRUD: Update)
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVariant) return;
      const payload = {
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim() || null,
        color: formData.color.trim() || null,
        size: formData.size.trim() || null,
        weight_grams: formData.weight_grams ? parseInt(formData.weight_grams) : null,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        stock: parseInt(formData.stock) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
        is_active: formData.is_active,
      };
      return await api.put(`/admin/inventory/${selectedVariant.id}`, payload);
    },
    onSuccess: () => {
      toast.success('Product variant updated successfully!');
      setIsEditModalOpen(false);
      setSelectedVariant(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update variant');
    }
  });

  // Delete Variant Mutation (CRUD: Delete)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/admin/inventory/${id}`);
    },
    onSuccess: () => {
      toast.success('Variant removed from inventory');
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete variant');
    }
  });

  // Bulk Restock Mutation
  const bulkRestockMutation = useMutation({
    mutationFn: async () => {
      const items = selectedForBulk.map(id => ({ id, add_stock: bulkAddUnits }));
      return await api.post('/admin/inventory/bulk-restock', { items });
    },
    onSuccess: () => {
      toast.success(`Successfully restocked ${selectedForBulk.length} variants!`);
      setIsBulkRestockOpen(false);
      setSelectedForBulk([]);
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to bulk restock');
    }
  });

  const resetForm = () => {
    setFormData({
      product_id: '',
      sku: '',
      barcode: '',
      color: '',
      size: '',
      weight_grams: '',
      price: '',
      cost_price: '',
      stock: '',
      low_stock_threshold: '10',
      is_active: true,
    });
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (variant: VariantItem) => {
    setSelectedVariant(variant);
    setFormData({
      product_id: String(variant.product_id || ''),
      sku: variant.sku || '',
      barcode: variant.barcode || '',
      color: variant.color || '',
      size: variant.size || '',
      weight_grams: variant.weight_grams ? String(variant.weight_grams) : '',
      price: String(variant.price || ''),
      cost_price: variant.cost_price ? String(variant.cost_price) : '',
      stock: String(variant.stock || 0),
      low_stock_threshold: String(variant.low_stock_threshold || 10),
      is_active: variant.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number, sku: string) => {
    if (window.confirm(`Are you sure you want to delete or deactivate variant "${sku}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const toggleSelectAll = () => {
    if (selectedForBulk.length === items.length) {
      setSelectedForBulk([]);
    } else {
      setSelectedForBulk(items.map(i => i.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedForBulk.includes(id)) {
      setSelectedForBulk(selectedForBulk.filter(x => x !== id));
    } else {
      setSelectedForBulk([...selectedForBulk, id]);
    }
  };

  const summary = data?.summary || { total_items: 0, total_skus: 0, low_stock_count: 0, out_of_stock_count: 0 };
  const items: VariantItem[] = data?.items || [];
  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary">
              <Boxes className="w-6 h-6" />
            </div>
            <span>Stock & Inventory Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time multi-variant inventory control, instant restock, variant CRUD, and low stock threshold alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {selectedForBulk.length > 0 && (
            <button 
              onClick={() => setIsBulkRestockOpen(true)}
              className="clay-btn bg-primary/20 text-primary font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Bulk Restock ({selectedForBulk.length})</span>
            </button>
          )}

          <button 
            onClick={openAddModal}
            className="clay-btn bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Variant</span>
          </button>

          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-inventory'] })}
            className="clay-btn px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh Stock</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter('all')}
          className={`clay-card rounded-3xl p-5 space-y-1 cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-primary' : ''}`}
        >
          <div className="text-xs font-bold text-muted-foreground">Total Stock Units</div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">{summary.total_items.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Layers className="w-3 h-3 text-primary" />
            <span>Across all warehouses</span>
          </div>
        </div>

        <div className="clay-card rounded-3xl p-5 space-y-1">
          <div className="text-xs font-bold text-muted-foreground">Active Variant SKUs</div>
          <div className="text-2xl sm:text-3xl font-black text-primary">{summary.total_skus.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">Unique SKU variants</div>
        </div>

        <div 
          onClick={() => setFilter('low_stock')}
          className={`clay-card rounded-3xl p-5 space-y-1 cursor-pointer transition-all ${filter === 'low_stock' ? 'ring-2 ring-amber-500 bg-amber-500/5' : ''}`}
        >
          <div className="text-xs font-bold text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Warning</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">{summary.low_stock_count}</div>
          <div className="text-[11px] text-muted-foreground">Stock &le; Threshold</div>
        </div>

        <div 
          onClick={() => setFilter('out_of_stock')}
          className={`clay-card rounded-3xl p-5 space-y-1 cursor-pointer transition-all ${filter === 'out_of_stock' ? 'ring-2 ring-red-500 bg-red-500/5' : ''}`}
        >
          <div className="text-xs font-bold text-red-600 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Out of Stock</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600">{summary.out_of_stock_count}</div>
          <div className="text-[11px] text-muted-foreground">Needs urgent replenishment</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="clay-card rounded-3xl p-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 items-center">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search by SKU, product name, barcode, color, or size..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none"
          />
        </div>

        <div className="sm:col-span-1 md:col-span-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'all' ? 'clay-chip-active text-primary font-black' : 'clay-chip text-muted-foreground'
            }`}
          >
            All ({summary.total_skus})
          </button>
          <button
            type="button"
            onClick={() => setFilter('low_stock')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'low_stock' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/40 font-black' : 'clay-chip text-muted-foreground'
            }`}
          >
            Low Stock ({summary.low_stock_count})
          </button>
          <button
            type="button"
            onClick={() => setFilter('out_of_stock')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'out_of_stock' ? 'bg-red-500/20 text-red-600 border border-red-500/40 font-black' : 'clay-chip text-muted-foreground'
            }`}
          >
            Out of Stock ({summary.out_of_stock_count})
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_stock')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'in_stock' ? 'clay-chip-active text-primary font-black' : 'clay-chip text-muted-foreground'
            }`}
          >
            In Stock
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="clay-card rounded-3xl overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={items.length > 0 && selectedForBulk.length === items.length}
                    onChange={toggleSelectAll}
                    className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 font-bold">SKU & Barcode</th>
                <th className="px-3 py-3 font-bold">Product Title & Category</th>
                <th className="px-3 py-3 font-bold">Variant Specs</th>
                <th className="px-3 py-3 font-bold">Price & Cost</th>
                <th className="px-3 py-3 font-bold text-center">Stock Level</th>
                <th className="px-3 py-3 font-bold text-center">Quick Adjust</th>
                <th className="px-3 py-3 font-bold text-center">Direct Stock</th>
                <th className="px-3 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <Boxes className="w-8 h-8 text-primary animate-bounce" />
                      <span>Loading inventory matrix...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No matching inventory SKUs found. Click &quot;Add New Variant&quot; above to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const stock = Number(item.stock || 0);
                  const threshold = Number(item.low_stock_threshold || 10);
                  const isLow = stock <= threshold && stock > 0;
                  const isOut = stock <= 0;
                  const isSelected = selectedForBulk.includes(item.id);

                  return (
                    <tr key={item.id} className={`hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelectOne(item.id)}
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* SKU */}
                      <td className="px-3 py-3 font-mono font-bold text-foreground">
                        <div className="bg-muted/70 px-2 py-1 rounded-lg text-xs inline-block">
                          {item.sku}
                        </div>
                        {item.barcode && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Barcode className="w-3 h-3 text-primary" />
                            <span>{item.barcode}</span>
                          </div>
                        )}
                      </td>

                      {/* Product Name */}
                      <td className="px-3 py-3">
                        <div className="font-bold text-foreground max-w-[200px] truncate text-sm">
                          {item.product?.name_en || 'Product Variant'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.product?.category?.name_en || 'General Category'}
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.color && (
                            <span className="px-2 py-0.5 rounded-md clay-inset text-[10px] font-bold">
                              Color: {item.color}
                            </span>
                          )}
                          {item.size && (
                            <span className="px-2 py-0.5 rounded-md clay-inset text-[10px] font-bold text-primary">
                              Size: {item.size}
                            </span>
                          )}
                          {item.weight_grams && item.weight_grams > 0 ? (
                            <span className="px-2 py-0.5 rounded-md clay-inset text-[10px] font-bold text-amber-600">
                              {item.weight_grams}g
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3">
                        <div className="font-bold text-foreground">{formatBDT(item.price || 0)}</div>
                        {item.cost_price ? (
                          <div className="text-[10px] text-muted-foreground">Cost: {formatBDT(item.cost_price)}</div>
                        ) : null}
                      </td>

                      {/* Stock Level Pill */}
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                          isOut 
                            ? 'bg-red-500/15 text-red-600 border border-red-500/20' 
                            : isLow 
                            ? 'bg-amber-500/15 text-amber-600 border border-amber-500/20' 
                            : 'bg-primary/15 text-primary border border-primary/20'
                        }`}>
                          {isOut ? <XCircle className="w-3.5 h-3.5" /> : isLow ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {stock} Units
                        </span>
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="px-3 py-3 text-center">
                        <div className="inline-flex items-center gap-1 clay-inset p-1 rounded-2xl">
                          <button
                            type="button"
                            disabled={stock <= 0}
                            onClick={() => adjustMutation.mutate({ id: item.id, delta: -5 })}
                            className="px-1.5 py-0.5 clay-btn rounded-xl text-[10px] font-bold text-red-500 hover:bg-red-500/10 disabled:opacity-30"
                            title="Decrease 5"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            disabled={stock <= 0}
                            onClick={() => adjustMutation.mutate({ id: item.id, delta: -1 })}
                            className="p-1 clay-btn rounded-xl text-red-500 hover:bg-red-500/10 disabled:opacity-30"
                            title="Decrease 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold px-1.5 text-xs min-w-[28px] text-center">
                            {stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustMutation.mutate({ id: item.id, delta: 1 })}
                            className="p-1 clay-btn rounded-xl text-primary hover:bg-primary/10"
                            title="Increase 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustMutation.mutate({ id: item.id, delta: 5 })}
                            className="px-1.5 py-0.5 clay-btn rounded-xl text-[10px] font-bold text-primary hover:bg-primary/10"
                            title="Increase 5"
                          >
                            +5
                          </button>
                        </div>
                      </td>

                      {/* Direct Set */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          key={`${item.id}-${stock}`}
                          defaultValue={stock}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val !== stock) {
                              updateStockMutation.mutate({ id: item.id, stock: val });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseInt((e.target as HTMLInputElement).value);
                              if (!isNaN(val) && val !== stock) {
                                updateStockMutation.mutate({ id: item.id, stock: val });
                              }
                            }
                          }}
                          className="w-16 px-2 py-1.5 clay-input rounded-xl text-xs font-bold text-center"
                          min={0}
                        />
                      </td>

                      {/* Actions (Edit / Delete) */}
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 clay-btn rounded-xl text-muted-foreground hover:text-primary transition-colors"
                            title="Edit Variant Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.sku)}
                            className="p-2 clay-btn rounded-xl text-muted-foreground hover:text-red-500 transition-colors"
                            title="Delete Variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Variant Modal */}
      {isAddModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
          className="fixed inset-0 z-50 neu-backdrop flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 neu-modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl neu-card-inset flex items-center justify-center text-primary">
                  <PackagePlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Add Product Variant</h3>
                  <p className="text-xs text-muted-foreground">Attach a new SKU, size, color & stock to a catalog product</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Select Catalog Product *</label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const prod = productsData.find((p: any) => String(p.id) === pid);
                    setFormData(prev => ({
                      ...prev,
                      product_id: pid,
                      sku: prod ? `${prod.sku || 'PROD'}-${Date.now().toString(36).slice(-4).toUpperCase()}` : prev.sku,
                      price: prod ? String(prod.price || '') : prev.price,
                    }));
                  }}
                  className="w-full px-4 py-3 neu-input text-xs font-semibold"
                >
                  <option value="">-- Choose Product --</option>
                  {productsData.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name_en} ({formatBDT(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">SKU Code *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. PANJ-BLUE-XL"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 neu-input text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Barcode / EAN-13</label>
                  <input
                    type="text"
                    placeholder="e.g. 8901234567890"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-3 neu-input text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Color, Size & Weight */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Maroon"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-3 neu-input text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Size / Spec</label>
                  <input
                    type="text"
                    placeholder="e.g. XL / 42"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-3 neu-input text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Weight (Grams)</label>
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    value={formData.weight_grams}
                    onChange={(e) => setFormData({ ...formData, weight_grams: e.target.value })}
                    className="w-full px-3 py-3 neu-input text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Price & Cost Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Selling Price (৳) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="2450.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 neu-input text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Cost Price (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1800.00"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-4 py-3 neu-input text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Initial Stock & Low Stock Threshold */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Initial Stock Quantity *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 neu-input text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                    className="w-full px-4 py-3 neu-input text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-black shadow-lg flex items-center gap-2"
                >
                  {createMutation.isPending ? 'Adding Variant...' : 'Create Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {isEditModalOpen && selectedVariant && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
          className="fixed inset-0 z-50 neu-backdrop flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 neu-modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl neu-card-inset flex items-center justify-center text-primary">
                  <Edit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Edit Variant: {selectedVariant.sku}</h3>
                  <p className="text-xs text-muted-foreground">Update specifications, pricing, stock levels and alerts</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
              {/* SKU & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">SKU Code *</label>
                  <input
                    required
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3.5 py-2 neu-input text-xs font-bold text-foreground font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Barcode / EAN</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    className="w-full px-3.5 py-2 neu-input text-xs font-mono text-foreground focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Price & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Selling Price (৳) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3.5 py-2 neu-input text-xs font-black text-foreground focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Cost Price (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                    className="w-full px-3.5 py-2 neu-input text-xs font-semibold text-foreground focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Stock Management */}
              <div className="p-4 rounded-2xl neu-card-inset space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Inventory Levels</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">On-Hand Quantity *</label>
                    <input
                      required
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                      className="w-full px-3.5 py-2 neu-input text-xs font-black text-primary focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Low-Stock Alert Threshold</label>
                    <input
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                      className="w-full px-3.5 py-2 neu-input text-xs font-semibold text-foreground focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="edit_is_active" className="text-xs font-bold text-foreground cursor-pointer">
                  Variant is Active & Purchaseable
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Restock Modal */}
      {isBulkRestockOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBulkRestockOpen(false);
          }}
          className="fixed inset-0 z-50 neu-backdrop flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 neu-modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl neu-card-inset flex items-center justify-center text-primary">
                  <PackagePlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Bulk Restock</h3>
                  <p className="text-xs text-muted-foreground">Add stock to {selectedForBulk.length} selected variants</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkRestockOpen(false)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Units to Add to Each Variant</label>
                <input
                  type="number"
                  min="1"
                  value={bulkAddUnits}
                  onChange={(e) => setBulkAddUnits(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 neu-input text-sm font-bold text-center"
                />
              </div>

              <div className="flex gap-2">
                {[5, 10, 25, 50, 100].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setBulkAddUnits(qty)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${bulkAddUnits === qty ? 'neu-tile-active' : 'neu-tile-inactive'}`}
                  >
                    +{qty}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsBulkRestockOpen(false)}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => bulkRestockMutation.mutate()}
                  disabled={bulkRestockMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-black shadow-lg flex items-center gap-2"
                >
                  {bulkRestockMutation.isPending ? 'Restocking...' : `Add +${bulkAddUnits} Units Each`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}