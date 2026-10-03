'use client';

import { useState, useMemo, useEffect } from 'react';
import { formatBDT } from '@/utils/currency';
import { 
  CheckCircle2, Truck, ShieldCheck, Phone,
  Sparkles, ArrowRight, Flame, Award,
  Layers, Eye, PackageCheck, Check
} from 'lucide-react';
import { UnifiedCheckout } from '@/components/checkout/UnifiedCheckout';

interface SingleProductFunnelProps {
  pageData: any;
}

export function SingleProductFunnel({ pageData }: SingleProductFunnelProps) {
  const rawPageProducts: any[] = pageData.page_products || [];
  const isMultiProduct = rawPageProducts.length > 1;

  // Normalized list of products in this funnel
  const funnelProducts = useMemo(() => {
    if (rawPageProducts.length > 0) {
      return rawPageProducts.map((pp: any, idx: number) => {
        const prod = pp.product || {};
        const vars = (Array.isArray(pp.variations) && pp.variations.length > 0)
          ? pp.variations
          : (Array.isArray(prod.variants) ? prod.variants : []);
        const imgs = Array.isArray(prod.images) && prod.images.length > 0
          ? prod.images
          : (pp.image ? [{ path: pp.image }] : (prod.primary_image_url ? [{ path: prod.primary_image_url }] : []));
        
        let unitPrice = Number(pp.custom_price || 0);
        if (unitPrice <= 0 && vars.length > 0 && vars[0].price) {
          unitPrice = Number(vars[0].price);
        }
        if (unitPrice <= 0) {
          unitPrice = Number(prod.current_price || prod.base_price || 0);
        }

        const rawCompare = Number(pp.compare_price || prod.compare_price || prod.old_price || 0);
        const comparePrice = rawCompare > unitPrice ? rawCompare : (unitPrice > 0 ? Math.round(unitPrice * 1.35) : 0);

        return {
          id: pp.id || `pp-${idx}`,
          product_id: pp.product_id || prod.id,
          is_default: Boolean(pp.is_default),
          title_en: pp.title_en || prod.name_en || 'Product',
          title_bn: pp.title_bn || prod.name_bn || '',
          short_description_en: prod.short_description_en || '',
          short_description_bn: prod.short_description_bn || '',
          description_en: prod.description_en || '',
          description_bn: prod.description_bn || '',
          image: pp.image || prod.primary_image_url || imgs[0]?.path || 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85',
          images: imgs,
          variants: vars,
          unitPrice,
          comparePrice,
          badge_text: pp.badge_text || '',
          product: prod,
        };
      });
    }

    // Fallback to single product if no page_products array
    if (pageData.product) {
      const prod = pageData.product;
      const vars = prod.variants || [];
      const imgs = Array.isArray(prod.images) && prod.images.length > 0
        ? prod.images
        : (prod.primary_image_url ? [{ path: prod.primary_image_url }] : []);
      const unitPrice = Number(pageData.custom_price || vars[0]?.price || prod.current_price || prod.base_price || 0);
      const comparePrice = Number(prod.compare_price || (unitPrice * 1.35));
      return [{
        id: 1,
        product_id: prod.id,
        is_default: true,
        title_en: prod.name_en || 'Product',
        title_bn: prod.name_bn || '',
        short_description_en: prod.short_description_en || '',
        short_description_bn: prod.short_description_bn || '',
        description_en: prod.description_en || '',
        description_bn: prod.description_bn || '',
        image: prod.primary_image_url || imgs[0]?.path || 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85',
        images: imgs,
        variants: vars,
        unitPrice,
        comparePrice,
        badge_text: pageData.badge_text || '',
        product: prod,
      }];
    }

    return [];
  }, [rawPageProducts, pageData]);

  // Determine default active product (one with is_default: true, or first product)
  const defaultProductIdx = useMemo(() => {
    const idx = funnelProducts.findIndex((p) => p.is_default);
    return idx >= 0 ? idx : 0;
  }, [funnelProducts]);

  const [activeProductIdx, setActiveProductIdx] = useState<number>(0);

  useEffect(() => {
    setActiveProductIdx(defaultProductIdx);
  }, [defaultProductIdx]);

  const currentProduct = funnelProducts[activeProductIdx] || funnelProducts[0] || null;

  // Selected Variant & Quantity for the current active product preview
  const currentVariants = currentProduct?.variants || [];
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Active Image for Gallery
  const currentImages = currentProduct?.images || [];
  const [activeImage, setActiveImage] = useState<string>('');

  // Update gallery & variant when active product changes
  useEffect(() => {
    if (currentProduct) {
      setActiveImage(currentProduct.image);
      setSelectedVariantId(currentVariants.length > 0 ? currentVariants[0].id : null);
    }
  }, [currentProduct]);

  // Active Variant
  const activeVariant = useMemo(() => {
    return currentVariants.find((v: any) => v.id === selectedVariantId) || currentVariants[0] || null;
  }, [currentVariants, selectedVariantId]);

  // Price calculations for Active Product Display
  const unitPrice = Number(
    activeVariant?.price || currentProduct?.unitPrice || 0
  );
  const comparePrice = Number(currentProduct?.comparePrice || (unitPrice * 1.35));

  // Bundle Total Price across all funnel products
  const bundleTotalPrice = useMemo(() => {
    return funnelProducts.reduce((sum, p) => sum + p.unitPrice, 0);
  }, [funnelProducts]);

  const bundleComparePrice = useMemo(() => {
    return funnelProducts.reduce((sum, p) => sum + p.comparePrice, 0);
  }, [funnelProducts]);

  // Feature list
  const featureList: string[] = Array.isArray(pageData.features) && pageData.features.length > 0
    ? pageData.features
    : [
        '১০০% প্রিমিয়াম ও অরিজিনাল কোয়ালিটি নিশ্চিত',
        'সরাসরি হোম ডেলিভারি — পণ্য হাতে পেয়ে চেক করে মূল্য দিন',
        '৭ দিনের সহজ রিপ্লেসমেন্ট এবং ১০০% এক্সচেঞ্জ গ্যারান্টি',
        'দ্রুত কাস্টমার সাপোর্ট এবং সার্বক্ষণিক ট্র্যাকিং সুবিধা'
      ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Floating Urgency Header */}
      <div className="bg-gradient-to-r from-red-600 via-primary to-primary text-white py-2.5 px-4 text-center text-xs sm:text-sm font-bold shadow-md sticky top-0 z-40 flex items-center justify-center gap-2">
        <Flame className="w-4 h-4 animate-bounce text-amber-300" />
        <span>{pageData.badge_text || '🔥 মেগা ধামাকা অফার - সীমিত সময়ের জন্য ক্যাশ অন ডেলিভারিতে অর্ডার করুন!'}</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 sm:pt-10 space-y-10">
        {/* Main Hero Showcase */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full clay-chip-active text-xs font-black text-primary">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              {isMultiProduct
                ? (pageData.badge_text || 'স্পেশাল কম্বো বান্ডেল অফার')
                : (pageData.badge_text || 'স্পেশাল অফার')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight">
            {pageData.offer_headline_bn || pageData.offer_headline_en || pageData.title_bn || pageData.title_en}
          </h1>

          <p className="text-xs sm:text-base text-muted-foreground font-medium">
            {pageData.short_description_bn || pageData.short_description_en || currentProduct?.short_description_bn || currentProduct?.short_description_en || 'পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ ক্যাশ অন ডেলিভারিতে মূল্য পরিশোধ করুন। সারা বাংলাদেশে দ্রুত হোম ডেলিভারি!'}
          </p>
        </div>

        {/* MULTI-PRODUCT INTERACTIVE DETAILS SWITCHER BAR */}
        {isMultiProduct && (
          <div className="clay-card rounded-3xl p-4 sm:p-6 space-y-3 bg-gradient-to-r from-primary/5 via-amber-500/5 to-primary/5 border border-primary/20 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span className="text-xs sm:text-sm font-black text-foreground">
                  প্যাকেজের প্রোডাক্টগুলো দেখুন (যেকোনোটিতে ক্লিক করে ছবি ও বিবরণ দেখুন):
                </span>
              </div>
              <span className="text-[11px] font-bold text-muted-foreground px-2.5 py-1 rounded-full clay-inset">
                মোট {funnelProducts.length}টি অন্তর্ভুক্ত পণ্য
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {funnelProducts.map((p, idx) => {
                const isCurrent = idx === activeProductIdx;
                return (
                  <button
                    key={p.id || idx}
                    type="button"
                    onClick={() => setActiveProductIdx(idx)}
                    className={`p-3 rounded-2xl text-left transition-all relative flex flex-col gap-2 cursor-pointer ${
                      isCurrent
                        ? 'clay-chip-active ring-2 ring-primary shadow-md scale-[1.02]'
                        : 'clay-inset opacity-80 hover:opacity-100 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-background border border-border/50">
                      <img src={p.image} alt={p.title_en} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-foreground truncate">
                        {p.title_bn || p.title_en}
                      </div>
                      <div className="text-xs font-extrabold text-primary mt-0.5">
                        {formatBDT(p.unitPrice)}
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-[9px] font-black text-primary-foreground shadow-xs flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5" /> বিস্তারিত দেখছি
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <span>ক্লিক করুন</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Visuals & Specs Grid (Displays current product details) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Gallery */}
          <div className="space-y-4">
            <div className="clay-card rounded-3xl p-3 overflow-hidden aspect-square flex items-center justify-center relative group">
              <img 
                src={activeImage || currentProduct?.image} 
                alt={currentProduct?.title_en || 'Product'} 
                className="w-full h-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-105"
              />
              {comparePrice > unitPrice && (
                <div className="absolute top-6 left-6 bg-red-600 text-white font-black text-xs sm:text-sm px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  <span>{Math.round(((comparePrice - unitPrice) / comparePrice) * 100)}% ছাড়</span>
                </div>
              )}
            </div>

            {/* Thumbnail Row */}
            {currentImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {currentImages.map((img: any, idx: number) => {
                  const url = img.path || img.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(url)}
                      className={`w-16 h-16 rounded-2xl clay-inset p-1 overflow-hidden flex-shrink-0 transition-all cursor-pointer ${
                        activeImage === url ? 'ring-2 ring-primary scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-contain rounded-xl" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Specifications & Direct Purchase */}
          <div className="space-y-6">
            <div className="clay-card rounded-3xl p-6 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-foreground">
                    {currentProduct?.title_bn || currentProduct?.title_en}
                  </h2>
                  {currentProduct?.badge_text && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-black">
                      {currentProduct.badge_text}
                    </span>
                  )}
                </div>
                {currentProduct?.title_bn && currentProduct?.title_en && (
                  <p className="text-xs font-bold text-muted-foreground">{currentProduct.title_en}</p>
                )}
              </div>

              {/* Price Banner */}
              <div className="flex items-baseline gap-3 p-4 neu-inset rounded-2xl">
                <span className="text-3xl font-black text-primary">{formatBDT(unitPrice)}</span>
                {comparePrice > unitPrice && (
                  <span className="text-base text-muted-foreground line-through font-bold">
                    {formatBDT(comparePrice)}
                  </span>
                )}
                {pageData.free_delivery && (
                  <span className="ml-auto px-2.5 py-1 rounded-lg bg-primary/20 text-primary dark:bg-primary/10/60 dark:text-primary text-xs font-black">
                    ফ্রি ডেলিভারি
                  </span>
                )}
              </div>

              {/* Variant Picker for preview */}
              {currentVariants.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">ভেরিয়েন্ট নির্বাচন করুন:</label>
                  <div className="flex flex-wrap gap-2">
                    {currentVariants.map((v: any) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedVariantId === v.id
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'neu-btn text-foreground'
                        }`}
                      >
                        {v.color || 'Standard'} {v.size ? `(${v.size})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center justify-between p-3 neu-inset rounded-2xl">
                <span className="text-xs font-bold text-muted-foreground">পরিমাণ (Quantity):</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg neu-btn flex items-center justify-center font-bold text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-black text-sm text-foreground">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg neu-btn flex items-center justify-center font-bold text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CTA Quick Scroll Button */}
              <a
                href="#direct-order-form"
                className="w-full neu-btn-primary py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] transition-transform cursor-pointer"
              >
                <span>
                  {isMultiProduct
                    ? 'সবগুলো প্রোডাক্ট একসাথে অর্ডার করুন (ক্যাশ অন ডেলিভারি)'
                    : (pageData.cta_button_text_bn || 'এখনই অর্ডার করুন (ক্যাশ অন ডেলিভারি)')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature Points */}
            <div className="clay-card rounded-3xl p-6 space-y-3">
              <h3 className="font-black text-base text-foreground flex items-center gap-2 border-b pb-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>কেন আমাদের থেকে কিনবেন?</span>
              </h3>
              <div className="space-y-2.5">
                {featureList.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Assurance Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-muted-foreground">
              <div className="clay-inset p-3 rounded-2xl space-y-1">
                <Truck className="w-4 h-4 text-primary mx-auto" />
                <div>ক্যাশ অন ডেলিভারি</div>
              </div>
              <div className="clay-inset p-3 rounded-2xl space-y-1">
                <ShieldCheck className="w-4 h-4 text-primary mx-auto" />
                <div>৭ দিনের রিটার্ন</div>
              </div>
              <div className="clay-inset p-3 rounded-2xl space-y-1">
                <Phone className="w-4 h-4 text-amber-500 mx-auto" />
                <div>২৪/৭ হেল্পলাইন</div>
              </div>
            </div>
          </div>
        </div>

        {/* MULTI-PRODUCT COMBO VALUE SECTION */}
        {isMultiProduct && (
          <div className="clay-card rounded-3xl p-6 bg-gradient-to-br from-amber-500/10 via-primary/10 to-primary/10 border-2 border-dashed border-amber-500/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black">
                  <PackageCheck className="w-4 h-4" />
                  <span>ফুল কম্বো ডিল — সেরা মূল্যে সব একসাথে!</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-foreground mt-1.5">
                  এই প্যাকেজে সম্পূর্ণ {funnelProducts.length}টি প্রিমিয়াম পণ্য অন্তর্ভুক্ত রয়েছে
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  ১-ক্লিকেই সবগুলো একসাথে কিনুন অথবা আপনার পছন্দমতো যেকোনো আইটেম সিলেক্ট করুন
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-black text-primary dark:text-primary">
                  {formatBDT(bundleTotalPrice)}
                </div>
                {bundleComparePrice > bundleTotalPrice && (
                  <div className="text-xs font-bold text-muted-foreground line-through">
                    পূর্বমূল্য: {formatBDT(bundleComparePrice)}
                  </div>
                )}
              </div>
            </div>

            {/* Item-by-item breakdown pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {funnelProducts.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl clay-inset text-xs font-bold bg-background/80">
                    <img src={p.image} alt="" className="w-6 h-6 rounded-lg object-contain border" />
                    <span>{p.title_bn || p.title_en}</span>
                    <span className="text-primary font-black">{formatBDT(p.unitPrice)}</span>
                  </div>
                  {idx < funnelProducts.length - 1 && (
                    <span className="text-muted-foreground font-black text-sm">+</span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary dark:text-primary">
                <Check className="w-4 h-4" />
                <span>সব পণ্য একসাথে নিলে অতিরিক্ত ছাড় এবং দ্রুত হোম ডেলিভারি</span>
              </div>
              <a
                href="#direct-order-form"
                className="px-5 py-2.5 rounded-xl neu-btn-primary text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>নিচে অর্ডার করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Unified Direct Checkout Experience (Identical to /checkout with Multi-Product & Gateways) */}
        <div id="direct-order-form" className="scroll-mt-20 pt-6">
          <UnifiedCheckout mode="landing" pageData={pageData} />
        </div>
      </div>
    </div>
  );
}
