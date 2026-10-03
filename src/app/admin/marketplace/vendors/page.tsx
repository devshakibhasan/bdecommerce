'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MultiVendorMarketplacePage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-marketplace-vendors'],
    queryFn: async () => {
      const res: any = await api.get('/admin/marketplace/vendors');
      return res.data?.data || res.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res: any = await api.post('/admin/marketplace/vendors', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Multi-Vendor Marketplace created!');
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-vendors'] });
      setShowModal(false);
      setFormData({});
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error saving');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/marketplace/vendors/${id}`);
    },
    onSuccess: () => {
      toast.success('Deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-vendors'] });
    }
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Multi-Vendor Marketplace</h1>
          <p className="text-muted-foreground">Manage your multi-vendor marketplace</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="neu-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Shop Name</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Owner</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Commission %</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Balance</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No records found.</td></tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.shop_name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.user ? item.user.name : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.commission_rate || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.balance || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs uppercase">{item.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Add New Multi-Vendor Marketplace</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
        <div>
            <label className="block text-sm font-medium mb-1">User ID (Owner)</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.user_id || ''} 
                onChange={e => setFormData({...formData, user_id: e.target.value})}
                required={true}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Shop/Brand Name</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.shop_name || ''} 
                onChange={e => setFormData({...formData, shop_name: e.target.value})}
                required={true}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Shop Slug</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.slug || ''} 
                onChange={e => setFormData({...formData, slug: e.target.value})}
                required={true}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.commission_rate || ''} 
                onChange={e => setFormData({...formData, commission_rate: e.target.value})}
                required={true}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Account Status</label>
            <select 
                className="w-full p-2 border rounded-md" 
                value={formData.status || ''} 
                onChange={e => setFormData({...formData, status: e.target.value})}
                required={true}
            >
                <option value="">Select Account Status</option>
                <option value="pending">Pending</option>
<option value="active">Active</option>
<option value="suspended">Suspended</option>
            </select>
        </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md hover:bg-muted">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="neu-btn-primary">
                  {createMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
