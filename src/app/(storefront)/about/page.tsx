'use client';

import { useLocaleStore } from '@/lib/store';
import { ShieldCheck, Truck, Award, Users, HeartHandshake, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const { locale } = useLocaleStore();

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="w-16 h-16 neu-flat rounded-2xl flex items-center justify-center text-primary text-3xl mx-auto mb-4">
          🇧🇩
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
          {locale === 'bn' ? 'আমাদের গল্প ও প্রতিশ্রুতি' : 'Empowering E-Commerce in Bangladesh'}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {locale === 'bn'
            ? 'বিডি শপ বাংলাদেশের ৬৪টি জেলায় আসল ও মানসম্মত পণ্য পৌঁছে দিতে নিবেদিত।'
            : 'BD Shop is engineered to deliver high-quality, authentic products to millions of shoppers across 64 districts in Bangladesh with complete trust.'}
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neu-flat rounded-3xl p-8 space-y-3">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-foreground">100% Authentic Promise</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every electronic device, fashion apparel, and artisanal grocery item is verified for genuine quality and official warranty.
          </p>
        </div>

        <div className="neu-flat rounded-3xl p-8 space-y-3">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-green-600">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-foreground">64 Districts Reach</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Integrated with Steadfast, Pathao, and RedX logistics to ensure 24h deliveries in Dhaka and 48-72h nationwide delivery.
          </p>
        </div>

        <div className="neu-flat rounded-3xl p-8 space-y-3">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-amber-500">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-foreground">Cash on Delivery & MFS</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Support for instant bKash tokenized payments, Nagad RSA, SSLCommerz, and doorstep Cash on Delivery for absolute peace of mind.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="neu-raised rounded-3xl p-8 md:p-12 space-y-6">
        <h2 className="text-2xl font-black text-foreground">Our Vision for Digital Commerce</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          From Tangail’s handloom weavers crafting authentic Jamdani sarees to the latest high-tech smartphones and laptops, BD Shop connects Bangladeshi consumers with genuine products at honest transparent prices.
        </p>

        <div className="pt-4 flex flex-wrap gap-4">
          <Link href="/products" className="neu-btn-primary px-8 py-3.5 rounded-2xl font-bold text-xs">
            Explore Collection
          </Link>
          <Link href="/contact" className="neu-btn px-8 py-3.5 rounded-2xl font-bold text-xs text-foreground">
            Contact Team
          </Link>
        </div>
      </div>
    </div>
  );
}