'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Plus, Edit, Trash2, X, CheckCircle2, Search, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatImageUrl } from '@/utils/image';
import toast from 'react-hot-toast';

export default function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    name_en: '',
    slug: '',
    is_active: true,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Fetch Brands
  const { data: brands = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      try {
        const res: any = await api.brands.list();
        return Array.isArray(res) ? res : ((res as any).data || []);
      } catch (err) {
        return [];
      }
    }
  });

  const filteredBrands = brands.filter(b => 
    b.name_en.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      return await api.brands.create(payload);
    },
    onSuccess: () => {
      toast.success('Brand created successfully!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to create brand')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: FormData }) => {
      payload.append('_method', 'PUT');
      return await api.brands.update(id, payload);
    },
    onSuccess: () => {
      toast.success('Brand updated successfully!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to update brand')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.brands.delete(id),
    onSuccess: () => {
      toast.success('Brand deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      setSelectedIds([]);
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to delete brand')
  });

  // Handlers
  const openCreateModal = () => {
    setEditingBrand(null);
    setFormData({ name_en: '', slug: '', is_active: true });
    setLogoFile(null); 
    setIsModalOpen(true);
  };

  const openEditModal = (brand: any) => {
    setEditingBrand(brand);
    setFormData({
      name_en: brand.name_en || '', 
      slug: brand.slug || '', 
      is_active: brand.is_active ?? true,
    });
    setLogoFile(null); 
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalSlug = formData.slug || (formData.name_en ? formData.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');
    const payload = new FormData();
    payload.append('name_en', formData.name_en);
    payload.append('slug', finalSlug);
    payload.append('is_active', formData.is_active ? 'true' : 'false');
    if (logoFile) payload.append('logo', logoFile);

    if (editingBrand) updateMutation.mutate({ id: editingBrand.id, payload });
    else createMutation.mutate(payload);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      deleteMutation.mutate(id);
    }
  };

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredBrands.map(b => b.id));
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
          checked={filteredBrands.length > 0 && selectedIds.length === filteredBrands.length}
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
    { 
      key: 'logo', 
      label: 'Logo', 
      render: (row) => (
        <div className="w-10 h-10 rounded-lg border bg-white flex items-center justify-center overflow-hidden">
          {row.logo ? (
            <img src={formatImageUrl(row.logo)} alt={row.name_en} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-slate-400">No Img</span>
          )}
        </div>
      )
    },
    { key: 'name_en', label: 'Brand Name', render: (row) => <span className="font-bold">{row.name_en}</span> },
    { key: 'slug', label: 'Slug', render: (row) => <span className="text-xs text-slate-500">{row.slug}</span> },
    { key: 'products_count', label: 'Products', render: (row) => <span className="font-bold text-xs">{row.products_count ?? 0}</span> },
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
          <button onClick={() => openEditModal(row)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
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
          <h1 className="text-3xl font-black tracking-tight">Brands</h1>
          <p className="text-muted-foreground mt-1">Manage product brands and logos</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openCreateModal} className="clay-btn-primary px-4 py-2.5 rounded-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Brand
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-[#111622] p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search brands by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a2133] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-semibold"
          />
        </div>
        <span className="text-xs font-bold text-slate-500">
          {filteredBrands.length} Brands Found
        </span>
      </div>

      {selectedIds.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-between">
              <span>{selectedIds.length} brands selected</span>
              <button onClick={() => setSelectedIds([])} className="text-xs underline">Clear Selection</button>
          </div>
      )}

      <DataTable data={filteredBrands} columns={columns} isLoading={isLoading} emptyMessage="No brands found" />

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between p-6 border-b bg-slate-50/50">
              <h2 className="text-xl font-black">{editingBrand ? 'Update Brand' : 'Add Brand'}</h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Brand Name *</label>
                  <input required type="text" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Slug</label>
                  <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Auto-generated if empty" className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Logo</label>
                  <div className="flex items-center gap-3">
                    {(logoFile || editingBrand?.logo) && (
                       <img src={logoFile ? URL.createObjectURL(logoFile) : formatImageUrl(editingBrand.logo)} alt="Preview" className="w-12 h-12 rounded-lg object-cover border" />
                    )}
                    <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                  </div>
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
                  {editingBrand ? 'Update Brand' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}