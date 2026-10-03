'use client';

import { useRef, useState, useEffect } from 'react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Product } from '@/types';
import { useLocaleStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ProductCarouselSectionProps {
  config: {
    title_en?: string;
    title_bn?: string;
    subtitle_en?: string;
    subtitle_bn?: string;
    category?: string;
    category_id?: number | null;
    filter?: string;
    limit?: number;
    columns?: number;
    badge?: string;
    products?: Product[];
    view_all_link?: string;
  };
}

export function ProductCarouselSection({ config }: ProductCarouselSectionProps) {
  const safeConfig = config || {};
  const { locale } = useLocaleStore();
  const [isMounted, setIsMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isBn = isMounted && locale === 'bn';

  const categoryKey = safeConfig.category || safeConfig.category_id || 'all';
  const filterKey = safeConfig.filter || 'all';
  const limitKey = safeConfig.limit || 8;

  const { data: fetchedProducts = [], isLoading } = useQuery({
    queryKey: ['products-carousel', String(categoryKey), String(filterKey), String(limitKey)],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (safeConfig.category) {
          params.append('category', String(safeConfig.category));
        } else if (safeConfig.category_id) {
          params.append('category_id', String(safeConfig.category_id));
        }

        if (safeConfig.filter === 'featured') {
          params.append('is_featured', '1');
        } else if (safeConfig.filter === 'new_arrivals') {
          params.append('sort', 'newest');
        }

        params.append('per_page', String(safeConfig.limit || 12));

        const res: any = await api.get(`/products?${params.toString()}`);
        if (res?.data) {
          if (Array.isArray(res.data)) return res.data;
          if (Array.isArray(res.data.items)) return res.data.items;
          if (Array.isArray(res.data.data)) return res.data.data;
        }
      } catch (err) {
        /* silenced */
      }
      return [];
    }
  });

  const title = isBn
    ? (safeConfig.title_bn || 'নতুন কালেকশন ও ট্রেন্ডিং পণ্য')
    : (safeConfig.title_en || 'Trending & Featured Products');

  const subtitle = isBn
    ? (safeConfig.subtitle_bn || 'সেরা মানের গ্যাজেট ও লাইফস্টাইল পণ্য')
    : (safeConfig.subtitle_en || 'Top-rated items handpicked for Bangladeshi shoppers');

  const getSafeProducts = (candidate: any): any[] => {
    if (!candidate) return [];
    if (Array.isArray(candidate)) return candidate;
    if (Array.isArray(candidate?.items)) return candidate.items;
    if (Array.isArray(candidate?.data)) return candidate.data;
    if (Array.isArray(candidate?.data?.items)) return candidate.data.items;
    if (Array.isArray(candidate?.data?.data)) return candidate.data.data;
    return [];
  };

  const configProducts = getSafeProducts(safeConfig.products);
  const queryProducts = getSafeProducts(fetchedProducts);

  const products = (queryProducts.length > 0)
    ? queryProducts
    : configProducts;

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      checkScroll();
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (isMounted && !isLoading && products.length === 0 && configProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8 container mx-auto px-4 md:px-6 lg:px-8" suppressHydrationWarning>
      
      {/* Header Bar (100% Responsive on Mobile & Desktop) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-foreground dark:text-white tracking-tight leading-tight">
              {title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 mt-1 font-medium">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
          {/* View All Link Button */}
          <Link
            href={safeConfig.view_all_link || (safeConfig.category ? `/products?category=${safeConfig.category}` : '/products')}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-primary/10 dark:bg-primary/10/40 border border-primary/30/80 dark:border-primary/80/80 hover:bg-primary/20 dark:hover:bg-primary/20/60 text-xs font-black text-primary dark:text-primary flex items-center gap-1.5 transition-all hover:scale-105 shadow-xs"
          >
            <span>{isBn ? 'সকল দেখুন' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Scroll Navigation Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Track (Responsive Widths & Touch Momentum) */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 pt-1 px-1 -mx-1 overscroll-x-contain"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {(() => {
            try {
              if (Array.isArray(products) && products.length > 0) {
                return products.filter(Boolean).map((product: any, idx: number) => (
                  <div
                    key={product.id || `carousel-prod-${idx}`}
                    className="w-[185px] xs:w-[210px] sm:w-[240px] md:w-[270px] lg:w-[290px] snap-start flex-shrink-0"
                  >
                    <ProductCard product={product} />
                  </div>
                ));
              }
            } catch (err) {
              /* silenced */
            }

            return [1, 2, 3, 4].map((i) => (
              <div
                key={`carousel-skel-${i}`}
                className="w-[185px] xs:w-[210px] sm:w-[240px] md:w-[270px] lg:w-[290px] snap-start flex-shrink-0 h-72 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
              />
            ));
          })()}
        </div>
      </div>

    </section>
  );
}
