'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOrderStore } from '@/lib/store';
import { BkashTokenizedCheckout } from '@/components/payment/BkashTokenizedCheckout';
import { api } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function BkashPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lastOrder } = useOrderStore();

  const [orderNumber, setOrderNumber] = useState('');
  const [amount, setAmount] = useState(0);
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pOrder = searchParams.get('orderNumber') || searchParams.get('order_number') || lastOrder?.order_number || '';
    const pAmount = Number(searchParams.get('amount')) || Number(lastOrder?.total_payable) || 0;
    const pPhone = searchParams.get('phone') || lastOrder?.customer_phone || '';

    setOrderNumber(pOrder);
    setAmount(pAmount);
    setCustomerPhone(pPhone);

    if (pOrder) {
      api.get(`/orders/by-number/${pOrder}`)
        .then((res: any) => {
          if (res?.data) {
            setAmount(Number(res.data.total_payable));
            if (res.data.customer_phone) {
              setCustomerPhone(res.data.customer_phone);
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [searchParams, lastOrder]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-[#E2136E]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs font-bold text-slate-700">Connecting to bKash Payment Gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 flex flex-col items-center justify-center">
      {/* Back button */}
      <div className="w-full max-w-md mb-2 flex items-center justify-between text-xs">
        <Link
          href={orderNumber ? `/order-confirmation/${orderNumber}` : '/checkout'}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Merchant Store</span>
        </Link>
        <span className="text-[11px] text-slate-400 font-mono">bKash PGW v1.2.0-beta</span>
      </div>

      <BkashTokenizedCheckout
        orderNumber={orderNumber || lastOrder?.order_number || 'BD-2026-142051'}
        amount={amount || Number(lastOrder?.total_payable) || 2620}
        customerPhone={customerPhone || lastOrder?.customer_phone}
        onCancel={() => {
          router.push(orderNumber ? `/order-confirmation/${orderNumber}` : '/checkout');
        }}
        onSuccess={(trxId) => {
          setTimeout(() => {
            router.push(`/order-confirmation/${orderNumber || lastOrder?.order_number}?payment=success&gateway=bkash&trxID=${trxId}`);
          }, 1200);
        }}
      />
    </div>
  );
}

export default function BkashPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#E2136E]" />
        </div>
      }
    >
      <BkashPaymentContent />
    </Suspense>
  );
}
