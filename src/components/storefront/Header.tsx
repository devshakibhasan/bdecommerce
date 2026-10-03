'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, Search, ShoppingBag, ShoppingCart, User, X, Moon, Sun, 
  Package, Truck, Settings, MapPin, Shield, LogOut, 
  ChevronDown, Flame, Phone, ArrowRight, Loader2, Sparkles,
  CheckCircle2, HelpCircle, Heart, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore, useCartStore, useLocaleStore, useAuthStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { DataCache } from '@/lib/dataCache';
import { useQuery } from '@tanstack/react-query';

const POPULAR_SEARCH_TAGS = [
  'Summer Collection',
  'Men Denim',
  'Women Tops',
  'Kids Wear'
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { toggleCart, toggleSidebar, isSidebarOpen, theme, toggleTheme } = useUIStore();
  const rawCartItemCount = useCartStore((state) => state.getItemCount());
  const rawCartTotal = useCartStore((state) => state.getTotal());
  const { locale, setLocale } = useLocaleStore();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Live Autocomplete Search Debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res: any = await api.get(`/products?search=${encodeURIComponent(searchQuery.trim())}&per_page=5`);
        const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
        setSearchResults(items);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const cartItemCount = mounted ? rawCartItemCount : 0;
  const cartTotal = mounted ? rawCartTotal : 0;

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

  const defaultNavLinks = [
    { href: '/', labelKey: 'nav.home', labelEn: 'Home', labelBn: 'হোম' },
    { href: '/products', labelKey: 'nav.products', labelEn: 'All Products', labelBn: 'সকল পণ্য' },
    { href: '/products?category=men', labelKey: 'nav.men', labelEn: 'Men', labelBn: 'পুরুষ' },
    { href: '/products?category=women', labelKey: 'nav.women', labelEn: 'Women', labelBn: 'মহিলা' },
    { href: '/products?category=kids', labelKey: 'nav.kids', labelEn: 'Kids', labelBn: 'বাচ্চা' },
    { href: '/categories', labelKey: 'nav.categories', labelEn: 'Categories', labelBn: 'ক্যাটাগরি' },
    { href: '/track', labelKey: 'nav.track_order', labelEn: 'Track Order', labelBn: 'অর্ডার ট্র্যাকিং' },
  ];

  const navLinks = settings?.header_nav_links || defaultNavLinks;
  const siteName = settings?.header_logo_text || settings?.site_name || 'BD Shop';
  const logoImage = settings?.header_logo_image || null;
  const tagline = settings?.header_tagline || 'Bangladesh Official';
  const announcement = settings?.header_announcement || settings?.marquee || null;
  const hotline = settings?.header_hotline || settings?.phone || '01410737290';
  const whatsapp = settings?.header_whatsapp || settings?.whatsapp_number || '01410737290';

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    logout();
    toast.success('Signed out successfully');
    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="w-full relative z-[90]">
      {/* Top Banner Notice / Hotline Ticker */}
      {announcement && (
        <div className="w-full bg-slate-900 text-white text-[11px] py-1.5 px-4 hidden sm:flex items-center justify-between border-b border-slate-800">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 truncate text-slate-300">
              <span className="font-medium truncate">{announcement}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-medium flex-shrink-0">
              {hotline && (
                <a href={`tel:${hotline}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Phone className="w-3 h-3 text-primary" />
                  <span>{hotline}</span>
                </a>
              )}
              {whatsapp && (
                <a href={`https://wa.me/880${whatsapp.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hidden md:inline">
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className={`sticky top-0 z-[100] w-full transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur-xl shadow-lg border-b border-border py-1.5' 
          : 'bg-background/90 backdrop-blur-md border-b border-border/50 py-2'
      }`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3 lg:gap-6">
          
          {/* Brand Logo & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2.5 neu-btn rounded-2xl cursor-pointer text-foreground hover:text-primary transition-colors"
              onClick={toggleSidebar}
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <Link href="/" className="flex items-center gap-2.5 group">
              {logoImage ? (
                <img src={logoImage} alt={siteName} className="h-10 w-auto object-contain rounded-xl" />
              ) : (
                <div className="w-10 h-10 neu-raised rounded-2xl flex items-center justify-center text-primary font-black text-lg group-hover:scale-105 transition-transform shadow-md">
                  {siteName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl md:text-2xl text-foreground tracking-tight leading-none">
                    {siteName}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
                <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase hidden sm:block mt-0.5">
                  {tagline}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 neu-inset px-3 py-1.5 rounded-2xl">
            {navLinks.map((link: any) => {
              const isActive = pathname === link.href;
              const label = mounted && locale === 'bn' ? link.labelBn : link.labelEn;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'neu-chip-active text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  {link.isHot && (
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce fill-amber-500" />
                  )}
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Direct Search Box (Integrated in Navbar) */}
          <div className="hidden md:flex flex-1 max-w-xs xl:max-w-sm relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!isSearchOpen) setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder={mounted && locale === 'bn' ? 'পোশাক খুঁজুন...' : 'Search clothing, shoes, accessories...'}
                suppressHydrationWarning
                className="w-full pl-9 pr-8 py-2 neu-input rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-primary absolute right-3 top-2.5 animate-spin" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </form>

            {/* Live Autocomplete Dropdown */}
            <AnimatePresence>
              {isSearchOpen && (searchQuery.trim().length >= 2 || searchResults.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#161d2a] rounded-3xl p-3.5 shadow-2xl z-50 border border-slate-200 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Search Results</span>
                    <span className="text-[10px] text-primary font-bold">{searchResults.length} Products Found</span>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="space-y-1.5">
                      {searchResults.map((item: any) => (
                        <Link
                          key={item.id}
                          href={`/products/${item.slug}`}
                          onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl hover:border-primary/50 hover:bg-primary/10/50 dark:hover:bg-primary/10/30 transition-all group"
                        >
                          <img
                            src={item.primary_image_url || item.image || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=85'}
                            alt={item.name_en}
                            className="w-10 h-10 object-contain rounded-xl bg-background/50 flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=85'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {mounted && locale === 'bn' && item.name_bn ? item.name_bn : item.name_en}
                            </p>
                            <p className="text-[11px] font-black text-primary font-mono">
                              ৳ {Number(item.base_price || item.current_price || 0).toLocaleString()}
                            </p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </Link>
                      ))}
                      <Link
                        href={`/products?search=${encodeURIComponent(searchQuery)}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="block text-center py-2 text-xs font-bold text-primary hover:underline pt-1 border-t border-border/50"
                      >
                        View all results for "{searchQuery}" →
                      </Link>
                    </div>
                  ) : isSearching ? (
                    <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Searching catalogue...</span>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No products matched "{searchQuery}".
                    </div>
                  )}

                  {/* Popular Tags */}
                  <div className="pt-2 border-t border-border/50 space-y-1.5">
                    <span className="text-[10px] text-muted-foreground font-bold">Popular Searches:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SEARCH_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSearchQuery(tag);
                          }}
                          className="px-2 py-0.5 neu-btn rounded-lg text-[10px] font-semibold text-muted-foreground hover:text-primary cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons & Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Mobile Search Toggle */}
            <button
              className="md:hidden p-2.5 neu-btn rounded-2xl text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 neu-btn rounded-2xl text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm"
              title="Toggle Light/Dark Theme"
              aria-label="Toggle Theme"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500 fill-indigo-500/20" />
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
              className="px-3 py-2 neu-btn rounded-2xl text-xs font-black text-foreground hover:text-primary transition-all cursor-pointer min-w-[42px] text-center shadow-sm"
              title="Switch Language (EN / বাংলা)"
              suppressHydrationWarning
            >
              <span suppressHydrationWarning>{mounted && locale === 'bn' ? 'EN' : 'বাংলা'}</span>
            </button>

            {/* Customer User Account Menu */}
            {mounted && isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="p-1.5 sm:px-3 sm:py-2 neu-btn rounded-2xl text-foreground hover:text-primary transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  title={user?.name || 'My Account'}
                >
                  <div className="w-7 h-7 rounded-xl neu-inset flex items-center justify-center text-primary font-black text-xs bg-primary/10">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-black text-foreground truncate max-w-[90px] leading-tight">
                      {user?.name?.split(' ')[0] || 'Account'}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold">
                      {user?.is_admin ? 'Admin' : 'Verified'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform hidden sm:inline ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Dropdown Capsule */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#161d2a] rounded-3xl p-3.5 space-y-2.5 shadow-2xl z-50 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="font-black text-xs text-foreground truncate">{user?.name || 'Valued Customer'}</div>
                          {user?.is_admin && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate">{user?.email}</div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <Link
                          href="/account?tab=orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-foreground hover:neu-chip-active hover:text-primary transition-all font-bold"
                        >
                          <div className="flex items-center gap-2.5">
                            <Package className="w-4 h-4 text-primary" />
                            <span>My Orders & History</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">View</span>
                        </Link>

                        <Link
                          href="/account?tab=deliveries"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-foreground hover:neu-chip-active hover:text-primary transition-all font-bold"
                        >
                          <div className="flex items-center gap-2.5">
                            <Truck className="w-4 h-4 text-primary" />
                            <span>Active Deliveries</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">Live</span>
                        </Link>

                        <Link
                          href="/account?tab=addresses"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:neu-chip-active hover:text-primary transition-all font-bold"
                        >
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>Saved Addresses</span>
                        </Link>

                        <Link
                          href="/account?tab=profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:neu-chip-active hover:text-primary transition-all font-bold"
                        >
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          <span>Profile & Security</span>
                        </Link>

                        {user?.is_admin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-600 dark:text-amber-400 hover:neu-chip-active transition-all font-black bg-amber-500/10"
                          >
                            <Shield className="w-4 h-4 text-amber-500" />
                            <span>Admin Portal</span>
                          </Link>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/60">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-500/10 transition-colors text-xs font-black cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="p-2 sm:px-3 sm:py-2 neu-btn rounded-2xl text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                title="Sign In / Register"
              >
                <User className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold hidden sm:inline" suppressHydrationWarning>
                  {mounted && locale === 'bn' ? 'লগইন' : 'Sign In'}
                </span>
              </Link>
            )}

            {/* Cart Drawer Trigger with Visible Mobile Badge */}
            <button
              className="relative p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white transition-all cursor-pointer flex items-center gap-2 shadow-md hover:scale-105 active:scale-95"
              onClick={toggleCart}
              title="Open Cart Drawer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
              
              {/* Always Visible Mobile Counter Badge */}
              <span
                suppressHydrationWarning
                className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-[#111622] transition-transform ${
                  cartItemCount > 0 
                    ? 'bg-red-500 text-white scale-100' 
                    : 'bg-slate-400 text-white scale-90 sm:hidden'
                }`}
              >
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>

              {/* Desktop Label */}
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="font-black text-xs" suppressHydrationWarning>
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </button>

          </div>
        </div>

        {/* Expandable Mobile Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-3"
            >
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={mounted && locale === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
                    suppressHydrationWarning
                    className="w-full pl-10 pr-3 py-2.5 neu-input rounded-2xl text-xs font-semibold focus:outline-none"
                    autoFocus
                  />
                </div>
                <button type="submit" suppressHydrationWarning className="neu-btn-primary px-4 py-2.5 rounded-2xl text-xs font-bold">
                  {mounted && locale === 'bn' ? 'খুঁজুন' : 'Search'}
                </button>
                <button type="button" onClick={() => setIsSearchOpen(false)} className="p-2.5 neu-btn rounded-2xl text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
