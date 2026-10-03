'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useLocaleStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Zap, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 14, minutes: 28, seconds: 45 });
  
  useEffect(() => {
    const target = new Date(Date.now() + 320000000).getTime();
    const interval = setInterval(() => {
      const distance = target - new Date().getTime();
      if (distance <= 0) return;
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-2 sm:gap-3">
      {Object.entries(timeLeft).map(([key, value]) => (
        <div key={key} className="flex flex-col items-center">
          <div className="neu-flat w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black text-primary">
            {String(value).padStart(2, '0')}
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">
            {key}
          </span>
        </div>
      ))}
    </div>
  );
}

interface FlashSaleSectionProps {
  config: {
    title_en?: string;
    title_bn?: string;
    ends_at?: string;
    products?: any[];
  };
}

export function FlashSaleSection({ config }: FlashSaleSectionProps) {
  const { locale } = useLocaleStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isBn = isMounted && locale === 'bn';

  const { data: flashSaleProducts = [] } = useQuery({
    queryKey: ['active-flash-sale-products'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/flash-sales/active');
        if (res?.data?.products && Array.isArray(res.data.products)) {
          return res.data.products;
        }
      } catch (err) {
        /* silenced */
      }

      // Fallback query to live featured products
      try {
        const pRes: any = await api.get('/products?is_featured=1&per_page=12');
        if (pRes?.data) {
          if (Array.isArray(pRes.data)) return pRes.data;
          if (Array.isArray(pRes.data.items)) return pRes.data.items;
          if (Array.isArray(pRes.data.data)) return pRes.data.data;
        }
      } catch (e) {}

      return [];
    }
  });

  const title = isBn 
    ? (config.title_bn || 'মেগা ফ্ল্যাশ সেল অফার ⚡') 
    : (config.title_en || 'Mega Flash Sale Deals ⚡');

  const rawProducts = (config.products && Array.isArray(config.products) && config.products.length > 0)
    ? config.products
    : flashSaleProducts;

  const products: any[] = Array.isArray(rawProducts)
    ? rawProducts
    : (Array.isArray((rawProducts as any)?.items)
        ? (rawProducts as any).items
        : (Array.isArray((rawProducts as any)?.data)
            ? (rawProducts as any).data
            : []));

  if (products.length === 0) return null;

  return (
    <section className="py-6 container mx-auto px-4" suppressHydrationWarning>
      <div className="neu-raised rounded-3xl p-6 md:p-8 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl neu-inset text-red-600 flex items-center justify-center">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{title}</h2>
              <p className="text-xs text-muted-foreground">Limited inventory promotions with instant discounts</p>
            </div>
          </div>
          
          {/* Neumorphic Countdown Capsules */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500 mr-1" />
            <CountdownTimer />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.isArray(products) && products.filter(Boolean).map((p: any) => (
            <ProductCard 
              key={p.id} 
              product={{
                ...p,
                primary_image_url: p.primary_image_url || p.image || p.images?.[0]?.path,
              }} 
            />
          ))}
        </div>

      </div>
    </section>
  );
}