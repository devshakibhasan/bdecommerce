import { HomePageClient } from './HomePageClient';
import { DEFAULT_CATEGORIES } from '@/components/cms/CategoryGridSection';
import { PageSection } from '@/types';

const DEFAULT_HOMEPAGE_SECTIONS: PageSection[] = [
  {
    id: 13,
    type: 'hero',
    position: 0,
    is_visible: true,
    config: {
      heading_en: 'Welcome to BD E-Commerce',
      heading_bn: 'বিডি ই-কমার্সে আপনাকে স্বাগতম',
      subtitle_en: 'Fastest Delivery across all 64 districts in Bangladesh with Cash on Delivery & bKash',
      subtitle_bn: 'সারা বাংলাদেশে দ্রুততম ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা',
      background_image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85',
      button_text_en: 'Shop Collection',
      button_text_bn: 'পণ্য দেখুন',
      button_link: '/products',
      height: 'large',
      alignment: 'left',
    }
  },
  {
    id: 14,
    type: 'category_grid',
    position: 1,
    is_visible: true,
    config: {
      title_en: 'Browse Popular Categories',
      title_bn: 'জনপ্রিয় ক্যাটাগরি ব্রাউজ করুন',
      categories: DEFAULT_CATEGORIES,
    }
  },
  {
    id: 15,
    type: 'flash_sale',
    position: 2,
    is_visible: true,
    config: {
      title_en: 'Grand Eid Flash Sale ⚡',
      title_bn: 'গ্র্যান্ড ঈদ মেগা ফ্ল্যাশ সেল ⚡',
    }
  },
  {
    id: 16,
    type: 'product_grid',
    position: 3,
    is_visible: true,
    config: {
      title_en: 'Featured Products',
      title_bn: 'বিশেষ নির্বাচিত পণ্যসমূহ',
      filter: 'featured',
      limit: 8,
    }
  },
  {
    id: 17,
    type: 'banner',
    position: 4,
    is_visible: true,
    config: {
      image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80',
      title_en: 'Mega Lifestyle & Tech Deals',
      title_bn: 'মেগা লাইফস্টাইল ও টেক ধামাকা ডিল',
      subtitle_en: 'Up to 50% Off on selected seasonal items with nationwide delivery',
      subtitle_bn: 'নির্বাচিত পণ্যে ৫০% পর্যন্ত ছাড় এবং সারাদেশে ক্যাশ অন ডেলিভারি',
      button_text_en: 'Grab Offer',
      button_text_bn: 'অফারটি নিন',
      button_link: '/products',
    }
  },
  {
    id: 18,
    type: 'product_carousel',
    position: 5,
    is_visible: true,
    config: {
      title_en: 'New Arrivals & Trending',
      title_bn: 'নতুন কালেকশন ও ট্রেন্ডিং পণ্য',
      filter: 'new_arrivals',
      limit: 8,
    }
  },
  {
    id: 40,
    type: 'every_category_products',
    position: 6,
    is_visible: true,
    config: {
      title_en: 'Shop by Category',
      title_bn: 'ক্যাটাগরি ভিত্তিক পণ্য কালেকশন',
      subtitle_en: 'Explore authentic clothing collections for Men, Women & Kids with doorstep delivery',
      subtitle_bn: 'পুরুষ, মহিলা ও শিশুদের আধুনিক পোশাক ও সেরা লাইফস্টাইল কালেকশন',
    }
  },
  {
    id: 19,
    type: 'testimonial',
    position: 7,
    is_visible: true,
    config: {
      title_en: 'What Our Verified Customers Say',
      title_bn: 'আমাদের সন্তুষ্ট গ্রাহকদের মতামত',
    }
  },
];

function getHomepageCandidates(): string[] {
  const envUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '') : null;
  const internalUrl = process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL.replace(/\/+$/, '') : null;
  const prodUrl = 'https://api.bdecommerce.inspireacademyy.com/api/v1';
  const localUrl = 'https://api.bdecommerce.inspireacademyy.com//api/v1';

  const bases = [internalUrl, envUrl, prodUrl, localUrl].filter(Boolean) as string[];
  const uniqueBases = Array.from(new Set(bases));

  const list: string[] = [];
  for (const b of uniqueBases) {
    list.push(`${b}/content/homepage`);
    list.push(`${b}/cms/pages/homepage`);
  }
  return list;
}

async function getHomepageSections(): Promise<PageSection[]> {
  const urls = getHomepageCandidates();

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const list = json?.data?.sections || json?.sections;
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (err) {
      // Silenced fallback to next candidate or DEFAULT_HOMEPAGE_SECTIONS
    }
  }

  return DEFAULT_HOMEPAGE_SECTIONS;
}

export async function generateMetadata() {
  const urls = getHomepageCandidates();

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const page = json?.data;
        if (page) {
          return {
            title: page.seo_title || page.title_en || 'BD Shop - Best Online Shopping in Bangladesh',
            description: page.seo_description || 'Shop Men, Women, Kids fashion, shoes, and accessories with Cash on Delivery and bKash across 64 districts in Bangladesh.',
          };
        }
      }
    } catch (err) {}
  }

  return {
    title: 'BD Shop - Best Online Shopping in Bangladesh',
    description: 'Shop Men, Women, Kids fashion, shoes, and accessories with Cash on Delivery and bKash across 64 districts in Bangladesh.',
  };
}

export default async function HomePage() {
  const sections = await getHomepageSections();

  return <HomePageClient initialSections={sections} />;
}