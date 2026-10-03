'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataCache } from '@/lib/dataCache';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useLocaleStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { 
  Filter, X, Search, SlidersHorizontal, ArrowUpDown, 
  Grid3X3, Grid2X2, Check, RotateCcw, Sparkles, 
  Star, Tag, DollarSign, PackageCheck, Zap, Layers, ChevronRight,
  ChevronDown, Ruler
} from 'lucide-react';
import { Product, Category } from '@/types';
import { formatBDT } from '@/utils/currency';

const BRANDS = [
  { id: 'zara', label: 'Zara', match: ['zara'] },
  { id: 'hm', label: 'H&M', match: ['h&m', 'hm'] },
  { id: 'levis', label: "Levi's", match: ["levi's", 'levis'] },
  { id: 'nike', label: 'Nike', match: ['nike'] },
  { id: 'aarong', label: 'Aarong', match: ['aarong'] },
  { id: 'adidas', label: 'Adidas', match: ['adidas'] },
];

const PRICE_PRESETS = [
  { label: 'All Prices', min: 0, max: 250000 },
  { label: 'Under ৳1,000', min: 0, max: 1000 },
  { label: '৳1,000 - ৳5,000', min: 1000, max: 5000 },
  { label: '৳5,000 - ৳25,000', min: 5000, max: 25000 },
  { label: '৳25,000 - ৳50,000', min: 25000, max: 50000 },
  { label: 'Above ৳50,000', min: 50000, max: 250000 },
];

// Target sizes requested by user
const PREFERRED_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL',
  '26', '28', '30', '31/32', '32', '32/32', '33/32', '34', '36',
  '90/95" Inch', '95"', '95" Inch', 'Free Size'
];

