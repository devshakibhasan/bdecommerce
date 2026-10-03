'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  KeyRound, Search, ShieldCheck, CheckCircle2, 
  XCircle, Clock, Smartphone, RefreshCw, Send, Trash2, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOtpLogsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [testData, setTestData] = useState({
    phone: '01712345678',
    purpose: 'customer_login'
  });

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-otp-logs', searchQuery],
    queryFn: async () => {
      try {
        const url = searchQuery ? `/admin/otp-logs?search=${encodeURIComponent(searchQuery)}` : '/admin/otp-logs';
        const res: any = await api.get(url);
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  const sendTestMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/admin/otp-logs/send-test', payload),
    onSuccess: (res: any) => {
      toast.success(res?.data?.message || 'Test OTP dispatched successfully!');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-otp-logs'] });
    },
    onError: () => toast.error('Failed to dispatch test OTP')
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => api.put(`/admin/otp-logs/${id}/status`, {}),
    onSuccess: () => {
      toast.success('OTP status toggled!');
      queryClient.invalidateQueries({ queryKey: ['admin-otp-logs'] });
    },
    onError: () => toast.error('Failed to update status')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/otp-logs/${id}`),
    onSuccess: () => {
      toast.success('OTP log record deleted!');
      queryClient.invalidateQueries({ queryKey: ['admin-otp-logs'] });
    },
    onError: () => toast.error('Failed to delete log')
  });

  const clearOldMutation = useMutation({
    mutationFn: async () => api.post('/admin/otp-logs/clear-old'),
    onSuccess: (res: any) => {
      toast.success(res?.data?.message || 'Old expired OTP logs cleared!');
      queryClient.invalidateQueries({ queryKey: ['admin-otp-logs'] });
    },
    onError: () => toast.error('Failed to clear logs')
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <KeyRound className="w-6 h-6 text-primary" />
            <span>SMS OTP & Authentication Security Logs</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitor real-time SMS one-time passcodes, customer logins, and order verifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>Send Test OTP</span>
          </button>

          <button
            type="button"
            onClick={() => clearOldMutation.mutate()}
            disabled={clearOldMutation.isPending}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Old Logs</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-[#111622] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-[#161d2a]/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="py-3.5 px-4">Recipient Phone</th>
                <th className="py-3.5 px-4">Purpose</th>
                <th className="py-3.5 px-4">Passcode</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Attempts</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                    Loading OTP logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                    No OTP verification logs found. Click "Send Test OTP" to test.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => {
                  const isVerified = Boolean(log.verified_at);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.phone}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold capitalize text-slate-700 dark:text-slate-300">
                        {log.purpose?.replace(/_/g, ' ') || 'Authentication'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black tracking-widest text-primary dark:text-primary">
                        {log.otp_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStatusMutation.mutate(log.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer ${
                            isVerified ? 'bg-primary/20 text-primary' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{isVerified ? 'Verified' : 'Pending'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-bold">{log.attempts || 1} / 3</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this OTP log?')) {
                              deleteMutation.mutate(log.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Test OTP Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-3">
              <h3 className="font-black text-base text-foreground">Dispatch Test SMS OTP</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendTestMutation.mutate(testData);
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Recipient Phone (BD) *</label>
                <input
                  type="tel"
                  required
                  placeholder="01712345678"
                  value={testData.phone}
                  onChange={(e) => setTestData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 neu-input text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Purpose</label>
                <select
                  value={testData.purpose}
                  onChange={(e) => setTestData(p => ({ ...p, purpose: e.target.value }))}
                  className="w-full px-3.5 py-2.5 neu-input text-xs font-bold"
                >
                  <option value="customer_login">Customer Login</option>
                  <option value="order_confirmation">COD Order Confirmation</option>
                  <option value="password_reset">Password Reset</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="neu-btn-secondary px-4 py-2 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendTestMutation.isPending}
                  className="neu-btn-primary px-5 py-2 font-bold text-xs"
                >
                  {sendTestMutation.isPending ? 'Sending...' : 'Send SMS OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
