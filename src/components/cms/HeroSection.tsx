'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useLocaleStore } from '@/lib/store';
import { ShoppingBag, ArrowRight, Sparkles, ChevronLeft, ChevronRight, Zap, ShieldCheck, Gift } from 'lucide-react';
import { api } from '@/lib/api';

interface HeroSlide {
  id: number;
  badge_en: string;
  badge_bn: string;
  badge_icon: any;
  title_en: string;
  title_bn: string;
  subtitle_en: string;
  subtitle_bn: string;
  button_text_en: string;
  button_text_bn: string;
  button_link: string;
  bg_image: string;
  theme_color: string;
  accent_gradient: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    badge_en: 'Summer Collection 2026',
    badge_bn: 'সামার কালেকশন ২০২৬',
    badge_icon: Sparkles,
    title_en: 'Exclusive Men & Women Fashion',
    title_bn: 'এক্সক্লুসিভ মেনস ও উইমেন্স ফ্যাশন',
    subtitle_en: 'Up to 50% off on Men\'s Fashion and Women\'s Wear with Doorstep COD.',
    subtitle_bn: 'ছেলেদের ও মেয়েদের পোশাকে ৫০% পর্যন্ত ছাড়ে।',
    button_text_en: 'Explore Collection',
    button_text_bn: 'কালেকশন দেখুন',
    button_link: '/products',
    bg_image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85',
    theme_color: 'text-amber-300 border-amber-500/30 bg-amber-500/20',
    accent_gradient: 'from-amber-500 to-amber-600 shadow-amber-500/30',
  },
  {
    id: 2,
    badge_en: 'Kids Wear & Shoes',
    badge_bn: 'বাচ্চাদের পোশাক ও জুতো',
    badge_icon: Zap,
    title_en: 'Stylish Kids Collection & Premium Shoes',
    title_bn: 'স্টাইলিশ কিডস কালেকশন ও প্রিমিয়াম জুতো',
    subtitle_en: 'Find the best outfits for your kids and premium shoes for all occasions.',
    subtitle_bn: 'আপনার বাচ্চাদের জন্য সেরা পোশাক এবং সব অনুষ্ঠানের জন্য প্রিমিয়াম জুতো।',
    button_text_en: 'Shop Kids & Shoes',
    button_text_bn: 'কিডস ও জুতো দেখুন',
    button_link: '/products',
    bg_image: 'https://images.unsplash.com/photo-1519241047957-be31d7379a5d?auto=format&fit=crop&w=1600&q=85',
    theme_color: 'text-blue-300 border-blue-500/30 bg-blue-500/20',
    accent_gradient: 'from-blue-600 to-indigo-600 shadow-blue-500/30',
  },
  {
    id: 3,
    badge_en: 'Trending Accessories',
    badge_bn: 'ট্রেন্ডিং এক্সেসরিজ',
    badge_icon: ShieldCheck,
    title_en: 'Premium Bags, Belts & Watches',
    title_bn: 'প্রিমিয়াম ব্যাগ, বেল্ট ও ঘড়ি',
    subtitle_en: 'Complete your look with our wide range of premium fashion accessories.',
    subtitle_bn: 'আমাদের প্রিমিয়াম ফ্যাশন এক্সেসরিজ দিয়ে আপনার লুক সম্পূর্ণ করুন।',
    button_text_en: 'Shop Accessories',
    button_text_bn: 'এক্সেসরিজ কিনুন',
    button_link: '/products',
    bg_image: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=1600&q=85',
    theme_color: 'text-primary/40 border-primary/30 bg-primary/20',
    accent_gradient: 'from-primary to-green-600 shadow-primary/30',
  },
  {
    id: 4,
    badge_en: 'Instant MFS Cashback',
    badge_bn: 'বিকাশ ও নগদ ক্যাশব্যাক',
    badge_icon: Gift,
    title_en: 'Pay with bKash / Nagad or Cash on Delivery',
    title_bn: 'বিকাশ, নগদ বা ক্যাশ অন ডেলিভারিতে শপিং',
    subtitle_en: 'Enjoy instant flat ৳100 bKash promo discount on all clothing items.',
    subtitle_bn: 'সব পোশাকে বিকাশ পেমেন্টে ১০০ টাকা ক্যাশব্যাক উপভোগ করুন।',
    button_text_en: 'Claim Offers',
    button_text_bn: 'অফার উপভোগ করুন',
    button_link: '/products',
    bg_image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=85',
    theme_color: 'text-pink-300 border-pink-500/30 bg-pink-500/20',
    accent_gradient: 'from-pink-600 to-rose-600 shadow-pink-500/30',
  }
];

