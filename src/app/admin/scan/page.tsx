'use client';

import { useSearchParams } from 'next/navigation';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { ScanBarcode, CheckCircle2, Package, Truck, AlertCircle, Volume2, VolumeX, Keyboard, FileCheck, Undo2, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SmartScannerPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const roles = user?.roles || [];
  const normalized = roles.map(r => r.toLowerCase());
  
  const isSuper = normalized.some(r => r.includes('super_admin') || r === 'admin');
  const isOrderPack = normalized.some(r => r.includes('order') || r.includes('pack'));
  const isDispatch = normalized.some(r => r.includes('dispatch'));
  const isReturns = normalized.some(r => r.includes('return'));

  const canOrderPack = isSuper || isOrderPack;
  const canDispatch = isSuper || isDispatch;
  const canReturn = isSuper || isReturns;
  const canForward = canOrderPack || canDispatch;

  const inputRef = useRef<HTMLInputElement>(null);
  
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    const initialBarcode = searchParams.get('barcode');
    if (initialBarcode) setBarcode(initialBarcode);
  }, [searchParams]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanMode, setScanMode] = useState<'forward' | 'return'>(canForward ? 'forward' : 'return');
  const [history, setHistory] = useState<any[]>([]);

  // Keep input focused so scanner always works
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && document.activeElement !== inputRef.current && document.activeElement?.tagName !== 'INPUT') {
        inputRef.current.focus();
      }
    };
    document.addEventListener('click', focusInput);
    focusInput();
    return () => document.removeEventListener('click', focusInput);
  }, []);

  // Fetch today's stats
  const { data: statsData } = useQuery({
    queryKey: ['scan-stats'],
    refetchInterval: 3000, // REAL-TIME POLLING SYNC
    queryFn: async () => {
      const res: any = await api.get('/admin/orders/scan-stats');
      return res || { stats: null, history: [] };
    }
  });

  // Safely update history using useEffect instead of inside queryFn
  useEffect(() => {
    if (statsData?.history && history.length === 0) {
      setHistory(statsData.history.map((h: any) => ({
        type: 'success',
        action: h.fulfillment_status,
        message: `Loaded previous state: ${h.order_number} (${h.fulfillment_status})`,
        time: new Date().toLocaleTimeString(),
        order: h
      })));
    }
  }, [statsData]);

  const scanMutation = useMutation({
    mutationFn: async (code: string) => {
      const res: any = await api.post('/admin/orders/smart-scan', { barcode: code, mode: scanMode });
      return res;
    },
    onSuccess: (data) => {
      playSound('success');
      toast.success(data.message);
      
      setHistory(prev => [{
        type: 'success',
        action: data.action,
        message: data.message,
        time: new Date().toLocaleTimeString(),
        order: data.order
      }, ...prev].slice(0, 50));

      queryClient.setQueryData(['scan-stats'], (old: any) => ({
        stats: data.stats,
        history: old?.history || []
      }));
      setBarcode('');
      // Invalidate orders list so the main table updates
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => {
      playSound('error');
      const msg = err.response?.data?.message || err.message || 'Failed to scan barcode';
      toast.error(msg);
      
      setHistory(prev => [{
        type: 'error',
        message: msg,
        time: new Date().toLocaleTimeString(),
        order: err.response?.data?.order
      }, ...prev].slice(0, 50));
      
      setBarcode('');
    }
  });

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    scanMutation.mutate(barcode.trim());
  };

  const playSound = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.error('Audio disabled or unsupported');
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'confirmed': return <FileCheck className="w-5 h-5 text-indigo-500" />;
      case 'packed': return <Package className="w-5 h-5 text-blue-500" />;
      case 'dispatched': return <Truck className="w-5 h-5 text-primary" />;
      case 'returned': return <Undo2 className="w-5 h-5 text-amber-500" />;
      default: return <ScanBarcode className="w-5 h-5 text-slate-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'confirmed': return 'bg-indigo-50 border-indigo-500 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400';
      case 'packed': return 'bg-blue-50 border-blue-500 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'dispatched': return 'bg-primary/10 border-primary dark:bg-primary/10 text-primary dark:text-primary';
      case 'returned': return 'bg-amber-50 border-amber-500 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
      default: return 'bg-slate-50 border-slate-500 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      
      {/* Hidden input for physical scanner */}
      <form onSubmit={handleScanSubmit} className="absolute opacity-0 -z-10 pointer-events-none">
        <input 
          ref={inputRef}
          type="text" 
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          autoFocus
        />
        <button type="submit">Scan</button>
      </form>

      {/* Header */}
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-indigo-500/10 bg-indigo-50/5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 neu-inset rounded-2xl flex items-center justify-center text-indigo-600 font-black relative">
            <ScanBarcode className="w-8 h-8" />
            {scanMutation.isPending && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-indigo-500 rounded-full animate-ping"></span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              Smart Fulfillment Scanner
            </h1>
            <p className="text-sm text-primary font-bold flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Auto-syncing to main Orders page. Ready to scan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-muted p-1 rounded-2xl">
            {canForward && (
              <button 
                onClick={() => setScanMode('forward')}
                className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${scanMode === 'forward' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Forward Workflow
              </button>
            )}
            {canReturn && (
              <button 
                onClick={() => setScanMode('return')}
                className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${scanMode === 'return' ? 'bg-white dark:bg-slate-800 shadow-sm text-amber-600' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Returns Mode
              </button>
            )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Counters & Manual */}
        <div className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {canOrderPack && (
              <div className="clay-card p-6 rounded-3xl text-center bg-gradient-to-b from-indigo-500/10 to-transparent">
              <div className="w-12 h-12 neu-inset rounded-full flex items-center justify-center text-indigo-500 mx-auto mb-3">
                <FileCheck className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Confirm Unit</p>
              <h2 className="text-4xl font-black text-foreground mt-2 tracking-tighter">
                {statsData?.stats?.confirmed_today || 0}
              </h2>
              </div>
            )}

            {canOrderPack && (
              <div className="clay-card p-6 rounded-3xl text-center bg-gradient-to-b from-blue-500/10 to-transparent">
              <div className="w-12 h-12 neu-inset rounded-full flex items-center justify-center text-blue-500 mx-auto mb-3">
                <Package className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pack Unit</p>
              <h2 className="text-4xl font-black text-foreground mt-2 tracking-tighter">
                {statsData?.stats?.packed_today || 0}
              </h2>
              </div>
            )}

            {canDispatch && (
              <div className="clay-card p-6 rounded-3xl text-center bg-gradient-to-b from-primary/10 to-transparent">
              <div className="w-12 h-12 neu-inset rounded-full flex items-center justify-center text-primary mx-auto mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Dispatch Unit</p>
              <h2 className="text-4xl font-black text-foreground mt-2 tracking-tighter">
                {statsData?.stats?.dispatched_today || 0}
              </h2>
              </div>
            )}

            {canReturn && (
              <div className="clay-card p-6 rounded-3xl text-center bg-gradient-to-b from-amber-500/10 to-transparent">
              <div className="w-12 h-12 neu-inset rounded-full flex items-center justify-center text-amber-500 mx-auto mb-3">
                <Undo2 className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Returned</p>
              <h2 className="text-4xl font-black text-foreground mt-2 tracking-tighter">
                {statsData?.stats?.returned_today || 0}
              </h2>
              </div>
            )}
          </div>
          
          <div className="clay-card p-6 rounded-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Keyboard className="w-4 h-4" /> Manual Entry
              </h3>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />} Audio
              </button>
            </div>
            <form onSubmit={handleScanSubmit} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Type ORD-XXXXX"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                className="flex-1 neu-inset rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
              <button 
                type="submit"
                disabled={scanMutation.isPending || !barcode.trim()}
                className="px-6 py-3 neu-btn-primary rounded-xl font-bold text-sm disabled:opacity-50"
              >
                Go
              </button>
            </form>
            <p className="text-[10px] text-muted-foreground font-bold mt-4 leading-relaxed">
              <strong>Workflow:</strong> 
                {canOrderPack && ' Pending (Confirm Unit) ➔ Confirmed (Pack Unit)'} 
                {canDispatch && ' ➔ Processing (Dispatch Unit)'}.<br/>
              To return a dispatched order, toggle "Returns Mode" at the top.
            </p>
          </div>
        </div>

        {/* Right Col: History */}
        <div className="lg:col-span-7 clay-card p-6 rounded-3xl flex flex-col h-[650px]">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-6 border-b border-border pb-4">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Live Scanning Feed
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <ScanBarcode className="w-12 h-12 mb-4" />
                <p className="font-bold">No scans yet in this session.</p>
                <p className="text-xs">Start scanning barcodes to see the live feed.</p>
              </div>
            ) : (
              history.map((entry, idx) => {
                const colorClasses = entry.type === 'error' 
                  ? 'bg-rose-50 border-rose-500 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' 
                  : getActionColor(entry.action);

                return (
                  <div key={idx} className={`p-4 rounded-2xl border-l-4 shadow-sm transition-all duration-300 animate-in slide-in-from-top-2 ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]} ${colorClasses.split(' ')[2]}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {entry.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-500" /> : getActionIcon(entry.action)}
                        </div>
                        <div>
                          <p className={`text-sm font-black ${colorClasses.split(' ').slice(3).join(' ')}`}>
                            {entry.message}
                          </p>
                          {entry.order && (
                            <p className="text-xs font-semibold text-muted-foreground mt-1">
                              {entry.order.customer_name} | {entry.order.shipping_address}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap bg-background px-2 py-1 rounded-lg">
                        {entry.time}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
