'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '@/components/admin/DataTable';
import { 
  Plus, Edit, Trash2, Eye, FileText, CheckCircle2, 
  XCircle, Globe, Sparkles, X, Target, Layers, 
  ShoppingBag, Flame, Tag, Video, Truck, Package,
  Search, ShieldCheck, HelpCircle, Star, AlignLeft, Image
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { PageProductBuilder, PageProductConfigItem } from '@/components/admin/PageProductBuilder';

export default function AdminPagesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'funnel' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mode for the Create Modal
  const [createPageType, setCreatePageType] = useState<'single_product_funnel' | 'multi_product_funnel' | 'custom'>('single_product_funnel');

  const [pageProducts, setPageProducts] = useState<PageProductConfigItem[]>([]);

  // Funnel Form State
  const [formData, setFormData] = useState({
    title_en: '',
    title_bn: '',
    slug: '',
    product_id: '',
    discount_code: 'EID2026',
    offer_headline_en: '',
    offer_headline_bn: '',
    cta_button_text_en: 'Order Now - Cash on Delivery',
    cta_button_text_bn: 'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)',
    badge_text: '🔥 হট ডিল - স্টক সীমিত',
    features_raw: "১০০% প্রিমিয়াম ও অরিজিনাল কোয়ালিটি\nসারাদেশে দ্রুত হোম ডেলিভারি (২৪-৪৮ ঘণ্টা)\nপণ্য হাতে পেয়ে দেখে মূল্য পরিশোধের সুবিধা\n৭ দিনের সহজ রিপ্লেসমেন্ট গ্যারান্টি",
    video_url: '',
    custom_price: '',
    free_delivery: false,
    show_order_form: true,
    is_homepage: false,
    is_published: true,
    seo_title: '',
    seo_description: '',
  });

  // Custom CMS Page Starter Sections State
  const [cmsSectionsConfig, setCmsSectionsConfig] = useState({
    enable_hero: true,
    hero_heading_en: 'Welcome to Our Premium Store',
    hero_heading_bn: 'আমাদের প্রিমিয়াম স্টোরে আপনাকে স্বাগতম',
    hero_subtitle_en: 'Fast nationwide delivery across all 64 districts with Cash on Delivery & bKash',
    hero_subtitle_bn: 'সারাদেশে দ্রুততম হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা',
    hero_bg_image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85',
    hero_button_text_en: 'Explore Products',
    hero_button_text_bn: 'পণ্য দেখুন',
    hero_button_link: '/products',

    enable_story: true,
    story_title_en: 'About Our Brand & Quality Promise',
    story_title_bn: 'আমাদের গল্প ও প্রতিশ্রুতি',
    story_content_en: "We are committed to delivering authentic high-quality fashion and lifestyle essentials directly to your doorstep in Bangladesh.\n\nEvery product is carefully inspected before dispatch to guarantee 100% customer satisfaction.",
    story_content_bn: "আমরা সবসময় সর্বোচ্চ গুণমান এবং অরিজিনাল পণ্য গ্রাহকদের কাছে পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ।\n\nপ্রতিটি পণ্য চেক করে ডেলিভারি করা হয় যাতে আপনার কেনাকাটা হয় ১০০% সন্তোষজনক।",

    enable_features: true,
    features_title_en: 'Why Choose Us?',
    features_title_bn: 'কেন আমাদের থেকে কেনাকাটা করবেন?',

    enable_faq: true,
    faq_title_en: 'Frequently Asked Questions',
    faq_title_bn: 'সাধারণ জিজ্ঞাসা (FAQ)',

    enable_reviews: true,
    reviews_title_en: 'What Our Customers Say',
    reviews_title_bn: 'আমাদের গ্রাহকদের রিভিউ',
  });

  const queryClient = useQueryClient();

  // Fetch Existing CMS & Funnel Pages
  const { data: pagesData = [], isLoading } = useQuery({
    queryKey: ['admin-pages'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/pages');
        if (res?.data) {
          return Array.isArray(res.data) 
            ? res.data 
            : (res.data.items || res.data.data || []);
        }
      } catch (err) {
        try {
          const pubRes: any = await api.get('/pages');
          if (pubRes?.data) {
            return Array.isArray(pubRes.data)
              ? pubRes.data
              : (pubRes.data.items || pubRes.data.data || []);
          }
        } catch (pubErr) {}
      }
      return [];
    }
  });

  // Fetch Products Catalog for Funnel Linking & Variations
  const { data: productsData = [] } = useQuery({
    queryKey: ['admin-products-for-funnel'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/products?per_page=50');
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  // Filtered pages based on active tab and search query
  const filteredPages = useMemo(() => {
    if (!pagesData || !Array.isArray(pagesData)) return [];

    return pagesData.filter((row: any) => {
      const isCustom = row.page_type === 'custom' || (!row.product_id && (!row.page_products || row.page_products.length === 0));

      if (activeTypeTab === 'custom' && !isCustom) return false;
      if (activeTypeTab === 'funnel' && isCustom) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitleEn = (row.title_en || '').toLowerCase().includes(q);
        const matchTitleBn = (row.title_bn || '').toLowerCase().includes(q);
        const matchSlug = (row.slug || '').toLowerCase().includes(q);
        if (!matchTitleEn && !matchTitleBn && !matchSlug) return false;
      }

      return true;
    });
  }, [pagesData, activeTypeTab, searchQuery]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    if (!pagesData || !Array.isArray(pagesData)) return { all: 0, funnel: 0, custom: 0 };
    let funnel = 0;
    let custom = 0;
    pagesData.forEach((row: any) => {
      const isCust = row.page_type === 'custom' || (!row.product_id && (!row.page_products || row.page_products.length === 0));
      if (isCust) custom++;
      else funnel++;
    });
    return { all: pagesData.length, funnel, custom };
  }, [pagesData]);

  // Create Page Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const featuresArray = formData.features_raw
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      // Clean slug calculation
      let finalSlug = (formData.slug || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (!finalSlug) {
        finalSlug = formData.title_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      if (createPageType === 'custom') {
        // Build initial custom sections from user-friendly CMS starter options
        const initialSections: any[] = [];
        let positionCounter = 0;

        if (cmsSectionsConfig.enable_hero) {
          initialSections.push({
            type: 'hero',
            position: positionCounter++,
            is_visible: true,
            config: {
              heading_en: cmsSectionsConfig.hero_heading_en,
              heading_bn: cmsSectionsConfig.hero_heading_bn,
              subtitle_en: cmsSectionsConfig.hero_subtitle_en,
              subtitle_bn: cmsSectionsConfig.hero_subtitle_bn,
              background_image: cmsSectionsConfig.hero_bg_image,
              button_text_en: cmsSectionsConfig.hero_button_text_en,
              button_text_bn: cmsSectionsConfig.hero_button_text_bn,
              button_link: cmsSectionsConfig.hero_button_link || '/products',
            }
          });
        }

        if (cmsSectionsConfig.enable_story) {
          initialSections.push({
            type: 'rich_text',
            position: positionCounter++,
            is_visible: true,
            config: {
              title_en: cmsSectionsConfig.story_title_en,
              title_bn: cmsSectionsConfig.story_title_bn,
              content_en: cmsSectionsConfig.story_content_en,
              content_bn: cmsSectionsConfig.story_content_bn,
              align: 'left',
              max_width: 'lg',
            }
          });
        }

        if (cmsSectionsConfig.enable_features) {
          initialSections.push({
            type: 'features',
            position: positionCounter++,
            is_visible: true,
            config: {
              title_en: cmsSectionsConfig.features_title_en,
              title_bn: cmsSectionsConfig.features_title_bn,
              items: [
                {
                  title_en: '100% Original Products',
                  title_bn: '১০০% অরিজিনাল ও প্রিমিয়াম কোয়ালিটি',
                  desc_en: 'Authentic items directly sourced from trusted manufacturers.',
                  desc_bn: 'সরাসরি বিশ্বস্ত প্রস্তুতকারক থেকে সংগৃহীত খাঁটি পণ্য।'
                },
                {
                  title_en: 'Nationwide Fast Delivery',
                  title_bn: 'সারাদেশে দ্রুততম হোম ডেলিভারি',
                  desc_en: 'Doorstep delivery across all 64 districts in 24-72 hours.',
                  desc_bn: '৬৪টি জেলায় ২৪ থেকে ৭২ ঘণ্টার মধ্যে ডেলিভারি সুবিধা।'
                },
                {
                  title_en: 'Cash on Delivery (COD)',
                  title_bn: 'ক্যাশ অন ডেলিভারি সুবিধা',
                  desc_en: 'Check the parcel at your doorstep before completing payment.',
                  desc_bn: 'পণ্য হাতে পেয়ে দেখে সম্পূর্ণ মূল্য পরিশোধ করার সুবিধা।'
                },
                {
                  title_en: '7-Day Easy Replacement',
                  title_bn: '৭ দিনের সহজ এক্সচেঞ্জ গ্যারান্টি',
                  desc_en: 'Quick customer service resolution for any sizing or defect issues.',
                  desc_bn: 'যেকোনো সমস্যায় দ্রুত হেল্পলাইন সাপোর্ট ও রিপ্লেসমেন্ট।'
                }
              ]
            }
          });
        }

        if (cmsSectionsConfig.enable_faq) {
          initialSections.push({
            type: 'faq',
            position: positionCounter++,
            is_visible: true,
            config: {
              title_en: cmsSectionsConfig.faq_title_en,
              title_bn: cmsSectionsConfig.faq_title_bn,
              items: [
                {
                  question_en: 'How long does delivery take inside and outside Dhaka?',
                  question_bn: 'ঢাকা ও ঢাকার বাইরে ডেলিভারি পেতে কত দিন সময় লাগে?',
                  answer_en: 'Inside Dhaka orders are typically delivered within 24 hours. Outside Dhaka takes 48-72 hours via Steadfast, Pathao, or RedX.',
                  answer_bn: 'ঢাকার ভিতরে সাধারণত ২৪ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়। ঢাকার বাইরে ৪৮-৭২ ঘণ্টার মধ্যে ডেলিভারি করা হয়।'
                },
                {
                  question_en: 'Can I pay with Cash on Delivery (COD)?',
                  question_bn: 'আমি কি ক্যাশ অন ডেলিভারিতে (COD) মূল্য পরিশোধ করতে পারি?',
                  answer_en: 'Yes, 100% of our products support Cash on Delivery. You only pay when you inspect the parcel at your doorstep.',
                  answer_bn: 'হ্যাঁ, আমাদের প্রতিটি পণ্যে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। পার্সেল হাতে পেয়ে মূল্য পরিশোধ করতে পারবেন।'
                }
              ]
            }
          });
        }

        if (cmsSectionsConfig.enable_reviews) {
          initialSections.push({
            type: 'testimonial',
            position: positionCounter++,
            is_visible: true,
            config: {
              title_en: cmsSectionsConfig.reviews_title_en,
              title_bn: cmsSectionsConfig.reviews_title_bn,
              testimonials: [
                {
                  name: 'Saiful Islam (Dhanmondi, Dhaka)',
                  quote_en: 'Ordered in the morning and received it within 24 hours through Steadfast. Original product with warranty!',
                  quote_bn: 'সকালে অর্ডার করে ২৪ ঘণ্টার মধ্যে ডেলিভারি পেয়েছি। আসল পণ্য ও চমৎকার সার্ভিস!',
                  rating: 5
                },
                {
                  name: 'Shaila Yasmin (GEC, Chattogram)',
                  quote_en: 'The product is breathtakingly beautiful. Very happy with seamless checkout.',
                  quote_bn: 'পণ্যটি অসম্ভব সুন্দর। খুব সহজে ক্যাশ অন ডেলিভারিতে অর্ডার করেছি।',
                  rating: 5
                }
              ]
            }
          });
        }

        const payload = {
          title_en: formData.title_en,
          title_bn: formData.title_bn || formData.title_en,
          slug: finalSlug,
          page_type: 'custom',
          product_id: null,
          products: [],
          sections: initialSections,
          is_homepage: formData.is_homepage,
          is_published: formData.is_published,
          seo_title: formData.seo_title || formData.title_en,
          seo_description: formData.seo_description || '',
        };

        return await api.post('/admin/pages', payload);
      }

      // Funnel Page (Single or Multi product)
      const defaultProduct = pageProducts.find(p => p.is_default) || pageProducts[0];
      const primaryProductId = defaultProduct && defaultProduct.product_id
        ? Number(defaultProduct.product_id)
        : (formData.product_id ? parseInt(formData.product_id) : null);

      const primaryCustomPrice = defaultProduct && defaultProduct.custom_price !== '' && defaultProduct.custom_price !== undefined
        ? parseFloat(String(defaultProduct.custom_price))
        : (formData.custom_price ? parseFloat(formData.custom_price) : null);

      const effectivePageType = createPageType === 'multi_product_funnel' || pageProducts.length > 1
        ? 'multi_product_funnel'
        : 'single_product_funnel';

      const payload = {
        title_en: formData.title_en,
        title_bn: formData.title_bn || formData.title_en,
        slug: finalSlug,
        page_type: effectivePageType,
        product_id: primaryProductId,
        discount_code: formData.discount_code || null,
        offer_headline_en: formData.offer_headline_en || formData.title_en,
        offer_headline_bn: formData.offer_headline_bn || formData.title_bn,
        cta_button_text_en: formData.cta_button_text_en,
        cta_button_text_bn: formData.cta_button_text_bn,
        badge_text: formData.badge_text,
        features: featuresArray,
        video_url: formData.video_url || null,
        custom_price: primaryCustomPrice,
        free_delivery: formData.free_delivery,
        show_order_form: formData.show_order_form,
        is_homepage: formData.is_homepage,
        is_published: formData.is_published,
        seo_title: formData.seo_title,
        seo_description: formData.seo_description,
        products: pageProducts.map((p, idx) => ({
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
      };

      return await api.post('/admin/pages', payload);
    },
    onSuccess: () => {
      toast.success(
        createPageType === 'custom'
          ? 'Custom CMS Page created successfully!'
          : 'Landing page & sales funnel created successfully!'
      );
      setIsCreateModalOpen(false);
      setPageProducts([]);
      setFormData({
        title_en: '',
        title_bn: '',
        slug: '',
        product_id: '',
        discount_code: 'EID2026',
        offer_headline_en: '',
        offer_headline_bn: '',
        cta_button_text_en: 'Order Now - Cash on Delivery',
        cta_button_text_bn: 'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)',
        badge_text: '🔥 হট ডিল - স্টক সীমিত',
        features_raw: "১০০% প্রিমিয়াম ও অরিজিনাল কোয়ালিটি\nসারাদেশে দ্রুত হোম ডেলিভারি (২৪-৪৮ ঘণ্টা)\nপণ্য হাতে পেয়ে দেখে মূল্য পরিশোধের সুবিধা\n৭ দিনের সহজ রিপ্লেসমেন্ট গ্যারান্টি",
        video_url: '',
        custom_price: '',
        free_delivery: false,
        show_order_form: true,
        is_homepage: false,
        is_published: true,
        seo_title: '',
        seo_description: '',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to create page';
      const validationDetails = err?.errors
        ? '\n' + Object.values(err.errors).flat().join(', ')
        : '';
      toast.error(msg + validationDetails);
    }
  });

  // Delete Page Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/admin/pages/${id}`);
    },
    onSuccess: () => {
      toast.success('Page deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete page');
    }
  });

  const handleDelete = (id: number, title: string, isHomepage: boolean) => {
    if (isHomepage) {
      toast.error('The default homepage cannot be deleted');
      return;
    }
    if (window.confirm(`Delete page "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<any>[] = [
    { 
      key: 'title_en', 
      label: 'Page Title & Type', 
      render: (row) => {
        const isCustom = row.page_type === 'custom' || (!row.product_id && (!row.page_products || row.page_products.length === 0));
        const isMulti = row.page_type === 'multi_product_funnel' || (row.page_products && row.page_products.length > 1);

        return (
          <div className="space-y-1">
            <div className="font-bold text-foreground flex items-center gap-2 flex-wrap">
              <span className="text-sm">{row.title_en}</span>
              {row.is_homepage && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/30">
                  Homepage
                </span>
              )}
            </div>
            {row.title_bn && (
              <div className="text-[11px] font-semibold text-muted-foreground">
                {row.title_bn}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {isCustom ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                  <Layers className="w-3 h-3 text-blue-600" />
                  <span>Custom CMS Page</span>
                </span>
              ) : isMulti ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
                  <Package className="w-3 h-3 text-purple-600" />
                  <span>Multi-Product Bundle</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <Target className="w-3 h-3 text-amber-600" />
                  <span>Single Product Funnel</span>
                </span>
              )}

              {row.page_products && row.page_products.length > 0 ? (
                <span className="text-[11px] font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10 truncate max-w-[200px]">
                  {row.page_products.length} Products / Offers
                </span>
              ) : row.product ? (
                <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[160px]">
                  Linked: {row.product.name_en}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {row.sections?.length || 0} Layout Sections
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    { 
      key: 'slug', 
      label: 'Live URL Path', 
      render: (row) => {
        const livePath = row.is_homepage ? '/' : `/p/${row.slug}`;
        return (
          <Link 
            href={livePath} 
            target="_blank"
            className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-xl clay-inset text-primary font-bold hover:underline"
          >
            <Globe className="w-3 h-3" />
            <span>{livePath}</span>
          </Link>
        );
      }
    },
    { 
      key: 'features', 
      label: 'Form / Sections', 
      render: (row) => {
        const isCustom = row.page_type === 'custom' || (!row.product_id && (!row.page_products || row.page_products.length === 0));
        return (
          <div className="flex flex-col gap-1 text-xs">
            {isCustom ? (
              <span className="text-muted-foreground font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>{row.sections?.length || 0} Dynamic Sections</span>
              </span>
            ) : (
              <span className="text-primary font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Unified 1-Page Checkout</span>
              </span>
            )}
            {row.free_delivery && (
              <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
                <Truck className="w-3 h-3" />
                <span>Free Delivery</span>
              </span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'is_published', 
      label: 'Status', 
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
          row.is_published 
            ? 'bg-primary/15 text-primary border border-primary/20' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {row.is_published ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          <span>{row.is_published ? 'Published' : 'Draft'}</span>
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const livePath = row.is_homepage ? '/' : `/p/${row.slug}`;
        return (
          <div className="flex items-center gap-1.5">
            <Link 
              href={livePath} 
              target="_blank"
              className="p-2 clay-btn rounded-xl text-muted-foreground hover:text-foreground transition-all"
              title="Preview Live Page"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link 
              href={`/admin/pages/${row.id}/edit`} 
              className="p-2 clay-btn rounded-xl text-primary hover:bg-primary/10 transition-all"
              title="Edit Page & Sections"
            >
              <Edit className="w-4 h-4" />
            </Link>
            {!row.is_homepage && (
              <button
                type="button"
                onClick={() => handleDelete(row.id, row.title_en, row.is_homepage)}
                className="p-2 clay-btn rounded-xl text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                title="Delete Page"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 pb-16 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <span>Pages, Funnels & Custom CMS</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Build high-converting 1-page checkout funnels and custom CMS content pages with sliders, reviews, and FAQs
          </p>
        </div>

        <button 
          onClick={() => {
            setIsCreateModalOpen(true);
            // Default to single product funnel with first catalog item if available
            if (createPageType !== 'custom' && pageProducts.length === 0 && productsData.length > 0) {
              const first = productsData[0];
              setPageProducts([{
                product_id: first.id,
                title_en: first.name_en,
                title_bn: first.name_bn,
                image: first.primary_image_url || first.images?.[0]?.path || '',
                custom_price: first.base_price || first.current_price,
                compare_price: first.compare_price,
                badge_text: '🔥 মোস্ট পপুলার',
                is_default: true,
                sort_order: 0,
                variations: first.variants || [],
                new_variants: [],
              }]);
            }
          }}
          className="clay-btn-primary px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Create Landing Page / Funnel</span>
        </button>
      </div>

      {/* Tabs Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveTypeTab('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTypeTab === 'all'
                ? 'clay-chip-active text-primary ring-2 ring-primary/40 shadow-sm'
                : 'clay-card text-muted-foreground hover:text-foreground'
            }`}
          >
            All Pages ({tabCounts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveTypeTab('funnel')}
            className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTypeTab === 'funnel'
                ? 'clay-chip-active text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/40 shadow-sm'
                : 'clay-card text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-amber-500" />
            <span>Funnels & Bundles ({tabCounts.funnel})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTypeTab('custom')}
            className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTypeTab === 'custom'
                ? 'clay-chip-active text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/40 shadow-sm'
                : 'clay-card text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Custom CMS Pages ({tabCounts.custom})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 clay-input rounded-2xl text-xs font-semibold"
          />
        </div>
      </div>

      {/* Pages Table */}
      <div className="clay-card rounded-3xl p-2 overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredPages}
          isLoading={isLoading}
        />
      </div>

      {/* Create Landing Page & Sales Funnel Modal */}
      {isCreateModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal w-full max-w-3xl rounded-3xl p-4 sm:p-7 space-y-5 my-4 sm:my-8 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between neu-modal-header pb-3 sticky top-0 z-10 bg-background/95 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl neu-card-inset flex items-center justify-center text-primary">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-base sm:text-lg font-black text-foreground">Create New Page / Funnel</h2>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Purpose / Type Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCreatePageType('single_product_funnel');
                  if (pageProducts.length === 0 && productsData.length > 0) {
                    const first = productsData[0];
                    setPageProducts([{
                      product_id: first.id,
                      title_en: first.name_en,
                      title_bn: first.name_bn,
                      image: first.primary_image_url || first.images?.[0]?.path || '',
                      custom_price: first.base_price || first.current_price,
                      compare_price: first.compare_price,
                      badge_text: '🔥 মোস্ট পপুলার',
                      is_default: true,
                      sort_order: 0,
                      variations: first.variants || [],
                      new_variants: [],
                    }]);
                  }
                }}
                className={`p-3.5 rounded-2xl text-left transition-all space-y-1 cursor-pointer border ${
                  createPageType === 'single_product_funnel'
                    ? 'neu-tile-active border-amber-500/50 shadow-sm'
                    : 'neu-tile-inactive border-border/40'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span>Single Product Funnel</span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed opacity-90">
                  Focus on 1 hero product with package tiers, variants, and direct order form.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatePageType('multi_product_funnel');
                  if (pageProducts.length === 0 && productsData.length > 0) {
                    const first = productsData[0];
                    setPageProducts([{
                      product_id: first.id,
                      title_en: first.name_en,
                      title_bn: first.name_bn,
                      image: first.primary_image_url || first.images?.[0]?.path || '',
                      custom_price: first.base_price || first.current_price,
                      compare_price: first.compare_price,
                      badge_text: '🔥 বান্ডেল আইটেম ১',
                      is_default: true,
                      sort_order: 0,
                      variations: first.variants || [],
                      new_variants: [],
                    }]);
                  }
                }}
                className={`p-3.5 rounded-2xl text-left transition-all space-y-1 cursor-pointer border ${
                  createPageType === 'multi_product_funnel'
                    ? 'neu-tile-active border-purple-500/50 shadow-sm'
                    : 'neu-tile-inactive border-border/40'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm">
                  <Package className="w-4 h-4 text-purple-500" />
                  <span>Multi-Product Bundle</span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed opacity-90">
                  Bundle 2 or more products together. Customers buy all items in 1-click.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatePageType('custom');
                }}
                className={`p-3.5 rounded-2xl text-left transition-all space-y-1 cursor-pointer border ${
                  createPageType === 'custom'
                    ? 'neu-tile-active border-blue-500/50 shadow-sm'
                    : 'neu-tile-inactive border-border/40'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>Custom CMS Page</span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed opacity-90">
                  Multi-section page (Home, About, Policies) with hero sliders, text stories, reviews & FAQs.
                </p>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              
              {/* IF CUSTOM CMS PAGE IS SELECTED: USER-FRIENDLY CMS FIELDS */}
              {createPageType === 'custom' ? (
                <div className="space-y-4">
                  {/* Basic Page Identifiers */}
                  <div className="p-4 neu-card-inset rounded-2xl space-y-3">
                    <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Page Title & URL Slug</span>
                    </h3>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Page Title (English) *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. About Our Brand & Heritage"
                        value={formData.title_en}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(p => ({
                            ...p,
                            title_en: val,
                            slug: p.slug ? p.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                          }));
                        }}
                        className="w-full px-4 py-3 neu-input text-xs font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">Page Title (বাংলা / Bengali)</label>
                        <input 
                          type="text" 
                          placeholder="যেমনঃ আমাদের গল্প ও প্রতিশ্রুতি"
                          value={formData.title_bn}
                          onChange={(e) => setFormData(p => ({ ...p, title_bn: e.target.value }))}
                          className="w-full px-4 py-2.5 neu-input text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">Custom URL Slug *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="about-us"
                          value={formData.slug}
                          onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))}
                          className="w-full px-4 py-2.5 neu-input text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Starter Content Sections (Direct Text, No JSON or HTML) */}
                  <div className="p-4 neu-card-inset rounded-2xl space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Starter Content Sections (Direct Text)</span>
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Select which sections to include on this page. All content uses direct text fields.
                      </p>
                    </div>

                    {/* 1. Hero Banner Option */}
                    <div className="clay-card p-3.5 rounded-2xl space-y-3 border border-border/50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-primary" />
                          <span className="text-xs font-black text-foreground">Include Hero Banner Slider</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={cmsSectionsConfig.enable_hero}
                          onChange={(e) => setCmsSectionsConfig(p => ({ ...p, enable_hero: e.target.checked }))}
                          className="w-4 h-4 rounded text-primary"
                        />
                      </label>

                      {cmsSectionsConfig.enable_hero && (
                        <div className="space-y-2.5 pt-2 border-t border-border/40">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-bold text-foreground block mb-0.5">Heading (English)</label>
                              <input 
                                type="text"
                                value={cmsSectionsConfig.hero_heading_en}
                                onChange={(e) => setCmsSectionsConfig(p => ({ ...p, hero_heading_en: e.target.value }))}
                                className="neu-input w-full text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-foreground block mb-0.5">Heading (বাংলা)</label>
                              <input 
                                type="text"
                                value={cmsSectionsConfig.hero_heading_bn}
                                onChange={(e) => setCmsSectionsConfig(p => ({ ...p, hero_heading_bn: e.target.value }))}
                                className="neu-input w-full text-xs font-semibold"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-foreground block mb-0.5">Background Image URL</label>
                            <input 
                              type="url"
                              value={cmsSectionsConfig.hero_bg_image}
                              onChange={(e) => setCmsSectionsConfig(p => ({ ...p, hero_bg_image: e.target.value }))}
                              className="neu-input w-full text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Story / Rich Text Option */}
                    <div className="clay-card p-3.5 rounded-2xl space-y-3 border border-border/50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <AlignLeft className="w-4 h-4 text-primary" />
                          <span className="text-xs font-black text-foreground">Include Story / Informational Text</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={cmsSectionsConfig.enable_story}
                          onChange={(e) => setCmsSectionsConfig(p => ({ ...p, enable_story: e.target.checked }))}
                          className="w-4 h-4 rounded text-primary"
                        />
                      </label>

                      {cmsSectionsConfig.enable_story && (
                        <div className="space-y-2.5 pt-2 border-t border-border/40">
                          <div>
                            <label className="text-[11px] font-bold text-foreground block mb-0.5">Section Title</label>
                            <input 
                              type="text"
                              value={cmsSectionsConfig.story_title_en}
                              onChange={(e) => setCmsSectionsConfig(p => ({ ...p, story_title_en: e.target.value }))}
                              className="neu-input w-full text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-foreground block mb-0.5">Text Body (English) — Direct text</label>
                            <textarea 
                              rows={3}
                              value={cmsSectionsConfig.story_content_en}
                              onChange={(e) => setCmsSectionsConfig(p => ({ ...p, story_content_en: e.target.value }))}
                              className="neu-input w-full text-xs leading-relaxed"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-foreground block mb-0.5">Text Body (বাংলা) — সরাসরি লিখুন</label>
                            <textarea 
                              rows={3}
                              value={cmsSectionsConfig.story_content_bn}
                              onChange={(e) => setCmsSectionsConfig(p => ({ ...p, story_content_bn: e.target.value }))}
                              className="neu-input w-full text-xs leading-relaxed"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Guarantees & Features */}
                    <div className="clay-card p-3.5 rounded-2xl space-y-2 border border-border/50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          <div>
                            <span className="text-xs font-black text-foreground block">Include Why Shop With Us (4 Guarantees)</span>
                            <span className="text-[10px] text-muted-foreground">Original Products, Fast Delivery, Cash on Delivery, Easy Returns</span>
                          </div>
                        </div>
                        <input 
                          type="checkbox"
                          checked={cmsSectionsConfig.enable_features}
                          onChange={(e) => setCmsSectionsConfig(p => ({ ...p, enable_features: e.target.checked }))}
                          className="w-4 h-4 rounded text-primary"
                        />
                      </label>
                    </div>

                    {/* 4. FAQ Accordion */}
                    <div className="clay-card p-3.5 rounded-2xl space-y-2 border border-border/50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-primary" />
                          <div>
                            <span className="text-xs font-black text-foreground block">Include FAQ Accordion (Common Questions)</span>
                            <span className="text-[10px] text-muted-foreground">Interactive questions & answers on delivery, payments & replacement</span>
                          </div>
                        </div>
                        <input 
                          type="checkbox"
                          checked={cmsSectionsConfig.enable_faq}
                          onChange={(e) => setCmsSectionsConfig(p => ({ ...p, enable_faq: e.target.checked }))}
                          className="w-4 h-4 rounded text-primary"
                        />
                      </label>
                    </div>

                    {/* 5. Customer Reviews */}
                    <div className="clay-card p-3.5 rounded-2xl space-y-2 border border-border/50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <div>
                            <span className="text-xs font-black text-foreground block">Include Customer Reviews Social Proof</span>
                            <span className="text-[10px] text-muted-foreground">Verified buyer quotes with 5-star rating badges</span>
                          </div>
                        </div>
                        <input 
                          type="checkbox"
                          checked={cmsSectionsConfig.enable_reviews}
                          onChange={(e) => setCmsSectionsConfig(p => ({ ...p, enable_reviews: e.target.checked }))}
                          className="w-4 h-4 rounded text-primary"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* IF SINGLE OR MULTI-PRODUCT FUNNEL IS SELECTED */
                <div className="space-y-4">
                  {/* Multi-Product & Variation Builder */}
                  <div className="p-4 neu-card-inset rounded-2xl space-y-3">
                    <PageProductBuilder
                      products={pageProducts}
                      onChange={(updated) => {
                        setPageProducts(updated);
                        if (updated.length > 0 && updated[0].product_id) {
                          const firstProd = productsData.find((p: any) => p.id === updated[0].product_id);
                          if (firstProd && !formData.title_en) {
                            setFormData(prev => ({
                              ...prev,
                              product_id: String(firstProd.id),
                              title_en: firstProd.name_en ? `Special Deal: ${firstProd.name_en}` : prev.title_en,
                              title_bn: firstProd.name_bn ? `বিশেষ অফার: ${firstProd.name_bn}` : prev.title_bn,
                              slug: firstProd.slug ? `${firstProd.slug}-offer` : prev.slug,
                              offer_headline_en: `Exclusive Flash Deal on ${firstProd.name_en}`,
                              offer_headline_bn: `সীমিত সময়ের জন্য বিশেষ ছাড় ও ফ্রি হোম ডেলিভারি!`,
                            }));
                          }
                        }
                      }}
                      catalogProducts={productsData}
                    />
                  </div>

                  {/* Title & Slug */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Funnel Title (English) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Exclusive Eid Deal: Panjabi Edition"
                      value={formData.title_en}
                      onChange={(e) => setFormData(p => ({ ...p, title_en: e.target.value }))}
                      className="w-full px-4 py-3 neu-input text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Funnel Title (Bengali / বাংলা)</label>
                      <input 
                        type="text" 
                        placeholder="যেমনঃ বিশেষ ঈদ অফার: প্রিমিয়াম পাঞ্জাবি"
                        value={formData.title_bn}
                        onChange={(e) => setFormData(p => ({ ...p, title_bn: e.target.value }))}
                        className="w-full px-4 py-2.5 neu-input text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Custom URL Slug *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="exclusive-panjabi-offer"
                        value={formData.slug}
                        onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))}
                        className="w-full px-4 py-2.5 neu-input text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Additional Funnel Settings */}
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">Urgency Promo Badge</label>
                        <input 
                          type="text" 
                          placeholder="🔥 ৫০% পর্যন্ত ছাড় - স্টক সীমিত"
                          value={formData.badge_text}
                          onChange={(e) => setFormData(p => ({ ...p, badge_text: e.target.value }))}
                          className="w-full px-4 py-2.5 neu-input text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">Promo Coupon Code</label>
                        <input 
                          type="text" 
                          placeholder="e.g. EID2026"
                          value={formData.discount_code}
                          onChange={(e) => setFormData(p => ({ ...p, discount_code: e.target.value }))}
                          className="w-full px-4 py-2.5 neu-input text-xs font-mono font-bold uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">YouTube Video Demo URL (Optional)</label>
                      <input 
                        type="url" 
                        placeholder="https://www.youtube.com/embed/..."
                        value={formData.video_url}
                        onChange={(e) => setFormData(p => ({ ...p, video_url: e.target.value }))}
                        className="w-full px-4 py-2.5 neu-input text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Key Selling Points (1 per line)</label>
                      <textarea 
                        rows={3}
                        value={formData.features_raw}
                        onChange={(e) => setFormData(p => ({ ...p, features_raw: e.target.value }))}
                        className="w-full px-4 py-2.5 neu-input text-xs font-medium resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center justify-between p-3 neu-card-inset rounded-2xl cursor-pointer">
                        <span className="text-xs font-bold text-foreground">Free Delivery Active</span>
                        <input 
                          type="checkbox" 
                          checked={formData.free_delivery}
                          onChange={(e) => setFormData(p => ({ ...p, free_delivery: e.target.checked }))}
                          className="w-4 h-4 rounded text-primary"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 neu-card-inset rounded-2xl cursor-pointer">
                        <span className="text-xs font-bold text-foreground">Direct Order Form</span>
                        <input 
                          type="checkbox" 
                          checked={formData.show_order_form}
                          onChange={(e) => setFormData(p => ({ ...p, show_order_form: e.target.checked }))}
                          className="w-4 h-4 rounded text-primary"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Toggles: Publish and Homepage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between p-3 neu-card-inset rounded-2xl cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-foreground block">Publish Live</span>
                    <span className="text-[10px] text-muted-foreground">Make visible on storefront</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={formData.is_published}
                    onChange={(e) => setFormData(p => ({ ...p, is_published: e.target.checked }))}
                    className="w-4 h-4 rounded text-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-3 neu-card-inset rounded-2xl cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-foreground block">Set as Homepage</span>
                    <span className="text-[10px] text-muted-foreground">Sets route as store root /</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={formData.is_homepage}
                    onChange={(e) => setFormData(p => ({ ...p, is_homepage: e.target.checked }))}
                    className="w-4 h-4 rounded text-primary"
                  />
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-4 neu-modal-footer sticky bottom-0 z-10 py-2 bg-background/95 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="neu-btn-secondary px-4 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-bold disabled:opacity-60 cursor-pointer"
                >
                  {createMutation.isPending 
                    ? 'Creating...' 
                    : (createPageType === 'custom' ? 'Create Custom CMS Page' : 'Create & Launch Funnel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
