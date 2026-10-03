import { Metadata } from 'next';
import { DynamicLandingPageClient } from './DynamicLandingPageClient';

type Props = {
  params: Promise<{ slug: string }>;
};

function getApiCandidates(slug: string): string[] {
  const envUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '') : null;
  const internalUrl = process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL.replace(/\/+$/, '') : null;
  const prodUrl = 'https://api.bdecommerce.inspireacademyy.com/api/v1';
  const localUrl = 'https://api.bdecommerce.inspireacademyy.com//api/v1';

  const bases = [internalUrl, envUrl, prodUrl, localUrl].filter(Boolean) as string[];
  const uniqueBases = Array.from(new Set(bases));

  const list: string[] = [];
  for (const b of uniqueBases) {
    list.push(`${b}/pages/${slug}`);
    list.push(`${b}/content/pages/${slug}`);
  }
  return list;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    if (!slug) {
      return { title: 'Special Offer Landing Page | BD Shop' };
    }

    const urls = getApiCandidates(slug);

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const json = await res.json();
          const page = json?.data?.data || json?.data;
          if (page) {
            return {
              title: `${page.seo_title || page.title_en} | BD Shop`,
              description: page.seo_description || 'Exclusive Campaign & Product Offer at BD Shop Bangladesh',
            };
          }
        }
      } catch (e) {}
    }
    if (slug === 'exclusive-offer') {
      return {
        title: 'Exclusive Deals & Mega Offers | BD Shop',
        description: 'Exclusive flash deals and limited-time mega offers with Fast Nationwide Delivery across Bangladesh.',
      };
    }
  } catch (err) {
    // Fallback
  }

  return {
    title: 'Special Offer Landing Page | BD Shop',
    description: 'Exclusive Bangladesh Enterprise E-Commerce Deals',
  };
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  if (!slug) {
    return <DynamicLandingPageClient initialPage={null} slug="" />;
  }

  let page: any = null;
  const urls = getApiCandidates(slug);

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        const pageData = json?.data?.data || json?.data;
        if (pageData) {
          page = pageData;
          break;
        }
      }
    } catch (e) {}
  }

  // Graceful fallback for the high-priority exclusive-offer navigation link
  if (!page && slug === 'exclusive-offer') {
    const prodBases = [
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, ''),
      'https://api.bdecommerce.inspireacademyy.com/api/v1',
      'https://api.bdecommerce.inspireacademyy.com//api/v1'
    ].filter(Boolean);

    for (const pb of prodBases) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const prodRes = await fetch(`${pb}/products/1`, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeout);
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          const prod = prodJson?.data?.data || prodJson?.data;
          if (prod) {
            page = {
              id: 999,
              title_en: 'Exclusive Deals & Mega Offers',
              title_bn: 'এক্সক্লুসিভ অফার ও মেগা ডিল',
              slug: 'exclusive-offer',
              page_type: 'single_product_funnel',
              product_id: prod.id,
              product: prod,
              discount_code: 'EIDMUBARAK',
              offer_headline_en: `Exclusive Special: ${prod.name_en}`,
              offer_headline_bn: `গ্র্যান্ড স্পেশাল অফার: ${prod.name_bn || prod.name_en}`,
              cta_button_text_en: 'Order Now - Cash on Delivery',
              cta_button_text_bn: 'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)',
              badge_text: '🔥 মেগা ধামাকা অফার - সীমিত সময়ের জন্য!',
              features: [
                '১০০% প্রিমিয়াম ও অরিজিনাল কোয়ালিটি নিশ্চিত',
                'ক্যাশ অন ডেলিভারি — সারাদেশে দ্রুত হোম ডেলিভারি',
                'পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধের সুবিধা',
                '৭ দিনের সহজ রিপ্লেসমেন্ট এবং ১০০% এক্সচেঞ্জ গ্যারান্টি'
              ],
              custom_price: Number(prod.base_price) * 0.95,
              free_delivery: false,
              show_order_form: true,
            };
            break;
          }
        }
      } catch (err) {}
    }
  }

  return <DynamicLandingPageClient initialPage={page} slug={slug} />;
}
