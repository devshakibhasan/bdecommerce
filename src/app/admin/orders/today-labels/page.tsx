'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ScanBarcode, Printer, RefreshCw, Package, Clock, ShieldCheck, Tag
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatBDT } from '@/utils/currency';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { BarcodePrintModal } from '@/components/admin/BarcodePrintModal';


function TrackingInput({ row, onSuccess }: { row: any, onSuccess: () => void }) {
  const [val, setVal] = useState(row.tracking_code || '');
  const [saving, setSaving] = useState(false);

  // Sync state if external polling updates it
  useMemo(() => {
    setVal(row.tracking_code || '');
  }, [row.tracking_code]);

  const save = async (newVal: string) => {
    if (newVal === (row.tracking_code || '')) return;
    setSaving(true);
    try {
      await api.put(`/admin/orders/${row.id}`, { tracking_code: newVal });
      toast.success(`Tracking saved for ${row.order_number}`);
      onSuccess();
    } catch (err: any) {
      toast.error('Failed to save tracking code');
      setVal(row.tracking_code || '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        placeholder="Enter Tracking ID..."
        className="text-[11px] font-mono bg-muted px-2 py-1.5 rounded-md text-foreground font-bold border border-transparent focus:border-primary focus:outline-none w-36 disabled:opacity-50"
        disabled={saving}
      />
      {saving && <RefreshCw className="w-3 h-3 absolute right-2 animate-spin text-muted-foreground" />}
    </div>
  );
}

export default function TodayLabelsPage() {
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeOrders, setBarcodeOrders] = useState<any[]>([]);

  // Fetch today's orders (up to 500 to allow printing all at once)
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-orders', 'today-labels'],
    queryFn: async () => {
      const res: any = await api.get('/admin/orders?date=today&per_page=500');
      return res.data;
    },
    refetchInterval: 3000,
  });

  const orders = data?.data || [];

  const handlePrintAll = () => {
    if (orders.length === 0) {
      toast.error('No orders today to print.');
      return;
    }
    
    const readyOrders = orders.filter((o: any) => o.consignment?.consignment_id || o.tracking_code);
    const missingTracking = orders.filter((o: any) => !o.consignment?.consignment_id && !o.tracking_code);
    
    if (readyOrders.length === 0) {
      toast.error('No orders have tracking codes yet. Please update Live Tracking Code / Consignment ID first.');
      return;
    }

    if (missingTracking.length > 0) {
      toast.success(`Printing ${readyOrders.length} labels. Skipped ${missingTracking.length} missing tracking.`);
    }

    setBarcodeOrders(readyOrders);
    setIsBarcodeModalOpen(true);
  };

  const handlePrintSingle = (row: any) => {
    const trackingCode = row.consignment?.consignment_id || row.tracking_code;
    if (!trackingCode) {
      toast.error("Update Live Tracking Code / Consignment ID first");
      return;
    }
    setBarcodeOrders([row]);
    setIsBarcodeModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-3xl shadow-sm border border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
            <ScanBarcode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Today's Order Labels</h1>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {orders.length} orders placed or processed today. Print thermal stickers for dispatch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 neu-btn rounded-xl text-muted-foreground hover:text-primary transition-all"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handlePrintAll}
            className="neu-btn-primary px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print ALL Today's Labels ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase font-black border-b border-border">
              <tr>
                <th className="px-6 py-4">Order & Source</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Tracking Code</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground font-medium">
                    Loading today's orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No orders found for today.</p>
                  </td>
                </tr>
              ) : (
                orders.map((row: any) => (
                  <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-foreground">
                        {row.order_number}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                        {row.source === 'landing_page' ? <Tag className="w-3 h-3 text-amber-500" /> : <ShieldCheck className="w-3 h-3 text-primary" />}
                        {row.source === 'landing_page' ? 'Landing Page' : (row.source || 'Web')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{row.customer_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{row.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {row.consignment?.consignment_id ? (
                        <span className="text-[11px] font-mono bg-muted px-2 py-1 rounded-md text-foreground font-bold inline-block">
                          {row.consignment.consignment_id} (API)
                        </span>
                      ) : (
                        <TrackingInput row={row} onSuccess={refetch} />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <OrderStatusBadge status={row.fulfillment_status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handlePrintSingle(row)}
                        className="p-1.5 neu-btn rounded-xl text-primary hover:text-primary transition-all text-xs font-bold flex items-center gap-1 cursor-pointer ml-auto"
                        title="Print Thermal Sticker"
                      >
                        <ScanBarcode className="w-3.5 h-3.5" /> 
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isBarcodeModalOpen && (
        <BarcodePrintModal
          isOpen={isBarcodeModalOpen}
          onClose={() => setIsBarcodeModalOpen(false)}
          orders={barcodeOrders}
        />
      )}
    </div>
  );
}
