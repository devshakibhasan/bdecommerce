'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Plus, Edit, Trash2, X, CheckCircle2, Loader2, Search, ArrowLeft, Layers } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminProductTypesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    name_en: '',
    slug: '',
    is_active: true,
  });

  // Fetch Product Types
  const { data: productTypes = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-product-types'],
    queryFn: async () => {
      try {
        const res: any = await api.productTypes.list();
        return Array.isArray(res) ? res : ((res as any).data || []);
      } catch (err) {
        return [];
      }
    }
  });

  const filteredTypes = productTypes.filter(t => 
    t.name_en.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.productTypes.create(payload);
    },
    onSuccess: () => {
      toast.success('Product Type created successfully!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-product-types'] });
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to create product type')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      return await api.productTypes.update(id, payload);
    },
    onSuccess: () => {
      toast.success('Product Type updated successfully!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-product-types'] });
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to update product type')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.productTypes.delete(id),
    onSuccess: () => {
      toast.success('Product Type deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-product-types'] });
      setSelectedIds([]);
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to delete product type')
  });

  // Handlers
  const openCreateModal = () => {
    setEditingType(null);
    setFormData({ name_en: '', slug: '', is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (type: any) => {
    setEditingType(type);
    setFormData({
      name_en: type.name_en || '', 
      slug: type.slug || '', 
      is_active: type.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalSlug = formData.slug || (formData.name_en ? formData.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');
    
    const payload = {
        name_en: formData.name_en,
        slug: finalSlug,
        is_active: formData.is_active
    };

    if (editingType) updateMutation.mutate({ id: editingType.id, payload });
    else createMutation.mutate(payload);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product type?')) {
      deleteMutation.mutate(id);
    }
  };

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredTypes.map(t => t.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Columns definition
  const columns: Column<any>[] = [
    {
      key: 'checkbox',
      label: (
        <input 
          type="checkbox" 
          className="rounded border-slate-300 w-4 h-4 text-primary focus:ring-primary cursor-pointer"
          checked={filteredTypes.length > 0 && selectedIds.length === filteredTypes.length}
          onChange={handleSelectAll}
        />
      ),
      render: (row) => (
        <input 
          type="checkbox" 
          className="rounded border-slate-300 w-4 h-4 text-primary focus:ring-primary cursor-pointer"
          checked={selectedIds.includes(row.id)}
          onChange={() => handleSelectOne(row.id)}
        />
      )
    },
    { key: 'name_en', label: 'Type Name', render: (row) => <span className="font-bold">{row.name_en}</span> },
    { key: 'slug', label: 'Slug', render: (row) => <span className="text-xs text-slate-500">{row.slug}</span> },
    { 
      key: 'products_count', 
      label: 'Products', 
      render: (row) => (
        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300">
          {row.products_count ?? 0} Items
        </span>
      ) 
    },
    { 
      key: 'is_active', 
      label: 'Status', 
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {row.is_active ? <CheckCircle2 className="w-3 h-3"/> : <X className="w-3 h-3"/>}
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(row)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer" title="Edit">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Layers className="w-8 h-8 text-primary" />
            <span>Product Types</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage clothing classifications (e.g. Ethnic Wear, Casual Wear, Formal Wear, Winter Wear)</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openCreateModal} className="clay-btn-primary px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20">
            <Plus className="w-5 h-5" /> Add Type
          </button>
        </div>
      </div>

      {/* Search & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#111622] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search product types by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Link 
          href="/admin/products"
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
        </Link>
      </div>

      {selectedIds.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-between">
              <span>{selectedIds.length} types selected</span>
              <button onClick={() => setSelectedIds([])} className="text-xs underline cursor-pointer">Clear Selection</button>
          </div>
      )}

      <DataTable data={filteredTypes} columns={columns} isLoading={isLoading} emptyMessage="No product types found" />

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between p-6 border-b bg-slate-50/50">
              <h2 className="text-xl font-black">{editingType ? 'Update Product Type' : 'Add Product Type'}</h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Type Name *</label>
                  <input required type="text" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Slug</label>
                  <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Auto-generated if empty" className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <label className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border cursor-pointer hover:bg-slate-100 transition-colors mt-2">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 rounded text-primary"/>
                    <span className="text-sm font-bold">Active Status</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-8 mt-4 border-t">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-bold hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="clay-btn-primary px-8 py-2.5 rounded-xl font-black flex items-center gap-2">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingType ? 'Update Type' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}