export function HeroSection({ config }: { config?: any }) {
  const { locale } = useLocaleStore();
  const [isMounted, setIsMounted] = useState(false);
  const [slides, setSlides] = useState<HeroSlide[]>(HERO_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    let active = true;
    api.get<any>('/sliders').then((res) => {
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      if (active && Array.isArray(items) && items.length > 0) {
        const badgeIcons = [Sparkles, Zap, ShieldCheck, Gift];
        const formatted: HeroSlide[] = items.map((item: any, idx: number) => ({
          id: item.id,
          badge_en: item.badge_en || '',
          badge_bn: item.badge_bn || '',
          badge_icon: badgeIcons[idx % badgeIcons.length],
          title_en: item.title_en || '',
          title_bn: item.title_bn || '',
          subtitle_en: item.subtitle_en || '',
          subtitle_bn: item.subtitle_bn || '',
          button_text_en: item.button_text_en || 'Shop Now',
          button_text_bn: item.button_text_bn || 'অর্ডার করুন',
          button_link: item.button_link || '/products',
          bg_image: item.bg_image,
          theme_color: item.theme_color || 'text-amber-300 border-amber-500/30 bg-amber-500/20',
          accent_gradient: item.accent_gradient || 'from-amber-500 to-amber-600 shadow-amber-500/30',
        }));
        setSlides(formatted);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const isBn = isMounted && locale === 'bn';

  // Auto-run slider interval (4.5s)
  useEffect(() => {
    if (!isPaused && slides.length > 0) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 4500);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, slides.length]);

  const slide = slides[currentSlide] || slides[0];
  const BadgeIcon = slide.badge_icon || Sparkles;
  const badgeText = isBn ? slide.badge_bn : slide.badge_en;
  const titleText = isBn ? slide.title_bn : slide.title_en;
  const subtitleText = isBn ? slide.subtitle_bn : slide.subtitle_en;
  const buttonText = isBn ? slide.button_text_bn : slide.button_text_en;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div 
      className="relative w-full min-h-[460px] md:min-h-[520px] flex items-center overflow-hidden rounded-3xl mx-auto container my-6 shadow-2xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      suppressHydrationWarning
    >
      {/* Background Image — Next.js optimized for LCP */}
      <Image
        src={slide.bg_image}
        alt=""
        fill
        priority={currentSlide === 0}
        sizes="100vw"
        className="object-cover object-center transition-all duration-700 scale-105"
      />
      
      {/* High Contrast Deep Gradient Overlay for Maximum Readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/40" />

      {/* Main Content Area */}
      <div className="relative z-10 px-6 sm:px-10 md:px-16 py-12 max-w-2xl text-white">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Promotional Badge Capsule */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black tracking-wide uppercase backdrop-blur-md ${slide.theme_color}`}>
              <BadgeIcon className="w-4 h-4" />
              <span>{badgeText}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.12] tracking-tight text-white drop-shadow-md">
              {titleText}
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed drop-shadow max-w-lg font-medium">
              {subtitleText}
            </p>
            
            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link 
                href={slide.button_link}
                className={`inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r ${slide.accent_gradient} text-white font-black rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 text-sm cursor-pointer`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{buttonText}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all backdrop-blur-md text-sm border border-white/20 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>{locale === 'bn' ? 'ক্যাটাগরি দেখুন' : 'Explore Categories'}</span>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Side Arrow Navigation */}
      <div className="absolute inset-y-0 right-6 z-20 hidden sm:flex items-center gap-2">
        <button
          onClick={prevSlide}
          className="w-11 h-11 rounded-2xl bg-black/40 hover:bg-black/70 text-white border border-white/10 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="w-11 h-11 rounded-2xl bg-black/40 hover:bg-black/70 text-white border border-white/10 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Indicators & Auto-Run Progress Bars */}
      <div className="absolute bottom-6 left-6 sm:left-16 z-20 flex items-center gap-2.5">
        {slides.map((s, idx) => {
          const isActive = currentSlide === idx;
          return (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className="group/dot cursor-pointer transition-all focus:outline-none"
              aria-label={`Slide ${idx + 1}`}
            >
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  isActive 
                    ? 'w-10 bg-amber-400 shadow-md shadow-amber-400/50' 
                    : 'w-2.5 bg-white/30 hover:bg-white/60'
                }`} 
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
