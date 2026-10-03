'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReturnsRMAPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-orders/returns'],
    queryFn: async () => {
      const res: any = await api.get('/admin/returns');
      return res.data?.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Basic Quotation payload structure mock for quick creation
      if ('returns' === 'quotations') {
          data.items = [{ product_name: 'Custom Product', quantity: 1, unit_price: data.total_amount || 0 }];
      }
      const res: any = await api.post('/admin/returns', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Returns (RMA) created!');
      queryClient.invalidateQueries({ queryKey: ['admin-orders/returns'] });
      setShowModal(false);
      setFormData({});
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error saving');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/returns/${id}`);
    },
    onSuccess: () => {
      toast.success('Deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-orders/returns'] });
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
          <h1 className="text-2xl font-bold tracking-tight">Returns (RMA)</h1>
          <p className="text-muted-foreground">Manage your returns (rma)</p>
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
                <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Return Number</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Order ID</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Reason</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">Refund</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.return_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.order_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">{item.return_reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">{item.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">৳ {Number(item.refund_amount).toFixed(2)}</td>
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
              <h2 className="text-lg font-semibold">Add New Returns (RMA)</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
        <div>
            <label className="block text-sm font-medium mb-1">Order ID</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.order_id || ''} 
                onChange={e => setFormData({...formData, order_id: e.target.value})}
                required={true}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Reason for Return</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.return_reason || ''} 
                onChange={e => setFormData({...formData, return_reason: e.target.value})}
                required={true}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Refund Amount</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.refund_amount || ''} 
                onChange={e => setFormData({...formData, refund_amount: e.target.value})}
                required={false}
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
