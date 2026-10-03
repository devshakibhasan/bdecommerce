'use client';
import { Star, MessageSquare, Check, X, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatImageUrl } from '@/utils/image';
import toast from 'react-hot-toast';

export default function ProductReviewsPage() {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const res: any = await api.get('/admin/reviews');
      return res.data || [];
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: number, is_approved: boolean }) => api.put(`/admin/reviews/${id}`, { is_approved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Status updated!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review deleted!');
    },
    onError: () => toast.error('Failed to delete review')
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this review?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-current" /> Customer Reviews
        </h1>
      </div>

      <div className="bg-white dark:bg-[#111622] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
           <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : reviews.length === 0 ? (
           <div className="p-12 text-center text-slate-500">
             <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-3" />
             <p className="font-bold">No reviews found.</p>
           </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr><th className="p-4">Product</th><th className="p-4">Customer</th><th className="p-4">Rating</th><th className="p-4">Comment</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {reviews.map((r: any) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="p-4 flex items-center gap-3">
                    <img src={r.product?.images?.[0]?.image_path ? formatImageUrl(r.product.images[0].image_path) : ''} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                    <div><div className="font-bold text-xs">{r.product?.name_en}</div><div className="text-[10px] text-slate-500">{r.product?.slug}</div></div>
                  </td>
                  <td className="p-4 font-bold">{r.customer_name || 'Anonymous'}</td>
                  <td className="p-4">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                         <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-500 fill-current' : 'text-slate-300'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 max-w-[200px]">
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{r.comment || '—'}</p>
                  </td>
                  <td className="p-4">
                     {r.is_approved ? <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-md">Approved</span> : <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">Pending</span>}
                  </td>
                  <td className="p-4 text-right">
                     <button onClick={() => toggleMutation.mutate({ id: r.id, is_approved: !r.is_approved })} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold mr-2">
                       {r.is_approved ? 'Reject' : 'Approve'}
                     </button>
                     <button onClick={() => handleDelete(r.id)} className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 rounded-lg text-xs font-bold text-red-600">
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}