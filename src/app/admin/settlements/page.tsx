'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Wallet, Upload, Search, Calendar, FileText, 
  TrendingUp, CheckCircle2, Clock, Trash2, Edit, X, RefreshCw, AlertTriangle, Truck
} from 'lucide-react';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminSettlementsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'hub' | 'unsettled'>('hub');
  
  // Reconciliations Hub State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [courierName, setCourierName] = useState('Steadfast');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // 1. Fetch Reconciliation History
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['admin-reconciliations'],
    queryFn: async () => {
      const res: any = await api.get('/admin/courier-reconciliations');
      return res?.data?.data || res?.data || [];
    }
  });

  // 2. Fetch Unsettled Parcels
  const { data: unsettledData, isLoading: isLoadingUnsettled } = useQuery({
    queryKey: ['admin-reconciliations-unsettled'],
    queryFn: async () => {
      const res: any = await api.get('/admin/courier-reconciliations/unsettled');
      return res?.data?.data || res?.data || null;
    }
  });

  // 3. Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res: any = await api.post('/admin/courier-reconciliations/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data: any) => {
      toast.success(data.message || 'Reconciliation processed successfully!');
      setIsUploadModalOpen(false);
      setCsvFile(null);
      queryClient.invalidateQueries({ queryKey: ['admin-reconciliations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reconciliations-unsettled'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to upload reconciliation file');
    }
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }
    const formData = new FormData();
    formData.append('csv_file', csvFile);
    formData.append('courier_name', courierName);
    uploadMutation.mutate(formData);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-primary font-black">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Courier Reconciliation Hub</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Match payout sheets, flag discrepancies, and track aging unsettled parcels.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="neu-btn-primary px-5 py-3 rounded-2xl text-xs font-black flex items-center justify-center w-full md:w-auto gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Payout Sheet</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-border">
        <button
          onClick={() => setActiveTab('hub')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'hub' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Reconciliation History
        </button>
        <button
          onClick={() => setActiveTab('unsettled')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'unsettled' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Aging Unsettled Parcels
        </button>
      </div>

      {activeTab === 'hub' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="clay-card p-6 rounded-3xl text-center">
              <div className="w-10 h-10 neu-inset rounded-full mx-auto flex items-center justify-center text-primary mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-muted-foreground">Total Reconciled</h3>
              <p className="text-2xl font-black text-foreground mt-1">
                {historyData?.length || 0} Batches
              </p>
            </div>
          </div>

          <div className="clay-card rounded-3xl overflow-hidden">
            {isLoadingHistory ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse font-semibold">Loading history...</div>
            ) : historyData?.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-black text-foreground">No Reconciliations Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Upload a Steadfast or Pathao payout CSV sheet to begin tracking discrepancies and marking orders as settled.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-bold">Date & ID</th>
                      <th className="px-6 py-4 font-bold">Courier</th>
                      <th className="px-6 py-4 font-bold text-right">Items Matched</th>
                      <th className="px-6 py-4 font-bold text-right">Total Settlement</th>
                      <th className="px-6 py-4 font-bold text-right">Discrepancies</th>
                      <th className="px-6 py-4 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historyData?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">
                            {new Date(item.created_at).toLocaleDateString('en-GB')}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {item.batch_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-primary">
                          {item.courier_name}
                        </td>
                        <td className="px-6 py-4 text-right font-black">
                          {item.items_count || 0}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-primary">
                          {formatBDT(item.total_settled_amount || 0)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-amber-500">
                          {item.discrepancies_count || 0}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link 
                            href={`/admin/settlements/${item.id}`}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            View Report
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'unsettled' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="clay-card p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900">
              <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400">Total Unsettled Parcels (&gt;2 Days)</h3>
              <p className="text-3xl font-black text-amber-700 dark:text-amber-500 mt-2">
                {unsettledData?.count || 0}
              </p>
            </div>
            <div className="clay-card p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900">
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">Total Trapped COD (Approx)</h3>
              <p className="text-3xl font-black text-rose-700 dark:text-rose-500 mt-2">
                {formatBDT(unsettledData?.total_pending_cod || 0)}
              </p>
            </div>
          </div>

          <div className="clay-card rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Aging Unsettled Ledger</span>
              </h3>
            </div>
            {isLoadingUnsettled ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse font-semibold">Loading unsettled...</div>
            ) : unsettledData?.count === 0 ? (
              <div className="p-8 text-center text-primary font-bold">All delivered & transit parcels are currently settled!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-bold">Order #</th>
                      <th className="px-6 py-4 font-bold">Courier & Tracking</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Age (Days)</th>
                      <th className="px-6 py-4 font-bold text-right">Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {unsettledData?.orders?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">
                          <Link href={`/admin/orders/${item.id}`} className="hover:text-primary">
                            {item.order_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-primary">{item.courier_name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{item.tracking_code || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            item.fulfillment_status === 'delivered' ? 'bg-primary/20 text-primary' : 'bg-cyan-100 text-cyan-700'
                          }`}>
                            {item.fulfillment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-black ${
                            item.days_pending > 5 ? 'text-rose-500' : 'text-amber-500'
                          }`}>
                            {item.days_pending} days
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-foreground">
                          {formatBDT(item.total_payable)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] neu-backdrop flex items-center justify-center p-4">
          <div className="neu-modal rounded-3xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload Payout Sheet
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="neu-close-btn">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Select Courier</label>
                <select 
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full mt-1 p-3 neu-input rounded-xl font-bold cursor-pointer"
                >
                  <option value="Steadfast">Steadfast Courier</option>
                  <option value="Pathao">Pathao Courier</option>
                  <option value="RedX">RedX Logistics</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">CSV File</label>
                <input 
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full mt-1 p-3 neu-input rounded-xl text-sm"
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                  CSV must contain: tracking_code, collected_amount, cod_charge, delivery_charge
                </p>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 neu-btn rounded-xl font-bold text-xs">Cancel</button>
                <button type="submit" disabled={uploadMutation.isPending} className="px-4 py-2 neu-btn-primary rounded-xl font-black text-xs">
                  {uploadMutation.isPending ? 'Processing...' : 'Upload & Reconcile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
