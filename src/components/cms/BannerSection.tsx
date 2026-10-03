'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLocaleStore } from '@/lib/store';

interface BannerItem {
  id: string;
  image_url: string;
  link?: string;
  title_en?: string;
  title_bn?: string;
  subtitle_en?: string;
  subtitle_bn?: string;
  button_text_en?: string;
  button_text_bn?: string;
}

interface BannerSectionProps {
  config: {
    items?: BannerItem[];
    image_url?: string;
    banner_type?: string;
    title_en?: string;
    title_bn?: string;
    subtitle_en?: string;
    subtitle_bn?: string;
    button_text_en?: string;
    button_text_bn?: string;
    button_link?: string;
    link?: string;
    interval?: number;
    show_arrows?: boolean;
    show_dots?: boolean;
  };
}

export function BannerSection({ config }: BannerSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { locale } = useLocaleStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isBn = mounted && locale === 'bn';

  let items: BannerItem[] = Array.isArray(config?.items) ? config.items : [];

  // Fallback: If config provides single image_url directly (e.g. CMS promo banner)
  if (items.length === 0 && config?.image_url) {
    items = [
      {
        id: 'promo-1',
        image_url: config.image_url,
        link: config.button_link || config.link || '/products',
        title_en: config.title_en,
        title_bn: config.title_bn,
        subtitle_en: config.subtitle_en,
        subtitle_bn: config.subtitle_bn,
        button_text_en: config.button_text_en || 'Grab Offer',
        button_text_bn: config.button_text_bn || 'অফারটি নিন',
      }
    ];
  }

  const interval = config?.interval || 5000;

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);
    return () => clearInterval(timer);
  }, [items.length, interval]);

  if (!items.length) return null;

  const next = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  const currentItem = items[currentIndex];
  const title = isBn ? (currentItem.title_bn || currentItem.title_en) : (currentItem.title_en || currentItem.title_bn);
  const subtitle = isBn ? (currentItem.subtitle_bn || currentItem.subtitle_en) : (currentItem.subtitle_en || currentItem.subtitle_bn);
  const btnText = isBn ? (currentItem.button_text_bn || 'অফারটি নিন') : (currentItem.button_text_en || 'Shop Now');
  const targetLink = currentItem.link || '/products';

  return (
    <div className="container mx-auto px-4 my-6">
      <div className="relative w-full overflow-hidden rounded-3xl neu-flat aspect-[21/9] sm:aspect-[21/8] md:aspect-[3/1] min-h-[180px] sm:min-h-[220px]">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <img
              src={currentItem.image_url}
              alt={title || "Banner"}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

            {/* Text Overlay if CMS configured title/subtitle */}
            {(title || subtitle) && (
              <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-16 text-white max-w-xl z-10 space-y-2 sm:space-y-3">
                {title && (
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight drop-shadow-md text-white">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 drop-shadow-sm font-medium">
                    {subtitle}
                  </p>
                )}
                <div className="pt-1">
                  <Link
                    href={targetLink}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm transition-all hover:scale-105 shadow-lg"
                  >
                    <span>{btnText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {config.show_arrows !== false && items.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20 cursor-pointer shadow-md"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20 cursor-pointer shadow-md"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {config.show_dots !== false && items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-primary w-6' : 'bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
