'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette,  
  LayoutDashboard, ShoppingCart, Users, Truck, Package, FolderTree, 
  FileText, Zap, Ticket, ClipboardList, ShoppingBag, Wallet, Shield, Settings, 
  LogOut, ChevronLeft, ChevronRight, ChevronDown, Moon, Sun, Menu, X, ArrowLeft,
  Boxes, BarChart3, Layers, KeyRound, Activity, Tag, SlidersHorizontal, CreditCard,
  UserX, Megaphone, Scan
 } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/lib/store';


type NavItem = {
  href: string;
  label: string;
  icon: any;
  allowedRoles?: string[];
  subItems?: { href: string; label: string; allowedRoles?: string[] }[];
};

const getNavItems = (roles: string[] = [], isAdmin: boolean = false): NavItem[] => {
  
  const isSuper = isAdmin || roles.some(r => typeof r === 'string' && (r.toLowerCase().includes('super_admin') || r.toLowerCase() === 'admin'));
  const hasRole = (allowed?: string[]) => {
    if (!allowed) return isSuper;
    if (isSuper) return true;
    
    // Normalize user roles for easier matching
    const normalized = roles.map(r => typeof r === 'string' ? r.toLowerCase() : '');
    
    return allowed.some(a => {
      if (normalized.includes(a.toLowerCase())) return true;
      if (normalized.includes(a.toLowerCase().replace('_', ' '))) return true;
      
      // Fuzzy match based on keywords
      if (a === 'store_manager' && normalized.some(r => r.includes('store manager') || r.includes('product manage'))) return true;
      if (a === 'order_pack' && normalized.some(r => r.includes('order') || r.includes('pack'))) return true;
      if (a === 'dispatch' && normalized.some(r => r.includes('dispatch'))) return true;
      if (a === 'returns' && normalized.some(r => r.includes('return'))) return true;
      if (a === 'marketing' && normalized.some(r => r.includes('marketing'))) return true;
      if (a === 'crm' && normalized.some(r => r.includes('customer') || r.includes('crm'))) return true;
      
      return false;
    });
  };

  const ALL_ITEMS: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['super_admin'] },
    { 
      href: '/admin/orders', 
      label: 'Orders', 
      icon: ShoppingCart,
      allowedRoles: ['super_admin', 'order_pack'],
      subItems: [
        { href: '/admin/orders', label: 'All Orders' },
        { href: '/admin/orders/create', label: 'Create New Order' }, 
        { href: '/admin/orders/today-labels', label: 'Today Labels', allowedRoles: ['super_admin', 'order_pack'] },
        { href: '/admin/orders/deleted', label: 'Deleted Orders' },
        { href: '/admin/orders/blocked', label: 'Order Block List' },
        { href: '/admin/orders/report', label: 'Overview & Reports' }
      ]
    },
    { 
      href: '/admin/scan', 
      label: 'Barcode Scanner', 
      icon: Scan, 
      allowedRoles: ['super_admin', 'order_pack', 'dispatch', 'returns'],
      subItems: [
        { href: '/admin/scan', label: 'Scan Dashboard', allowedRoles: ['super_admin', 'order_pack', 'dispatch', 'returns'] },
        { href: '/admin/orders/missing-scans', label: 'Missing Scans', allowedRoles: ['super_admin', 'order_pack', 'dispatch', 'returns'] }
      ]
    },
    { href: '/admin/marketing', label: 'Marketing & Ads', icon: Megaphone, allowedRoles: ['super_admin', 'marketing'] },
    { href: '/admin/lost-customers', label: 'Lost Customers', icon: UserX, allowedRoles: ['super_admin', 'crm'] },
    { 
      href: '/admin/products', 
      label: 'Products', 
      icon: Package, 
      allowedRoles: ['super_admin', 'store_manager'],
      subItems: [
        { href: '/admin/products', label: 'Product List' },
        { href: '/admin/products/create', label: 'Add Product' },
        { href: '/admin/categories', label: 'Categories' },
        { href: '/admin/attributes', label: 'Attributes & Specs' },
        { href: '/admin/tags', label: 'Tags & Badges' },
        { href: '/admin/size-guides', label: 'Size Guides' },
        { href: '/admin/brands', label: 'Brands' },
        { href: '/admin/product-types', label: 'Product Types' },
        { href: '/admin/products/print-barcode', label: 'Print Barcode' },
        { href: '/admin/inventory/adjustments', label: 'Adjustment List' },
        { href: '/admin/inventory/adjustments/create', label: 'Add Adjustment' },
        { href: '/admin/products/reviews', label: 'Product Reviews' },
        { href: '/admin/pages', label: 'Landing Pages' },
        { href: '/admin/media', label: 'Media Library' }
      ]
    },
    { href: '/admin/inventory', label: 'Stock & Inventory', icon: Boxes, allowedRoles: ['super_admin', 'store_manager'] },
    { href: '/admin/purchases', label: 'Purchases & Suppliers', icon: ShoppingBag, allowedRoles: ['super_admin', 'store_manager'] },
    { href: '/admin/customers', label: 'Customers & CRM', icon: Users, allowedRoles: ['super_admin', 'crm'] },
    { 
      href: '/admin/hr/employees', 
      label: 'Human Resources (HR)', 
      icon: Users,
      allowedRoles: ['super_admin', 'hr'],
      subItems: [
        { href: '/admin/hr/employees', label: 'Employees' },
        { href: '/admin/hr/attendance', label: 'Attendance' },
        { href: '/admin/hr/payroll', label: 'Payroll' }
      ]
    },
    // { href: '/admin/settlements', label: 'Settlements', icon: CreditCard },
    { href: '/admin/sliders', label: 'Hero Sliders', icon: SlidersHorizontal },
    { href: '/admin/reports', label: 'Reports & Revenue', icon: BarChart3 },
    { href: '/admin/risk-profiles', label: 'Risk Shield', icon: Shield },
    { href: '/admin/roles', label: 'Staff & Roles (RBAC)', icon: KeyRound },
    { href: '/admin/otp-logs', label: 'SMS OTP Logs', icon: KeyRound },
    { href: '/admin/system', label: 'System & Queues', icon: Activity },
    { href: '/admin/payment-gateways', label: 'Payment Gateways', icon: CreditCard },
    { href: '/admin/settings', label: 'Shop Settings', icon: Settings },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: Shield, allowedRoles: ['super_admin'] },
  ];

  return ALL_ITEMS.filter(item => hasRole(item.allowedRoles)).map(item => {
    if (item.subItems) {
      const filteredSubs = item.subItems.filter(sub => hasRole(sub.allowedRoles));
      return { ...item, subItems: filteredSubs.length > 0 ? filteredSubs : undefined };
    }
    return item;
  });
};

