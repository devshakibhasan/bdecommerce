'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Minus, Plus, ShieldCheck, Truck, RotateCcw, Zap, ArrowRight, Ruler, X, Info, Star, MessageSquare } from 'lucide-react';
import { Product, ProductVariant } from '@/types';
import { useLocaleStore, useCartStore, useUIStore } from '@/lib/store';
import { formatBDT } from '@/utils/currency';
import { formatImageUrl } from '@/utils/image';
import { t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { api } from '@/lib/api';

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { locale } = useLocaleStore();
  const { addItem } = useCartStore();
  const { toggleCart } = useUIStore();
  const router = useRouter();

  const primaryImg = formatImageUrl(
    product.primary_image_url || (product as any)?.image || product.images?.[0]?.path || (product.images?.[0] as any)?.url,
    (product as any)?.updated_at
  );
  const [selectedImage, setSelectedImage] = useState(primaryImg);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (product?.id) {
      api.get(`/products/${product.id}/related`)
        .then((res: any) => {
          const list = res?.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setRelatedProducts(list);
          }
        })
        .catch(() => {});
    }
  }, [product?.id]);

  const initialVariant: ProductVariant = (product.variants && product.variants.length > 0 ? product.variants[0] : {
    id: (product.id || 1) * 1000 + 1,
    sku: product.sku_prefix ? `${product.sku_prefix}-STD` : `SKU-${product.id || 1}`,
    barcode: null,
    color: null,
    size: null,
    price: Number(product.current_price ?? product.base_price ?? 0),
    cost_price: null,
    stock: 100,
    available_stock: 100,
    is_active: true,
    is_low_stock: false,
    weight_grams: null,
  }) as ProductVariant;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(initialVariant);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'care_guide' | 'reviews' | 'shipping' | 'warranty' | 'size_guide'>('description');
  const [reviewsList, setReviewsList] = useState<any[]>((product as any).reviews || []);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const avgRating = reviewsList.length > 0
    ? (reviewsList.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviewsList.length).toFixed(1)
    : Number((product as any).average_rating || 5.0).toFixed(1);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      toast.error('Please enter your name and review comment');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res: any = await api.post(`/products/${product.id}/reviews`, {
        customer_name: reviewName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      const newReview = res?.data || {
        id: Date.now(),
        customer_name: reviewName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
        created_at: 'Just now',
      };
      setReviewsList(prev => [newReview, ...prev]);
      setReviewName('');
      setReviewComment('');
      setReviewRating(5);
      toast.success('Thank you! Your review has been submitted.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const material = (product as any).material;
  const fit = (product as any).fit;
  const disclaimer = (product as any).disclaimer;
  const productSku = product.sku_prefix || selectedVariant?.sku || (product as any).sku;

  const careList = useMemo(() => {
    const raw = (product as any).care_instructions;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return raw.split('\n').map((s: string) => s.replace(/^[✓\-\*\•]\s*/, '').trim()).filter(Boolean);
    }
    return [];
  }, [product]);

  const name = locale === 'bn' && product.name_bn ? product.name_bn : product.name_en;
  const description = locale === 'bn' && product.description_bn ? product.description_bn : (product.description_en || product.short_description_en || 'High-quality authentic product with official manufacturer warranty and fast delivery across Bangladesh.');
  const shortDescription = locale === 'bn' && product.short_description_bn ? product.short_description_bn : product.short_description_en;
  
  const price = Number(selectedVariant?.price || product.current_price || product.base_price || 0);
  const comparePrice = product.compare_price ? Number(product.compare_price) : null;
  
  const discountPercent = comparePrice && comparePrice > price
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const images = (product.images && product.images.length > 0)
    ? product.images.map(img => formatImageUrl(img.path || (img as any).url, (product as any)?.updated_at))
    : [primaryImg];

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    toast.success(`${name} added to cart!`);
    toggleCart();
  };

  const handleBuyNow = () => {
    addItem(product, selectedVariant, quantity);
    router.push('/checkout');
  };

  return (
    <div className="flex flex-col gap-10">
      
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
        <span>/</span>
        <span className="text-foreground font-semibold truncate">{name}</span>
      </div>

      {/* Main Grid: Gallery & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Neumorphic Image Gallery */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="neu-flat rounded-3xl p-6 aspect-square flex items-center justify-center relative overflow-hidden">
            {discountPercent > 0 && (
              <span className="absolute top-6 left-6 neu-chip bg-destructive text-destructive-foreground text-xs font-black px-3 py-1 rounded-xl shadow">
                -{discountPercent}% OFF
              </span>
            )}

            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={selectedImage}
                alt={name}
                decoding="async"
                className="w-full h-full object-contain drop-shadow-xl"
              />
            </AnimatePresence>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-2xl p-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                    selectedImage === img
                      ? 'neu-chip-active border-2 border-primary'
                      : 'neu-raised-sm hover:neu-flat'
                  }`}
                >
                  <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Meta & Purchase Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div className="neu-raised rounded-3xl p-6 md:p-8 space-y-6">
            
            {/* Title & Brand */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                  <span>{avgRating} ({reviewsList.length} Reviews)</span>
                </button>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-inset text-[11px] font-bold text-primary">
                  <span>✨ Authentic Quality</span>
                </div>
                {material && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-black">
                    <span>🧵 {material}</span>
                  </div>
                )}
                {fit && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-black">
                    <span>👔 {fit}</span>
                  </div>
                )}
                {productSku && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full neu-inset text-[10px] font-mono font-bold text-muted-foreground">
                    <span>Code: {productSku}</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
                {name}
              </h1>
              {shortDescription && (
                <p className="text-xs md:text-sm text-muted-foreground mt-2 leading-relaxed">
                  {shortDescription}
                </p>
              )}
            </div>

            {/* Price Box */}
            <div className="neu-inset rounded-2xl p-4 flex items-baseline gap-3">
              <span className="text-3xl font-black text-primary">
                {formatBDT(price, locale)}
              </span>
              {comparePrice && comparePrice > price && (
                <span className="text-base text-muted-foreground line-through font-semibold">
                  {formatBDT(comparePrice, locale)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="ml-auto text-xs font-bold text-green-600 dark:text-green-400">
                  Save {formatBDT(comparePrice! - price, locale)} ({discountPercent}%)
                </span>
              )}
            </div>

            {/* Variant Selectors (Color & Size) */}
            {product.variants && product.variants.length > 1 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Options:
                  </div>
                  {(product as any).size_guide && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('size_guide');
                        const el = document.getElementById('product-tabs-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer py-1 px-2.5 rounded-xl hover:bg-primary/10 transition-colors"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Size Guide</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const label = [v.color, v.size].filter(Boolean).join(' - ') || v.sku;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'neu-chip-active text-primary border border-primary/40'
                            : 'neu-btn text-foreground'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{label}</span>
                        <span className="text-[10px] text-muted-foreground ml-1 font-mono">
                          {formatBDT(v.price, locale)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Stock */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center neu-inset rounded-2xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl neu-btn flex items-center justify-center text-foreground cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-black text-base text-foreground">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl neu-btn flex items-center justify-center text-foreground cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs">
                <div className="font-bold text-green-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>In Stock (Ready to ship)</span>
                </div>
                <div className="text-muted-foreground text-[11px]">
                  Estimated delivery: 24-48 Hours
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="py-4 neu-btn-primary rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 text-white" />
                <span>{locale === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="py-4 neu-btn-primary rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>{locale === 'bn' ? 'এখনই কিনুন' : 'Buy Now'}</span>
              </button>
            </div>

            {/* Key Benefits */}
            <div className="border-t pt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="neu-inset rounded-xl p-2.5">
                <Truck className="w-4 h-4 mx-auto text-primary mb-1" />
                <span className="font-bold block text-[11px]">64 Districts</span>
                <span className="text-[10px] text-muted-foreground">Fast Delivery</span>
              </div>
              <div className="neu-inset rounded-xl p-2.5">
                <ShieldCheck className="w-4 h-4 mx-auto text-green-600 mb-1" />
                <span className="font-bold block text-[11px]">Cash on Delivery</span>
                <span className="text-[10px] text-muted-foreground">Pay at doorstep</span>
              </div>
              <div className="neu-inset rounded-xl p-2.5">
                <RotateCcw className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <span className="font-bold block text-[11px]">7 Days Return</span>
                <span className="text-[10px] text-muted-foreground">Replacement</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Tabbed Specifications & Description */}
      <div id="product-tabs-section" className="neu-flat rounded-3xl p-6 md:p-8 space-y-6 overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b pb-4">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'description' ? 'neu-chip-active text-primary' : 'neu-btn text-muted-foreground'
            }`}
          >
            Product Overview
          </button>
          {careList.length > 0 && (
            <button
              onClick={() => setActiveTab('care_guide')}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex-shrink-0 ${
                activeTab === 'care_guide' ? 'neu-chip-active text-primary' : 'neu-btn text-muted-foreground'
              }`}
            >
              Care Guide ({careList.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
              activeTab === 'reviews' ? 'neu-chip-active text-primary' : 'neu-btn text-muted-foreground'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>Customer Reviews ({reviewsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'shipping' ? 'neu-chip-active text-primary' : 'neu-btn text-muted-foreground'
            }`}
          >
            Shipping & Delivery
          </button>
          <button
            onClick={() => setActiveTab('warranty')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'warranty' ? 'neu-chip-active text-primary' : 'neu-btn text-muted-foreground'
            }`}
          >
            Warranty & Returns
          </button>
          {(product as any).size_guide && (
            <button
              onClick={() => setActiveTab('size_guide')}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex-shrink-0 ${
                activeTab === 'size_guide' ? 'neu-chip-active text-primary' : 'neu-btn text-muted-foreground'
              }`}
            >
              Size Guide
            </button>
          )}
        </div>

        <div className="text-sm leading-relaxed text-foreground">
          {activeTab === 'description' && (
            <div className="space-y-6">
              {/* Product Detailed Narrative */}
              <div className="text-sm leading-relaxed text-foreground/90">
                {description && (description.includes('<p>') || description.includes('<div>') || description.includes('<br')) ? (
                  <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: typeof window !== 'undefined' ? DOMPurify.sanitize(description) : description }} />
                ) : (
                  <p className="whitespace-pre-line leading-relaxed font-normal">{description}</p>
                )}
              </div>

              {/* Apparel Attributes Spotlight Card: Material, Fit, Product Code */}
              {(material || fit || productSku) && (
                <div className="neu-inset rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {material && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                        🧵
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Material / Fabric</span>
                        <span className="text-xs font-black text-foreground">{material}</span>
                      </div>
                    </div>
                  )}
                  {fit && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                        👔
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Fit Silhouette</span>
                        <span className="text-xs font-black text-foreground">{fit}</span>
                      </div>
                    </div>
                  )}
                  {productSku && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                        🏷️
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Product Code / SKU</span>
                        <span className="text-xs font-mono font-black text-foreground truncate max-w-[140px]" title={productSku}>{productSku}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Care Instructions Checklist */}
              {careList.length > 0 && (
                <div className="neu-flat rounded-2xl p-5 border border-border/60 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                        🧼
                      </div>
                      <h4 className="font-black text-xs text-foreground uppercase tracking-wider">
                        Care Instruction:
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Garment Protection
                    </span>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 list-none p-0 m-0">
                    {careList.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90 font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm leading-none flex-shrink-0 mt-0.5" aria-hidden="true">
                          ✓
                        </span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Photography & Lighting Disclaimer Alert */}
              {disclaimer && (
                <div className="rounded-2xl p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px] font-medium">
                    {disclaimer}
                  </p>
                </div>
              )}

              {/* Detailed Specifications Table */}
              {(product as any).specifications && (product as any).specifications.length > 0 && (
                <div className="neu-inset rounded-2xl p-4 sm:p-5 space-y-3">
                  <h4 className="font-bold text-xs text-primary uppercase">Product Specifications:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(product as any).specifications.map((spec: any, idx: number) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-start py-1.5 border-b border-border/50 last:border-0">
                        <span className="font-bold text-foreground w-1/3">{spec.key}</span>
                        <span className="text-muted-foreground flex-1">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Highlights */}
              {(product as any).highlights && (product as any).highlights.length > 0 && (
                <div className="neu-inset rounded-2xl p-4 sm:p-5 space-y-2">
                  <h4 className="font-bold text-xs text-primary uppercase">Key Highlights:</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground list-none p-0 m-0">
                    {(product as any).highlights.map((highlight: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-foreground font-medium">
                        <span className="text-primary font-bold">✦</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quality & Buyer Protection Guarantees */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl neu-inset text-center space-y-1">
                  <span className="text-xl block">🛡️</span>
                  <span className="text-xs font-bold text-foreground block">100% Original</span>
                  <span className="text-[10px] text-muted-foreground block">Genuine Quality</span>
                </div>
                <div className="p-3.5 rounded-2xl neu-inset text-center space-y-1">
                  <span className="text-xl block">🚚</span>
                  <span className="text-xs font-bold text-foreground block">Fast Courier</span>
                  <span className="text-[10px] text-muted-foreground block">24-72h All BD</span>
                </div>
                <div className="p-3.5 rounded-2xl neu-inset text-center space-y-1">
                  <span className="text-xl block">💵</span>
                  <span className="text-xs font-bold text-foreground block">Cash On Delivery</span>
                  <span className="text-[10px] text-muted-foreground block">Doorstep Inspection</span>
                </div>
                <div className="p-3.5 rounded-2xl neu-inset text-center space-y-1">
                  <span className="text-xl block">🔄</span>
                  <span className="text-xs font-bold text-foreground block">7-Day Return</span>
                  <span className="text-[10px] text-muted-foreground block">Defect Guarantee</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'care_guide' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
                  🧼
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">Official Apparel Care Guide</h3>
                  <p className="text-xs text-muted-foreground">Follow these garment care rules to preserve color luster and fabric strength.</p>
                </div>
              </div>

              <div className="neu-inset rounded-2xl p-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {careList.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border/50 text-xs font-semibold text-foreground">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black flex-shrink-0">
                        ✓
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {disclaimer && (
                <div className="rounded-2xl p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px] font-medium">
                    {disclaimer}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Overall Ratings Card */}
              <div className="neu-inset rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-border/60 pb-4 md:pb-0 md:pr-6">
                  <div className="text-4xl font-black text-foreground">{avgRating}</div>
                  <div className="flex items-center gap-1 my-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'fill-current text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Based on {reviewsList.length} customer reviews
                  </p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>Customer Recommendation</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">100% Verified Positive</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All reviews are submitted by genuine buyers who purchased this product. Experience premium fabric comfort, perfect fit, and long-lasting durability.
                  </p>
                </div>
              </div>

              {/* Write a Customer Review Form */}
              <div className="neu-flat rounded-2xl p-6 border border-border/60 space-y-4">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-foreground">
                    Write a Customer Review
                  </h4>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="e.g. Tanvir Ahmed"
                        className="w-full p-2.5 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Your Rating (Stars)
                      </label>
                      <div className="flex items-center gap-2 p-1.5 bg-background/50 rounded-xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-5 h-5 ${star <= reviewRating ? 'fill-current text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-amber-500 ml-1">
                          {reviewRating} of 5
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Your Review & Feedback *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience regarding the fabric, fit, and comfort..."
                      className="w-full p-2.5 neu-input rounded-xl text-xs font-medium focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <span>{isSubmittingReview ? 'Submitting Review...' : 'Submit Review'}</span>
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Verified Customer Reviews ({reviewsList.length})
                </h4>

                {reviewsList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground neu-inset rounded-2xl">
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviewsList.map((rev: any, idx: number) => (
                      <div key={rev.id || idx} className="neu-flat rounded-2xl p-4.5 border border-border/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {(rev.customer_name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-foreground">
                                  {rev.customer_name || 'Verified Customer'}
                                </span>
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                  ✓ Verified Buyer
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground block">
                                {rev.created_at || 'Recent review'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= Number(rev.rating || 5) ? 'fill-current text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-foreground/90 font-medium leading-relaxed pl-10">
                          {rev.comment || rev.review_text || 'Great product quality and fast delivery!'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4 text-xs">
              <p>We deliver to all 64 districts in Bangladesh via official Steadfast, Pathao, and RedX logistics.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="neu-raised-sm rounded-2xl p-4">
                  <div className="font-bold text-primary">Inside Dhaka</div>
                  <div className="text-sm font-black mt-1">৳60</div>
                  <div className="text-muted-foreground mt-1">Delivery in 24 Hours</div>
                </div>
                <div className="neu-raised-sm rounded-2xl p-4">
                  <div className="font-bold text-primary">Dhaka Suburbs (Savar/Gazipur)</div>
                  <div className="text-sm font-black mt-1">৳100</div>
                  <div className="text-muted-foreground mt-1">Delivery in 24-48 Hours</div>
                </div>
                <div className="neu-raised-sm rounded-2xl p-4">
                  <div className="font-bold text-primary">Outside Dhaka (All Districts)</div>
                  <div className="text-sm font-black mt-1">৳130</div>
                  <div className="text-muted-foreground mt-1">Delivery in 48-72 Hours</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p className="font-bold text-foreground">7-Day Replacement & Official Warranty Guarantee</p>
              <p className="text-muted-foreground">
                If the product has any manufacturing defect or arrives damaged, request a replacement or full refund within 7 days of receiving the package.
              </p>
            </div>
          )}
          {activeTab === 'size_guide' && (product as any).size_guide && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
                <div>
                  <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-primary" />
                    <span>{(product as any).size_guide.name}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Standard garment measurements for optimal fit
                  </p>
                </div>
                {(product as any).size_guide.units?.length > 0 && (
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[11px] px-3 py-1 bg-primary/10 text-primary rounded-xl font-bold uppercase tracking-wide">
                      Units: {(product as any).size_guide.units.join(' / ')}
                    </span>
                  </div>
                )}
              </div>

              {/* 4-Column Responsive Table */}
              <div className="w-full">
                {(() => {
                  const rawContent = String((product as any).size_guide.content || '').trim();
                  
                  // Case 1: Pipe-delimited table format (e.g. Size | Chest | Length | Sleeve)
                  const lines = rawContent.split('\n').map(l => l.trim()).filter(Boolean);
                  const pipeLines = lines.filter(l => l.includes('|'));

                  if (pipeLines.length >= 2 && !rawContent.includes('<table')) {
                    const headerLine = pipeLines[0];
                    const headers = headerLine.split('|').map(s => s.trim()).filter(Boolean);
                    const dataRows = pipeLines.slice(1)
                      .filter(l => !l.includes('---'))
                      .map(rowLine => rowLine.split('|').map(cell => cell.trim()).filter(Boolean));
                    const nonTableLines = lines.filter(l => !l.includes('|') && !l.includes('---'));

                    return (
                      <div className="space-y-4">
                        <div className="overflow-x-auto rounded-2xl border border-border/80 shadow-xs neu-flat">
                          <table className="w-full text-center border-collapse text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-muted/70 text-foreground font-black uppercase tracking-wider border-b border-border text-[11px] sm:text-xs">
                                {headers.map((h, i) => (
                                  <th key={i} className="py-3 px-3 sm:px-4 text-center first:text-left first:pl-5">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {dataRows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-primary/5 transition-colors odd:bg-transparent even:bg-muted/20">
                                  {row.map((cell, cIdx) => (
                                    <td 
                                      key={cIdx} 
                                      className={`py-3 px-3 sm:px-4 text-center first:text-left first:pl-5 ${
                                        cIdx === 0 ? 'font-black text-primary' : 'font-medium text-foreground/90'
                                      }`}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {nonTableLines.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-muted/40 neu-inset text-xs text-muted-foreground flex items-start gap-2">
                            <span className="font-bold text-foreground">📌 Note:</span>
                            <span className="whitespace-pre-line leading-relaxed">{nonTableLines.join('\n')}</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Case 2: Structured HTML table format
                  if (rawContent.includes('<table') || rawContent.includes('<tr>')) {
                    const sanitizedHtml = typeof window !== 'undefined' ? DOMPurify.sanitize(rawContent) : rawContent;
                    return (
                      <div>
                        <style dangerouslySetInnerHTML={{ __html: `
                          .size-guide-table-box table { width: 100%; text-align: center; border-collapse: separate; border-spacing: 0; border-radius: 1rem; overflow: hidden; border: 1px solid hsl(var(--border) / 0.8); }
                          .size-guide-table-box th { background-color: hsl(var(--muted)); padding: 0.75rem 1rem; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: hsl(var(--foreground)); border-bottom: 2px solid hsl(var(--border)); }
                          .size-guide-table-box td { padding: 0.75rem 1rem; border-bottom: 1px solid hsl(var(--border) / 0.5); font-size: 0.85rem; }
                          .size-guide-table-box tbody tr:nth-child(even) { background-color: hsl(var(--muted) / 0.25); }
                          .size-guide-table-box tbody tr:hover { background-color: hsl(var(--primary) / 0.05); }
                          .size-guide-table-box td:first-child { font-weight: 800; color: hsl(var(--primary)); text-align: left; padding-left: 1.25rem; }
                          .size-guide-table-box th:first-child { text-align: left; padding-left: 1.25rem; }
                          .size-guide-table-box tr:last-child td { border-bottom: none; }
                          .size-guide-table-box p { font-size: 0.75rem; color: hsl(var(--muted-foreground)); margin-top: 0.75rem; font-weight: 500; }
                        `}} />
                        <div 
                          className="size-guide-table-box overflow-x-auto text-sm text-foreground"
                          suppressHydrationWarning
                          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                        />
                      </div>
                    );
                  }

                  // Case 3: Fallback plain text
                  return (
                    <div className="whitespace-pre-line text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed p-4 rounded-2xl neu-inset bg-muted/20">
                      {rawContent}
                    </div>
                  );
                })()}
              </div>

              {/* Sizing Assistance Note */}
              <div className="flex items-center gap-3 p-3 rounded-2xl neu-inset bg-muted/15 border border-border/40 text-xs text-muted-foreground">
                <Info className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  Unsure about sizing? Contact our customer support on WhatsApp or hotline for personalized fit advice.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products & You May Also Like Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="pt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-inset text-[11px] font-bold text-primary mb-1">
                <span>✨ Recommended Pairing</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Related Products & You May Also Like
              </h3>
              <p className="text-xs text-muted-foreground">
                Discover matching apparel, accessories, and popular selections from our catalog.
              </p>
            </div>
            <Link
              href="/products"
              className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-primary hover:text-foreground inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.slice(0, 4).map((item: any) => {
              const itemImg = formatImageUrl(
                item.primary_image_url || item.image || item.images?.[0]?.path || (item.images?.[0] as any)?.url
              );
              const itemPrice = Number(item.current_price ?? item.base_price ?? 0);
              const itemCompare = Number(item.compare_price ?? 0);
              const itemRating = item.average_rating || 5;

              return (
                <Link
                  key={item.id}
                  href={`/products/${item.slug}`}
                  className="group neu-flat rounded-2xl p-3 border border-border/50 hover:border-primary/50 transition-all flex flex-col justify-between hover:shadow-lg cursor-pointer"
                >
                  <div>
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 mb-2.5 relative">
                      <img
                        src={itemImg}
                        alt={item.name_en || ''}
                        loading="lazy"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.material && (
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[9px] text-white font-semibold truncate max-w-[90%]">
                          {item.material}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-current text-amber-500" />
                        <span>{itemRating}</span>
                        {item.category?.name_en && (
                          <span className="text-muted-foreground ml-1">• {item.category.name_en}</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        {item.name_en}
                      </h4>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-border/40 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-primary">
                        {formatBDT(itemPrice, locale)}
                      </span>
                      {itemCompare > itemPrice && (
                        <span className="text-[10px] text-muted-foreground line-through ml-1.5">
                          {formatBDT(itemCompare, locale)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                      View →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}