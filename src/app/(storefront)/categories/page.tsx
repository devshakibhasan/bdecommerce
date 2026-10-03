'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataCache } from '@/lib/dataCache';
import { useLocaleStore } from '@/lib/store';
import { Category, Product } from '@/types';
import Link from 'next/link';
import { 
  ChevronRight, ArrowRight, Search, 
  FolderTree, ShoppingBag, X
} from 'lucide-react';
import { formatImageUrl } from '@/utils/image';

function getSafeChildren(cat: any): Category[] {
  if (!cat || !cat.children) return [];
  if (Array.isArray(cat.children)) return cat.children;
  if (typeof cat.children === 'object') {
    return Object.values(cat.children) as Category[];
  }
  return [];
}

export default function CategoriesPage() {
  const { locale } = useLocaleStore();
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isBn = isMounted && locale === 'bn';

  // Fetch all categories (shares exact cache with products and home sections)
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories-catalog-v12'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/categories');
        const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
    initialData: () => {
      const cached = DataCache.getInitialData<Category[]>('/categories');
      return (Array.isArray(cached) && cached.length > 0) ? cached : undefined;
    },
  });

  // Fetch all products for dynamic category count calculations (shares exact cache with products catalog)
  const { data: products = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ['products-catalog-v12'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/products?per_page=250');
        const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
    initialData: () => {
      const cached = DataCache.getInitialData<Product[]>('/products?per_page=250') || DataCache.getInitialData<Product[]>('/products');
      return (Array.isArray(cached) && cached.length > 0) ? cached : undefined;
    },
  });

  const safeProducts = useMemo<Product[]>(() => {
    if (Array.isArray(products)) return products;
    if (Array.isArray((products as any)?.items)) return (products as any).items;
    if (Array.isArray((products as any)?.data)) return (products as any).data;
    return [];
  }, [products]);

  const safeCategories = useMemo<Category[]>(() => {
    let list: any[] = [];
    if (Array.isArray(categories) && categories.length > 0) list = categories;
    else if (Array.isArray((categories as any)?.items)) list = (categories as any).items;
    else if (Array.isArray((categories as any)?.data)) list = (categories as any).data;
    else if (categories && typeof categories === 'object') list = Object.values(categories);

    // Fallback root categories if network/cache is empty
    if (list.length === 0) {
      list = [
        { id: 1, name_en: 'Men', name_bn: 'পুরুষ', slug: 'men', icon: '👔', parent_id: null },
        { id: 2, name_en: 'Women', name_bn: 'মহিলা', slug: 'women', icon: '👗', parent_id: null },
        { id: 3, name_en: 'Kids', name_bn: 'বাচ্চা', slug: 'kids', icon: '🧸', parent_id: null },
      ];
    }

    const rootCategories = list.filter(c => !c.parent_id);
    const subCategories = list.filter(c => !!c.parent_id);

    return rootCategories.map((cat: any) => {
      let rawChildren: any[] = [];
      if (Array.isArray(cat?.children) && cat.children.length > 0) {
        rawChildren = cat.children;
      } else if (cat?.children && typeof cat.children === 'object') {
        rawChildren = Object.values(cat.children);
      } else if (subCategories.length > 0) {
        rawChildren = subCategories.filter(s => String(s.parent_id) === String(cat.id));
      }

      // Also dynamically extract subcategories from products if not yet populated
      if (rawChildren.length === 0 && safeProducts.length > 0) {
        const discovered = new Map<string, any>();
        safeProducts.forEach(p => {
          if (p.category && String(p.category.parent_id) === String(cat.id)) {
            discovered.set(String(p.category.id), p.category);
          }
        });
        if (discovered.size > 0) {
          rawChildren = Array.from(discovered.values());
        }
      }

      const normalizedChildren = rawChildren.map((sub: any, subIdx: number) => {
        if (typeof sub === 'string') {
          return {
            id: subIdx + 1000,
            name_en: sub.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            name_bn: null,
            slug: sub,
            parent_id: cat.id,
            is_active: true,
          };
        }
        return {
          ...sub,
          id: sub.id ?? (subIdx + 1000),
          name_en: sub.name_en || sub.name || sub.title || (sub.slug ? sub.slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Subcategory'),
          name_bn: sub.name_bn || null,
          slug: sub.slug || (sub.name_en ? sub.name_en.toLowerCase().replace(/\s+/g, '-') : String(sub.id || subIdx)),
          parent_id: sub.parent_id ?? cat.id,
        };
      });

      return {
        ...cat,
        id: cat.id,
        name_en: cat.name_en || cat.name || 'Category',
        name_bn: cat.name_bn || null,
        slug: cat.slug || String(cat.id),
        children: normalizedChildren,
      };
    });
  }, [categories, safeProducts]);

  // Filter categories and subcategories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return safeCategories;
    const q = searchQuery.toLowerCase().trim();
    return safeCategories.filter((cat) => {
      const matchParent = (cat.name_en || '').toLowerCase().includes(q) || (cat.name_bn || '').toLowerCase().includes(q);
      const children = Array.isArray(cat.children) ? cat.children : [];
      const matchChildren = children.some((sub: any) => 
        (sub.name_en || '').toLowerCase().includes(q) || (sub.name_bn || '').toLowerCase().includes(q)
      );
      return matchParent || matchChildren;
    });
  }, [safeCategories, searchQuery]);

  const isLoading = (isCategoriesLoading || !isMounted) && safeCategories.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground py-10" suppressHydrationWarning>
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        
        {/* Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 neu-flat rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 dark:bg-primary/10/60 text-primary dark:text-primary text-xs font-black tracking-wide uppercase border border-primary/30 dark:border-primary/80">
              <FolderTree className="w-3.5 h-3.5" />
              <span>Catalog Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">
              {isBn ? 'সকল ক্যাটাগরি ও কালেকশন' : 'Browse All Categories'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              {isBn 
                ? 'আপনার পছন্দের পণ্য সহজে খুঁজে পেতে বিভিন্ন ক্যাটাগরি ও সাব-ক্যাটাগরি ব্রাউজ করুন।' 
                : 'Explore our exclusive collection of Men, Women, and Kids clothing.'}
            </p>
          </div>

          {/* Real-time Category Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isBn ? 'ক্যাটাগরি খুঁজুন...' : 'Search categories...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-9 py-3 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="neu-flat rounded-3xl p-6 animate-pulse space-y-4 h-64 flex flex-col justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 neu-inset rounded-2xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 neu-inset rounded-lg w-3/4" />
                    <div className="h-3 neu-inset rounded-lg w-1/3" />
                  </div>
                </div>
                <div className="h-10 neu-inset rounded-2xl w-full" />
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="neu-flat rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto neu-inset rounded-3xl flex items-center justify-center text-3xl">
              📂
            </div>
            <h2 className="text-lg font-black text-foreground">No Categories Found</h2>
            <p className="text-xs text-muted-foreground">
              No categories match &quot;{searchQuery}&quot;. Try searching with different keywords.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="neu-btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold"
            >
              Show All Categories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category: Category) => {
              const children = Array.isArray(category.children) ? category.children : [];
              const subcategoryIds = new Set(children.map((c: any) => String(c.id)));
              const subcategorySlugs = new Set(children.map((c: any) => (c.slug || '').toLowerCase()));
              const productCount = safeProducts.filter(p => {
                const pCatSlug = (p.category?.slug || '').toLowerCase();
                const pCatId = String(p.category_id || p.category?.id || '');
                const pParentId = String(p.category?.parent_id || '');
                return (
                  pCatSlug === (category.slug || '').toLowerCase() ||
                  pCatId === String(category.id) ||
                  subcategoryIds.has(pCatId) ||
                  subcategorySlugs.has(pCatSlug) ||
                  pParentId === String(category.id)
                );
              }).length;

              const name = isBn && category.name_bn ? category.name_bn : category.name_en;
              const catImg = formatImageUrl(category.image, (category as any).updated_at);

              return (
                <div
                  key={category.id}
                  className="neu-flat hover:neu-raised rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group border border-border/40 hover:border-primary/30"
                >
                  <div className="space-y-4">
                    
                    {/* Category Title & Thumbnail */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl neu-inset p-2 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform flex-shrink-0 bg-slate-50 dark:bg-slate-900 border border-border/50">
                        {catImg ? (
                          <img
                            src={catImg}
                            alt={category.name_en}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                        ) : (
                          <span className="text-2xl">{category.icon || '🛍️'}</span>
                        )}
                      </div>
                      
                      <div className="overflow-hidden">
                        <Link href={`/products?category=${category.slug}`}>
                          <h2 className="text-base font-black text-foreground group-hover:text-primary transition-colors truncate">
                            {name}
                          </h2>
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {children.length} Subcategories
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-foreground font-mono font-bold">
                            {productCount} Items
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Subcategories Pills List */}
                    {children.length > 0 && (
                      <div className="neu-inset rounded-2xl p-3 space-y-1.5 bg-background/50 max-h-64 overflow-y-auto pr-1 filter-scrollbar">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                            Subcategories ({children.length})
                          </span>
                          <span className="text-[9px] font-bold text-primary/80">
                            Scroll to explore
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          {children.map((sub: Category, subIdx: number) => (
                            <Link
                              key={`cat-sub-${category.id || category.slug}-${sub.id || sub.slug || subIdx}`}
                              href={`/products?category=${sub.slug}`}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl hover:bg-primary/10 dark:hover:bg-primary/10/60 hover:text-primary dark:hover:text-primary transition-colors text-slate-700 dark:text-slate-300 font-bold group/sub"
                            >
                              <span className="truncate">{isBn && sub.name_bn ? sub.name_bn : sub.name_en}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover/sub:text-primary transition-colors" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Link Button */}
                  <div className="pt-4">
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="w-full py-2.5 neu-btn hover:neu-btn-primary rounded-2xl text-xs font-black text-primary hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সকল পণ্য দেখুন' : 'Explore Category'}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
