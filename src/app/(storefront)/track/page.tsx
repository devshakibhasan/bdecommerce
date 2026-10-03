'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatBDT } from '@/utils/currency';
import { 
  Search, Package, Truck, CheckCircle2, Clock, MapPin, 
  ShieldCheck, Phone, RefreshCw, AlertTriangle, ExternalLink,
  ChevronRight, Calendar, User, ShoppingBag, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

function TrackContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('code') || searchParams.get('order') || searchParams.get('phone') || '';

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchTracking = async (searchStr: string) => {
    if (!searchStr.trim()) return;
    setIsSearching(true);
    setErrorMessage('');

    try {
      const res: any = await api.get(`/orders/track?query=${encodeURIComponent(searchStr.trim())}`);
      if (res?.data?.order) {
        setTrackingData(res.data);
      } else {
        throw new Error('No tracking records found');
      }
    } catch (err: any) {
      /* silenced */
      // Fallback: try by-number
      try {
        const orderRes: any = await api.get(`/orders/by-number/${encodeURIComponent(searchStr.trim())}`);
        if (orderRes?.data) {
          const ord = orderRes.data;
          setTrackingData({
            order: ord,
            timeline: [
              { key: 'placed', title: 'Order Placed', description: 'Order logged in system', completed: true, timestamp: ord.created_at },
              { key: 'confirmed', title: 'Order Confirmed', description: 'Consignment confirmed', completed: ord.fulfillment_status !== 'pending', timestamp: ord.confirmed_at },
              { key: 'processing', title: 'Packaging & QA', description: 'Verified at distribution hub', completed: ['processing', 'handed_to_courier', 'in_transit', 'delivered'].includes(ord.fulfillment_status), timestamp: null },
              { key: 'shipped', title: ord.courier_name ? `Dispatched with ${ord.courier_name}` : 'Courier Dispatch', description: ord.tracking_code ? `Tracking Code: ${ord.tracking_code}` : 'Pending courier tracking code assignment', completed: ['handed_to_courier', 'in_transit', 'delivered'].includes(ord.fulfillment_status), timestamp: null },
              { key: 'delivered', title: 'Delivered to Doorstep', description: 'Parcel delivered and verified', completed: ord.fulfillment_status === 'delivered', timestamp: ord.delivered_at },
            ]
          });
          return;
        }
      } catch (e) {}

      setTrackingData(null);
      setErrorMessage('আপনার দেওয়া অর্ডার নম্বর বা ট্র্যাকিং কোড দিয়ে কোনো তথ্য পাওয়া যায়নি। অনুগ্রহ করে সঠিক নম্বর দিন।');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchTracking(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(queryInput);
  };

  const order = trackingData?.order;
  const timeline = trackingData?.timeline || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl min-h-[70vh] space-y-8">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 neu-inset rounded-3xl flex items-center justify-center text-primary mx-auto shadow-inner mb-3">
          <Truck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
          পার্সেল ট্র্যাকিং (Live Order Tracking)
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          আপনার অর্ডার নম্বর (যেমনঃ BD-2026-XXXXXX), কুরিয়ার ট্র্যাকিং কোড অথবা মোবাইল নম্বর দিয়ে লাইভ অবস্থান জানুন।
        </p>
      </div>

      {/* Search Bar Form */}
      <div className="clay-card p-6 sm:p-8 rounded-3xl shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-3.5" />
            <input
              required
              type="text"
              placeholder="অর্ডার নম্বর / ট্র্যাকিং কোড / মোবাইল নম্বর দিন..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 neu-input rounded-2xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="neu-btn-primary px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>ট্র্যাক করুন</span>
          </button>
        </form>
      </div>

      {/* Error State */}
      {errorMessage && (
        <div className="clay-card p-6 rounded-3xl text-center space-y-2 border-2 border-red-500/30">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-black text-foreground">অর্ডার খুঁজে পাওয়া যায়নি</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{errorMessage}</p>
        </div>
      )}

      {/* Live Order Tracking Result Card */}
      {order && (
        <div className="space-y-6">
          
          {/* Main Status Banner */}
          <div className="clay-raised p-6 sm:p-8 rounded-3xl border-2 border-primary/30 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">অর্ডার নম্বর</span>
                <h2 className="text-2xl font-black text-primary font-mono">{order.order_number}</h2>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">বর্তমান অবস্থা</span>
                <div className="mt-0.5">
                  <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary/10 text-primary">
                    {order.fulfillment_status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual 5-Step Timeline */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">ডেলিভারি টাইমলাইন</h3>
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {timeline.map((step: any, idx: number) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className={`absolute -left-6 sm:-left-8 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                      step.completed ? 'bg-primary text-white' : 'neu-inset text-muted-foreground'
                    }`}>
                      {step.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs sm:text-sm font-black ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.title}
                        </h4>
                        {step.timestamp && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(step.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Courier Dispatch Card */}
            <div className="p-4 neu-inset rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 neu-flat rounded-xl flex items-center justify-center text-primary">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">কুরিয়ার পার্টনার</span>
                  <p className="text-xs font-bold text-foreground">{order.courier_name || 'Steadfast Courier'}</p>
                  <p className="text-[11px] font-mono font-bold text-primary">ট্র্যাকিং কোড: {order.tracking_code || 'SF-DH-PENDING'}</p>
                </div>
              </div>

              <Link
                href={`/order-confirmation/${order.order_number}`}
                className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-foreground hover:text-primary flex items-center gap-1"
              >
                <span>ইনভয়েস দেখুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Destination & Ordered Items Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase font-bold text-[10px]">ডেলিভারি ঠিকানা:</span>
                <p className="font-bold text-foreground">{order.customer_name} ({order.customer_phone})</p>
                <p className="text-muted-foreground leading-relaxed">{order.shipping_address}</p>
                <p className="text-foreground font-bold">{order.district}, {order.thana}</p>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-muted-foreground uppercase font-bold text-[10px]">পেমেন্ট ও সর্বমোট:</span>
                <p className="font-bold text-foreground uppercase">{order.payment_method} ({order.payment_status})</p>
                <p className="text-base font-black text-primary">{formatBDT(order.total_payable)}</p>
                <p className="text-[11px] text-muted-foreground">{order.items?.length || 1}টি আইটেম</p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold">Loading Live Tracker...</div>}>
      <TrackContent />
    </Suspense>
  );
}
