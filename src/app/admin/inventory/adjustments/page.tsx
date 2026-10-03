'use client';
import { Plus, SlidersHorizontal, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdjustmentsPage() {
  const queryClient = useQueryClient();
  const { data: adjs = [], isLoading } = useQuery({
    queryKey: ['admin-inventory-adjustments'],
    queryFn: async () => {
      const res: any = await api.get('/admin/inventory-adjustments');
      return res.data || [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/inventory-adjustments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-adjustments'] });
      toast.success('Adjustment deleted');
    },
    onError: () => toast.error('Failed to delete adjustment')
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this adjustment?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-primary" /> Quantity Adjustments
        </h1>
        <Link href="/admin/inventory/adjustments/create" className="neu-btn-primary flex items-center gap-2 px-4 py-2">
          <Plus className="w-4 h-4" /> Add Adjustment
        </Link>
      </div>

      <div className="bg-white dark:bg-[#111622] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
           <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : adjs.length === 0 ? (
           <div className="p-12 text-center text-slate-500">
             <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-300 mb-3" />
             <p className="font-bold">No adjustments found.</p>
           </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr><th className="p-4">Ref No.</th><th className="p-4">Date</th><th className="p-4">Warehouse</th><th className="p-4">Items Changed</th><th className="p-4">Note</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {adjs.map((a: any) => (
                <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="p-4 font-bold font-mono">{a.reference_no}</td>
                  <td className="p-4 text-slate-500 text-xs">{a.created_at ? format(new Date(a.created_at), 'PP p') : '—'}</td>
                  <td className="p-4 font-bold">{a.warehouse}</td>
                  <td className="p-4">
                     <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold text-xs">{a.items?.length || 0} Products</span>
                  </td>
                  <td className="p-4 text-xs text-slate-500 max-w-[150px] truncate">{a.note || '—'}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                      <Trash2 className="w-4 h-4" />
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