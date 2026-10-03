'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductReviewsPage() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-feedback-reviews'],
    queryFn: async () => {
      const res: any = await api.get('/admin/feedback/product-reviews');
      return res.data?.data || [];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, is_approved }: any) => {
      const res: any = await api.put(`/admin/feedback/product-reviews/${id}`, { is_approved });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Review status updated!');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback-reviews'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/feedback/product-reviews/${id}`);
    },
    onSuccess: () => {
      toast.success('Deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback-reviews'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Reviews</h1>
          <p className="text-muted-foreground">Approve or reject customer reviews</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Review</th>
                <th className="px-6 py-4">Status</th>
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
                    <td className="px-6 py-4">{item.product?.name_en || 'Unknown'}</td>
                    <td className="px-6 py-4 font-medium">{item.customer_name}</td>
                    <td className="px-6 py-4 text-yellow-500 font-bold">{item.rating} / 5</td>
                    <td className="px-6 py-4 max-w-xs truncate">{item.review_text}</td>
                    <td className="px-6 py-4">
                      {item.is_approved ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Approved</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2">
                      {!item.is_approved && (
                        <button 
                          onClick={() => updateMutation.mutate({ id: item.id, is_approved: true })}
                          className="text-green-500 hover:text-green-700 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
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
    </div>
  );
}
