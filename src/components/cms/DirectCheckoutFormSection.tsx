'use client';

import { UnifiedCheckout } from '@/components/checkout/UnifiedCheckout';

interface DirectCheckoutFormSectionProps {
  config: {
    title_en?: string;
    title_bn?: string;
    subtitle_en?: string;
    subtitle_bn?: string;
    button_text_en?: string;
    button_text_bn?: string;
    product_id?: number;
    product?: any;
    discount_code?: string;
    custom_price?: number;
    free_delivery?: boolean;
    page_products?: any[];
  };
  productData?: any;
}

export function DirectCheckoutFormSection({ config, productData }: DirectCheckoutFormSectionProps) {
  return (
    <section id="direct-checkout-section" className="py-8 sm:py-12 bg-slate-50/50 dark:bg-slate-950/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <UnifiedCheckout 
          mode="landing" 
          config={config} 
          productData={productData} 
          pageData={{
            ...config,
            title_en: config?.title_en,
            title_bn: config?.title_bn,
            discount_code: config?.discount_code,
            custom_price: config?.custom_price,
            free_delivery: config?.free_delivery,
            page_products: config?.page_products || productData?.page_products,
          }} 
        />
      </div>
    </section>
  );
}
