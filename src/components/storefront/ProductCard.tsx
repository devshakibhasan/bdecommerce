'use client';

import { Product, ProductVariant } from '@/types';
import { useLocaleStore, useCartStore, useUIStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatBDT } from '@/utils/currency';
import { formatImageUrl } from '@/utils/image';
import Link from 'next/link';
import { ShoppingCart, Eye } from 'lucide-react';
import React from 'react';

interface ProductCardProps {
  product: Product;
}

const ProductCardInner = React.memo(function ProductCard({ product }: ProductCardProps) {
  if (!product) return null;

  const { locale } = useLocaleStore();
  const { addItem } = useCartStore();
  const { toggleCart } = useUIStore();

  const name = locale === 'bn' && product.name_bn ? product.name_bn : (product.name_en || 'Product');

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const defaultVariant: ProductVariant = (variants.length > 0
    ? variants[0]
    : {
        id: (product.id || 1) * 1000 + 1,
        sku: product.sku_prefix ? `${product.sku_prefix}-STD` : `SKU-${product.id}`,
        barcode: null,
        color: null,
        size: null,
        price: Number(product.base_price || product.current_price || 0),
        cost_price: null,
        stock: 100,
        available_stock: 100,
        is_active: true,
        is_low_stock: false,
        weight_grams: null,
      }) as ProductVariant;

  const price = Number(defaultVariant?.price || product.base_price || product.current_price || 0);
  const comparePrice = product.compare_price ? Number(product.compare_price) : null;

  const discountPercent = comparePrice && comparePrice > price
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const isInStock = product.is_in_stock !== false;
  const rawImg = product.primary_image_url || (product as any).image || (Array.isArray(product.images) ? (product.images[0]?.url || product.images[0]?.path) : undefined);
  const imgUrl = formatImageUrl(rawImg, (product as any).updated_at);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, defaultVariant, 1);
    toggleCart();
  };

  return (
    <div className="h-full">
      <Link href={`/products/${product.slug}`} className="group block h-full">
        <div className="neu-flat hover:neu-raised rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 transition-all duration-300 h-full flex flex-col relative">
          {/* Discount & Featured Chips */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
            {discountPercent > 0 && (
              <span className="inline-flex items-center justify-center bg-rose-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md leading-tight">
                -{discountPercent}%
              </span>
            )}
            {Boolean(product.is_featured) && (
              <span className="inline-flex items-center justify-center bg-amber-500 text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-lg shadow-md tracking-wider uppercase leading-tight">
                HOT
              </span>
            )}
          </div>

          {/* Neumorphic Inset Image Well */}
          <div className="relative aspect-square neu-inset rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-center overflow-hidden mb-2 sm:mb-3 h-8/12">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full  flex items-center justify-center text-muted-foreground text-xs font-semibold">
                No Image
              </div>
            )}

            {!isInStock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs rounded-xl sm:rounded-2xl">
                <span className="neu-flat text-foreground text-[11px] sm:text-xs px-3 py-1 font-bold rounded-xl shadow">
                  {t('product.out_of_stock', locale)}
                </span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col flex-1 px-0.5 sm:px-1">
            <h3 className="font-bold text-xs sm:text-sm line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-primary transition-colors text-foreground leading-snug">
              {name}
            </h3>

            <div className="mt-5 pt-1.5 sm:pt-2 space-y-2 sm:space-y-3">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-black text-base sm:text-lg text-primary tracking-tight">
                  {formatBDT(price, locale)}
                </span>
                {comparePrice && comparePrice > price && (
                  <span className="text-[11px] sm:text-xs text-muted-foreground line-through">
                    {formatBDT(comparePrice, locale)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock}
                  className="col-span-3 sm:col-span-4 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 text-white font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title={locale === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}
                >
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                  <span>{locale === 'bn' ? 'কার্টে রাখুন' : 'Add to Cart'}</span>
                </button>
                <div
                  className="col-span-1 py-2 sm:py-2.5 rounded-xl bg-primary/10 dark:bg-primary/10/40 border border-primary/30/80 dark:border-primary/80/80 hover:bg-primary/20 dark:hover:bg-primary/20/60 text-primary dark:text-primary flex items-center justify-center transition-all shadow-xs"
                  title="View Detail"
                >
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
});
export { ProductCardInner as ProductCard };