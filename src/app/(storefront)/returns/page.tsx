'use client';

import { useLocaleStore } from '@/lib/store';
import { RotateCcw, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ReturnsPage() {
  const { locale } = useLocaleStore();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-10">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 neu-flat rounded-2xl flex items-center justify-center text-amber-500 mx-auto text-2xl">
          🔄
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
          {locale === 'bn' ? 'রিটার্ন ও রিফান্ড পলিসি' : '7-Day Return & Replacement Policy'}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Transparent, hassle-free replacement and customer protection guarantee.
        </p>
      </div>

      <div className="neu-flat rounded-3xl p-8 md:p-10 space-y-6 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="w-10 h-10 neu-inset rounded-xl flex items-center justify-center text-green-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">7-Day Replacement Guarantee</h2>
            <p className="text-[11px]">Covers manufacturing defects, transit damage, or wrong size/color.</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-foreground">1. Eligibility Conditions</h3>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>The item must be reported within 7 calendar days of delivery.</li>
            <li>Original packaging, barcode tags, accessories, and warranty cards must be intact.</li>
            <li>Electronics and appliances must not exhibit unauthorized physical tampering.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-foreground">2. Refund Timeline via MFS / Bank</h3>
          <p>
            Once our quality assurance team receives and inspects the returned parcel, refunds are processed within 24 to 48 hours directly to your original bKash, Nagad, or Bank account.
          </p>
        </div>

        <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-4">
          <span className="font-semibold text-foreground">Need to initiate a return?</span>
          <Link href="/contact" className="neu-btn-primary px-6 py-2.5 rounded-xl font-bold text-xs">
            Contact Support Desk
          </Link>
        </div>
      </div>
    </div>
  );
}