const NavItem = ({ item, isActive, isCollapsed, pathname, setIsMobileOpen }: any) => {
  const Icon = item.icon;
  const hasSub = !!item.subItems;
  const [isOpen, setIsOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
  }, [isActive]);

  const handleClick = (e: any) => {
    if (hasSub) {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else {
      setIsMobileOpen(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Link
        href={item.href}
        onClick={handleClick}
        className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-xs font-bold ${
          isActive 
            ? 'bg-primary/10 dark:bg-primary/10/60 text-primary dark:text-primary border border-primary/30/80 dark:border-primary/80/80 shadow-xs' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
        }`}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="flex items-center gap-3">
          <Icon size={17} className={`flex-shrink-0 ${isActive ? 'text-primary dark:text-primary' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="truncate"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {!isCollapsed && hasSub && (
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </Link>
      
      {!isCollapsed && hasSub && isOpen && (
        <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-slate-200 dark:border-slate-800 pl-2">
          {item.subItems.map((sub: any) => {
            const isSubActive = pathname === sub.href;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={() => setIsMobileOpen(false)}
                className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-colors ${
                  isSubActive 
                    ? 'bg-primary/20/50 dark:bg-primary/20/30 text-primary dark:text-primary' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {sub.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const userRoles = user?.roles || [];
  const isAdminFlag = !!user?.is_admin;
  const NAV_ITEMS = getNavItems(userRoles, isAdminFlag);
  const { theme, toggleTheme } = useUIStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Debug output
  console.log('Sidebar Debug:', { userRoles, isAdminFlag, user, navItemsCount: NAV_ITEMS.length });

  const initialLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'A';
  
  const displayRole = user?.roles?.length 
    ? (user.roles[0].toLowerCase().includes('super') ? 'Super Admin' : user.roles[0].split(/[\_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
    : 'Shop Admin';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#111622] text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#161d2a]/80">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm shadow-md">
                BD
              </div>
              <span className="font-black text-base text-slate-900 dark:text-white truncate tracking-tight">
                {displayRole}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hidden md:block text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(`${item.href}/`)) ||
            (item.href === '/admin/customers' && (pathname === '/admin/crm' || pathname.startsWith('/admin/crm/'))) ||
            (item.subItems && item.subItems.some((sub: any) => pathname === sub.href || pathname.startsWith(`${sub.href}/`)));
          
          return <NavItem key={item.href} item={item} isActive={isActive} isCollapsed={isCollapsed} pathname={pathname} setIsMobileOpen={setIsMobileOpen} />;
        })}
      </nav>

      {/* Footer (User Info & Actions) */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-1.5 bg-slate-50/50 dark:bg-[#161d2a]/50">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors w-full font-bold"
          title={isCollapsed ? 'Go to Storefront' : undefined}
        >
          <ArrowLeft size={15} className="flex-shrink-0 text-slate-400" />
          {!isCollapsed && <span>View Storefront</span>}
        </Link>

        <button 
          onClick={toggleTheme}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors w-full font-bold cursor-pointer"
          title={isCollapsed ? 'Toggle Theme' : undefined}
        >
          {theme === 'light' ? <Moon size={15} className="text-slate-400" /> : <Sun size={15} className="text-amber-400" />}
          {!isCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
        
        <div className="flex items-center gap-2.5 px-2.5 py-2 mt-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-7 h-7 rounded-xl bg-primary/20 dark:bg-primary/10/60 text-primary dark:text-primary flex items-center justify-center font-black text-xs flex-shrink-0 border border-primary/30 dark:border-primary/80">
            {initialLetter}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-black truncate text-slate-900 dark:text-white">{user?.name || 'Super Admin'}</div>
              <div className="text-[10px] text-slate-500 truncate font-mono">{user?.email || 'admin@bdecommerce.com'}</div>
            </div>
          )}
          <button 
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2.5 bg-white dark:bg-[#111622] rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer hover:bg-slate-100"
          aria-label="Open Admin Menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 76 : 240 }}
        className="hidden md:block h-screen sticky top-0 flex-shrink-0 z-40 transition-all duration-300"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              onPointerDown={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden cursor-pointer"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-[260px] z-50 md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
