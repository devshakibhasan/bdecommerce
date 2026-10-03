'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Category, Product } from '@/types';
import { useLocaleStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Layers } from 'lucide-react';
import Link from 'next/link';
import { DEFAULT_CATEGORIES } from './CategoryGridSection';

interface CategoryProductRowProps {
  category: Category & { children?: Category[] };
}

function CategoryProductRow({ category }: CategoryProductRowProps) {
  const { locale } = useLocaleStore();
  const [isMounted, setIsMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isBn = isMounted && locale === 'bn';

  // Subcategories to display as quick filter pills (top 12)
  const subcategories = useMemo(() => {
    if (!category.children || !Array.isArray(category.children)) return [];
    return category.children.slice(0, 12);
  }, [category.children]);

  const effectiveSlug = selectedSubcategory ? selectedSubcategory.slug : category.slug;

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products-category-row', effectiveSlug],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/products?category=${encodeURIComponent(effectiveSlug)}&per_page=16`);
        if (res?.data) {
          if (Array.isArray(res.data)) return res.data;
          if (Array.isArray(res.data.items)) return res.data.items;
          if (Array.isArray(res.data.data)) return res.data.data;
        }
      } catch (err) {
        /* silenced */
      }
      return [];
    },
    staleTime: 60 * 1000,
  });

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

  // Themed metadata per main category
  const categoryMeta = useMemo(() => {
    const slug = (category.slug || '').toLowerCase();
    if (slug === 'men') {
      return {
        icon: '👔',
        accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        badgeBn: '৬৭+ প্রিমিয়াম পণ্য',
        badgeEn: '67+ Premium Items',
        subBn: 'পাঞ্জাবি, ক্যাজুয়াল শার্ট, জিন্স, পোলো ও ফ্যাশন এক্সেসরিজ',
        subEn: 'Panjabis, casual shirts, denim jeans, polos & premium lifestyle',
      };
    }
    if (slug === 'women') {
      return {
        icon: '👗',
        accentBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        badgeBn: 'লেটেস্ট সামার কালেকশন',
        badgeEn: 'Latest Summer Collection',
        subBn: 'আকর্ষণীয় শাড়ি, কুর্তি, ড্রেস ও ট্র্যাডিশনাল পোশাক',
        subEn: 'Elegant sarees, kurtis, dresses & party wear',
      };
    }
    if (slug === 'kids') {
      return {
        icon: '🧸',
        accentBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        badgeBn: 'আরামদায়ক কিডস ওয়্যার',
        badgeEn: 'Comfortable Kids Wear',
        subBn: 'বাচ্চাদের আরামদায়ক পোশাক, রম্পার, টি-শার্ট ও শর্টস',
        subEn: 'Soft everyday rompers, t-shirts, jackets & shorts',
      };
    }
    return {
      icon: '🏷️',
      accentBg: 'bg-primary/10 text-primary border-primary/20',
      badgeBn: 'এক্সক্লুসিভ কালেকশন',
      badgeEn: 'Exclusive Collection',
      subBn: 'সেরা মানের পণ্য ও দ্রুততম ক্যাশ অন ডেলিভারি সুবিধা',
      subEn: 'Top quality products with fast nationwide cash on delivery',
    };
  }, [category.slug]);

  const categoryName = isBn && category.name_bn ? category.name_bn : category.name_en;
  const activeTitle = selectedSubcategory
    ? (isBn && selectedSubcategory.name_bn ? selectedSubcategory.name_bn : selectedSubcategory.name_en)
    : categoryName;

  const viewAllUrl = `/products?category=${encodeURIComponent(effectiveSlug)}`;

  return (
    <div className="py-6 sm:py-8 border-b border-border/40 last:border-b-0 space-y-4">
      
      {/* Category Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left: Icon, Title, Badge & Subtitle */}
        <div className="space-y-1.5">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="text-2xl sm:text-3xl filter drop-shadow-sm select-none" role="img" aria-label={category.name_en}>
              {categoryMeta.icon}
            </span>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <span>{categoryName}</span>
              {selectedSubcategory && (
                <>
                  <span className="text-muted-foreground/40 font-normal">/</span>
                  <span className="text-primary text-lg sm:text-xl md:text-2xl font-bold">
                    {activeTitle}
                  </span>
                </>
              )}
            </h3>

            <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-2xs ${categoryMeta.accentBg}`}>
              {isBn ? categoryMeta.badgeBn : categoryMeta.badgeEn}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {isBn ? categoryMeta.subBn : categoryMeta.subEn}
          </p>
        </div>

        {/* Right: Actions & Carousel Controls */}
        <div className="flex items-center justify-between md:justify-end gap-3 self-end md:self-auto w-full md:w-auto">
          {/* View All Button */}
          <Link
            href={viewAllUrl}
            className="px-4 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-black flex items-center gap-1.5 transition-all hover:scale-105 shadow-xs"
          >
            <span>{isBn ? `সকল ${activeTitle} দেখুন` : `View All ${activeTitle}`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="p-2 sm:p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="p-2 sm:p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Subcategory Quick Filter Chips (Horizontal Scrollable) */}
      {subcategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
          {/* "All" Chip */}
          <button
            type="button"
            onClick={() => setSelectedSubcategory(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedSubcategory === null
                ? 'bg-primary text-primary-foreground shadow-xs scale-105'
                : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            {isBn ? `সকল ${categoryName}` : `All ${category.name_en}`}
          </button>

          {/* Subcategory Chips */}
          {subcategories.map((sub) => {
            const isSelected = selectedSubcategory?.id === sub.id;
            const subTitle = isBn && sub.name_bn ? sub.name_bn : sub.name_en;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubcategory(isSelected ? null : sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs scale-105'
                    : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50'
                }`}
              >
                {subTitle}
              </button>
            );
          })}

          {/* Link to see all subcategories if more than 12 */}
          {category.children && category.children.length > 12 && (
            <Link
              href={`/products?category=${category.slug}`}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-primary hover:underline whitespace-nowrap flex items-center gap-1"
            >
              <span>{isBn ? `আরও ${category.children.length - 12}+ সাব-ক্যাটাগরি` : `+${category.children.length - 12} More`}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Product Track (Carousel with Snap Scrolling) */}
      <div className="relative pt-1">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-3 pt-1 px-1 -mx-1 overscroll-x-contain"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={`cat-row-skel-${i}`}
                className="w-[185px] xs:w-[210px] sm:w-[240px] md:w-[270px] lg:w-[290px] snap-start flex-shrink-0 h-80 rounded-3xl bg-muted/60 animate-pulse border border-border/40"
              />
            ))
          ) : products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.id}
                className="w-[185px] xs:w-[210px] sm:w-[240px] md:w-[270px] lg:w-[290px] snap-start flex-shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))
          ) : (
            <div className="w-full py-12 px-6 rounded-3xl neu-inset text-center space-y-2">
              <p className="text-sm font-bold text-muted-foreground">
                {isBn 
                  ? 'এই ক্যাটাগরিতে নতুন কালেকশন খুব শীঘ্রই যুক্ত হচ্ছে!' 
                  : 'New arrivals for this collection are coming soon!'}
              </p>
              <Link 
                href="/products" 
                className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
              >
                <span>{isBn ? 'অন্যান্য পণ্য দেখুন' : 'Explore all store products'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

interface EveryCategoryProductsSectionProps {
  config?: {
    title_en?: string;
    title_bn?: string;
    subtitle_en?: string;
    subtitle_bn?: string;
    categories?: Category[];
  };
}

export function EveryCategoryProductsSection({ config }: EveryCategoryProductsSectionProps) {
  const safeConfig = config || {};
  const { locale } = useLocaleStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isBn = isMounted && locale === 'bn';

  // Fetch full category tree from backend
  const { data: fetchedCategories } = useQuery<Category[]>({
    queryKey: ['categories-catalog-v5'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/categories');
        const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
        if (Array.isArray(items) && items.length > 0) return items;
      } catch (err) {
        /* silenced */
      }
      return DEFAULT_CATEGORIES;
    },
    staleTime: 5 * 60 * 1000,
  });

  const rawList = (Array.isArray(fetchedCategories) && fetchedCategories.length > 0)
    ? fetchedCategories
    : (Array.isArray(safeConfig.categories) && safeConfig.categories.length > 0)
      ? safeConfig.categories
      : DEFAULT_CATEGORIES;

  // Filter for top-level parent categories (e.g. Men, Women, Kids)
  const parentCategories = useMemo(() => {
    if (!Array.isArray(rawList)) return DEFAULT_CATEGORIES;
    const parents = rawList.filter((c: any) => !c.parent_id || c.parent_id === null);
    return parents.length > 0 ? parents : DEFAULT_CATEGORIES;
  }, [rawList]);

  const mainTitle = isBn
    ? (safeConfig.title_bn || 'ক্যাটাগরি ভিত্তিক পণ্য কালেকশন')
    : (safeConfig.title_en || 'Shop by Category Collection');

  const mainSubtitle = isBn
    ? (safeConfig.subtitle_bn || 'পুরুষ, মহিলা ও শিশুদের সেরা পোশাক ও লাইফস্টাইল পণ্য বেছে নিন')
    : (safeConfig.subtitle_en || 'Explore premium collections for Men, Women & Kids with doorstep delivery');

  return (
    <section className="py-8 sm:py-12 container mx-auto px-4 md:px-6 lg:px-8 space-y-8" suppressHydrationWarning>
      
      {/* Section Main Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full neu-inset text-xs font-black text-primary">
          <Layers className="w-3.5 h-3.5" />
          <span>{isBn ? 'সম্পূর্ণ স্টোর ক্যাটালগ' : 'Complete Store Catalog'}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">
          {mainTitle}
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          {mainSubtitle}
        </p>
      </div>

      {/* Render Product Row for Every Category */}
      <div className="space-y-4">
        {parentCategories.map((category) => (
          <CategoryProductRow key={category.id} category={category} />
        ))}
      </div>

    </section>
  );
}
