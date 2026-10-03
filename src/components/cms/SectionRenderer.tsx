'use client';

import { PageSection } from '@/types';
import { HeroSection } from './HeroSection';
import { CategoryGridSection } from './CategoryGridSection';
import { FlashSaleSection } from './FlashSaleSection';
import { ProductCarouselSection } from './ProductCarouselSection';
import { BannerSection } from './BannerSection';
import { TestimonialSection } from './TestimonialSection';
import { VideoSection } from './VideoSection';
import { RichTextSection } from './RichTextSection';
import { CustomHtmlSection } from './CustomHtmlSection';
import { DirectCheckoutFormSection } from './DirectCheckoutFormSection';
import { EveryCategoryProductsSection } from './EveryCategoryProductsSection';
import { FaqSection } from './FaqSection';
import { FeaturesSection } from './FeaturesSection';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    /* silenced */
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

interface SectionRendererProps {
  sections: PageSection[];
  productData?: any;
}

export function SectionRenderer({ sections, productData }: SectionRendererProps) {
  if (!sections || !Array.isArray(sections)) return null;

  const sortedSections = [...sections].sort((a, b) => (a.position || 0) - (b.position || 0));

  return (
    <div className="space-y-12">
      {sortedSections.map((section, idx) => {
        if (!section || section.is_visible === false) return null;

        const key = section.id || `sec-${idx}`;
        const config = (section.config && typeof section.config === 'object') ? section.config : {};

        let content: ReactNode = null;

        switch (section.type) {
          case 'hero':
          case 'hero_deal':
            content = <HeroSection config={config as any} />;
            break;
          case 'direct_checkout_form':
            content = <DirectCheckoutFormSection config={config as any} productData={productData} />;
            break;
          case 'category_grid':
            content = <CategoryGridSection config={config as any} />;
            break;
          case 'flash_sale':
            content = <FlashSaleSection config={config as any} />;
            break;
          case 'product_carousel':
          case 'product_grid':
          case 'product_showcase':
            content = (
              <ProductCarouselSection 
                config={{
                  ...config,
                  products: Array.isArray(config.products) ? config.products : (productData?.product ? [productData.product] : (productData?.id ? [productData] : undefined))
                }} 
              />
            );
            break;
          case 'every_category_products':
          case 'category_products':
          case 'category_showcase':
            content = <EveryCategoryProductsSection config={config as any} />;
            break;
          case 'banner':
            content = <BannerSection config={config as any} />;
            break;
          case 'testimonial':
            content = <TestimonialSection config={config as any} />;
            break;
          case 'video':
            content = <VideoSection config={config as any} />;
            break;
          case 'rich_text':
            content = <RichTextSection config={config as any} />;
            break;
          case 'faq':
            content = <FaqSection config={config as any} />;
            break;
          case 'features':
            content = <FeaturesSection config={config as any} />;
            break;
          case 'custom_html':
            content = <CustomHtmlSection config={config as any} />;
            break;
          default:
            return null;
        }

        return (
          <SectionErrorBoundary key={key}>
            {content}
          </SectionErrorBoundary>
        );
      })}
    </div>
  );
}
