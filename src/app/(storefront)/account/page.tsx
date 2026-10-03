'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore, useLocaleStore, useOrderStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataCache } from '@/lib/dataCache';
import { formatBDT } from '@/utils/currency';
import { 
  User, Package, Truck, MapPin, Settings, LogOut, 
  ShoppingBag, ChevronRight, ExternalLink, Shield, 
  RefreshCw, Save, Phone, Mail, Plus, Trash2, Edit, 
  CheckCircle2, Star, Building2, Home, X, ArrowRight, 
  ShieldCheck, DollarSign, Search, Calendar, Clock,
  AlertCircle, Sparkles, FileText, Check, Lock
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const BD_DISTRICTS = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 
  'Rangpur', 'Mymensingh', 'Gazipur', 'Narayanganj', 'Comilla', 'Bogra',
  'Cox\'s Bazar', 'Jessore', 'Dinajpur', 'Feni', 'Tangail', 'Faridpur',
  'Pabna', 'Noakhali', 'Brahmanbaria', 'Kushtia', 'Jamalpur'
];

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const initialTab = searchParams.get('tab') || 'orders';
  const [activeTab, setActiveTab] = useState<'orders' | 'deliveries' | 'profile' | 'addresses'>(
    ['orders', 'deliveries', 'profile', 'addresses'].includes(initialTab) ? (initialTab as any) : 'orders'
  );

  const { user, isAuthenticated, hasHydrated, logout, setUser } = useAuthStore();
  const { locale } = useLocaleStore();
  const { lastOrder } = useOrderStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Tracking query & search input state
  const [trackQuery, setTrackQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [lastCheckoutPhone, setLastCheckoutPhone] = useState('');
  const [lastCheckoutEmail, setLastCheckoutEmail] = useState('');
  const [lastCheckoutName, setLastCheckoutName] = useState('');

  // Profile Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  const [addressForm, setAddressForm] = useState({
    title: 'Home',
    recipient_name: '',
    recipient_phone: '',
    address: '',
    district: 'Dhaka',
    thana: '',
    postal_code: '',
    shipping_zone: 'inside_dhaka',
    is_default: false,
  });

  // Sync tab change to URL
  const handleTabChange = (tab: 'orders' | 'deliveries' | 'profile' | 'addresses') => {
    setActiveTab(tab);
    router.replace(`/account?tab=${tab}`, { scroll: false });
  };

  // Populate user profile info when authenticated
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Read checkout tracking memory from localStorage and searchParams
  useEffect(() => {
    if (!hasHydrated) return;

    let storedPhone = '';
    let storedEmail = '';
    let storedName = '';

    if (typeof window !== 'undefined') {
      try {
        storedPhone = localStorage.getItem('customer_tracking_phone') || '';
        storedEmail = localStorage.getItem('customer_tracking_email') || '';
        storedName = localStorage.getItem('customer_tracking_name') || '';
      } catch (e) {}
    }

    setLastCheckoutPhone(storedPhone);
    setLastCheckoutEmail(storedEmail);
    setLastCheckoutName(storedName);

    // Initial search priority: URL query param -> stored checkout phone -> stored email -> user phone/email
    const paramQuery = 
      searchParams.get('phone') || 
      searchParams.get('query') || 
      searchParams.get('email') || 
      searchParams.get('order');

    const effectiveQuery = (paramQuery || storedPhone || storedEmail || user?.phone || user?.email || '').trim();

    if (effectiveQuery) {
      setSearchInputValue(effectiveQuery);
      setTrackQuery(effectiveQuery);
      fetchOrders(effectiveQuery);
    } else if (isAuthenticated) {
      fetchOrders('');
    } else if (lastOrder && lastOrder.order_number) {
      // If guest has a recently placed order in local store, display it right away
      setOrders([lastOrder]);
      if (lastOrder.customer_phone) {
        setTrackQuery(lastOrder.customer_phone);
        setSearchInputValue(lastOrder.customer_phone);
      }
    }
  }, [hasHydrated, isAuthenticated, user]);

  // Fetch orders with smart fallback & multi-source merging
  const fetchOrders = async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : trackQuery).trim();

    // Instant local memory retrieval (0ms render without spinners)
    const cachedLookup = q ? DataCache.get<any>(`/customer/orders-lookup?query=${encodeURIComponent(q)}`) : null;
    const cachedAuth = isAuthenticated ? DataCache.get<any>('/customer/orders') : null;
    const initialList = cachedLookup?.data?.data || cachedLookup?.data || cachedAuth?.data?.data || cachedAuth?.data;
    if (Array.isArray(initialList) && initialList.length > 0) {
      setOrders(initialList);
    } else {
      setIsLoadingOrders(true);
    }

    const fetchedList: any[] = [];
    const seenOrderNumbers = new Set<string>();

    try {
      // 1. Authenticated user order history
      if (isAuthenticated) {
        try {
          const res: any = await api.get('/customer/orders');
          const list = Array.isArray(res?.data) ? res.data : (res?.data?.items || res?.data?.data || []);
          if (Array.isArray(list)) {
            for (const ord of list) {
              if (ord?.order_number && !seenOrderNumbers.has(ord.order_number)) {
                seenOrderNumbers.add(ord.order_number);
                fetchedList.push(ord);
              }
            }
          }
        } catch (authErr) {
          /* silenced */
        }
      }

      // 2. Query lookup by phone, email, or order number (public endpoint)
      if (q) {
        try {
          const lookupRes: any = await api.get(`/customer/orders-lookup?query=${encodeURIComponent(q)}`);
          const list = Array.isArray(lookupRes?.data) ? lookupRes.data : (lookupRes?.data?.items || lookupRes?.data?.data || []);
          if (Array.isArray(list)) {
            for (const ord of list) {
              if (ord?.order_number && !seenOrderNumbers.has(ord.order_number)) {
                seenOrderNumbers.add(ord.order_number);
                fetchedList.push(ord);
              }
            }
          }
        } catch (lookupErr) {
          /* silenced */
        }

        // Secondary fallback to phone endpoint ONLY if lookup didn't find any orders yet
        const cleanDigits = q.replace(/\D/g, '');
        if (fetchedList.length === 0 && ((cleanDigits.length === 11 && cleanDigits.startsWith('01')) || cleanDigits.length === 10)) {
          try {
            const phoneRes: any = await api.get(`/customer/orders-by-phone/${cleanDigits}`);
            const phoneList = Array.isArray(phoneRes?.data) ? phoneRes.data : (phoneRes?.data?.items || phoneRes?.data?.data || []);
            if (Array.isArray(phoneList)) {
              for (const ord of phoneList) {
                if (ord?.order_number && !seenOrderNumbers.has(ord.order_number)) {
                  seenOrderNumbers.add(ord.order_number);
                  fetchedList.push(ord);
                }
              }
            }
          } catch (e) {}
        }
      }

      // 3. Immediate local client order memory (from checkout confirmation)
      if (lastOrder && lastOrder.order_number) {
        const matchesQuery = !q || 
          (lastOrder.order_number && lastOrder.order_number.toLowerCase().includes(q.toLowerCase())) ||
          (lastOrder.customer_phone && lastOrder.customer_phone.includes(q)) ||
          (lastOrder.customer_email && lastOrder.customer_email.toLowerCase().includes(q.toLowerCase()));

        if (matchesQuery && !seenOrderNumbers.has(lastOrder.order_number)) {
          seenOrderNumbers.add(lastOrder.order_number);
          fetchedList.unshift(lastOrder);
        }
      }

      setOrders(fetchedList);
    } catch (err) {
      /* silenced */
      if (lastOrder && !seenOrderNumbers.has(lastOrder.order_number)) {
        setOrders([lastOrder]);
      } else {
        setOrders([]);
      }
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInputValue.trim();
    if (!query) {
      toast.error('Please enter a mobile phone number, email, or order number');
      return;
    }
    setTrackQuery(query);
    fetchOrders(query);
  };

  const handleQuickChipClick = (value: string) => {
    setSearchInputValue(value);
    setTrackQuery(value);
    fetchOrders(value);
  };

  const handleClearSearch = () => {
    setSearchInputValue('');
    setTrackQuery('');
    if (isAuthenticated) {
      fetchOrders('');
    } else {
      setOrders(lastOrder ? [lastOrder] : []);
    }
  };

  // =========================================================================
  // SAVED ADDRESSES QUERY & MUTATIONS
  // =========================================================================
  const { data: addresses = [], isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/customer/addresses');
        if (res?.data) {
          return Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || []);
        }
      } catch (err) {
        /* silenced */
      }
      return [];
    },
    enabled: isAuthenticated,
  });

  const createAddressMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/customer/addresses', payload);
    },
    onSuccess: () => {
      toast.success('New delivery address saved successfully!');
      closeAddressModal();
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save address');
    }
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      return await api.put(`/customer/addresses/${id}`, payload);
    },
    onSuccess: () => {
      toast.success('Address updated successfully!');
      closeAddressModal();
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update address');
    }
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.put(`/customer/addresses/${id}/default`, {});
    },
    onSuccess: () => {
      toast.success('Primary default delivery address updated!');
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to set default address');
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/customer/addresses/${id}`);
    },
    onSuccess: () => {
      toast.success('Address deleted');
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete address');
    }
  });

  const openCreateAddressModal = () => {
    setEditingAddress(null);
    setAddressForm({
      title: 'Home',
      recipient_name: user?.name || lastCheckoutName || '',
      recipient_phone: user?.phone || lastCheckoutPhone || '',
      address: '',
      district: 'Dhaka',
      thana: '',
      postal_code: '',
      shipping_zone: 'inside_dhaka',
      is_default: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: any) => {
    setEditingAddress(addr);
    setAddressForm({
      title: addr.title || 'Home',
      recipient_name: addr.recipient_name || '',
      recipient_phone: addr.recipient_phone || '',
      address: addr.address || '',
      district: addr.district || 'Dhaka',
      thana: addr.thana || '',
      postal_code: addr.postal_code || '',
      shipping_zone: addr.shipping_zone || 'inside_dhaka',
      is_default: Boolean(addr.is_default),
    });
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  const handleDistrictChange = (dist: string) => {
    let zone = 'outside_dhaka';
    const lower = dist.toLowerCase();
    if (lower === 'dhaka') {
      zone = 'inside_dhaka';
    } else if (['gazipur', 'narayanganj', 'savar', 'keraniganj'].includes(lower)) {
      zone = 'suburb';
    }
    setAddressForm(prev => ({ ...prev, district: dist, shipping_zone: zone }));
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.recipient_name.trim()) {
      toast.error('Recipient name is required');
      return;
    }
    if (!addressForm.recipient_phone.trim()) {
      toast.error('Recipient phone is required');
      return;
    }
    if (!addressForm.address.trim()) {
      toast.error('Detailed street address is required');
      return;
    }

    const payload = {
      title: addressForm.title.trim(),
      recipient_name: addressForm.recipient_name.trim(),
      recipient_phone: addressForm.recipient_phone.trim(),
      address: addressForm.address.trim(),
      district: addressForm.district,
      thana: addressForm.thana.trim(),
      postal_code: addressForm.postal_code.trim(),
      shipping_zone: addressForm.shipping_zone,
      is_default: addressForm.is_default,
    };

    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, payload });
    } else {
      createAddressMutation.mutate(payload);
    }
  };

  const handleDeleteAddress = (id: number, title: string) => {
    if (window.confirm(`Remove saved address "${title}"?`)) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res: any = await api.put('/auth/profile', { name, email, phone });
      if (res?.data) {
        setUser(res.data);
        toast.success('Profile updated successfully!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  // Computed live metrics
  const totalOrdersCount = orders.length;
  const inTransitOrders = orders.filter(o => {
    const st = String(o.fulfillment_status || o.status || '').toLowerCase();
    return ['in_transit', 'dispatched', 'confirmed', 'processing', 'pending'].includes(st);
  });
  const inTransitCount = inTransitOrders.length;
  const totalSpentBDT = orders
    .filter(o => {
      const pSt = String(o.payment_status || o.payment?.status || '').toLowerCase();
      const fSt = String(o.fulfillment_status || o.status || '').toLowerCase();
      return pSt === 'paid' || fSt === 'delivered';
    })
    .reduce((sum, o) => sum + Number(o.total_payable || o.total_amount || o.subtotal || 0), 0);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to extract image URL from item
  const getItemImage = (item: any) => {
    return (
      item.image ||
      item.product?.primary_image_url ||
      item.product?.images?.[0]?.url ||
      item.product?.images?.[0]?.path ||
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'
    );
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="clay-card rounded-3xl p-8 text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center mx-auto text-primary animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-foreground">Loading Account & Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-6xl space-y-8">
      
      {/* Top Customer Hero Profile / Tracking Header Card */}
      <div className="clay-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl clay-inset flex items-center justify-center text-primary font-black text-2xl sm:text-3xl uppercase shadow-inner">
            {isAuthenticated && user?.name 
              ? user.name.charAt(0) 
              : lastCheckoutName 
              ? lastCheckoutName.charAt(0) 
              : <Package className="w-8 h-8 text-primary" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                {isAuthenticated 
                  ? (user?.name || 'Valued Customer') 
                  : lastCheckoutName 
                  ? `${lastCheckoutName} (Guest)` 
                  : 'Customer Order Portal'}
              </h1>
              {isAuthenticated && user?.is_admin ? (
                <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider">
                  Super Admin
                </span>
              ) : isAuthenticated ? (
                <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified BD Customer</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Live Mobile Tracking</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium flex flex-wrap items-center gap-2">
              {isAuthenticated ? (
                <>
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-primary" /> {user?.email}</span>
                  {user?.phone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-primary" /> <span className="font-mono">{user.phone}</span></span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>Tracking via: </span>
                    <strong className="font-mono text-foreground font-bold">
                      {trackQuery || lastCheckoutPhone || lastCheckoutEmail || 'Mobile Phone / Email'}
                    </strong>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {isAuthenticated && user?.is_admin && (
            <Link
              href="/admin"
              className="clay-btn-primary px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Portal</span>
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 clay-btn rounded-2xl text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              href="/login?redirect=/account?tab=orders"
              className="clay-btn-primary px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Sign In / Register</span>
            </Link>
          )}
        </div>
      </div>

      {/* Accurate Customer Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center text-primary">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Orders Found</span>
            <h3 className="text-xl font-black text-foreground">{totalOrdersCount} {totalOrdersCount === 1 ? 'Order' : 'Orders'}</h3>
          </div>
        </div>

        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center text-amber-500">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Active Deliveries</span>
            <h3 className="text-xl font-black text-foreground">{inTransitCount} {inTransitCount === 1 ? 'Shipment' : 'Shipments'}</h3>
          </div>
        </div>

        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center text-primary">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Order Value</span>
            <h3 className="text-xl font-mono font-black text-foreground">{formatBDT(totalSpentBDT)}</h3>
          </div>
        </div>
      </div>

      {/* Account Navigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Navigation Sidebar */}
        <div className="clay-card rounded-3xl p-3 space-y-1 lg:sticky lg:top-24">
          <button
            onClick={() => handleTabChange('orders')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'orders' ? 'clay-btn-primary shadow-md' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4" />
              <span>Track Orders</span>
            </div>
            <span className="text-[11px] font-mono font-bold">{totalOrdersCount}</span>
          </button>

          <button
            onClick={() => handleTabChange('deliveries')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'deliveries' ? 'clay-btn-primary shadow-md' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4" />
              <span>Live Deliveries</span>
            </div>
            <span className="text-[11px] font-mono font-bold">{inTransitCount}</span>
          </button>

          <button
            onClick={() => handleTabChange('addresses')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'addresses' ? 'clay-btn-primary shadow-md' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4" />
              <span>Saved Addresses</span>
            </div>
            <span className="text-[11px] font-mono font-bold">{isAuthenticated ? addresses.length : '🔒'}</span>
          </button>

          <button
            onClick={() => handleTabChange('profile')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'profile' ? 'clay-btn-primary shadow-md' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4" />
              <span>Profile & Security</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Right Main Content Pane */}
        <div className="lg:col-span-3 space-y-6">

          {/* ========================================================================= */}
          {/* TAB 1: TRACK & VIEW ORDERS */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              
              {/* Interactive Phone / Email Order Lookup Bar */}
              <div className="clay-card rounded-3xl p-6 sm:p-7 space-y-4 border border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                      <Search className="w-5 h-5 text-primary" />
                      <span>Track Orders by Mobile Number or Email</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Find any order placed as guest or member using your 11-digit mobile number, email, or order number
                    </p>
                  </div>
                  <button
                    onClick={() => fetchOrders()}
                    className="p-2 clay-btn rounded-xl text-muted-foreground hover:text-foreground cursor-pointer self-start sm:self-auto"
                    title="Refresh Orders"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin text-primary' : ''}`} />
                  </button>
                </div>

                {/* Form Input */}
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                    <input
                      type="text"
                      value={searchInputValue}
                      onChange={(e) => setSearchInputValue(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX, your@email.com, or BD-2026-..."
                      className="w-full pl-11 pr-10 py-3 clay-input rounded-2xl text-xs font-mono font-medium focus:ring-2 focus:ring-primary/30"
                    />
                    {searchInputValue && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoadingOrders}
                    className="clay-btn-primary px-6 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                    <span>{isLoadingOrders ? 'Searching...' : 'Track Orders'}</span>
                  </button>
                </form>

                {/* Quick Selection Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>Quick Track:</span>
                  </span>

                  {lastCheckoutPhone && (
                    <button
                      type="button"
                      onClick={() => handleQuickChipClick(lastCheckoutPhone)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        trackQuery === lastCheckoutPhone
                          ? 'clay-btn-primary shadow-sm'
                          : 'clay-btn text-foreground hover:border-primary/40'
                      }`}
                    >
                      ⚡ Checkout Phone: {lastCheckoutPhone}
                    </button>
                  )}

                  {user?.phone && user.phone !== lastCheckoutPhone && (
                    <button
                      type="button"
                      onClick={() => handleQuickChipClick(user.phone!)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        trackQuery === user.phone
                          ? 'clay-btn-primary shadow-sm'
                          : 'clay-btn text-foreground hover:border-primary/40'
                      }`}
                    >
                      👤 Account Phone: {user.phone}
                    </button>
                  )}

                  {lastOrder?.order_number && (
                    <button
                      type="button"
                      onClick={() => handleQuickChipClick(lastOrder.order_number)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        trackQuery === lastOrder.order_number
                          ? 'clay-btn-primary shadow-sm'
                          : 'clay-btn text-foreground hover:border-primary/40'
                      }`}
                    >
                      📦 Last Order: #{lastOrder.order_number}
                    </button>
                  )}
                </div>

                {/* Active Filter Indicator */}
                {trackQuery && (
                  <div className="flex items-center justify-between bg-primary/10 rounded-2xl px-4 py-2 text-xs">
                    <span className="text-foreground font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Showing results for: <strong className="font-mono text-primary">{trackQuery}</strong> ({orders.length} found)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="text-[11px] text-primary hover:underline font-bold"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {/* Order List */}
              {isLoadingOrders ? (
                <div className="space-y-4">
                  {[1, 2].map(n => (
                    <div key={n} className="clay-card rounded-3xl p-8 animate-pulse space-y-4">
                      <div className="h-6 bg-muted/60 rounded-xl w-1/3" />
                      <div className="h-16 bg-muted/40 rounded-2xl" />
                      <div className="h-6 bg-muted/50 rounded-xl w-1/4" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="clay-card rounded-3xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl clay-inset flex items-center justify-center mx-auto text-muted-foreground">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-foreground">
                      {trackQuery ? `No Orders Found for "${trackQuery}"` : 'No Orders Placed Yet'}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      {trackQuery 
                        ? 'Please verify that you typed the exact 11-digit mobile number, email address, or order number used during checkout.'
                        : 'Enter your checkout mobile number above to retrieve your orders, or browse our authentic electronics catalog.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {trackQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="px-5 py-2.5 clay-btn rounded-2xl text-xs font-bold text-foreground cursor-pointer"
                      >
                        Clear Search
                      </button>
                    )}
                    <Link
                      href="/products"
                      className="clay-btn-primary px-6 py-2.5 rounded-2xl text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <span>Browse Products & Shop</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {orders.map((ord: any) => {
                    const status = String(ord.fulfillment_status || ord.status || 'pending').toLowerCase();
                    const paymentStatus = String(ord.payment_status || ord.payment?.status || 'pending').toLowerCase();
                    const orderItems = ord.items || [];
                    const trackingCode = ord.tracking_code || ord.shipping?.tracking_code;
                    const courierName = ord.courier_name || ord.shipping?.courier_name || 'Steadfast Courier';
                    const customerPhone = ord.customer_phone || ord.customer?.phone;
                    const customerName = ord.customer_name || ord.customer?.name;
                    const addressText = ord.shipping_address || ord.shipping?.address;
                    const totalPayable = Number(ord.total_payable || ord.total_amount || ord.amounts?.total || ord.subtotal || 0);

                    return (
                      <div key={ord.id || ord.order_number} className="clay-card rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg hover:shadow-xl transition-all border border-border/40">
                        
                        {/* Header: Order Number, Date, Status Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Consignment</span>
                              <span className="font-mono font-black text-base text-primary">
                                #{ord.order_number}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              <span>{formatDate(ord.created_at)}</span>
                              {customerPhone && (
                                <>
                                  <span>•</span>
                                  <Phone className="w-3.5 h-3.5 text-primary" />
                                  <span className="font-mono font-bold text-foreground">{customerPhone}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Fulfillment status badge */}
                            <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 ${
                              status === 'delivered' 
                                ? 'bg-primary/15 text-primary border border-primary/30'
                                : status === 'cancelled'
                                ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                                : status === 'dispatched' || status === 'in_transit'
                                ? 'bg-indigo-500/15 text-indigo-600 border border-indigo-500/30'
                                : 'bg-primary/15 text-primary border border-primary/30'
                            }`}>
                              <Truck className="w-3 h-3" />
                              <span>{status.replace('_', ' ')}</span>
                            </span>

                            {/* Payment status badge */}
                            <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 ${
                              paymentStatus === 'paid' 
                                ? 'bg-primary/15 text-primary border border-primary/30' 
                                : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                            }`}>
                              <DollarSign className="w-3 h-3" />
                              <span>{paymentStatus === 'paid' ? 'Paid' : 'COD Payment Pending'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Items Section with Thumbnails */}
                        <div className="space-y-3">
                          <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                            Order Items ({orderItems.length})
                          </span>
                          <div className="divide-y divide-border/40">
                            {orderItems.map((item: any, idx: number) => {
                              const imgUrl = getItemImage(item);
                              const itemName = item.product_name || item.product?.name_en || 'Product';
                              const itemPrice = Number(item.unit_price || item.product?.current_price || item.price || 0);
                              const itemQty = Number(item.quantity || 1);
                              const itemTotal = Number(item.total || itemPrice * itemQty);

                              return (
                                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3.5">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden clay-inset flex-shrink-0 bg-muted/20 border border-border/50">
                                      <img
                                        src={imgUrl}
                                        alt={itemName}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80';
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-0.5">
                                      <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">{itemName}</h4>
                                      {((item.color || item.variant?.color) || (item.size || item.variant?.size) || item.variant_name) && (
                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 pb-0.5">
                                          {(item.color || item.variant?.color) && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                              {locale === 'bn' ? 'কালার' : 'Color'}: {item.color || item.variant?.color}
                                            </span>
                                          )}
                                          {(item.size || item.variant?.size) && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border/50">
                                              {locale === 'bn' ? 'সাইজ' : 'Size'}: {item.size || item.variant?.size}
                                            </span>
                                          )}
                                          {!item.color && !item.size && !item.variant?.color && !item.variant?.size && item.variant_name && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted/60 text-muted-foreground">
                                              {item.variant_name}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                        <span className="font-mono text-primary font-bold">{formatBDT(itemPrice)}</span>
                                        <span>×</span>
                                        <span className="font-mono font-bold text-foreground">{itemQty}</span>
                                        {item.sku && (
                                          <>
                                            <span>•</span>
                                            <span className="font-mono text-[10px]">{item.sku}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right font-mono font-black text-xs sm:text-sm text-foreground">
                                    {formatBDT(itemTotal)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Delivery Destination & Courier Tracking Details */}
                        <div className="clay-inset rounded-2xl p-4 text-xs space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-foreground">Recipient: </span>
                                <span>{customerName || 'Customer'} ({customerPhone || 'N/A'})</span>
                                <div className="text-foreground/80 pt-0.5">{addressText || 'Delivery address on record'}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <Truck className="w-4 h-4 text-primary" />
                              <span className="font-bold text-foreground">{courierName}</span>
                              {trackingCode && (
                                <Link
                                  href={`/track?code=${trackingCode}`}
                                  className="clay-btn-primary px-3 py-1 rounded-xl text-[10px] font-black inline-flex items-center gap-1 shadow-sm"
                                >
                                  <span>{trackingCode}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer Summary & CTAs */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-bold">Total Amount Payable:</span>
                            <span className="text-lg sm:text-xl font-black text-foreground font-mono text-primary">
                              {formatBDT(totalPayable)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            {trackingCode && (
                              <Link
                                href={`/track?code=${trackingCode}`}
                                className="clay-btn px-4 py-2 rounded-xl text-xs font-bold text-foreground hover:text-primary flex items-center gap-1.5 transition-all"
                              >
                                <Truck className="w-3.5 h-3.5 text-primary" />
                                <span>Track Delivery</span>
                              </Link>
                            )}

                            <Link
                              href={`/order-confirmation/${ord.order_number}`}
                              className="clay-btn-primary px-5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Invoice Receipt</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ACTIVE SHIPMENTS & LIVE DELIVERIES */}
          {/* ========================================================================= */}
          {activeTab === 'deliveries' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <span>Live Shipment & Parcel Tracking</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Track real-time door-to-door courier milestones across all 64 districts in Bangladesh
                </p>
              </div>

              {inTransitOrders.length === 0 ? (
                <div className="clay-card rounded-3xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl clay-inset flex items-center justify-center mx-auto text-muted-foreground">
                    <Truck className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-foreground">No Active Shipments in Transit</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      All your previous orders have either been successfully delivered or no new orders are currently dispatched.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => handleTabChange('orders')}
                      className="clay-btn px-5 py-2.5 rounded-2xl text-xs font-bold text-foreground cursor-pointer"
                    >
                      <span>Track Orders by Mobile</span>
                    </button>
                    <Link
                      href="/products"
                      className="clay-btn-primary px-6 py-2.5 rounded-2xl text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <span>Discover Products</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {inTransitOrders.map((ord: any) => {
                    const status = String(ord.fulfillment_status || ord.status || 'pending').toLowerCase();
                    const isDispatched = ['dispatched', 'in_transit', 'delivered'].includes(status);
                    const isInTransit = ['in_transit', 'delivered'].includes(status);
                    const isDelivered = status === 'delivered';
                    const trackingCode = ord.tracking_code || ord.shipping?.tracking_code;
                    const courierName = ord.courier_name || ord.shipping?.courier_name || 'Steadfast Courier Express';
                    const totalPayable = Number(ord.total_payable || ord.total_amount || ord.amounts?.total || ord.subtotal || 0);

                    return (
                      <div key={ord.id || ord.order_number} className="clay-card rounded-3xl p-6 sm:p-7 space-y-6 shadow-lg border border-border/40">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center text-primary">
                              <Truck className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-black text-sm sm:text-base text-foreground">
                                {courierName}
                              </h3>
                              <p className="text-xs text-muted-foreground font-mono">
                                Consignment: #{ord.order_number} {trackingCode ? `• Tracking: ${trackingCode}` : ''}
                              </p>
                            </div>
                          </div>

                          {trackingCode && (
                            <Link
                              href={`/track?code=${trackingCode}`}
                              className="clay-btn-primary px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md"
                            >
                              <span>Track Online</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>

                        {/* Progress Stepper */}
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {[
                            { step: 'Order Placed', time: 'Confirmed', done: true },
                            { step: 'Fulfillment Hub', time: isDispatched ? 'Dispatched' : 'Preparing', done: isDispatched },
                            { step: 'In Transit', time: isInTransit ? 'Out for Delivery' : 'En Route', done: isInTransit },
                            { step: 'Delivered', time: isDelivered ? 'Complete' : 'Pending', done: isDelivered },
                          ].map((s, idx) => (
                            <div key={idx} className="text-center space-y-1.5">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto text-xs font-bold transition-all ${
                                s.done ? 'bg-primary text-white shadow-md' : 'clay-inset text-muted-foreground'
                              }`}>
                                {s.done ? <Check className="w-4 h-4" /> : idx + 1}
                              </div>
                              <div className="text-[11px] font-bold text-foreground">{s.step}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{s.time}</div>
                            </div>
                          ))}
                        </div>

                        {/* Address & Items Summary */}
                        <div className="clay-inset rounded-2xl p-4 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <span className="font-bold text-foreground">Delivery To: </span>
                            <span>{ord.shipping_address || ord.shipping?.address || 'Address provided on file'} ({ord.district || ord.shipping?.district || 'Dhaka'})</span>
                          </div>
                          <div className="font-mono font-black text-foreground text-sm">
                            COD Amount: <span className="text-primary">{formatBDT(totalPayable)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <Link
                            href={`/order-confirmation/${ord.order_number}`}
                            className="clay-btn px-4 py-2 rounded-xl text-xs font-bold text-foreground hover:text-primary flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            <span>View Full Invoice</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SAVED ADDRESSES (100% CRUD) */}
          {/* ========================================================================= */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              {!isAuthenticated ? (
                <div className="clay-card rounded-3xl p-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl clay-inset flex items-center justify-center mx-auto text-primary">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-foreground">Sign In to Save Delivery Addresses</h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Log in to your account to save multiple home, office, and regional addresses for fast 1-click doorstep delivery.
                    </p>
                  </div>
                  <Link
                    href="/login?redirect=/account?tab=addresses"
                    className="clay-btn-primary px-7 py-2.5 rounded-2xl text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>Sign In or Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span>Saved Delivery Addresses</span>
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Addresses saved for 1-click doorstep delivery across all 64 districts in Bangladesh
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openCreateAddressModal}
                      className="clay-btn-primary px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Address</span>
                    </button>
                  </div>

                  {isLoadingAddresses ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2].map(n => (
                        <div key={n} className="clay-card rounded-3xl p-6 h-48 animate-pulse bg-muted/40" />
                      ))}
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="clay-card rounded-3xl p-10 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl clay-inset flex items-center justify-center mx-auto text-muted-foreground">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-black text-sm text-foreground">No Saved Addresses Found</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Add your home or office address for fast, automated shipping and courier delivery calculation.
                        </p>
                      </div>
                      <button
                        onClick={openCreateAddressModal}
                        className="clay-btn-primary px-5 py-2 rounded-2xl text-xs font-black inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Delivery Address</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {addresses.map((addr: any) => {
                        const isDefault = Boolean(addr.is_default);
                        const isOffice = addr.title?.toLowerCase().includes('office') || addr.title?.toLowerCase().includes('work');

                        return (
                          <div 
                            key={addr.id} 
                            className={`clay-card rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all ${
                              isDefault ? 'border-2 border-primary/40 ring-1 ring-primary/20' : ''
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Header Badge & Icon */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl clay-inset flex items-center justify-center text-primary">
                                    {isOffice ? <Building2 className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <h3 className="font-black text-sm text-foreground">{addr.title}</h3>
                                    {isDefault && (
                                      <span className="text-[10px] font-black uppercase text-primary tracking-wider block">
                                        ★ Default Primary
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditAddressModal(addr)}
                                    className="p-2 clay-btn rounded-xl text-primary hover:bg-primary/10 transition-all"
                                    title="Edit Address"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAddress(addr.id, addr.title)}
                                    className="p-2 clay-btn rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
                                    title="Delete Address"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Recipient & Full Address */}
                              <div className="space-y-1 text-xs">
                                <div className="font-bold text-foreground flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>{addr.recipient_name}</span>
                                  <span className="text-muted-foreground font-normal">•</span>
                                  <span className="font-mono text-muted-foreground">{addr.recipient_phone}</span>
                                </div>
                                <p className="text-muted-foreground text-xs leading-relaxed pl-5">
                                  {addr.address}
                                  {addr.thana && <span>, {addr.thana}</span>}
                                  <span>, {addr.district}</span>
                                  {addr.postal_code && <span> - {addr.postal_code}</span>}
                                </p>
                              </div>
                            </div>

                            {/* Zone Tag & Set Default Button */}
                            <div className="pt-3 border-t flex items-center justify-between text-xs">
                              <span className="px-2.5 py-1 rounded-xl clay-inset text-[11px] font-bold text-foreground">
                                {addr.shipping_zone_label || (addr.district === 'Dhaka' ? 'Inside Dhaka City (৳80)' : 'Outside Dhaka (৳130)')}
                              </span>

                              {!isDefault ? (
                                <button
                                  type="button"
                                  onClick={() => setDefaultAddressMutation.mutate(addr.id)}
                                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Star className="w-3 h-3" />
                                  <span>Set as Primary</span>
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Active Default</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PROFILE & SECURITY SETTINGS */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {!isAuthenticated ? (
                <div className="clay-card rounded-3xl p-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl clay-inset flex items-center justify-center mx-auto text-primary">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-foreground">Sign In to Manage Profile Credentials</h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Please log in to update your account password, email preferences, and personal contact details.
                    </p>
                  </div>
                  <Link
                    href="/login?redirect=/account?tab=profile"
                    className="clay-btn-primary px-7 py-2.5 rounded-2xl text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-lg font-black text-foreground">Account Profile & Security</h2>
                    <p className="text-xs text-muted-foreground">Update your personal account credentials and contact details</p>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-foreground tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 clay-input rounded-2xl text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-foreground tracking-wider">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 clay-input rounded-2xl text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-foreground tracking-wider">Mobile Number (11 Digits)</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 clay-input rounded-2xl text-xs font-mono font-bold"
                          placeholder="017XXXXXXXX"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="clay-btn-primary px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg mt-4"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* ADD & EDIT ADDRESS MODAL */}
      {/* ========================================================================= */}
      {isAddressModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddressModal();
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 cursor-default"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl neu-card-inset flex items-center justify-center text-primary dark:text-primary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    {editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Configure doorstep delivery coordinates across Bangladesh
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAddressModal}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Address Form */}
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              
              {/* Address Label / Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Address Label *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Home', 'Office', 'Other'].map(lbl => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, title: lbl })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        addressForm.title === lbl ? 'neu-tile-active' : 'neu-tile-inactive'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahim Ahmed"
                    value={addressForm.recipient_name}
                    onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })}
                    className="neu-input w-full text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Mobile Phone (১১ ডিজিট) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={addressForm.recipient_phone}
                    onChange={(e) => setAddressForm({ ...addressForm, recipient_phone: e.target.value })}
                    className="neu-input w-full text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* District & Thana */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    District / জেলা *
                  </label>
                  <select
                    value={addressForm.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="neu-input w-full text-xs font-semibold"
                  >
                    {BD_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Thana / Upazila / থানা
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Uttara, Dhanmondi, Agrabad"
                    value={addressForm.thana}
                    onChange={(e) => setAddressForm({ ...addressForm, thana: e.target.value })}
                    className="neu-input w-full text-xs font-medium"
                  />
                </div>
              </div>

              {/* Detailed Street Address */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Street Address (House, Road, Block, Sector) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="House 12, Road 4, Sector 3, Uttara Model Town..."
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="neu-input w-full text-xs font-medium"
                />
              </div>

              {/* Shipping Zone Indicator */}
              <div className="neu-card-inset rounded-2xl p-3.5 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Courier Zone Rate:</span>
                <span className="font-mono font-bold text-primary dark:text-primary">
                  {addressForm.shipping_zone === 'inside_dhaka' 
                    ? 'Inside Dhaka City (৳80 Delivery)'
                    : addressForm.shipping_zone === 'suburb'
                    ? 'Dhaka Suburbs (৳100 Delivery)'
                    : 'Outside Dhaka (৳130 Delivery)'}
                </span>
              </div>

              {/* Default Address Switch */}
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  className="w-4 h-4 rounded text-primary"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Set this as my default primary delivery address
                </span>
              </label>

              {/* Submit CTAs */}
              <div className="flex items-center justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={closeAddressModal}
                  className="neu-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  className="neu-btn-primary"
                >
                  {createAddressMutation.isPending || updateAddressMutation.isPending 
                    ? 'Saving...' 
                    : editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8 text-muted-foreground">Loading Account Portal...</div>}>
      <AccountContent />
    </Suspense>
  );
}
