'use client';

import { useLocaleStore } from '@/lib/store';
import { CheckCircle2, ShieldCheck, Truck, Clock, Sparkles } from 'lucide-react';

export interface FeatureItem {
  title_en?: string;
  title_bn?: string;
  desc_en?: string;
  desc_bn?: string;
  text?: string;
}

export interface FeaturesSectionProps {
  config: {
    title_en?: string;
    title_bn?: string;
    items?: FeatureItem[];
  };
}

export function FeaturesSection({ config }: FeaturesSectionProps) {
  const { locale } = useLocaleStore();

  const title = locale === 'bn'
    ? (config?.title_bn || config?.title_en || 'কেন আমাদের থেকে কেনাকাটা করবেন?')
    : (config?.title_en || config?.title_bn || 'Why Shop With Us?');

  const rawItems = Array.isArray(config?.items) && config.items.length > 0
    ? config.items
    : [
        {
          title_en: '100% Original Products',
          title_bn: '১০০% অরিজিনাল ও প্রিমিয়াম কোয়ালিটি',
          desc_en: 'Authentic items sourced directly from trusted manufacturers.',
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
      ];

  const icons = [Sparkles, Truck, ShieldCheck, Clock];

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        {title && (
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {title}
            </h2>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rawItems.map((item, idx) => {
            const Icon = icons[idx % icons.length];
            const itemTitle = locale === 'bn'
              ? (item.title_bn || item.title_en || item.text || '')
              : (item.title_en || item.title_bn || item.text || '');

            const itemDesc = locale === 'bn'
              ? (item.desc_bn || item.desc_en || '')
              : (item.desc_en || item.desc_bn || '');

            return (
              <div 
                key={idx}
                className="clay-card rounded-2xl p-5 space-y-3 flex flex-col items-center text-center hover:scale-[1.02] transition-transform"
              >
                <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center text-primary">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  {itemTitle}
                </h3>
                {itemDesc && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {itemDesc}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
