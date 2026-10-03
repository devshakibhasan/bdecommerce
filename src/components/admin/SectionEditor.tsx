'use client';

import { useState } from 'react';
import { Modal } from '@/components/admin/Modal';
import { 
  Plus, Trash2, Star, HelpCircle, Image, Sparkles, 
  MessageSquare, Sliders, ChevronDown, AlignLeft, AlignCenter, AlignRight,
  ShieldCheck, Truck, Clock, Layers, Video, Package, Wand2
} from 'lucide-react';

export interface Section {
  id: string | number;
  type: string;
  config: any;
  is_visible: boolean;
}

export interface SectionEditorProps {
  section: Section;
  onSave: (section: Section) => void;
  onClose: () => void;
}

/**
 * Strips HTML tags and cleanly formats text into human-readable plain text.
 * Also extracts <h1>/<h2>/<h3> headings if present into title.
 */
export function cleanHtmlToDirectText(htmlStr: string): { title?: string; text: string } {
  if (!htmlStr || typeof htmlStr !== 'string') return { text: '' };
  
  const trimmed = htmlStr.trim();
  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return { text: trimmed };
  }

  // Extract h1, h2, or h3 if present
  let title: string | undefined = undefined;
  const hMatch = trimmed.match(/<h[1-4][^>]*>(.*?)<\/h[1-4]>/i);
  if (hMatch && hMatch[1]) {
    title = hMatch[1].replace(/<[^>]+>/g, '').trim();
  }

  // Remove the heading tags from the body so it doesn't duplicate
  let body = trimmed.replace(/<h[1-4][^>]*>.*?<\/h[1-4]>/gi, '');

  body = body
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '') // strip all other html tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { title, text: body };
}

