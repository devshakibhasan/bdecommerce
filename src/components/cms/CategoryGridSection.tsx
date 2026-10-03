'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import { useLocaleStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataCache } from '@/lib/dataCache';
import { formatImageUrl } from '@/utils/image';
import { ArrowRight } from 'lucide-react';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name_en: 'Men', name_bn: 'পুরুষদের পোশাক', slug: 'men', icon: '👔', image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=400&q=80', position: 1, is_active: true },
  { id: 2, name_en: 'Women', name_bn: 'মহিলাদের পোশাক', slug: 'women', icon: '👗', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80', position: 2, is_active: true },
  { id: 3, name_en: 'Kids', name_bn: 'বাচ্চাদের পোশাক', slug: 'kids', icon: '🧸', image: 'https://images.unsplash.com/photo-1519241047957-be31d7379a5d?auto=format&fit=crop&w=400&q=80', position: 3, is_active: true },
];

interface CategoryGridSectionProps {
  config: {
    title_en?: string;
    title_bn?: string;
    categories?: Category[];
  };
}

export function CategoryGridSection({ config }: CategoryGridSectionProps) {
  const safeConfig = config || {};
  const { locale } = useLocaleStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: fetchedCategories } = useQuery<Category[]>({
    queryKey: ['categories-catalog-v9'],
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
    initialData: () => {
      const cached = DataCache.getInitialData<Category[]>('/categories');
      return (Array.isArray(cached) && cached.length > 0) ? cached : DEFAULT_CATEGORIES;
    },
  });

  // Base categories on initial server config or deterministic default
  const baseCategories = (Array.isArray(safeConfig.categories) && safeConfig.categories.length > 0)
    ? safeConfig.categories
    : DEFAULT_CATEGORIES;

  // After client mount, seamlessly reflect any fresh/updated categories from database
  const rawCategories = (isMounted && Array.isArray(fetchedCategories) && fetchedCategories.length > 0)
    ? fetchedCategories
    : baseCategories;

  const displayCategories = useMemo(() => {
    if (!Array.isArray(rawCategories)) return DEFAULT_CATEGORIES;
    const result: any[] = [];
    rawCategories.forEach((cat: any) => {
      result.push(cat);
      if (Array.isArray(cat.children) && cat.children.length > 0) {
        result.push(...cat.children.slice(0, 2));
      }
    });
    return result.length > 0 ? result.slice(0, 10) : DEFAULT_CATEGORIES;
  }, [rawCategories]);

  const isBn = isMounted && locale === 'bn';
  const title = isBn ? (safeConfig.title_bn || 'জনপ্রিয় ক্যাটাগরি ব্রাউজ করুন') : (safeConfig.title_en || 'Popular Categories');

  return (
    <section className="py-6 container mx-auto px-4" suppressHydrationWarning>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Explore authentic product collections across Bangladesh</p>
        </div>
        <Link 
          href="/categories" 
          className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-primary flex items-center gap-1.5"
        >
          <span>{isBn ? 'সকল ক্যাটাগরি' : 'All Categories'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayCategories.map((category: any) => {
          const name = isBn && category.name_bn ? category.name_bn : category.name_en;
          return (
            <Link 
              href={`/products?category=${category.slug}`} 
              key={category.id}
              className="neu-flat hover:neu-raised rounded-3xl p-5 flex flex-col items-center justify-center transition-all duration-300 group text-center"
            >
              <div className="w-20 h-20 mb-3 rounded-2xl neu-inset p-3 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                {category.image ? (
                  <img 
                    src={formatImageUrl(category.image, (category as any).updated_at)} 
                    alt={name} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-3xl">{category.icon || '🛍️'}</span>
                )}
              </div>
              <span className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {name}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 font-semibold">
                Explore Items →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}