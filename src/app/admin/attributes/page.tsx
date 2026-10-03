'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Layers, Plus, Trash2, Edit, X, Check, 
  Palette, Ruler, Cpu, Tag, Sparkles, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAttributesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<any>(null);

  const [formData, setFormData] = useState({
    name_en: '',
    name_bn: '',
    type: 'select',
    values: [{ value_en: '', value_bn: '', color_hex: '' }]
  });

  const { data: attributes = [], isLoading } = useQuery({
    queryKey: ['admin-attributes'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/attributes');
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/admin/attributes', payload),
    onSuccess: () => {
      toast.success('Attribute created successfully!');
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-attributes'] });
    },
    onError: () => toast.error('Failed to create attribute')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => api.put(`/admin/attributes/${id}`, data),
    onSuccess: () => {
      toast.success('Attribute updated successfully!');
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-attributes'] });
    },
    onError: () => toast.error('Failed to update attribute')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/attributes/${id}`),
    onSuccess: () => {
      toast.success('Attribute deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-attributes'] });
    },
    onError: () => toast.error('Failed to delete attribute')
  });

  const openCreateModal = () => {
    setEditingAttr(null);
    setFormData({
      name_en: '',
      name_bn: '',
      type: 'select',
      values: [{ value_en: '', value_bn: '', color_hex: '' }]
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (attr: any) => {
    setEditingAttr(attr);
    setFormData({
      name_en: attr.name_en || '',
      name_bn: attr.name_bn || '',
      type: attr.type || 'select',
      values: attr.values && attr.values.length > 0 
        ? attr.values.map((v: any) => ({
            value_en: v.value_en || '',
            value_bn: v.value_bn || '',
            color_hex: v.color_hex || ''
          }))
        : [{ value_en: '', value_bn: '', color_hex: '' }]
    });
    setIsEditModalOpen(true);
  };

  const handleAddValue = () => {
    setFormData(prev => ({
      ...prev,
      values: [...prev.values, { value_en: '', value_bn: '', color_hex: '' }]
    }));
  };

  const handleRemoveValue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  const handleValueChange = (index: number, field: string, val: string) => {
    setFormData(prev => {
      const next = [...prev.values];
      next[index] = { ...next[index], [field]: val };
      return { ...prev, values: next };
    });
  };

  const filteredAttributes = attributes.filter((a: any) => 
    (a.name_en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.name_bn || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Layers className="w-6 h-6 text-primary" />
            <span>Attributes & Variant Specs</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage global product specifications, color swatches, sizes, and materials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search attributes..."
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
            <span>Add Attribute</span>
          </button>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-400 font-bold">
            Loading attributes...
          </div>
        ) : filteredAttributes.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#111622] rounded-3xl p-12 text-center space-y-4 border">
            <Layers className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">No Attributes Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create global specifications (like Color, Size, Material) to use across all product variant matrices.
            </p>
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl text-xs"
            >
              Create Attribute
            </button>
          </div>
        ) : (
          filteredAttributes.map((attr: any) => (
            <div
              key={attr.id}
              className="bg-white dark:bg-[#111622] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between group hover:border-primary/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-primary/20 dark:bg-primary/10/60 text-primary flex items-center justify-center font-black text-xs">
                      {attr.type === 'color' ? <Palette className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">{attr.name_en}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{attr.name_bn || attr.name_en}</span>
                        <span className="font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{attr.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(attr)}
                      className="p-1.5 text-slate-400 hover:text-primary rounded-xl transition-colors cursor-pointer"
                      title="Edit Attribute"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete attribute "${attr.name_en}"?`)) {
                          deleteMutation.mutate(attr.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl transition-colors cursor-pointer"
                      title="Delete Attribute"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Values list */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {attr.values && attr.values.length > 0 ? (
                    attr.values.map((v: any) => (
                      <span
                        key={v.id || v.value_en}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        {v.color_hex && (
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: v.color_hex }}
                          />
                        )}
                        <span>{v.value_en}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No values defined</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                <span>{attr.values?.length || 0} Options defined</span>
                <span className="text-primary font-bold">Active in Catalog</span>
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
            className="neu-modal rounded-3xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-3">
              <h3 className="font-black text-base text-foreground">
                {isEditModalOpen ? 'Edit Attribute Specification' : 'Create Specification Attribute'}
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
                  toast.error('Attribute name is required');
                  return;
                }
                if (isEditModalOpen) {
                  updateMutation.mutate({ id: editingAttr.id, data: formData });
                } else {
                  createMutation.mutate(formData);
                }
              }} 
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Name (English) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Color / Size / Material"
                    value={formData.name_en}
                    onChange={(e) => setFormData(p => ({ ...p, name_en: e.target.value }))}
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Name (Bengali)</label>
                  <input
                    type="text"
                    placeholder="যেমন: রঙ / সাইজ"
                    value={formData.name_bn}
                    onChange={(e) => setFormData(p => ({ ...p, name_bn: e.target.value }))}
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Display Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 neu-input text-xs font-bold"
                >
                  <option value="select">Dropdown Select</option>
                  <option value="color">Color Swatch (Hex Picker)</option>
                  <option value="button">Button / Pill</option>
                  <option value="radio">Radio Option</option>
                </select>
              </div>

              {/* Dynamic Values */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">Attribute Values</label>
                  <button
                    type="button"
                    onClick={handleAddValue}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Value</span>
                  </button>
                </div>

                <div className="neu-card-inset p-3 rounded-2xl space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formData.values.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Value En (e.g. 128GB or Black)"
                        value={val.value_en}
                        onChange={(e) => handleValueChange(idx, 'value_en', e.target.value)}
                        className="flex-1 px-3 py-2 neu-input text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Value Bn"
                        value={val.value_bn}
                        onChange={(e) => handleValueChange(idx, 'value_bn', e.target.value)}
                        className="w-28 px-3 py-2 neu-input text-xs font-semibold"
                      />
                      {formData.type === 'color' && (
                        <input
                          type="color"
                          value={val.color_hex || '#000000'}
                          onChange={(e) => handleValueChange(idx, 'color_hex', e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border p-0.5"
                          title="Choose Color"
                        />
                      )}
                      {formData.values.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(idx)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Attribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