export function SectionEditor({ section, onSave, onClose }: SectionEditorProps) {
  const [type, setType] = useState(section.type);
  const [config, setConfig] = useState<any>(() => {
    const initial = { ...(section.config || {}) };
    // Automatically sanitize and strip any existing raw HTML from rich_text
    if (section.type === 'rich_text') {
      if (initial.content_en) {
        const parsed = cleanHtmlToDirectText(initial.content_en);
        if (!initial.title_en && parsed.title) {
          initial.title_en = parsed.title;
        }
        initial.content_en = parsed.text;
      }
      if (initial.content_bn) {
        const parsedBn = cleanHtmlToDirectText(initial.content_bn);
        if (!initial.title_bn && parsedBn.title) {
          initial.title_bn = parsedBn.title;
        }
        initial.content_bn = parsedBn.text;
      }
    }
    return initial;
  });
  const [showJsonFallback, setShowJsonFallback] = useState(false);

  const handleSave = () => {
    // Ensure rich_text is always saved as clean direct text without raw HTML tags
    const cleanConfig = { ...config };
    if (type === 'rich_text') {
      if (cleanConfig.content_en) {
        const pEn = cleanHtmlToDirectText(cleanConfig.content_en);
        if (!cleanConfig.title_en && pEn.title) cleanConfig.title_en = pEn.title;
        cleanConfig.content_en = pEn.text;
      }
      if (cleanConfig.content_bn) {
        const pBn = cleanHtmlToDirectText(cleanConfig.content_bn);
        if (!cleanConfig.title_bn && pBn.title) cleanConfig.title_bn = pBn.title;
        cleanConfig.content_bn = pBn.text;
      }
    }
    onSave({ ...section, type, config: cleanConfig });
  };

  const updateField = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  // Helper for Testimonials array
  const testimonials = Array.isArray(config.testimonials) ? config.testimonials : [];
  const addTestimonial = () => {
    const newItem = {
      name: '',
      quote_en: '',
      quote_bn: '',
      rating: 5,
    };
    setConfig((prev: any) => ({
      ...prev,
      testimonials: [...testimonials, newItem]
    }));
  };
  const updateTestimonial = (index: number, field: string, val: any) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], [field]: val };
    setConfig((prev: any) => ({ ...prev, testimonials: updated }));
  };
  const removeTestimonial = (index: number) => {
    setConfig((prev: any) => ({
      ...prev,
      testimonials: testimonials.filter((_: any, i: number) => i !== index)
    }));
  };

  // Helper for FAQ items
  const faqItems = Array.isArray(config.items) ? config.items : [];
  const addFaqItem = () => {
    const newItem = {
      question_en: '',
      question_bn: '',
      answer_en: '',
      answer_bn: '',
    };
    setConfig((prev: any) => ({
      ...prev,
      items: [...faqItems, newItem]
    }));
  };
  const updateFaqItem = (index: number, field: string, val: any) => {
    const updated = [...faqItems];
    updated[index] = { ...updated[index], [field]: val };
    setConfig((prev: any) => ({ ...prev, items: updated }));
  };
  const removeFaqItem = (index: number) => {
    setConfig((prev: any) => ({
      ...prev,
      items: faqItems.filter((_: any, i: number) => i !== index)
    }));
  };

  // Helper for Feature Highlights
  const featureItems = Array.isArray(config.items) ? config.items : [];
  const addFeatureItem = () => {
    const newItem = {
      title_en: '',
      title_bn: '',
      desc_en: '',
      desc_bn: '',
    };
    setConfig((prev: any) => ({
      ...prev,
      items: [...featureItems, newItem]
    }));
  };
  const updateFeatureItem = (index: number, field: string, val: any) => {
    const updated = [...featureItems];
    updated[index] = { ...updated[index], [field]: val };
    setConfig((prev: any) => ({ ...prev, items: updated }));
  };
  const removeFeatureItem = (index: number) => {
    setConfig((prev: any) => ({
      ...prev,
      items: featureItems.filter((_: any, i: number) => i !== index)
    }));
  };

  // Helper for Banner images
  const bannerItems = Array.isArray(config.items) ? config.items : [];
  const addBannerItem = () => {
    const newItem = {
      id: `banner-${Date.now()}`,
      image_url: '',
      link: '/products',
      title: '',
    };
    setConfig((prev: any) => ({
      ...prev,
      items: [...bannerItems, newItem]
    }));
  };
  const updateBannerItem = (index: number, field: string, val: any) => {
    const updated = [...bannerItems];
    updated[index] = { ...updated[index], [field]: val };
    setConfig((prev: any) => ({ ...prev, items: updated }));
  };
  const removeBannerItem = (index: number) => {
    setConfig((prev: any) => ({
      ...prev,
      items: bannerItems.filter((_: any, i: number) => i !== index)
    }));
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={`Configure Section: ${type.replace(/_/g, ' ').toUpperCase()}`} 
      size="lg" 
      footer={
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button type="button" onClick={onClose} className="neu-btn-secondary px-5 py-2.5 text-xs font-bold cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="neu-btn-primary px-6 py-2.5 text-xs font-bold cursor-pointer">
            Save Section
          </button>
        </div>
      }
    >
      <div className="space-y-5 py-1">
        {/* Section Type Selector */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">Section Type</label>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)} 
            className="neu-input w-full font-bold text-xs px-4 py-3 rounded-2xl"
          >
            <option value="rich_text">Custom Rich Story / Text Content (Direct Text)</option>
            <option value="hero">Hero Deal Banner (Heading, Subtitle, CTA Button & Image)</option>
            <option value="testimonial">Customer Reviews & Testimonials (Quotes & Ratings)</option>
            <option value="faq">FAQ Accordion (Questions & Answers)</option>
            <option value="features">Why Shop With Us / Features List (Icons & Guarantees)</option>
            <option value="banner">Promo Banner Slider (Image & Links)</option>
            <option value="category_grid">Category Grid (Visual 64-District Categories)</option>
            <option value="product_carousel">Product Carousel (Trending Products)</option>
            <option value="flash_sale">Flash Sale Countdown Banner</option>
            <option value="video">Video Showcase (YouTube / Video Embed)</option>
            <option value="direct_checkout_form">Direct Express Checkout Form</option>
            <option value="custom_html">Custom HTML / Developer Code</option>
          </select>
        </div>

        {/* Dynamic User-Friendly Fields Based On Type */}
        <div className="neu-card-inset p-4 sm:p-6 rounded-3xl space-y-5">

          {/* 1. RICH TEXT / DIRECT TEXT */}
          {type === 'rich_text' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2 text-xs font-black text-primary">
                  <AlignLeft className="w-4 h-4" />
                  <span>Direct Text Story & Information</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  ✓ 100% Direct Text (No HTML Needed)
                </span>
              </div>

              {/* Headings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Section Heading / Title (English) *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. About BD E-Commerce"
                    value={config.title_en || ''} 
                    onChange={e => updateField('title_en', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Section Heading / Title (বাংলা / Bengali)
                  </label>
                  <input 
                    type="text" 
                    placeholder="যেমনঃ বিডি ই-কমার্স সম্পর্কে"
                    value={config.title_bn || ''} 
                    onChange={e => updateField('title_bn', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold" 
                  />
                </div>
              </div>

              {/* English Direct Story Text Box */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label className="text-xs font-bold text-foreground">
                    Story / Text Content (English) — Direct Text
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (config.content_en) {
                        const cleaned = cleanHtmlToDirectText(config.content_en);
                        if (!config.title_en && cleaned.title) updateField('title_en', cleaned.title);
                        updateField('content_en', cleaned.text);
                      }
                    }}
                    className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    title="Remove any HTML tags and clean up paragraphs"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Clean to Plain Text</span>
                  </button>
                </div>
                <textarea 
                  rows={6}
                  placeholder="Write your story or information here. Separate paragraphs with an empty line. Never use <h2> or <p> tags."
                  value={config.content_en || ''} 
                  onChange={e => updateField('content_en', e.target.value)}
                  className="neu-input w-full p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed resize-y" 
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  💡 Type normal text paragraphs. Double line-breaks automatically become clean styled paragraphs on the page.
                </p>
              </div>

              {/* Bengali Direct Story Text Box */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label className="text-xs font-bold text-foreground">
                    Story / Text Content (বাংলা) — সরাসরি লিখুন
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (config.content_bn) {
                        const cleaned = cleanHtmlToDirectText(config.content_bn);
                        if (!config.title_bn && cleaned.title) updateField('title_bn', cleaned.title);
                        updateField('content_bn', cleaned.text);
                      }
                    }}
                    className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    title="Remove any HTML tags"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>ট্যাগ মুছে ফেলুন</span>
                  </button>
                </div>
                <textarea 
                  rows={6}
                  placeholder="এখানে আপনার বিবরণ বা তথ্য লিখুন। সাধারণ টেক্সট লিখুন, কোনো HTML ট্যাগ লাগবে না..."
                  value={config.content_bn || ''} 
                  onChange={e => updateField('content_bn', e.target.value)}
                  className="neu-input w-full p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed resize-y" 
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  💡 সরাসরি সাধারণ টেক্সট লিখুন। প্যারাগ্রাফের মাঝে এক লাইন ফাঁকা রাখুন।
                </p>
              </div>

              {/* Alignment & Width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Text Alignment</label>
                  <select 
                    value={config.align || 'left'} 
                    onChange={e => updateField('align', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold"
                  >
                    <option value="left">Left Aligned (বাম থেকে শুরু)</option>
                    <option value="center">Centered (মাঝখানে)</option>
                    <option value="right">Right Aligned (ডান থেকে)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Content Width</label>
                  <select 
                    value={config.max_width || 'lg'} 
                    onChange={e => updateField('max_width', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold"
                  >
                    <option value="md">Narrow (রিডিং ফোকাস)</option>
                    <option value="lg">Standard Wide (স্ট্যান্ডার্ড)</option>
                    <option value="full">Full Width (সম্পূর্ণ চওড়া)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. HERO BANNER */}
          {(type === 'hero' || type === 'hero_deal') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-primary border-b pb-2">
                <Image className="w-4 h-4" />
                <span>Hero Banner Content & CTA</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Heading (English)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Welcome to BD Shop"
                    value={config.heading_en || config.title_en || ''} 
                    onChange={e => updateField('heading_en', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Heading (বাংলা)</label>
                  <input 
                    type="text" 
                    placeholder="যেমনঃ বিডি শপে আপনাকে স্বাগতম"
                    value={config.heading_bn || config.title_bn || ''} 
                    onChange={e => updateField('heading_bn', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Subtitle / Description (English)</label>
                  <input 
                    type="text" 
                    placeholder="Fastest Delivery across all 64 districts in Bangladesh"
                    value={config.subtitle_en || ''} 
                    onChange={e => updateField('subtitle_en', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Subtitle / Description (বাংলা)</label>
                  <input 
                    type="text" 
                    placeholder="সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি"
                    value={config.subtitle_bn || ''} 
                    onChange={e => updateField('subtitle_bn', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Background Image URL</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/... or /images/banner.jpg"
                  value={config.background_image || config.bg_image || ''} 
                  onChange={e => {
                    updateField('background_image', e.target.value);
                    updateField('bg_image', e.target.value);
                  }}
                  className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-mono" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Button Text (English)</label>
                  <input 
                    type="text" 
                    placeholder="Shop Collection"
                    value={config.button_text_en || ''} 
                    onChange={e => updateField('button_text_en', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Button Text (বাংলা)</label>
                  <input 
                    type="text" 
                    placeholder="এখনই কিনুন"
                    value={config.button_text_bn || ''} 
                    onChange={e => updateField('button_text_bn', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Button Target Link</label>
                  <input 
                    type="text" 
                    placeholder="/products"
                    value={config.button_link || '/products'} 
                    onChange={e => updateField('button_link', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-mono" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. TESTIMONIALS / CUSTOMER REVIEWS */}
          {(type === 'testimonial' || type === 'testimonials' || type === 'reviews') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-xs font-black text-primary">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>Customer Reviews & Testimonials</span>
                </div>
                <button
                  type="button"
                  onClick={addTestimonial}
                  className="clay-btn px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1 text-primary cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Review</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Section Title (English)</label>
                  <input 
                    type="text" 
                    placeholder="What Our Customers Say"
                    value={config.title_en || ''} 
                    onChange={e => updateField('title_en', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Section Title (বাংলা)</label>
                  <input 
                    type="text" 
                    placeholder="আমাদের সন্তুষ্ট গ্রাহকদের মতামত"
                    value={config.title_bn || ''} 
                    onChange={e => updateField('title_bn', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
              </div>

              {testimonials.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border-2 border-dashed rounded-2xl">
                  No custom reviews added yet. Click &quot;Add Review&quot; above to create customer social proof.
                </div>
              ) : (
                <div className="space-y-3">
                  {testimonials.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl clay-card space-y-3 border border-border/60">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-primary">Review #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeTestimonial(idx)}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10 cursor-pointer"
                          title="Remove Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Customer Name & Location</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Saiful Islam (Dhanmondi, Dhaka)"
                            value={item.name || ''} 
                            onChange={e => updateTestimonial(idx, 'name', e.target.value)}
                            className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Rating (Stars)</label>
                          <select 
                            value={item.rating || 5} 
                            onChange={e => updateTestimonial(idx, 'rating', Number(e.target.value))}
                            className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold"
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
                            <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                            <option value={3}>⭐⭐⭐ 3 Stars</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Review Quote (English)</label>
                          <textarea 
                            rows={2}
                            placeholder="Great quality and fast 24h delivery!"
                            value={item.quote_en || item.quote || ''} 
                            onChange={e => updateTestimonial(idx, 'quote_en', e.target.value)}
                            className="neu-input w-full p-3 rounded-xl text-xs resize-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Review Quote (বাংলা)</label>
                          <textarea 
                            rows={2}
                            placeholder="অসাধারণ কোয়ালিটি এবং দ্রুত ডেলিভারি পেয়েছি।"
                            value={item.quote_bn || ''} 
                            onChange={e => updateTestimonial(idx, 'quote_bn', e.target.value)}
                            className="neu-input w-full p-3 rounded-xl text-xs resize-none" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. FAQ ACCORDION */}
          {type === 'faq' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-xs font-black text-primary">
                  <HelpCircle className="w-4 h-4" />
                  <span>FAQ Questions & Answers</span>
                </div>
                <button
                  type="button"
                  onClick={addFaqItem}
                  className="clay-btn px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1 text-primary cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Section Title (English)</label>
                  <input 
                    type="text" 
                    placeholder="Frequently Asked Questions"
                    value={config.title_en || ''} 
                    onChange={e => updateField('title_en', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Section Title (বাংলা)</label>
                  <input 
                    type="text" 
                    placeholder="সাধারণ জিজ্ঞাসা (FAQ)"
                    value={config.title_bn || ''} 
                    onChange={e => updateField('title_bn', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
              </div>

              {faqItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border-2 border-dashed rounded-2xl">
                  No custom FAQ items added yet. Click &quot;Add Question&quot; to add interactive Q&As.
                </div>
              ) : (
                <div className="space-y-3">
                  {faqItems.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl clay-card space-y-3 border border-border/60">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-primary">Question #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeFaqItem(idx)}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10 cursor-pointer"
                          title="Remove Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Question (English)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. How long does delivery take?"
                            value={item.question_en || item.q_en || ''} 
                            onChange={e => updateFaqItem(idx, 'question_en', e.target.value)}
                            className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Question (বাংলা)</label>
                          <input 
                            type="text" 
                            placeholder="যেমনঃ সারাদেশে ডেলিভারি হতে কত দিন সময় লাগে?"
                            value={item.question_bn || item.q_bn || ''} 
                            onChange={e => updateFaqItem(idx, 'question_bn', e.target.value)}
                            className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Answer (English)</label>
                          <textarea 
                            rows={3}
                            placeholder="Inside Dhaka 24 hours, outside Dhaka 48-72 hours via Steadfast."
                            value={item.answer_en || item.a_en || ''} 
                            onChange={e => updateFaqItem(idx, 'answer_en', e.target.value)}
                            className="neu-input w-full p-3.5 rounded-xl text-xs resize-none leading-relaxed" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Answer (বাংলা)</label>
                          <textarea 
                            rows={3}
                            placeholder="ঢাকার ভিতরে ২৪ ঘণ্টা এবং ঢাকার বাইরে ৪৮-৭২ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়।"
                            value={item.answer_bn || item.a_bn || ''} 
                            onChange={e => updateFaqItem(idx, 'answer_bn', e.target.value)}
                            className="neu-input w-full p-3.5 rounded-xl text-xs resize-none leading-relaxed" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. WHY CHOOSE US / FEATURES LIST */}
          {type === 'features' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-xs font-black text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Feature Highlights & Guarantees</span>
                </div>
                <button
                  type="button"
                  onClick={addFeatureItem}
                  className="clay-btn px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1 text-primary cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Feature</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Section Title (English)</label>
                  <input 
                    type="text" 
                    placeholder="Why Shop With Us?"
                    value={config.title_en || ''} 
                    onChange={e => updateField('title_en', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Section Title (বাংলা)</label>
                  <input 
                    type="text" 
                    placeholder="কেন আমাদের থেকে কেনাকাটা করবেন?"
                    value={config.title_bn || ''} 
                    onChange={e => updateField('title_bn', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
              </div>

              {featureItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border-2 border-dashed rounded-2xl">
                  No features added yet. Click &quot;Add Feature&quot; to highlight guarantees (e.g. COD, Fast Delivery).
                </div>
              ) : (
                <div className="space-y-3">
                  {featureItems.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl clay-card space-y-3 border border-border/60">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-primary">Feature #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeFeatureItem(idx)}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10 cursor-pointer"
                          title="Remove Feature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Feature Title (English)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Nationwide Fast Delivery"
                            value={item.title_en || ''} 
                            onChange={e => updateFeatureItem(idx, 'title_en', e.target.value)}
                            className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Feature Title (বাংলা)</label>
                          <input 
                            type="text" 
                            placeholder="যেমনঃ সারাদেশে দ্রুততম হোম ডেলিভারি"
                            value={item.title_bn || ''} 
                            onChange={e => updateFeatureItem(idx, 'title_bn', e.target.value)}
                            className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Description (English)</label>
                          <input 
                            type="text" 
                            placeholder="Doorstep delivery across all 64 districts in 24-72 hours."
                            value={item.desc_en || ''} 
                            onChange={e => updateFeatureItem(idx, 'desc_en', e.target.value)}
                            className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Description (বাংলা)</label>
                          <input 
                            type="text" 
                            placeholder="৬৪টি জেলায় ২৪ থেকে ৭২ ঘণ্টার মধ্যে ডেলিভারি সুবিধা।"
                            value={item.desc_bn || ''} 
                            onChange={e => updateFeatureItem(idx, 'desc_bn', e.target.value)}
                            className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. BANNER SLIDER / GRID */}
          {(type === 'banner' || type === 'banner_grid') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-xs font-black text-primary">
                  <Image className="w-4 h-4" />
                  <span>Promo Banner Slider</span>
                </div>
                <button
                  type="button"
                  onClick={addBannerItem}
                  className="clay-btn px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1 text-primary cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Banner Image</span>
                </button>
              </div>

              {bannerItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border-2 border-dashed rounded-2xl">
                  No banners configured yet. Click &quot;Add Banner Image&quot; to specify image slides.
                </div>
              ) : (
                <div className="space-y-3">
                  {bannerItems.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl clay-card space-y-3 border border-border/60">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-primary">Banner #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeBannerItem(idx)}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10 cursor-pointer"
                          title="Remove Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Banner Image URL *</label>
                          <input 
                            type="url" 
                            placeholder="https://images.unsplash.com/... or /images/banner.jpg"
                            value={item.image_url || ''} 
                            onChange={e => updateBannerItem(idx, 'image_url', e.target.value)}
                            className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-foreground mb-1">Click Target Link</label>
                          <input 
                            type="text" 
                            placeholder="/products or /p/exclusive-offer"
                            value={item.link || '/products'} 
                            onChange={e => updateBannerItem(idx, 'link', e.target.value)}
                            className="neu-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. CATEGORY GRID */}
          {type === 'category_grid' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-primary border-b pb-2">
                <Layers className="w-4 h-4" />
                <span>Shop by Category Grid Settings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Section Title (English)</label>
                  <input 
                    type="text" 
                    placeholder="Browse Popular Categories"
                    value={config.title_en || ''} 
                    onChange={e => updateField('title_en', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Section Title (বাংলা)</label>
                  <input 
                    type="text" 
                    placeholder="জনপ্রিয় ক্যাটাগরি ব্রাউজ করুন"
                    value={config.title_bn || ''} 
                    onChange={e => updateField('title_bn', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. PRODUCT CAROUSEL / GRID */}
          {(type === 'product_carousel' || type === 'product_grid' || type === 'product_showcase') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-primary border-b pb-2">
                <Package className="w-4 h-4" />
                <span>Product Carousel / Highlights</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Section Title (English)</label>
                  <input 
                    type="text" 
                    placeholder="Trending & Featured Products"
                    value={config.title_en || ''} 
                    onChange={e => updateField('title_en', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Section Title (বাংলা)</label>
                  <input 
                    type="text" 
                    placeholder="ট্রেন্ডিং ও ফিচার্ড পণ্য"
                    value={config.title_bn || ''} 
                    onChange={e => updateField('title_bn', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Max Products to Display</label>
                  <input 
                    type="number" 
                    placeholder="12"
                    value={config.limit || 12} 
                    onChange={e => updateField('limit', parseInt(e.target.value) || 12)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">View All Link</label>
                  <input 
                    type="text" 
                    placeholder="/products"
                    value={config.view_all_link || '/products'} 
                    onChange={e => updateField('view_all_link', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-mono" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 9. FLASH SALE */}
          {type === 'flash_sale' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-primary border-b pb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Grand Flash Sale Banner</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Flash Sale Title (English)</label>
                  <input 
                    type="text" 
                    placeholder="Grand Eid Flash Sale ⚡"
                    value={config.title_en || ''} 
                    onChange={e => updateField('title_en', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Flash Sale Title (বাংলা)</label>
                  <input 
                    type="text" 
                    placeholder="গ্র্যান্ড ঈদ মেগা ফ্ল্যাশ সেল ⚡"
                    value={config.title_bn || ''} 
                    onChange={e => updateField('title_bn', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10. VIDEO */}
          {type === 'video' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-primary border-b pb-2">
                <Video className="w-4 h-4" />
                <span>Video Showcase</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Video Title (English)</label>
                <input 
                  type="text" 
                  placeholder="Watch Product Demonstration"
                  value={config.title_en || ''} 
                  onChange={e => updateField('title_en', e.target.value)}
                  className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">YouTube / Video URL *</label>
                  <input 
                    type="url" 
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={config.video_url || ''} 
                    onChange={e => updateField('video_url', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Cover Thumbnail Image URL</label>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/..."
                    value={config.thumbnail_url || ''} 
                    onChange={e => updateField('thumbnail_url', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-mono" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 11. DIRECT EXPRESS CHECKOUT FORM */}
          {type === 'direct_checkout_form' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-primary border-b pb-2">
                <Truck className="w-4 h-4" />
                <span>Direct Express Checkout Form</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Form Headline (বাংলা)</label>
                  <input 
                    type="text" 
                    value={config.title_bn || ''} 
                    placeholder="অর্ডার করতে নিচের ফর্মটি পূরণ করুন"
                    onChange={e => updateField('title_bn', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Form Headline (English)</label>
                  <input 
                    type="text" 
                    value={config.title_en || ''} 
                    placeholder="Complete Your Order Below"
                    onChange={e => updateField('title_en', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-bold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">CTA Button Text</label>
                  <input 
                    type="text" 
                    value={config.button_text || ''} 
                    placeholder="Confirm Order (Cash on Delivery)"
                    onChange={e => updateField('button_text', e.target.value)}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Promo Coupon Code</label>
                  <input 
                    type="text" 
                    value={config.discount_code || ''} 
                    placeholder="e.g. EID2026"
                    onChange={e => updateField('discount_code', e.target.value.toUpperCase())}
                    className="neu-input w-full px-4 py-3 rounded-2xl text-xs font-mono font-bold uppercase" 
                  />
                </div>
              </div>

              <label className="flex items-center justify-between p-4 neu-card-inset rounded-2xl cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-foreground block">Free Delivery Active</span>
                  <span className="text-[10px] text-muted-foreground">Sets delivery fee to ৳0 for this checkout</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={Boolean(config.free_delivery)} 
                  onChange={e => updateField('free_delivery', e.target.checked)}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>
            </div>
          )}

          {/* 12. CUSTOM HTML */}
          {type === 'custom_html' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-foreground mb-1">Custom HTML Content</label>
              <textarea 
                rows={6}
                value={config.html || ''} 
                onChange={e => updateField('html', e.target.value)}
                className="neu-input w-full p-4 rounded-2xl font-mono text-xs" 
                placeholder="<div>Your custom HTML code here...</div>"
              />
            </div>
          )}

          {/* Developer View / JSON accordion (Collapsible, never forced) */}
          <div className="pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => setShowJsonFallback(prev => !prev)}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showJsonFallback ? 'rotate-180' : ''}`} />
              <span>Developer JSON View (Optional)</span>
            </button>

            {showJsonFallback && (
              <div className="mt-2 space-y-1">
                <textarea 
                  value={JSON.stringify(config, null, 2)} 
                  onChange={e => {
                    try { 
                      const parsed = JSON.parse(e.target.value);
                      setConfig(parsed);
                    } catch (err) { /* ignore invalid json while typing */ }
                  }}
                  className="neu-input w-full p-4 rounded-2xl font-mono text-[11px] h-36" 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
