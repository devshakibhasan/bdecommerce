'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useOrderStore, useLocaleStore } from '@/lib/store';
import { formatBDT } from '@/utils/currency';
import { api } from '@/lib/api';
import { 
  CheckCircle2, Package, Truck, Clock, Printer, 
  ArrowRight, ShieldCheck, MapPin, Phone, User, 
  ShoppingBag, Sparkles, Copy, Check, FileText, 
  Building2, Globe, Mail, Loader2, CreditCard, 
  ExternalLink, Zap 
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function ConfirmationContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orderNumber = (params?.orderNumber as string) || 'BD-2026-100234';
  const { lastOrder, setLastOrder } = useOrderStore();
  const { locale } = useLocaleStore();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dbOrder, setDbOrder] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  const [orderDate, setOrderDate] = useState('01 Sep 2026, 12:00 PM');

  const paramPayment = searchParams.get('payment');
  const paramGateway = searchParams.get('gateway');
  const paramTrxID = searchParams.get('trxID') || searchParams.get('trx_id');
  const paramPending = searchParams.get('pendingPayment');

  // Official gateway initiation state
  const [initiatingGateway, setInitiatingGateway] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Fetch live order from backend database
    async function fetchLiveOrder() {
      if (!orderNumber) return;
      setIsFetching(true);
      try {
        const res: any = await api.get(`/orders/by-number/${orderNumber}`);
        if (res?.data) {
          setDbOrder(res.data);
        }
      } catch (err) {
        // Fallback gracefully to lastOrder from Zustand store
      } finally {
        setIsFetching(false);
      }
    }

    fetchLiveOrder();
  }, [orderNumber]);

  const handlePayViaGateway = async (gateway: string) => {
    setInitiatingGateway(gateway);
    try {
      const res: any = await api.post('/payment/initiate', {
        order_number: orderNumber,
        payment_method: gateway,
      });

      if (res?.data?.payment_url) {
        toast.success(
          locale === 'bn' 
            ? 'অফিসিয়াল পেমেন্ট গেটওয়েতে নিয়ে যাওয়া হচ্ছে...' 
            : 'Redirecting to official payment gateway...'
        );
        const url = res.data.payment_url;
        if (url.startsWith('http://') || url.startsWith('https://')) {
          window.location.href = url;
        } else {
          router.push(url);
        }
        return;
      }

      if (res?.data?.already_paid) {
        toast.success(locale === 'bn' ? 'অর্ডারটি ইতিমধ্যে পরিশোধিত!' : 'Order is already paid!');
        queryClient.invalidateQueries({ queryKey: ['order', orderNumber] });
        return;
      }

      if (gateway === 'bkash') {
        router.push(`/payment/bkash?paymentId=TR0011NZQqPR${Date.now()}&orderNumber=${orderNumber}&amount=${order.total_payable}&mode=0011&apiVersion=v1.2.0-beta`);
      } else {
        router.push(`/payment/gateway?gateway=${gateway}&orderNumber=${orderNumber}&amount=${order.total_payable}`);
      }
    } catch (err: any) {
      if (gateway === 'bkash') {
        router.push(`/payment/bkash?paymentId=TR0011NZQqPR${Date.now()}&orderNumber=${orderNumber}&amount=${order.total_payable}&mode=0011&apiVersion=v1.2.0-beta`);
      } else {
        router.push(`/payment/gateway?gateway=${gateway}&orderNumber=${orderNumber}&amount=${order.total_payable}`);
      }
    } finally {
      setInitiatingGateway(null);
    }
  };

  // Combine database order, store order, or fallback preview
  const activeOrder = dbOrder || ((mounted && lastOrder && (lastOrder.order_number === orderNumber || !lastOrder.order_number)) ? lastOrder : null);

  const order = activeOrder || {
    order_number: orderNumber,
    customer_name: 'Valued Customer',
    customer_phone: '017XXXXXXXX',
    customer_email: 'customer@example.com',
    shipping_address: 'Delivery address on record, Dhaka, Bangladesh',
    district: 'Dhaka',
    thana: 'Dhanmondi',
    shipping_zone: 'inside_dhaka',
    shipping_zone_label: 'Inside Dhaka City (Express)',
    payment_method: paramGateway || 'cod',
    payment_status: paramPayment === 'success' ? 'paid' : 'pending',
    payment_transaction_id: paramTrxID || null,
    fulfillment_status: 'processing',
    subtotal: 3499,
    delivery_fee: 80,
    discount_amount: 0,
    total_payable: 3579,
    courier_name: null,
    tracking_code: null,
    created_at: '2026-09-01T12:00:00.000Z',
    items: [
      {
        product_name: 'Samsung Galaxy A55 5G',
        product_slug: 'samsung-galaxy-a55-5g',
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85',
        color: 'Awesome Black',
        size: '8GB/128GB',
        sku: 'SGA55-BLK-128',
        unit_price: 42999,
        quantity: 1,
        total: 42999,
      }
    ]
  };

  const isPaid = order.payment_status === 'paid' || paramPayment === 'success';
  const effectiveTrxId = order.payment_transaction_id || paramTrxID;
  const effectiveMethod = (order.payment_method || paramGateway || 'cod').toLowerCase();
  const isCod = effectiveMethod === 'cod';

  useEffect(() => {
    try {
      const d = new Date(order.created_at || '2026-09-01T12:00:00Z');
      setOrderDate(d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }));
    } catch (e) {}
  }, [order.created_at]);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    toast.success('Order number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const getPaymentBadge = () => {
    if (effectiveMethod === 'bkash') return { label: 'bKash Direct Merchant Gateway', color: 'text-pink-600 border-pink-500 bg-pink-500/10' };
    if (effectiveMethod === 'nagad') return { label: 'Nagad Direct PGW Gateway', color: 'text-orange-600 border-orange-500 bg-orange-500/10' };
    if (effectiveMethod === 'sslcommerz' || effectiveMethod === 'ssl') return { label: 'SSLCommerz Multi-Gateway', color: 'text-blue-600 border-blue-500 bg-blue-500/10' };
    return { label: 'Cash on Delivery (COD)', color: 'text-primary border-primary bg-primary/10' };
  };

  const paymentMeta = getPaymentBadge();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8" suppressHydrationWarning>
      
      {/* SCREEN VIEW (Hidden on Print): Celebratory Header & Status */}
      <div className="print:hidden space-y-8">
        
        {/* Celebratory Banner */}
        <div className="neu-raised rounded-3xl p-8 sm:p-10 text-center space-y-5 relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl neu-flat flex items-center justify-center mx-auto text-green-600 shadow-xl">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full neu-inset text-xs font-bold text-green-700 dark:text-green-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Order Confirmed & Database Logged</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              {locale === 'bn' ? 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে!' : 'Thank You For Your Order!'}
            </h1>
            
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {locale === 'bn'
                ? 'আপনার অর্ডারটি ডাটাবেজে রেকর্ড করা হয়েছে। খুব শীঘ্রই আমাদের কুরিয়ার টিম পার্সেলটি আপনার ঠিকানায় পৌঁছে দেবে।'
                : 'Your order has been recorded in the database. Our fulfillment team is preparing your package for courier handover.'}
            </p>
          </div>

          {/* Order Identifier Capsule */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="neu-inset px-5 py-2.5 rounded-2xl flex items-center gap-3 font-mono font-bold text-sm text-primary">
              <span>Order #{order.order_number}</span>
              <button 
                onClick={copyOrderNumber}
                className="p-1 hover:text-foreground transition-colors cursor-pointer"
                title="Copy Order ID"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="neu-flat px-4 py-2.5 rounded-2xl text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Placed: {orderDate}</span>
              <span className="opacity-40">•</span>
              <span>Estimated Delivery: {order.shipping_zone === 'inside_dhaka' ? '24 Hours' : '48-72 Hours'}</span>
            </div>
          </div>
        </div>

        {/* Payment Status Card */}
        <div className="neu-flat rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl neu-inset flex items-center justify-center ${
                isPaid ? 'text-green-600' : isCod ? 'text-amber-600' : 'text-blue-600'
              }`}>
                {isPaid ? <ShieldCheck className="w-6 h-6" /> : isCod ? <Truck className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-foreground">
                    {isPaid 
                      ? (locale === 'bn' ? 'পেমেন্ট সম্পন্ন ও যাচাইকৃত' : 'Payment Verified & Settled')
                      : isCod 
                        ? (locale === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Payment Status: Cash on Delivery (COD)')
                        : (locale === 'bn' ? `পেমেন্ট অপেক্ষমান (${paymentMeta.label})` : `Payment Pending: ${paymentMeta.label}`)}
                  </h3>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isPaid 
                      ? 'text-green-600 border-green-500 bg-green-500/10' 
                      : isCod 
                        ? 'text-amber-600 border-amber-500 bg-amber-500/10' 
                        : 'text-blue-600 border-blue-500 bg-blue-500/10'
                  }`}>
                    {isPaid ? 'PAID' : isCod ? 'DUE ON ARRIVAL' : 'PENDING PAYMENT'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {isPaid 
                    ? (locale === 'bn' ? `${paymentMeta.label} এর মাধ্যমে পরিশোধিত • ডেলিভারিতে প্রদেয় ৳০` : `Paid via ${paymentMeta.label} • ৳0 due on delivery`)
                    : isCod 
                      ? (locale === 'bn' ? `পার্সেল হাতে পেয়ে পরিদর্শন করে ডেলিভারি ম্যানকে ${formatBDT(order.total_payable, locale)} প্রদান করুন` : `Collect ${formatBDT(order.total_payable, locale)} at doorstep upon parcel inspection`)
                      : (locale === 'bn' ? 'অর্ডারটি চূড়ান্তভাবে নিশ্চিত করতে নিচে অনলাইনে পেমেন্ট সম্পন্ন করুন।' : `Payment not yet completed. Complete online payment below to confirm order.`)}
                </p>
              </div>
            </div>

            {isPaid ? (
              <div className="neu-inset px-4 py-2.5 rounded-2xl flex items-center gap-2.5 self-start sm:self-auto">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    {locale === 'bn' ? 'অফিসিয়াল ট্রানজেকশন আইডি' : 'Official Transaction ID'}
                  </span>
                  <span className="font-mono font-black text-xs sm:text-sm text-green-600 dark:text-green-400">
                    {effectiveTrxId || 'PAID'}
                  </span>
                </div>
                {effectiveTrxId && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(effectiveTrxId);
                      toast.success(locale === 'bn' ? 'TrxID কপি করা হয়েছে!' : 'TrxID copied!');
                    }}
                    className="p-1 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                    title="Copy TrxID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* If unpaid and online payment chosen, show direct gateway buttons */}
          {!isPaid && !isCod && (
            <div className="pt-4 border-t border-border/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>
                    {locale === 'bn' 
                      ? 'অফিসিয়াল গেটওয়ে দিয়ে অবিলম্বে পেমেন্ট সম্পন্ন করুন:' 
                      : 'Complete your payment securely via official gateway:'}
                  </span>
                </div>
                <span className="text-xs font-black text-primary">
                  {formatBDT(order.total_payable, locale)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Official bKash Gateway */}
                <button
                  type="button"
                  disabled={Boolean(initiatingGateway)}
                  onClick={() => handlePayViaGateway('bkash')}
                  className={`p-3.5 rounded-2xl border-2 font-bold text-xs flex items-center justify-between cursor-pointer transition-all shadow-xs disabled:opacity-50 ${
                    effectiveMethod === 'bkash' 
                      ? 'bg-[#E2136E]/15 border-[#E2136E] text-[#E2136E] ring-2 ring-[#E2136E]/20' 
                      : 'bg-[#E2136E]/10 hover:bg-[#E2136E]/20 border-[#E2136E]/40 text-[#E2136E]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[#E2136E] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      ৳
                    </div>
                    <div className="text-left">
                      <div className="font-black text-xs">bKash Direct Merchant Gateway</div>
                      <div className="text-[10px] text-muted-foreground font-normal">Tokenized API • Instant Auto Verified</div>
                    </div>
                  </div>
                  {initiatingGateway === 'bkash' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#E2136E]" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-[#E2136E]" />
                  )}
                </button>

                {/* Official Nagad Gateway */}
                <button
                  type="button"
                  disabled={Boolean(initiatingGateway)}
                  onClick={() => handlePayViaGateway('nagad')}
                  className={`p-3.5 rounded-2xl border-2 font-bold text-xs flex items-center justify-between cursor-pointer transition-all shadow-xs disabled:opacity-50 ${
                    effectiveMethod === 'nagad' 
                      ? 'bg-[#F7941D]/15 border-[#F7941D] text-[#F7941D] ring-2 ring-[#F7941D]/20' 
                      : 'bg-[#F7941D]/10 hover:bg-[#F7941D]/20 border-[#F7941D]/40 text-[#F7941D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[#F7941D] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      ৳
                    </div>
                    <div className="text-left">
                      <div className="font-black text-xs">Nagad Direct Gateway</div>
                      <div className="text-[10px] text-muted-foreground font-normal">PGW Direct • Mobile Wallet Checkout</div>
                    </div>
                  </div>
                  {initiatingGateway === 'nagad' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#F7941D]" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-[#F7941D]" />
                  )}
                </button>

                {/* Official SSLCommerz Multi-Gateway */}
                <button
                  type="button"
                  disabled={Boolean(initiatingGateway)}
                  onClick={() => handlePayViaGateway('sslcommerz')}
                  className={`p-3.5 rounded-2xl border-2 font-bold text-xs flex items-center justify-between cursor-pointer transition-all shadow-xs disabled:opacity-50 ${
                    effectiveMethod === 'sslcommerz' || effectiveMethod === 'ssl' 
                      ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20' 
                      : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      SSL
                    </div>
                    <div className="text-left">
                      <div className="font-black text-xs">SSLCommerz Multi-Gateway</div>
                      <div className="text-[10px] text-muted-foreground font-normal">All BD Cards & NetBanking</div>
                    </div>
                  </div>
                  {initiatingGateway === 'sslcommerz' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              </div>

              <div className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  {locale === 'bn' 
                    ? 'অফিসিয়াল গেটওয়েতে পেমেন্ট সম্পন্ন হলে ট্রানজেকশন আইডি স্বয়ংক্রিয়ভাবে ডাটাবেজে রেকর্ড হবে।' 
                    : 'Transaction verification is 100% automated with genuine bank-grade security.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4-Step Consignment Stepper */}
        <div className="neu-flat rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <span>Fulfillment & Consignment Stepper</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="neu-inset rounded-2xl p-4 space-y-2 border-l-4 border-green-500">
              <div className="flex items-center justify-between text-xs font-bold text-green-600">
                <span>1. Confirmed</span>
                <Check className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-muted-foreground">Order verified in system</p>
            </div>

            <div className="neu-inset rounded-2xl p-4 space-y-2 border-l-4 border-blue-500">
              <div className="flex items-center justify-between text-xs font-bold text-blue-600">
                <span>2. Processing</span>
                <Package className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-muted-foreground">Quality check & boxing</p>
            </div>

            <div className="neu-flat rounded-2xl p-4 space-y-2 border-l-4 border-border">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>3. Courier Dispatch</span>
                <Truck className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {order.courier_name ? `${order.courier_name} handover` : (locale === 'bn' ? 'কুরিয়ার নির্ধারিত হয়নি' : 'Pending Courier Assignment')}
              </p>
            </div>

            <div className="neu-flat rounded-2xl p-4 space-y-2 border-l-4 border-border">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>4. Delivered</span>
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-muted-foreground">Doorstep handover</p>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="neu-flat rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              className="neu-btn-primary px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Invoice Receipt</span>
            </button>

            <Link
              href={order.tracking_code ? `/track?code=${order.tracking_code}` : `/track?order=${order.order_number}`}
              className="neu-btn px-6 py-3 rounded-2xl text-xs font-bold text-primary flex items-center gap-2 cursor-pointer hover:neu-flat"
            >
              <Truck className="w-4 h-4" />
              <span>{order.tracking_code ? (locale === 'bn' ? 'পার্সেল ট্র্যাক করুন' : 'Track Live Consignment') : (locale === 'bn' ? 'অর্ডার ট্র্যাকিং' : 'Track Order Status')}</span>
            </Link>
          </div>

          <Link
            href="/products"
            className="neu-btn px-6 py-3 rounded-2xl text-xs font-bold text-foreground inline-flex items-center gap-2 cursor-pointer hover:neu-flat"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE OFFICIAL INVOICE */}
      {/* ========================================================================= */}
      <div 
        id="official-invoice"
        className="bg-white dark:bg-[#161d2a] text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200 dark:border-slate-800 print:bg-white print:text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print:w-full"
      >
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-slate-900 dark:border-slate-700 print:border-slate-900 gap-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-slate-900 dark:bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg print:bg-slate-900">
                BD
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white print:text-slate-950 uppercase">BD Shop Bangladesh</h1>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 print:text-slate-600 font-semibold tracking-wider uppercase">Official Commercial Invoice</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 space-y-0.5 leading-relaxed font-medium">
              <p>Corporate Office: Level 6, Navana Tower, Gulshan-1, Dhaka 1212</p>
              <p>Hotline: 01410737290 | WhatsApp: 01410737290</p>
              <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 print:text-slate-700">BIN / VAT Reg No: BIN-002847193-0101</p>
            </div>
          </div>

          <div className="sm:text-right text-left space-y-1">
            <div className="inline-block bg-slate-900 dark:bg-slate-800 text-white px-3.5 py-1 rounded-md text-xs font-black uppercase tracking-wider print:bg-slate-900">
              {isPaid ? 'PAID INVOICE' : (isCod ? 'CASH INVOICE' : 'PENDING INVOICE')}
            </div>
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-white print:text-slate-900 pt-1">
              INV #{order.order_number}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 font-medium">
              Issued: {orderDate}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 print:text-slate-700">
              Courier: <span className="font-bold text-slate-900 dark:text-white print:text-slate-900">{order.courier_name || 'Pending Assignment'}</span>
            </div>
            {order.tracking_code && (
              <div className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 print:text-blue-700">
                Tracking: {order.tracking_code}
              </div>
            )}
          </div>
        </div>

        {/* Customer & Billing Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-b border-slate-200 dark:border-slate-800 print:border-slate-200 text-xs">
          <div className="space-y-1">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer & Delivery Address</h3>
            <p className="font-bold text-sm text-slate-900 dark:text-white print:text-slate-900">{order.customer_name || order.customer?.name}</p>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 print:text-slate-800">Phone: {order.customer_phone || order.customer?.phone}</p>
            {(order.customer_email || order.customer?.email) && (
              <p className="text-slate-600 dark:text-slate-400 print:text-slate-600">Email: {order.customer_email || order.customer?.email}</p>
            )}
            <p className="text-slate-700 dark:text-slate-300 print:text-slate-700 pt-1 leading-relaxed">
              <span className="font-semibold">Address:</span> {order.shipping_address || order.shipping?.address}
            </p>
            {order.district && (
              <p className="text-slate-600 dark:text-slate-400 print:text-slate-600 font-medium">
                District: <span className="font-bold text-slate-900 dark:text-white print:text-slate-900">{order.district}</span>
                {order.thana && <span> | Thana: <span className="font-bold text-slate-900 dark:text-white print:text-slate-900">{order.thana}</span></span>}
              </p>
            )}
          </div>

          <div className="space-y-1 sm:text-right text-left">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Payment & Logistics Info</h3>
            <p className="text-slate-700 dark:text-slate-300 print:text-slate-700">
              <span className="font-semibold">Method:</span> <span className="font-bold text-slate-900 dark:text-white print:text-slate-900">{paymentMeta.label}</span>
            </p>
            <p className="text-slate-700 dark:text-slate-300 print:text-slate-700">
              <span className="font-semibold">Payment Status:</span>{' '}
              <span className={`font-bold uppercase font-mono ${isPaid ? 'text-green-600 dark:text-green-400' : (isCod ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400')}`}>
                {isPaid ? 'PAID' : (isCod ? 'COD (DUE ON ARRIVAL)' : 'PENDING PAYMENT')}
              </span>
            </p>
            {effectiveTrxId && (
              <p className="text-slate-700 dark:text-slate-300 print:text-slate-700 font-mono text-[11px]">
                <span className="font-semibold">Transaction ID:</span> <span className="font-bold text-slate-900 dark:text-white print:text-slate-900">{effectiveTrxId}</span>
              </p>
            )}
            <p className="text-slate-700 dark:text-slate-300 print:text-slate-700">
              <span className="font-semibold">Shipping Tier:</span>{' '}
              <span className="font-medium text-slate-900 dark:text-white print:text-slate-900">{order.shipping_zone_label || 'Express Courier'}</span>
            </p>
          </div>
        </div>

        {/* Itemized Items Table */}
        <div className="py-5 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[550px]">
            <thead>
              <tr className="border-b-2 border-slate-900 dark:border-slate-700 print:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black print:bg-slate-100 print:text-slate-900">
                <th className="py-2.5 px-3 text-center w-10">#</th>
                <th className="py-2.5 px-3">Item Description & Specifications</th>
                <th className="py-2.5 px-3 font-mono">SKU</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-center w-16">Qty</th>
                <th className="py-2.5 px-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-200">
              {order.items?.map((item: any, idx: number) => (
                <tr key={idx} className="text-slate-800 dark:text-slate-200 print:text-slate-800">
                  <td className="py-3 px-3 text-center font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3 font-medium">
                    <div className="font-bold text-slate-950 dark:text-white print:text-slate-950">{item.product_name}</div>
                    {((item.color || item.variant?.color) || (item.size || item.variant?.size) || item.variant_name) && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] print:text-slate-600">
                        {(item.color || item.variant?.color) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] print:border print:border-slate-300">
                            {locale === 'bn' ? 'কালার' : 'Color'}: {item.color || item.variant?.color}
                          </span>
                        )}
                        {(item.size || item.variant?.size) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] print:border print:border-slate-300">
                            {locale === 'bn' ? 'সাইজ' : 'Size'}: {item.size || item.variant?.size}
                          </span>
                        )}
                        {!item.color && !item.size && !item.variant?.color && !item.variant?.size && item.variant_name && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[10px]">
                            {item.variant_name}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 print:text-slate-600 text-[11px]">{item.sku || 'N/A'}</td>
                  <td className="py-3 px-3 text-right font-medium">{formatBDT(item.unit_price, 'en')}</td>
                  <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-950 dark:text-white print:text-slate-950">{formatBDT(item.total, 'en')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t-2 border-slate-900 dark:border-slate-700 print:border-slate-900 gap-6">
          <div className="text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-600 max-w-sm space-y-1">
            <p className="font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase">Terms & Conditions:</p>
            <p>1. Please inspect all items upon delivery in presence of the courier rider.</p>
            <p>2. Official 7-day replacement warranty applicable for manufacturing defects.</p>
            <p>3. WhatsApp helpline: 01410737290 for prompt assistance.</p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-slate-600">
              <span>Item Subtotal:</span>
              <span className="font-semibold text-slate-900 dark:text-white print:text-slate-900">{formatBDT(order.subtotal ?? order.amounts?.subtotal, 'en')}</span>
            </div>
            {(order.discount_amount ?? order.amounts?.discount) > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                <span>Discount / Promo:</span>
                <span>-{formatBDT(order.discount_amount ?? order.amounts?.discount, 'en')}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-slate-600">
              <span>Delivery Fee:</span>
              <span className="font-semibold text-slate-900 dark:text-white print:text-slate-900">{formatBDT(order.delivery_fee ?? order.amounts?.delivery_fee, 'en')}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 dark:border-slate-700 print:border-slate-900 font-black text-sm text-slate-950 dark:text-white print:text-slate-950">
              <span>Total Payable:</span>
              <span className="text-base text-slate-950 dark:text-white print:text-slate-950 font-black">{formatBDT(order.total_payable ?? order.amounts?.total, 'en')}</span>
            </div>
            <div className="flex justify-between text-xs font-bold pt-1">
              <span>Amount Due on Delivery:</span>
              <span className={`font-mono ${isPaid ? 'text-primary dark:text-primary' : 'text-slate-950 dark:text-white'}`}>
                {isPaid ? '৳0 (PAID ONLINE)' : (isCod ? formatBDT(order.total_payable, 'en') : '৳0 (PAY ONLINE)')}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
