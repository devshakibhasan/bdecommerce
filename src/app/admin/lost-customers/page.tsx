'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  UserX, Search, Phone, Mail, MapPin, 
  ShoppingCart, RefreshCw, Calendar, Clock,
  ExternalLink, MessageCircle, CheckCircle2, 
  AlertCircle, ChevronRight, X, Trash2, Tag, 
  DollarSign, ArrowUpRight, Check, FileText, Copy
} from 'lucide-react';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface LeadItem {
  product_name: string;
  product_slug?: string;
  image?: string;
  color?: string | null;
  size?: string | null;
  variant_name?: string | null;
  sku?: string | null;
  unit_price: number;
  quantity: number;
  total: number;
}

interface LostCustomerLead {
  id: number;
  session_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  shipping_address: string | null;
  district: string | null;
  thana: string | null;
  items: LeadItem[] | null;
  cart_total: number;
  delivery_fee: number;
  total_payable: number;
  source: string;
  source_url: string | null;
  status: 'abandoned' | 'contacted' | 'call_scheduled' | 'not_interested' | 'converted';
  notes: string | null;
  order_id: number | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: number;
    order_number: string;
    total_payable: number;
  } | null;
}

export default function LostCustomersAdminPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [selectedLead, setSelectedLead] = useState<LostCustomerLead | null>(null);
  const [notesModalLead, setNotesModalLead] = useState<LostCustomerLead | null>(null);
  const [noteContent, setNoteContent] = useState('');

  // Fetch leads and statistics
  const { data: responseData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-lost-customers', searchQuery, statusFilter, page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      } else {
        params.append('status', 'all');
      }
      params.append('page', String(page));
      params.append('per_page', String(perPage));

      const res: any = await api.get(`/admin/lost-customers?${params.toString()}`);
      return res;
    },
    refetchInterval: 10000,
  });

  const leads: LostCustomerLead[] = Array.isArray(responseData?.data)
    ? responseData.data
    : (Array.isArray(responseData) ? responseData : []);
  const meta = responseData?.meta || {};
  const stats = responseData?.stats || {
    total_leads: 0,
    abandoned_leads: 0,
    contacted_leads: 0,
    call_scheduled_leads: 0,
    converted_leads: 0,
    not_interested_leads: 0,
    abandoned_value: 0,
    converted_value: 0,
  };

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status?: string; notes?: string }) => {
      return api.put(`/admin/lost-customers/${id}`, { status, notes });
    },
    onSuccess: () => {
      toast.success('Lead updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-lost-customers'] });
      if (notesModalLead) setNotesModalLead(null);
    },
    onError: () => {
      toast.error('Failed to update lead');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/admin/lost-customers/${id}`);
    },
    onSuccess: () => {
      toast.success('Lead removed');
      queryClient.invalidateQueries({ queryKey: ['admin-lost-customers'] });
      if (selectedLead) setSelectedLead(null);
    },
    onError: () => {
      toast.error('Failed to delete lead');
    },
  });

  // Format Bangladesh phone for WhatsApp URL
  const getWhatsAppUrl = (phone: string | null, name: string | null, items?: LeadItem[] | null) => {
    if (!phone) return '#';
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '88' + clean;
    else if (!clean.startsWith('880')) clean = '880' + clean;

    const firstProduct = items && items.length > 0 ? items[0].product_name : 'আপনার পছন্দের পণ্য';
    const greeting = `আসসালামু আলাইকুম ${name || 'গ্রাহক'}, আমাদের শপ থেকে দেখছি আপনি "${firstProduct}" অর্ডার করতে চেয়েছিলেন কিন্তু কোনো কারণে সম্পন্ন হয়নি। আমরা কি অর্ডারটি কনফার্ম করতে আপনাকে সাহায্য করতে পারি? ধন্যবাদ!`;

    return `https://wa.me/${clean}?text=${encodeURIComponent(greeting)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Abandoned Checkout
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Contacted
          </span>
        );
      case 'call_scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Call Scheduled
          </span>
        );
      case 'converted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/20 dark:bg-primary/10/60 text-primary dark:text-primary border border-primary/30 dark:border-primary/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Recovered / Ordered
          </span>
        );
      case 'not_interested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Not Interested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Lost Customers & Abandoned Leads
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time captured checkout drops. Follow up immediately via Call or WhatsApp to recover sales.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Leads
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Captured Leads
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.total_leads}
            </span>
            <span className="text-xs text-slate-500">all time</span>
          </div>
        </div>

        {/* Abandoned Revenue at Risk */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Revenue at Risk
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatBDT(stats.abandoned_value)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({stats.abandoned_leads} leads)
            </span>
          </div>
        </div>

        {/* Converted / Recovered */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary dark:text-primary uppercase tracking-wider">
              Recovered Sales
            </span>
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/10/50 text-primary dark:text-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary dark:text-primary">
              {formatBDT(stats.converted_value)}
            </span>
            <span className="text-xs text-primary dark:text-primary font-medium">
              ({stats.converted_leads} orders)
            </span>
          </div>
        </div>

        {/* Contacted Leads */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Contacted Leads
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {stats.contacted_leads}
            </span>
            <span className="text-xs text-slate-500">follow-ups active</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by phone, customer name, address, district..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
            {[
              { id: 'all', label: 'All Leads', count: stats.total_leads },
              { id: 'abandoned', label: 'Abandoned', count: stats.abandoned_leads },
              { id: 'contacted', label: 'Contacted', count: stats.contacted_leads },
              { id: 'call_scheduled', label: 'Call Scheduled', count: (stats as any).call_scheduled_leads },
              { id: 'converted', label: 'Converted', count: stats.converted_leads },
              { id: 'not_interested', label: 'Not Interested', count: (stats as any).not_interested_leads },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === tab.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Leads List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Loading lost customer records...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <UserX className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No lost customers found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or status filter.'
                : 'Whenever a visitor types their phone number or info on checkout without placing the order, they will appear here automatically!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
            {leads.map((lead) => {
              const itemsList: LeadItem[] = Array.isArray(lead.items) ? lead.items : [];
              const hasPhone = !!lead.customer_phone;

              return (
                <div 
                  key={lead.id}
                  className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Customer Info - Phone Number is MAIN / IMPORTANT */}
                    <div className="space-y-2.5 flex-1">
                      {/* Primary Header: Phone Number (Main / Important) */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        {lead.customer_phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-2 text-base sm:text-lg font-black font-mono tracking-tight text-primary dark:text-primary/40 bg-primary/10 dark:bg-primary/10/70 px-3 py-1 rounded-xl border border-primary/30 dark:border-primary/80 shadow-xs">
                              <Phone className="w-4 h-4 text-primary dark:text-primary" />
                              {lead.customer_phone}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(lead.customer_phone || '');
                                toast.success('Phone copied!');
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                              title="Copy Phone"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-slate-400 italic">
                            No phone number entered
                          </span>
                        )}

                        {getStatusBadge(lead.status)}

                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeAgo(lead.last_activity_at || lead.created_at)}
                        </span>

                        {lead.source && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            Source: {lead.source}
                          </span>
                        )}
                      </div>

                      {/* Optional Info: Name, Email, Address */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Name:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {lead.customer_name || <span className="text-slate-400 font-normal italic">(Not provided)</span>}
                          </span>
                        </div>

                        {lead.customer_email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate">{lead.customer_email}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">
                            <span className="text-slate-400 font-medium mr-1">Address:</span>
                            {[lead.shipping_address, lead.thana, lead.district].filter(Boolean).join(', ') || (
                              <span className="text-slate-400 font-normal italic">(Not provided)</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Internal Staff Notes */}
                      {lead.notes && (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                          <span className="font-bold">Follow-up Note: </span>
                          {lead.notes}
                        </div>
                      )}
                    </div>

                    {/* Right: Quick Recovery Actions */}
                    <div className="flex flex-wrap items-center gap-2 lg:self-start shrink-0">
                      {hasPhone && (
                        <>
                          <a
                            href={`tel:${lead.customer_phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Direct Call
                          </a>

                          <a
                            href={getWhatsAppUrl(lead.customer_phone, lead.customer_name, itemsList)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#25D366] text-white hover:bg-[#1ebd59] transition-colors shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp Recovery
                          </a>
                        </>
                      )}

                      {/* Status select dropdown */}
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatusMutation.mutate({ id: lead.id, status: e.target.value })}
                        disabled={updateStatusMutation.isPending}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-primary"
                      >
                        <option value="abandoned">Abandoned</option>
                        <option value="contacted">Contacted</option>
                        <option value="call_scheduled">Call Scheduled</option>
                        <option value="not_interested">Not Interested</option>
                        <option value="converted">Recovered / Converted</option>
                      </select>

                      {/* Notes Button */}
                      <button
                        onClick={() => {
                          setNotesModalLead(lead);
                          setNoteContent(lead.notes || '');
                        }}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Add/Edit Staff Follow-up Note"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this lead?')) {
                            deleteMutation.mutate(lead.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Selected Products Order Items Matrix */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                        Selected Products ({itemsList.length})
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">
                          Payable Total:
                        </span>
                        <span className="text-sm font-black text-primary dark:text-primary">
                          {formatBDT(lead.total_payable || lead.cart_total)}
                        </span>
                      </div>
                    </div>

                    {/* Products Grid */}
                    {itemsList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No products recorded in cart session.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {itemsList.map((item, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60"
                          >
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80'}
                              alt={item.product_name}
                              className="w-12 h-12 rounded-lg object-cover bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {item.product_name}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {item.color && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                                    {item.color}
                                  </span>
                                )}
                                {item.size && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                                    {item.size}
                                  </span>
                                )}
                                {item.sku && (
                                  <span className="text-[10px] text-slate-400">
                                    {item.sku}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-1 text-[11px]">
                                <span className="text-slate-500">
                                  {item.quantity} × {formatBDT(item.unit_price)}
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {formatBDT(item.total || (item.unit_price * item.quantity))}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Order link if converted */}
                    {lead.order_id && (
                      <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-primary/10 dark:bg-primary/10/30 border border-primary/30/60 dark:border-primary/20/40 text-xs">
                        <span className="text-primary dark:text-primary/40 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          Order placed! Order ID: #{lead.order_id}
                          {lead.order?.order_number ? ` (${lead.order.order_number})` : ''}
                        </span>
                        <Link 
                          href="/admin/orders"
                          className="inline-flex items-center gap-1 text-primary dark:text-primary font-bold hover:underline"
                        >
                          View Orders <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination & Results Summary Controls */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Showing <span className="font-bold text-slate-900 dark:text-white">{leads.length}</span> of {meta.total ?? stats.total_leads} leads
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Per page:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          {meta.last_page > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-slate-900 dark:text-white">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Follow-up Notes Modal */}
      {notesModalLead && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setNotesModalLead(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 neu-backdrop cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl neu-modal p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 neu-modal-header">
              <h3 className="text-base font-bold text-foreground">
                Follow-up CRM Notes
              </h3>
              <button
                onClick={() => setNotesModalLead(null)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="neu-card-inset p-3 rounded-2xl text-xs text-muted-foreground mb-3">
                Lead: <span className="font-bold text-foreground">{notesModalLead.customer_name || 'Visitor'}</span> ({notesModalLead.customer_phone || 'No phone'})
              </div>
              <textarea
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="e.g. Called customer at 3pm, requested delivery next Saturday. Will confirm via bKash."
                className="w-full p-3 text-xs rounded-2xl neu-input resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 neu-modal-footer">
              <button
                onClick={() => setNotesModalLead(null)}
                className="neu-btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateStatusMutation.mutate({
                    id: notesModalLead.id,
                    notes: noteContent,
                  });
                }}
                disabled={updateStatusMutation.isPending}
                className="neu-btn-primary px-5 py-2 text-xs font-bold disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
