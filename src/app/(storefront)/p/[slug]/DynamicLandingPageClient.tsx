'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SectionRenderer } from '@/components/cms/SectionRenderer';
import { SingleProductFunnel } from '@/components/storefront/SingleProductFunnel';
import { Loader2, AlertCircle, ArrowLeft, Home, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface DynamicLandingPageClientProps {
  initialPage?: any;
  slug: string;
}

export function DynamicLandingPageClient({ initialPage, slug }: DynamicLandingPageClientProps) {
  const { data: page, isLoading } = useQuery({
    queryKey: ['landing-page', slug],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/pages/${slug}`);
        const data = res?.data?.data || res?.data || null;
        if (data) return data;
      } catch (err) {
        // Try content route
        try {
          const contentRes: any = await api.get(`/content/pages/${slug}`);
          const cData = contentRes?.data?.data || contentRes?.data || null;
          if (cData) return cData;
        } catch (cErr) {}
      }
      return null;
    },
    initialData: initialPage || undefined,
    enabled: !initialPage,
    staleTime: 60 * 1000,
  });

  if (isLoading && !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">
          লোডিং হচ্ছে... পেজটি লোড করা হচ্ছে
        </p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center clay-inset">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-black text-foreground">
            পেজটি খুঁজে পাওয়া যায়নি
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            আপনি যে পেজটি খুঁজছেন তা বর্তমানে সক্রিয় নেই অথবা মুছে ফেলা হয়েছে।
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center pt-2">
          <Link
            href="/"
            className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>হোমে ফিরে যান</span>
          </Link>
          <Link
            href="/products"
            className="px-5 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs font-black flex items-center gap-2 hover:bg-muted transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>সকল পণ্য দেখুন</span>
          </Link>
        </div>
      </div>
    );
  }

  // If this is a Single/Multi-Product Sales Funnel Landing Page (or has product/page_products attached)
  if (
    page.page_type === 'single_product_funnel' ||
    page.page_type === 'multi_product_funnel' ||
    page.product ||
    (page.page_products && page.page_products.length > 0)
  ) {
    return <SingleProductFunnel pageData={page} />;
  }

  // Standard CMS / Campaign Landing Page with Dynamic Sections
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-muted/40 py-8 border-b">
        <div className="container mx-auto px-4 text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">{page.title_en}</h1>
          {page.title_bn && (
            <p className="text-sm font-semibold text-muted-foreground">{page.title_bn}</p>
          )}
        </div>
      </div>
      <SectionRenderer sections={page.sections || []} />
    </div>
  );
}