function ProductsCatalogContent() {
  const { locale } = useLocaleStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL query params initialization
  const rawCat = searchParams.get('category');
  const initialCategory = (rawCat && rawCat !== 'undefined' && rawCat !== 'null') ? rawCat : 'all';
  const initialSearch = searchParams.get('search') || '';

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeSearch, setSizeSearch] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(250000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(false);
  const [discountOnly, setDiscountOnly] = useState<boolean>(false);
  const [sort, setSort] = useState<string>('featured');
  const [viewMode, setViewMode] = useState<'grid-3' | 'grid-4'>('grid-3');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [openCategorySlugs, setOpenCategorySlugs] = useState<Record<string, boolean>>({
    men: true,
    women: true,
    kids: true,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync category with URL
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory === 'undefined' || urlCategory === 'null') {
      setSelectedCategory('all');
    } else if (urlCategory && urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [searchParams, selectedCategory]);

  // Fetch all categories (shares unified cache)
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

  // Fetch all products
  const { data: rawProducts = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ['products-catalog-v12'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/products?per_page=250');
        const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        return Array.isArray(items) ? items : [];
      } catch (err: any) {
        return [];
      }
    },
    initialData: () => {
      const cached = DataCache.getInitialData<Product[]>('/products?per_page=250') || DataCache.getInitialData<Product[]>('/products');
      return (Array.isArray(cached) && cached.length > 0) ? cached : undefined;
    },
  });

  const isLoading = isProductsLoading || !mounted;

  const safeProducts = useMemo<Product[]>(() => {
    let result = [];
    if (Array.isArray(rawProducts)) result = rawProducts;
    else if (Array.isArray((rawProducts as any)?.items)) result = (rawProducts as any).items;
    else if (Array.isArray((rawProducts as any)?.data)) result = (rawProducts as any).data;
    return result;
  }, [rawProducts]);

  const safeCategories = useMemo<Category[]>(() => {
    let list: any[] = [];
    if (Array.isArray(categories) && categories.length > 0) list = categories;
    else if (Array.isArray((categories as any)?.items)) list = (categories as any).items;
    else if (Array.isArray((categories as any)?.data)) list = (categories as any).data;
    else if (categories && typeof categories === 'object') list = Object.values(categories);

    // Guaranteed root categories fallback if network is delayed
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

      // Also dynamically extract subcategories from products if children is not yet populated
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
            name_en: sub.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
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

  // Helper to get localized category or subcategory name
  const getCategoryName = (c: any): string => {
    if (!c) return '';
    if (typeof c === 'string') return c.replace(/-/g, ' ').replace(/\b\w/g, (ch: string) => ch.toUpperCase());
    if (locale === 'bn' && c.name_bn) return c.name_bn;
    return c.name_en || c.name || c.title || (c.slug ? c.slug.replace(/-/g, ' ').replace(/\b\w/g, (ch: string) => ch.toUpperCase()) : `Category #${c.id || ''}`);
  };

  // Helper to count products for a category / subcategory
  const getCategoryProductCount = (slug?: string, id?: number | string): number => {
    if (!slug && !id) return 0;
    const targetSlug = (slug || '').toLowerCase();
    const targetId = id !== undefined && id !== null ? String(id) : '';

    // Check if it's a parent category
    const parentCat = safeCategories.find(c => 
      (targetSlug && (c.slug || '').toLowerCase() === targetSlug) || 
      (targetId && String(c.id) === targetId)
    );

    if (parentCat && Array.isArray(parentCat.children) && parentCat.children.length > 0) {
      const subSlugs = new Set(parentCat.children.map(s => (s?.slug || '').toLowerCase()).filter(Boolean));
      const subIds = new Set(parentCat.children.map(s => String(s?.id || '')).filter(Boolean));
      return safeProducts.filter(p => {
        const catSlug = (p.category?.slug || '').toLowerCase();
        const catId = String(p.category_id || p.category?.id || '');
        const parentId = String(p.category?.parent_id || '');
        if (targetSlug && (catSlug === targetSlug || catId === targetId || parentId === targetId)) return true;
        return subSlugs.has(catSlug) || subIds.has(catId);
      }).length;
    }

    // Leaf category / subcategory direct count
    return safeProducts.filter(p => {
      const catSlug = (p.category?.slug || '').toLowerCase();
      const catId = String(p.category_id || p.category?.id || '');
      if (targetSlug && catSlug === targetSlug) return true;
      if (targetId && catId === targetId) return true;
      return false;
    }).length;
  };

  // Active Parent Category (Men, Women, Kids, etc.)
  const activeParentCategory = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return null;
    const target = selectedCategory.toLowerCase();
    const root = safeCategories.find(c => (c.slug || '').toLowerCase() === target || String(c.id) === selectedCategory);
    if (root && root.children && root.children.length > 0) return root;
    for (const parent of safeCategories) {
      if (parent.children?.some(s => (s.slug || '').toLowerCase() === target || String(s.id) === selectedCategory)) {
        return parent;
      }
    }
    return null;
  }, [safeCategories, selectedCategory]);

  // Top trending subcategories across catalog to show when 'all' is selected
  const popularSubcategories = useMemo(() => {
    const list: any[] = [];
    safeCategories.forEach(root => {
      (root.children || []).forEach(sub => {
        const count = getCategoryProductCount(sub.slug, sub.id);
        if (count > 0) {
          list.push({ ...sub, rootSlug: root.slug, rootName: root.name_en, count });
        }
      });
    });
    return list.sort((a, b) => b.count - a.count).slice(0, 16);
  }, [safeCategories, safeProducts]);

  // Subcategories displayed in the prominent top category bar
  const displayedSubcategories = useMemo(() => {
    if (activeParentCategory && activeParentCategory.children && activeParentCategory.children.length > 0) {
      return activeParentCategory.children;
    }
    return popularSubcategories;
  }, [activeParentCategory, popularSubcategories]);

  // All distinct sizes present in products catalog (only showing valid sizes with count > 0)
  const availableSizes = useMemo(() => {
    const sizeCounts: Record<string, number> = {};

    safeProducts.forEach(product => {
      const productSizes = new Set<string>();
      const variants = Array.isArray(product.variants) ? product.variants : [];
      variants.forEach(v => {
        if (v && v.size && typeof v.size === 'string' && v.size.trim()) {
          productSizes.add(v.size.trim());
        }
      });
      productSizes.forEach(s => {
        sizeCounts[s] = (sizeCounts[s] || 0) + 1;
      });
    });

    // Only include sizes that have at least 1 product
    const validSizes = Object.entries(sizeCounts)
      .filter(([_, count]) => count > 0)
      .map(([size, count]) => ({
        size,
        count,
        isPreferred: PREFERRED_SIZES.includes(size)
      }));

    validSizes.sort((a, b) => {
      const idxA = PREFERRED_SIZES.indexOf(a.size);
      const idxB = PREFERRED_SIZES.indexOf(b.size);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.count - a.count;
    });

    return validSizes;
  }, [safeProducts]);

  // Filtered sizes based on sizeSearch
  const filteredAvailableSizes = useMemo(() => {
    if (!sizeSearch.trim()) return availableSizes;
    const term = sizeSearch.toLowerCase().trim();
    return availableSizes.filter(item => item.size.toLowerCase().includes(term));
  }, [availableSizes, sizeSearch]);

  // Master Filter & Sort Engine
  const filteredProducts = useMemo(() => {
    return safeProducts.filter((product) => {
      // 1. Search Query Match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = (product.name_en || '').toLowerCase().includes(query) || (product.name_bn || '').toLowerCase().includes(query);
        const matchDesc = (product.short_description_en || '').toLowerCase().includes(query) || (product.description_en || '').toLowerCase().includes(query);
        const matchSku = (product.sku_prefix || '').toLowerCase().includes(query) || (product.slug || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchSku) {
          return false;
        }
      }

      // 2. Category & Subcategory Filter
      if (selectedCategory && selectedCategory !== 'all') {
        const targetSlug = selectedCategory.toLowerCase();
        const prodCatSlug = (product.category?.slug || '').toLowerCase();
        const prodCatId = String(product.category_id || product.category?.id || '');

        let matchesCat = false;
        if (prodCatSlug === targetSlug || prodCatId === selectedCategory) {
          matchesCat = true;
        } else {
          const ROOT_MAP: Record<string, number> = { men: 1, women: 2, kids: 3 };
          if (ROOT_MAP[targetSlug] && Number(product.category?.parent_id) === ROOT_MAP[targetSlug]) {
            matchesCat = true;
          } else {
            // Check if selectedCategory is a parent category that owns this product's category
            const parentCategory = safeCategories.find(
              c => (c.slug || '').toLowerCase() === targetSlug || String(c.id) === selectedCategory
            );
            if (parentCategory && Array.isArray(parentCategory.children)) {
              const isSub = parentCategory.children.some(
                sub => (sub.slug || '').toLowerCase() === prodCatSlug || String(sub.id) === prodCatId
              );
              if (isSub) matchesCat = true;
            }
            if (parentCategory && String(product.category?.parent_id) === String(parentCategory.id)) {
              matchesCat = true;
            }
          }
        }
        if (!matchesCat) return false;
      }

      // 3. Size Filter
      if (selectedSizes.length > 0) {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const hasSize = variants.some(v => 
          v.size && selectedSizes.includes(v.size.trim())
        );
        if (!hasSize) return false;
      }

      // 4. Brand Filter
      if (selectedBrands.length > 0) {
        const productName = (product.name_en || '').toLowerCase();
        const brandMatch = selectedBrands.some(brandId => {
          const brandObj = BRANDS.find(b => b.id === brandId);
          return brandObj?.match.some(keyword => productName.includes(keyword));
        });
        if (!brandMatch) return false;
      }

      // 5. Price Range
      const effectivePrice = Number(product.current_price || product.base_price || 0);
      if (effectivePrice < minPrice || effectivePrice > maxPrice) {
        return false;
      }

      // 6. In Stock Filter
      if (inStockOnly && product.is_in_stock === false) {
        return false;
      }

      // 7. Featured Only
      if (featuredOnly && !product.is_featured) {
        return false;
      }

      // 8. Discount / Sale Only
      if (discountOnly) {
        const compPrice = Number(product.compare_price || 0);
        if (!compPrice || compPrice <= effectivePrice) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const priceA = Number(a.current_price || a.base_price || 0);
      const priceB = Number(b.current_price || b.base_price || 0);
      const nameA = a.name_en || '';
      const nameB = b.name_en || '';

      switch (sort) {
        case 'price_low':
          return priceA - priceB;
        case 'price_high':
          return priceB - priceA;
        case 'alpha_asc':
          return nameA.localeCompare(nameB);
        case 'alpha_desc':
          return nameB.localeCompare(nameA);
        case 'date_old':
          return (a.id || 0) - (b.id || 0);
        case 'date_new':
        case 'newest':
          return (b.id || 0) - (a.id || 0);
        case 'best_selling':
        case 'most_relevant':
          return (b.views_count || 0) - (a.views_count || 0);
        case 'featured':
        default:
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return (b.views_count || 0) - (a.views_count || 0);
      }
    });
  }, [safeProducts, searchQuery, selectedCategory, selectedSizes, selectedBrands, minPrice, maxPrice, inStockOnly, featuredOnly, discountOnly, sort, safeCategories]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedSizes.length > 0) count += selectedSizes.length;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (minPrice > 0 || maxPrice < 250000) count++;
    if (inStockOnly) count++;
    if (featuredOnly) count++;
    if (discountOnly) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCategory, selectedSizes, selectedBrands, minPrice, maxPrice, inStockOnly, featuredOnly, discountOnly, searchQuery]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSizes([]);
    setSelectedBrands([]);
    setMinPrice(0);
    setMaxPrice(250000);
    setInStockOnly(false);
    setFeaturedOnly(false);
    setDiscountOnly(false);
    setSearchQuery('');
    setCategorySearch('');
    setSizeSearch('');
    setSort('featured');
    router.push('/products');
  };

  const handleSelectCategory = (catIdentifier?: string | number | null) => {
    const raw = String(catIdentifier || '').trim();
    const target = (raw && raw !== 'undefined' && raw !== 'null' && raw !== 'all') ? raw : 'all';
    setSelectedCategory(target);
    if (target === 'all') {
      router.push('/products');
    } else {
      router.push(`/products?category=${encodeURIComponent(target)}`);
    }
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandId) ? prev.filter(b => b !== brandId) : [...prev, brandId]
    );
  };

  // Filter Sidebar UI with SSR Hydration Protection
  const FilterSidebar = () => {
    if (!mounted) {
      return (
        <div className="neu-flat rounded-3xl flex flex-col md:max-h-[calc(100vh-6rem)] overflow-hidden p-5 space-y-6 animate-pulse shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <div className="h-4 w-28 bg-muted rounded-lg" />
          </div>
          <div className="space-y-3">
            <div className="h-3 w-20 bg-muted rounded-md" />
            <div className="h-8 bg-muted rounded-xl" />
            <div className="space-y-2 pt-1">
              <div className="h-8 bg-muted/60 rounded-xl" />
              <div className="h-8 bg-muted/60 rounded-xl" />
              <div className="h-8 bg-muted/60 rounded-xl" />
            </div>
          </div>
          <div className="space-y-3 border-t border-border/80 pt-4">
            <div className="h-3 w-16 bg-muted rounded-md" />
            <div className="h-8 bg-muted rounded-xl" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-7 bg-muted/60 rounded-xl" />
              <div className="h-7 bg-muted/60 rounded-xl" />
              <div className="h-7 bg-muted/60 rounded-xl" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="neu-flat rounded-3xl flex flex-col md:max-h-[calc(100vh-6rem)] overflow-hidden shadow-sm">
        {/* Sticky Header with Counter and Reset Action */}
        <div className="p-4 sm:p-5 pb-3 border-b border-border/80 flex items-center justify-between bg-card/95 backdrop-blur-md z-10 shrink-0">
          <h3 className="font-black text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </h3>
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-destructive hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          )}
        </div>

        {/* Scrollable Filters Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-4 space-y-6 overscroll-contain filter-scrollbar">
          {/* Category Filter with Subcategories and Search Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Categories</span>
          </label>
          <span className="text-[10px] text-muted-foreground font-semibold">
            {safeCategories.reduce((acc, cat) => acc + (cat.children?.length || 0), 0)} Subcategories
          </span>
        </div>

        {/* Search options input for categories */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search options..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            className="w-full pl-8.5 pr-7 py-1.5 neu-input rounded-xl text-[11px] font-semibold focus:outline-none placeholder:text-muted-foreground/60"
          />
          {categorySearch && (
            <button
              onClick={() => setCategorySearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Categories List */}
        <div className="space-y-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
          {/* All Categories Option */}
          {!categorySearch && (
            <button
              onClick={() => handleSelectCategory('all')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                selectedCategory === 'all' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>All Categories</span>
              <span className="text-[10px] font-mono opacity-80">({mounted ? safeProducts.length : 0})</span>
            </button>
          )}

          {/* Root Categories (Men, Women, Kids, etc.) with Collapsible Subcategories */}
          {safeCategories.map((rootCat, rootIdx) => {
            const isRootSelected = selectedCategory === rootCat.slug || selectedCategory === String(rootCat.id);
            const rootCount = getCategoryProductCount(rootCat.slug, rootCat.id);
            const rootName = getCategoryName(rootCat);
            const children = rootCat.children || [];
            const isOpen = openCategorySlugs[rootCat.slug] ?? false;

            const matchingChildren = (categorySearch.trim()
              ? children.filter((sub: any) => {
                  const term = categorySearch.toLowerCase().trim();
                  const nameEn = (sub.name_en || '').toLowerCase();
                  const nameBn = (sub.name_bn || '').toLowerCase();
                  const slug = (sub.slug || '').toLowerCase();
                  return nameEn.includes(term) || nameBn.includes(term) || slug.includes(term);
                })
              : children
            ).slice().sort((a: any, b: any) => {
              const countA = getCategoryProductCount(a.slug, a.id);
              const countB = getCategoryProductCount(b.slug, b.id);
              if (countA > 0 && countB === 0) return -1;
              if (countB > 0 && countA === 0) return 1;
              return countB - countA;
            });

            if (categorySearch.trim() && matchingChildren.length === 0 && !rootName.toLowerCase().includes(categorySearch.toLowerCase().trim())) {
              return null;
            }

            return (
              <div key={`root-cat-${rootCat.id || rootCat.slug || rootIdx}`} className="space-y-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSelectCategory(rootCat.slug || rootCat.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isRootSelected
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="font-black">{rootName} (All)</span>
                    <span className="text-[10px] font-mono opacity-80">
                      ({mounted ? rootCount : 0})
                    </span>
                  </button>
                  {children.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOpenCategorySlugs(prev => ({ ...prev, [rootCat.slug]: !isOpen }))}
                      className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      title="Toggle subcategories"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen || categorySearch ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Subcategories list */}
                {children.length > 0 && (isOpen || categorySearch) && (
                  <div className="pl-2 space-y-0.5 border-l-2 border-primary/20 ml-2 my-1 max-h-60 overflow-y-auto scrollbar-thin">
                    {matchingChildren.map((sub: any, subIdx: number) => {
                      const isSubSelected = selectedCategory === sub.slug || selectedCategory === String(sub.id);
                      const count = getCategoryProductCount(sub.slug, sub.id);
                      const subName = getCategoryName(sub);

                      return (
                        <button
                          key={`sub-cat-${rootCat.id || rootCat.slug}-${sub.id || sub.slug || subIdx}`}
                          onClick={() => handleSelectCategory(sub.slug || sub.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center justify-between cursor-pointer ${
                            isSubSelected 
                              ? 'bg-primary/15 text-primary font-black border border-primary/30' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                          }`}
                        >
                          <span className="truncate pr-1 font-medium">{subName}</span>
                          <span className="text-[10px] font-mono opacity-75 shrink-0">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Size Filter with Search Options */}
      <div className="space-y-3 border-t border-border/80 pt-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-primary" />
            <span>Size</span>
          </label>
          {selectedSizes.length > 0 && (
            <button
              onClick={() => setSelectedSizes([])}
              className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
            >
              Clear ({selectedSizes.length})
            </button>
          )}
        </div>

        {/* Search options input for sizes */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search options..."
            value={sizeSearch}
            onChange={(e) => setSizeSearch(e.target.value)}
            className="w-full pl-8.5 pr-7 py-1.5 neu-input rounded-xl text-[11px] font-semibold focus:outline-none placeholder:text-muted-foreground/60"
          />
          {sizeSearch && (
            <button
              onClick={() => setSizeSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Sizes list with checkboxes and counts */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          {filteredAvailableSizes.length === 0 ? (
            <div className="px-2 py-1.5 text-[11px] text-muted-foreground italic">
              No sizes match "{sizeSearch}"
            </div>
          ) : (
            filteredAvailableSizes.map(({ size, count }) => {
              const isChecked = selectedSizes.includes(size);
              return (
                <label
                  key={size}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-muted/70 transition-colors cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSize(size)}
                      className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer accent-primary"
                    />
                    <span className={`text-xs font-semibold ${isChecked ? 'text-primary font-black' : 'text-foreground group-hover:text-primary'}`}>
                      {size}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground font-bold">
                    ({count})
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {/* Price Range Slider & Presets */}
      <div className="space-y-3 border-t border-border/80 pt-4">
        <label className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-primary" />
          <span>Price Range (৳)</span>
        </label>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold">Min (৳)</span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value) || 0)}
              className="w-full mt-1 p-2 neu-input rounded-xl text-xs font-black"
            />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold">Max (৳)</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value) || 250000)}
              className="w-full mt-1 p-2 neu-input rounded-xl text-xs font-black"
            />
          </div>
        </div>

        {/* Quick Price Range Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRICE_PRESETS.slice(1).map((preset) => {
            const isActive = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => { setMinPrice(preset.min); setMaxPrice(preset.max); }}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  isActive ? 'bg-primary text-primary-foreground font-black' : 'neu-btn text-muted-foreground hover:text-foreground'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brands & Collections */}
      <div className="space-y-2.5 border-t border-border/80 pt-4">
        <label className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-primary" />
          <span>Brand & Make</span>
        </label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 filter-scrollbar">
          {BRANDS.map((brand) => {
            const isChecked = selectedBrands.includes(brand.id);
            return (
              <label
                key={brand.id}
                className="flex items-center gap-2.5 text-xs text-foreground font-semibold cursor-pointer hover:text-primary transition-colors select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleBrand(brand.id)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer accent-primary"
                />
                <span>{brand.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Availability & Special Offers */}
      <div className="space-y-2.5 border-t border-border/80 pt-4">
        <label className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Offers & Availability</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center justify-between text-xs font-bold text-foreground cursor-pointer select-none">
            <span className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-primary" />
              <span>In Stock Only</span>
            </span>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer accent-primary"
            />
          </label>

          <label className="flex items-center justify-between text-xs font-bold text-foreground cursor-pointer select-none">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-current" />
              <span>Discount Deals</span>
            </span>
            <input
              type="checkbox"
              checked={discountOnly}
              onChange={(e) => setDiscountOnly(e.target.checked)}
              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer accent-primary"
            />
          </label>

          <label className="flex items-center justify-between text-xs font-bold text-foreground cursor-pointer select-none">
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-current" />
              <span>Featured Only</span>
            </span>
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer accent-primary"
            />
          </label>
        </div>
      </div>
        </div>
      </div>
  );
};

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="container mx-auto px-4 max-w-7xl space-y-6">
        
        {/* Page Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 neu-flat rounded-3xl p-6 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span>Home</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-primary font-black">Catalog</span>
              {selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'undefined' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-foreground capitalize font-bold">
                    {String(selectedCategory).replace(/-/g, ' ')}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
              <span>{t('nav.products', locale)}</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-black">
                {mounted ? filteredProducts.length : 0} Items
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Explore authentic premium clothing, men subcategories, fashion collections and accessories with Cash on Delivery in Bangladesh.
            </p>
          </div>

          {/* Quick Search, Sort & View Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Catalog search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 neu-input rounded-2xl text-xs font-bold focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort by Dropdown with all requested options */}
            <div className="flex items-center gap-1.5">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3.5 py-2.5 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                title="Sort by"
              >
                <option value="featured">Featured</option>
                <option value="most_relevant">Most relevant</option>
                <option value="best_selling">Best selling</option>
                <option value="alpha_asc">Alphabetically, A-Z</option>
                <option value="alpha_desc">Alphabetically, Z-A</option>
                <option value="price_low">Price, low to high</option>
                <option value="price_high">Price, high to low</option>
                <option value="date_old">Date, old to new</option>
                <option value="date_new">Date, new to old</option>
              </select>
            </div>

            {/* View Mode Switcher (Desktop) */}
            <div className="hidden sm:flex items-center gap-1 neu-inset p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setViewMode('grid-3')}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${viewMode === 'grid-3' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                title="3-Column Grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid-4')}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${viewMode === 'grid-4' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                title="4-Column Grid"
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden px-4 py-2.5 neu-btn rounded-2xl text-xs font-bold flex items-center gap-2 text-foreground cursor-pointer"
            >
              <Filter className="w-4 h-4 text-primary" />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 neu-flat rounded-2xl text-xs font-bold">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wider font-black mr-1">Active:</span>
            
            {/* Category Chip */}
            {selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'undefined' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 capitalize">
                Category: {String(selectedCategory).replace(/-/g, ' ')}
                <button onClick={() => { setSelectedCategory('all'); router.push('/products'); }} className="hover:text-destructive cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Size Chips */}
            {selectedSizes.map(size => (
              <span key={size} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                Size: {size}
                <button onClick={() => toggleSize(size)} className="hover:text-destructive cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Brand Chips */}
            {selectedBrands.map(brandId => (
              <span key={brandId} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                Brand: {BRANDS.find(b => b.id === brandId)?.label || brandId}
                <button onClick={() => toggleBrand(brandId)} className="hover:text-destructive cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Price Chip */}
            {(minPrice > 0 || maxPrice < 250000) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                ৳{minPrice} - ৳{maxPrice}
                <button onClick={() => { setMinPrice(0); setMaxPrice(250000); }} className="hover:text-destructive cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* In Stock */}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/20 text-primary border border-primary/40">
                In Stock Only
                <button onClick={() => setInStockOnly(false)} className="hover:text-destructive cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Discount Deals */}
            {discountOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                On Sale
                <button onClick={() => setDiscountOnly(false)} className="hover:text-destructive cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Featured */}
            {featuredOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-800">
                Featured
                <button onClick={() => setFeaturedOnly(false)} className="hover:text-destructive cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Search Query */}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted text-foreground border border-border">
                Keyword: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-destructive cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Clear All */}
            <button
              onClick={handleResetFilters}
              className="text-destructive font-black hover:underline ml-auto text-[11px] cursor-pointer"
            >
              Clear All ({activeFiltersCount})
            </button>
          </div>
        )}

        {/* Main Content: Sidebar + Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block md:col-span-3 sticky top-20 self-start">
            <FilterSidebar />
          </aside>

          {/* Product Catalog Cards Grid */}
          <main className="md:col-span-9 space-y-4">
            {/* Prominent Category Navigation Bar & Quick Subcategory Pills */}
            <div className="neu-flat rounded-2xl p-3 sm:p-4 space-y-3 shadow-xs">
              {/* Top Row: Root Categories Selector (All, Men, Women, Kids) */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectCategory('all')}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                      !selectedCategory || selectedCategory === 'all'
                        ? 'bg-primary text-white shadow-sm'
                        : 'neu-btn text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{locale === 'bn' ? 'সকল পণ্য' : 'All Products'}</span>
                    <span className="text-[10px] font-mono opacity-80">({mounted ? safeProducts.length : 0})</span>
                  </button>

                  {safeCategories.map((cat) => {
                    const isSelected = activeParentCategory?.slug === cat.slug || selectedCategory === cat.slug;
                    const count = getCategoryProductCount(cat.slug, cat.id);
                    const name = getCategoryName(cat);
                    const iconEmoji = cat.slug === 'men' ? '👔' : cat.slug === 'women' ? '👗' : '🧸';

                    return (
                      <button
                        key={`cat-pill-${cat.id || cat.slug}`}
                        onClick={() => handleSelectCategory(cat.slug || cat.id)}
                        className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-primary text-white shadow-sm'
                            : 'neu-btn text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="text-sm">{iconEmoji}</span>
                        <span>{name}</span>
                        <span className="text-[10px] font-mono opacity-80">({mounted ? count : 0})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Reset button if filtered */}
                {selectedCategory && selectedCategory !== 'all' && (
                  <button
                    onClick={() => handleSelectCategory('all')}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 shrink-0 ml-auto cursor-pointer"
                  >
                    <span>{locale === 'bn' ? 'সকল দেখুন' : 'Show All'}</span>
                  </button>
                )}
              </div>

              {/* Bottom Row: Subcategory Chips */}
              {mounted && displayedSubcategories.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-primary" />
                      <span>{locale === 'bn' ? 'সাব-ক্যাটাগরি:' : 'Subcategories:'}</span>
                    </span>

                    {/* "All for Current Parent" Pill if a parent is selected */}
                    {activeParentCategory && (
                      <button
                        onClick={() => handleSelectCategory(activeParentCategory.slug || activeParentCategory.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                          selectedCategory === activeParentCategory.slug
                            ? 'bg-primary text-white shadow-2xs font-black'
                            : 'neu-btn text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {locale === 'bn' ? `সকল ${getCategoryName(activeParentCategory)}` : `All ${activeParentCategory.name_en}`} ({getCategoryProductCount(activeParentCategory.slug, activeParentCategory.id)})
                      </button>
                    )}

                    {/* Subcategories list */}
                    {displayedSubcategories.map((sub: any, subIdx: number) => {
                      const isSelected = selectedCategory === sub.slug || selectedCategory === String(sub.id);
                      const count = sub.count !== undefined ? sub.count : getCategoryProductCount(sub.slug, sub.id);
                      const name = getCategoryName(sub);

                      return (
                        <button
                          key={`sub-pill-${sub.id || sub.slug || subIdx}`}
                          onClick={() => handleSelectCategory(sub.slug || sub.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            isSelected
                              ? 'bg-primary text-white shadow-2xs font-black'
                              : 'neu-btn text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span>{name}</span>
                          <span className="text-[10px] font-mono opacity-75">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {!mounted || isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="neu-flat rounded-3xl p-4 h-80 animate-pulse flex flex-col justify-between">
                    <div className="aspect-square neu-inset rounded-2xl" />
                    <div className="h-4 neu-inset rounded-lg w-3/4 mt-3" />
                    <div className="h-4 neu-inset rounded-lg w-1/2 mt-2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="neu-flat rounded-3xl p-12 text-center space-y-5 max-w-lg mx-auto">
                <div className="w-20 h-20 mx-auto rounded-3xl neu-inset flex items-center justify-center text-4xl">
                  🛍️
                </div>
                <h2 className="text-xl font-black text-foreground">No Products Found</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We couldn&apos;t find any products matching your current filters.
                  Try selecting a different subcategory, size, or price range.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="neu-btn-primary px-6 py-3 rounded-2xl text-xs font-black cursor-pointer shadow-md"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-4 sm:gap-6 ${
                viewMode === 'grid-4' 
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
                  : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Mobile Filter Slide-Over Drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <div className="relative ml-auto w-full max-w-xs bg-background h-full overflow-y-auto p-5 space-y-4 shadow-2xl z-10">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="font-black text-base text-foreground">Filter Catalog</h2>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 rounded-xl neu-btn text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterSidebar />
              <div className="sticky bottom-0 pt-3 bg-background border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3 neu-btn-primary rounded-2xl text-xs font-black shadow-lg"
                >
                  Apply Filters ({filteredProducts.length} Results)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ProductsCatalogContent />
    </Suspense>
  );
}
