'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, ArrowLeft, Save, Globe, Eye, Trash2, Edit3, 
  Sparkles, Layers, Sliders, CheckCircle2, MoveUp, MoveDown, 
  ShoppingBag, Target, Video, Tag, Truck, Settings,
  HelpCircle, MessageSquare, Image, ShieldCheck, Star, FileText
} from 'lucide-react';
import { SectionEditor, Section } from '@/components/admin/SectionEditor';
import { PageProductBuilder, PageProductConfigItem } from '@/components/admin/PageProductBuilder';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditPagePage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'products' | 'funnel' | 'sections' | 'settings'>('sections');

  const [pageInfo, setPageInfo] = useState({
    title_en: '',
    title_bn: '',
    slug: '',
    page_type: 'custom',
    product_id: null as number | null,
    discount_code: '',
    offer_headline_en: '',
    offer_headline_bn: '',
    cta_button_text_en: 'Order Now - Cash on Delivery',
    cta_button_text_bn: 'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)',
    badge_text: '🔥 হট ডিল - স্টক সীমিত',
    features_raw: '',
    video_url: '',
    free_delivery: false,
    show_order_form: true,
    is_homepage: false,
    is_published: true,
    seo_title: '',
    seo_description: '',
  });

  const [pageProducts, setPageProducts] = useState<PageProductConfigItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Page & Sections & Products from Backend
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-page-detail', id],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/admin/pages/${id}`);
        return res?.data?.data || res?.data || null;
      } catch (err) {
        try {
          const pubRes: any = await api.get(`/pages/${id}`);
          return pubRes?.data?.data || pubRes?.data || null;
        } catch (pubErr) {
          return null;
        }
      }
    }
  });

  // Fetch Catalog Products for the Product Builder
  const { data: catalogProducts = [] } = useQuery({
    queryKey: ['admin-products-catalog-for-edit'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/products?per_page=50');
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  useEffect(() => {
    if (pageData) {
      const featuresStr = Array.isArray(pageData.features) 
        ? pageData.features.join('\n') 
        : (pageData.features || '');

      const isCustom = pageData.page_type === 'custom' || (!pageData.product_id && (!pageData.page_products || pageData.page_products.length === 0));

      setPageInfo({
        title_en: pageData.title_en || '',
        title_bn: pageData.title_bn || '',
        slug: pageData.slug || '',
        page_type: pageData.page_type || (isCustom ? 'custom' : 'single_product_funnel'),
        product_id: pageData.product_id || null,
        discount_code: pageData.discount_code || '',
        offer_headline_en: pageData.offer_headline_en || '',
        offer_headline_bn: pageData.offer_headline_bn || '',
        cta_button_text_en: pageData.cta_button_text_en || 'Order Now - Cash on Delivery',
        cta_button_text_bn: pageData.cta_button_text_bn || 'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)',
        badge_text: pageData.badge_text || '',
        features_raw: featuresStr,
        video_url: pageData.video_url || '',
        free_delivery: Boolean(pageData.free_delivery),
        show_order_form: Boolean(pageData.show_order_form ?? true),
        is_homepage: Boolean(pageData.is_homepage),
        is_published: Boolean(pageData.is_published ?? true),
        seo_title: pageData.seo_title || '',
        seo_description: pageData.seo_description || '',
      });

      // Default active tab: Sections for Custom CMS pages, Products for Funnels
      if (isCustom) {
        setActiveTab('sections');
      } else {
        setActiveTab('products');
      }

      // Populate multiple products
      if (pageData.page_products && Array.isArray(pageData.page_products) && pageData.page_products.length > 0) {
        setPageProducts(pageData.page_products.map((p: any) => ({
          id: p.id,
          product_id: p.product_id,
          title_en: p.title_en,
          title_bn: p.title_bn,
          image: p.image || p.product?.primary_image_url || p.product?.images?.[0]?.path || '',
          custom_price: p.custom_price,
          compare_price: p.compare_price,
          badge_text: p.badge_text,
          is_default: Boolean(p.is_default),
          sort_order: p.sort_order,
          variations: p.variations || p.product?.variants || [],
          new_variants: [],
        })));
      } else if (pageData.product || pageData.product_id) {
        const prod = pageData.product;
        setPageProducts([{
          product_id: pageData.product_id || prod?.id,
          title_en: pageData.title_en || prod?.name_en,
          title_bn: pageData.title_bn || prod?.name_bn,
          image: prod?.primary_image_url || prod?.images?.[0]?.path || '',
          custom_price: pageData.custom_price || prod?.base_price,
          compare_price: prod?.compare_price,
          badge_text: pageData.badge_text || 'Hot Deal 🔥',
          is_default: true,
          sort_order: 0,
          variations: prod?.variants || [],
          new_variants: [],
        }]);
      }

      if (pageData.sections && Array.isArray(pageData.sections)) {
        setSections(pageData.sections);
      }
    }
  }, [pageData]);

  const isCustomPage = pageInfo.page_type === 'custom' || (!pageInfo.product_id && pageProducts.length === 0);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    setSections(newSections);
  };

  const toggleVisibility = (index: number) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      is_visible: !newSections[index].is_visible
    };
    setSections(newSections);
  };

  const deleteSection = (index: number) => {
    if (window.confirm('Remove this section from the page?')) {
      setSections(sections.filter((_, i) => i !== index));
    }
  };

  const handleAddNewSection = (type: string) => {
    // Normalization to backend enum: 'testimonial' instead of 'testimonials'
    const safeType = type === 'testimonials' ? 'testimonial' : type;

    let initialConfig: any = { title_en: `New ${safeType.replace(/_/g, ' ').toUpperCase()}` };

    if (safeType === 'hero') {
      initialConfig = {
        heading_en: 'Welcome to BD Shop',
        heading_bn: 'বিডি শপে আপনাকে স্বাগতম',
        subtitle_en: 'Fastest Delivery across all 64 districts in Bangladesh with Cash on Delivery & bKash',
        subtitle_bn: 'সারা বাংলাদেশে দ্রুততম ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা',
        button_text_en: 'Shop Collection',
        button_text_bn: 'পণ্য দেখুন',
        button_link: '/products',
        background_image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85',
      };
    } else if (safeType === 'rich_text') {
      initialConfig = {
        title_en: 'About Our Brand & Heritage',
        title_bn: 'আমাদের গল্প ও প্রতিশ্রুতি',
        content_en: 'Welcome to our online store. We are committed to providing premium products with 100% genuine quality and fast nationwide doorstep delivery.',
        content_bn: 'আমাদের অনলাইন স্টোরে আপনাকে স্বাগতম। আমরা সর্বোচ্চ গুণমানসম্পন্ন পণ্য এবং সারা দেশে দ্রুত হোম ডেলিভারি নিশ্চিত করি।',
        align: 'left',
        max_width: 'lg',
      };
    } else if (safeType === 'testimonial') {
      initialConfig = {
        title_en: 'What Our Customers Say',
        title_bn: 'আমাদের গ্রাহকদের মতামত',
        testimonials: [
          {
            name: 'Saiful Islam (Dhanmondi, Dhaka)',
            quote_en: 'Ordered in the morning and received within 24 hours. Original quality and very safe Cash on Delivery!',
            quote_bn: 'সকালে অর্ডার করে ২৪ ঘণ্টার মধ্যে ডেলিভারি পেয়েছি। আসল পণ্য ও চমৎকার ক্যাশ অন ডেলিভারি সুবিধা!',
            rating: 5,
          },
          {
            name: 'Shaila Yasmin (GEC, Chattogram)',
            quote_en: 'The fabric quality is outstanding and exactly as shown. Highly recommended.',
            quote_bn: 'কাপড়ের কোয়ালিটি ছবির মতোই দারুণ ও আরামদায়ক। সবাইকে সাজেস্ট করছি।',
            rating: 5,
          }
        ]
      };
    } else if (safeType === 'faq') {
      initialConfig = {
        title_en: 'Frequently Asked Questions',
        title_bn: 'সাধারণ জিজ্ঞাসা (FAQ)',
        items: [
          {
            question_en: 'How long does delivery take inside and outside Dhaka?',
            question_bn: 'ঢাকা ও ঢাকার বাইরে ডেলিভারি পেতে কত দিন সময় লাগে?',
            answer_en: 'Inside Dhaka orders are delivered within 24 hours. Outside Dhaka takes 48-72 hours via Steadfast & Pathao.',
            answer_bn: 'ঢাকার ভিতরে ২৪ ঘণ্টা এবং ঢাকার বাইরে ৪৮-৭২ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়।'
          },
          {
            question_en: 'Can I pay with Cash on Delivery (COD)?',
            question_bn: 'ক্যাশ অন ডেলিভারিতে পণ্য দেখে টাকা দেওয়া যাবে?',
            answer_en: 'Yes, 100% of our products support Cash on Delivery. You can check the parcel before payment.',
            answer_bn: 'হ্যাঁ, পণ্য হাতে পেয়ে দেখে সম্পূর্ণ মূল্য পরিশোধ করার সুবিধা রয়েছে।'
          }
        ]
      };
    } else if (safeType === 'features') {
      initialConfig = {
        title_en: 'Why Shop With Us?',
        title_bn: 'কেন আমাদের থেকে কেনাকাটা করবেন?',
        items: [
          {
            title_en: '100% Original Products',
            title_bn: '১০০% অরিজিনাল ও প্রিমিয়াম কোয়ালিটি',
            desc_en: 'Directly sourced authentic items',
            desc_bn: 'সরাসরি বিশ্বস্ত প্রস্তুতকারক থেকে সংগৃহীত'
          },
          {
            title_en: 'Nationwide Fast Delivery',
            title_bn: 'সারাদেশে দ্রুততম হোম ডেলিভারি',
            desc_en: 'Doorstep delivery across all 64 districts',
            desc_bn: '৬৪টি জেলায় দ্রুততম সময়ে হোম ডেলিভারি'
          },
          {
            title_en: 'Cash on Delivery (COD)',
            title_bn: 'ক্যাশ অন ডেলিভারি সুবিধা',
            desc_en: 'Pay after inspecting your parcel',
            desc_bn: 'পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ'
          },
          {
            title_en: '7-Day Easy Replacement',
            title_bn: '৭ দিনের সহজ এক্সচেঞ্জ গ্যারান্টি',
            desc_en: 'Hassle-free replacement for any size issue',
            desc_bn: 'যেকোনো সমস্যায় দ্রুত সমাধান'
          }
        ]
      };
    } else if (safeType === 'category_grid') {
      initialConfig = {
        title_en: 'Browse Popular Categories',
        title_bn: 'জনপ্রিয় ক্যাটাগরি ব্রাউজ করুন',
      };
    } else if (safeType === 'product_carousel') {
      initialConfig = {
        title_en: 'Trending & Featured Products',
        title_bn: 'ট্রেন্ডিং ও ফিচার্ড পণ্য',
        limit: 12,
        view_all_link: '/products',
      };
    } else if (safeType === 'flash_sale') {
      initialConfig = {
        title_en: 'Grand Eid Flash Sale ⚡',
        title_bn: 'গ্র্যান্ড ঈদ মেগা ফ্ল্যাশ সেল ⚡',
      };
    } else if (safeType === 'banner') {
      initialConfig = {
        items: [
          {
            id: `banner-${Date.now()}`,
            image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85',
            link: '/products',
            title: 'Promo Collection'
          }
        ]
      };
    } else if (safeType === 'video') {
      initialConfig = {
        title_en: 'Watch Product Demonstration',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
    }

    const newSec: Section = {
      id: `sec-${Date.now()}`,
      type: safeType,
      config: initialConfig,
      is_visible: true
    };
    setSections([...sections, newSec]);
    setIsAddingNew(false);
    setEditingSection(newSec);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const featuresArray = pageInfo.features_raw
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const defaultProduct = pageProducts.find(p => p.is_default) || pageProducts[0];
      const primaryProductId = isCustomPage
        ? null
        : (defaultProduct && defaultProduct.product_id
          ? Number(defaultProduct.product_id)
          : (pageData?.product_id || null));

      const primaryCustomPrice = defaultProduct && defaultProduct.custom_price !== '' && defaultProduct.custom_price !== undefined
        ? parseFloat(String(defaultProduct.custom_price))
        : null;

      const effectivePageType = pageInfo.page_type === 'custom'
        ? 'custom'
        : (pageProducts.length > 1 ? 'multi_product_funnel' : 'single_product_funnel');

      // Update Page Base Info, Sections and Products
      const updatePayload = {
        title_en: pageInfo.title_en,
        title_bn: pageInfo.title_bn,
        slug: pageInfo.slug,
        page_type: effectivePageType,
        is_homepage: pageInfo.is_homepage,
        is_published: pageInfo.is_published,
        seo_title: pageInfo.seo_title,
        seo_description: pageInfo.seo_description,
        product_id: primaryProductId,
        custom_price: primaryCustomPrice,
        discount_code: pageInfo.discount_code || null,
        offer_headline_en: pageInfo.offer_headline_en,
        offer_headline_bn: pageInfo.offer_headline_bn,
        cta_button_text_en: pageInfo.cta_button_text_en,
        cta_button_text_bn: pageInfo.cta_button_text_bn,
        badge_text: pageInfo.badge_text,
        features: featuresArray,
        video_url: pageInfo.video_url || null,
        free_delivery: pageInfo.free_delivery,
        show_order_form: pageInfo.show_order_form,
        products: isCustomPage ? [] : pageProducts.map((p, idx) => ({
          id: p.id,
          product_id: p.product_id ? Number(p.product_id) : null,
          title_en: p.title_en,
          title_bn: p.title_bn,
          image: p.image,
          custom_price: p.custom_price !== '' && p.custom_price !== undefined ? parseFloat(String(p.custom_price)) : null,
          compare_price: p.compare_price !== '' && p.compare_price !== undefined ? parseFloat(String(p.compare_price)) : null,
          badge_text: p.badge_text,
          is_default: Boolean(p.is_default),
          sort_order: idx,
          variations: p.variations || [],
          new_variants: p.new_variants || [],
        })),
        sections: sections.map((sec, idx) => ({
          id: typeof sec.id === 'number' ? sec.id : undefined,
          page_id: Number(id),
          type: sec.type === 'testimonials' ? 'testimonial' : sec.type,
          config: sec.config,
          is_visible: sec.is_visible,
          position: idx,
        }))
      };

      await api.put(`/admin/pages/${id}`, updatePayload);

      toast.success('Page & section contents saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-page-detail', id] });
    } catch (err: any) {
      toast.error(err?.message || err?.response?.data?.message || 'Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  const getSectionSummary = (sec: Section) => {
    const cfg = sec.config || {};
    switch (sec.type) {
      case 'hero':
      case 'hero_deal':
        return cfg.heading_en || cfg.title_en || 'Hero Deal Banner with CTA';
      case 'rich_text':
        return cfg.title_en || (cfg.content_en ? `${cfg.content_en.substring(0, 45)}...` : 'Direct Text Content');
      case 'testimonial':
      case 'testimonials':
        return `${cfg.title_en || 'Customer Reviews'} (${(cfg.testimonials?.length || 0)} reviews)`;
      case 'faq':
        return `${cfg.title_en || 'FAQ Accordion'} (${(cfg.items?.length || 0)} Q&As)`;
      case 'features':
        return `${cfg.title_en || 'Why Shop With Us'} (${(cfg.items?.length || 0)} guarantee points)`;
      case 'banner':
      case 'banner_grid':
        return `${cfg.title_en || 'Promo Banner Slider'} (${(cfg.items?.length || 0)} images)`;
      case 'category_grid':
        return cfg.title_en || 'Shop by Category Grid';
      case 'product_carousel':
      case 'product_grid':
        return `${cfg.title_en || 'Trending Products Carousel'} (${cfg.limit || 12} items)`;
      case 'flash_sale':
        return cfg.title_en || 'Flash Sale Countdown';
      case 'video':
        return cfg.title_en || cfg.video_url || 'Video Showcase';
      case 'direct_checkout_form':
        return cfg.title_bn || cfg.title_en || 'Direct Express Checkout Form';
      default:
        return JSON.stringify(cfg).substring(0, 45);
    }
  };

  const livePath = pageInfo.is_homepage ? '/' : `/p/${pageInfo.slug}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 px-2 sm:px-0">
      {/* Top Sticky Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-xl z-20 py-3.5 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/pages" className="p-2.5 clay-btn rounded-2xl text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-black text-foreground flex items-center gap-2 truncate">
              {isCustomPage ? (
                <Layers className="w-5 h-5 text-blue-500 shrink-0" />
              ) : (
                <Target className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <span className="truncate">
                {isCustomPage ? 'Edit CMS Page' : 'Edit Funnel'}: {pageInfo.title_en || `#${id}`}
              </span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono truncate">
              Route: <span className="text-primary font-bold">{livePath}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link 
            href={livePath} 
            target="_blank"
            className="clay-btn px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview Live</span>
          </Link>
          <button 
            type="button" 
            disabled={isSaving}
            onClick={handleSaveAll}
            className="clay-btn-primary px-5 sm:px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save All Changes</span>
          </button>
        </div>
      </div>

      {/* Page Info Header Card */}
      <div className="clay-card rounded-3xl p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-center">
        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-1">Page Title (English)</label>
          <input 
            type="text" 
            value={pageInfo.title_en}
            onChange={(e) => setPageInfo(prev => ({ ...prev, title_en: e.target.value }))}
            className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-bold"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-1">URL Slug</label>
          <input 
            type="text" 
            value={pageInfo.slug}
            onChange={(e) => setPageInfo(prev => ({ ...prev, slug: e.target.value }))}
            className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-mono font-bold"
          />
        </div>
        <div className="flex items-center gap-2 pt-2 sm:pt-0 justify-end flex-wrap">
          <label className="flex items-center gap-2 clay-inset px-3 py-2 rounded-xl cursor-pointer">
            <span className="text-xs font-bold text-foreground">Published</span>
            <input 
              type="checkbox" 
              checked={pageInfo.is_published}
              onChange={(e) => setPageInfo(prev => ({ ...prev, is_published: e.target.checked }))}
              className="w-4 h-4 rounded text-primary"
            />
          </label>
          <label className="flex items-center gap-2 clay-inset px-3 py-2 rounded-xl cursor-pointer">
            <span className="text-xs font-bold text-foreground">Homepage</span>
            <input 
              type="checkbox" 
              checked={pageInfo.is_homepage}
              onChange={(e) => setPageInfo(prev => ({ ...prev, is_homepage: e.target.checked }))}
              className="w-4 h-4 rounded text-primary"
            />
          </label>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-1 overflow-x-auto no-scrollbar">
        {isCustomPage ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'sections'
                  ? 'clay-chip-active text-primary ring-2 ring-primary/40 shadow-sm'
                  : 'clay-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Layout & Content Sections ({sections.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'clay-chip-active text-primary ring-2 ring-primary/40 shadow-sm'
                  : 'clay-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Page Details & SEO</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'clay-chip-active text-primary ring-2 ring-primary/40 shadow-sm'
                  : 'clay-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>(Optional) Catalog Products ({pageProducts.length})</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'clay-chip-active text-primary ring-2 ring-primary/40 shadow-sm'
                  : 'clay-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Products & Variations ({pageProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('funnel')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'funnel'
                  ? 'clay-chip-active text-primary ring-2 ring-primary/40 shadow-sm'
                  : 'clay-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Offer & Funnel Copy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'sections'
                  ? 'clay-chip-active text-primary ring-2 ring-primary/40 shadow-sm'
                  : 'clay-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Layout Sections ({sections.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'clay-chip-active text-primary ring-2 ring-primary/40 shadow-sm'
                  : 'clay-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Page Details & SEO</span>
            </button>
          </>
        )}
      </div>

      {/* TAB 1: Sections Manager (Primary for CMS Pages) */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <span>Layout & Content Sections ({sections.length})</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Add, reorder, and configure user-friendly text, banners, customer reviews, and FAQs
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setIsAddingNew(true)}
              className="clay-btn-primary px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Section</span>
            </button>
          </div>

          {/* Section Picker Modal */}
          {isAddingNew && (
            <div className="clay-card rounded-3xl p-5 sm:p-6 border-2 border-primary/40 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-sm text-foreground">Choose Section Type to Add</span>
                <button onClick={() => setIsAddingNew(false)} className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer">
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { type: 'hero', label: 'Hero Auto-Slider', desc: 'Large banner with CTA button', icon: Image },
                  { type: 'rich_text', label: 'Custom Rich Text', desc: 'Story & formatted copy', icon: FileText },
                  { type: 'testimonial', label: 'Customer Reviews', desc: 'Quotes & 5-star ratings', icon: Star },
                  { type: 'faq', label: 'FAQ Accordion', desc: 'Common questions & answers', icon: HelpCircle },
                  { type: 'features', label: 'Why Choose Us', desc: 'Guarantees & delivery trust', icon: ShieldCheck },
                  { type: 'category_grid', label: 'Category Grid', desc: 'Visual 64-district matrix', icon: Layers },
                  { type: 'product_carousel', label: 'Product Carousel', desc: 'Featured items highlight', icon: ShoppingBag },
                  { type: 'flash_sale', label: 'Flash Sale Deals', desc: 'Timed deals banner', icon: Sparkles },
                  { type: 'banner', label: 'Promo Banner', desc: 'Full-width promo slides', icon: Image },
                  { type: 'video', label: 'Video Showcase', desc: 'YouTube demonstration', icon: Video },
                  { type: 'direct_checkout_form', label: 'Express Checkout', desc: 'Unified order form', icon: Truck },
                ].map(secType => {
                  const Icon = secType.icon;
                  return (
                    <button
                      key={secType.type}
                      type="button"
                      onClick={() => handleAddNewSection(secType.type)}
                      className="clay-card p-3.5 rounded-2xl text-left hover:scale-[1.02] active:scale-95 transition-all space-y-1 cursor-pointer border border-border/50"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-primary">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{secType.label}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground leading-tight">{secType.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section List Items */}
          {sections.length === 0 ? (
            <div className="clay-card rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl clay-inset mx-auto flex items-center justify-center text-primary">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-foreground">No sections on this page yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Add sections like Hero Slider, Custom Rich Story, Customer Reviews, or FAQs to build your page.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="clay-btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Section</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, idx) => (
                <div 
                  key={section.id || idx}
                  className={`clay-card rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                    !section.is_visible ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full clay-inset shrink-0 inline-flex items-center justify-center font-bold text-xs text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-black text-xs uppercase tracking-wider text-primary truncate">
                        {section.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-foreground font-semibold truncate">
                        {getSectionSummary(section)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="p-1.5 clay-btn rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="p-1.5 clay-btn rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleVisibility(idx)}
                      className="p-1.5 clay-btn rounded-xl text-muted-foreground hover:text-primary cursor-pointer"
                      title={section.is_visible ? 'Visible' : 'Hidden'}
                    >
                      {section.is_visible ? (
                        <span className="text-[11px] font-bold text-primary px-1">Active</span>
                      ) : (
                        <span className="text-[11px] font-bold text-muted-foreground px-1">Hidden</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingSection(section)}
                      className="p-2 clay-btn rounded-xl text-primary hover:bg-primary/10 cursor-pointer flex items-center gap-1"
                      title="Edit Section Config"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteSection(idx)}
                      className="p-2 clay-btn rounded-xl text-red-500 hover:bg-red-500/10 cursor-pointer"
                      title="Remove Section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Page Details & SEO */}
      {activeTab === 'settings' && (
        <div className="clay-card rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <span>Page Details & SEO Meta Settings</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure titles, page slug, homepage assignment, and search engine optimization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Page Title (English) *</label>
              <input
                type="text"
                value={pageInfo.title_en}
                onChange={(e) => setPageInfo(prev => ({ ...prev, title_en: e.target.value }))}
                className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Page Title (বাংলা / Bengali)</label>
              <input
                type="text"
                placeholder="যেমনঃ আমাদের সম্পর্কে"
                value={pageInfo.title_bn}
                onChange={(e) => setPageInfo(prev => ({ ...prev, title_bn: e.target.value }))}
                className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Custom URL Slug *</label>
              <input
                type="text"
                value={pageInfo.slug}
                onChange={(e) => setPageInfo(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Page Type</label>
              <select
                value={pageInfo.page_type}
                onChange={(e) => setPageInfo(prev => ({ ...prev, page_type: e.target.value }))}
                className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-bold"
              >
                <option value="custom">Custom CMS Page</option>
                <option value="single_product_funnel">Single Product Funnel</option>
                <option value="multi_product_funnel">Multi-Product Bundle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">SEO Meta Title</label>
              <input
                type="text"
                placeholder="e.g. About Our Brand | Best E-Commerce in BD"
                value={pageInfo.seo_title}
                onChange={(e) => setPageInfo(prev => ({ ...prev, seo_title: e.target.value }))}
                className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">SEO Meta Description</label>
              <textarea
                rows={3}
                placeholder="Meta description for Google search results..."
                value={pageInfo.seo_description}
                onChange={(e) => setPageInfo(prev => ({ ...prev, seo_description: e.target.value }))}
                className="w-full p-4 sm:p-5 clay-input rounded-2xl text-xs sm:text-sm resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Products Builder */}
      {activeTab === 'products' && (
        <div className="clay-card rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>Catalog Products & Bundle Offers</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {isCustomPage 
                ? 'Optional: Link products if this CMS page features product highlights.' 
                : 'Select hero products, set custom funnel bundle pricing, and manage package variants.'}
            </p>
          </div>

          <PageProductBuilder
            products={pageProducts}
            onChange={setPageProducts}
            catalogProducts={catalogProducts}
          />
        </div>
      )}

      {/* TAB 4: Funnel Copy & Urgency (For Sales Funnels) */}
      {activeTab === 'funnel' && (
        <div className="clay-card rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Funnel Copy, Badges & Guarantees</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure headlines, urgency tags, promo coupons, video demo, and trust bullet points.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Headline (English)</label>
              <input
                type="text"
                placeholder="e.g. Exclusive Eid Deal: Limited Batch"
                value={pageInfo.offer_headline_en}
                onChange={(e) => setPageInfo(prev => ({ ...prev, offer_headline_en: e.target.value }))}
                className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Headline (বাংলা)</label>
              <input
                type="text"
                placeholder="যেমনঃ বিশেষ ঈদ অফার: প্রিমিয়াম কালেকশন"
                value={pageInfo.offer_headline_bn}
                onChange={(e) => setPageInfo(prev => ({ ...prev, offer_headline_bn: e.target.value }))}
                className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Urgency Promo Badge</label>
              <input
                type="text"
                placeholder="🔥 ৫০% পর্যন্ত ছাড় - স্টক সীমিত"
                value={pageInfo.badge_text}
                onChange={(e) => setPageInfo(prev => ({ ...prev, badge_text: e.target.value }))}
                className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Assigned Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. EID2026"
                value={pageInfo.discount_code}
                onChange={(e) => setPageInfo(prev => ({ ...prev, discount_code: e.target.value }))}
                className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-mono font-bold uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">CTA Button Text (English)</label>
              <input
                type="text"
                value={pageInfo.cta_button_text_en}
                onChange={(e) => setPageInfo(prev => ({ ...prev, cta_button_text_en: e.target.value }))}
                className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">CTA Button Text (বাংলা)</label>
              <input
                type="text"
                value={pageInfo.cta_button_text_bn}
                onChange={(e) => setPageInfo(prev => ({ ...prev, cta_button_text_bn: e.target.value }))}
                className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">YouTube Video URL (Optional)</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/embed/..."
              value={pageInfo.video_url}
              onChange={(e) => setPageInfo(prev => ({ ...prev, video_url: e.target.value }))}
              className="w-full px-4 py-3 sm:py-3.5 clay-input rounded-2xl text-xs sm:text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">Key Selling Points (1 per line)</label>
            <textarea
              rows={4}
              value={pageInfo.features_raw}
              onChange={(e) => setPageInfo(prev => ({ ...prev, features_raw: e.target.value }))}
              className="w-full p-4 sm:p-5 clay-input rounded-2xl text-xs sm:text-sm font-medium leading-relaxed resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3.5 clay-inset rounded-2xl cursor-pointer">
              <div>
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-primary" />
                  <span>Free Delivery Everywhere</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Sets delivery fee to ৳0 for this funnel</div>
              </div>
              <input
                type="checkbox"
                checked={pageInfo.free_delivery}
                onChange={(e) => setPageInfo(prev => ({ ...prev, free_delivery: e.target.checked }))}
                className="w-4 h-4 rounded text-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 clay-inset rounded-2xl cursor-pointer">
              <div>
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Show Direct Order Form</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Unified 1-page checkout at bottom</div>
              </div>
              <input
                type="checkbox"
                checked={pageInfo.show_order_form}
                onChange={(e) => setPageInfo(prev => ({ ...prev, show_order_form: e.target.checked }))}
                className="w-4 h-4 rounded text-primary"
              />
            </label>
          </div>
        </div>
      )}

      {/* Inline Section Config Editor Modal */}
      {editingSection && (
        <SectionEditor 
          section={editingSection}
          onSave={(updated) => {
            setSections(sections.map(s => (s.id === updated.id ? updated : s)));
            setEditingSection(null);
            toast.success('Section configured');
          }}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
}
