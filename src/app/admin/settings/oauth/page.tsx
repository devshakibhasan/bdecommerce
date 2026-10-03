'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SocialLoginOAuthPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-settings-oauth'],
    queryFn: async () => {
      const res: any = await api.get('/admin/settings/oauth');
      return res.data?.data || res.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res: any = await api.post('/admin/settings/oauth', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Social Login (OAuth) created!');
      queryClient.invalidateQueries({ queryKey: ['admin-settings-oauth'] });
      setShowModal(false);
      setFormData({});
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error saving');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/settings/oauth/${id}`);
    },
    onSuccess: () => {
      toast.success('Deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-settings-oauth'] });
    }
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Social Login (OAuth)</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="neu-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Provider</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Client ID</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Redirect URL</th>
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
                <tr key={item.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs uppercase">{item.provider}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground max-w-[200px] truncate">{item.client_id || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground max-w-[200px] truncate">{item.redirect_url || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded text-xs ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => { if(confirm('Are you sure?')) deleteMutation.mutate(item.id) }} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b"><h2 className="font-semibold">Add New Social Login (OAuth)</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              
        <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <select 
                className="w-full p-2 border rounded-md" 
                value={formData.provider || ''} 
                onChange={e => setFormData({...formData, provider: e.target.value})}
                required={true}
            >
                <option value="">Select Provider</option>
                <option value="google">Google</option>
<option value="facebook">Facebook</option>
<option value="apple">Apple</option>
            </select>
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Client ID</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.client_id || ''} 
                onChange={e => setFormData({...formData, client_id: e.target.value})}
                required={false}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Client Secret</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.client_secret || ''} 
                onChange={e => setFormData({...formData, client_secret: e.target.value})}
                required={false}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Redirect/Callback URL</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.redirect_url || ''} 
                onChange={e => setFormData({...formData, redirect_url: e.target.value})}
                required={false}
            />
        </div>

        <div className="flex items-center gap-2">
            <input 
                type="checkbox" 
                checked={formData.is_active || false} 
                onChange={e => setFormData({...formData, is_active: e.target.checked})}
            />
            <label className="text-sm font-medium">Enable Login Method</label>
        </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="neu-btn-primary">{createMutation.isPending ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
