'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useCartStore, useLocaleStore, useOrderStore } from '@/lib/store';
import { formatBDT } from '@/utils/currency';
import { BANGLADESH_DISTRICTS, calculateBangladeshShipping } from '@/utils/bangladesh-geo';
import {
  ShieldCheck, Truck, ShoppingBag,
  ArrowRight, CheckCircle2, Lock, MapPin, Building2,
  MapPinned, Tag, Sparkles, X, ChevronRight, Phone,
  Check, Clock, Zap, User, Mail, FileText, Copy, CreditCard, Wallet,
  Plus, Minus, Trash2, Flame, Award, AlertCircle, RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export interface ActivePaymentGateway {
  id: number;
  name: string;
  code: string;
  title: string;
  title_bn: string;
  badge?: string | null;
  badge_bn?: string | null;
  type: string;
  description?: string | null;
  description_bn?: string | null;
  is_sandbox?: boolean;
  charge_percentage?: number;
  charge_fixed?: number;
  min_amount?: number | null;
  max_amount?: number | null;
  icon?: string | null;
  instructions?: string | null;
  instructions_bn?: string | null;
}

export const DEFAULT_GATEWAYS: ActivePaymentGateway[] = [
  {
    id: 1,
    name: 'Cash on Delivery (COD)',
    code: 'cod',
    title: 'Cash on Delivery',
    title_bn: 'ক্যাশ অন ডেলিভারি',
    badge: 'Doorstep Cash',
    badge_bn: 'ক্যাশ অন ডেলিভারি',
    type: 'cod',
    description: 'Pay with cash when your parcel is delivered to your doorstep across Bangladesh.',
    description_bn: 'পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধ করুন। সারা দেশে বিশ্বস্ত ডেলিভারি।',
    instructions: 'Please keep exact cash ready upon parcel delivery.',
    instructions_bn: 'ডেলিভারি ম্যানের কাছে পণ্য গ্রহণের সময় সঠিক মূল্য পরিশোধ করুন।'
  },
  {
    id: 2,
    name: 'bKash Direct Merchant Gateway',
    code: 'bkash',
    title: 'bKash Direct Merchant Gateway',
    title_bn: 'বিকাশ ডিরেক্ট মার্চেন্ট গেটওয়ে',
    badge: 'Tokenized API',
    badge_bn: 'টোকেনাইজড এপিআই',
    type: 'mfs',
    description: 'Instant automated payment verification via tokenized checkout',
    description_bn: 'টোকেনাইজড চেকআউট এর মাধ্যমে তাত্ক্ষণিক স্বয়ংক্রিয় পেমেন্ট ভেরিফিকেশন',
    instructions: 'You will be redirected to the secure official bKash checkout portal.',
    instructions_bn: 'অফিসিয়াল বিকাশ পেমেন্ট পেজে রিডাইরেক্ট করে নিশ্চিন্তে পেমেন্ট সম্পন্ন করুন।'
  },
  {
    id: 3,
    name: 'Nagad Direct Gateway',
    code: 'nagad',
    title: 'Nagad Direct Gateway',
    title_bn: 'নগদ ডিরেক্ট গেটওয়ে',
    badge: 'PGW Direct',
    badge_bn: 'পিজিডব্লিউ ডিরেক্ট',
    type: 'mfs',
    description: 'Seamless mobile wallet direct payment checkout',
    description_bn: 'সরাসরি মোবাইল ওয়ালেট পেমেন্ট চেকআউট',
    instructions: 'Enter your Nagad wallet number and PIN on the official secured portal.',
    instructions_bn: 'অফিসিয়াল নিরাপদ পোর্টালে আপনার নগদ একাউন্ট নম্বর এবং পিন দিন।'
  },
  {
    id: 4,
    name: 'SSLCommerz Multi-Gateway',
    code: 'sslcommerz',
    title: 'SSLCommerz Multi-Gateway',
    title_bn: 'এসএসএলকমার্জ মাল্টি-গেটওয়ে',
    badge: 'All BD Cards & NetBanking',
    badge_bn: 'সকল দেশীয় কার্ড ও নেটব্যাংকিং',
    type: 'gateway',
    description: 'Visa, MasterCard, Amex, UnionPay, Rocket, Upay & NetBanking',
    description_bn: 'ভিসা, মাস্টারকার্ড, অ্যামেক্স, ইউনিয়নপে, রকেট, উপায় এবং নেটব্যাংকিং',
    instructions: 'Supports Visa, MasterCard, Amex, UnionPay, Nexus, and all Internet Banking.',
    instructions_bn: 'সকল ভিসা, মাস্টারকার্ড, এমেক্স, ইউনিয়নপে কার্ড ও ইন্টারনেট ব্যাংকিং সাপোর্ট করে।'
  }
];

export function getGatewayStyle(code: string, type: string, isSelected: boolean) {
  const c = (code || '').toLowerCase();
  if (c === 'bkash') {
    return {
      card: isSelected
        ? 'border-[#E2136E] bg-[#E2136E]/10 dark:bg-[#E2136E]/20 ring-2 ring-[#E2136E]/20 shadow-xs'
        : 'border-slate-200 dark:border-slate-800 hover:border-[#E2136E]/40 bg-slate-50/40 dark:bg-slate-900/40',
      iconBox: 'bg-[#E2136E]/10 text-[#E2136E] font-black',
      icon: <span className="font-black text-sm">৳</span>,
      badge: 'bg-[#E2136E]/15 text-[#E2136E] border border-[#E2136E]/20',
      radio: 'text-[#E2136E] accent-[#E2136E]',
    };
  }
  if (c === 'nagad') {
    return {
      card: isSelected
        ? 'border-[#F7941D] bg-[#F7941D]/10 dark:bg-[#F7941D]/20 ring-2 ring-[#F7941D]/20 shadow-xs'
        : 'border-slate-200 dark:border-slate-800 hover:border-[#F7941D]/40 bg-slate-50/40 dark:bg-slate-900/40',
      iconBox: 'bg-[#F7941D]/10 text-[#F7941D] font-black',
      icon: <span className="font-black text-sm">৳</span>,
      badge: 'bg-[#F7941D]/15 text-[#F7941D] border border-[#F7941D]/20',
      radio: 'text-[#F7941D] accent-[#F7941D]',
    };
  }
  if (c === 'sslcommerz') {
    return {
      card: isSelected
        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-xs'
        : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/40 bg-slate-50/40 dark:bg-slate-900/40',
      iconBox: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600',
      icon: <CreditCard className="w-5 h-5" />,
      badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      radio: 'text-blue-600 accent-blue-600',
    };
  }
  if (c === 'cod') {
    return {
      card: isSelected
        ? 'border-primary bg-primary/10/60 dark:bg-primary/10/30 ring-2 ring-primary/20 shadow-xs'
        : 'border-slate-200 dark:border-slate-800 hover:border-primary/40 bg-slate-50/40 dark:bg-slate-900/40',
      iconBox: 'bg-primary/20 dark:bg-primary/10/60 text-primary',
      icon: <Truck className="w-5 h-5" />,
      badge: 'bg-primary/15 text-primary dark:text-primary border border-primary/20',
      radio: 'text-primary accent-primary',
    };
  }
  if (c === 'rocket') {
    return {
      card: isSelected
        ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-xs'
        : 'border-slate-200 dark:border-slate-800 hover:border-purple-500/40 bg-slate-50/40 dark:bg-slate-900/40',
      iconBox: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 font-bold',
      icon: <Zap className="w-5 h-5" />,
      badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20',
      radio: 'text-purple-600 accent-purple-600',
    };
  }
  if (type === 'bank' || c === 'bank_transfer') {
    return {
      card: isSelected
        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-xs'
        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 bg-slate-50/40 dark:bg-slate-900/40',
      iconBox: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600',
      icon: <Building2 className="w-5 h-5" />,
      badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
      radio: 'text-indigo-600 accent-indigo-600',
    };
  }
  return {
    card: isSelected
      ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/30 ring-2 ring-teal-500/20 shadow-xs'
      : 'border-slate-200 dark:border-slate-800 hover:border-teal-500/40 bg-slate-50/40 dark:bg-slate-900/40',
    iconBox: 'bg-teal-100 dark:bg-teal-950/60 text-teal-600',
    icon: <CreditCard className="w-5 h-5" />,
    badge: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20',
    radio: 'text-teal-600 accent-teal-600',
  };
}

export interface UnifiedCheckoutProps {
  mode: 'cart' | 'landing';
  pageData?: any;
  config?: any;
  productData?: any;
}

export function UnifiedCheckout({ mode, pageData, config, productData }: UnifiedCheckoutProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { locale } = useLocaleStore();
  const { items = [], clearCart, updateQuantity, updateVariant, removeItem } = useCartStore();
  const { setLastOrder } = useOrderStore();

  // Landing page products parsing
  const landingProducts = useMemo(() => {
    if (mode !== 'landing') return [];
    
    // Check page_products from backend
    if (pageData?.page_products && Array.isArray(pageData.page_products) && pageData.page_products.length > 0) {
      return pageData.page_products;
    }

    // Fallback to single product attached on pageData
    const prod = pageData?.product || config?.product || productData?.product || productData;
    if (prod) {
      return [{
        id: 1,
        product_id: prod.id,
        title_en: pageData?.title_en || prod.name_en || 'Special Offer Product',
        title_bn: pageData?.title_bn || prod.name_bn || 'বিশেষ অফার পণ্য',
        image: prod.primary_image_url || prod.images?.[0]?.path || prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85',
        custom_price: pageData?.custom_price ? Number(pageData.custom_price) : Number(prod.base_price || prod.current_price || 0),
        compare_price: Number(prod.compare_price || (Number(prod.base_price || prod.current_price || 0) * 1.3)),
        badge_text: pageData?.badge_text || 'Hot Deal 🔥',
        is_default: true,
        product: prod,
        variations: prod.variants || [],
      }];
    }

    return [];
  }, [mode, pageData, config, productData]);

  // Multi-Product Landing Selections State
  interface LandingProductItemSelection {
    id: number | string;
    product_id: number;
    product: any;
    title_en: string;
    title_bn?: string;
    image: string;
    unit_price: number;
    compare_price?: number;
    badge_text?: string;
    availableVariants: any[];
    selectedVariantId: number | null;
    quantity: number;
    selected: boolean;
  }

  const [landingSelections, setLandingSelections] = useState<LandingProductItemSelection[]>([]);

  // Initialize landingSelections whenever landingProducts change
  useEffect(() => {
    if (landingProducts.length > 0) {
      setLandingSelections(landingProducts.map((p: any, idx: number) => {
        const prod = p.product || {};
        const variants = (Array.isArray(p.variations) && p.variations.length > 0)
          ? p.variations
          : (Array.isArray(prod.variants) ? prod.variants : []);
        const firstVariantId = variants.length > 0 ? variants[0].id : null;

        let unitPrice = Number(p.custom_price || 0);
        if (unitPrice <= 0 && firstVariantId) {
          const varObj = variants.find((v: any) => v.id === firstVariantId);
          if (varObj?.price && Number(varObj.price) > 0) unitPrice = Number(varObj.price);
        }
        if (unitPrice <= 0) {
          unitPrice = Number(prod.current_price || prod.base_price || 0);
        }

        const rawCompare = Number(p.compare_price || prod.compare_price || prod.old_price || 0);
        const comparePrice = rawCompare > unitPrice ? rawCompare : undefined;

        return {
          id: p.id || `lp-${idx}`,
          product_id: p.product_id || prod.id || 1,
          product: prod,
          title_en: p.title_en || prod.name_en || 'Product',
          title_bn: p.title_bn || prod.name_bn || '',
          image: p.image || prod.primary_image_url || 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85',
          unit_price: unitPrice,
          compare_price: comparePrice,
          badge_text: p.badge_text || '',
          availableVariants: variants,
          selectedVariantId: firstVariantId,
          quantity: 1,
          selected: true, // Default: Purchase all products together in multi-product funnel
        };
      }));
    } else {
      setLandingSelections([]);
    }
  }, [landingProducts]);

  const toggleLandingItemSelection = (idx: number) => {
    setLandingSelections((prev) => {
      const next = [...prev];
      if (next[idx]) {
        const currentlySelectedCount = next.filter((item) => item.selected).length;
        if (next[idx].selected && currentlySelectedCount <= 1) {
          toast(locale === 'bn' ? 'কমপক্ষে একটি প্রোডাক্ট সিলেক্ট থাকতে হবে' : 'At least one product must be selected', { icon: '⚠️' });
          return next;
        }
        next[idx] = { ...next[idx], selected: !next[idx].selected };
      }
      return next;
    });
  };

  const updateLandingItemVariant = (idx: number, variantId: number) => {
    setLandingSelections((prev) => {
      const next = [...prev];
      if (next[idx]) {
        const item = next[idx];
        const v = item.availableVariants.find((varItem: any) => varItem.id === variantId);
        let newPrice = item.unit_price;
        if (v?.price && Number(v.price) > 0) {
          newPrice = Number(v.price);
        }
        next[idx] = { ...item, selectedVariantId: variantId, unit_price: newPrice };
      }
      return next;
    });
  };

  const updateLandingItemQuantity = (idx: number, delta: number) => {
    setLandingSelections((prev) => {
      const next = [...prev];
      if (next[idx]) {
        const newQty = Math.max(1, Math.min(99, (next[idx].quantity || 1) + delta));
        next[idx] = { ...next[idx], quantity: newQty };
      }
      return next;
    });
  };

  const selectAllLandingItems = (selectAll: boolean) => {
    setLandingSelections((prev) =>
      prev.map((item, idx) => ({
        ...item,
        selected: selectAll ? true : idx === 0,
      }))
    );
  };

  const selectedLandingItems = useMemo(() => {
    return landingSelections.filter((it) => it.selected);
  }, [landingSelections]);

  // Form Data
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    district: 'Dhaka',
    thana: 'Dhanmondi',
    shipping_address: '',
    payment_method: 'cod',
    delivery_speed: 'standard', // 'standard' | 'express'
    notes: '',
  });

  // Promo Coupon Engine State
  const initialCoupon = (mode === 'landing' ? (pageData?.discount_code || config?.discount_code) : '') || '';
  const [couponInput, setCouponInput] = useState(initialCoupon);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type?: string;
    value?: number;
  } | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [isLeadSaving, setIsLeadSaving] = useState(false);
  const [isLeadSaved, setIsLeadSaved] = useState(false);
  const leadAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cart mode active items
  const validCartItems = useMemo(() => {
    if (mode !== 'cart' || !mounted) return [];
    return (Array.isArray(items) ? items : []).filter(
      (it) => it && it.product && (it.product.id || it.product.slug)
    );
  }, [mode, mounted, items]);

  // Subtotal Calculation
  const subtotal = useMemo(() => {
    if (mode === 'cart') {
      return validCartItems.reduce((sum, item) => {
        const price = Number(item.variant?.price ?? item.product?.current_price ?? item.product?.base_price ?? 0);
        const qty = Number(item.quantity) || 1;
        return sum + (price * qty);
      }, 0);
    } else {
      return selectedLandingItems.reduce((sum, item) => {
        return sum + (item.unit_price * (item.quantity || 1));
      }, 0);
    }
  }, [mode, validCartItems, selectedLandingItems]);

  // Dynamic Bangladesh Shipping Calculation (Standard Delivery identical to /checkout)
  const shippingInfo = useMemo(() => {
    return calculateBangladeshShipping(formData.district, formData.thana);
  }, [formData.district, formData.thana]);

  const baseDeliveryFee = shippingInfo.fee;
  const deliveryFee = formData.delivery_speed === 'express' && shippingInfo.zone === 'inside_dhaka'
    ? baseDeliveryFee + 70 // Same-day rush inside Dhaka
    : baseDeliveryFee;

  // Active Payment Gateways from API (backed by production database)
  const { data: activeGateways = DEFAULT_GATEWAYS } = useQuery<ActivePaymentGateway[]>({
    queryKey: ['active-payment-gateways'],
    queryFn: async () => {
      const res: any = await api.get('/payment-gateways/active');
      return Array.isArray(res?.data) && res.data.length > 0 ? res.data : DEFAULT_GATEWAYS;
    },
    staleTime: 60 * 1000,
  });

  const selectedGateway = useMemo(() => {
    return activeGateways.find((g) => g.code === formData.payment_method) || activeGateways[0] || DEFAULT_GATEWAYS[0];
  }, [activeGateways, formData.payment_method]);

  // Sync if current paymentMethod is not active
  useEffect(() => {
    if (activeGateways.length > 0 && !activeGateways.some((g) => g.code === formData.payment_method)) {
      setFormData((prev) => ({ ...prev, payment_method: activeGateways[0].code }));
    }
  }, [activeGateways, formData.payment_method]);

  const gatewayCharge = useMemo(() => {
    if (!selectedGateway) return 0;
    const pct = Number(selectedGateway.charge_percentage || 0);
    const fixed = Number(selectedGateway.charge_fixed || 0);
    if (pct <= 0 && fixed <= 0) return 0;
    return Math.round((subtotal * pct / 100) + fixed);
  }, [selectedGateway, subtotal]);

  const total = Math.max(0, subtotal + deliveryFee + gatewayCharge - appliedDiscount);

  // Auto apply landing coupon code once if available
  useEffect(() => {
    if (initialCoupon && !appliedCoupon && subtotal > 0 && !isValidatingCoupon) {
      handleApplyCoupon(initialCoupon);
    }
  }, [initialCoupon, subtotal]);

  const leadSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // District & Thana Handler
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDistName = e.target.value;
    const selectedDist = BANGLADESH_DISTRICTS.find((d) => d.name === selectedDistName);
    const defaultThana = selectedDist?.thanas[0]?.name || '';

    setFormData((prev) => ({
      ...prev,
      district: selectedDistName,
      thana: defaultThana,
      delivery_speed: selectedDistName === 'Dhaka' ? prev.delivery_speed : 'standard',
    }));

    if (leadSaveTimerRef.current) clearTimeout(leadSaveTimerRef.current);
    leadSaveTimerRef.current = setTimeout(() => {
      performLeadAutoSave();
    }, 400);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (leadSaveTimerRef.current) clearTimeout(leadSaveTimerRef.current);
    leadSaveTimerRef.current = setTimeout(() => {
      performLeadAutoSave();
    }, 400);
  };

  // Helper to retrieve or initialize unique lead session ID
  const getLeadSessionId = () => {
    if (typeof window === 'undefined') return '';
    let sId = sessionStorage.getItem('bd_checkout_session_id');
    if (!sId) {
      sId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('bd_checkout_session_id', sId);
    }
    return sId;
  };

  // Dedicated lead auto-save to database: Phone is main/important, details are optional
  const performLeadAutoSave = useCallback(async (phoneOverride?: string) => {
    try {
      const currentForm = formDataRef.current;
      const phone = (phoneOverride !== undefined ? phoneOverride : (currentForm.customer_phone || '')).trim();
      const name = (currentForm.customer_name || '').trim();
      const address = (currentForm.shipping_address || '').trim();

      // Phone is main/important: Save as long as phone, name, or address has any input!
      if (!phone && !name && !address) {
        return;
      }

      const sessionId = getLeadSessionId();

      // Extract products from cart or landing selection
      const cartList = (Array.isArray(items) && items.length > 0)
        ? items
        : (useCartStore.getState().items || validCartItems || []);
      const currentItems = mode === 'cart'
        ? cartList.map((item: any) => {
            const prod = item.product || item || {};
            const variant = item.variant || null;
            const unitPrice = Number(
              variant?.price ?? prod.current_price ?? prod.base_price ?? prod.price ?? item.price ?? 0
            );
            const qty = Number(item.quantity) || 1;
            return {
              product_id: prod.id || item.product_id || 1,
              product_name:
                locale === 'bn' && prod.name_bn
                  ? prod.name_bn
                  : (prod.name_en || prod.title || prod.name || 'Product'),
              product_slug: prod.slug || `product-${prod.id || 1}`,
              image:
                prod.primary_image_url ||
                prod.image ||
                (Array.isArray(prod.images) ? prod.images[0]?.path || prod.images[0]?.url : null) ||
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85',
              color: variant?.color || item.color || null,
              size: variant?.size || item.size || null,
              variant_name: variant
                ? [variant.color ? `Color: ${variant.color}` : '', variant.size ? `Size: ${variant.size}` : '']
                    .filter(Boolean)
                    .join(' | ')
                : null,
              sku: variant?.sku || prod.sku_prefix || `SKU-${prod.id || 1}`,
              unit_price: unitPrice,
              quantity: qty,
              total: unitPrice * qty,
            };
          })
        : selectedLandingItems.map((it: any) => {
            const activeVar = it.availableVariants?.find((v: any) => v.id === it.selectedVariantId) || null;
            return {
              product_id: it.product_id,
              product_name: locale === 'bn' && it.title_bn ? it.title_bn : it.title_en,
              product_slug: it.product?.slug || 'special-offer',
              image: it.image,
              color: activeVar?.color || null,
              size: activeVar?.size || null,
              variant_name: activeVar
                ? [activeVar.color ? `Color: ${activeVar.color}` : '', activeVar.size ? `Size: ${activeVar.size}` : '']
                    .filter(Boolean)
                    .join(' | ')
                : null,
              sku: activeVar?.sku || `SKU-${it.product_id}`,
              unit_price: it.unit_price,
              quantity: it.quantity || 1,
              total: it.unit_price * (it.quantity || 1),
            };
          });

      const calculatedSubtotal = subtotal > 0
        ? subtotal
        : currentItems.reduce((sum: number, it: any) => sum + (it.total || 0), 0);
      const calculatedTotal = total > 0 ? total : (calculatedSubtotal + deliveryFee);

      setIsLeadSaving(true);

      const res: any = await api.post('/checkout/auto-save-lead', {
        session_id: sessionId,
        customer_phone: phone || null,
        customer_name: name || null,
        customer_email: currentForm.customer_email?.trim() || null,
        shipping_address: address || null,
        district: currentForm.district || null,
        thana: currentForm.thana || null,
        items: currentItems,
        cart_total: calculatedSubtotal,
        delivery_fee: deliveryFee,
        total_payable: calculatedTotal,
        source: mode === 'landing' ? (pageData?.slug || 'landing_page') : 'cart_checkout',
        source_url: typeof window !== 'undefined' ? window.location.href : null,
      });

      if (res?.success) {
        setIsLeadSaved(true);
      }
    } catch (err: any) {
      // Silent background auto-save - no interruption to buyer
    } finally {
      setIsLeadSaving(false);
    }
  }, [
    subtotal,
    deliveryFee,
    total,
    items,
    validCartItems,
    selectedLandingItems,
    mode,
    locale,
    pageData,
  ]);

  // Smart, User-Friendly Phone Normalization with instant fraud check & auto-save
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.startsWith('+880')) val = '0' + val.slice(4);
    else if (val.startsWith('+88')) val = val.slice(3);
    else if (val.startsWith('880')) val = '0' + val.slice(3);
    val = val.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);

    setFormData((prev) => ({ ...prev, customer_phone: val }));

    const isFullValidPhone = val.length === 11 && val.startsWith('01');
    if (!isFullValidPhone) {
      setIsLeadSaved(false);
    }

    if (leadSaveTimerRef.current) clearTimeout(leadSaveTimerRef.current);

    // Auto-save whenever customer types their phone number:
    // If complete 11 digits: auto-save immediately to database!
    if (isFullValidPhone) {
      performLeadAutoSave(val);
      api.post('/checkout/fraud-check', { phone: val })
        .then((res: any) => {
          if (res?.data?.risk_score !== undefined) {
            setRiskScore(res.data.risk_score);
          }
        })
        .catch(() => { });
    } else {
      setRiskScore(null);
      setIsLeadSaved(false);
    }
  };

  // Coupon application
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      toast.error(locale === 'bn' ? 'অনুগ্রহ করে কুপন কোড লিখুন' : 'Please enter a coupon code');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const res: any = await api.post('/coupons/validate', {
        code,
        subtotal,
      });

      if (res?.data) {
        const discountAmount = Number(res.data.discount || res.data.discount_amount || 0);
        setAppliedDiscount(discountAmount);
        setAppliedCoupon({
          code,
          discount: discountAmount,
          type: res.data.type,
          value: res.data.value,
        });
        setCouponInput(code);
        toast.success(
          locale === 'bn'
            ? `কুপন সফলভাবে যুক্ত হয়েছে! ৳${discountAmount} ছাড়`
            : `Coupon applied! Saved ${formatBDT(discountAmount)}`
        );
      }
    } catch (err: any) {
      const errMsg =
        err?.message ||
        err?.response?.data?.message ||
        (locale === 'bn' ? 'অবৈধ বা মেয়াদোত্তীর্ণ কুপন কোড' : 'Invalid or expired coupon code');
      toast.error(errMsg);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setAppliedDiscount(0);
    setCouponInput('');
    toast.success(locale === 'bn' ? 'কুপন বাতিল করা হয়েছে' : 'Coupon removed');
  };

  // Debounced Auto-Save Incomplete Customer Lead (Lost Customer Tracking)
  useEffect(() => {
    if (!mounted) return;

    const phone = (formData.customer_phone || '').trim();
    const name = (formData.customer_name || '').trim();
    const address = (formData.shipping_address || '').trim();

    // Trigger auto-save if phone has at least 3 digits or name/address entered
    if (phone.length < 3 && name.length < 2 && address.length < 3) {
      return;
    }

    const timer = setTimeout(() => {
      performLeadAutoSave();
    }, 400);

    return () => clearTimeout(timer);
  }, [
    mounted,
    formData.customer_phone,
    formData.customer_name,
    formData.customer_email,
    formData.shipping_address,
    formData.district,
    formData.thana,
    performLeadAutoSave
  ]);

  // Submit Order
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.customer_name.trim()) {
      toast.error(locale === 'bn' ? 'অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন' : 'Please enter your full name');
      return;
    }

    let normalizedPhone = formData.customer_phone.trim();
    if (normalizedPhone.startsWith('1') && normalizedPhone.length === 10) {
      normalizedPhone = '0' + normalizedPhone;
    }

    if (!normalizedPhone || normalizedPhone.length < 11 || !normalizedPhone.startsWith('01')) {
      toast.error(
        locale === 'bn'
          ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)'
          : 'Please enter a valid 11-digit mobile number starting with 01'
      );
      return;
    }

    if (!formData.shipping_address.trim()) {
      toast.error(locale === 'bn' ? 'অনুগ্রহ করে ডেলিভারি ঠিকানা লিখুন' : 'Please enter your delivery street address');
      return;
    }

    if (mode === 'cart' && validCartItems.length === 0) {
      toast.error(locale === 'bn' ? 'আপনার ব্যাগ খালি' : 'Your cart is empty');
      return;
    }

    if (mode === 'landing' && selectedLandingItems.length === 0) {
      toast.error(locale === 'bn' ? 'অনুগ্রহ করে কমপক্ষে একটি প্রোডাক্ট নির্বাচন করুন' : 'Please select at least one product to purchase');
      return;
    }

    setIsLoading(true);

    const fullDeliveryAddress = `${formData.shipping_address}, ${formData.thana}, ${formData.district}`;

    // Prepare Items
    const itemsPayload = mode === 'cart'
      ? validCartItems.map((it) => ({
          product_id: it.product.id,
          variant_id: it.variant?.id || undefined,
          quantity: it.quantity || 1,
          color: it.variant?.color || undefined,
          size: it.variant?.size || undefined,
          sku: it.variant?.sku || undefined,
          variant_name: it.variant ? [it.variant.color ? `Color: ${it.variant.color}` : '', it.variant.size ? `Size: ${it.variant.size}` : ''].filter(Boolean).join(' | ') : undefined,
        }))
      : selectedLandingItems.map((it) => {
          const activeVar = it.availableVariants?.find((v: any) => v.id === it.selectedVariantId) || null;
          return {
            product_id: it.product_id,
            variant_id: it.selectedVariantId || undefined,
            quantity: it.quantity || 1,
            color: activeVar?.color || undefined,
            size: activeVar?.size || undefined,
            sku: activeVar?.sku || undefined,
            variant_name: activeVar ? [activeVar.color ? `Color: ${activeVar.color}` : '', activeVar.size ? `Size: ${activeVar.size}` : ''].filter(Boolean).join(' | ') : undefined,
          };
        });

    const orderPayload = {
      order_number: `BD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      customer_name: formData.customer_name,
      customer_phone: normalizedPhone,
      customer_email: formData.customer_email || null,
      shipping_address: fullDeliveryAddress,
      district: formData.district,
      thana: formData.thana,
      shipping_zone: shippingInfo.zone,
      shipping_zone_label: locale === 'bn' ? shippingInfo.zoneLabelBn : shippingInfo.zoneLabel,
      payment_method: formData.payment_method,
      payment_status: 'pending',
      payment_transaction_id: null,
      fulfillment_status: 'pending',
      subtotal,
      delivery_fee: deliveryFee,
      discount_amount: appliedDiscount,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      total_payable: total,
      items: mode === 'cart'
        ? validCartItems.map((item) => ({
            product_name: locale === 'bn' && item.product.name_bn ? item.product.name_bn : item.product.name_en,
            product_slug: item.product.slug,
            image: item.product.primary_image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85',
            color: item.variant?.color || null,
            size: item.variant?.size || null,
            variant_name: item.variant ? [item.variant.color ? `Color: ${item.variant.color}` : '', item.variant.size ? `Size: ${item.variant.size}` : ''].filter(Boolean).join(' | ') : null,
            sku: item.variant?.sku || `SKU-${item.product.id}`,
            unit_price: Number(item.variant?.price ?? item.product.current_price ?? item.product.base_price ?? 0),
            quantity: Number(item.quantity) || 1,
            total: Number(item.variant?.price ?? item.product.current_price ?? item.product.base_price ?? 0) * (Number(item.quantity) || 1),
          }))
        : selectedLandingItems.map((it) => {
            const activeVar = it.availableVariants?.find((v: any) => v.id === it.selectedVariantId) || null;
            return {
              product_name: locale === 'bn' && it.title_bn ? it.title_bn : it.title_en,
              product_slug: it.product?.slug || 'special-offer',
              image: it.image,
              color: activeVar?.color || null,
              size: activeVar?.size || null,
              variant_name: activeVar ? [activeVar.color ? `Color: ${activeVar.color}` : '', activeVar.size ? `Size: ${activeVar.size}` : ''].filter(Boolean).join(' | ') : null,
              sku: activeVar?.sku || `SKU-${it.product_id}`,
              unit_price: it.unit_price,
              quantity: it.quantity || 1,
              total: it.unit_price * (it.quantity || 1),
            };
          }),
      courier_name: null,
      tracking_code: null,
      notes: formData.notes || null,
      created_at: new Date().toISOString(),
    };

    try {
      let finalOrderNumber = orderPayload.order_number;
      let paymentUrl: string | null = null;

      try {
        const currentSessionId = typeof window !== 'undefined' ? (sessionStorage.getItem('bd_checkout_session_id') || undefined) : undefined;
        const res: any = await api.post('/checkout/order', {
          session_id: currentSessionId,
          customer_name: formData.customer_name,
          customer_phone: normalizedPhone,
          customer_email: formData.customer_email || undefined,
          shipping_address: fullDeliveryAddress,
          district: formData.district,
          thana: formData.thana,
          shipping_zone: shippingInfo.zone,
          payment_method: formData.payment_method,
          coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
          notes: formData.notes || undefined,
          items: itemsPayload,
        });

        if (res?.data?.order_number) {
          finalOrderNumber = res.data.order_number;
        }
        if (res?.data?.payment_url) {
          paymentUrl = res.data.payment_url;
        }
      } catch (err: any) {
        // Continue with graceful fallback
      }

      const finalOrder = {
        ...orderPayload,
        order_number: finalOrderNumber,
        payment_status: 'pending',
        payment_transaction_id: null,
      };

      setLastOrder(finalOrder);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('customer_tracking_phone', normalizedPhone);
          if (formData.customer_email) {
            localStorage.setItem('customer_tracking_email', formData.customer_email);
          }
          localStorage.setItem('customer_tracking_name', formData.customer_name);
          sessionStorage.removeItem('bd_checkout_session_id');
        } catch (e) {}
      }

      if (mode === 'cart') {
        clearCart();
      }

      const isOnline = formData.payment_method !== 'cod';

      if (isOnline) {
        const targetUrl = (paymentUrl && !paymentUrl.includes('/order-confirmation/'))
          ? paymentUrl
          : (formData.payment_method === 'bkash'
              ? `/payment/bkash?paymentId=TR0011NZQqPR${Date.now()}&orderNumber=${finalOrderNumber}&amount=${total}&mode=0011&apiVersion=v1.2.0-beta`
              : `/payment/gateway?gateway=${formData.payment_method}&orderNumber=${finalOrderNumber}&amount=${total}`);

        toast.success(
          locale === 'bn'
            ? `${formData.payment_method === 'bkash' ? 'বিকাশ' : formData.payment_method === 'nagad' ? 'নগদ' : 'পেমেন্ট'} গেটওয়েতে নিয়ে যাওয়া হচ্ছে...`
            : `Redirecting to ${formData.payment_method.toUpperCase()} payment gateway...`
        );

        if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
          window.location.href = targetUrl;
        } else {
          router.push(targetUrl);
        }
        return;
      }

      toast.success(
        locale === 'bn'
          ? 'অর্ডার সফলভাবে নিশ্চিত হয়েছে!'
          : 'Order confirmed successfully! SMS sent.'
      );

      router.push(`/order-confirmation/${finalOrderNumber}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to place order. Please check details.');
    } finally {
      setIsLoading(false);
    }
  };

  const isPhoneValid =
    formData.customer_phone.length === 11 &&
    /^01[3-9]\d{8}$/.test(formData.customer_phone);

  // Empty cart guard
  if (mode === 'cart' && mounted && validCartItems.length === 0) {
    return (
      <div className="w-full min-h-[75vh] bg-slate-50/70 dark:bg-[#0b0f17] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 dark:bg-primary/10/40 text-primary dark:text-primary flex items-center justify-center mb-6 shadow-xs border border-primary/20 dark:border-primary/20/40">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">
          {locale === 'bn' ? 'আপনার শপিং ব্যাগ খালি' : 'Your Shopping Bag is Empty'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
          {locale === 'bn'
            ? 'চেকআউট করতে আপনার ব্যাগে পণ্য যোগ করুন। সেরা ডিল এবং ট্রেন্ডিং পণ্যগুলি দেখতে আমাদের ক্যাটালগ ঘুরে আসুন।'
            : 'You do not have any items in your checkout bag yet. Explore our verified products and find great deals across Bangladesh.'}
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
        >
          <span>{locale === 'bn' ? 'পণ্যসমূহ দেখুন' : 'Browse Products'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div id="checkout-section" className="w-full bg-slate-50/70 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 py-6 sm:py-8 lg:py-10 pb-32 md:pb-16 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Bar */}
        <div className="w-full bg-white dark:bg-[#111622] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 mb-6 sm:mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Step badges */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
              {mode === 'cart' ? (
                <>
                  <Link href="/cart" className="flex items-center gap-1.5 text-primary dark:text-primary shrink-0 hover:underline">
                    <span className="w-5 h-5 rounded-full bg-primary/20 dark:bg-primary/10/60 flex items-center justify-center text-[11px]">✓</span>
                    <span>Cart</span>
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-primary dark:text-primary shrink-0">
                    <span className="w-5 h-5 rounded-full bg-primary/20 dark:bg-primary/10/60 flex items-center justify-center text-[11px]">⚡</span>
                    <span>Instant Deal</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
                </>
              )}

              <div className="flex items-center gap-1.5 text-primary dark:text-primary shrink-0">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px]">1</span>
                <span>Customer & Delivery</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />

              <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px]">2</span>
                <span>Payment & Gateways</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />

              <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px]">3</span>
                <span>Confirmation</span>
              </div>
            </div>

            {/* Security Badges */}
            <div className="flex items-center gap-2.5 shrink-0 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary dark:text-primary border border-primary/20 flex items-center gap-1 text-[11px]">
                <Lock className="w-3.5 h-3.5" />
                <span>256-Bit SSL Encrypted</span>
              </span>
              <span className="hidden md:inline-flex px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>100% Genuine Guarantee</span>
              </span>
            </div>
          </div>
        </div>

        {/* Master Checkout Dual Split Grid */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

            {/* LEFT COLUMN: Customer Information, Address, Payment Gateways (7 Cols on LG) */}
            <div className="lg:col-span-7 space-y-6">

              {/* CARD 1: Customer Details */}
              <div className="w-full bg-white dark:bg-[#111622] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-xs">
                      1
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        {locale === 'bn' ? 'গ্রাহকের যোগাযোগের তথ্য' : 'Customer Contact Details'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {locale === 'bn' ? 'অর্ডার ট্র্যাকিং ও ডেলিভারি আপডেটের জন্য' : 'For live courier tracking and delivery SMS'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 dark:bg-primary/10/50 px-2.5 py-1 rounded-full border border-primary/30/50">
                    Step 1 of 3
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-primary" />
                      <span>{locale === 'bn' ? 'আপনার সম্পূর্ণ নাম *' : 'Full Name *'}</span>
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      required
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      placeholder={locale === 'bn' ? 'যেমন: মোহাম্মদ রাহিম' : 'e.g. Mohammad Rahim'}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-primary" />
                        <span>{locale === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট) *' : 'Mobile Phone Number (11 Digits) *'}</span>
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isPhoneValid && (
                          <span className="text-[10px] sm:text-[11px] font-bold text-primary dark:text-primary/40 bg-primary/10 dark:bg-primary/10/80 px-2.5 py-0.5 rounded-full border border-primary/40 flex items-center gap-1.5 shadow-2xs">
                            {isLeadSaving ? (
                              <RefreshCw className="w-3.5 h-3.5 text-primary dark:text-primary animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-primary dark:text-primary" />
                            )}
                            <span>
                              {locale === 'bn' ? 'সঠিক নম্বর • কার্ট সেভ হয়েছে' : 'Valid Number • Cart Auto-Saved'}
                            </span>
                          </span>
                        )}
                        {riskScore !== null && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            riskScore > 50
                              ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}>
                            {riskScore > 50 ? '⚠️ High Risk' : '✓ Verified Buyer'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-stretch rounded-2xl border bg-slate-50 dark:bg-slate-900/60 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary/20 ${
                      isPhoneValid
                        ? 'border-primary focus-within:border-primary ring-1 ring-primary/20'
                        : 'border-slate-200 dark:border-slate-800 focus-within:border-primary'
                    }`}>
                      <div className="flex items-center gap-1.5 px-3.5 sm:px-4 bg-slate-100/90 dark:bg-slate-800/90 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold shrink-0 select-none">
                        <span className="text-base leading-none">🇧🇩</span>
                        <span>+88</span>
                      </div>
                      <input
                        type="tel"
                        name="customer_phone"
                        required
                        value={formData.customer_phone}
                        onChange={handlePhoneChange}
                        onBlur={() => performLeadAutoSave()}
                        placeholder="017XXXXXXXX"
                        className="w-full min-w-0 px-4 py-3 bg-transparent text-sm sm:text-base font-mono font-bold text-slate-900 dark:text-white outline-hidden placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-primary" />
                      <span>{locale === 'bn' ? 'ইমেইল অ্যাড্রেস (ঐচ্ছিক)' : 'Email Address (Optional)'}</span>
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 2: Delivery Address & 64 BD Districts */}
              <div className="w-full bg-white dark:bg-[#111622] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-xs">
                      2
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        {locale === 'bn' ? 'ডেলিভারি ঠিকানা ও জেলা' : 'Delivery Address & Location'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {locale === 'bn' ? 'সারা বাংলাদেশে দ্রুত হোম ডেলিভারির জন্য' : 'Fast doorstep courier delivery across 64 districts'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 dark:bg-primary/10/50 px-2.5 py-1 rounded-full border border-primary/30/50">
                    Step 2 of 3
                  </span>
                </div>

                <div className="space-y-4">
                  {/* District & Thana Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <MapPinned className="w-4 h-4 text-primary" />
                        <span>{locale === 'bn' ? 'জেলা নির্বাচন করুন *' : 'Select District *'}</span>
                      </label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleDistrictChange}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-sm font-bold text-slate-900 dark:text-white outline-hidden cursor-pointer"
                      >
                        {BANGLADESH_DISTRICTS.map((d) => (
                          <option key={d.name} value={d.name}>
                            {d.name} ({d.name_bn}) — {d.division}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span>{locale === 'bn' ? 'থানা / উপজেলা *' : 'Thana / Upazila *'}</span>
                      </label>
                      <select
                        name="thana"
                        value={formData.thana}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-sm font-bold text-slate-900 dark:text-white outline-hidden cursor-pointer"
                      >
                        {(BANGLADESH_DISTRICTS.find(d => d.name === formData.district)?.thanas || []).map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name} ({t.name_bn})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Street Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{locale === 'bn' ? 'পূর্ণাঙ্গ ডেলিভারি ঠিকানা (বাসা/রোড নং) *' : 'Detailed Street Address *'}</span>
                    </label>
                    <textarea
                      name="shipping_address"
                      required
                      rows={2}
                      value={formData.shipping_address}
                      onChange={handleInputChange}
                      placeholder={locale === 'bn' ? 'যেমন: বাসা ৪২, রোড ৭, সেক্টর ৩, উত্তরা' : 'e.g. House 42, Road 7, Sector 3, Uttara'}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-slate-900 dark:text-white resize-none"
                    />
                  </div>

                  {/* Delivery Speed Options */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-primary" />
                      <span>{locale === 'bn' ? 'ডেলিভারি মেথড' : 'Delivery Speed & Option'}</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        formData.delivery_speed === 'standard'
                          ? 'border-primary bg-primary/10/50 dark:bg-primary/10/20 ring-1 ring-primary/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="delivery_speed"
                            value="standard"
                            checked={formData.delivery_speed === 'standard'}
                            onChange={handleInputChange}
                            className="text-primary accent-primary"
                          />
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {locale === 'bn' ? 'স্ট্যান্ডার্ড ডেলিভারি' : 'Standard Delivery'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formData.district === 'Dhaka' 
                                ? (locale === 'bn' ? '২৪-৪৮ ঘণ্টা' : '24-48 Hours') 
                                : (locale === 'bn' ? '২-৩ দিন' : '2-3 Days')}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-black text-primary dark:text-primary">
                          {formatBDT(baseDeliveryFee)}
                        </span>
                      </label>

                      {formData.district === 'Dhaka' && (
                        <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          formData.delivery_speed === 'express'
                            ? 'border-primary bg-primary/10/50 dark:bg-primary/10/20 ring-1 ring-primary/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="delivery_speed"
                              value="express"
                              checked={formData.delivery_speed === 'express'}
                              onChange={handleInputChange}
                              className="text-primary accent-primary"
                            />
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                <span>{locale === 'bn' ? 'এক্সপ্রেস রাশ' : 'Express Rush'}</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase">Fast</span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {locale === 'bn' ? 'একই দিনে সুপারফাস্ট' : 'Same-Day Delivery'}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-black text-primary dark:text-primary">
                            {formatBDT(baseDeliveryFee + 70)}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: Payment Method Selector */}
              <div className="w-full bg-white dark:bg-[#111622] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-xs">
                      3
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        {locale === 'bn' ? 'পেমেন্ট মেথড নির্বাচন করুন' : 'Select Payment Method'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {locale === 'bn' ? 'ক্যাশ অন ডেলিভারি বা অফিসিয়াল অনলাইন পেমেন্ট' : '100% Secure official automated verification'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 dark:bg-primary/10/50 px-2.5 py-1 rounded-full border border-primary/30/50">
                    Step 3 of 3
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {activeGateways.map((gw) => {
                    const isSelected = formData.payment_method === gw.code;
                    const style = getGatewayStyle(gw.code, gw.type, isSelected);
                    return (
                      <div
                        key={gw.code}
                        onClick={() => setFormData((p) => ({ ...p, payment_method: gw.code }))}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${style.card}`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="payment_method"
                            value={gw.code}
                            checked={isSelected}
                            onChange={() => {}}
                            className={`mt-1 ${style.radio}`}
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {locale === 'bn' && gw.title_bn ? gw.title_bn : gw.title}
                              </span>
                              {gw.badge && (
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${style.badge}`}>
                                  {locale === 'bn' && gw.badge_bn ? gw.badge_bn : gw.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {locale === 'bn' && gw.description_bn ? gw.description_bn : gw.description}
                            </p>
                            {((gw.charge_percentage && gw.charge_percentage > 0) || (gw.charge_fixed && gw.charge_fixed > 0)) && (
                              <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 pt-0.5">
                                + Fee: {gw.charge_percentage ? `${gw.charge_percentage}%` : ''} {gw.charge_fixed ? `+ ৳${gw.charge_fixed}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Gateway Specific Instructions */}
                {selectedGateway && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                        {locale === 'bn' ? 'নিরাপদ পেমেন্ট গ্যারান্টি:' : 'Secure Checkout Notice:'}
                      </span>
                      {selectedGateway.instructions || 'Order will be securely processed and tracked in real-time.'}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Products / Package Chooser, Order Summary, Coupon, Bill (5 Cols on LG) */}
            <div className="lg:col-span-5 space-y-6">

              {/* CARD 4: Order Summary & Item Chooser */}
              <div className="w-full bg-white dark:bg-[#111622] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5 sticky top-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {locale === 'bn' ? 'অর্ডার সামারি' : 'Order Summary'}
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {mode === 'cart' ? `${validCartItems.length} Item(s)` : 'Direct Special Offer'}
                  </span>
                </div>

                {/* LANDING MODE: Multi-Product Bundle & Variation Selector */}
                {mode === 'landing' && (
                  <div className="space-y-4">
                    {/* Header Controls for Multi-Product Bundle */}
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {landingSelections.length > 1
                            ? (locale === 'bn' ? 'অফারের অন্তর্ভুক্ত প্রোডাক্টসমূহ (সবগুলো বা পছন্দমতো নিন)' : 'Bundle Offer Products (Purchase All or Select Items)')
                            : (locale === 'bn' ? 'অফার প্রোডাক্ট ও ভেরিয়েশন' : 'Special Offer Product & Variation')}
                        </span>
                      </div>
                      {landingSelections.length > 1 && (
                        <div className="flex items-center gap-2 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => selectAllLandingItems(true)}
                            className="text-primary dark:text-primary hover:underline cursor-pointer"
                          >
                            {locale === 'bn' ? 'সবগুলো নিন' : 'Select All'}
                          </button>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <button
                            type="button"
                            onClick={() => selectAllLandingItems(false)}
                            className="text-slate-500 hover:underline cursor-pointer"
                          >
                            {locale === 'bn' ? 'ক্লিয়ার' : 'Clear'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Products List with Checkbox, Variants & Quantity per product */}
                    <div className="space-y-3">
                      {landingSelections.map((item, idx) => {
                        const activeVar = item.availableVariants.find((v: any) => v.id === item.selectedVariantId) || item.availableVariants[0] || null;

                        return (
                          <div
                            key={item.id || idx}
                            className={`p-4 rounded-2xl border transition-all space-y-3 ${
                              item.selected
                                ? 'border-primary/70 bg-primary/10/30 dark:bg-primary/10/20 ring-1 ring-primary/30 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-70'
                            }`}
                          >
                            {/* Product Header Row */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none pt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={item.selected}
                                    onChange={() => toggleLandingItemSelection(idx)}
                                    className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                                  />
                                </label>

                                <img
                                  src={item.image}
                                  alt={item.title_en}
                                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                                      {locale === 'bn' && item.title_bn ? item.title_bn : item.title_en}
                                    </h3>
                                    {item.badge_text && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                                        {item.badge_text}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-black text-primary dark:text-primary">
                                      {formatBDT(item.unit_price)}
                                    </span>
                                    {item.compare_price && item.compare_price > item.unit_price && (
                                      <span className="line-through text-xs text-slate-400">
                                        {formatBDT(item.compare_price)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Item Quantity Controller */}
                              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={!item.selected}
                                  onClick={() => updateLandingItemQuantity(idx, -1)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 text-center text-xs font-black text-slate-900 dark:text-white">
                                  {item.quantity || 1}
                                </span>
                                <button
                                  type="button"
                                  disabled={!item.selected}
                                  onClick={() => updateLandingItemQuantity(idx, 1)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Product-Specific Variations Selector */}
                            {item.availableVariants.length > 1 && item.selected && (
                              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                  <span>{locale === 'bn' ? 'ভেরিয়েন্ট সিলেক্ট করুন:' : 'Select Variant:'}</span>
                                  {activeVar?.sku && (
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      SKU: {activeVar.sku}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                  {item.availableVariants.map((v: any) => {
                                    const isVarSelected = item.selectedVariantId === v.id;
                                    const label = [v.color, v.size].filter(Boolean).join(' - ') || v.name || v.sku || `Variant ${v.id}`;
                                    return (
                                      <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => updateLandingItemVariant(idx, v.id)}
                                        className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                          isVarSelected
                                            ? 'border-primary bg-primary text-white shadow-xs scale-105'
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                        }`}
                                      >
                                        <span>{label}</span>
                                        {v.price && Number(v.price) !== item.unit_price && (
                                          <span className="ml-1 opacity-80 text-[10px]">৳${v.price}</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bundle Purchase Incentive Banner */}
                    {landingSelections.length > 1 && (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-amber-800 dark:text-amber-300">
                            {locale === 'bn'
                              ? `নির্বাচিত: ${selectedLandingItems.length}টি পণ্য (মোট ${selectedLandingItems.reduce((acc, it) => acc + (it.quantity || 1), 0)}টি আইটেম)`
                              : `Selected: ${selectedLandingItems.length} Products (${selectedLandingItems.reduce((acc, it) => acc + (it.quantity || 1), 0)} items total)`}
                          </span>
                        </div>
                        {selectedLandingItems.length === landingSelections.length && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/20 text-primary dark:text-primary/40">
                            Full Combo Deal
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* CART MODE: Cart Items List with Variant Selection & Quantity Controls */}
                {mode === 'cart' && (
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                    {validCartItems.map((item, idx) => {
                      const price = Number(item.variant?.price ?? item.product?.current_price ?? item.product?.base_price ?? 0);
                      const qty = Number(item.quantity) || 1;
                      const productVariants: any[] = Array.isArray((item.product as any)?.variants) ? (item.product as any).variants : [];
                      const hasMultipleVariants = productVariants.length > 1;

                      return (
                        <div
                          key={`${item.product.id}-${item.variant?.id || 'base'}-${idx}`}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3"
                        >
                          {/* Product Header Row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <img
                                src={item.product.primary_image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85'}
                                alt={item.product.name_en || ''}
                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                                  {locale === 'bn' && item.product.name_bn ? item.product.name_bn : item.product.name_en}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm font-black text-primary dark:text-primary">
                                    ৳{price}
                                  </span>
                                  {item.product.compare_price && Number(item.product.compare_price) > price && (
                                    <span className="line-through text-xs text-slate-400">
                                      ৳{item.product.compare_price}
                                    </span>
                                  )}
                                </div>
                                {(item.variant?.color || item.variant?.size) && (
                                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                    {item.variant?.color && <span>Color: {item.variant.color}</span>}
                                    {item.variant?.size && <span>• Size: {item.variant.size}</span>}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quantity Controller & Remove */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (qty <= 1) {
                                      removeItem(item.cartItemId || item.variant?.id || item.product.id);
                                    } else {
                                      updateQuantity(item.cartItemId || item.variant?.id || item.product.id, qty - 1);
                                    }
                                  }}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                  {qty <= 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                                </button>
                                <span className="w-6 text-center text-xs font-black text-slate-900 dark:text-white">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.cartItemId || item.variant?.id || item.product.id, qty + 1)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                ৳{price * qty}
                              </span>
                            </div>
                          </div>

                          {/* Variant Selector (only when product has multiple variants) */}
                          {hasMultipleVariants && (
                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span>{locale === 'bn' ? 'ভেরিয়েন্ট সিলেক্ট করুন:' : 'Select Variant:'}</span>
                                {item.variant?.sku && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    SKU: {item.variant.sku}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {productVariants.map((v: any) => {
                                  const isVarSelected = item.variant?.id === v.id;
                                  const label = [v.color, v.size].filter(Boolean).join(' - ') || v.name || v.sku || `Variant ${v.id}`;
                                  return (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => updateVariant(item.cartItemId || item.variant?.id || item.product.id, v)}
                                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                        isVarSelected
                                          ? 'border-primary bg-primary text-white shadow-xs scale-105'
                                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                      }`}
                                    >
                                      <span>{label}</span>
                                      {v.price && Number(v.price) !== price && (
                                        <span className="ml-1 opacity-80 text-[10px]">৳{v.price}</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* PROMO COUPON BOX */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    <span>{locale === 'bn' ? 'প্রোমো কুপন কোড' : 'Have a Promo Coupon?'}</span>
                  </label>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/10 dark:bg-primary/10/40 border border-primary/30 dark:border-primary/80/40">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary dark:text-primary" />
                        <div>
                          <span className="font-mono font-black text-xs text-primary dark:text-primary/40">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-[11px] font-bold text-primary block">
                            - ৳{appliedDiscount} {locale === 'bn' ? 'ছাড় যুক্ত হয়েছে' : 'Applied'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="p-1.5 rounded-xl hover:bg-primary/20 dark:hover:bg-primary/20/60 text-primary dark:text-primary/40 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder={locale === 'bn' ? 'কুপন কোড লিখুন' : 'Enter Coupon Code'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        disabled={isValidatingCoupon || !couponInput.trim()}
                        onClick={() => handleApplyCoupon()}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold disabled:opacity-50 hover:bg-slate-800 transition-all shrink-0"
                      >
                        {isValidatingCoupon ? '...' : (locale === 'bn' ? 'প্রয়োগ' : 'Apply')}
                      </button>
                    </div>
                  )}
                </div>

                {/* DETAILED FINANCIAL BREAKDOWN */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{locale === 'bn' ? 'সাবটোটাল' : 'Subtotal'}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {formatBDT(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span>{locale === 'bn' ? 'ডেলিভারি চার্জ' : 'Delivery Fee'}</span>
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {formatBDT(deliveryFee)}
                    </span>
                  </div>

                  {gatewayCharge > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>{selectedGateway.title} Fee</span>
                      <span className="font-bold">+{formatBDT(gatewayCharge)}</span>
                    </div>
                  )}

                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-primary dark:text-primary font-bold">
                      <span>{locale === 'bn' ? 'কুপন ডিসকাউন্ট' : 'Coupon Discount'}</span>
                      <span>-{formatBDT(appliedDiscount)}</span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {locale === 'bn' ? 'সর্বমোট প্রদেয় বিল' : 'Total Payable'}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-primary dark:text-primary">
                      {formatBDT(total)}
                    </span>
                  </div>
                </div>

                {/* Customer Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {locale === 'bn' ? 'বিশেষ নির্দেশনা (ঐচ্ছিক)' : 'Delivery Notes / Instructions (Optional)'}
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder={locale === 'bn' ? 'যেমন: কল করে ডেলিভারি দিন' : 'e.g. Please call before arrival'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-900 dark:text-white outline-hidden"
                  />
                </div>

                {/* Desktop Confirm Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm sm:text-base shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isLoading
                      ? (locale === 'bn' ? 'প্রসেসিং হচ্ছে...' : 'Processing Order...')
                      : (locale === 'bn' 
                          ? `অর্ডার কনফার্ম করুন — ${formatBDT(total)}`
                          : `Confirm Order — ${formatBDT(total)}`)}
                  </span>
                </button>

                {/* Trust Reassurance Badges */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>১০০% অথেনটিক পণ্য</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    <span>দ্রুত ক্যাশ অন ডেলিভারি</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>দেখে চেক করে পেমেন্ট</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>নিরাপদ চেকআউট</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Sticky Mobile Confirmation Bar */}
          <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 dark:bg-[#111622]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 md:hidden flex items-center justify-between gap-3 shadow-lg">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Payable</div>
              <div className="text-lg font-black text-primary dark:text-primary leading-none">
                {formatBDT(total)}
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-primary/30 active:scale-95 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Processing...' : (locale === 'bn' ? 'অর্ডার কনফার্ম করুন' : 'Confirm Order')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
