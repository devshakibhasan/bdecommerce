'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SMSGatewaysPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-settings-sms-gateways'],
    queryFn: async () => {
      const res: any = await api.get('/admin/settings/sms-gateways');
      return res.data?.data || res.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res: any = await api.post('/admin/settings/sms-gateways', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('SMS Gateways created!');
      queryClient.invalidateQueries({ queryKey: ['admin-settings-sms-gateways'] });
      setShowModal(false);
      setFormData({});
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error saving');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/settings/sms-gateways/${id}`);
    },
    onSuccess: () => {
      toast.success('Deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-settings-sms-gateways'] });
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
          <h1 className="text-2xl font-bold tracking-tight">SMS Gateways</h1>
          <p className="text-muted-foreground">Manage your sms gateways</p>
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
                <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Provider</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Sender ID</th>
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
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs uppercase">{item.provider}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.sender_id || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded text-xs ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
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
              <h2 className="text-lg font-semibold">Add New SMS Gateways</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
        <div>
            <label className="block text-sm font-medium mb-1">Gateway Provider</label>
            <select 
                className="w-full p-2 border rounded-md" 
                value={formData.provider || ''} 
                onChange={e => setFormData({...formData, provider: e.target.value})}
                required={true}
            >
                <option value="">Select Gateway Provider</option>
                <option value="sslwireless">SSL Wireless</option>
<option value="twilio">Twilio</option>
<option value="btrac">B-Trac SMS</option>
            </select>
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">API / Auth Key</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.api_key || ''} 
                onChange={e => setFormData({...formData, api_key: e.target.value})}
                required={false}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Sender ID (Masking)</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.sender_id || ''} 
                onChange={e => setFormData({...formData, sender_id: e.target.value})}
                required={false}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Endpoint URL</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.base_url || ''} 
                onChange={e => setFormData({...formData, base_url: e.target.value})}
                required={false}
            />
        </div>

        <div className="flex items-center gap-2">
            <input 
                type="checkbox" 
                checked={formData.is_active || false} 
                onChange={e => setFormData({...formData, is_active: e.target.checked})}
            />
            <label className="text-sm font-medium">Enable this Gateway</label>
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
