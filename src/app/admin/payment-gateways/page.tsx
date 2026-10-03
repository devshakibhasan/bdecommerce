'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, Plus, Trash2, Edit3, Check, X, 
  ShieldCheck, AlertTriangle, KeyRound, ExternalLink,
  CheckCircle2, XCircle, Eye, EyeOff, Building2,
  Smartphone, Wallet, Banknote, RefreshCw, Sparkles,
  Info, HelpCircle, Layers, ToggleLeft, ToggleRight,
  Lock, Settings2, Sliders, ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface PaymentGatewayItem {
  id: number;
  name: string;
  code: string;
  title: string;
  title_bn: string | null;
  badge?: string | null;
  badge_bn?: string | null;
  type: 'gateway' | 'mfs' | 'cod' | 'bank' | 'custom';
  description: string | null;
  description_bn: string | null;
  credentials: Record<string, any> | null;
  masked_credentials?: Record<string, any>;
  is_active: boolean;
  is_sandbox: boolean;
  charge_percentage: number;
  charge_fixed: number;
  min_amount: number | null;
  max_amount: number | null;
  icon: string | null;
  instructions: string | null;
  instructions_bn: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface GatewayStats {
  total: number;
  active: number;
  sandbox: number;
  live: number;
}

interface PresetField {
  key: string;
  label: string;
  isSecret: boolean;
  placeholder: string;
  isTextarea?: boolean;
}

interface GatewayPreset {
  code: string;
  name: string;
  title: string;
  title_bn: string;
  badge?: string;
  badge_bn?: string;
  type: 'gateway' | 'mfs' | 'cod' | 'bank' | 'custom';
  icon: string;
  description: string;
  description_bn: string;
  instructions: string;
  instructions_bn: string;
  charge_percentage: number;
  charge_fixed: number;
  min_amount: number;
  max_amount: number | null;
  is_sandbox: boolean;
  credentials: Record<string, any>;
  fields: PresetField[];
}

// Gateway Presets for quick generation of standardized Bangladeshi payment options
const GATEWAY_PRESETS: GatewayPreset[] = [
  {
    code: 'bkash',
    name: 'bKash Direct Merchant Gateway',
    title: 'bKash Direct Merchant Gateway',
    title_bn: 'বিকাশ ডিরেক্ট মার্চেন্ট গেটওয়ে',
    badge: 'Tokenized API',
    badge_bn: 'টোকেনাইজড এপিআই',
    type: 'mfs' as const,
    icon: 'bkash',
    description: 'Instant automated payment verification via tokenized checkout',
    description_bn: 'টোকেনাইজড চেকআউট এর মাধ্যমে তাত্ক্ষণিক স্বয়ংক্রিয় পেমেন্ট ভেরিফিকেশন',
    instructions: 'You will be redirected to the secure bKash checkout portal to complete payment.',
    instructions_bn: 'অফিসিয়াল বিকাশ পেমেন্ট পেজে রিডাইরেক্ট করে পেমেন্ট সম্পন্ন করুন।',
    charge_percentage: 0,
    charge_fixed: 0,
    min_amount: 10,
    max_amount: 250000,
    is_sandbox: true,
    credentials: {
      app_key: '',
      app_secret: '',
      username: '',
      password: '',
      base_url: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    },
    fields: [
      { key: 'app_key', label: 'bKash App Key', isSecret: false, placeholder: 'Enter Merchant App Key' },
      { key: 'app_secret', label: 'bKash App Secret', isSecret: true, placeholder: 'Enter Merchant App Secret' },
      { key: 'username', label: 'Merchant Username', isSecret: false, placeholder: 'bKash Merchant Username' },
      { key: 'password', label: 'Merchant Password', isSecret: true, placeholder: 'bKash Merchant Password' },
      { key: 'base_url', label: 'API Base URL', isSecret: false, placeholder: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' },
    ]
  },
  {
    code: 'nagad',
    name: 'Nagad Direct Gateway',
    title: 'Nagad Direct Gateway',
    title_bn: 'নগদ ডিরেক্ট গেটওয়ে',
    badge: 'PGW Direct',
    badge_bn: 'পিজিডব্লিউ ডিরেক্ট',
    type: 'mfs' as const,
    icon: 'nagad',
    description: 'Seamless mobile wallet direct payment checkout',
    description_bn: 'সরাসরি মোবাইল ওয়ালেট পেমেন্ট চেকআউট',
    instructions: 'Enter your Nagad wallet account number and PIN on the official secured portal.',
    instructions_bn: 'অফিসিয়াল নিরাপদ পোর্টালে আপনার নগদ একাউন্ট নম্বর এবং পিন দিন।',
    charge_percentage: 0,
    charge_fixed: 0,
    min_amount: 10,
    max_amount: 250000,
    is_sandbox: true,
    credentials: {
      merchant_id: '',
      merchant_phone: '',
      public_key: '',
      private_key: '',
      base_url: 'https://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs',
    },
    fields: [
      { key: 'merchant_id', label: 'Nagad Merchant ID', isSecret: false, placeholder: 'e.g. 68XXXXXXXXX' },
      { key: 'merchant_phone', label: 'Merchant Mobile Number', isSecret: false, placeholder: '01XXXXXXXXX' },
      { key: 'public_key', label: 'Nagad PGW Public Key (PEM)', isSecret: false, isTextarea: true, placeholder: '-----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----' },
      { key: 'private_key', label: 'Merchant RSA Private Key (PEM)', isSecret: true, isTextarea: true, placeholder: '-----BEGIN RSA PRIVATE KEY----- ... -----END RSA PRIVATE KEY-----' },
      { key: 'base_url', label: 'API Base URL', isSecret: false, placeholder: 'https://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs' },
    ]
  },
  {
    code: 'sslcommerz',
    name: 'SSLCommerz Multi-Gateway',
    title: 'SSLCommerz Multi-Gateway',
    title_bn: 'এসএসএলকমার্জ মাল্টি-গেটওয়ে',
    badge: 'All BD Cards & NetBanking',
    badge_bn: 'সকল দেশীয় কার্ড ও নেটব্যাংকিং',
    type: 'gateway' as const,
    icon: 'sslcommerz',
    description: 'Visa, MasterCard, Amex, UnionPay, Rocket, Upay & NetBanking',
    description_bn: 'ভিসা, মাস্টারকার্ড, অ্যামেক্স, ইউনিয়নপে, রকেট, উপায় এবং নেটব্যাংকিং',
    instructions: 'Choose between Cards, Internet Banking, or Mobile Wallets on the SSLCommerz portal.',
    instructions_bn: 'কার্ড, ইন্টারনেট ব্যাংকিং অথবা মোবাইল ওয়ালেটের মাধ্যমে পেমেন্ট সম্পন্ন করুন।',
    charge_percentage: 0,
    charge_fixed: 0,
    min_amount: 10,
    max_amount: 500000,
    is_sandbox: true,
    credentials: {
      store_id: 'testbox',
      store_passwd: 'qwerty',
    },
    fields: [
      { key: 'store_id', label: 'Store ID', isSecret: false, placeholder: 'e.g. your_store_id or testbox' },
      { key: 'store_passwd', label: 'Store Password', isSecret: true, placeholder: 'e.g. your_store_password or qwerty' },
    ]
  },
  {
    code: 'aamarpay',
    name: 'AamarPay Online Gateway',
    title: 'AamarPay Gateway',
    title_bn: 'আমারপে গেটওয়ে',
    type: 'gateway' as const,
    icon: 'aamarpay',
    description: 'High performance Bangladesh payment gateway supporting multi-channel payments.',
    description_bn: 'কার্ড, ডিজিটাল ওয়ালেট এবং নেট ব্যাংকিং এর সমন্বিত পেমেন্ট প্ল্যাটফর্ম।',
    instructions: 'You will be redirected to the secure AamarPay portal.',
    instructions_bn: 'আমারপে সুরক্ষিত পোর্টালে পেমেন্ট করুন।',
    charge_percentage: 0,
    charge_fixed: 0,
    min_amount: 10,
    max_amount: 300000,
    is_sandbox: true,
    credentials: {
      store_id: '',
      signature_key: '',
    },
    fields: [
      { key: 'store_id', label: 'Store ID', isSecret: false, placeholder: 'e.g. aamarpaytest' },
      { key: 'signature_key', label: 'Signature Key', isSecret: true, placeholder: 'AamarPay signature key' },
    ]
  },
  {
    code: 'cod',
    name: 'Cash on Delivery (COD)',
    title: 'Cash on Delivery',
    title_bn: 'ক্যাশ অন ডেলিভারি',
    type: 'cod' as const,
    icon: 'banknote',
    description: 'Pay cash directly to the courier agent when parcel arrives at your doorstep.',
    description_bn: 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন। সারা দেশে বিশ্বস্ত ডেলিভারি।',
    instructions: 'Please keep exact cash ready upon parcel arrival.',
    instructions_bn: 'ডেলিভারি ম্যানের কাছে পণ্য গ্রহণের সময় সঠিক মূল্য পরিশোধ করুন।',
    charge_percentage: 0,
    charge_fixed: 0,
    min_amount: 0,
    max_amount: 50000,
    is_sandbox: false,
    credentials: {
      advance_required: false,
      advance_amount: 0,
    },
    fields: [
      { key: 'advance_amount', label: 'Advance Delivery Fee Required (৳)', isSecret: false, placeholder: '0 or 150 for courier security' },
    ]
  },
  {
    code: 'rocket',
    name: 'DBBL Rocket MFS',
    title: 'DBBL Rocket Mobile Banking',
    title_bn: 'রকেট পেমেন্ট',
    type: 'mfs' as const,
    icon: 'rocket',
    description: 'Dutch-Bangla Bank Rocket Mobile Banking payment gateway & merchant account.',
    description_bn: 'ডাচ-বাংলা ব্যাংক রকেট মোবাইল ব্যাংকিং একাউন্টের মাধ্যমে পেমেন্ট।',
    instructions: 'Send money to our Rocket Merchant number and use your Order Number as reference.',
    instructions_bn: 'রকেট মার্চেন্ট নম্বরে পেমেন্ট প্রেরণ করুন এবং অর্ডার নম্বর রেফারেন্সে দিন।',
    charge_percentage: 0,
    charge_fixed: 0,
    min_amount: 10,
    max_amount: 150000,
    is_sandbox: true,
    credentials: {
      merchant_number: '01XXXXXXXXX',
      biller_id: '',
    },
    fields: [
      { key: 'merchant_number', label: 'Rocket Merchant Number', isSecret: false, placeholder: '01XXXXXXXXX' },
      { key: 'biller_id', label: 'DBBL Biller ID (Optional)', isSecret: false, placeholder: 'e.g. 1234' },
    ]
  },
  {
    code: 'bank_transfer',
    name: 'Direct Corporate Bank Wire',
    title: 'Bank Deposit / BEFTN / NPSB',
    title_bn: 'সরাসরি ব্যাংক ডিপোজিট',
    type: 'bank' as const,
    icon: 'building-2',
    description: 'Transfer directly into our corporate bank account via BEFTN, NPSB, or Branch Cash Deposit.',
    description_bn: 'আমাদের কর্পোরেট ব্যাংক অ্যাকাউন্টে সরাসরি ট্রান্সফার করুন।',
    instructions: 'Deposit funds to our bank account. Use your Order ID as the deposit transaction reference.',
    instructions_bn: 'ব্যাংক অ্যাকাউন্টে টাকা জমা দিয়ে অর্ডার নম্বর রেফারেন্সে উল্লেখ করুন।',
    charge_percentage: 0,
    charge_fixed: 0,
    min_amount: 1000,
    max_amount: 2000000,
    is_sandbox: false,
    credentials: {
      bank_name: 'City Bank PLC',
      account_name: 'BD Shop Ltd',
      account_number: '1102839281001',
      branch_name: 'Gulshan 1 Branch',
      routing_number: '225272635',
    },
    fields: [
      { key: 'bank_name', label: 'Bank Name', isSecret: false, placeholder: 'e.g. City Bank PLC / BRAC Bank' },
      { key: 'account_name', label: 'Account Holder Name', isSecret: false, placeholder: 'e.g. BD Shop Ltd' },
      { key: 'account_number', label: 'Account Number', isSecret: false, placeholder: 'e.g. 1102839281001' },
      { key: 'branch_name', label: 'Branch Name', isSecret: false, placeholder: 'e.g. Gulshan Branch' },
      { key: 'routing_number', label: 'Routing Number', isSecret: false, placeholder: 'e.g. 225272635' },
    ]
  },
  {
    code: 'custom',
    name: 'Custom Payment Gateway',
    title: 'Custom Payment Option',
    title_bn: 'কাস্টম পেমেন্ট অপশন',
    type: 'custom' as const,
    icon: 'wallet',
    description: 'Custom payment integration or alternative gateway.',
    description_bn: 'কাস্টম অনলাইন বা অফলাইন পেমেন্ট অপশন।',
    instructions: 'Follow standard payment instructions.',
    instructions_bn: 'প্রদত্ত নির্দেশনা মোতাবেক পেমেন্ট সম্পন্ন করুন।',
    charge_percentage: 0,
    charge_fixed: 0,
    min_amount: 0,
    max_amount: null,
    is_sandbox: true,
    credentials: {},
    fields: []
  },
];

export default function AdminPaymentGatewaysPage() {
  const queryClient = useQueryClient();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'mfs' | 'gateway' | 'cod' | 'bank' | 'custom'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayItem | null>(null);

  // Form State
  const [selectedPresetCode, setSelectedPresetCode] = useState<string>('bkash');
  const [formData, setFormData] = useState<any>({
    name: '',
    code: '',
    title: '',
    title_bn: '',
    type: 'gateway',
    description: '',
    description_bn: '',
    is_active: true,
    is_sandbox: true,
    charge_percentage: 0,
    charge_fixed: 0,
    min_amount: '',
    max_amount: '',
    icon: 'credit-card',
    instructions: '',
    instructions_bn: '',
    sort_order: 0,
    credentials: {} as Record<string, any>,
  });

  // Dynamic custom key-value pairs
  const [customCredKeys, setCustomCredKeys] = useState<Array<{ key: string; value: string; isSecret: boolean }>>([]);

  // Visibility toggle state for secret fields: { [fieldKey]: boolean }
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});

  const toggleSecretVisibility = (key: string) => {
    setShowSecretMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Fetch Payment Gateways
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-payment-gateways'],
    queryFn: async () => {
      const res: any = await api.get('/admin/payment-gateways');
      return res.data?.data || { gateways: [], stats: { total: 0, active: 0, sandbox: 0, live: 0 } };
    },
  });

  const gateways: PaymentGatewayItem[] = data?.gateways || [];
  const stats: GatewayStats = data?.stats || { total: 0, active: 0, sandbox: 0, live: 0 };

  // 2. Toggle Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res: any = await api.post(`/admin/payment-gateways/${id}/toggle-active`);
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Gateway status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-payment-gateways'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to toggle gateway status');
    }
  });

  // 3. Toggle Sandbox Mutation
  const toggleSandboxMutation = useMutation({
    mutationFn: async (id: number) => {
      const res: any = await api.post(`/admin/payment-gateways/${id}/toggle-sandbox`);
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Environment mode updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-payment-gateways'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to toggle environment mode');
    }
  });

  // 4. Create Gateway Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await api.post('/admin/payment-gateways', payload);
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Payment gateway configured successfully!');
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-payment-gateways'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create payment gateway');
    }
  });

  // 5. Update Gateway Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res: any = await api.put(`/admin/payment-gateways/${id}`, payload);
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Payment gateway & secrets updated successfully!');
      setIsEditModalOpen(false);
      setSelectedGateway(null);
      queryClient.invalidateQueries({ queryKey: ['admin-payment-gateways'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update payment gateway');
    }
  });

  // 6. Delete Gateway Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res: any = await api.delete(`/admin/payment-gateways/${id}`);
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Payment gateway deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedGateway(null);
      queryClient.invalidateQueries({ queryKey: ['admin-payment-gateways'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete payment gateway');
    }
  });

  // Helper: Open Add Modal with Preset
  const handleOpenAddModal = (presetCode = 'bkash') => {
    setSelectedPresetCode(presetCode);
    const preset = GATEWAY_PRESETS.find(p => p.code === presetCode) || GATEWAY_PRESETS[0];

    setFormData({
      name: preset.name,
      code: preset.code === 'custom' ? '' : preset.code,
      title: preset.title,
      title_bn: preset.title_bn,
      type: preset.type,
      description: preset.description,
      description_bn: preset.description_bn,
      is_active: true,
      is_sandbox: preset.is_sandbox,
      charge_percentage: preset.charge_percentage,
      charge_fixed: preset.charge_fixed,
      min_amount: preset.min_amount ?? '',
      max_amount: preset.max_amount ?? '',
      icon: preset.icon,
      instructions: preset.instructions,
      instructions_bn: preset.instructions_bn,
      sort_order: (gateways.length + 1),
      credentials: { ...(preset.credentials || {}) },
    });

    setCustomCredKeys([]);
    setShowSecretMap({});
    setIsAddModalOpen(true);
  };

  // Change preset in Add Modal
  const handleSelectPresetInModal = (presetCode: string) => {
    setSelectedPresetCode(presetCode);
    const preset = GATEWAY_PRESETS.find(p => p.code === presetCode);
    if (!preset) return;

    setFormData((prev: any) => ({
      ...prev,
      name: preset.name,
      code: preset.code === 'custom' ? '' : preset.code,
      title: preset.title,
      title_bn: preset.title_bn,
      type: preset.type,
      description: preset.description,
      description_bn: preset.description_bn,
      is_sandbox: preset.is_sandbox,
      charge_percentage: preset.charge_percentage,
      charge_fixed: preset.charge_fixed,
      min_amount: preset.min_amount ?? '',
      max_amount: preset.max_amount ?? '',
      icon: preset.icon,
      instructions: preset.instructions,
      instructions_bn: preset.instructions_bn,
      credentials: { ...(preset.credentials || {}) },
    }));
  };

  // Open Edit Modal with full credentials
  const handleOpenEditModal = (gw: PaymentGatewayItem) => {
    setSelectedGateway(gw);
    const creds = gw.credentials || {};

    setFormData({
      name: gw.name,
      code: gw.code,
      title: gw.title,
      title_bn: gw.title_bn || '',
      type: gw.type,
      description: gw.description || '',
      description_bn: gw.description_bn || '',
      is_active: gw.is_active,
      is_sandbox: gw.is_sandbox,
      charge_percentage: gw.charge_percentage,
      charge_fixed: gw.charge_fixed,
      min_amount: gw.min_amount ?? '',
      max_amount: gw.max_amount ?? '',
      icon: gw.icon || 'credit-card',
      instructions: gw.instructions || '',
      instructions_bn: gw.instructions_bn || '',
      sort_order: gw.sort_order,
      credentials: { ...creds },
    });

    // Extract any extra custom credentials not in standard presets
    const preset = GATEWAY_PRESETS.find(p => p.code === gw.code);
    const standardKeys = preset ? preset.fields.map(f => f.key) : [];
    const extra: Array<{ key: string; value: string; isSecret: boolean }> = [];

    Object.entries(creds).forEach(([k, v]) => {
      if (!standardKeys.includes(k)) {
        extra.push({
          key: k,
          value: typeof v === 'string' ? v : JSON.stringify(v),
          isSecret: isKeySecret(k),
        });
      }
    });

    setCustomCredKeys(extra);
    setShowSecretMap({});
    setIsEditModalOpen(true);
  };

  // Helper to test if a key is typically sensitive
  const isKeySecret = (keyName: string) => {
    const lk = keyName.toLowerCase();
    return lk.includes('secret') || lk.includes('key') || lk.includes('password') || lk.includes('passwd') || lk.includes('private') || lk.includes('token') || lk.includes('signature');
  };

  // Save Add Form
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.title) {
      toast.error('Name, unique code, and display title are required.');
      return;
    }

    // Merge standard credentials with custom extra keys
    const mergedCreds = { ...(formData.credentials || {}) };
    customCredKeys.forEach(item => {
      if (item.key.trim()) {
        mergedCreds[item.key.trim()] = item.value;
      }
    });

    const payload = {
      ...formData,
      code: formData.code.toLowerCase().trim(),
      credentials: mergedCreds,
      min_amount: formData.min_amount === '' ? null : Number(formData.min_amount),
      max_amount: formData.max_amount === '' ? null : Number(formData.max_amount),
      charge_percentage: Number(formData.charge_percentage || 0),
      charge_fixed: Number(formData.charge_fixed || 0),
      sort_order: Number(formData.sort_order || 0),
    };

    createMutation.mutate(payload);
  };

  // Save Edit Form
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGateway) return;

    const mergedCreds = { ...(formData.credentials || {}) };
    customCredKeys.forEach(item => {
      if (item.key.trim()) {
        mergedCreds[item.key.trim()] = item.value;
      }
    });

    const payload = {
      ...formData,
      code: formData.code.toLowerCase().trim(),
      credentials: mergedCreds,
      min_amount: formData.min_amount === '' ? null : Number(formData.min_amount),
      max_amount: formData.max_amount === '' ? null : Number(formData.max_amount),
      charge_percentage: Number(formData.charge_percentage || 0),
      charge_fixed: Number(formData.charge_fixed || 0),
      sort_order: Number(formData.sort_order || 0),
    };

    updateMutation.mutate({ id: selectedGateway.id, payload });
  };

  // Filtered gateways
  const filteredGateways = gateways.filter(gw => {
    const matchesQuery = 
      gw.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gw.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (gw.title_bn && gw.title_bn.includes(searchQuery));

    const matchesType = selectedType === 'all' || gw.type === selectedType;
    return matchesQuery && matchesType;
  });

  // Helper to render Gateway brand icons / visual badge
  const renderGatewayBrandBadge = (code: string, type: string) => {
    switch (code) {
      case 'bkash':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#E2136E] text-white flex items-center justify-center font-black text-sm shadow-md shadow-pink-500/20">
            bK
          </div>
        );
      case 'nagad':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#F7941D] text-white flex items-center justify-center font-black text-sm shadow-md shadow-orange-500/20">
            নগদ
          </div>
        );
      case 'sslcommerz':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#0055A5] text-white flex items-center justify-center font-black text-xs tracking-tighter shadow-md shadow-blue-500/20">
            SSL
          </div>
        );
      case 'aamarpay':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#6C63FF] text-white flex items-center justify-center font-black text-xs shadow-md shadow-indigo-500/20">
            aP
          </div>
        );
      case 'cod':
        return (
          <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
            <Banknote className="w-6 h-6" />
          </div>
        );
      case 'rocket':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#8C3494] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-500/20">
            DBBL
          </div>
        );
      case 'bank_transfer':
        return (
          <div className="w-11 h-11 rounded-2xl bg-slate-700 dark:bg-slate-800 text-white flex items-center justify-center shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <CreditCard className="w-6 h-6" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111622] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/10/60 border border-primary/30/80 dark:border-primary/80/80 flex items-center justify-center text-primary dark:text-primary">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Payment Gateways &amp; Secret Keys
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Admin CRUD control for bKash, Nagad, SSLCommerz, AamarPay, COD, and custom payment processors
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => handleOpenAddModal('bkash')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs shadow-md shadow-primary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment Option</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111622] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Options</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.total}
          </div>
          <span className="text-[11px] text-slate-500">Configured in database</span>
        </div>

        <div className="bg-white dark:bg-[#111622] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary dark:text-primary uppercase tracking-wider">Active Gateways</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/10/60 flex items-center justify-center text-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-primary dark:text-primary mt-2">
            {stats.active}
          </div>
          <span className="text-[11px] text-slate-500">Visible at storefront checkout</span>
        </div>

        <div className="bg-white dark:bg-[#111622] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Sandbox Mode</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats.sandbox}
          </div>
          <span className="text-[11px] text-slate-500">Safe sandbox test environment</span>
        </div>

        <div className="bg-white dark:bg-[#111622] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Live Production</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {stats.live}
          </div>
          <span className="text-[11px] text-slate-500">Processing real customer funds</span>
        </div>
      </div>

      {/* Preset Quick-Add Toolbar */}
      <div className="bg-slate-50 dark:bg-[#161d2a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Quick Setup Presets:
            </span>
            <span className="text-xs text-slate-500 hidden md:inline">
              Pre-populate official gateway credentials &amp; endpoints
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {GATEWAY_PRESETS.slice(0, 6).map(preset => {
              const alreadyExists = gateways.some(g => g.code === preset.code);
              return (
                <button
                  key={preset.code}
                  onClick={() => handleOpenAddModal(preset.code)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    alreadyExists
                      ? 'bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary'
                      : 'bg-primary/20 dark:bg-primary/10 text-primary dark:text-primary/40 border border-primary/40 dark:border-primary/80 hover:bg-primary/30'
                  }`}
                >
                  <span>{preset.name.split(' ')[0]}</span>
                  {alreadyExists ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-[#111622] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by gateway name, code, or title..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary dark:focus:border-primary text-slate-900 dark:text-white"
          />
          <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'mfs', label: 'MFS (bKash/Nagad)' },
            { id: 'gateway', label: 'Card Gateways' },
            { id: 'cod', label: 'COD' },
            { id: 'bank', label: 'Bank Wire' },
            { id: 'custom', label: 'Custom' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gateway Cards Grid */}
      {isLoading ? (
        <div className="p-16 text-center bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading payment gateways from database...</p>
        </div>
      ) : filteredGateways.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No payment gateways found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No gateways matched your query. Click below to add a new gateway or reset filters.
          </p>
          <button
            onClick={() => handleOpenAddModal('bkash')}
            className="mt-4 px-4 py-2 rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment Gateway</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGateways.map((gw) => {
            const hasCredentials = gw.credentials && Object.keys(gw.credentials).length > 0;
            const credCount = gw.credentials ? Object.keys(gw.credentials).length : 0;

            return (
              <div
                key={gw.id}
                className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  {/* Top Bar: Icon, Name, Type, Status Switch */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {renderGatewayBrandBadge(gw.code, gw.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {gw.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {gw.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {gw.title} {gw.title_bn ? `• ${gw.title_bn}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Active Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActiveMutation.mutate(gw.id)}
                        disabled={toggleActiveMutation.isPending}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          gw.is_active ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={gw.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            gw.is_active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {gw.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2">
                      {gw.description}
                    </p>
                  )}

                  {/* Badges: Environment & Surcharge & Limits */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {/* Environment Pill with quick toggle */}
                    <button
                      onClick={() => toggleSandboxMutation.mutate(gw.id)}
                      disabled={toggleSandboxMutation.isPending}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        gw.is_sandbox
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-primary/10 dark:bg-primary/10/60 text-primary dark:text-primary/40 border border-primary/30 dark:border-primary/80'
                      }`}
                      title="Click to toggle between Sandbox and Live"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${gw.is_sandbox ? 'bg-amber-500' : 'bg-primary animate-pulse'}`} />
                      <span>{gw.is_sandbox ? 'Sandbox (Test)' : 'Live (Production)'}</span>
                    </button>

                    {/* Surcharge Badge */}
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Charge: {gw.charge_percentage > 0 ? `${gw.charge_percentage}%` : '0%'}
                      {gw.charge_fixed > 0 ? ` + ৳${gw.charge_fixed}` : ''}
                    </span>

                    {/* Order Limits */}
                    {(gw.min_amount || gw.max_amount) && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Limits: {gw.min_amount ? `৳${gw.min_amount}` : '৳0'} - {gw.max_amount ? `৳${gw.max_amount}` : 'No max'}
                      </span>
                    )}
                  </div>

                  {/* Secret Keys Preview Container */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-[#161d2a] border border-slate-200/80 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                        <KeyRound className="w-3.5 h-3.5 text-primary" />
                        <span>Credentials &amp; API Keys ({credCount})</span>
                      </div>

                      {hasCredentials ? (
                        <span className="text-[10px] text-primary dark:text-primary font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Configured</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Needs Keys</span>
                        </span>
                      )}
                    </div>

                    {/* Masked Credentials Summary */}
                    <div className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {gw.masked_credentials && Object.keys(gw.masked_credentials).length > 0 ? (
                        Object.entries(gw.masked_credentials).slice(0, 3).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                            <span className="text-slate-500 font-sans capitalize">{k.replace(/_/g, ' ')}:</span>
                            <span className="truncate max-w-[180px] font-bold">{String(v || 'Not set')}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 font-sans italic">No API keys saved yet</span>
                      )}
                      {credCount > 3 && (
                        <span className="text-[10px] text-slate-400 font-sans">+ {credCount - 3} more parameters configured</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenEditModal(gw)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 dark:hover:bg-primary/10/60 hover:text-primary dark:hover:text-primary text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer border border-transparent hover:border-primary/30 dark:hover:border-primary/80"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit &amp; Secret Keys</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedGateway(gw);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete payment gateway"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PAYMENT GATEWAY                                                */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 neu-backdrop overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            {/* Modal Header */}
            <div className="p-6 neu-modal-header flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">
                  Add Payment Option / Gateway
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure API credentials, secret keys, surcharges and instructions
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitAdd} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Preset Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Gateway Preset Template:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GATEWAY_PRESETS.map((preset) => (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => handleSelectPresetInModal(preset.code)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedPresetCode === preset.code
                          ? 'border-primary bg-primary/10 dark:bg-primary/10/60 text-primary dark:text-primary/40 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{preset.name.split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{preset.type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gateway Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. bKash Tokenized Checkout"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unique Code * (Lowercase identifier)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. bkash, nagad, rocket"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Checkout Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. bKash Online Payment"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Checkout Title (Bangla)
                  </label>
                  <input
                    type="text"
                    value={formData.title_bn || ''}
                    onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                    placeholder="e.g. বিকাশ পেমেন্ট"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gateway Category / Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white font-medium"
                  >
                    <option value="mfs">Mobile Financial Services (MFS)</option>
                    <option value="gateway">Card / Online Payment Gateway</option>
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="bank">Direct Bank Transfer</option>
                    <option value="custom">Custom / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Status & Environment Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#161d2a] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Active Status</span>
                    <p className="text-[11px] text-slate-500">Enable on storefront checkout</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Sandbox / Test Mode</span>
                    <p className="text-[11px] text-slate-500">Uncheck for Live Production</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_sandbox}
                    onChange={(e) => setFormData({ ...formData, is_sandbox: e.target.checked })}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Credentials & Secret Keys Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Credentials &amp; Secret Keys
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Encrypted and securely stored
                  </span>
                </div>

                {/* Preset-specific inputs */}
                {(() => {
                  const preset = GATEWAY_PRESETS.find(p => p.code === selectedPresetCode);
                  if (preset && preset.fields.length > 0) {
                    return (
                      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#161d2a] border border-slate-200 dark:border-slate-800">
                        {preset.fields.map(field => {
                          const isShown = showSecretMap[field.key];
                          const val = formData.credentials?.[field.key] ?? '';

                          if (field.isTextarea) {
                            return (
                              <div key={field.key}>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {field.label}
                                  </label>
                                  {field.isSecret && (
                                    <button
                                      type="button"
                                      onClick={() => toggleSecretVisibility(field.key)}
                                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                                    >
                                      {isShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                      <span>{isShown ? 'Hide Key' : 'Reveal Key'}</span>
                                    </button>
                                  )}
                                </div>
                                <textarea
                                  rows={3}
                                  value={val}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    credentials: { ...formData.credentials, [field.key]: e.target.value }
                                  })}
                                  placeholder={field.placeholder}
                                  className={`w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary font-mono text-slate-900 dark:text-white ${
                                    field.isSecret && !isShown ? 'blur-xs select-none' : ''
                                  }`}
                                />
                              </div>
                            );
                          }

                          return (
                            <div key={field.key}>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {field.label}
                              </label>
                              <div className="relative">
                                <input
                                  type={field.isSecret && !isShown ? 'password' : 'text'}
                                  value={val}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    credentials: { ...formData.credentials, [field.key]: e.target.value }
                                  })}
                                  placeholder={field.placeholder}
                                  className="w-full px-3 py-2 pr-10 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary font-mono text-slate-900 dark:text-white"
                                />
                                {field.isSecret && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSecretVisibility(field.key)}
                                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    {isShown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Additional Custom Key-Value Pairs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Additional Parameters &amp; Webhook Secrets:
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomCredKeys([...customCredKeys, { key: '', value: '', isSecret: false }])}
                      className="text-xs text-primary dark:text-primary font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Key</span>
                    </button>
                  </div>

                  {customCredKeys.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Key name (e.g. webhook_secret)"
                        value={item.key}
                        onChange={(e) => {
                          const copy = [...customCredKeys];
                          copy[idx].key = e.target.value;
                          setCustomCredKeys(copy);
                        }}
                        className="w-1/3 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary font-mono text-slate-900 dark:text-white"
                      />
                      <input
                        type={item.isSecret && !showSecretMap[`custom_${idx}`] ? 'password' : 'text'}
                        placeholder="Value"
                        value={item.value}
                        onChange={(e) => {
                          const copy = [...customCredKeys];
                          copy[idx].value = e.target.value;
                          setCustomCredKeys(copy);
                        }}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary font-mono text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility(`custom_${idx}`)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title="Toggle visibility"
                      >
                        {showSecretMap[`custom_${idx}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomCredKeys(customCredKeys.filter((_, i) => i !== idx))}
                        className="p-2 text-rose-500 hover:text-rose-700 cursor-pointer"
                        title="Remove key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Surcharge & Limits Section */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Charge (% Surcharge)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.charge_percentage}
                    onChange={(e) => setFormData({ ...formData, charge_percentage: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fixed Surcharge (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.charge_fixed}
                    onChange={(e) => setFormData({ ...formData, charge_fixed: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Min Order (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Order (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_amount}
                    onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                    placeholder="e.g. 250000"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Instructions (English)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.instructions || ''}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Customer instruction displayed at checkout"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Instructions (Bangla)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.instructions_bn || ''}
                    onChange={(e) => setFormData({ ...formData, instructions_bn: e.target.value })}
                    placeholder="গ্রাহকের জন্য পেমেন্ট নির্দেশিকা"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="neu-btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="neu-btn-primary px-5 py-2 text-xs font-black shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  {createMutation.isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Create &amp; Save Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PAYMENT GATEWAY & SECRET KEYS                                 */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedGateway && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 neu-backdrop overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            {/* Modal Header */}
            <div className="p-6 neu-modal-header flex items-center justify-between">
              <div className="flex items-center gap-3">
                {renderGatewayBrandBadge(selectedGateway.code, selectedGateway.type)}
                <div>
                  <h2 className="text-xl font-black text-foreground">
                    Edit {selectedGateway.name}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    Code: {selectedGateway.code} • Type: {selectedGateway.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-5 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitEdit} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Notice callout */}
              <div className="p-3 rounded-2xl bg-primary/10 dark:bg-primary/10/40 border border-primary/30 dark:border-primary/80/60 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-primary/80 dark:text-primary/30 leading-relaxed text-[11px]">
                  <strong>Security Note:</strong> Masked characters (<code className="font-mono bg-primary/20 dark:bg-primary/20/60 px-1 rounded">••••••••</code>) indicate your secrets are securely stored. Only enter a new value if you wish to change or rotate keys.
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gateway Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gateway Code (System key)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Title (Bangla)
                  </label>
                  <input
                    type="text"
                    value={formData.title_bn || ''}
                    onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* Status & Mode Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#161d2a] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Active Status</span>
                    <p className="text-[11px] text-slate-500">Live for customers on checkout</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Sandbox / Test Mode</span>
                    <p className="text-[11px] text-slate-500">Enable for test transactions</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_sandbox}
                    onChange={(e) => setFormData({ ...formData, is_sandbox: e.target.checked })}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Dynamic Credentials & Secret Key Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      API Credentials &amp; Secret Keys
                    </h3>
                  </div>
                </div>

                {/* Preset-defined credential fields */}
                {(() => {
                  const preset = GATEWAY_PRESETS.find(p => p.code === selectedGateway.code);
                  const fields = preset?.fields || [];
                  const creds = formData.credentials || {};

                  return (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#161d2a] border border-slate-200 dark:border-slate-800">
                      {fields.map((field) => {
                        const isSecret = field.isSecret || isKeySecret(field.key);
                        const isShown = showSecretMap[field.key];
                        const val = creds[field.key] ?? '';

                        if (field.isTextarea) {
                          return (
                            <div key={field.key}>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {field.label}
                                </label>
                                {isSecret && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSecretVisibility(field.key)}
                                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    {isShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    <span>{isShown ? 'Hide Key' : 'Reveal Key'}</span>
                                  </button>
                                )}
                              </div>
                              <textarea
                                rows={3}
                                value={val}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  credentials: { ...formData.credentials, [field.key]: e.target.value }
                                })}
                                placeholder={field.placeholder}
                                className={`w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary font-mono text-slate-900 dark:text-white ${
                                  isSecret && !isShown ? 'blur-xs select-none' : ''
                                }`}
                              />
                            </div>
                          );
                        }

                        return (
                          <div key={field.key}>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              {field.label}
                            </label>
                            <div className="relative">
                              <input
                                type={isSecret && !isShown ? 'password' : 'text'}
                                value={val}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  credentials: { ...formData.credentials, [field.key]: e.target.value }
                                })}
                                placeholder={field.placeholder}
                                className="w-full px-3 py-2 pr-10 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary font-mono text-slate-900 dark:text-white"
                              />
                              {isSecret && (
                                <button
                                  type="button"
                                  onClick={() => toggleSecretVisibility(field.key)}
                                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                >
                                  {isShown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Any existing extra credentials not in preset */}
                      {Object.keys(creds).filter(k => !fields.some(f => f.key === k)).map(extraKey => {
                        const isSecret = isKeySecret(extraKey);
                        const isShown = showSecretMap[extraKey];
                        const val = creds[extraKey] ?? '';

                        return (
                          <div key={extraKey}>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 capitalize">
                              {extraKey.replace(/_/g, ' ')}
                            </label>
                            <div className="relative">
                              <input
                                type={isSecret && !isShown ? 'password' : 'text'}
                                value={typeof val === 'string' ? val : JSON.stringify(val)}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  credentials: { ...formData.credentials, [extraKey]: e.target.value }
                                })}
                                className="w-full px-3 py-2 pr-10 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-primary font-mono text-slate-900 dark:text-white"
                              />
                              {isSecret && (
                                <button
                                  type="button"
                                  onClick={() => toggleSecretVisibility(extraKey)}
                                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                >
                                  {isShown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Extra dynamic fields */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Add Custom Credential Field:
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomCredKeys([...customCredKeys, { key: '', value: '', isSecret: false }])}
                      className="text-xs text-primary dark:text-primary font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Parameter</span>
                    </button>
                  </div>

                  {customCredKeys.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Key name"
                        value={item.key}
                        onChange={(e) => {
                          const copy = [...customCredKeys];
                          copy[idx].key = e.target.value;
                          setCustomCredKeys(copy);
                        }}
                        className="w-1/3 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-white"
                      />
                      <input
                        type={item.isSecret && !showSecretMap[`edit_custom_${idx}`] ? 'password' : 'text'}
                        placeholder="Value"
                        value={item.value}
                        onChange={(e) => {
                          const copy = [...customCredKeys];
                          copy[idx].value = e.target.value;
                          setCustomCredKeys(copy);
                        }}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility(`edit_custom_${idx}`)}
                        className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showSecretMap[`edit_custom_${idx}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomCredKeys(customCredKeys.filter((_, i) => i !== idx))}
                        className="p-2 text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Surcharges and Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Charge (% Surcharge)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.charge_percentage}
                    onChange={(e) => setFormData({ ...formData, charge_percentage: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fixed Surcharge (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.charge_fixed}
                    onChange={(e) => setFormData({ ...formData, charge_fixed: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Min Order (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Order (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_amount}
                    onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Customer Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Instructions (English)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.instructions || ''}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Instructions (Bangla)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.instructions_bn || ''}
                    onChange={(e) => setFormData({ ...formData, instructions_bn: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="neu-btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="neu-btn-primary px-5 py-2 text-xs font-black shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  {updateMutation.isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE PAYMENT GATEWAY CONFIRMATION                                */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && selectedGateway && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDeleteModalOpen(false);
              setSelectedGateway(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 neu-backdrop cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="w-12 h-12 rounded-2xl neu-card-inset flex items-center justify-center text-rose-500 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-foreground">
                Delete Payment Gateway?
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-foreground">
                  {selectedGateway.name} ({selectedGateway.code})
                </span>?
                Customers will no longer be able to select this payment method at checkout.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2 neu-modal-footer">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedGateway(null);
                }}
                className="neu-btn-secondary flex-1 py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(selectedGateway.id)}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:translate-y-0.5 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {deleteMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
