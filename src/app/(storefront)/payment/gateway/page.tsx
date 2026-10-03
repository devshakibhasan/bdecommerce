'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCartStore, useOrderStore, useLocaleStore } from '@/lib/store';
import { formatBDT } from '@/utils/currency';
import { api } from '@/lib/api';
import { 
  ShieldCheck, Lock, ArrowLeft, CheckCircle2, 
  CreditCard, Clock, Copy, Check, Loader2,
  ExternalLink, Smartphone, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BkashTokenizedCheckout } from '@/components/payment/BkashTokenizedCheckout';

function GatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();
  const { lastOrder, setLastOrder } = useOrderStore();
  const { locale } = useLocaleStore();

  const [mounted, setMounted] = useState(false);
  const [gateway, setGateway] = useState<'bkash' | 'nagad' | 'sslcommerz'>('bkash');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedMerchant, setCopiedMerchant] = useState(false);

  // Real payment input state
  const [senderPhone, setSenderPhone] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // SSLCommerz / Card details
  const [cardBankName, setCardBankName] = useState<string>('City Bank / Visa');
  const [cardRefNumber, setCardRefNumber] = useState<string>('');

  // Session timer (15 mins)
  const [timeLeft, setTimeLeft] = useState<number>(899);

  useEffect(() => {
    setMounted(true);
    const paramGw = searchParams.get('gateway');
    const paramOrder = searchParams.get('orderNumber') || searchParams.get('order_number') || lastOrder?.order_number || '';
    const paramAmount = Number(searchParams.get('amount')) || Number(lastOrder?.total_payable) || 0;

    if (paramGw === 'nagad') setGateway('nagad');
    else if (paramGw === 'sslcommerz' || paramGw === 'ssl') setGateway('sslcommerz');
    else setGateway('bkash');

    setOrderNumber(paramOrder);
    setAmount(paramAmount);

    if (lastOrder?.customer_phone) {
      setSenderPhone(lastOrder.customer_phone);
    }

    // Fetch live order from database to ensure fresh totals
    if (paramOrder) {
      api.get(`/orders/by-number/${paramOrder}`)
        .then((res: any) => {
          if (res?.data) {
            setAmount(Number(res.data.total_payable));
            if (res.data.customer_phone && !senderPhone) {
              setSenderPhone(res.data.customer_phone);
            }
          }
        })
        .catch(() => {});
    }
  }, [searchParams, lastOrder]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyMerchant = (num: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedMerchant(true);
      toast.success(locale === 'bn' ? 'মার্চেন্ট নম্বর কপি করা হয়েছে!' : 'Merchant number copied!');
      setTimeout(() => setCopiedMerchant(false), 2000);
    }
  };

  const handleVerifyAndPay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error(locale === 'bn' ? 'অনুগ্রহ করে শর্তাবলীতে সম্মতি দিন।' : 'Please accept the payment terms & conditions.');
      return;
    }

    const cleanTrx = (gateway === 'sslcommerz' ? cardRefNumber : trxId).trim();
    if (!cleanTrx) {
      toast.error(locale === 'bn' ? 'অনুগ্রহ করে ট্রানজেকশন আইডি (TrxID) লিখুন।' : 'Please enter your Transaction ID (TrxID).');
      return;
    }

    if (cleanTrx.length < 4) {
      toast.error(locale === 'bn' ? 'অনুগ্রহ করে সঠিক ট্রানজেকশন আইডি লিখুন।' : 'Please enter a valid Transaction ID.');
      return;
    }

    setIsProcessing(true);

    try {
      // Call backend payment verify endpoint with real submitted data
      const res: any = await api.post('/payment/verify', {
        order_number: orderNumber,
        gateway: gateway,
        transaction_id: cleanTrx.toUpperCase(),
        sender_phone: senderPhone.trim() || undefined,
        amount: amount,
      });

      clearCart();

      const updatedOrder = res?.data?.order || {
        ...lastOrder,
        order_number: orderNumber,
        payment_status: 'paid',
        payment_transaction_id: cleanTrx.toUpperCase(),
        payment_method: gateway,
      };

      setLastOrder(updatedOrder);

      toast.success(
        locale === 'bn' 
          ? `পেমেন্ট সফলভাবে সংরক্ষিত ও নিশ্চিত হয়েছে! (TrxID: ${cleanTrx.toUpperCase()})` 
          : `Payment verified successfully! TrxID: ${cleanTrx.toUpperCase()}`
      );

      setTimeout(() => {
        router.push(`/order-confirmation/${orderNumber}?payment=success&gateway=${gateway}&trxID=${encodeURIComponent(cleanTrx.toUpperCase())}`);
      }, 1000);

    } catch (err: any) {
      toast.error(err?.message || (locale === 'bn' ? 'পেমেন্ট যাচাই করতে ত্রুটি হয়েছে' : 'Failed to verify payment'));
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center bg-background/50">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Top Header & Return Action */}
        <div className="flex items-center justify-between">
          <Link 
            href={orderNumber ? `/order-confirmation/${orderNumber}` : '/checkout'} 
            className="neu-flat px-4 py-2 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{locale === 'bn' ? 'ফিরে যান' : 'Back to Order'}</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold neu-inset px-3.5 py-1.5 rounded-full text-primary">
            <Clock className="w-3.5 h-3.5" />
            <span>Session: {formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Switch Payment Method Bar */}
        <div className="flex border-b bg-muted/40 p-2 gap-2 text-xs font-bold rounded-2xl neu-flat">
          <button
            type="button"
            onClick={() => setGateway('bkash')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              gateway === 'bkash' ? 'bg-[#E2136E] text-white shadow-md' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <span>bKash</span>
          </button>

          <button
            type="button"
            onClick={() => setGateway('nagad')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              gateway === 'nagad' ? 'bg-[#F7921E] text-white shadow-md' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <span>Nagad</span>
          </button>

          <button
            type="button"
            onClick={() => setGateway('sslcommerz')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              gateway === 'sslcommerz' ? 'bg-blue-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <span>Cards / Banking</span>
          </button>
        </div>

        {gateway === 'bkash' ? (
          <BkashTokenizedCheckout
            orderNumber={orderNumber}
            amount={amount}
            customerPhone={senderPhone}
            onCancel={() => router.push(orderNumber ? `/order-confirmation/${orderNumber}` : '/checkout')}
            onSuccess={(trxId) => {
              setTimeout(() => {
                router.push(`/order-confirmation/${orderNumber}?payment=success&gateway=bkash&trxID=${trxId}`);
              }, 1200);
            }}
          />
        ) : (
          <div className="neu-raised rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            {/* Nagad Header */}
            {gateway === 'nagad' && (
              <div className="bg-gradient-to-r from-[#F7921E] to-[#F15A24] text-white p-6 text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-2 right-3 text-white/20 text-4xl font-black select-none">Nagad</div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-[#F7921E] font-black text-2xl shadow-lg">
                  ৳
                </div>
                <h1 className="text-xl font-black tracking-wide">
                  {locale === 'bn' ? 'নগদ সরাসরি পেমেন্ট গেটওয়ে' : 'Nagad Direct Payment'}
                </h1>
                <p className="text-xs text-orange-100 font-medium">
                  Official Account: 01410737290 (Merchant Pay / Send Money)
                </p>

                <div className="bg-black/20 backdrop-blur-md rounded-2xl py-2 px-4 inline-flex items-center justify-center gap-4 text-xs font-bold mt-2">
                  <span>Order: {orderNumber || 'Pending'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                  <span className="text-yellow-200 font-black text-sm">{formatBDT(amount, locale)}</span>
                </div>
              </div>
            )}

            {/* SSLCommerz Header */}
            {gateway === 'sslcommerz' && (
              <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white p-6 text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-2 right-3 text-white/20 text-4xl font-black select-none">SSL</div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-blue-700 font-black text-2xl shadow-lg">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-black tracking-wide">Cards & Internet Banking</h1>
                <p className="text-xs text-blue-100 font-medium">Visa, Mastercard, AMEX & Bangladesh Net Banking</p>

                <div className="bg-black/20 backdrop-blur-md rounded-2xl py-2 px-4 inline-flex items-center justify-center gap-4 text-xs font-bold mt-2">
                  <span>Ref: {orderNumber || 'Pending'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                  <span className="text-yellow-300 font-black text-sm">{formatBDT(amount, locale)}</span>
                </div>
              </div>
            )}

            {/* Body Content */}
            <form onSubmit={handleVerifyAndPay} className="p-6 sm:p-8 space-y-6">

              {/* Merchant Account Details Box */}
              <div className="neu-inset p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-muted-foreground">
                    {gateway === 'nagad' ? 'Official Nagad Account:' : 'Settlement Reference:'}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono font-black text-sm text-primary">
                    <span>01410737290</span>
                    <button
                      type="button"
                      onClick={() => handleCopyMerchant('01410737290')}
                      className="p-1 hover:text-foreground text-slate-400 cursor-pointer"
                      title="Copy Number"
                    >
                      {copiedMerchant ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-muted-foreground">{locale === 'bn' ? 'মোট পরিশোধযোগ্য টাকা:' : 'Total Amount Payable:'}</span>
                  <span className="font-black text-sm text-foreground">{formatBDT(amount, locale)}</span>
                </div>
              </div>

            {/* Nagad Flow */}
            {gateway === 'nagad' && (
              <div className="space-y-4">
                {/* 3 Step Instruction Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                  <div className="p-2.5 rounded-xl neu-flat border border-border/40">
                    <span className="font-bold text-[#F7921E] block mb-0.5">১. নগদ অ্যাপ / *167#</span>
                    <span>মার্চেন্ট পে বা সেন্ড মানি সিলেক্ট করুন।</span>
                  </div>
                  <div className="p-2.5 rounded-xl neu-flat border border-border/40">
                    <span className="font-bold text-[#F7921E] block mb-0.5">২. টাকা পাঠান</span>
                    <span>নম্বর <strong className="font-mono">01410737290</strong>-এ মোট <strong>{formatBDT(amount, locale)}</strong> পাঠান।</span>
                  </div>
                  <div className="p-2.5 rounded-xl neu-flat border border-border/40">
                    <span className="font-bold text-[#F7921E] block mb-0.5">৩. TrxID দিন</span>
                    <span>এসএমএস-এ পাওয়া ট্রানজেকশন আইডি নিচে দিন।</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase">
                    {locale === 'bn' ? 'আপনার নগদ নম্বর' : 'Your Nagad Mobile Number'}
                  </label>
                  <input
                    type="tel"
                    maxLength={11}
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-4 py-3 neu-input rounded-2xl text-xs sm:text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase">
                    {locale === 'bn' ? 'নগদ ট্রানজেকশন আইডি (TrxID) *' : 'Nagad Transaction ID (TrxID) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                    placeholder="e.g. 9X7A8B2C"
                    className="w-full px-4 py-3 neu-input rounded-2xl text-sm sm:text-base font-mono font-black text-center uppercase tracking-widest text-[#F7921E]"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1 text-center">
                    {locale === 'bn' ? 'নগদ থেকে সফল পেমেন্টের মেসেজে প্রাপ্ত ট্রানজেকশন আইডি দিন' : 'Enter the TrxID received from Nagad notification'}
                  </p>
                </div>
              </div>
            )}

            {/* SSLCommerz / Card Flow */}
            {gateway === 'sslcommerz' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase">
                    Bank / Card Issuer
                  </label>
                  <select
                    value={cardBankName}
                    onChange={(e) => setCardBankName(e.target.value)}
                    className="w-full px-4 py-3 neu-input rounded-2xl text-xs sm:text-sm font-bold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="City Bank (Visa / Mastercard)">City Bank (Visa / Mastercard)</option>
                    <option value="BRAC Bank">BRAC Bank</option>
                    <option value="DBBL Nexus / Visa">DBBL Nexus / Visa</option>
                    <option value="EBL Skybanking">Eastern Bank (EBL)</option>
                    <option value="Islami Bank">Islami Bank Bangladesh</option>
                    <option value="Standard Chartered">Standard Chartered</option>
                    <option value="HSBC / Other Visa / Mastercard">Other Visa / Mastercard / AMEX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase">
                    Transaction / Bank Deposit Reference *
                  </label>
                  <input
                    type="text"
                    required
                    value={cardRefNumber}
                    onChange={(e) => setCardRefNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. TXN-89102830"
                    className="w-full px-4 py-3 neu-input rounded-2xl text-sm sm:text-base font-mono font-black text-center uppercase tracking-wider text-blue-600"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="termsCheck"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="termsCheck" className="text-xs text-foreground cursor-pointer font-medium">
                {locale === 'bn' 
                  ? <span>আমি ঘোষণা করছি যে <strong className="text-primary">{formatBDT(amount, locale)}</strong> টাকা সফলভাবে পরিশোধ করেছি।</span>
                  : <span>I confirm that I have sent the payment of <strong className="text-primary">{formatBDT(amount, locale)}</strong>.</span>}
              </label>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                gateway === 'bkash' 
                  ? 'bg-[#E2136E] hover:bg-[#c00f5c]' 
                  : (gateway === 'nagad' ? 'bg-[#F7921E] hover:bg-[#d97c14]' : 'bg-blue-600 hover:bg-blue-700')
              } disabled:opacity-50`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{locale === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying with System...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {locale === 'bn' 
                      ? `পেমেন্ট ভেরিফাই করুন (${formatBDT(amount, locale)})` 
                      : `Confirm & Verify Payment (${formatBDT(amount, locale)})`}
                  </span>
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div className="pt-4 border-t flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5 text-primary dark:text-primary font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>256-Bit SSL Encrypted Verification</span>
              </div>
              <div>Direct Database Settlement</div>
            </div>

          </form>

        </div>
        )}

      </div>
    </div>
  );
}

export default function PaymentGatewayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <GatewayContent />
    </Suspense>
  );
}
