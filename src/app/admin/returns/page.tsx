'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeftRight, Check, X, Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/admin/Modal';
import { formatBDT } from '@/utils/currency';

export default function ReturnsPage() {
  const queryClient = useQueryClient();
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', admin_notes: '', refund_amount: 0 });

  const { data: returnsData, isLoading } = useQuery({
    queryKey: ['admin-returns'],
    queryFn: async () => {
      const res: any = await api.get('/admin/returns');
      return res.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await api.put(`/admin/returns/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Return status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
      setStatusModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  });

  const handleStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReturn) {
      updateMutation.mutate({ id: selectedReturn.id, data: statusForm });
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'processed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const returns = returnsData?.data || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-rose-600 font-black">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Returns (RMA)</h1>
            <p className="text-xs text-slate-500 font-medium">Manage customer return requests and refunds.</p>
          </div>
        </div>
      </div>

      <div className="clay-card rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Loading returns...</div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No Returns Found</h3>
            <p className="text-sm text-slate-500">You don't have any pending return requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 tracking-wider font-black">
                <tr>
                  <th className="px-6 py-4">Return #</th>
                  <th className="px-6 py-4">Order #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {returns.map((ret: any) => (
                  <tr key={ret.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {ret.return_number}
                      <div className="text-[10px] text-slate-500 font-normal">{new Date(ret.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-primary font-bold">
                      {ret.order?.order_code || `ID: ${ret.order_id}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{ret.user?.name || 'Guest'}</div>
                      <div className="text-[10px] text-slate-500">{ret.user?.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] truncate text-slate-700 dark:text-slate-300" title={ret.return_reason}>
                        {ret.return_reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusColor(ret.status)}`}>
                        {ret.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => {
                          setSelectedReturn(ret);
                          setStatusForm({
                            status: ret.status,
                            admin_notes: ret.admin_notes || '',
                            refund_amount: ret.refund_amount || 0
                          });
                          setStatusModalOpen(true);
                        }}
                        className="p-2 neu-inset rounded-xl text-primary hover:text-primary/80 transition-colors mx-auto"
                        title="Update Status"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="Update Return Request">
        {selectedReturn && (
          <form onSubmit={handleStatusChange} className="space-y-5">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-500 mb-1">Return Reason</div>
              <p className="text-sm text-slate-900 dark:text-white font-medium">{selectedReturn.return_reason}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Update Status</label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                className="w-full mt-1.5 px-4 py-3 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none font-bold"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved (Awaiting Item)</option>
                <option value="processed">Processed (Refunded)</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {(statusForm.status === 'processed' || statusForm.status === 'approved') && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Refund Amount (BDT)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={statusForm.refund_amount}
                  onChange={(e) => setStatusForm({ ...statusForm, refund_amount: Number(e.target.value) })}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none font-black text-rose-600"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Admin Notes (Internal)</label>
              <textarea
                value={statusForm.admin_notes}
                onChange={(e) => setStatusForm({ ...statusForm, admin_notes: e.target.value })}
                className="w-full mt-1.5 px-4 py-3 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none min-h-[100px]"
                placeholder="Notes about condition, refund transaction ID, etc."
              />
            </div>

            <button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="w-full neu-btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Return Status'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
