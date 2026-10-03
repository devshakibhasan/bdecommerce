'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Tag, Plus, Trash2, Edit, X, Check, 
  Sparkles, Layers, Package, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminTagsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);

  const [formData, setFormData] = useState({
    name_en: '',
    name_bn: '',
    slug: '',
  });

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/tags');
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/admin/tags', payload),
    onSuccess: () => {
      toast.success('Tag created successfully!');
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => toast.error('Failed to create tag')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => api.put(`/admin/tags/${id}`, data),
    onSuccess: () => {
      toast.success('Tag updated successfully!');
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => toast.error('Failed to update tag')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/tags/${id}`),
    onSuccess: () => {
      toast.success('Tag deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => toast.error('Failed to delete tag')
  });

  const openCreateModal = () => {
    setEditingTag(null);
    setFormData({ name_en: '', name_bn: '', slug: '' });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setEditingTag(t);
    setFormData({
      name_en: t.name_en || '',
      name_bn: t.name_bn || '',
      slug: t.slug || ''
    });
    setIsEditModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      name_en: val,
      slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }));
  };

  const filteredTags = tags.filter((t: any) => 
    (t.name_en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.name_bn || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Tag className="w-6 h-6 text-primary" />
            <span>Product Marketing Tags & Badges</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage promotional badges, campaign tags, and filter keywords across catalog items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111622] border rounded-2xl text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tag</span>
          </button>
        </div>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-400 font-bold">
            Loading tags...
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#111622] rounded-3xl p-12 text-center space-y-3 border">
            <Tag className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">No Tags Found</h3>
            <p className="text-xs text-slate-500">Create promotional badges like 'Hot Deal', 'New Arrival', or 'Eid Special'.</p>
          </div>
        ) : (
          filteredTags.map((tag: any) => (
            <div
              key={tag.id}
              className="bg-white dark:bg-[#111622] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-primary/40 transition-all"
            >
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">{tag.name_en}</h3>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">{tag.name_bn || tag.name_en}</div>
                <div className="text-[10px] text-primary font-mono font-bold">{tag.products_count || 0} Linked Products</div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(tag)}
                  className="p-1.5 text-slate-400 hover:text-primary rounded-xl transition-colors cursor-pointer"
                  title="Edit Tag"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete tag "${tag.name_en}"?`)) {
                      deleteMutation.mutate(tag.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl transition-colors cursor-pointer"
                  title="Delete Tag"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreateModalOpen(false);
              setIsEditModalOpen(false);
            }
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-3">
              <h3 className="font-black text-base text-foreground">
                {isEditModalOpen ? 'Edit Marketing Tag' : 'Create Marketing Tag'}
              </h3>
              <button
                onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!formData.name_en.trim()) {
                  toast.error('Tag name is required');
                  return;
                }
                if (isEditModalOpen) {
                  updateMutation.mutate({ id: editingTag.id, data: formData });
                } else {
                  createMutation.mutate(formData);
                }
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eid Special / Best Seller"
                  value={formData.name_en}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 neu-input text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Name (Bengali)</label>
                <input
                  type="text"
                  placeholder="যেমন: ঈদ স্পেশাল"
                  value={formData.name_bn}
                  onChange={(e) => setFormData(p => ({ ...p, name_bn: e.target.value }))}
                  className="w-full px-3.5 py-2.5 neu-input text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))}
                  className="w-full px-3.5 py-2.5 neu-input text-xs font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                  className="neu-btn-secondary px-4 py-2 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="neu-btn-primary px-5 py-2 font-bold text-xs"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
