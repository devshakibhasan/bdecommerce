'use client';

import { useLocaleStore } from '@/lib/store';
import { Lock, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  const { locale } = useLocaleStore();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-10">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 neu-flat rounded-2xl flex items-center justify-center text-primary mx-auto text-2xl">
          🔒
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
          {locale === 'bn' ? 'প্রাইভেসি ও ডেটা সিকিউরিটি পলিসি' : 'Privacy & Data Protection Policy'}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          How BD Shop protects your personal information and transaction records.
        </p>
      </div>

      <div className="neu-flat rounded-3xl p-8 md:p-10 space-y-6 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="w-10 h-10 neu-inset rounded-xl flex items-center justify-center text-primary">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">256-bit Bank Grade Encryption</h2>
            <p className="text-[11px]">We never store MFS PINs or raw credit card numbers on our servers.</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-foreground">1. Data Collected</h3>
          <p>
            We only collect information necessary to fulfill your orders: name, shipping address, mobile contact number for courier dispatch, and optional email for order status notifications.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-foreground">2. Payment & MFS Security</h3>
          <p>
            All bKash, Nagad, SSLCommerz, and AamarPay transactions are processed directly on the respective certified payment gateway servers using OAuth and tokenized protocols.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-foreground">3. Courier Sharing</h3>
          <p>
            Delivery information is transmitted to authorized courier partners (Steadfast, Pathao, RedX) exclusively for parcel delivery and SMS OTP dispatch.
          </p>
        </div>
      </div>
    </div>
  );
}