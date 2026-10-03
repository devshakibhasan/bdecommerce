'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '@/components/admin/DataTable';
import { 
  Plus, FolderTree, Edit, Trash2, X, Sparkles, 
  Layers, CheckCircle2, ChevronRight, Search, UploadCloud, Loader2
} from 'lucide-react';
import { Category } from '@/types';
import { api } from '@/lib/api';
import { syncEntityInCache, addEntityToCache, removeEntityFromCache } from '@/lib/cacheSync';
import { formatImageUrl } from '@/utils/image';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    name_en: '',
    name_bn: '',
    slug: '',
    parent_id: '',
    position: 0,
    icon: '📦',
    is_featured: false,
    show_home: false,
    show_menu: true,
    css_class: 'style1',
    delete_banner: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Fetch Categories
  const { data: categories = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/categories');
        const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
        const flatten = (arr: any[], parentName = ''): any[] => {
            return arr.reduce((acc, cat) => {
                const flatCat = { ...cat, parentName };
                acc.push(flatCat);
                if (cat.children && cat.children.length > 0) {
                    acc = acc.concat(flatten(cat.children, cat.name_en));
                }
                return acc;
            }, []);
        };
        return flatten(items);
      } catch (err) {
        return [];
      }
    }
  });

  const filteredCategories = categories.filter(c => 
    c.name_en.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      return await api.post('/admin/categories', payload);
    },
    onSuccess: () => {
      toast.success('Category created successfully!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to create category')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: FormData }) => {
      payload.append('_method', 'PUT');
      return await api.post(`/admin/categories/${id}`, payload);
    },
    onSuccess: () => {
      toast.success('Category updated successfully!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to update category')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setSelectedIds([]); // clear selection if deleted
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to delete category')
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string, ids: number[] }) => {
      return await api.post(`/admin/categories/bulk-update`, {
        action: action,
        category_ids: ids
      });
    },
    onSuccess: () => {
      toast.success('Bulk update successful');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setSelectedIds([]);
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to bulk update')
  });

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCategories.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one category');
      return;
    }
    bulkUpdateMutation.mutate({ action, ids: selectedIds });
  };

  // Handlers
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name_en: '', name_bn: '', slug: '', parent_id: '', position: categories.length,
      icon: '📦', is_featured: false, show_home: false, show_menu: true, css_class: 'style1', delete_banner: false,
    });
    setImageFile(null); setBannerFile(null); setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name_en: cat.name_en || '', name_bn: cat.name_bn || '', slug: cat.slug || '', parent_id: cat.parent_id || '',
      position: cat.position || 0, icon: cat.icon || '📦', is_featured: cat.is_featured || false,
      show_home: cat.show_home || false, show_menu: cat.show_menu === undefined ? true : cat.show_menu,
      css_class: cat.css_class || 'style1', delete_banner: false,
    });
    setImageFile(null); setBannerFile(null); setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);
  const closeImportModal = () => { setIsImportModalOpen(false); setImportFile(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalSlug = formData.slug || (formData.name_en ? formData.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');
    const payload = new FormData();
    payload.append('name_en', formData.name_en);
    if(formData.name_bn) payload.append('name_bn', formData.name_bn);
    payload.append('slug', finalSlug);
    payload.append('parent_id', formData.parent_id ? formData.parent_id.toString() : '');
    payload.append('position', formData.position.toString());
    payload.append('is_featured', formData.is_featured ? '1' : '0');
    payload.append('show_home', formData.show_home ? '1' : '0');
    payload.append('show_menu', formData.show_menu ? '1' : '0');
    payload.append('css_class', formData.css_class || '');
    payload.append('delete_banner', formData.delete_banner ? '1' : '0');
    if(imageFile) payload.append('image', imageFile);
    if(bannerFile) payload.append('banner_image', bannerFile);

    if (editingCategory) updateMutation.mutate({ id: editingCategory.id, payload });
    else createMutation.mutate(payload);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      toast.success("Import feature triggered (Requires backend implementation for parsing CSV)");
      closeImportModal();
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) deleteMutation.mutate(id);
  };

  // Columns definition
  const columns: Column<any>[] = [
    {
      key: 'checkbox',
      label: (
        <input 
          type="checkbox" 
          className="rounded border-slate-300 w-4 h-4 text-primary focus:ring-primary cursor-pointer"
          checked={filteredCategories.length > 0 && selectedIds.length === filteredCategories.length}
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
      key: 'name_en', 
      label: 'Category', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
             {row.image ? <img src={formatImageUrl(row.image)} className="w-full h-full object-cover" /> : <span className="text-xl">{row.icon || '📦'}</span>}
          </div>
          <div>
            <span className="font-bold text-sm block">{row.name_en}</span>
            <span className="text-[10px] font-mono text-slate-500">ID: {row.id}</span>
          </div>
        </div>
      )
    },
    { key: 'parent_id', label: 'Parent Category', render: (row) => <span className="text-xs">{row.parentName || 'N/A'}</span> },
    { key: 'css_class', label: 'Class', render: (row) => <span className="text-xs text-slate-500">{row.css_class || 'style1'}</span> },
    { key: 'products_count', label: 'Number of Product', render: (row) => <span className="font-bold text-xs">{row.products_count ?? 0}</span> },
    { key: 'stock_quantity', label: 'Stock Quantity', render: (row) => <span className="text-xs">{row.stock_quantity ?? '—'}</span> },
    { key: 'stock_worth', label: 'Stock Worth', render: (row) => <span className="text-xs text-slate-500">{row.stock_worth ? `BDT ${row.stock_worth}` : '—'}</span> },
    { 
      key: 'status', 
      label: 'Active', 
      render: (row) => (
        <div className="flex gap-1 flex-wrap w-24">
           {row.show_home && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">Home</span>}
           {row.show_menu && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold">Menu</span>}
           {row.is_featured && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-bold">Popular</span>}
        </div>
      )
    },
    { key: 'position', label: 'Priority', render: (row) => <span className="font-mono font-bold text-xs">{row.position ?? 0}</span> },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => openEditModal(row)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"><Edit className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(row.id, row.name_en)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-16 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary"><FolderTree className="w-6 h-6" /></div>
            Categories
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Organize your product catalog</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button onClick={() => handleBulkAction('active_home')} disabled={bulkUpdateMutation.isPending} className="px-3 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 disabled:opacity-50">Active Home</button>
          <button onClick={() => handleBulkAction('deactive_home')} disabled={bulkUpdateMutation.isPending} className="px-3 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 disabled:opacity-50">De-Active Home</button>
          <button onClick={() => handleBulkAction('active_menu')} disabled={bulkUpdateMutation.isPending} className="px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 disabled:opacity-50">Active Menu</button>
          <button onClick={() => handleBulkAction('deactive_menu')} disabled={bulkUpdateMutation.isPending} className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50">De-Active Menu</button>
          <button onClick={() => handleBulkAction('popular_active')} disabled={bulkUpdateMutation.isPending} className="px-3 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 disabled:opacity-50">Popular Active</button>
          <button onClick={() => handleBulkAction('popular_deactive')} disabled={bulkUpdateMutation.isPending} className="px-3 py-2 bg-pink-50 text-pink-600 border border-pink-200 rounded-lg text-xs font-bold hover:bg-pink-100 disabled:opacity-50">Popular De-Active</button>

          <button onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-1.5"><FolderTree className="w-3.5 h-3.5" /> Import Category</button>
          <button onClick={openCreateModal} className="clay-btn-primary px-5 py-2.5 rounded-lg flex items-center gap-2 font-black text-xs"><Plus className="w-4 h-4" /> Add Category</button>
        </div>
      </div>

      {selectedIds.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-between">
              <span>{selectedIds.length} categories selected</span>
              <button onClick={() => setSelectedIds([])} className="text-xs underline">Clear Selection</button>
          </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-[#111622] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-primary"
          />
        </div>
        <span className="text-xs text-slate-500 font-bold">{filteredCategories.length} categories found</span>
      </div>

      <DataTable data={filteredCategories} columns={columns} isLoading={isLoading} />

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between p-6 border-b bg-slate-50/50">
              <h2 className="text-xl font-black">{editingCategory ? 'Update Category' : 'Add Category'}</h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Name *</label>
                  <input required type="text" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Name (Bangla)</label>
                  <input type="text" value={formData.name_bn} onChange={e => setFormData({...formData, name_bn: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Slug</label>
                  <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Auto-generated if empty" className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Parent Category</label>
                  <select value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl">
                    <option value="">No Parent</option>
                    {categories.filter(c => c.id !== editingCategory?.id).map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Priority</label>
                  <input type="number" value={formData.position} onChange={e => setFormData({...formData, position: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">CSS Class</label>
                  <input type="text" value={formData.css_class} onChange={e => setFormData({...formData, css_class: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Image</label>
                  <div className="flex items-center gap-3">
                    {(imageFile || editingCategory?.image) && (
                       <img src={imageFile ? URL.createObjectURL(imageFile) : (editingCategory.image.startsWith('http') ? editingCategory.image : `http://localhost:8000/storage/${editingCategory.image}`)} alt="Preview" className="w-10 h-10 rounded-lg object-cover border" />
                    )}
                    <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Banner Image</label>
                  <div className="flex items-center gap-3">
                    {(bannerFile || (editingCategory?.banner_image && !formData.delete_banner)) && (
                       <img src={bannerFile ? URL.createObjectURL(bannerFile) : (editingCategory.banner_image.startsWith('http') ? editingCategory.banner_image : `http://localhost:8000/storage/${editingCategory.banner_image}`)} alt="Banner Preview" className="w-16 h-10 rounded-lg object-cover border" />
                    )}
                    <div className="w-full">
                      <input type="file" accept="image/*" onChange={e => setBannerFile(e.target.files?.[0] || null)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                      {editingCategory?.banner_image && !bannerFile && (
                        <div className="flex items-center gap-2 mt-2">
                           <input type="checkbox" checked={formData.delete_banner} onChange={e => setFormData({...formData, delete_banner: e.target.checked})} className="rounded text-primary"/>
                           <label className="text-xs text-red-500 font-bold cursor-pointer" onClick={() => setFormData({...formData, delete_banner: !formData.delete_banner})}>Delete existing banner</label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Toggles */}
                <div className="col-span-1 md:col-span-2 flex flex-wrap gap-4 pt-4 border-t">
                  <label className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border cursor-pointer hover:bg-slate-100 transition-colors">
                      <input type="checkbox" checked={formData.show_home} onChange={e => setFormData({...formData, show_home: e.target.checked})} className="w-4 h-4 rounded text-primary"/>
                      <span className="text-sm font-bold">Show on Home</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border cursor-pointer hover:bg-slate-100 transition-colors">
                      <input type="checkbox" checked={formData.show_menu} onChange={e => setFormData({...formData, show_menu: e.target.checked})} className="w-4 h-4 rounded text-primary"/>
                      <span className="text-sm font-bold">Show on Menu</span>
                  </label>
                  <label className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border cursor-pointer hover:bg-slate-100 transition-colors">
                      <input type="checkbox" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} className="w-4 h-4 rounded text-primary"/>
                      <span className="text-sm font-bold">Popular Category</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-8 mt-4 border-t">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-bold hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="clay-btn-primary px-8 py-2.5 rounded-xl font-black flex items-center gap-2">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCategory ? 'Update Category' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between p-6 border-b bg-slate-50/50">
              <h2 className="text-xl font-black">Import Category</h2>
              <button onClick={closeImportModal} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleImportSubmit} className="p-6">
              <p className="text-sm text-slate-600 mb-6">The correct column order is (name*, parent_category) and you must follow this.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Upload CSV File *</label>
                  <input required type="file" accept=".csv" onChange={e => setImportFile(e.target.files?.[0] || null)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold ml-1">Sample File</label>
                  <button type="button" className="w-full bg-cyan-100 text-cyan-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-cyan-200 transition-colors flex justify-center items-center gap-2">
                      <UploadCloud className="w-4 h-4" /> Download Sample
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-8 mt-4 border-t">
                <button type="button" onClick={closeImportModal} className="px-6 py-2.5 rounded-xl font-bold hover:bg-slate-100">Cancel</button>
                <button type="submit" className="clay-btn-primary px-8 py-2.5 rounded-xl font-black flex items-center gap-2">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}