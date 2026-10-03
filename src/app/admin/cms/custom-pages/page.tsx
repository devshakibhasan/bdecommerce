'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Trash2, Edit3, Code } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomPagesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-custom-pages'],
    queryFn: async () => {
      const res: any = await api.get('/admin/cms/custom-pages');
      return res.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res: any = await api.post('/admin/cms/custom-pages', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Page created!');
      queryClient.invalidateQueries({ queryKey: ['admin-custom-pages'] });
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error saving');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res: any = await api.put(`/admin/cms/custom-pages/${data.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Page updated!');
      queryClient.invalidateQueries({ queryKey: ['admin-custom-pages'] });
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error updating');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/cms/custom-pages/${id}`);
    },
    onSuccess: () => {
      toast.success('Deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-custom-pages'] });
    }
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (item: any) => {
    setFormData(item);
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setFormData({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Pages Builder</h1>
          <p className="text-muted-foreground">Design and manage static pages using HTML/CSS</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="neu-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Page
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">Loading pages...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">No pages built yet. Click 'Create New Page' to start!</div>
        ) : (
          items.map((item: any) => (
            <div key={item.id} className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col group">
              <div className="h-32 bg-muted/30 border-b flex items-center justify-center relative">
                <Code className="w-8 h-8 text-muted-foreground/50" />
                {!item.is_published && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded">Draft</span>
                )}
                {item.is_published && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded">Live</span>
                )}
              </div>
              <div className="p-4 flex-1">
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">/{item.slug}</p>
              </div>
              <div className="p-4 border-t bg-muted/10 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(item)} className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                  <Edit3 className="w-4 h-4" /> Edit Code
                </button>
                <button onClick={() => { if(confirm('Are you sure?')) deleteMutation.mutate(item.id) }} className="text-red-500 hover:bg-red-50 p-2 rounded-full">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                {isEditing ? 'Edit Page Code' : 'Create Custom Page'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b grid grid-cols-2 gap-4 bg-background z-10 relative">
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Page Title</label>
                  <input type="text" className="w-full p-2 text-sm border rounded-md" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. About Us" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">URL Slug</label>
                  <input type="text" className="w-full p-2 text-sm border rounded-md" value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="about-us (auto-generates if empty)" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="is_published" checked={formData.is_published || false} onChange={e => setFormData({...formData, is_published: e.target.checked})} />
                  <label htmlFor="is_published" className="text-sm font-medium">Publish this page immediately</label>
                </div>
              </div>

              <div className="flex-1 p-4 bg-slate-900 overflow-hidden flex flex-col relative">
                <div className="absolute top-2 right-6 bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded">RAW HTML/CSS INJECTION</div>
                <textarea 
                  className="w-full h-full bg-transparent text-green-400 font-mono text-sm outline-none resize-none" 
                  value={formData.raw_html || ''} 
                  onChange={e => setFormData({...formData, raw_html: e.target.value})}
                  placeholder="<!-- Write your custom HTML & inline CSS styles here -->&#10;<div class='my-custom-container'>&#10;   <h1>Hello World</h1>&#10;</div>"
                />
              </div>

              <div className="p-4 border-t bg-background flex justify-end gap-3 z-10 relative">
                <button type="button" onClick={closeModal} className="px-6 py-2 border rounded-md hover:bg-muted font-medium text-sm">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="neu-btn-primary px-6 py-2">
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save & Compile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
