'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatBDT } from '@/utils/currency';
import { 
  MarketingCampaign, MarketingLead, MarketingLeadMessage, MarketingOverview, MarketingChannel, LeadStatus 
} from '@/types';
import Link from 'next/link';
import { 
  Megaphone, MessageSquare, Plus, RefreshCw, Search, Filter, 
  TrendingUp, DollarSign, Eye, MousePointer, ShoppingBag, 
  CheckCircle2, Clock, Send, Phone, MapPin, User, Package, 
  Trash2, Edit3, X, ExternalLink, ArrowRight, ShieldAlert, 
  Sparkles, Check, ChevronRight, AlertCircle, Share2, Settings,
  Copy, Download, BarChart2, CheckCircle, Smartphone, Globe,
  ShieldCheck, UserCheck, Layers, Minus, CornerDownRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MarketingPage() {
  const queryClient = useQueryClient();

  // Navigation tab: 'campaigns' | 'leads' | 'integrations'
  const [activeTab, setActiveTab] = useState<'campaigns' | 'leads' | 'integrations'>('campaigns');

  // Filter & search states
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('');
  const [leadSearch, setLeadSearch] = useState<string>('');
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  // Modals state (All with dual close: close button + backdrop click)
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);

  // Campaign Form State
  const [campaignFormData, setCampaignFormData] = useState({
    channel: 'facebook' as MarketingChannel,
    campaign_name: '',
    campaign_id_external: '',
    ad_set_name: '',
    status: 'active',
    objective: 'messages',
    daily_budget: 1500,
    total_spend: 0,
    impressions: 0,
    clicks: 0,
    conversions_count: 0,
    revenue_generated: 0,
    notes: '',
  });

  // Manual New Lead Form State
  const [manualLeadForm, setManualLeadForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    channel: 'meta_messenger',
    delivery_address: '',
    district: 'Dhaka',
    thana: '',
    inquired_products: '',
    customer_message: '',
  });

  // Moderator Order Converter Multi-Item State
  const [replyText, setReplyText] = useState('');
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address: '',
    district: 'Dhaka',
    thana: '',
    shipping_zone: 'inside_dhaka',
    payment_method: 'cod',
    delivery_fee: 70,
    discount_amount: 0,
    advance_amount: 0,
    items: [
      { product_id: 1, variant_id: undefined as number | undefined, color: '', size: '', product_name: '', unit_price: 1000, quantity: 1 }
    ],
    notes: '',
  });

  // Webhook Simulator State
  const [simForm, setSimForm] = useState({
    channel: 'meta_whatsapp',
    customer_name: 'Tanvir Chowdhury',
    customer_phone: '01755443322',
    inquired_product: 'Samsung Galaxy A55 5G',
    message_text: 'Assalamu Alaikum, I want to order this phone to Gulshan 2. Is Cash on Delivery available?',
  });

  // 1. Fetch Overview & KPIs
  const { data: overviewData, isLoading: isOverviewLoading, refetch: refetchOverview } = useQuery<MarketingOverview>({
    queryKey: ['marketing-overview'],
    queryFn: async () => {
      const res: any = await api.get('/admin/marketing/overview');
      return res?.data?.data || res?.data;
    },
  });

  // 2. Fetch Campaigns
  const { data: campaignsData, isLoading: isCampaignsLoading, refetch: refetchCampaigns } = useQuery({
    queryKey: ['marketing-campaigns', selectedChannel],
    queryFn: async () => {
      const url = selectedChannel === 'all' 
        ? '/admin/marketing/campaigns' 
        : `/admin/marketing/campaigns?channel=${selectedChannel}`;
      const res: any = await api.get(url);
      const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      return items as MarketingCampaign[];
    },
  });

  // 3. Fetch Catalog Products for Order Builder
  const { data: catalogProducts = [] } = useQuery({
    queryKey: ['catalog-products-marketing'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/products?per_page=150');
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    },
  });

  // 4. Fetch Leads
  const { data: leadsData, isLoading: isLeadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['marketing-leads', leadStatusFilter, leadSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (leadStatusFilter) params.append('status', leadStatusFilter);
      if (leadSearch.trim()) params.append('search', leadSearch.trim());
      const res: any = await api.get(`/admin/marketing/leads?${params.toString()}`);
      const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      return items as MarketingLead[];
    },
  });

  // 5. Fetch Settings
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['marketing-settings'],
    queryFn: async () => {
      const res: any = await api.get('/admin/marketing/settings');
      return res?.data?.data || res?.data;
    },
  });

  const [settingsForm, setSettingsForm] = useState<any>(null);

  // Sync settings once loaded
  useMemo(() => {
    if (settingsData && !settingsForm) {
      setSettingsForm(settingsData);
    }
  }, [settingsData]);

  // Selected Lead Detail
  const selectedLead = leadsData?.find((l) => l.id === selectedLeadId) || leadsData?.[0] || null;

  // Sync selected lead into order form
  const handleSelectLead = (lead: MarketingLead) => {
    setSelectedLeadId(lead.id);
    const isDhaka = !lead.district || lead.district.toLowerCase() === 'dhaka';
    
    // Find matching catalog product if inquiring by name
    let matchedProduct = catalogProducts.find((p: any) => 
      lead.inquired_products && p.name_en.toLowerCase().includes(lead.inquired_products.toLowerCase())
    ) || catalogProducts[0];

    const firstVar = matchedProduct?.variants?.[0];

    setOrderForm({
      customer_name: lead.customer_name || '',
      customer_phone: lead.customer_phone || '',
      customer_email: lead.customer_email || '',
      shipping_address: lead.delivery_address || '',
      district: lead.district || (isDhaka ? 'Dhaka' : 'Outside Dhaka'),
      thana: lead.thana || '',
      shipping_zone: isDhaka ? 'inside_dhaka' : 'outside_dhaka',
      payment_method: 'cod',
      delivery_fee: isDhaka ? 70 : 130,
      discount_amount: 0,
      advance_amount: 0,
      items: [
        {
          product_id: matchedProduct?.id || 1,
          variant_id: firstVar?.id,
          color: firstVar?.color || '',
          size: firstVar?.size || '',
          product_name: matchedProduct?.name_en || lead.inquired_products || 'Selected Product',
          unit_price: Number(firstVar?.price || matchedProduct?.base_price || 1200),
          quantity: 1,
        }
      ],
      notes: `Order from ${lead.channel.replace('_', ' ').toUpperCase()} Lead #${lead.id}`,
    });

    setReplyText(`Hello ${lead.customer_name}! We have confirmed stock for your inquired item "${lead.inquired_products || 'products'}". Delivery charge is ৳${isDhaka ? '70 (Dhaka City)' : '130 (Outside Dhaka)'}. Should we proceed with Cash on Delivery?`);
  };

  // Quick Reply Snippets
  const applyQuickReply = (type: string) => {
    if (!selectedLead) return;
    const name = selectedLead.customer_name;
    const isDhaka = !selectedLead.district || selectedLead.district.toLowerCase() === 'dhaka';
    const fee = isDhaka ? 70 : 130;

    switch (type) {
      case 'greeting':
        setReplyText(`Hello ${name}! Thank you for reaching out to us. Yes, your inquired product "${selectedLead.inquired_products || 'item'}" is 100% available in our warehouse right now.`);
        break;
      case 'quote':
        setReplyText(`Price Details for ${name}:\n• Product Price: ৳${orderForm.items[0]?.unit_price || 1200}\n• Delivery Charge: ৳${fee} (${isDhaka ? 'Inside Dhaka' : 'Outside Dhaka'})\n• Total Payable: ৳${(Number(orderForm.items[0]?.unit_price || 1200)) + fee} (Cash on Delivery)`);
        break;
      case 'address':
        setReplyText(`To deliver to your doorstep, please provide your exact Address, Thana/District, and an alternate Contact Number.`);
        break;
      case 'cod':
        setReplyText(`Great! We deliver via Cash on Delivery with parcel inspection upon arrival. You can pay after receiving your parcel.`);
        break;
      default:
        break;
    }
  };

  // Mutation: Store / Update Campaign
  const saveCampaignMutation = useMutation({
    mutationFn: async (data: typeof campaignFormData) => {
      if (editingCampaign) {
        return await api.put(`/admin/marketing/campaigns/${editingCampaign.id}`, data);
      } else {
        return await api.post('/admin/marketing/campaigns', data);
      }
    },
    onSuccess: () => {
      toast.success(editingCampaign ? 'Campaign updated' : 'Campaign created');
      setIsCampaignModalOpen(false);
      setEditingCampaign(null);
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save campaign');
    },
  });

  // Mutation: Toggle Campaign Status
  const toggleCampaignStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.patch(`/admin/marketing/campaigns/${id}/status`, {});
    },
    onSuccess: (res: any) => {
      toast.success(res?.data?.message || 'Campaign status updated');
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-overview'] });
    },
    onError: () => toast.error('Failed to toggle campaign status'),
  });

  // Mutation: Delete Campaign
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/admin/marketing/campaigns/${id}`);
    },
    onSuccess: () => {
      toast.success('Campaign deleted');
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-overview'] });
    },
    onError: () => toast.error('Failed to delete campaign'),
  });

  // Mutation: Create Manual Lead
  const createLeadMutation = useMutation({
    mutationFn: async (payload: typeof manualLeadForm) => {
      return await api.post('/admin/marketing/leads', payload);
    },
    onSuccess: () => {
      toast.success('New customer lead created');
      setIsNewLeadModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create lead');
    },
  });

  // Mutation: Delete Lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/admin/marketing/leads/${id}`);
    },
    onSuccess: () => {
      toast.success('Lead removed');
      setSelectedLeadId(null);
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-overview'] });
    },
    onError: () => toast.error('Failed to remove lead'),
  });

  // Mutation: Moderator Reply
  const replyLeadMutation = useMutation({
    mutationFn: async ({ leadId, text }: { leadId: number; text: string }) => {
      return await api.post(`/admin/marketing/leads/${leadId}/reply`, {
        message_text: text,
        status: 'replied_quote',
      });
    },
    onSuccess: () => {
      toast.success('Reply message sent to customer thread');
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    },
  });

  // Mutation: Convert Lead to Official Order (Multi-item supported!)
  const convertOrderMutation = useMutation({
    mutationFn: async ({ leadId, payload }: { leadId: number; payload: any }) => {
      return await api.post(`/admin/marketing/leads/${leadId}/convert-order`, payload);
    },
    onSuccess: (res: any) => {
      const orderNumber = res?.data?.data?.order?.order_number || res?.data?.order?.order_number || 'Order';
      toast.success(`Success! Order #${orderNumber} created & inventory updated.`);
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create order');
    },
  });

  // Mutation: Save Integrations Settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/admin/marketing/settings', payload);
    },
    onSuccess: () => {
      toast.success('Marketing integrations saved successfully');
      refetchSettings();
    },
    onError: () => toast.error('Failed to save settings'),
  });

  // Mutation: Test Webhook Simulation
  const simulateWebhookMutation = useMutation({
    mutationFn: async (payload: typeof simForm) => {
      return await api.post('/admin/marketing/test-webhook', payload);
    },
    onSuccess: () => {
      toast.success('Simulated Meta message received! Check the Lead Inbox.');
      setActiveTab('leads');
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Simulation failed');
    },
  });

  // Multi-item handlers for Order Builder
  const handleAddOrderItem = () => {
    const prod = catalogProducts[0];
    const v = prod?.variants?.[0];
    setOrderForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: prod?.id || 1,
          variant_id: v?.id,
          color: v?.color || '',
          size: v?.size || '',
          product_name: prod?.name_en || 'Product Item',
          unit_price: Number(v?.price || prod?.base_price || 1000),
          quantity: 1,
        }
      ]
    }));
  };

  const handleRemoveOrderItem = (index: number) => {
    if (orderForm.items.length <= 1) return;
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemProductSelect = (index: number, pId: number) => {
    const prod = catalogProducts.find((p: any) => p.id === pId);
    if (!prod) return;
    const v = prod.variants?.[0];
    const updated = [...orderForm.items];
    updated[index] = {
      ...updated[index],
      product_id: prod.id,
      variant_id: v?.id,
      color: v?.color || '',
      size: v?.size || '',
      product_name: prod.name_en,
      unit_price: Number(v?.price || prod.base_price || 0),
    };
    setOrderForm({ ...orderForm, items: updated });
  };

  const handleItemVariantSelect = (index: number, vId: number) => {
    const currentItem = orderForm.items[index];
    const prod = catalogProducts.find((p: any) => p.id === currentItem.product_id);
    const v = prod?.variants?.find((item: any) => item.id === vId);
    if (!v) return;
    const updated = [...orderForm.items];
    updated[index] = {
      ...updated[index],
      variant_id: v.id,
      color: v.color || '',
      size: v.size || '',
      unit_price: Number(v.price || updated[index].unit_price),
    };
    setOrderForm({ ...orderForm, items: updated });
  };

  // Calculations
  const itemsSubtotal = orderForm.items.reduce(
    (acc, it) => acc + (Number(it.unit_price) || 0) * (Number(it.quantity) || 1), 0
  );
  const totalPayable = Math.max(0, itemsSubtotal + Number(orderForm.delivery_fee || 0) - Number(orderForm.discount_amount || 0));

  const handleConfirmOrder = () => {
    if (!selectedLead) return;
    if (!orderForm.customer_name.trim() || !orderForm.customer_phone.trim() || !orderForm.shipping_address.trim()) {
      toast.error('Please ensure customer name, phone number, and delivery address are filled.');
      return;
    }
    convertOrderMutation.mutate({
      leadId: selectedLead.id,
      payload: orderForm,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const exportCampaignsToCSV = () => {
    if (!campaignsData || campaignsData.length === 0) {
      toast.error('No campaign data to export');
      return;
    }
    const headers = ['ID,Channel,Campaign Name,External ID,Status,Objective,Daily Budget,Total Spend,Impressions,Clicks,CPC,CTR,Conversions,Revenue,ROAS'];
    const rows = campaignsData.map(c => 
      `"${c.id}","${c.channel}","${c.campaign_name}","${c.campaign_id_external || ''}","${c.status}","${c.objective}","${c.daily_budget}","${c.total_spend}","${c.impressions}","${c.clicks}","${c.cpc}","${c.ctr}%","${c.conversions_count}","${c.revenue_generated}","${c.roas}x"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marketing_campaigns_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Campaign report downloaded successfully');
  };

  const kpis = overviewData?.kpis;
  const channelData = overviewData?.channels;
  const trends = overviewData?.trends || [];

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Main Mode Switcher */}
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 font-black">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <span>Marketing & Ad Intelligence</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200">
                Production Engine
              </span>
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Multi-channel ads telemetry (Meta, Google, TikTok), live messaging customer lead stream & instant order placement.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Main View Tabs */}
          <div className="flex items-center p-1 neu-inset rounded-2xl">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'campaigns' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ad Campaigns</span>
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'leads' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Meta Lead Inbox</span>
              {(kpis?.new_leads ?? 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-black">
                  {kpis?.new_leads}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'integrations' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Integrations & Webhooks</span>
            </button>
          </div>

          <button
            onClick={() => {
              refetchOverview();
              refetchCampaigns();
              refetchLeads();
              toast.success('Telemetry synchronized');
            }}
            className="p-2.5 neu-btn rounded-xl text-foreground hover:text-primary transition-colors cursor-pointer"
            title="Refresh All"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Ad Spend */}
        <div className="clay-card p-4 rounded-3xl space-y-1.5 border border-purple-500/10">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold">Total Ad Spend</span>
            <DollarSign className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-black text-foreground">
            {formatBDT(kpis?.total_spend ?? 0)}
          </div>
          <div className="text-[10px] text-muted-foreground font-semibold">
            Across 3 Channels
          </div>
        </div>

        {/* Impressions */}
        <div className="clay-card p-4 rounded-3xl space-y-1.5 border border-blue-500/10">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold">Impressions</span>
            <Eye className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-lg font-black text-foreground">
            {(kpis?.total_impressions ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground font-semibold">
            Avg CTR: <span className="text-blue-500 font-bold">{kpis?.avg_ctr ?? 0}%</span>
          </div>
        </div>

        {/* Clicks & Avg CPC */}
        <div className="clay-card p-4 rounded-3xl space-y-1.5 border border-primary/10">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold">Clicks / Avg CPC</span>
            <MousePointer className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg font-black text-foreground">
            {(kpis?.total_clicks ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground font-semibold">
            Avg CPC: <span className="text-primary font-bold">৳{kpis?.avg_cpc ?? 0}</span>
          </div>
        </div>

        {/* Meta Leads */}
        <div className="clay-card p-4 rounded-3xl space-y-1.5 border border-indigo-500/10">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold">Meta Inquiries</span>
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg font-black text-foreground">
            {(kpis?.total_leads ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground font-semibold">
            <span className="text-amber-500 font-bold">{kpis?.new_leads ?? 0}</span> new / awaiting
          </div>
        </div>

        {/* Converted Orders */}
        <div className="clay-card p-4 rounded-3xl space-y-1.5 border border-primary/10">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold">Orders Converted</span>
            <ShoppingBag className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg font-black text-foreground">
            {(kpis?.meta_orders_count ?? 0) + (kpis?.total_conversions ?? 0)}
          </div>
          <div className="text-[10px] text-muted-foreground font-semibold">
            Revenue: <span className="text-primary font-bold">{formatBDT(kpis?.total_revenue ?? 0)}</span>
          </div>
        </div>

        {/* Overall ROAS */}
        <div className="clay-card p-4 rounded-3xl space-y-1.5 border border-purple-500/10 bg-purple-500/5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold">Overall ROAS</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-black text-purple-600 dark:text-purple-400">
            {kpis?.overall_roas ?? 0}x
          </div>
          <div className="text-[10px] text-purple-600/80 font-bold">
            Return on Ad Spend
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AD CAMPAIGNS & MULTI-CHANNEL INTELLIGENCE */}
      {/* ========================================================================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Multi-Channel Platform Cards (Facebook, Google, TikTok) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Facebook / Meta Ads Card */}
            <div 
              onClick={() => setSelectedChannel(selectedChannel === 'facebook' ? 'all' : 'facebook')}
              className={`clay-card p-5 rounded-3xl cursor-pointer transition-all border-2 ${
                selectedChannel === 'facebook' 
                  ? 'border-blue-600 ring-2 ring-blue-500/30' 
                  : 'border-transparent hover:border-blue-400/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                    f
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-foreground">Meta / Facebook Ads</h3>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      Click-to-Messenger & WhatsApp
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {channelData?.facebook?.campaigns_count ?? 0} Campaigns
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center pt-3 border-t border-border/40">
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">Total Spend</div>
                  <div className="text-xs font-black text-foreground">
                    {formatBDT(channelData?.facebook?.total_spend ?? 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">Clicks / CPC</div>
                  <div className="text-xs font-black text-foreground">
                    {(channelData?.facebook?.clicks ?? 0).toLocaleString()} <span className="text-[9px] text-muted-foreground">(৳{channelData?.facebook?.cpc ?? 0})</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">ROAS</div>
                  <div className="text-xs font-black text-primary dark:text-primary">
                    {channelData?.facebook?.roas ?? 0}x
                  </div>
                </div>
              </div>
            </div>

            {/* Google Ads Card */}
            <div 
              onClick={() => setSelectedChannel(selectedChannel === 'google' ? 'all' : 'google')}
              className={`clay-card p-5 rounded-3xl cursor-pointer transition-all border-2 ${
                selectedChannel === 'google' 
                  ? 'border-amber-500 ring-2 ring-amber-500/30' 
                  : 'border-transparent hover:border-amber-400/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                    G
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-foreground">Google Ads Network</h3>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      Search, Shopping & PMax
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  {channelData?.google?.campaigns_count ?? 0} Campaigns
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center pt-3 border-t border-border/40">
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">Total Spend</div>
                  <div className="text-xs font-black text-foreground">
                    {formatBDT(channelData?.google?.total_spend ?? 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">Clicks / CPC</div>
                  <div className="text-xs font-black text-foreground">
                    {(channelData?.google?.clicks ?? 0).toLocaleString()} <span className="text-[9px] text-muted-foreground">(৳{channelData?.google?.cpc ?? 0})</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">ROAS</div>
                  <div className="text-xs font-black text-primary dark:text-primary">
                    {channelData?.google?.roas ?? 0}x
                  </div>
                </div>
              </div>
            </div>

            {/* TikTok Ads Card */}
            <div 
              onClick={() => setSelectedChannel(selectedChannel === 'tiktok' ? 'all' : 'tiktok')}
              className={`clay-card p-5 rounded-3xl cursor-pointer transition-all border-2 ${
                selectedChannel === 'tiktok' 
                  ? 'border-rose-500 ring-2 ring-rose-500/30' 
                  : 'border-transparent hover:border-rose-400/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-rose-500 flex items-center justify-center font-black text-lg shadow-md border border-rose-500/30">
                    ♪
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-foreground">TikTok Spark Ads</h3>
                    <span className="text-[10px] text-rose-500 font-bold">
                      Viral Videos & Gen Z Feed
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {channelData?.tiktok?.campaigns_count ?? 0} Campaigns
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center pt-3 border-t border-border/40">
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">Total Spend</div>
                  <div className="text-xs font-black text-foreground">
                    {formatBDT(channelData?.tiktok?.total_spend ?? 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">Clicks / CPC</div>
                  <div className="text-xs font-black text-foreground">
                    {(channelData?.tiktok?.clicks ?? 0).toLocaleString()} <span className="text-[9px] text-muted-foreground">(৳{channelData?.tiktok?.cpc ?? 0})</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">ROAS</div>
                  <div className="text-xs font-black text-primary dark:text-primary">
                    {channelData?.tiktok?.roas ?? 0}x
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 14-Day Visual Spend vs Revenue Bar Matrix */}
          {trends.length > 0 && (
            <div className="clay-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-black text-foreground">
                    14-Day Marketing Ad Spend vs Attributed Revenue Trend
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <span className="text-muted-foreground">Daily Ad Spend</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <span className="text-foreground">Revenue Generated</span>
                  </div>
                </div>
              </div>

              {/* Visual Bars */}
              <div className="grid grid-cols-14 gap-2 pt-4 items-end h-40">
                {trends.map((t, idx) => {
                  const maxVal = Math.max(50000, ...trends.map(x => Math.max(x.revenue, x.spend)));
                  const spendHeight = Math.max(8, Math.round((t.spend / maxVal) * 100));
                  const revHeight = Math.max(8, Math.round((t.revenue / maxVal) * 100));

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 z-20 hidden group-hover:block p-2 rounded-xl bg-black text-white text-[10px] font-mono whitespace-nowrap shadow-xl pointer-events-none">
                        <div>{t.date}</div>
                        <div className="text-purple-300">Spend: {formatBDT(t.spend)}</div>
                        <div className="text-primary/40">Rev: {formatBDT(t.revenue)}</div>
                        <div>Orders: {t.orders}</div>
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-28">
                        <div 
                          style={{ height: `${spendHeight}%` }}
                          className="w-2 sm:w-3 bg-purple-500/80 rounded-t-sm transition-all group-hover:bg-purple-600"
                        />
                        <div 
                          style={{ height: `${revHeight}%` }}
                          className="w-2 sm:w-3 bg-primary rounded-t-sm transition-all group-hover:bg-primary"
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground font-semibold transform -rotate-45 origin-top-left mt-2">
                        {t.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Campaigns Telemetry Table */}
          <div className="clay-card p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Ad Campaigns Telemetry & Live Status Controller</span>
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Manage budgets, view impressions, clicks, CPC, conversions, and toggle campaign execution.
                </p>
              </div>

              {/* Actions & Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 neu-inset rounded-2xl">
                  {['all', 'facebook', 'google', 'tiktok'].map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setSelectedChannel(ch)}
                      className={`px-3 py-1 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                        selectedChannel === ch 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {ch === 'all' ? 'All' : ch}
                    </button>
                  ))}
                </div>

                <button
                  onClick={exportCampaignsToCSV}
                  className="px-3 py-1.5 neu-btn rounded-xl text-xs font-bold text-foreground hover:text-primary flex items-center gap-1.5 cursor-pointer"
                  title="Export to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => {
                    setEditingCampaign(null);
                    setCampaignFormData({
                      channel: 'facebook',
                      campaign_name: '',
                      campaign_id_external: '',
                      ad_set_name: '',
                      status: 'active',
                      objective: 'messages',
                      daily_budget: 1500,
                      total_spend: 0,
                      impressions: 0,
                      clicks: 0,
                      conversions_count: 0,
                      revenue_generated: 0,
                      notes: '',
                    });
                    setIsCampaignModalOpen(true);
                  }}
                  className="neu-btn-primary px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Campaign</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground font-bold">
                    <th className="py-2.5 px-3">Platform</th>
                    <th className="py-2.5 px-3">Campaign & Ad Set</th>
                    <th className="py-2.5 px-3">Objective</th>
                    <th className="py-2.5 px-3 text-right">Daily / Total Spend</th>
                    <th className="py-2.5 px-3 text-right">Clicks / CPC</th>
                    <th className="py-2.5 px-3 text-right">Conversions</th>
                    <th className="py-2.5 px-3 text-right">Revenue / ROAS</th>
                    <th className="py-2.5 px-3 text-center">Live Toggle</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-medium">
                  {campaignsData && campaignsData.length > 0 ? (
                    campaignsData.map((camp) => (
                      <tr key={camp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${
                            camp.channel === 'facebook' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                            camp.channel === 'google' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {camp.channel}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-foreground">{camp.campaign_name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {camp.campaign_id_external || 'Direct'} • {camp.ad_set_name || 'All BD Target'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="capitalize text-muted-foreground font-semibold">
                            {camp.objective}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          <div className="font-black text-foreground">{formatBDT(camp.total_spend)}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Budget: ৳{camp.daily_budget}/day
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                          <div>{camp.clicks.toLocaleString()} clicks</div>
                          <div className="text-[10px] font-bold text-foreground">৳{camp.cpc} CPC ({camp.ctr}%)</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-foreground">
                          {camp.conversions_count} orders
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          <div className="font-bold text-foreground">{formatBDT(camp.revenue_generated)}</div>
                          <div className="text-[10px] font-black text-primary dark:text-primary">
                            {camp.roas}x ROAS
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => toggleCampaignStatusMutation.mutate(camp.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer ${
                              camp.status === 'active'
                                ? 'bg-primary text-white shadow-xs hover:bg-primary'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                            }`}
                            title="Click to Toggle Active / Paused"
                          >
                            {camp.status}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingCampaign(camp);
                                setCampaignFormData({
                                  channel: camp.channel,
                                  campaign_name: camp.campaign_name,
                                  campaign_id_external: camp.campaign_id_external || '',
                                  ad_set_name: camp.ad_set_name || '',
                                  status: camp.status,
                                  objective: camp.objective,
                                  daily_budget: camp.daily_budget,
                                  total_spend: camp.total_spend,
                                  impressions: camp.impressions,
                                  clicks: camp.clicks,
                                  conversions_count: camp.conversions_count,
                                  revenue_generated: camp.revenue_generated,
                                  notes: camp.notes || '',
                                });
                                setIsCampaignModalOpen(true);
                              }}
                              className="p-1.5 neu-btn rounded-lg text-primary hover:bg-primary/10"
                              title="Edit Campaign"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete campaign "${camp.campaign_name}"?`)) {
                                  deleteCampaignMutation.mutate(camp.id);
                                }
                              }}
                              className="p-1.5 neu-btn rounded-lg text-red-500 hover:bg-red-50"
                              title="Delete Campaign"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-muted-foreground font-semibold">
                        No campaigns found. Launch your first ad campaign to start tracking ROAS!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: META MESSAGE LEAD STREAM & INSTANT ORDER CONVERTER */}
      {/* ========================================================================= */}
      {activeTab === 'leads' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span>Meta Message Campaign Customer Lead Inbox & Order Placement</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Live customer message stream from Facebook Messenger and WhatsApp Ads. Quote prices, select items, and confirm orders directly into the database.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
                className="neu-input px-3 py-2 rounded-xl text-xs font-bold text-foreground focus:outline-none"
              >
                <option value="">All Lead Statuses</option>
                <option value="new_lead">New Inquiries</option>
                <option value="chatting">Active Discussions</option>
                <option value="replied_quote">Quotation Provided</option>
                <option value="order_placed">Converted to Order</option>
              </select>

              <button
                onClick={() => setIsNewLeadModalOpen(true)}
                className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Lead / Inquiry</span>
              </button>
            </div>
          </div>

          {/* Split View: Left List (Leads) & Right Panel (Thread + Order Builder) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Leads List (4 cols) */}
            <div className="lg:col-span-4 clay-card p-4 rounded-3xl space-y-3 h-[850px] flex flex-col">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by customer, phone, inquiry..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-border/20">
                {leadsData && leadsData.length > 0 ? (
                  leadsData.map((lead) => {
                    const isSelected = selectedLead?.id === lead.id;
                    const stats = lead.customer_stats;
                    return (
                      <div
                        key={lead.id}
                        onClick={() => handleSelectLead(lead)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-purple-600 text-white shadow-md' 
                            : 'hover:bg-muted/40 text-foreground'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="font-bold text-xs truncate max-w-[170px]">
                            {lead.customer_name}
                          </div>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-white/20 text-white' :
                            lead.status === 'order_placed' ? 'bg-primary/20 text-primary dark:bg-primary/10 dark:text-primary/40' :
                            lead.status === 'new_lead' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {lead.status === 'order_placed' ? '✓ Ordered' : lead.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'text-purple-100' : 'text-muted-foreground'}`}>
                          {lead.customer_phone} • {lead.district || 'Dhaka'}
                        </div>

                        {/* Customer Trust indicator */}
                        {stats && (
                          <div className="mt-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                              isSelected ? 'bg-white/20 text-white border-white/30' : stats.trust_color
                            }`}>
                              {stats.trust_badge} ({stats.total_orders} prior orders)
                            </span>
                          </div>
                        )}

                        <div className={`text-[11px] line-clamp-1 mt-1 font-medium italic ${
                          isSelected ? 'text-white/90' : 'text-foreground/80'
                        }`}>
                          "{lead.customer_message || lead.inquired_products || 'Inquiry'}"
                        </div>

                        <div className={`mt-2 flex items-center justify-between text-[10px] ${
                          isSelected ? 'text-purple-200' : 'text-muted-foreground'
                        }`}>
                          <span className="capitalize">{lead.channel.replace('_', ' ')}</span>
                          <span>{lead.last_message_at ? new Date(lead.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No customer leads found.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Selected Lead Chat & Moderator Converter (8 cols) */}
            <div className="lg:col-span-8 clay-card p-6 rounded-3xl space-y-5 h-[850px] flex flex-col overflow-y-auto">
              {selectedLead ? (
                <>
                  {/* Lead Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center font-black text-purple-600">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-base text-foreground">
                              {selectedLead.customer_name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              {selectedLead.channel.replace('_', ' ')}
                            </span>
                            {selectedLead.customer_stats && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedLead.customer_stats.trust_color}`}>
                                {selectedLead.customer_stats.trust_badge}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 font-mono mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            <span>{selectedLead.customer_phone}</span>
                            <span>•</span>
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span>{selectedLead.delivery_address || 'Address pending'} ({selectedLead.district || 'Dhaka'})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fast WhatsApp / Call Action Buttons */}
                    <div className="flex items-center gap-2">
                      {selectedLead.customer_phone && (
                        <a
                          href={`https://wa.me/88${selectedLead.customer_phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 neu-btn rounded-xl text-primary text-xs font-black flex items-center gap-1 hover:bg-primary/10 cursor-pointer"
                          title="Open WhatsApp Web Chat"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {/* Converted Order Reference if placed */}
                      {selectedLead.converted_order_id ? (
                        <Link
                          href={`/admin/orders/${selectedLead.converted_order_id}`}
                          className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black flex items-center gap-1.5 shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Order #{selectedLead.converted_order?.order_number || selectedLead.converted_order_id}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm(`Remove lead "${selectedLead.customer_name}"?`)) {
                              deleteLeadMutation.mutate(selectedLead.id);
                            }
                          }}
                          className="p-2 neu-btn rounded-xl text-red-500 hover:bg-red-50"
                          title="Remove Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Conversation History Thread */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-2xl bg-muted/20 border border-border/40 min-h-[160px] max-h-[220px]">
                    {selectedLead.messages && selectedLead.messages.length > 0 ? (
                      selectedLead.messages.map((msg: MarketingLeadMessage) => {
                        const isCustomer = msg.sender_type === 'customer';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                          >
                            <div className="text-[10px] text-muted-foreground font-semibold px-1 mb-0.5">
                              {msg.sender_name || (isCustomer ? selectedLead.customer_name : 'Admin Moderator')} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className={`p-3 rounded-2xl text-xs max-w-[85%] whitespace-pre-line shadow-xs ${
                              isCustomer
                                ? 'bg-white dark:bg-[#1a2233] text-foreground border border-border/50 rounded-tl-none'
                                : 'bg-purple-600 text-white rounded-tr-none'
                            }`}>
                              {msg.message_text}

                              {msg.structured_quote && (
                                <div className="mt-2 pt-2 border-t border-white/20 text-[11px] font-mono space-y-0.5">
                                  {msg.structured_quote.order_number && (
                                    <div className="font-bold text-amber-200">
                                      Official Order: #{msg.structured_quote.order_number}
                                    </div>
                                  )}
                                  <div>Total: ৳{msg.structured_quote.total_payable} (Delivery: ৳{msg.structured_quote.delivery_fee})</div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        No chat messages logged yet.
                      </div>
                    )}
                  </div>

                  {/* Quick Reply Snippet Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-bold mr-1">Quick Replies:</span>
                    <button
                      type="button"
                      onClick={() => applyQuickReply('greeting')}
                      className="px-2 py-1 neu-btn rounded-lg text-[10px] font-bold text-foreground hover:text-purple-600"
                    >
                      👋 Availability
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickReply('quote')}
                      className="px-2 py-1 neu-btn rounded-lg text-[10px] font-bold text-foreground hover:text-purple-600"
                    >
                      💰 Price & Fee
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickReply('address')}
                      className="px-2 py-1 neu-btn rounded-lg text-[10px] font-bold text-foreground hover:text-purple-600"
                    >
                      📍 Ask Address
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickReply('cod')}
                      className="px-2 py-1 neu-btn rounded-lg text-[10px] font-bold text-foreground hover:text-purple-600"
                    >
                      📦 COD Inspection
                    </button>
                  </div>

                  {/* Fast Moderator Reply & Direct Order Creation Form */}
                  <div className="p-4 rounded-2xl neu-flat space-y-4 border border-border/50">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Multi-Item Order Placement Engine (⚡ Auto-Stock Sync)</span>
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Saves official Order & links attribution to Meta Campaign
                      </span>
                    </div>

                    {/* Customer Information (Editable before confirming order) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">Customer Name *</label>
                        <input
                          type="text"
                          value={orderForm.customer_name}
                          onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                          className="w-full mt-1 p-2 neu-input rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">Mobile Phone *</label>
                        <input
                          type="text"
                          value={orderForm.customer_phone}
                          onChange={(e) => setOrderForm({ ...orderForm, customer_phone: e.target.value })}
                          className="w-full mt-1 p-2 neu-input rounded-xl text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">Shipping Zone & Fee</label>
                        <select
                          value={orderForm.shipping_zone}
                          onChange={(e) => {
                            const zone = e.target.value;
                            const fee = zone === 'inside_dhaka' ? 70 : (zone === 'dhaka_suburb' ? 100 : 130);
                            setOrderForm({
                              ...orderForm,
                              shipping_zone: zone,
                              delivery_fee: fee,
                            });
                          }}
                          className="w-full mt-1 p-2 neu-input rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="inside_dhaka">Inside Dhaka City (৳70)</option>
                          <option value="dhaka_suburb">Dhaka Suburb / Gazipur (৳100)</option>
                          <option value="outside_dhaka">Outside Dhaka (৳130)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground">Full Delivery Address *</label>
                      <input
                        type="text"
                        value={orderForm.shipping_address}
                        onChange={(e) => setOrderForm({ ...orderForm, shipping_address: e.target.value })}
                        placeholder="House, Road, Area / Thana, District"
                        className="w-full mt-1 p-2 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    {/* Multi-Product Line Items Matrix */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                        <span>Inquired & Quoted Product Items ({orderForm.items.length})</span>
                        <button
                          type="button"
                          onClick={handleAddOrderItem}
                          className="text-primary hover:underline flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Add Another Product</span>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {orderForm.items.map((item, idx) => {
                          const prod = catalogProducts.find((p: any) => p.id === item.product_id);
                          const variants = prod?.variants || [];
                          return (
                            <div key={idx} className="p-2.5 rounded-xl neu-inset grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                              <div className="sm:col-span-5">
                                <select
                                  value={item.product_id}
                                  onChange={(e) => handleItemProductSelect(idx, Number(e.target.value))}
                                  className="w-full p-1.5 neu-input rounded-lg text-xs font-bold focus:outline-none"
                                >
                                  {catalogProducts.map((p: any) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name_en} (৳{Number(p.base_price).toLocaleString()})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Variant picker if present */}
                              <div className="sm:col-span-3">
                                {variants.length > 0 ? (
                                  <select
                                    value={item.variant_id || ''}
                                    onChange={(e) => handleItemVariantSelect(idx, Number(e.target.value))}
                                    className="w-full p-1.5 neu-input rounded-lg text-[11px] font-semibold focus:outline-none"
                                  >
                                    {variants.map((v: any) => (
                                      <option key={v.id} value={v.id}>
                                        {[v.color ? `Color: ${v.color}` : '', v.size ? `Size: ${v.size}` : ''].filter(Boolean).join(' | ') || `SKU: ${v.sku}`}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground font-semibold px-2">
                                    Standard
                                  </span>
                                )}
                              </div>

                              <div className="sm:col-span-1">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const updated = [...orderForm.items];
                                    updated[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                                    setOrderForm({ ...orderForm, items: updated });
                                  }}
                                  className="w-full p-1.5 neu-input rounded-lg text-xs font-black text-center focus:outline-none"
                                  title="Quantity"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => {
                                    const updated = [...orderForm.items];
                                    updated[idx].unit_price = parseFloat(e.target.value) || 0;
                                    setOrderForm({ ...orderForm, items: updated });
                                  }}
                                  className="w-full p-1.5 neu-input rounded-lg text-xs font-mono font-bold focus:outline-none"
                                  title="Unit Price"
                                />
                              </div>

                              <div className="sm:col-span-1 flex justify-end">
                                {orderForm.items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOrderItem(idx)}
                                    className="p-1 neu-btn rounded-lg text-red-500 hover:bg-red-50"
                                    title="Remove item"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Financial Total Bar & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Total Payable (Cash on Delivery): </span>
                        <span className="font-black text-sm text-primary">
                          {formatBDT(totalPayable)}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1 font-mono">
                          (Subtotal: ৳{itemsSubtotal} + Delivery: ৳{orderForm.delivery_fee})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!replyText.trim()) {
                              toast.error('Please type a reply message');
                              return;
                            }
                            replyLeadMutation.mutate({ leadId: selectedLead.id, text: replyText });
                          }}
                          disabled={replyLeadMutation.isPending}
                          className="px-4 py-2.5 neu-btn rounded-xl text-xs font-bold text-foreground hover:text-purple-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Quote Message</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleConfirmOrder}
                          disabled={convertOrderMutation.isPending}
                          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-1.5 shadow-lg cursor-pointer transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{convertOrderMutation.isPending ? 'Confirming...' : 'Confirm & Create Official Order'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Moderator custom text message box */}
                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-muted-foreground">Custom Reply Message</label>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type response or quote details to send back to Meta Messenger/WhatsApp..."
                        className="w-full mt-1 p-2 neu-input rounded-xl text-xs font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-2">
                  <MessageSquare className="w-12 h-12 stroke-1 text-muted-foreground/50" />
                  <h3 className="font-bold text-sm text-foreground">Select a Customer Lead</h3>
                  <p className="text-xs max-w-sm">
                    Select a conversation lead from the left list to review customer messages, quote prices, and generate real orders.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AD PLATFORM INTEGRATIONS & WEBHOOK GATEWAY */}
      {/* ========================================================================= */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Webhook Configuration & Credentials Card */}
          <div className="clay-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center font-black">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">Meta Webhook Gateway & Graph API Endpoints</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Connect Facebook Messenger & WhatsApp Cloud API to ingest customer chats in real-time.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/20 text-primary border border-primary/40">
                ⚡ Active & Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl neu-inset space-y-2">
                <label className="font-bold text-foreground">Webhook Callback URL (Meta Developers Portal)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin.replace('3000', '8000') : 'http://127.0.0.1:8000'}/api/v1/webhooks/meta`}
                    className="flex-1 p-2 neu-input rounded-xl text-xs font-mono font-bold"
                  />
                  <button
                    onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin.replace('3000', '8000') : 'http://127.0.0.1:8000'}/api/v1/webhooks/meta`, 'Webhook URL')}
                    className="p-2 neu-btn rounded-xl text-primary hover:bg-primary/10"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Paste this in Facebook Developer App &gt; Webhooks &gt; Callback URL.
                </p>
              </div>

              <div className="p-4 rounded-2xl neu-inset space-y-2">
                <label className="font-bold text-foreground">Meta Webhook Verify Token</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="bd_ecommerce_meta_2026"
                    className="flex-1 p-2 neu-input rounded-xl text-xs font-mono font-bold"
                  />
                  <button
                    onClick={() => copyToClipboard('bd_ecommerce_meta_2026', 'Verify Token')}
                    className="p-2 neu-btn rounded-xl text-primary hover:bg-primary/10"
                    title="Copy Token"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Verification challenge handshake token for Meta Webhooks.
                </p>
              </div>
            </div>
          </div>

          {/* Ad Platform API Keys & Credentials Form */}
          {settingsForm && (
            <div className="clay-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  <span>Ad Account API Tokens & Pixel Identifiers</span>
                </h3>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveSettingsMutation.mutate(settingsForm);
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-foreground">Meta Pixel ID</label>
                    <input
                      type="text"
                      value={settingsForm.meta_pixel_id || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, meta_pixel_id: e.target.value })}
                      placeholder="e.g. 398247190284712"
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-foreground">Google Ads Customer ID</label>
                    <input
                      type="text"
                      value={settingsForm.google_ads_customer_id || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, google_ads_customer_id: e.target.value })}
                      placeholder="e.g. 782-910-2938"
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-foreground">TikTok Pixel ID</label>
                    <input
                      type="text"
                      value={settingsForm.tiktok_pixel_id || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tiktok_pixel_id: e.target.value })}
                      placeholder="e.g. C9281928392102"
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-foreground">Meta Page Access Token (Graph API)</label>
                    <input
                      type="password"
                      value={settingsForm.meta_page_access_token || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, meta_page_access_token: e.target.value })}
                      placeholder="EAA..."
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-foreground">Meta App Secret</label>
                    <input
                      type="password"
                      value={settingsForm.meta_app_secret || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, meta_app_secret: e.target.value })}
                      placeholder="App Secret"
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-border">
                  <button
                    type="submit"
                    disabled={saveSettingsMutation.isPending}
                    className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-black shadow-md cursor-pointer"
                  >
                    {saveSettingsMutation.isPending ? 'Saving...' : 'Save Integration Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Interactive Live Webhook Simulator Tool */}
          <div className="clay-card p-6 rounded-3xl space-y-4 border border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-black text-foreground">
                  Interactive Live Webhook Simulator (Test Ingestion)
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground font-semibold">
                Simulate an incoming lead message from Messenger / WhatsApp
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                simulateWebhookMutation.mutate(simForm);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-foreground">Channel</label>
                  <select
                    value={simForm.channel}
                    onChange={(e) => setSimForm({ ...simForm, channel: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="meta_messenger">Facebook Messenger</option>
                    <option value="meta_whatsapp">WhatsApp Business API</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={simForm.customer_name}
                    onChange={(e) => setSimForm({ ...simForm, customer_name: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground">Mobile Phone</label>
                  <input
                    type="text"
                    required
                    value={simForm.customer_phone}
                    onChange={(e) => setSimForm({ ...simForm, customer_phone: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground">Inquired Product</label>
                <input
                  type="text"
                  value={simForm.inquired_product}
                  onChange={(e) => setSimForm({ ...simForm, inquired_product: e.target.value })}
                  placeholder="e.g. Samsung Galaxy A55 5G"
                  className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-foreground">Customer Inquiry Message Body</label>
                <textarea
                  rows={2}
                  required
                  value={simForm.message_text}
                  onChange={(e) => setSimForm({ ...simForm, message_text: e.target.value })}
                  className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={simulateWebhookMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{simulateWebhookMutation.isPending ? 'Simulating...' : 'Simulate & Ingest Test Lead'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT CAMPAIGN (With Dual Close Standard) */}
      {/* ========================================================================= */}
      {isCampaignModalOpen && (
        <div 
          onClick={() => setIsCampaignModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="clay-card p-6 rounded-3xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black text-foreground">
                {editingCampaign ? 'Edit Ad Campaign' : 'Launch New Marketing Campaign'}
              </h3>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="p-1.5 neu-btn rounded-xl text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveCampaignMutation.mutate(campaignFormData);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground">Advertising Channel *</label>
                  <select
                    value={campaignFormData.channel}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, channel: e.target.value as MarketingChannel })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="facebook">Facebook / Meta Ads</option>
                    <option value="google">Google Ads</option>
                    <option value="tiktok">TikTok Ads</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground">Campaign Objective</label>
                  <select
                    value={campaignFormData.objective}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, objective: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="messages">Message Inquiries (Chat)</option>
                    <option value="conversions">Website Conversions</option>
                    <option value="traffic">Traffic & Clicks</option>
                    <option value="leads">Instant Lead Forms</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={campaignFormData.campaign_name}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, campaign_name: e.target.value })}
                  placeholder="e.g. Eid 2026 Mega Tech & Gadget Sale"
                  className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground">External Ad ID / Code</label>
                  <input
                    type="text"
                    value={campaignFormData.campaign_id_external}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, campaign_id_external: e.target.value })}
                    placeholder="e.g. FB-CMP-2026-003"
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground">Ad Set / Target Audience</label>
                  <input
                    type="text"
                    value={campaignFormData.ad_set_name}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, ad_set_name: e.target.value })}
                    placeholder="e.g. Dhaka & Chittagong 18-35"
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-foreground">Daily Budget (৳)</label>
                  <input
                    type="number"
                    value={campaignFormData.daily_budget}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, daily_budget: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground">Total Spend (৳)</label>
                  <input
                    type="number"
                    value={campaignFormData.total_spend}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, total_spend: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground">Revenue (৳)</label>
                  <input
                    type="number"
                    value={campaignFormData.revenue_generated}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, revenue_generated: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-foreground">Impressions</label>
                  <input
                    type="number"
                    value={campaignFormData.impressions}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, impressions: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground">Clicks</label>
                  <input
                    type="number"
                    value={campaignFormData.clicks}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, clicks: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground">Status</label>
                  <select
                    value={campaignFormData.status}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, status: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2.5 neu-btn rounded-xl text-xs font-bold text-muted-foreground cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saveCampaignMutation.isPending}
                  className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  {saveCampaignMutation.isPending ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Save Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD MANUAL CUSTOMER LEAD (With Dual Close Standard) */}
      {/* ========================================================================= */}
      {isNewLeadModalOpen && (
        <div 
          onClick={() => setIsNewLeadModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="clay-card p-6 rounded-3xl max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black text-foreground">
                Add New Customer Lead / Inquiry
              </h3>
              <button
                onClick={() => setIsNewLeadModalOpen(false)}
                className="p-1.5 neu-btn rounded-xl text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createLeadMutation.mutate(manualLeadForm);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-foreground">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={manualLeadForm.customer_name}
                  onChange={(e) => setManualLeadForm({ ...manualLeadForm, customer_name: e.target.value })}
                  className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={manualLeadForm.customer_phone}
                    onChange={(e) => setManualLeadForm({ ...manualLeadForm, customer_phone: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground">Channel</label>
                  <select
                    value={manualLeadForm.channel}
                    onChange={(e) => setManualLeadForm({ ...manualLeadForm, channel: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="meta_messenger">Facebook Messenger</option>
                    <option value="meta_whatsapp">WhatsApp</option>
                    <option value="meta_instagram">Instagram</option>
                    <option value="google_lead">Google Lead</option>
                    <option value="tiktok_lead">TikTok Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground">Inquired Product</label>
                <input
                  type="text"
                  value={manualLeadForm.inquired_products}
                  onChange={(e) => setManualLeadForm({ ...manualLeadForm, inquired_products: e.target.value })}
                  placeholder="e.g. Xiaomi Redmi Note 13 Pro"
                  className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-foreground">Delivery Address</label>
                <input
                  type="text"
                  value={manualLeadForm.delivery_address}
                  onChange={(e) => setManualLeadForm({ ...manualLeadForm, delivery_address: e.target.value })}
                  placeholder="House, Road, Area"
                  className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-foreground">Initial Customer Message</label>
                <textarea
                  rows={2}
                  value={manualLeadForm.customer_message}
                  onChange={(e) => setManualLeadForm({ ...manualLeadForm, customer_message: e.target.value })}
                  placeholder="Customer inquiry details..."
                  className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewLeadModalOpen(false)}
                  className="px-4 py-2.5 neu-btn rounded-xl text-xs font-bold text-muted-foreground"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLeadMutation.isPending}
                  className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-black shadow-md"
                >
                  {createLeadMutation.isPending ? 'Saving...' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
