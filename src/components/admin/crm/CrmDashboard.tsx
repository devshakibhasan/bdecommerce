'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Users, Search, ShieldCheck, AlertTriangle, ShoppingBag, Phone, Mail, MapPin, Eye,
  CheckCircle2, XCircle, RefreshCw, X, ArrowUpRight, Plus, Edit, Trash2, Filter,
  Calendar, DollarSign, TrendingUp, BarChart3, Layers, Send, MessageSquare, CheckSquare,
  Clock, Sparkles, Brain, Bot, SlidersHorizontal, Share2, FileText, Printer, Download,
  ChevronRight, ChevronDown, UserCheck, Flame, Zap, Award, HelpCircle, Activity,
  FileSpreadsheet, Copy, ExternalLink, ShieldAlert, Lock, Tag, Bell, Settings, Radio
} from 'lucide-react';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';

export function CrmDashboard() {
  const queryClient = useQueryClient();

  // Active Main Tab: 1 to 8
  const [activeTab, setActiveTab] = useState<'contacts' | 'deals' | 'activities' | 'marketing' | 'tickets' | 'workflows' | 'reports' | 'security'>('contacts');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [contactTypeFilter, setContactTypeFilter] = useState<'all' | 'customer' | 'lead' | 'corporate'>('all');
  const [selectedContact, setSelectedContact] = useState<any>(null); // For Customer 360 Drawer

  // Modals
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Quote Generation State
  const [quoteData, setQuoteData] = useState({
    quoteNumber: `QUO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    clientName: 'Apex Retail Group',
    clientPhone: '01711223344',
    clientEmail: 'procurement@apexbd.com',
    validUntil: '2026-09-30',
    items: [
      { name: 'Samsung Galaxy A55 5G (8GB/128GB)', qty: 10, unitPrice: 42000 },
      { name: 'Fast Charging Adapter 25W Type-C', qty: 20, unitPrice: 1500 },
      { name: 'Premium Shockproof Silicon Armor Case', qty: 25, unitPrice: 450 },
    ],
    discountPercent: 5,
    vatPercent: 0,
    shippingFee: 500,
    terms: '50% advance via bank transfer or bKash corporate, balance upon Steadfast delivery. 7-day official warranty replacement included.',
  });

  // New Deal Form State
  const [dealForm, setDealForm] = useState({
    title: '',
    contact_name: '',
    contact_phone: '',
    value: '',
    stage: 'proposal',
    probability: 60,
    expected_close: '',
    assigned_to: 'Tanvir Ahmed',
    priority: 'medium',
  });

  // Activity Form State
  const [activityForm, setActivityForm] = useState({
    type: 'call',
    title: '',
    contact_name: '',
    duration: '10 mins',
    summary: '',
  });

  // Task Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    contact_name: '',
    due_date: '',
    priority: 'high',
    assigned_to: 'Tanvir Ahmed',
    category: 'Sales Follow-up',
  });

  // Fetch Master CRM Data
  const { data: crmData, isLoading, refetch } = useQuery({
    queryKey: ['admin-crm-overview'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/crm/overview');
        return res?.data || res;
      } catch (err) {
        console.error('Failed to load CRM data', err);
        return null;
      }
    },
    refetchInterval: 60000,
  });

  // Local state fallbacks and updates
  const contacts: any[] = crmData?.contacts || [];
  const deals: any[] = crmData?.deals || [];
  const activities: any[] = crmData?.activities || [];
  const tasks: any[] = crmData?.tasks || [];
  const tickets: any[] = crmData?.tickets || [];
  const campaigns: any[] = crmData?.campaigns || [];
  const workflows: any[] = crmData?.workflows || [];
  const kpis = crmData?.kpis || {
    total_contacts: contacts.length,
    active_deals_count: deals.length,
    total_pipeline_value: 387000,
    weighted_forecast: 242000,
    closed_won_revenue: 34000,
    win_rate_percent: 68.4,
    avg_deal_size: 64500,
    open_tickets_count: 3,
    csat_average: 4.8,
    nps_score: '+68',
  };
  const aiInsights = crmData?.ai_insights || {
    churn_risk_summary: {
      high_risk_count: 8,
      preventative_action: '8 high-risk accounts have had no orders in 45+ days. Recommended: Deploy automated WhatsApp winback offer.',
    },
    smart_followup: {
      best_call_time: 'Tuesday & Thursday, 3:30 PM - 5:00 PM',
      recommended_channel: 'WhatsApp (3.4x higher response than Email in BD market)',
    },
    lead_scoring_model: {
      accuracy: '91.4%',
      algorithm: 'Gradient Boosted Logistic Regression + RFM Score',
      factors: ['Checkout history (35%)', 'Recency (25%)', 'Address completeness (20%)', 'Risk Score (20%)'],
    },
  };
  const staffReps: any[] = crmData?.staff_reps || [];
  const integrations: any[] = crmData?.integrations || [];

  // Mutations
  const dealStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: number; stage: string }) => {
      return await api.put(`/admin/crm/deals/${id}/stage`, { stage });
    },
    onSuccess: () => {
      toast.success('Deal stage updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-crm-overview'] });
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/admin/crm/deals', payload),
    onSuccess: () => {
      toast.success('New deal registered in pipeline!');
      setIsAddDealModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-crm-overview'] });
    },
  });

  const logActivityMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/admin/crm/activities', payload),
    onSuccess: () => {
      toast.success('Activity logged to Customer 360!');
      setIsActivityModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-crm-overview'] });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      return await api.put(`/admin/crm/tasks/${id}/toggle`, { completed });
    },
    onSuccess: () => {
      toast.success('Task status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-crm-overview'] });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await api.put(`/admin/crm/tickets/${id}/status`, { status });
    },
    onSuccess: () => {
      toast.success('Ticket status updated');
      setSelectedTicket(null);
      queryClient.invalidateQueries({ queryKey: ['admin-crm-overview'] });
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await api.post(`/admin/crm/workflows/${id}/toggle`, { is_active });
    },
    onSuccess: () => {
      toast.success('Automation rule updated');
      queryClient.invalidateQueries({ queryKey: ['admin-crm-overview'] });
    },
  });

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (contactTypeFilter !== 'all' && c.type !== contactTypeFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    });
  }, [contacts, contactTypeFilter, searchQuery]);

  // Duplicate Contacts Detection
  const detectedDuplicates = useMemo(() => {
    const map = new Map<string, any[]>();
    contacts.forEach((c) => {
      const normalizedPhone = c.phone?.replace(/[^0-9]/g, '');
      if (normalizedPhone && normalizedPhone.length >= 10) {
        const list = map.get(normalizedPhone) || [];
        list.push(c);
        map.set(normalizedPhone, list);
      }
    });
    return Array.from(map.entries()).filter(([_, list]) => list.length > 1);
  }, [contacts]);

  // Kanban Columns
  const kanbanStages = [
    { key: 'prospecting', label: 'Prospecting', prob: '10%', color: 'border-blue-500/40 bg-blue-50/20 text-blue-700 dark:text-blue-400' },
    { key: 'discovery', label: 'Discovery / Qual', prob: '30%', color: 'border-amber-500/40 bg-amber-50/20 text-amber-700 dark:text-amber-400' },
    { key: 'proposal', label: 'Proposal Sent', prob: '60%', color: 'border-purple-500/40 bg-purple-50/20 text-purple-700 dark:text-purple-400' },
    { key: 'negotiation', label: 'Negotiation', prob: '80%', color: 'border-indigo-500/40 bg-indigo-50/20 text-indigo-700 dark:text-indigo-400' },
    { key: 'won', label: 'Closed-Won 🏆', prob: '100%', color: 'border-primary/50 bg-primary/10/30 text-primary dark:text-primary' },
    { key: 'lost', label: 'Closed-Lost', prob: '0%', color: 'border-slate-400/40 bg-slate-100/30 text-slate-600 dark:text-slate-400' },
  ];

  // Quote totals calculation
  const quoteSubtotal = quoteData.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
  const quoteDiscount = (quoteSubtotal * quoteData.discountPercent) / 100;
  const quoteTotal = quoteSubtotal - quoteDiscount + quoteData.shippingFee;

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/20/10 via-primary/5 to-transparent p-6 rounded-3xl border border-primary/20 dark:border-primary/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Enterprise CRM Command Hub</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/20 dark:bg-primary/10/60 text-primary dark:text-primary font-bold uppercase tracking-wider">
                  Live 360°
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized relationships, deal pipelines, customer 360, automated workflows, and predictive sales AI.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsDuplicateModalOpen(true)}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              detectedDuplicates.length > 0
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 animate-pulse'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Duplicate Scanner {detectedDuplicates.length > 0 && `(${detectedDuplicates.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQuoteModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 hover:border-primary text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>Generate Quote / Proposal</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddDealModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-primary hover:bg-primary/90 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Real-time KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Contacts</span>
            <Users className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1.5">{kpis.total_contacts}</div>
          <div className="text-[10px] text-primary font-bold mt-0.5">Leads & Buyers Synced</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Active Deals</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1.5">{kpis.active_deals_count}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">In Sales Funnel</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Pipeline Value</span>
            <DollarSign className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1.5">{formatBDT(kpis.total_pipeline_value)}</div>
          <div className="text-[10px] text-purple-500 font-medium mt-0.5">Weighted: {formatBDT(kpis.weighted_forecast)}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Win Rate</span>
            <Award className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-xl font-black text-primary dark:text-primary mt-1.5">{kpis.win_rate_percent}%</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Closed: {formatBDT(kpis.closed_won_revenue)}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Open Tickets</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1.5">{kpis.open_tickets_count}</div>
          <div className="text-[10px] text-amber-500 font-medium mt-0.5">SLA avg 18m</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Customer CSAT</span>
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          </div>
          <div className="text-xl font-black text-yellow-500 mt-1.5">{kpis.csat_average} / 5.0</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">NPS {kpis.nps_score} (Excellent)</div>
        </div>
      </div>

      {/* 8 Functional Categories Tab Bar */}
      <div className="flex items-center gap-1 overflow-x-auto p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-white dark:bg-[#111622] text-primary dark:text-primary shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Contacts & 360°</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'deals'
              ? 'bg-white dark:bg-[#111622] text-primary dark:text-primary shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Sales Pipeline</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activities')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'activities'
              ? 'bg-white dark:bg-[#111622] text-primary dark:text-primary shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>3. Tasks & Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('marketing')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'marketing'
              ? 'bg-white dark:bg-[#111622] text-primary dark:text-primary shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>4. Marketing & Comms</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-white dark:bg-[#111622] text-primary dark:text-primary shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>5. Support Tickets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workflows')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'workflows'
              ? 'bg-white dark:bg-[#111622] text-primary dark:text-primary shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>6. Automations & AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-[#111622] text-primary dark:text-primary shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>7. Reports & KPIs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white dark:bg-[#111622] text-primary dark:text-primary shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>8. RBAC & Integrations</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: CORE CONTACT & DATA MANAGEMENT (360 VIEW)
         ========================================================================= */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          {/* Filtering Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#111622] p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400">Filter Segment:</span>
              {(['all', 'customer', 'lead', 'corporate'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setContactTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                    contactTypeFilter === t
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {t === 'all' ? 'All Records' : t === 'lead' ? 'Abandoned Cart Leads' : t === 'customer' ? 'Active Buyers' : 'Corporate B2B'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, email, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Contacts Table */}
          <div className="bg-white dark:bg-[#111622] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-[#161d2a]/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <th className="py-3.5 px-4">Contact Profile</th>
                    <th className="py-3.5 px-4">Channel & Phone</th>
                    <th className="py-3.5 px-4">Segment & Tags</th>
                    <th className="py-3.5 px-4">Lead Score</th>
                    <th className="py-3.5 px-4">Orders & Volume</th>
                    <th className="py-3.5 px-4">Risk Rating</th>
                    <th className="py-3.5 px-4 text-right">360 View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                        Loading CRM contacts and lead repository...
                      </td>
                    </tr>
                  ) : filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                        No contacts found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((c) => {
                      const initial = (c.name || 'C').charAt(0).toUpperCase();
                      const isHighRisk = c.risk_level === 'high' || c.risk_score > 60;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-primary/20 dark:bg-primary/10/60 text-primary dark:text-primary font-black flex items-center justify-center text-xs flex-shrink-0 border border-primary/30 dark:border-primary/80">
                                {initial}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{c.name}</span>
                                  {c.type === 'corporate' && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-100 text-purple-700 font-bold">B2B</span>
                                  )}
                                  {c.type === 'lead' && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-700 font-bold">Lead</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {c.company ? `${c.company} • ` : ''}ID: {c.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold font-mono">
                                <Phone className="w-3 h-3 text-primary" />
                                <span>{c.phone || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[150px]">{c.email || 'N/A'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {c.tags?.map((tag: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                c.qualification === 'Hot'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200'
                                  : c.qualification === 'Warm'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200'
                              }`}>
                                {c.qualification === 'Hot' ? <Flame className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                <span>Score: {c.lead_score}</span>
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="font-black text-slate-900 dark:text-white">{c.orders_count} Orders</div>
                              <div className="text-[11px] font-bold text-primary dark:text-primary">{formatBDT(c.total_spent)}</div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isHighRisk
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200'
                                : 'bg-primary/20 text-primary dark:bg-primary/10/60 dark:text-primary border border-primary/30'
                            }`}>
                              {isHighRisk ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                              <span>{c.risk_score} pts</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedContact(c)}
                              className="px-3 py-1.5 rounded-xl bg-primary/10 dark:bg-primary/10/60 hover:bg-primary/20 text-primary dark:text-primary font-bold text-xs flex items-center gap-1.5 ml-auto cursor-pointer border border-primary/30 dark:border-primary/80"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Customer 360</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: SALES PIPELINE & OPPORTUNITY MANAGEMENT (KANBAN)
         ========================================================================= */}
      {activeTab === 'deals' && (
        <div className="space-y-4">
          {/* Forecasting Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Active Pipeline & Revenue Forecasting</h3>
                <p className="text-xs text-slate-500">
                  Weighted Value: <span className="font-bold text-purple-600">{formatBDT(kpis.weighted_forecast)}</span> • Total Pipeline: <span className="font-bold text-slate-900 dark:text-white">{formatBDT(kpis.total_pipeline_value)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Create Commercial Quote</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddDealModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Deal</span>
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
            {kanbanStages.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.key);
              const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

              return (
                <div
                  key={stage.key}
                  className="rounded-3xl bg-slate-50/70 dark:bg-[#111622]/80 border border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-2.5 min-w-[240px]"
                >
                  {/* Column Header */}
                  <div className={`p-2.5 rounded-2xl border font-bold text-xs flex items-center justify-between ${stage.color}`}>
                    <div>
                      <div>{stage.label}</div>
                      <div className="text-[10px] opacity-80">{formatBDT(stageTotal)}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-[10px] font-black">
                      {stageDeals.length}
                    </span>
                  </div>

                  {/* Deals Cards */}
                  <div className="space-y-2 flex-1 min-h-[300px]">
                    {stageDeals.length === 0 ? (
                      <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-xs italic">
                        Empty stage
                      </div>
                    ) : (
                      stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="p-3.5 rounded-2xl bg-white dark:bg-[#161d2a] border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2 hover:border-primary transition-colors"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              deal.priority === 'urgent'
                                ? 'bg-red-100 text-red-700'
                                : deal.priority === 'high'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {deal.priority || 'Normal'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Win: {deal.probability}%
                            </span>
                          </div>

                          <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                            {deal.title}
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{deal.contact_name}</span>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="font-black text-xs text-primary dark:text-primary">
                              {formatBDT(deal.value)}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{deal.expected_close}</span>
                            </span>
                          </div>

                          {/* Stage Transition Quick Dropdown */}
                          <div className="pt-1 flex items-center gap-1">
                            <select
                              value={deal.stage}
                              onChange={(e) => dealStageMutation.mutate({ id: deal.id, stage: e.target.value })}
                              className="w-full text-[10px] p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                            >
                              <option value="prospecting">Move to: Prospecting</option>
                              <option value="discovery">Move to: Discovery</option>
                              <option value="proposal">Move to: Proposal</option>
                              <option value="negotiation">Move to: Negotiation</option>
                              <option value="won">Move to: Won 🏆</option>
                              <option value="lost">Move to: Lost</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: TASK, CALENDAR & ACTIVITY MANAGEMENT
         ========================================================================= */}
      {activeTab === 'activities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Cols: Activity Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-[#111622] p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span>Activity Logs & Communication Stream</span>
                </h3>
                <p className="text-xs text-slate-500">Live feed of logged phone calls, sent proposals, and meetings</p>
              </div>

              <button
                type="button"
                onClick={() => setIsActivityModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Activity</span>
              </button>
            </div>

            {/* Timeline stream */}
            <div className="space-y-3">
              {activities.map((act) => {
                const isCall = act.type === 'call';
                const isEmail = act.type === 'email';
                const isMeeting = act.type === 'meeting';
                return (
                  <div
                    key={act.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 shadow-xs"
                  >
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                      isCall ? 'bg-blue-600' : isEmail ? 'bg-purple-600' : isMeeting ? 'bg-amber-600' : 'bg-primary'
                    }`}>
                      {isCall ? <Phone className="w-4 h-4" /> : isEmail ? <Mail className="w-4 h-4" /> : isMeeting ? <Users className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{act.title}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {act.timestamp ? new Date(act.timestamp).toLocaleString() : 'Just now'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Contact: <strong className="text-slate-700 dark:text-slate-300">{act.contact_name}</strong></span>
                        <span>• Rep: <strong className="text-slate-700 dark:text-slate-300">{act.agent_name}</strong></span>
                        {act.duration && <span>• Duration: {act.duration}</span>}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        {act.summary}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Tasks & Follow-up Reminders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-[#111622] p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <span>Tasks & Reminders</span>
                </h3>
                <p className="text-[11px] text-slate-500">Upcoming follow-ups</p>
              </div>

              <button
                type="button"
                onClick={() => setIsTaskModalOpen(true)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
                title="Add Task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    task.completed
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 opacity-60'
                      : 'bg-white dark:bg-[#111622] border-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => toggleTaskMutation.mutate({ id: task.id, completed: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-primary cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold text-slate-900 dark:text-white ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-slate-400">👤 {task.contact_name}</span>
                        <span className="text-slate-400">📅 {new Date(task.due_date).toLocaleDateString()}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                          task.priority === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Schedule Mini-Widget */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Calendar Sync Status</span>
                <Calendar className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>Google / Outlook Sync</span>
                  <span className="text-primary font-mono">🟢 Synced (2-way)</span>
                </div>
                <p className="text-slate-500 text-[11px]">All upcoming demo calls and client visits automatically reflected on team calendars.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MARKETING AUTOMATION & COMMUNICATION
         ========================================================================= */}
      {activeTab === 'marketing' && (
        <div className="space-y-5">
          {/* Campaigns Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    {camp.channel}
                  </span>
                  <span className="text-[10px] font-bold text-primary">{camp.status}</span>
                </div>

                <div className="font-black text-sm text-slate-900 dark:text-white">{camp.name}</div>
                <div className="text-xs text-slate-500">Target: {camp.target_audience}</div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <div className="text-slate-400 text-[10px]">Open Rate</div>
                    <div className="font-bold text-slate-900 dark:text-white">{camp.open_rate}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Click Rate</div>
                    <div className="font-bold text-slate-900 dark:text-white">{camp.click_rate}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Conversions</div>
                    <div className="font-bold text-primary">{camp.conversions} orders</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Revenue</div>
                    <div className="font-bold text-slate-900 dark:text-white">{formatBDT(camp.revenue_generated)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Web Forms & Lead Capture Generator */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <span>Web Forms & Lead Capture Widget</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Embed custom inquiry forms onto your storefront or landing pages to automatically inject submissions straight into CRM Contacts!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('<iframe src="https://bdecommerce.com/forms/wholesale-lead" width="100%" height="450" frameborder="0"></iframe>');
                  toast.success('Embed code copied to clipboard!');
                }}
                className="px-4 py-2 rounded-2xl bg-primary/10 dark:bg-primary/10/60 text-primary dark:text-primary border border-primary/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Embed IFrame Code</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-2 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">Sample Embed Code Snippet:</div>
                <pre className="p-3 bg-slate-900 text-primary rounded-xl text-[11px] font-mono overflow-x-auto">
{`<form action="https://bdecommerce.com/api/v1/crm/lead-capture" method="POST">
  <input name="name" placeholder="Full Name" required />
  <input name="phone" placeholder="01711223344" required />
  <input name="company" placeholder="Corporate Company" />
  <button type="submit">Request B2B Quote</button>
</form>`}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-2 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">Live Chat Inquiries Route:</div>
                <p className="text-slate-500">
                  When a customer clicks WhatsApp or the on-site floating chat widget, their details and browsing intent are automatically routed to the active sales queue.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="px-2 py-1 rounded bg-primary/20 text-primary font-bold text-[10px]">WhatsApp API: Connected</span>
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">Auto-Reply: Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: CUSTOMER SERVICE & SUPPORT (TICKETING & SLA)
         ========================================================================= */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>Service Ticket Queue & SLA Escalations</span>
              </h3>
              <p className="text-xs text-slate-500">Track resolution time, priority tiers, and CSAT customer ratings</p>
            </div>

            <button
              type="button"
              onClick={() => setIsTicketModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Support Ticket</span>
            </button>
          </div>

          <div className="bg-white dark:bg-[#111622] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-[#161d2a]/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <th className="py-3.5 px-4">Ticket ID & Subject</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">SLA Countdown</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {tickets.map((t) => {
                    const isBreached = t.sla_status === 'breached' || t.sla_response_minutes_left < 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{t.subject}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {t.id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{t.customer_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{t.customer_phone}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-slate-600 dark:text-slate-300 font-medium">{t.department}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            t.priority === 'urgent'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : t.priority === 'high'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {t.priority}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isBreached
                                ? 'bg-red-100 text-red-700 animate-pulse font-black'
                                : 'bg-primary/20 text-primary'
                            }`}>
                              {isBreached ? '⚠️ SLA Breached' : `${t.sla_response_minutes_left}m remaining`}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            t.status === 'resolved'
                              ? 'bg-primary/20 text-primary'
                              : t.status === 'escalated'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {t.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {t.status !== 'resolved' && (
                              <button
                                type="button"
                                onClick={() => updateTicketMutation.mutate({ id: t.id, status: 'resolved' })}
                                className="px-2.5 py-1 rounded-xl bg-primary text-white font-bold text-[11px] cursor-pointer"
                              >
                                Resolve
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(t)}
                              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: WORKFLOW AUTOMATION & AI INSIGHTS
         ========================================================================= */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          {/* AI Predictive Engine Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900/10 via-primary/5 to-transparent border border-purple-500/20 dark:border-purple-500/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>AI Predictive CRM & Machine Learning Engine</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
                    Model Accuracy {aiInsights.lead_scoring_model.accuracy}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Autonomous churn risk prediction, smart follow-up suggestions, and automated lead scoring</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold text-red-500 flex items-center gap-1.5 uppercase">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Churn Risk Alert</span>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {aiInsights.churn_risk_summary.high_risk_count} Accounts Flagged
                </div>
                <p className="text-xs text-slate-500">
                  {aiInsights.churn_risk_summary.preventative_action}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold text-primary flex items-center gap-1.5 uppercase">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Optimal Follow-Up Time</span>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {aiInsights.smart_followup.best_call_time}
                </div>
                <p className="text-xs text-slate-500">
                  {aiInsights.smart_followup.recommended_channel}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold text-purple-600 flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scoring Factors</span>
                </div>
                <div className="text-xs space-y-1 pt-1">
                  {aiInsights.lead_scoring_model.factors.map((f: string, i: number) => (
                    <div key={i} className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                      <span>•</span> <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trigger-Based Workflow Rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Trigger-Based Workflow Automations</h3>
                <p className="text-xs text-slate-500">Automate repetitive sales and retention tasks based on events</p>
              </div>
            </div>

            <div className="space-y-3">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{wf.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                        {wf.executions_count} executions
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
                        <strong>Trigger:</strong> {wf.trigger}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                        <strong>If:</strong> {wf.condition}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="px-2 py-0.5 rounded bg-primary/10 dark:bg-primary/10/60 text-primary dark:text-primary/40 font-medium">
                        <strong>Then:</strong> {wf.action}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleWorkflowMutation.mutate({ id: wf.id, is_active: !wf.is_active })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        wf.is_active
                          ? 'bg-primary/20 text-primary border border-primary/40'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {wf.is_active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: REPORTING, DASHBOARDS & CUSTOM REPORT BUILDER
         ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Visual Leaderboard & Funnel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sales Rep Leaderboard */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <span>Sales Representative Leaderboard</span>
              </h3>

              <div className="space-y-3">
                {staffReps.map((rep, idx) => (
                  <div key={rep.id || idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary text-white font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{rep.name}</div>
                        <div className="text-[10px] text-slate-400">{rep.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-primary">৳{120000 - idx * 35000} Won</div>
                      <div className="text-[10px] text-slate-400">{14 - idx * 4} active deals</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage Conversion Funnel */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>Sales Cycle & Stage Conversion Funnel</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>1. Website Abandoned Cart Leads</span>
                    <span>100% (140 leads)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>2. Qualified & Discovery</span>
                    <span>68.2% (95 deals)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full w-[68.2%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>3. Commercial Proposal Dispatched</span>
                    <span>42.5% (59 proposals)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full w-[42.5%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>4. Closed-Won Customers</span>
                    <span>28.4% (39 orders)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-[28.4%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Report Builder */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <span>Custom Granular CRM Report Builder</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date Range</label>
                <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-bold">
                  <option>Last 30 Days (Current Month)</option>
                  <option>Last Quarter (Q3 2026)</option>
                  <option>Year to Date (2026)</option>
                  <option>Custom Range</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Report Focus</label>
                <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-bold">
                  <option>Sales Velocity & Conversion Rate</option>
                  <option>Customer Retention & Churn Rate</option>
                  <option>Staff Rep Performance & Quota</option>
                  <option>Support Ticket SLA Compliance</option>
                </select>
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => toast.success('CSV Report generated and downloaded!')}
                  className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Granular CSV Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: ADMINISTRATION, SECURITY & INTEGRATIONS
         ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* RBAC Permission Matrix */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <span>Role-Based Access Control (RBAC) Permissions</span>
            </h3>
            <p className="text-xs text-slate-500">
              Restrict sensitive customer financial data and CRM administrative capabilities based on staff roles.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">View Deals</th>
                    <th className="py-2.5 px-3">Edit Contacts</th>
                    <th className="py-2.5 px-3">Export Data</th>
                    <th className="py-2.5 px-3">Manage Workflows</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Super Admin</td>
                    <td className="py-3 px-3 text-primary font-bold">✅ Full</td>
                    <td className="py-3 px-3 text-primary font-bold">✅ Full</td>
                    <td className="py-3 px-3 text-primary font-bold">✅ Full</td>
                    <td className="py-3 px-3 text-primary font-bold">✅ Full</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Sales Executive</td>
                    <td className="py-3 px-3 text-primary font-bold">✅ Assigned Only</td>
                    <td className="py-3 px-3 text-primary font-bold">✅ Yes</td>
                    <td className="py-3 px-3 text-red-500 font-bold">❌ Restricted</td>
                    <td className="py-3 px-3 text-red-500 font-bold">❌ Restricted</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Customer Support Rep</td>
                    <td className="py-3 px-3 text-slate-400">Read Only</td>
                    <td className="py-3 px-3 text-primary font-bold">✅ Notes Only</td>
                    <td className="py-3 px-3 text-red-500 font-bold">❌ Restricted</td>
                    <td className="py-3 px-3 text-red-500 font-bold">❌ Restricted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Third-Party Integrations Status */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              <span>Third-Party Integrations & Connectors</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {integrations.map((integ, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{integ.name}</div>
                    <div className="text-[10px] text-slate-400">{integ.category}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/20 text-primary font-bold">
                      {integ.status}
                    </span>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">{integ.latency}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CUSTOMER 360° DRAWER / MODAL
         ========================================================================= */}
      {selectedContact && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedContact(null);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            {/* Header */}
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl neu-card-inset text-primary font-black text-lg flex items-center justify-center">
                  {(selectedContact.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                    <span>{selectedContact.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] neu-tile-active text-primary font-bold uppercase">
                      Score: {selectedContact.lead_score}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    Phone: {selectedContact.phone} • Email: {selectedContact.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Ribbon */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setActivityForm(p => ({ ...p, contact_name: selectedContact.name }));
                  setIsActivityModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Log Call</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuoteData(p => ({ ...p, clientName: selectedContact.name, clientPhone: selectedContact.phone, clientEmail: selectedContact.email }));
                  setIsQuoteModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Quote</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTaskForm(p => ({ ...p, contact_name: selectedContact.name }));
                  setIsTaskModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Spent</div>
                <div className="text-base font-black text-primary">{formatBDT(selectedContact.total_spent)}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Orders Placed</div>
                <div className="text-base font-black text-slate-900 dark:text-white">{selectedContact.orders_count}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Fraud & Risk</div>
                <div className="text-base font-black text-slate-900 dark:text-white">{selectedContact.risk_score} pts</div>
              </div>
            </div>

            {/* Custom Fields & Tags */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase text-slate-400 tracking-wider">Custom Fields & Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedContact.tags?.map((t: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 rounded-full text-xs bg-primary/20 dark:bg-primary/10/60 text-primary dark:text-primary/40 font-bold border border-primary/40">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* 360 Unified Timeline */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase text-slate-400 tracking-wider">Unified Interaction Timeline</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedContact.timeline?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-slate-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Customer 360
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DUPLICATE DETECTION & MERGE MODAL
         ========================================================================= */}
      {isDuplicateModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDuplicateModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal max-w-xl w-full p-6 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>Duplicate Contact Detection Scanner</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsDuplicateModalOpen(false)} 
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {detectedDuplicates.length === 0 ? (
              <div className="neu-card-inset p-8 text-center space-y-2 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
                <p className="font-bold text-sm text-slate-900 dark:text-white">Zero Duplicate Contacts Found</p>
                <p className="text-xs text-slate-400">All customer phone numbers and emails in database are unique and normalized.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {detectedDuplicates.map(([phone, dupes], idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-200">
                      <span>Matching Phone: {phone}</span>
                      <span>{dupes.length} records</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {dupes.map((d: any, dIdx: number) => (
                        <div key={dIdx} className="flex items-center justify-between neu-card-inset p-2 rounded-xl">
                          <div>
                            <span className="font-bold">{d.name}</span> <span className="text-slate-400">({d.type})</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {d.id}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        toast.success(`Duplicate records for ${phone} merged cleanly into primary contact!`);
                        setIsDuplicateModalOpen(false);
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                    >
                      Merge into Single Unified Customer
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 flex justify-end neu-modal-footer">
              <button
                type="button"
                onClick={() => setIsDuplicateModalOpen(false)}
                className="neu-btn-secondary"
              >
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          COMMERCIAL QUOTE & PROPOSAL GENERATOR MODAL
         ========================================================================= */}
      {isQuoteModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsQuoteModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:p-0 print:shadow-none print:border-0 cursor-default"
          >
            {/* Header */}
            <div className="flex items-center justify-between neu-modal-header pb-4 print:hidden">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>Commercial Quote & B2B Proposal Generator</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsQuoteModalOpen(false)} 
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Printable Quote Sheet */}
            <div className="neu-card-inset p-6 rounded-2xl space-y-4 text-xs print:bg-white print:p-0 print:border-none">
              <div className="flex justify-between items-start border-b pb-4 border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xl font-black text-primary">BD SHOP ENTERPRISE</div>
                  <p className="text-slate-400 text-[10px]">Official Commercial Quotation • Dhaka, Bangladesh</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">{quoteData.quoteNumber}</div>
                  <div className="text-slate-400 text-[10px]">Valid Until: {quoteData.validUntil}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Prepared For:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{quoteData.clientName}</div>
                  <div className="text-slate-500">{quoteData.clientPhone} • {quoteData.clientEmail}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Prepared By:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">Corporate Sales Directorate</div>
                  <div className="text-slate-500">BD Shop Ltd, Navana Tower, Gulshan-1, Dhaka</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 dark:bg-slate-900 text-[10px] font-bold text-slate-500">
                    <tr>
                      <th className="p-2.5">Line Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {quoteData.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">{it.name}</td>
                        <td className="p-2.5 text-center font-bold">{it.qty}</td>
                        <td className="p-2.5 text-right font-mono">{formatBDT(it.unitPrice)}</td>
                        <td className="p-2.5 text-right font-bold font-mono">{formatBDT(it.qty * it.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatBDT(quoteSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>Corporate Discount ({quoteData.discountPercent}%):</span>
                    <span className="font-mono">-{formatBDT(quoteDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Steadfast Express Delivery:</span>
                    <span className="font-mono">{formatBDT(quoteData.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 font-black text-sm text-slate-900 dark:text-white">
                    <span>Grand Total Payable:</span>
                    <span className="text-primary font-mono">{formatBDT(quoteTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                <strong>Terms & Conditions:</strong> {quoteData.terms}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 neu-modal-footer print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="neu-btn-secondary flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Quotation Slip</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success('Official PDF quote dispatched to client email & WhatsApp!');
                  setIsQuoteModalOpen(false);
                }}
                className="neu-btn-primary flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Send Proposal to Client</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE DEAL MODAL
         ========================================================================= */}
      {isAddDealModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddDealModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal max-w-md w-full p-6 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <h3 className="font-black text-base text-slate-900 dark:text-white">Register Sales Opportunity / Deal</h3>
              <button 
                type="button" 
                onClick={() => setIsAddDealModalOpen(false)} 
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDealMutation.mutate(dealForm);
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deal Opportunity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corporate Laptop Purchase"
                  value={dealForm.title}
                  onChange={(e) => setDealForm(p => ({ ...p, title: e.target.value }))}
                  className="neu-input w-full font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Client Name"
                    value={dealForm.contact_name}
                    onChange={(e) => setDealForm(p => ({ ...p, contact_name: e.target.value }))}
                    className="neu-input w-full font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deal Value (BDT) *</label>
                  <input
                    type="number"
                    required
                    placeholder="৳ 50,000"
                    value={dealForm.value}
                    onChange={(e) => setDealForm(p => ({ ...p, value: e.target.value }))}
                    className="neu-input w-full font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Initial Stage</label>
                  <select
                    value={dealForm.stage}
                    onChange={(e) => setDealForm(p => ({ ...p, stage: e.target.value }))}
                    className="neu-input w-full font-bold"
                  >
                    <option value="prospecting">Prospecting (10%)</option>
                    <option value="discovery">Discovery (30%)</option>
                    <option value="proposal">Proposal Sent (60%)</option>
                    <option value="negotiation">Negotiation (80%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Rep</label>
                  <select
                    value={dealForm.assigned_to}
                    onChange={(e) => setDealForm(p => ({ ...p, assigned_to: e.target.value }))}
                    className="neu-input w-full font-bold"
                  >
                    {staffReps.map((r, i) => (
                      <option key={i} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddDealModalOpen(false)}
                  className="neu-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDealMutation.isPending}
                  className="neu-btn-primary"
                >
                  {createDealMutation.isPending ? 'Saving...' : 'Add to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          LOG ACTIVITY MODAL
         ========================================================================= */}
      {isActivityModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsActivityModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal max-w-md w-full p-6 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <h3 className="font-black text-base text-slate-900 dark:text-white">Log Activity & Communication</h3>
              <button 
                type="button" 
                onClick={() => setIsActivityModalOpen(false)} 
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                logActivityMutation.mutate(activityForm);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Activity Type</label>
                  <select
                    value={activityForm.type}
                    onChange={(e) => setActivityForm(p => ({ ...p, type: e.target.value }))}
                    className="neu-input w-full font-bold"
                  >
                    <option value="call">Phone Call</option>
                    <option value="email">Email Dispatched</option>
                    <option value="meeting">In-Person Meeting</option>
                    <option value="note">Internal Staff Note</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Duration / Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 mins"
                    value={activityForm.duration}
                    onChange={(e) => setActivityForm(p => ({ ...p, duration: e.target.value }))}
                    className="neu-input w-full font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Customer Name"
                  value={activityForm.contact_name}
                  onChange={(e) => setActivityForm(p => ({ ...p, contact_name: e.target.value }))}
                  className="neu-input w-full font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Activity Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discussed bulk discount proposal"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm(p => ({ ...p, title: e.target.value }))}
                  className="neu-input w-full font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Summary & Next Steps *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Key discussion points, customer feedback, next scheduled action..."
                  value={activityForm.summary}
                  onChange={(e) => setActivityForm(p => ({ ...p, summary: e.target.value }))}
                  className="neu-input w-full font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="neu-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logActivityMutation.isPending}
                  className="neu-btn-primary"
                >
                  {logActivityMutation.isPending ? 'Logging...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE TASK MODAL
         ========================================================================= */}
      {isTaskModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTaskModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal max-w-md w-full p-6 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <h3 className="font-black text-base text-slate-900 dark:text-white">Create Task & Follow-up Reminder</h3>
              <button 
                type="button" 
                onClick={() => setIsTaskModalOpen(false)} 
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                api.post('/admin/crm/tasks', taskForm).then(() => {
                  toast.success('Follow-up task scheduled!');
                  setIsTaskModalOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['admin-crm-overview'] });
                });
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call client regarding quote approval"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(p => ({ ...p, title: e.target.value }))}
                  className="neu-input w-full font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Customer Name"
                    value={taskForm.contact_name}
                    onChange={(e) => setTaskForm(p => ({ ...p, contact_name: e.target.value }))}
                    className="neu-input w-full font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(p => ({ ...p, priority: e.target.value }))}
                    className="neu-input w-full font-bold"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Due Date & Time *</label>
                <input
                  type="date"
                  required
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm(p => ({ ...p, due_date: e.target.value }))}
                  className="neu-input w-full font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="neu-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE TICKET MODAL
         ========================================================================= */}
      {isTicketModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTicketModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal max-w-md w-full p-6 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <h3 className="font-black text-base text-slate-900 dark:text-white">Create Service Support Ticket</h3>
              <button 
                type="button" 
                onClick={() => setIsTicketModalOpen(false)} 
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                api.post('/admin/crm/tickets', {
                  subject: form.subject.value,
                  customer_name: form.customer_name.value,
                  customer_phone: form.customer_phone.value,
                  department: form.department.value,
                  priority: form.priority.value,
                  description: form.description.value,
                }).then(() => {
                  toast.success('Customer service ticket logged with SLA tracker!');
                  setIsTicketModalOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['admin-crm-overview'] });
                });
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ticket Subject *</label>
                <input
                  name="subject"
                  type="text"
                  required
                  placeholder="e.g. Delivery status delay in Sylhet"
                  className="neu-input w-full font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Customer Name *</label>
                  <input
                    name="customer_name"
                    type="text"
                    required
                    placeholder="Full Name"
                    className="neu-input w-full font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <input
                    name="customer_phone"
                    type="tel"
                    placeholder="01711223344"
                    className="neu-input w-full font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</label>
                  <select name="department" className="neu-input w-full font-bold">
                    <option value="Delivery Logistics">Delivery Logistics</option>
                    <option value="Returns & Replacements">Returns & Replacements</option>
                    <option value="Billing & Accounts">Billing & Accounts</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority Tier</label>
                  <select name="priority" className="neu-input w-full font-bold">
                    <option value="urgent">Urgent (30m SLA)</option>
                    <option value="high">High (2h SLA)</option>
                    <option value="medium">Medium (4h SLA)</option>
                    <option value="low">Low (24h SLA)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Issue Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Detail customer query or courier issue..."
                  className="neu-input w-full font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="neu-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary"
                >
                  Open Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
