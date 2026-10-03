'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocaleStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Phone, Mail, MapPin, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { DataCache } from '@/lib/dataCache';
import { useQuery } from '@tanstack/react-query';

export function Footer() {
  const { locale } = useLocaleStore();
  
  const { data: settingsData } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const res: any = await api.get('/settings');
      return res?.data?.data || res?.data || {};
    },
    initialData: () => DataCache.getInitialData('/settings') || {},
    staleTime: 60 * 60 * 1000,
  });
  const settings = settingsData || null;

  const siteName = settings?.header_logo_text || settings?.site_name || 'BD Shop';
  const aboutText = locale === 'bn' 
    ? (settings?.footer_about_bn || 'বাংলাদেশের শীর্ষস্থানীয় নির্ভরযোগ্য পোশাকের ই-কমার্স প্ল্যাটফর্ম। সেরা মানের ছেলেদের, মেয়েদের ও বাচ্চাদের পোশাক সরাসরি সারাদেশে পৌঁছে দেওয়া হয়।')
    : (settings?.footer_about_en || 'Leading Bangladesh Enterprise Clothing Store. High quality Men, Women, Kids fashion, shoes, and accessories delivered swiftly across the nation.');
  
  const phone = settings?.footer_phone || settings?.phone || '+880 1410737290';
  const email = settings?.footer_email || settings?.email || 'support@bdecommerce.com';
  const address = settings?.footer_address || settings?.address || 'Gulshan-2, Dhaka-1212, Bangladesh';
  const copyright = settings?.footer_copyright || `© ${new Date().getFullYear()} ${siteName} Ltd. All rights reserved. Engineered for Bangladesh Market.`;

  const socialLinks = settings?.footer_social_links || [
    { name: 'Facebook', url: 'https://facebook.com' },
    { name: 'Instagram', url: 'https://instagram.com' },
    { name: 'YouTube', url: 'https://youtube.com' },
    { name: 'WhatsApp', url: 'https://wa.me/8801410737290' },
  ];

  const quickLinks = settings?.footer_quick_links || [
    { name: 'All Products', href: '/products' },
    { name: 'Categories', href: '/categories' },
    { name: 'Shopping Cart', href: '/cart' },
    { name: 'Track Order', href: '/track' },
    { name: 'About Us', href: '/about' },
  ];

  const customerServiceLinks = settings?.footer_customer_service_links || [
    { name: 'Help & Contact Us', href: '/contact' },
    { name: 'Frequently Asked Questions', href: '/faq' },
    { name: 'Return & Replacement Policy', href: '/returns' },
    { name: 'Privacy & Data Security', href: '/privacy' },
  ];

  const valueBadges = settings?.footer_value_badges || [
    { title: '64-District Delivery', subtitle: 'Steadfast, Pathao & RedX courier network', icon: 'truck' },
    { title: '100% Authentic Guarantee', subtitle: 'Cash on Delivery & Secure MFS Escrow', icon: 'shield' },
    { title: '7-Day Return Policy', subtitle: 'Hassle-free replacements & quick refunds', icon: 'rotate' },
  ];

  return (
    <footer className="mt-16 container mx-auto px-4 pb-12">
      {/* Top Value Badges Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {valueBadges.map((badge: any, idx: number) => {
          const Icon = idx === 0 ? Truck : idx === 1 ? ShieldCheck : RotateCcw;
          const colorClass = idx === 0 ? 'text-primary' : idx === 1 ? 'text-green-600' : 'text-amber-500';
          return (
            <div key={idx} className="neu-flat rounded-3xl p-6 flex items-center gap-4">
              <div className={`w-12 h-12 neu-inset rounded-2xl flex items-center justify-center ${colorClass} flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{badge.title}</h4>
                <p className="text-xs text-muted-foreground">{badge.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Footer Body */}
      <div className="neu-raised rounded-3xl p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 neu-inset rounded-2xl flex items-center justify-center text-primary font-black text-lg">
                {siteName.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-black text-2xl text-foreground">{siteName}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {aboutText}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {socialLinks.map((net: any) => (
                <a 
                  key={net.name} 
                  href={net.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu-btn px-3 py-1.5 rounded-xl text-[11px] font-bold text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                >
                  {net.name}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-foreground uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              {quickLinks.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-foreground uppercase tracking-wider">Customer Care</h4>
            <ul className="space-y-2 text-xs">
              {customerServiceLinks.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details & MFS */}
          <div className="space-y-4">
            <h4 className="font-black text-sm text-foreground uppercase tracking-wider">Official Helplines</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono font-semibold">{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{address}</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-foreground mb-2">Supported MFS & Payments:</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="neu-inset px-2.5 py-1 rounded-xl text-[10px] font-bold text-pink-600">bKash</span>
                <span className="neu-inset px-2.5 py-1 rounded-xl text-[10px] font-bold text-orange-600">Nagad</span>
                <span className="neu-inset px-2.5 py-1 rounded-xl text-[10px] font-bold text-blue-600">SSLCommerz</span>
                <span className="neu-inset px-2.5 py-1 rounded-xl text-[10px] font-bold text-green-700">COD</span>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>{copyright}</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/returns" className="hover:underline">Terms & Refunds</Link>
            <Link href="/admin" className="text-primary font-bold hover:underline">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}