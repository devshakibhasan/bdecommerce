'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Truck, ShoppingBag, User, Flame } from 'lucide-react';
import { useCartStore, useAuthStore, useUIStore, useLocaleStore } from '@/lib/store';

export function MobileBottomNav() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const rawCartItemCount = useCartStore((state) => state.getItemCount());
  const { toggleCart } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const { locale } = useLocaleStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItemCount = mounted ? rawCartItemCount : 0;

  const navItems = [
    { href: '/', labelEn: 'Home', labelBn: 'হোম', icon: Home },
    { href: '/products', labelEn: 'Shop', labelBn: 'শপ', icon: Package },
    { href: '/p/exclusive-offer', labelEn: 'Deals', labelBn: 'অফার', icon: Flame, isHot: true },
    { href: '/track', labelEn: 'Track', labelBn: 'ট্র্যাক', icon: Truck },
    { href: '/account', labelEn: 'Account', labelBn: 'অ্যাকাউন্ট', icon: User, requiresAuth: true },
  ];

  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (currentPath === '/checkout' || currentPath.startsWith('/checkout') || currentPath.includes('checkout')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-[80] lg:hidden bg-white/95 dark:bg-[#111622]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-2xl py-1.5 px-3 pb-safe mobile-bottom-nav-bar">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/account' && pathname.startsWith('/account'));
          const targetHref = item.requiresAuth && !isAuthenticated ? '/login' : item.href;
          const label = mounted && locale === 'bn' ? item.labelBn : item.labelEn;

          return (
            <Link
              key={item.href}
              href={targetHref}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-2xl transition-all relative ${
                isActive ? 'text-primary dark:text-primary font-black' : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-primary/10 dark:bg-primary/10/60 text-primary dark:text-primary shadow-xs border border-primary/30/80 dark:border-primary/80/80' : ''
              }`}>
                <item.icon className={`w-4 h-4 ${item.isHot ? 'text-amber-500 fill-amber-500 animate-bounce' : ''}`} />
              </div>
              <span suppressHydrationWarning className="text-[10px] tracking-tight leading-none">{label}</span>
            </Link>
          );
        })}

                {/* Cart Drawer Action Button with Prominent Counter */}
        <button
          onClick={toggleCart}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all relative cursor-pointer"
        >
          <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary dark:text-primary relative border border-slate-200 dark:border-slate-700">
            <ShoppingBag className="w-4 h-4" />
            <span
              suppressHydrationWarning
              className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 text-[9px] font-black flex items-center justify-center rounded-full shadow-md ring-2 ring-white dark:ring-[#111622] transition-transform ${
                cartItemCount > 0
                  ? 'bg-red-500 text-white scale-100'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 scale-90'
              }`}
            >
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          </div>
          <span suppressHydrationWarning className="text-[10px] font-bold tracking-tight leading-none text-slate-700 dark:text-slate-300">
            {mounted && locale === 'bn' ? 'কার্ট' : 'Cart'}
          </span>
        </button>
      </div>
    </nav>
  );
}
