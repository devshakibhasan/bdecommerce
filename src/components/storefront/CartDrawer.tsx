'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Minus, Plus, ShoppingBag, ArrowRight, Trash2, 
  Truck, ShieldCheck, Sparkles, Check, ShoppingCart 
} from 'lucide-react';
import Link from 'next/link';
import { useCartStore, useUIStore, useLocaleStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { formatBDT } from '@/utils/currency';
import { formatImageUrl } from '@/utils/image';
import toast from 'react-hot-toast';

const FREE_DELIVERY_THRESHOLD = 3000;

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const { isCartOpen, toggleCart } = useUIStore();
  const { items = [], removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const { locale } = useLocaleStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        toggleCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, toggleCart]);

  const total = mounted ? getTotal() : 0;
  const safeItems = (mounted && Array.isArray(items) ? items : []).filter(
    (it) => it && it.product && (it.product.id || it.product.slug)
  );

  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - total);
  const freeDeliveryProgress = Math.min(100, Math.round((total / FREE_DELIVERY_THRESHOLD) * 100));

  const handleRemove = (identifier: string | number, name: string) => {
    removeItem(identifier);
    toast.success(`${name} removed from cart`);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[120] overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer"
            aria-hidden="true"
          />

          {/* Drawer Container (100% Responsive for All Screen Sizes) */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-full sm:max-w-md h-[100dvh] bg-white dark:bg-[#111622] text-slate-900 dark:text-slate-100 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden"
            >
              
              {/* Drawer Top Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-[#161d2a]/90 backdrop-blur-md flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm flex-shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-tight">
                      {mounted && locale === 'bn' ? 'আপনার শপিং কার্ট' : 'Shopping Cart'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {safeItems.length} {safeItems.length === 1 ? 'item' : 'items'} ready for checkout
                    </p>
                  </div>
                </div>

                <button
                  onClick={toggleCart}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  aria-label="Close cart"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Free Delivery Progress Bar */}
              {safeItems.length > 0 && (
                <div className="bg-primary/10 dark:bg-primary/10/40 border-b border-primary/30/60 dark:border-primary/80/50 px-4 py-2.5 flex-shrink-0">
                  <div className="flex items-center justify-between text-[11px] font-bold text-primary dark:text-primary/40 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-primary dark:text-primary" />
                      {remainingForFreeDelivery === 0 
                        ? (mounted && locale === 'bn' ? '🎉 আপনি ফ্রি ডেলিভারি পেয়েছেন!' : '🎉 You unlocked FREE Delivery!') 
                        : (mounted && locale === 'bn' ? `ফ্রি ডেলিভারির জন্য আরও ৳${remainingForFreeDelivery.toLocaleString()} যোগ করুন` : `Add ৳${remainingForFreeDelivery.toLocaleString()} more for Free Delivery`)}
                    </span>
                    <span className="font-mono">{freeDeliveryProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-primary/30/60 dark:bg-primary/20/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${freeDeliveryProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Scrollable Cart Items Body */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 overscroll-contain">
                {safeItems.length === 0 ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center space-y-4 py-12 px-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner">
                      <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                        {mounted && locale === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs">
                        {mounted && locale === 'bn' ? 'আমাদের কালেকশন থেকে পছন্দের গ্যাজেট ও পণ্য কার্টে যুক্ত করুন।' : 'Explore authentic gadgets, smartphones, and fashion items.'}
                      </p>
                    </div>
                    <button
                      onClick={toggleCart}
                      className="mt-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs shadow-lg shadow-primary/20 transition-all cursor-pointer"
                    >
                      {mounted && locale === 'bn' ? 'পণ্য ব্রাউজ করুন' : 'Start Shopping'}
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {safeItems.map((item, idx) => {
                      const itemKey = item.cartItemId || String(item.variant?.id || item.product?.id || idx);
                      const product = item.product;
                      const variant = item.variant;
                      const rawImg = product.primary_image_url || (product as any)?.image || product.images?.[0]?.path || (product.images?.[0] as any)?.url || '/images/products/samsung-galaxy-a55.svg';
                      const img = formatImageUrl(rawImg, (product as any)?.updated_at);
                      const unitPrice = Number(variant?.price ?? product.current_price ?? product.base_price ?? 0);
                      const qty = Number(item.quantity) || 1;
                      const itemTotal = unitPrice * qty;

                      return (
                        <li 
                          key={itemKey} 
                          className="bg-slate-50 dark:bg-[#161d2a] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 sm:p-3.5 flex gap-3 sm:gap-3.5 items-center shadow-sm hover:border-primary/40 transition-all"
                        >
                          {/* Thumbnail */}
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={img}
                              alt={product.name_en}
                              className="w-full h-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/images/products/samsung-galaxy-a55.svg'; }}
                            />
                          </div>

                          {/* Info & Quantity */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1.5">
                              <h3 className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-white leading-tight">
                                {locale === 'bn' && product.name_bn ? product.name_bn : product.name_en}
                              </h3>
                              <button
                                onClick={() => handleRemove(itemKey, product.name_en)}
                                className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                            
                            {/* Variant Specs */}
                            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 flex flex-wrap gap-1.5">
                              {variant?.color && <span>{variant.color}</span>}
                              {variant?.size && <span>• {variant.size}</span>}
                              <span className="font-mono">• ৳{unitPrice.toLocaleString()} each</span>
                            </div>

                            {/* Controls: Quantity Pill & Total */}
                            <div className="flex items-center justify-between mt-2.5">
                              {/* Quantity Stepper */}
                              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 shadow-sm">
                                <button
                                  onClick={() => updateQuantity(itemKey, Math.max(1, qty - 1))}
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black w-6 sm:w-7 text-center font-mono text-slate-900 dark:text-white">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateQuantity(itemKey, qty + 1)}
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-right font-black text-xs sm:text-sm text-primary dark:text-primary font-mono">
                                {formatBDT(itemTotal, locale)}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Drawer Bottom Sticky Footer */}
              {safeItems.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3 bg-slate-50/95 dark:bg-[#161d2a]/95 backdrop-blur-md flex-shrink-0 shadow-lg pb-safe">
                  
                  {/* Total & Delivery Summary */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <span>{t('checkout.subtotal', locale)} ({safeItems.length} items)</span>
                      <span className="font-mono font-bold">{formatBDT(total, locale)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {mounted && locale === 'bn' ? 'সর্বমোট প্রদেয়' : 'Total Payable'}
                      </span>
                      <span className="text-lg sm:text-xl font-black text-primary dark:text-primary font-mono">
                        {formatBDT(total, locale)}
                      </span>
                    </div>
                  </div>

                  {/* 2-Button Action Matrix */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
                    <Link
                      href="/cart"
                      onClick={toggleCart}
                      className="py-3 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-center flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-200 hover:border-primary transition-all shadow-sm"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                      <span>{mounted && locale === 'bn' ? 'কার্ট ভিউ' : 'View Cart'}</span>
                    </Link>

                    <Link
                      href="/checkout"
                      onClick={toggleCart}
                      className="py-3 px-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-lg shadow-primary/25 hover:shadow-xl transition-all cursor-pointer"
                    >
                      <span>{mounted && locale === 'bn' ? 'অর্ডার করুন' : 'Checkout'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Trust Badge */}
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Cash on Delivery (COD) & Safe Escrow Guarantee</span>
                  </div>

                </div>
              )}

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
