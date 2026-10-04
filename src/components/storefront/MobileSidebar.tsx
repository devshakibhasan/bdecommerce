'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Home, Package, LayoutGrid, ShoppingCart, Truck,
  User, Settings, MapPin, Shield, LogOut, Search,
  Flame, Moon, Sun, Phone, MessageSquare, ChevronRight,
  Info, HelpCircle, RotateCcw, ExternalLink, Sparkles,
  ShoppingBag, CheckCircle2
} from 'lucide-react';
import { useUIStore, useAuthStore, useCartStore, useLocaleStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataCache } from '@/lib/dataCache';
import { t } from '@/lib/i18n';
import toast from 'react-hot-toast';

export function MobileSidebar() {
  const [mounted, setMounted] = useState(false);
  const { isSidebarOpen, closeSidebar, toggleSidebar, theme, toggleTheme } = useUIStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const rawCartItemCount = useCartStore((state) => state.getItemCount());
  const { locale, setLocale } = useLocaleStore();
  
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-catalog-v12'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/categories');
        const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
    initialData: () => DataCache.getInitialData('/categories') || [],
  });

  const rootCategories = (Array.isArray(categoriesData) && categoriesData.length > 0)
    ? categoriesData.filter((c: any) => !c.parent_id).map((c: any) => ({
        nameEn: c.name_en || c.name || 'Category',
        nameBn: c.name_bn || c.name_en || 'ক্যাটাগরি',
        slug: c.slug || String(c.id),
        icon: c.icon || (c.slug === 'men' ? '👔' : c.slug === 'women' ? '👗' : c.slug === 'kids' ? '🧸' : '🏷️'),
      }))
    : [
        { nameEn: 'Men', nameBn: 'পুরুষ', slug: 'men', icon: '👔' },
        { nameEn: 'Women', nameBn: 'মহিলা', slug: 'women', icon: '👗' },
        { nameEn: 'Kids', nameBn: 'বাচ্চা', slug: 'kids', icon: '🧸' },
      ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on outside click / touch on any device
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        closeSidebar();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isSidebarOpen, closeSidebar]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') toggleSidebar();
    };
    if (isSidebarOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen, toggleSidebar]);

  const handleSignOut = () => {
    closeSidebar();
    logout();
    toast.success('Signed out successfully');
    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      closeSidebar();
      router.push(`/products?search=${encodeURIComponent(mobileSearchQuery.trim())}`);
    }
  };

  const cartItemCount = mounted ? rawCartItemCount : 0;

  const coreNavLinks = [
    { href: '/', labelEn: 'Home', labelBn: 'হোম', icon: Home },
    { href: '/products', labelEn: 'All Products', labelBn: 'সকল পণ্য', icon: Package },
    { href: '/categories', labelEn: 'Categories', labelBn: 'ক্যাটাগরি', icon: LayoutGrid },
    { href: '/p/exclusive-offer', labelEn: 'Exclusive Deals', labelBn: 'এক্সক্লুসিভ অফার', icon: Flame, isHot: true },
    { href: '/track', labelEn: 'Track Order', labelBn: 'অর্ডার ট্র্যাকিং', icon: Truck },
    { href: '/cart', labelEn: 'Shopping Cart', labelBn: 'শপিং কার্ট', icon: ShoppingBag, badge: cartItemCount },
  ];

  const infoLinks = [
    { href: '/about', labelEn: 'About BD Shop', labelBn: 'আমাদের সম্পর্কে', icon: Info },
    { href: '/contact', labelEn: 'Contact & Support', labelBn: 'যোগাযোগ ও সাপোর্ট', icon: Phone },
    { href: '/faq', labelEn: 'FAQs', labelBn: 'সাধারণ প্রশ্নোত্তর', icon: HelpCircle },
    { href: '/returns', labelEn: 'Return Policy', labelBn: 'রিটার্ন পলিসি', icon: RotateCcw },
  ];

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Backdrop (100% Reliable Click/Touch Outside to Close) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm lg:hidden cursor-pointer touch-none"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeSidebar();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              closeSidebar();
            }}
          />

          {/* Slide-out Sidebar Drawer (Crisp High-Contrast in Light & Dark Mode) */}
          <motion.aside
            ref={sidebarRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed top-0 left-0 h-[100dvh] w-[310px] max-w-[86vw] z-[120] bg-white dark:bg-[#111622] text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden lg:hidden"
          >
            {/* Header / Brand Area */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-[#161d2a]/90 backdrop-blur-md flex-shrink-0">
              <Link href="/" onClick={closeSidebar} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-base shadow-md">
                  BD
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                    BD Shop
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase mt-0.5">
                    Mobile Storefront
                  </span>
                </div>
              </Link>

              <button
                onClick={closeSidebar}
                className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain">
              
              {/* User Account Capsule */}
              {mounted && isAuthenticated && user ? (
                <div className="bg-slate-50 dark:bg-[#161d2a] border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary dark:text-primary flex items-center justify-center font-black text-sm border border-primary/20">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-black text-xs text-slate-900 dark:text-white truncate">{user.name}</p>
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                    <Link
                      href="/account?tab=orders"
                      onClick={closeSidebar}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-200 hover:text-primary transition-colors shadow-xs"
                    >
                      <Package className="w-3.5 h-3.5 text-primary dark:text-primary" />
                      <span>Orders</span>
                    </Link>
                    <Link
                      href="/account?tab=addresses"
                      onClick={closeSidebar}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-200 hover:text-primary transition-colors shadow-xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-primary dark:text-primary" />
                      <span>Addresses</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-[#161d2a] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 text-center shadow-sm">
                  <div className="space-y-1">
                    <h3 className="font-black text-xs text-slate-900 dark:text-white">
                      {mounted && locale === 'bn' ? 'স্বাগতম বিডি শপে!' : 'Welcome to BD Shop!'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {mounted && locale === 'bn' ? 'লগইন করে আপনার অর্ডার ট্র্যাক করুন' : 'Sign in to manage orders & addresses'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/login"
                      onClick={closeSidebar}
                      className="py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black flex items-center justify-center shadow-md"
                    >
                      {mounted && locale === 'bn' ? 'লগইন' : 'Sign In'}
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeSidebar}
                      className="py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center shadow-xs"
                    >
                      {mounted && locale === 'bn' ? 'রেজিস্টার' : 'Register'}
                    </Link>
                  </div>
                </div>
              )}

              {/* Integrated Search Input */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  placeholder={mounted && locale === 'bn' ? 'পণ্য সার্চ করুন...' : 'Search products...'}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </form>

              {/* Core Store Links */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider px-2">
                  Navigation
                </span>
                {coreNavLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const label = mounted && locale === 'bn' ? link.labelBn : link.labelEn;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeSidebar}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-primary/10 dark:bg-primary/10/50 text-primary dark:text-primary border border-primary/30 dark:border-primary/80/80 shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <link.icon className={`w-4 h-4 ${link.isHot ? 'text-amber-500 fill-amber-500 animate-bounce' : 'text-primary dark:text-primary'}`} />
                        <span>{label}</span>
                      </div>
                      {link.badge !== undefined ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                          link.badge > 0 
                            ? 'bg-red-500 text-white' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {link.badge} {link.badge === 1 ? 'item' : 'items'}
                        </span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Quick Category Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">
                    Categories
                  </span>
                  <Link href="/categories" onClick={closeSidebar} className="text-[10px] text-primary dark:text-primary font-bold hover:underline">
                    All →
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {rootCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/products?category=${cat.slug}`}
                      onClick={closeSidebar}
                      className="p-2 bg-slate-50 dark:bg-[#161d2a] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center gap-1 hover:border-primary/40 transition-colors shadow-xs"
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-full">
                        {mounted && locale === 'bn' ? cat.nameBn : cat.nameEn}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Customer Care & Help */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider px-2">
                  Help & Support
                </span>
                {infoLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeSidebar}
                    className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{mounted && locale === 'bn' ? link.labelBn : link.labelEn}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400/60" />
                  </Link>
                ))}
              </div>

              {/* Admin Portal Shortcut (If Admin) */}
              {mounted && isAuthenticated && user?.is_admin && (
                <div className="pt-1">
                  <Link
                    href="/admin"
                    onClick={closeSidebar}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-black text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-amber-500" />
                      <span>Admin Management Portal</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Sign Out (If Authenticated) */}
              {mounted && isAuthenticated && (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{mounted && locale === 'bn' ? 'সাইন আউট করুন' : 'Sign Out'}</span>
                </button>
              )}

            </div>

            {/* Bottom Utilities (Theme, Language, Helpline) */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-[#161d2a]/95 backdrop-blur-md space-y-2.5 flex-shrink-0">
              
              <div>
                {/* Language Switcher */}
                <button
                  onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
                  className="w-full p-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-black flex items-center justify-center gap-2 text-slate-800 hover:border-primary cursor-pointer shadow-xs transition-colors"
                >
                  <span>🌐</span>
                  <span>{mounted && locale === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}</span>
                </button>
              </div>

              {/* WhatsApp Hotline */}
              <a
                href="https://wa.me/8801410737290"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-2xl bg-primary/10 dark:bg-primary/10/40 border border-primary/30 dark:border-primary/80/80 text-[11px] font-bold text-primary dark:text-primary/40 flex items-center justify-center gap-2 hover:bg-primary/20 dark:hover:bg-primary/10/60 transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-primary dark:text-primary" />
                <span>Helpline: +880 1410737290</span>
              </a>

            </div>

          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
