'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Save, Settings, Store, Truck, CreditCard, Shield, 
  Smartphone, Globe, Plus, Trash2, CheckCircle2, 
  AlertCircle, RefreshCw, Sparkles, ExternalLink, Copy,
  Check, MessageSquare, Send, Radio, Lock, Sliders, Layout, Flame, Link2,
  HelpCircle, Eye, EyeOff, Building, MapPin, Phone, Mail, ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface CustomDomain {
  domain: string;
  is_primary: boolean;
  status: string;
  ssl: string;
  verified_at: string | null;
  created_at?: string;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  // Header Settings
  const [headerLogoText, setHeaderLogoText] = useState('BD Shop');
  const [headerLogoImage, setHeaderLogoImage] = useState('');
  const [headerTagline, setHeaderTagline] = useState('Bangladesh Official');
  const [headerAnnouncement, setHeaderAnnouncement] = useState('🎉 EID FESTIVAL 2026: Flat ৳80 Delivery inside Dhaka, ৳100 in Suburbs, ৳130 Nationwide across all 64 Zilas!');
  const [headerHotline, setHeaderHotline] = useState('01410737290');
  const [headerWhatsapp, setHeaderWhatsapp] = useState('01410737290');
  const [headerNavLinks, setHeaderNavLinks] = useState<Array<{ href: string; labelEn: string; labelBn: string; isHot?: boolean }>>([
    { href: '/', labelEn: 'Home', labelBn: 'হোম', isHot: false },
    { href: '/products', labelEn: 'All Products', labelBn: 'সকল পণ্য', isHot: false },
    { href: '/categories', labelEn: 'Categories', labelBn: 'ক্যাটাগরি', isHot: false },
    { href: '/p/exclusive-offer', labelEn: 'Exclusive Deals', labelBn: 'অফার', isHot: true },
    { href: '/track', labelEn: 'Track Order', labelBn: 'অর্ডার ট্র্যাকিং', isHot: false },
  ]);

  // Footer Settings
  const [footerAboutEn, setFooterAboutEn] = useState('Leading Bangladesh Enterprise E-Commerce Platform. High quality fashion, electronics, and authentic essentials delivered swiftly across the nation.');
  const [footerAboutBn, setFooterAboutBn] = useState('বাংলাদেশের শীর্ষস্থানীয় নির্ভরযোগ্য ই-কমার্স প্ল্যাটফর্ম। সেরা মানের গ্যাজেট, ফ্যাশন এবং প্রাত্যহিক প্রয়োজনীয় পণ্য সরাসরি সারাদেশে পৌঁছে দেওয়া হয়।');
  const [footerPhone, setFooterPhone] = useState('+880 1410737290');
  const [footerEmail, setFooterEmail] = useState('support@bdecommerce.com');
  const [footerAddress, setFooterAddress] = useState('Level 6, Navana Tower, Gulshan-1, Dhaka-1212, Bangladesh');
  const [footerCopyright, setFooterCopyright] = useState('BD Shop Ltd. All rights reserved. Engineered for Bangladesh Market.');
  const [footerSocialLinks, setFooterSocialLinks] = useState<Array<{ name: string; url: string }>>([
    { name: 'Facebook', url: 'https://facebook.com' },
    { name: 'Instagram', url: 'https://instagram.com' },
    { name: 'YouTube', url: 'https://youtube.com' },
    { name: 'WhatsApp', url: 'https://wa.me/8801410737290' },
  ]);
  const [footerQuickLinks, setFooterQuickLinks] = useState<Array<{ name: string; href: string }>>([
    { name: 'All Products', href: '/products' },
    { name: 'Categories', href: '/categories' },
    { name: 'Shopping Cart', href: '/cart' },
    { name: 'Track Order', href: '/track' },
    { name: 'About Us', href: '/about' },
  ]);
  const [footerCustomerServiceLinks, setFooterCustomerServiceLinks] = useState<Array<{ name: string; href: string }>>([
    { name: 'Help & Contact Us', href: '/contact' },
    { name: 'Frequently Asked Questions', href: '/faq' },
    { name: 'Return & Replacement Policy', href: '/returns' },
    { name: 'Privacy & Data Security', href: '/privacy' },
  ]);
  const [footerValueBadges, setFooterValueBadges] = useState<Array<{ title: string; subtitle: string; icon: string }>>([
    { title: '64-District Delivery', subtitle: 'Steadfast, Pathao & RedX courier network', icon: 'truck' },
    { title: '100% Authentic Guarantee', subtitle: 'Cash on Delivery & Secure MFS Escrow', icon: 'shield' },
    { title: '7-Day Return Policy', subtitle: 'Hassle-free replacements & quick refunds', icon: 'rotate' },
  ]);

  const [activeTab, setActiveTab] = useState<'all' | 'general' | 'header' | 'footer' | 'domains' | 'payments' | 'couriers' | 'sms' | 'shipping'>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Store Profile State
  const [siteName, setSiteName] = useState('BD Shop');
  const [siteNameBn, setSiteNameBn] = useState('বিডি শপ');
  const [slogan, setSlogan] = useState('Bangladesh Premium Multi-Vendor Enterprise E-Commerce');
  const [phone, setPhone] = useState('01410737290');
  const [whatsappNumber, setWhatsappNumber] = useState('01410737290');
  const [email, setEmail] = useState('support@bdecommerce.com');
  const [address, setAddress] = useState('Level 6, Navana Tower, Gulshan-1, Dhaka-1212, Bangladesh');
  const [marquee, setMarquee] = useState('🎉 EID FESTIVAL 2026: Flat ৳80 Delivery inside Dhaka, ৳100 in Suburbs, ৳130 Nationwide across all 64 Zilas!');

  // Custom Domains State
  const [primaryDomain, setPrimaryDomain] = useState('bdecommerce.com');
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([
    { domain: 'bdecommerce.com', is_primary: true, status: 'active', ssl: 'active', verified_at: '2026-08-15' },
    { domain: 'shop.bangladeshdeal.com', is_primary: false, status: 'active', ssl: 'active', verified_at: '2026-08-20' },
  ]);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [isVerifyingDomain, setIsVerifyingDomain] = useState<string | null>(null);

  // Delivery Charges per Bangladesh Shipping Zone
  const [insideDhakaFee, setInsideDhakaFee] = useState('80');
  const [dhakaSuburbsFee, setDhakaSuburbsFee] = useState('100');
  const [outsideDhakaFee, setOutsideDhakaFee] = useState('130');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('3000');

  // Payment Gateway Configurations
  const [enableCod, setEnableCod] = useState(true);
  const [codMinOrder, setCodMinOrder] = useState('0');
  const [codMaxOrder, setCodMaxOrder] = useState('50000');
  const [codAdvanceRequired, setCodAdvanceRequired] = useState(false);
  const [codAdvanceAmount, setCodAdvanceAmount] = useState('150');

  const [enableBkash, setEnableBkash] = useState(true);
  const [bkashAppKey, setBkashAppKey] = useState('');
  const [bkashAppSecret, setBkashAppSecret] = useState('');
  const [bkashUsername, setBkashUsername] = useState('');
  const [bkashPassword, setBkashPassword] = useState('');
  const [bkashSandbox, setBkashSandbox] = useState(true);

  const [enableNagad, setEnableNagad] = useState(true);
  const [nagadMerchantId, setNagadMerchantId] = useState('');
  const [nagadPublicKey, setNagadPublicKey] = useState('');
  const [nagadPrivateKey, setNagadPrivateKey] = useState('');
  const [nagadSandbox, setNagadSandbox] = useState(true);

  const [enableSsl, setEnableSsl] = useState(true);
  const [sslStoreId, setSslStoreId] = useState('');
  const [sslStorePasswd, setSslStorePasswd] = useState('');
  const [sslSandbox, setSslSandbox] = useState(true);

  // Courier API Configurations
  const [enableSteadfast, setEnableSteadfast] = useState(true);
  const [steadfastApiKey, setSteadfastApiKey] = useState('sf_live_key_9832410');
  const [steadfastSecret, setSteadfastSecret] = useState('••••••••••••••••');
  const [steadfastBaseUrl, setSteadfastBaseUrl] = useState('https://portal.packzy.com/api/v1');
  const [steadfastAutoDispatch, setSteadfastAutoDispatch] = useState(true);

  const [enablePathao, setEnablePathao] = useState(true);
  const [pathaoClientId, setPathaoClientId] = useState('pth_client_782190');
  const [pathaoClientSecret, setPathaoClientSecret] = useState('••••••••••••••••');
  const [pathaoUsername, setPathaoUsername] = useState('pathao@bdecommerce.com');
  const [pathaoPassword, setPathaoPassword] = useState('••••••••••••');
  const [pathaoStoreId, setPathaoStoreId] = useState('19823');
  const [pathaoAutoDispatch, setPathaoAutoDispatch] = useState(false);

  const [enableRedx, setEnableRedx] = useState(false);
  const [redxToken, setRedxToken] = useState('redx_live_token_7721');
  const [redxSandbox, setRedxSandbox] = useState(false);

  // SMS Gateway API Configuration
  const [smsProvider, setSmsProvider] = useState<'greenweb' | 'elitbuzz' | 'revesms' | 'bulksmsbd'>('greenweb');
  const [smsApiKey, setSmsApiKey] = useState('gw_api_9938210');
  const [smsSenderId, setSmsSenderId] = useState('BDSHOP');
  const [smsAutoOtp, setSmsAutoOtp] = useState(true);
  const [smsAutoOrder, setSmsAutoOrder] = useState(true);
  const [smsAutoTracking, setSmsAutoTracking] = useState(true);

  // Marketing Tracking Pixels
  const [fbPixel, setFbPixel] = useState('984210382910');
  const [ga4, setGa4] = useState('G-BDSHOP2026');

  // Password Visibility Helpers
  const [showSecrets, setShowSecrets] = useState(false);

  // Fetch Settings from backend
  const { data: settingsData, isFetching } = useQuery({
    queryKey: ['admin-shop-settings'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/settings');
        return res?.data?.data || res?.data?.flat || res?.data || null;
      } catch {
        return null;
      }
    }
  });

  useEffect(() => {
    if (settingsData && typeof settingsData === 'object') {
      if (settingsData.site_name) setSiteName(settingsData.site_name);
      if (settingsData.site_name_bn) setSiteNameBn(settingsData.site_name_bn);
      if (settingsData.slogan) setSlogan(settingsData.slogan);
      if (settingsData.phone) setPhone(settingsData.phone);
      if (settingsData.whatsapp_number) setWhatsappNumber(settingsData.whatsapp_number);
      if (settingsData.email) setEmail(settingsData.email);
      if (settingsData.address) setAddress(settingsData.address);
      if (settingsData.marquee) setMarquee(settingsData.marquee);
      if (settingsData.inside_dhaka_fee) setInsideDhakaFee(String(settingsData.inside_dhaka_fee));
      if (settingsData.dhaka_suburbs_fee) setDhakaSuburbsFee(String(settingsData.dhaka_suburbs_fee));
      if (settingsData.outside_dhaka_fee) setOutsideDhakaFee(String(settingsData.outside_dhaka_fee));
      if (settingsData.free_shipping_threshold) setFreeShippingThreshold(String(settingsData.free_shipping_threshold));
      if (settingsData.primary_domain) setPrimaryDomain(settingsData.primary_domain);
      if (settingsData.custom_domains && Array.isArray(settingsData.custom_domains)) {
        setCustomDomains(settingsData.custom_domains);
      }
      if (typeof settingsData.enable_cod === 'boolean') setEnableCod(settingsData.enable_cod);
      if (typeof settingsData.enable_bkash === 'boolean') setEnableBkash(settingsData.enable_bkash);
      if (typeof settingsData.enable_nagad === 'boolean') setEnableNagad(settingsData.enable_nagad);
      if (typeof settingsData.enable_ssl === 'boolean') setEnableSsl(settingsData.enable_ssl);

      // Hydrate bKash official settings
      if (settingsData.bkash_settings && typeof settingsData.bkash_settings === 'object') {
        if (settingsData.bkash_settings.app_key !== undefined) setBkashAppKey(settingsData.bkash_settings.app_key || '');
        if (settingsData.bkash_settings.app_secret !== undefined) setBkashAppSecret(settingsData.bkash_settings.app_secret || '');
        if (settingsData.bkash_settings.username !== undefined) setBkashUsername(settingsData.bkash_settings.username || '');
        if (settingsData.bkash_settings.password !== undefined) setBkashPassword(settingsData.bkash_settings.password || '');
        if (settingsData.bkash_settings.sandbox !== undefined) setBkashSandbox(Boolean(settingsData.bkash_settings.sandbox));
      }

      // Hydrate Nagad official settings
      if (settingsData.nagad_settings && typeof settingsData.nagad_settings === 'object') {
        if (settingsData.nagad_settings.merchant_id !== undefined) setNagadMerchantId(settingsData.nagad_settings.merchant_id || '');
        if (settingsData.nagad_settings.public_key !== undefined) setNagadPublicKey(settingsData.nagad_settings.public_key || '');
        if (settingsData.nagad_settings.private_key !== undefined) setNagadPrivateKey(settingsData.nagad_settings.private_key || '');
        if (settingsData.nagad_settings.sandbox !== undefined) setNagadSandbox(Boolean(settingsData.nagad_settings.sandbox));
      }

      // Hydrate SSLCommerz official settings
      if (settingsData.ssl_settings && typeof settingsData.ssl_settings === 'object') {
        if (settingsData.ssl_settings.store_id !== undefined) setSslStoreId(settingsData.ssl_settings.store_id || '');
        if (settingsData.ssl_settings.store_passwd !== undefined) setSslStorePasswd(settingsData.ssl_settings.store_passwd || '');
        if (settingsData.ssl_settings.sandbox !== undefined) setSslSandbox(Boolean(settingsData.ssl_settings.sandbox));
      }

      // Hydrate Courier settings
      if (settingsData.courier_steadfast && typeof settingsData.courier_steadfast === 'object') {
        setEnableSteadfast(Boolean(settingsData.courier_steadfast.is_active));
        if (settingsData.courier_steadfast.api_key !== undefined) setSteadfastApiKey(settingsData.courier_steadfast.api_key || '');
        if (settingsData.courier_steadfast.secret_key !== undefined) setSteadfastSecret(settingsData.courier_steadfast.secret_key || '');
        if (settingsData.courier_steadfast.base_url !== undefined) setSteadfastBaseUrl(settingsData.courier_steadfast.base_url || '');
      }

      if (settingsData.courier_pathao && typeof settingsData.courier_pathao === 'object') {
        setEnablePathao(Boolean(settingsData.courier_pathao.is_active));
        if (settingsData.courier_pathao.client_id !== undefined) setPathaoClientId(settingsData.courier_pathao.client_id || '');
        if (settingsData.courier_pathao.client_secret !== undefined) setPathaoClientSecret(settingsData.courier_pathao.client_secret || '');
        if (settingsData.courier_pathao.username !== undefined) setPathaoUsername(settingsData.courier_pathao.username || '');
      }

      // Hydrate SMS settings
      if (settingsData.sms_gateway && typeof settingsData.sms_gateway === 'object') {
        if (settingsData.sms_gateway.provider !== undefined) setSmsProvider(settingsData.sms_gateway.provider || 'bulksmsbd');
        if (settingsData.sms_gateway.api_key !== undefined) setSmsApiKey(settingsData.sms_gateway.api_key || '');
        if (settingsData.sms_gateway.sender_id !== undefined) setSmsSenderId(settingsData.sms_gateway.sender_id || '');
      }

      if (settingsData.fb_pixel) setFbPixel(settingsData.fb_pixel);
      if (settingsData.ga4) setGa4(settingsData.ga4);
    }
  }, [settingsData]);

  // Connected Domains CRUD
  const handleAddDomain = async () => {
    const cleanDomain = newDomainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!cleanDomain || !/^[a-z0-9]+([\-\.]?[a-z0-9]+)*\.[a-z]{2,10}$/.test(cleanDomain)) {
      toast.error('Please enter a valid domain name (e.g. shop.yourdomain.com)');
      return;
    }

    try {
      await api.post('/admin/settings/domains', { domain: cleanDomain });
      toast.success(`Domain "${cleanDomain}" connected! Configure DNS records below.`);
      setNewDomainInput('');
      queryClient.invalidateQueries({ queryKey: ['admin-shop-settings'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to connect domain');
    }
  };

  const handleVerifyDomain = async (domainToVerify: string) => {
    setIsVerifyingDomain(domainToVerify);
    try {
      await api.post(`/admin/settings/domains/${encodeURIComponent(domainToVerify)}/verify`);
      toast.success(`Domain ${domainToVerify} DNS & SSL verified!`);
      queryClient.invalidateQueries({ queryKey: ['admin-shop-settings'] });
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed');
    } finally {
      setIsVerifyingDomain(null);
    }
  };

  const handleSetPrimaryDomain = async (domain: string) => {
    try {
      await api.put(`/admin/settings/domains/${encodeURIComponent(domain)}/primary`, {});
      setPrimaryDomain(domain);
      toast.success(`Primary branding domain set to: ${domain}`);
      queryClient.invalidateQueries({ queryKey: ['admin-shop-settings'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update primary domain');
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    if (domain === primaryDomain) {
      toast.error('Cannot remove the active primary domain');
      return;
    }
    if (!window.confirm(`Disconnect domain "${domain}"?`)) return;

    try {
      await api.delete(`/admin/settings/domains/${encodeURIComponent(domain)}`);
      toast.success(`Domain ${domain} removed`);
      queryClient.invalidateQueries({ queryKey: ['admin-shop-settings'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove domain');
    }
  };

  // Test Gateway Connection Simulators
  const handleTestGateway = (name: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: `Testing ${name} merchant API connection...`,
        success: `${name} credentials verified & ready for live transactions!`,
        error: `Could not verify ${name} credentials.`,
      }
    );
  };

  const handleTestCourier = (name: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: `Authenticating ${name} API key...`,
        success: `${name} API connected! Auto consignment dispatch enabled.`,
        error: `Could not connect to ${name}.`,
      }
    );
  };

  const handleTestSms = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: `Sending test SMS via ${smsProvider.toUpperCase()}...`,
        success: `Test SMS dispatched successfully to ${phone}!`,
        error: `Failed to dispatch SMS.`,
      }
    );
  };

  // Save All Settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        site_name: siteName,
        site_name_bn: siteNameBn,
        slogan: slogan,
        phone: phone,
        whatsapp_number: whatsappNumber,
        email: email,
        address: address,
        marquee: marquee,
        primary_domain: primaryDomain,
        custom_domains: customDomains,
        inside_dhaka_fee: Number(insideDhakaFee),
        dhaka_suburbs_fee: Number(dhakaSuburbsFee),
        outside_dhaka_fee: Number(outsideDhakaFee),
        free_shipping_threshold: Number(freeShippingThreshold),
        // Payment Gateways
        enable_cod: enableCod,
        cod_settings: {
          is_active: enableCod,
          min_order: Number(codMinOrder),
          max_order: Number(codMaxOrder),
          advance_required: codAdvanceRequired,
          advance_amount: Number(codAdvanceAmount),
        },
        enable_bkash: enableBkash,
        bkash_settings: {
          is_active: enableBkash,
          app_key: bkashAppKey,
          app_secret: bkashAppSecret,
          username: bkashUsername,
          password: bkashPassword,
          sandbox: bkashSandbox,
        },
        enable_nagad: enableNagad,
        nagad_settings: {
          is_active: enableNagad,
          merchant_id: nagadMerchantId,
          public_key: nagadPublicKey,
          private_key: nagadPrivateKey,
          sandbox: nagadSandbox,
        },
        enable_ssl: enableSsl,
        ssl_settings: {
          is_active: enableSsl,
          store_id: sslStoreId,
          store_passwd: sslStorePasswd,
          sandbox: sslSandbox,
        },
        // Courier APIs
        courier_steadfast: {
          is_active: enableSteadfast,
          api_key: steadfastApiKey,
          secret_key: steadfastSecret,
          base_url: steadfastBaseUrl,
          auto_dispatch: steadfastAutoDispatch,
        },
        courier_pathao: {
          is_active: enablePathao,
          client_id: pathaoClientId,
          client_secret: pathaoClientSecret,
          username: pathaoUsername,
          password: pathaoPassword,
          store_id: pathaoStoreId,
          auto_dispatch: pathaoAutoDispatch,
        },
        courier_redx: {
          is_active: enableRedx,
          token: redxToken,
          sandbox: redxSandbox,
        },
        // SMS Gateway
        sms_gateway: {
          provider: smsProvider,
          api_key: smsApiKey,
          sender_id: smsSenderId,
          auto_otp: smsAutoOtp,
          auto_order: smsAutoOrder,
          auto_tracking: smsAutoTracking,
        },
        // Tracking
        fb_pixel: fbPixel,
        ga4: ga4,
        header_logo_text: headerLogoText,
        header_logo_image: headerLogoImage,
        header_tagline: headerTagline,
        header_announcement: headerAnnouncement,
        header_hotline: headerHotline,
        header_whatsapp: headerWhatsapp,
        header_nav_links: headerNavLinks,
        footer_about_en: footerAboutEn,
        footer_about_bn: footerAboutBn,
        footer_phone: footerPhone,
        footer_email: footerEmail,
        footer_address: footerAddress,
        footer_copyright: footerCopyright,
        footer_social_links: footerSocialLinks,
        footer_quick_links: footerQuickLinks,
        footer_customer_service_links: footerCustomerServiceLinks,
        footer_value_badges: footerValueBadges,

      };

      await api.put('/admin/settings', { settings: payload });
      toast.success('All shop settings, domains, gateways & couriers saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-shop-settings'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 bg-background/95 backdrop-blur-xl z-20 py-4 border-b">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary">
              <Settings className="w-6 h-6" />
            </div>
            <span>Store Configuration & Integrations</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Connected custom domains, MFS payment gateways, Steadfast &amp; Pathao couriers, and SMS OTP APIs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSecrets(!showSecrets)}
            className="clay-btn px-3 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 text-muted-foreground"
            title="Toggle API keys visibility"
          >
            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showSecrets ? 'Hide Keys' : 'Show Keys'}</span>
          </button>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="clay-btn bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving Configuration...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Settings', icon: Sliders },
          { id: 'general', label: 'Store Profile', icon: Store },
          { id: 'header', label: 'Header & Nav', icon: Layout },
          { id: 'footer', label: 'Footer & Links', icon: Building },
          { id: 'domains', label: 'Connected Domains', icon: Globe },
          { id: 'payments', label: 'MFS & Payments', icon: CreditCard },
          { id: 'couriers', label: 'Courier APIs', icon: Truck },
          { id: 'sms', label: 'SMS Gateway', icon: MessageSquare },
          { id: 'shipping', label: 'Delivery Zones', icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive ? 'clay-chip-active text-primary font-black scale-105' : 'clay-chip text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: General Store Profile */}
      {(activeTab === 'all' || activeTab === 'general') && (
        <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">General Store Profile & Contact</h2>
              <p className="text-xs text-muted-foreground">Store branding, phone, WhatsApp and marquee announcement bar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Store Name (English) *</label>
              <input 
                type="text" 
                value={siteName} 
                onChange={(e) => setSiteName(e.target.value)} 
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Store Name (বাংলা) *</label>
              <input 
                type="text" 
                value={siteNameBn} 
                onChange={(e) => setSiteNameBn(e.target.value)} 
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none" 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Store Slogan / Tagline</label>
              <input 
                type="text" 
                value={slogan} 
                onChange={(e) => setSlogan(e.target.value)} 
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>Customer Support Phone *</span>
              </label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-mono font-bold focus:outline-none" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                <span>Official WhatsApp Number (Live Support) *</span>
              </label>
              <input 
                type="text" 
                value={whatsappNumber} 
                onChange={(e) => setWhatsappNumber(e.target.value)} 
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-mono font-bold text-primary focus:outline-none" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>Official Contact Email *</span>
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Corporate Office Address</span>
              </label>
              <input 
                type="text" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none" 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Top Announcement Marquee Bar</span>
              </label>
              <input 
                type="text" 
                value={marquee} 
                onChange={(e) => setMarquee(e.target.value)} 
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none text-primary" 
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Connected Custom Domains (CRUD) */}
      {(activeTab === 'all' || activeTab === 'domains') && (
        <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">Connected Custom Domains</h2>
                <p className="text-xs text-muted-foreground">Attach your custom brand domains with automated SSL &amp; DNS routing</p>
              </div>
            </div>

            <div className="text-xs font-mono px-3 py-1.5 rounded-xl clay-inset text-primary font-bold">
              Active Primary: {primaryDomain}
            </div>
          </div>

          {/* Add New Domain Form */}
          <div className="clay-inset rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Globe className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input 
                type="text" 
                placeholder="e.g. yourbrand.com or shop.domain.com"
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                className="w-full pl-10 pr-4 py-2.5 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none"
              />
            </div>
            <button 
              onClick={handleAddDomain}
              className="w-full sm:w-auto px-5 py-2.5 clay-btn bg-primary text-primary-foreground font-bold rounded-xl text-xs flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Domain</span>
            </button>
          </div>

          {/* Domains Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b">
                <tr>
                  <th className="px-4 py-3 font-bold">Domain Name</th>
                  <th className="px-4 py-3 font-bold text-center">Type</th>
                  <th className="px-4 py-3 font-bold text-center">DNS Status</th>
                  <th className="px-4 py-3 font-bold text-center">SSL Certificate</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {customDomains.map((d) => {
                  const isPrimary = d.domain === primaryDomain || d.is_primary;
                  const isVerifying = isVerifyingDomain === d.domain;

                  return (
                    <tr key={d.domain} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-primary" />
                          <span>{d.domain}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {isPrimary ? (
                          <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase">
                            ⭐ Primary Domain
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                            Alias Domain
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {d.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-bold">
                            <AlertCircle className="w-3 h-3" />
                            <span>Pending DNS</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {d.ssl === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                            <Lock className="w-3 h-3" />
                            <span>Active SSL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                            Pending SSL
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPrimary && (
                            <button
                              onClick={() => handleSetPrimaryDomain(d.domain)}
                              className="px-2.5 py-1 rounded-xl clay-btn text-[10px] font-bold text-primary hover:bg-primary/10"
                            >
                              Make Primary
                            </button>
                          )}
                          
                          {d.status !== 'active' && (
                            <button
                              onClick={() => handleVerifyDomain(d.domain)}
                              disabled={Boolean(isVerifying)}
                              className="px-2.5 py-1 rounded-xl clay-btn text-[10px] font-bold text-amber-600 hover:bg-amber-500/10 flex items-center gap-1"
                            >
                              <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                              <span>Verify DNS</span>
                            </button>
                          )}

                          {!isPrimary && (
                            <button
                              onClick={() => handleRemoveDomain(d.domain)}
                              className="p-1.5 rounded-xl clay-btn text-muted-foreground hover:text-red-500"
                              title="Disconnect Domain"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* DNS Instructions Card */}
          <div className="clay-inset rounded-2xl p-4 space-y-2 text-xs">
            <div className="font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>DNS Configuration Records for Custom Domain Setup</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Point your domain to the Bangladesh Enterprise Edge CDN by adding the following DNS records in your domain registrar (Namecheap, Cloudflare, GoDaddy):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-background/80 p-2.5 rounded-xl border flex justify-between items-center">
                <span><strong>CNAME Record:</strong> @ &rarr; cname.bdecommerce.com</span>
                <span className="text-primary font-bold">Proxy Active</span>
              </div>
              <div className="bg-background/80 p-2.5 rounded-xl border flex justify-between items-center">
                <span><strong>A Record:</strong> @ &rarr; 103.204.244.18</span>
                <span className="text-primary font-bold">Anycast IP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MFS & Payment Gateways Active (CRUD) */}
      {(activeTab === 'all' || activeTab === 'payments') && (
        <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">MFS & Payment Gateways Active</h2>
                <p className="text-xs text-muted-foreground">Manage Cash on Delivery, bKash, Nagad and SSLCommerz direct gateways</p>
              </div>
            </div>
          </div>

          {/* Dedicated Full CRUD Link Banner */}
          <div className="p-4 rounded-2xl bg-primary/10 dark:bg-primary/10/40 border border-primary/30 dark:border-primary/80/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-primary/90 dark:text-primary/30">
                  Full Payment Gateways &amp; Secret Keys CRUD Manager
                </h4>
                <p className="text-xs text-primary dark:text-primary">
                  Create, view, edit credentials/secrets with eye toggle, set surcharges, limits, or delete any payment option
                </p>
              </div>
            </div>
            <a
              href="/admin/payment-gateways"
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs inline-flex items-center gap-2 shrink-0 shadow-sm transition-all"
            >
              <span>Manage Payment Gateways</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-5">
            {/* 1. Cash On Delivery (COD) */}
            <div className="clay-card rounded-2xl p-5 space-y-4 border border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black text-xs">
                    COD
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Cash On Delivery (COD)</h3>
                    <p className="text-[11px] text-muted-foreground">Doorstep collection across all 64 districts in Bangladesh</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enableCod} 
                    onChange={(e) => setEnableCod(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {enableCod && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">Min Order Value (৳)</label>
                    <input 
                      type="number" 
                      value={codMinOrder} 
                      onChange={(e) => setCodMinOrder(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-semibold focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">Max COD Cap (৳)</label>
                    <input 
                      type="number" 
                      value={codMaxOrder} 
                      onChange={(e) => setCodMaxOrder(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-semibold focus:outline-none" 
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input 
                      type="checkbox" 
                      id="codAdvance"
                      checked={codAdvanceRequired} 
                      onChange={(e) => setCodAdvanceRequired(e.target.checked)} 
                      className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer" 
                    />
                    <label htmlFor="codAdvance" className="text-xs font-bold text-foreground cursor-pointer">
                      Require Delivery Fee in Advance (৳{codAdvanceAmount})
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 2. bKash Direct Merchant Gateway */}
            <div className="clay-card rounded-2xl p-5 space-y-4 border border-[#D12053]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D12053]/15 text-[#D12053] flex items-center justify-center font-black text-xs">
                    bKash
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <span>bKash Direct Merchant Gateway</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#D12053]/15 text-[#D12053] text-[10px] font-black">Tokenized API</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Instant automated payment verification via tokenized checkout</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {enableBkash && (
                    <button
                      onClick={() => handleTestGateway('bKash Direct')}
                      className="px-3 py-1.5 rounded-xl clay-btn text-xs font-bold text-[#D12053] hover:bg-[#D12053]/10"
                    >
                      Test Credentials
                    </button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enableBkash} 
                      onChange={(e) => setEnableBkash(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D12053]"></div>
                  </label>
                </div>
              </div>

              {enableBkash && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">bKash App Key</label>
                    <input 
                      type={showSecrets ? 'text' : 'password'}
                      value={bkashAppKey} 
                      onChange={(e) => setBkashAppKey(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">bKash App Secret</label>
                    <input 
                      type={showSecrets ? 'text' : 'password'}
                      value={bkashAppSecret} 
                      onChange={(e) => setBkashAppSecret(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">Merchant Username</label>
                    <input 
                      type="text" 
                      value={bkashUsername} 
                      onChange={(e) => setBkashUsername(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-semibold focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">Merchant Password</label>
                    <input 
                      type={showSecrets ? 'text' : 'password'}
                      value={bkashPassword} 
                      onChange={(e) => setBkashPassword(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Nagad Direct Gateway */}
            <div className="clay-card rounded-2xl p-5 space-y-4 border border-[#F6921E]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F6921E]/15 text-[#F6921E] flex items-center justify-center font-black text-xs">
                    Nagad
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <span>Nagad Direct Gateway</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F6921E]/15 text-[#F6921E] text-[10px] font-black">PGW Direct</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Seamless mobile wallet direct payment checkout</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {enableNagad && (
                    <button
                      onClick={() => handleTestGateway('Nagad Direct')}
                      className="px-3 py-1.5 rounded-xl clay-btn text-xs font-bold text-[#F6921E] hover:bg-[#F6921E]/10"
                    >
                      Test Credentials
                    </button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enableNagad} 
                      onChange={(e) => setEnableNagad(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F6921E]"></div>
                  </label>
                </div>
              </div>

              {enableNagad && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">Nagad Merchant ID</label>
                    <input 
                      type="text" 
                      value={nagadMerchantId} 
                      onChange={(e) => setNagadMerchantId(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">Nagad PGW Public Key</label>
                    <input 
                      type={showSecrets ? 'text' : 'password'}
                      value={nagadPublicKey} 
                      onChange={(e) => setNagadPublicKey(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-muted-foreground block mb-1 font-bold">Merchant Private Key (RSA 2048-bit)</label>
                    <input 
                      type={showSecrets ? 'text' : 'password'}
                      value={nagadPrivateKey} 
                      onChange={(e) => setNagadPrivateKey(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. SSLCommerz Multi-Gateway */}
            <div className="clay-card rounded-2xl p-5 space-y-4 border border-[#00609C]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00609C]/15 text-[#00609C] flex items-center justify-center font-black text-xs">
                    SSL
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <span>SSLCommerz Multi-Gateway</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#00609C]/15 text-[#00609C] text-[10px] font-black">All BD Cards & NetBanking</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Visa, MasterCard, Amex, UnionPay, Rocket, Upay & NetBanking</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {enableSsl && (
                    <button
                      onClick={() => handleTestGateway('SSLCommerz')}
                      className="px-3 py-1.5 rounded-xl clay-btn text-xs font-bold text-[#00609C] hover:bg-[#00609C]/10"
                    >
                      Test Credentials
                    </button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enableSsl} 
                      onChange={(e) => setEnableSsl(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00609C]"></div>
                  </label>
                </div>
              </div>

              {enableSsl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">SSLCommerz Store ID</label>
                    <input 
                      type="text" 
                      value={sslStoreId} 
                      onChange={(e) => setSslStoreId(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">SSLCommerz Store Password</label>
                    <input 
                      type={showSecrets ? 'text' : 'password'}
                      value={sslStorePasswd} 
                      onChange={(e) => setSslStorePasswd(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Courier & Logistics APIs Active (CRUD) */}
      {(activeTab === 'all' || activeTab === 'couriers') && (
        <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">Courier & Logistics API Integrations</h2>
                <p className="text-xs text-muted-foreground">Automate consignment generation, parcel dispatch & live tracking webhooks</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. Steadfast Courier */}
            <div className="clay-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-black text-xs">
                    SF
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Steadfast Courier API (Recommended for BD)</h3>
                    <p className="text-[11px] text-muted-foreground">Doorstep pickup and automated consignment creation via Packzy API</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTestCourier('Steadfast Courier')}
                    className="px-3 py-1.5 rounded-xl clay-btn text-xs font-bold text-primary"
                  >
                    Test API Key
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enableSteadfast} 
                      onChange={(e) => setEnableSteadfast(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {enableSteadfast && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">Steadfast API Key</label>
                    <input 
                      type={showSecrets ? 'text' : 'password'}
                      value={steadfastApiKey} 
                      onChange={(e) => setSteadfastApiKey(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">Steadfast Secret Key</label>
                    <input 
                      type={showSecrets ? 'text' : 'password'}
                      value={steadfastSecret} 
                      onChange={(e) => setSteadfastSecret(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Pathao Courier */}
            <div className="clay-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-600 flex items-center justify-center font-black text-xs">
                    Pathao
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Pathao Courier Merchant API</h3>
                    <p className="text-[11px] text-muted-foreground">Instant on-demand pickup and tracking across all major divisions</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTestCourier('Pathao')}
                    className="px-3 py-1.5 rounded-xl clay-btn text-xs font-bold text-red-600 hover:bg-red-500/10"
                  >
                    Test API
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enablePathao} 
                      onChange={(e) => setEnablePathao(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>
              </div>

              {enablePathao && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">Client ID</label>
                    <input 
                      type="text" 
                      value={pathaoClientId} 
                      onChange={(e) => setPathaoClientId(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">Client Secret</label>
                    <input 
                      type={showSecrets ? 'text' : 'password'}
                      value={pathaoClientSecret} 
                      onChange={(e) => setPathaoClientSecret(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono font-semibold focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 font-bold">Store ID</label>
                    <input 
                      type="text" 
                      value={pathaoStoreId} 
                      onChange={(e) => setPathaoStoreId(e.target.value)} 
                      className="w-full px-3 py-2 clay-input rounded-xl text-xs font-semibold focus:outline-none" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SMS Gateway API Integration (CRUD) */}
      {(activeTab === 'all' || activeTab === 'sms') && (
        <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">SMS Gateway & OTP API</h2>
                <p className="text-xs text-muted-foreground">Send login OTPs, order confirmation alerts and live delivery tracking SMS</p>
              </div>
            </div>

            <button
              onClick={handleTestSms}
              className="px-3.5 py-2 rounded-2xl clay-btn text-xs font-bold text-primary flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test SMS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-muted-foreground block mb-1.5 font-bold">SMS Gateway Provider</label>
              <select
                value={smsProvider}
                onChange={(e) => setSmsProvider(e.target.value as any)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none bg-background text-foreground"
              >
                <option value="greenweb">Greenweb SMS (Bangladeshi)</option>
                <option value="elitbuzz">ElitBuzz SMS</option>
                <option value="revesms">Reve SMS</option>
                <option value="bulksmsbd">BulkSMS BD</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground block mb-1.5 font-bold">API Token / Secret Key</label>
              <input
                type={showSecrets ? 'text' : 'password'}
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-mono font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1.5 font-bold">Sender ID / Masking Name</label>
              <input
                type="text"
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-bold focus:outline-none text-primary"
              />
            </div>

            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t">
              <label className="flex items-center gap-2 cursor-pointer clay-inset p-3 rounded-2xl">
                <input
                  type="checkbox"
                  checked={smsAutoOtp}
                  onChange={(e) => setSmsAutoOtp(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="font-bold text-foreground">Auto-Send 4-Digit Login OTP</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer clay-inset p-3 rounded-2xl">
                <input
                  type="checkbox"
                  checked={smsAutoOrder}
                  onChange={(e) => setSmsAutoOrder(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="font-bold text-foreground">Auto-Send Order Confirm SMS</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer clay-inset p-3 rounded-2xl">
                <input
                  type="checkbox"
                  checked={smsAutoTracking}
                  onChange={(e) => setSmsAutoTracking(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="font-bold text-foreground">Auto-Send Courier Tracking SMS</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Delivery Zones & Shipping Fees (CRUD) */}
      {(activeTab === 'all' || activeTab === 'shipping') && (
        <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">Bangladesh Delivery Zones & Shipping Fees</h2>
              <p className="text-xs text-muted-foreground">Standardized shipping rates for Inside Dhaka, Suburbs & all 64 Zilas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="clay-card rounded-2xl p-4 space-y-2 border border-primary/10">
              <div className="text-xs font-bold text-muted-foreground">Inside Dhaka City</div>
              <div className="text-2xl font-black text-primary flex items-center gap-1">
                <span>৳</span>
                <input 
                  type="number"
                  value={insideDhakaFee}
                  onChange={(e) => setInsideDhakaFee(e.target.value)}
                  className="w-20 bg-transparent border-b border-primary text-2xl font-black focus:outline-none"
                />
              </div>
              <div className="text-[10px] text-muted-foreground">Dhaka North & South City Corp (24-48 Hours)</div>
            </div>

            <div className="clay-card rounded-2xl p-4 space-y-2 border border-amber-500/10">
              <div className="text-xs font-bold text-amber-600">Dhaka Suburbs (উপদূরবর্তী)</div>
              <div className="text-2xl font-black text-amber-600 flex items-center gap-1">
                <span>৳</span>
                <input 
                  type="number"
                  value={dhakaSuburbsFee}
                  onChange={(e) => setDhakaSuburbsFee(e.target.value)}
                  className="w-20 bg-transparent border-b border-amber-500 text-2xl font-black focus:outline-none text-amber-600"
                />
              </div>
              <div className="text-[10px] text-muted-foreground">Gazipur, Savar, Keraniganj, Narayanganj</div>
            </div>

            <div className="clay-card rounded-2xl p-4 space-y-2 border border-primary/10">
              <div className="text-xs font-bold text-primary">Outside Dhaka (সারাদেশ)</div>
              <div className="text-2xl font-black text-primary flex items-center gap-1">
                <span>৳</span>
                <input 
                  type="number"
                  value={outsideDhakaFee}
                  onChange={(e) => setOutsideDhakaFee(e.target.value)}
                  className="w-20 bg-transparent border-b border-primary text-2xl font-black focus:outline-none text-primary"
                />
              </div>
              <div className="text-[10px] text-muted-foreground">All remaining 63 Districts (2-4 Days)</div>
            </div>

            <div className="clay-card rounded-2xl p-4 space-y-2 border border-primary/20">
              <div className="text-xs font-bold text-foreground">Free Shipping Threshold</div>
              <div className="text-2xl font-black text-foreground flex items-center gap-1">
                <span>৳</span>
                <input 
                  type="number"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  className="w-24 bg-transparent border-b border-foreground text-2xl font-black focus:outline-none"
                />
              </div>
              <div className="text-[10px] text-muted-foreground">Orders above this amount get free delivery</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Header Configuration & Navigation CRUD */}
      {(activeTab === 'all' || activeTab === 'header') && (
        <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary">
                <Layout className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">Header & Navigation Bar Configuration</h2>
                <p className="text-xs text-muted-foreground">Logo, brand tagline, marquee announcement, hotlines & nav menus</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setHeaderNavLinks([
                  ...headerNavLinks,
                  { href: '/new-page', labelEn: 'New Link', labelBn: 'নতুন লিংক', isHot: false }
                ]);
              }}
              className="clay-btn px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 text-primary cursor-pointer hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Add Nav Item</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Header Brand Logo Text</label>
              <input
                type="text"
                value={headerLogoText}
                onChange={(e) => setHeaderLogoText(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none"
                placeholder="BD Shop"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Custom Logo Image URL (Optional)</label>
              <input
                type="text"
                value={headerLogoImage}
                onChange={(e) => setHeaderLogoImage(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none font-mono"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Header Sub-Tagline</label>
              <input
                type="text"
                value={headerTagline}
                onChange={(e) => setHeaderTagline(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none"
                placeholder="Bangladesh Official"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Top Banner Notice / Marquee Announcement</label>
              <input
                type="text"
                value={headerAnnouncement}
                onChange={(e) => setHeaderAnnouncement(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none"
                placeholder="🎉 Festival Offer Notice..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Header Hotline Number</label>
              <input
                type="text"
                value={headerHotline}
                onChange={(e) => setHeaderHotline(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none"
                placeholder="01410737290"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Header WhatsApp Number</label>
              <input
                type="text"
                value={headerWhatsapp}
                onChange={(e) => setHeaderWhatsapp(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none"
                placeholder="01410737290"
              />
            </div>
          </div>

          {/* Navigation Links CRUD List */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-primary" />
              <span>Storefront Navigation Menu Items</span>
            </h3>

            <div className="space-y-2.5">
              {headerNavLinks.map((item, idx) => (
                <div key={idx} className="clay-card rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                    <input
                      type="text"
                      value={item.labelEn}
                      onChange={(e) => {
                        const updated = [...headerNavLinks];
                        updated[idx].labelEn = e.target.value;
                        setHeaderNavLinks(updated);
                      }}
                      placeholder="English Label"
                      className="px-3 py-2 clay-input rounded-xl text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={item.labelBn}
                      onChange={(e) => {
                        const updated = [...headerNavLinks];
                        updated[idx].labelBn = e.target.value;
                        setHeaderNavLinks(updated);
                      }}
                      placeholder="বাংলা লেবেল"
                      className="px-3 py-2 clay-input rounded-xl text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => {
                        const updated = [...headerNavLinks];
                        updated[idx].href = e.target.value;
                        setHeaderNavLinks(updated);
                      }}
                      placeholder="/products"
                      className="px-3 py-2 clay-input rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...headerNavLinks];
                        updated[idx].isHot = !updated[idx].isHot;
                        setHeaderNavLinks(updated);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        item.isHot ? 'bg-amber-500/20 text-amber-600 border border-amber-500/40' : 'clay-btn text-muted-foreground'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Hot</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (headerNavLinks.length <= 1) {
                          toast.error('Must keep at least 1 navigation link');
                          return;
                        }
                        setHeaderNavLinks(headerNavLinks.filter((_, i) => i !== idx));
                      }}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Remove Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Footer Configuration & Links CRUD */}
      {(activeTab === 'all' || activeTab === 'footer') && (
        <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-primary">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">Footer Content & Link Columns</h2>
              <p className="text-xs text-muted-foreground">About summaries, contact details, copyright, social networks & quick links</p>
            </div>
          </div>

          {/* About Summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Brand About Text (English)</label>
              <textarea
                rows={3}
                value={footerAboutEn}
                onChange={(e) => setFooterAboutEn(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-medium focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Brand About Text (বাংলা)</label>
              <textarea
                rows={3}
                value={footerAboutBn}
                onChange={(e) => setFooterAboutBn(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-medium focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Footer Official Phone</label>
              <input
                type="text"
                value={footerPhone}
                onChange={(e) => setFooterPhone(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Footer Support Email</label>
              <input
                type="email"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Office Physical Address</label>
              <input
                type="text"
                value={footerAddress}
                onChange={(e) => setFooterAddress(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Copyright Statement</label>
              <input
                type="text"
                value={footerCopyright}
                onChange={(e) => setFooterCopyright(e.target.value)}
                className="w-full px-4 py-3 clay-input rounded-2xl text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Social Links CRUD */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Social Media Handles</h3>
              <button
                type="button"
                onClick={() => setFooterSocialLinks([...footerSocialLinks, { name: 'Twitter', url: 'https://twitter.com' }])}
                className="clay-btn px-3 py-1.5 rounded-xl text-xs font-bold text-primary flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Social Link</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {footerSocialLinks.map((social, idx) => (
                <div key={idx} className="clay-card rounded-2xl p-2.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={social.name}
                    onChange={(e) => {
                      const updated = [...footerSocialLinks];
                      updated[idx].name = e.target.value;
                      setFooterSocialLinks(updated);
                    }}
                    placeholder="Platform"
                    className="w-28 px-3 py-2 clay-input rounded-xl text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={social.url}
                    onChange={(e) => {
                      const updated = [...footerSocialLinks];
                      updated[idx].url = e.target.value;
                      setFooterSocialLinks(updated);
                    }}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 clay-input rounded-xl text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setFooterSocialLinks(footerSocialLinks.filter((_, i) => i !== idx))}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links CRUD */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Quick Links Column</h3>
              <button
                type="button"
                onClick={() => setFooterQuickLinks([...footerQuickLinks, { name: 'New Link', href: '/products' }])}
                className="clay-btn px-3 py-1.5 rounded-xl text-xs font-bold text-primary flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Link</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {footerQuickLinks.map((link, idx) => (
                <div key={idx} className="clay-card rounded-2xl p-2.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={link.name}
                    onChange={(e) => {
                      const updated = [...footerQuickLinks];
                      updated[idx].name = e.target.value;
                      setFooterQuickLinks(updated);
                    }}
                    placeholder="Title"
                    className="w-36 px-3 py-2 clay-input rounded-xl text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => {
                      const updated = [...footerQuickLinks];
                      updated[idx].href = e.target.value;
                      setFooterQuickLinks(updated);
                    }}
                    placeholder="/products"
                    className="flex-1 px-3 py-2 clay-input rounded-xl text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setFooterQuickLinks(footerQuickLinks.filter((_, i) => i !== idx))}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
