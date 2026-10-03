import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { SectionRenderer } from '@/components/cms/SectionRenderer';
import { SingleProductFunnel } from '@/components/storefront/SingleProductFunnel';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    if (!slug) {
      return { title: 'Special Offer Landing Page | BD Shop' };
    }

    const urls = [
      `http://127.0.0.1:8000/api/v1/pages/${slug}`,
      `http://localhost:8000/api/v1/pages/${slug}`
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const page = json?.data;
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
    return notFound();
  }

  let page: any = null;

  const urls = [
    `http://127.0.0.1:8000/api/v1/pages/${slug}`,
    `http://localhost:8000/api/v1/pages/${slug}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          page = json.data;
          break;
        }
      }
    } catch (e) {}
  }

  // Graceful fallback for the high-priority exclusive-offer navigation link
  if (!page && slug === 'exclusive-offer') {
    try {
      const prodRes = await fetch('http://127.0.0.1:8000/api/v1/products/1', { cache: 'no-store' });
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        const prod = prodJson?.data;
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
        }
      }
    } catch (err) {}
  }

  if (!page) {
    return notFound();
  }

  // If this is a Single/Multi-Product Sales Funnel Landing Page (or has product/page_products attached)
  if (
    page.page_type === 'single_product_funnel' ||
    page.page_type === 'multi_product_funnel' ||
    page.product ||
    (page.page_products && page.page_products.length > 0)
  ) {
    return <SingleProductFunnel pageData={page} />;
  }

  // Standard CMS / Campaign Landing Page with Dynamic Sections
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-muted/40 py-8 border-b">
        <div className="container mx-auto px-4 text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">{page.title_en}</h1>
          {page.title_bn && (
            <p className="text-sm font-semibold text-muted-foreground">{page.title_bn}</p>
          )}
        </div>
      </div>
      <SectionRenderer sections={page.sections || []} />
    </div>
  );
}
