'use client';

import { useState } from 'react';
import { useLocaleStore } from '@/lib/store';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FaqItem {
  q_en?: string;
  q_bn?: string;
  a_en?: string;
  a_bn?: string;
  question_en?: string;
  question_bn?: string;
  answer_en?: string;
  answer_bn?: string;
}

export interface FaqSectionProps {
  config: {
    title_en?: string;
    title_bn?: string;
    subtitle_en?: string;
    subtitle_bn?: string;
    items?: FaqItem[];
  };
}

export function FaqSection({ config }: FaqSectionProps) {
  const { locale } = useLocaleStore();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const title = locale === 'bn'
    ? (config?.title_bn || config?.title_en || 'সাধারণ জিজ্ঞাসা (FAQ)')
    : (config?.title_en || config?.title_bn || 'Frequently Asked Questions');

  const subtitle = locale === 'bn'
    ? (config?.subtitle_bn || config?.subtitle_en)
    : (config?.subtitle_en || config?.subtitle_bn);

  const rawItems = Array.isArray(config?.items) && config.items.length > 0
    ? config.items
    : [
        {
          question_en: 'How long does delivery take across Bangladesh?',
          question_bn: 'সারাদেশে ডেলিভারি হতে কত দিন সময় লাগে?',
          answer_en: 'Inside Dhaka delivery takes 24 hours. Outside Dhaka takes 48-72 hours via Steadfast & Pathao courier.',
          answer_bn: 'ঢাকার ভিতরে ২৪ ঘণ্টা এবং ঢাকার বাইরে ৪৮-৭২ ঘণ্টার মধ্যে নির্ভরযোগ্য কুরিয়ারে ডেলিভারি সম্পন্ন হয়।'
        },
        {
          question_en: 'Can I pay with Cash on Delivery (COD)?',
          question_bn: 'ক্যাশ অন ডেলিভারিতে পণ্য দেখে টাকা দেওয়া যাবে?',
          answer_en: 'Yes, 100% of our orders support Cash on Delivery. You can check the parcel at your doorstep before payment.',
          answer_bn: 'হ্যাঁ, পণ্য হাতে পেয়ে দেখে সম্পূর্ণ মূল্য পরিশোধ করার সুবিধা রয়েছে।'
        },
        {
          question_en: 'What is the replacement guarantee?',
          question_bn: 'পণ্য পরিবর্তন বা রিপ্লেসমেন্ট পলিসি কি?',
          answer_en: 'We offer a 7-day hassle-free replacement guarantee for any size issues or manufacturing defects.',
          answer_bn: 'যেকোনো সাইজ বা ত্রুটির ক্ষেত্রে ৭ দিনের সহজ রিপ্লেসমেন্ট গ্যারান্টি প্রদান করা হয়।'
        }
      ];

  const toggle = (idx: number) => {
    setOpenIndex(prev => (prev === idx ? null : idx));
  };

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-1">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {rawItems.map((item, idx) => {
            const question = locale === 'bn'
              ? (item.question_bn || item.q_bn || item.question_en || item.q_en || '')
              : (item.question_en || item.q_en || item.question_bn || item.q_bn || '');

            const answer = locale === 'bn'
              ? (item.answer_bn || item.a_bn || item.answer_en || item.a_en || '')
              : (item.answer_en || item.a_en || item.answer_bn || item.a_bn || '');

            if (!question) return null;

            const isOpen = openIndex === idx;

            return (
              <div 
                key={idx}
                className="clay-card rounded-2xl overflow-hidden transition-all border border-border/50"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base text-foreground flex-1">
                    {question}
                  </span>
                  <div className={`w-8 h-8 rounded-full clay-inset flex items-center justify-center shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                        {answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
