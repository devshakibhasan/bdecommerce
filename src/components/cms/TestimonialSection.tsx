'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote, CheckCircle2 } from 'lucide-react';
import { useLocaleStore } from '@/lib/store';

interface Testimonial {
  id?: string;
  name: string;
  avatar?: string;
  quote?: string;
  quote_en?: string;
  quote_bn?: string;
  rating?: number;
}

interface TestimonialSectionProps {
  config: {
    title_en?: string;
    title_bn?: string;
    testimonials?: Testimonial[];
  };
}

export function TestimonialSection({ config }: TestimonialSectionProps) {
  const { locale } = useLocaleStore();
  const [isMounted, setIsMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isBn = isMounted && locale === 'bn';

  const testimonials: Testimonial[] = (Array.isArray(config?.testimonials) && config.testimonials.length > 0)
    ? config.testimonials
    : [
        {
          name: 'Saiful Islam (Dhanmondi, Dhaka)',
          quote_en: 'Ordered Samsung Galaxy A55 in the morning and received it within 24 hours through Steadfast. Original product with official warranty!',
          quote_bn: 'সকালে স্যামসাং গ্যালাক্সি A55 অর্ডার করে ২৪ ঘণ্টার মধ্যে ডেলিভারি পেয়েছি। আসল পণ্য ও অফিসিয়াল ওয়ারেন্টি!',
          rating: 5,
        },
        {
          name: 'Shaila Yasmin (GEC, Chattogram)',
          quote_en: 'The Dhaka Jamdani Saree is breathtakingly beautiful. Pure cotton-silk handloom quality. Very happy with bKash seamless checkout.',
          quote_bn: 'ঢাকাই জামদানি শাড়িটি অসম্ভব সুন্দর। পিওর কটন-সিল্ক হ্যান্ডলুম কোয়ালিটি। বিকাশে পেমেন্ট করে খুব সহজে অর্ডার করেছি।',
          rating: 5,
        },
        {
          name: 'Mehedi Hasan (Zindabazar, Sylhet)',
          quote_en: 'Customer service is top notch. Delivery outside Dhaka took only 48 hours. Cash on delivery made it super safe.',
          quote_bn: 'কাস্টমার সার্ভিস অসাধারণ। ঢাকার বাইরে মাত্র ৪৮ ঘণ্টায় ডেলিভারি পেয়েছি। ক্যাশ অন ডেলিভারি থাকায় নিশ্চিন্তে নিয়েছি।',
          rating: 5,
        },
      ];

  const title = isBn 
    ? (config.title_bn || 'আমাদের সন্তুষ্ট গ্রাহকদের মতামত') 
    : (config.title_en || 'What Our Verified Customers Say');

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  const current = testimonials[currentIndex] || testimonials[0];
  const quoteText = isBn 
    ? (current.quote_bn || current.quote || current.quote_en) 
    : (current.quote_en || current.quote || current.quote_bn);

  return (
    <section className="py-12 container mx-auto px-4" suppressHydrationWarning>
      <div className="max-w-4xl mx-auto text-center space-y-8">
        
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{title}</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Real reviews from buyers across all 64 districts in Bangladesh</p>
        </div>

        <div className="neu-convex p-8 md:p-12 rounded-3xl relative min-h-[260px] flex flex-col justify-center">
          <Quote className="absolute top-6 left-6 w-10 h-10 text-primary/15 rotate-180" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 relative z-10"
            >
              {/* Star Rating */}
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-amber-500 fill-amber-500"
                  />
                ))}
              </div>

              {/* Quote Text */}
              <p className="text-base sm:text-lg font-medium text-foreground italic leading-relaxed max-w-2xl mx-auto">
                "{quoteText}"
              </p>

              {/* Customer Signature */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="w-10 h-10 neu-inset rounded-full flex items-center justify-center text-primary font-black text-sm">
                  {current.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1">
                    <span>{current.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-semibold">Verified Buyer</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <Quote className="absolute bottom-6 right-6 w-10 h-10 text-primary/15" />
        </div>

        {/* Carousel Stepper Buttons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={prev}
            className="p-3 neu-btn rounded-2xl text-foreground hover:text-primary cursor-pointer transition-all"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-3">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-primary shadow-sm' : 'bg-muted-foreground/30'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="p-3 neu-btn rounded-2xl text-foreground hover:text-primary cursor-pointer transition-all"
            aria-label="Next review"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}