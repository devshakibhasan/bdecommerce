'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerComplaintsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-feedback/complaints'],
    queryFn: async () => {
      const res: any = await api.get('/admin/feedback/customer-complaints');
      return res.data?.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res: any = await api.post('/admin/feedback/customer-complaints', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Customer Complaints created!');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback/complaints'] });
      setShowModal(false);
      setFormData({});
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error saving');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/feedback/customer-complaints/${id}`);
    },
    onSuccess: () => {
      toast.success('Deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback/complaints'] });
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
          <h1 className="text-2xl font-bold tracking-tight">Customer Complaints</h1>
          <p className="text-muted-foreground">Manage your customer complaints</p>
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
                <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Ticket ID</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Customer</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Phone</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Subject</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Date</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.ticket_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.customer_phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">{item.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</td>
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
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Add New Customer Complaints</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
        <div>
            <label className="block text-sm font-medium mb-1">Customer Name</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.customer_name || ''} 
                onChange={e => setFormData({...formData, customer_name: e.target.value})}
                required={true}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.customer_phone || ''} 
                onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                required={true}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.subject || ''} 
                onChange={e => setFormData({...formData, subject: e.target.value})}
                required={true}
            />
        </div>

            <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                    className="w-full p-2 border rounded-md" 
                    value={formData.description || ''} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    required={true}
                />
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
