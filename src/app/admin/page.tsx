'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatBDT } from '@/utils/currency';
import { formatDistanceToNow } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  DollarSign, ShoppingBag, Package, Users, Eye, TrendingUp,
  AlertTriangle, Star, Plus, ShoppingCart, BarChart3, Grid3X3,
  Palette, Settings, ArrowRight, Box, Truck, CheckCircle, Ban,
  RefreshCw, Sparkles, Loader2
} from 'lucide-react';
import Link from 'next/link';

const formatK = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return value.toString();
};

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
  'bg-teal-500', 'bg-orange-500',
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const statusBadge = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (['delivered', 'completed'].some(x => s.includes(x)))
    return { label: 'delivered', cls: 'bg-emerald-100 text-emerald-700' };
  if (['shipped', 'courier', 'processing', 'confirmed', 'packing'].some(x => s.includes(x)))
    return { label: 'order shipped', cls: 'bg-blue-100 text-blue-700' };
  if (['cancelled', 'canceled'].some(x => s.includes(x)))
    return { label: 'cancelled', cls: 'bg-red-100 text-red-700' };
  if (['on-hold', 'on_hold'].some(x => s.includes(x)))
    return { label: 'on hold', cls: 'bg-orange-100 text-orange-700' };
  if (['returned'].some(x => s.includes(x)))
    return { label: 'returned', cls: 'bg-pink-100 text-pink-700' };
  return { label: 'order placed', cls: 'bg-amber-100 text-amber-700' };
};

export default function AdminDashboard() {
  // Existing dashboard data (statuses, stock_value, ads/product reports)
  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ['admin-dashboard-reports'],
    queryFn: async () => {
      const res: any = await api.get('/admin/dashboard');
      return res;
    },
    staleTime: 60 * 1000,
  });

  // New summary data
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: async () => {
      const res: any = await api.get('/admin/dashboard/summary');
      return res;
    },
    staleTime: 60 * 1000,
  });

  const isLoading = loadingDash || loadingSummary;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-card border rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-card border rounded-xl" />
          <div className="h-80 bg-card border rounded-xl" />
        </div>
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading Dashboard...
        </div>
      </div>
    );
  }

  const s = summary || {};
  const statCards = [
    {
      label: 'Revenue Today',
      value: formatBDT(s.revenue_today || 0),
      subtitle: `${formatBDT(s.revenue_this_month || 0)} this month`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Orders Today',
      value: s.orders_today ?? 0,
      subtitle: `${s.orders_this_month ?? 0} this month`,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Products',
      value: s.active_products ?? 0,
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Total Customers',
      value: s.total_customers ?? 0,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Website Visits',
      value: s.website_visits ? Number(s.website_visits).toLocaleString() : '0',
      icon: Eye,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
    },
  ];

  const quickActions = [
    { label: 'Add Product', href: '/admin/products/create', icon: Plus, bg: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
    { label: 'New Order', href: '/admin/orders', icon: ShoppingCart, bg: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, bg: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
    { label: 'Categories', href: '/admin/categories', icon: Grid3X3, bg: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
    { label: 'Themes', href: '/admin/themes', icon: Palette, bg: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
    { label: 'Settings', href: '/admin/settings', icon: Settings, bg: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
  ];

  const revenueChart = s.revenue_chart || [];
  const ordersByStatus = s.orders_by_status || [];
  const recentOrders = s.recent_orders || [];
  const lowStock = s.low_stock_products || [];
  const topSelling = s.top_selling_products || [];
  const totalOrdersCount = s.total_orders_count ?? 0;

  // Existing dashboard data
  const statusIcons: Record<string, any> = {
    'Pending Order': ShoppingCart, 'Packing Order': Box, 'Confirm Order': CheckCircle,
    'Courier Order': Truck, 'On-Hold Order': Package, 'Exchange Order': RefreshCw,
    'Partials Order': Package, 'Delivered Order': CheckCircle, 'Pending Return': RefreshCw,
    'Return Received': CheckCircle, 'Cancel Order': Ban, 'All Order': ShoppingCart,
  };
  const statusColors: Record<string, string> = {
    'Pending Order': 'bg-amber-100 text-amber-700', 'Packing Order': 'bg-blue-100 text-blue-700',
    'Confirm Order': 'bg-indigo-100 text-indigo-700', 'Courier Order': 'bg-purple-100 text-purple-700',
    'On-Hold Order': 'bg-orange-100 text-orange-700', 'Exchange Order': 'bg-teal-100 text-teal-700',
    'Partials Order': 'bg-pink-100 text-pink-700', 'Delivered Order': 'bg-emerald-100 text-emerald-700',
    'Pending Return': 'bg-yellow-100 text-yellow-700', 'Return Received': 'bg-green-100 text-green-700',
    'Cancel Order': 'bg-red-100 text-red-700', 'All Order': 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-6 pb-16">

      {/* ───── 1. Greeting Banner ───── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/50 p-6 md:p-8">
        <div className="absolute right-4 top-4 text-4xl opacity-30 select-none">💪</div>
        <h1 className="text-2xl md:text-3xl font-black text-emerald-900 tracking-tight">
          {s.greeting || 'Good morning'}, {s.admin_name || 'Shakib'}! 👋
        </h1>
        <p className="text-sm text-emerald-700/70 mt-1 font-medium">
          Every great journey starts with a single step!
        </p>
      </div>

      {/* ───── 2. Stat Cards ───── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground">{card.value}</p>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* ───── 3. Revenue Chart + Orders by Status ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Overview */}
        <div className="lg:col-span-2 bg-card border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-lg font-bold text-foreground">Revenue Overview</h2>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex gap-6 mt-3 mb-4 text-sm">
            <div>
              <span className="text-muted-foreground">Avg. daily</span>
              <span className="ml-1 font-bold text-foreground">{formatK(s.avg_daily_revenue || 0)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Peak day</span>
              <span className="ml-1 font-bold text-foreground">{s.peak_day || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total items sold</span>
              <span className="ml-1 font-bold text-foreground">{s.total_items_sold ?? 0}</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatK} />
                <Tooltip
                  formatter={(v: any) => [formatBDT(v), 'Revenue']}
                  labelStyle={{ fontWeight: 'bold' }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-card border rounded-xl shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-foreground mb-1">Orders by Status</h2>
          <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {ordersByStatus.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any, name: string) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No orders yet</p>
            )}
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-10px' }}>
              <div className="text-center">
                <p className="text-2xl font-black text-foreground">{totalOrdersCount}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Orders</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {ordersByStatus.map((s: any) => (
              <div key={s.status} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground truncate">{s.label}</span>
                <span className="ml-auto font-bold text-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ───── 4. Recent Orders + Low Stock & Top Selling ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.length > 0 ? recentOrders.map((order: any) => {
                  const badge = statusBadge(order.fulfillment_status);
                  return (
                    <tr key={order.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(order.customer_name || '')}`}>
                            {getInitials(order.customer_name || '')}
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[160px]">{order.customer_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{order.payment_method}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">{formatBDT(order.total_payable)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                        {(() => {
                          try { return formatDistanceToNow(new Date(order.created_at), { addSuffix: true }); }
                          catch { return order.created_at; }
                        })()}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No recent orders</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Low Stock + Top Selling */}
        <div className="space-y-6">

          {/* Low Stock */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-foreground">Low Stock</h2>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
                <tr>
                  <th className="px-4 py-2 w-8">#</th>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lowStock.length > 0 ? lowStock.map((p: any, i: number) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-[180px]">{p.name}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${p.stock < 50 ? 'text-red-600' : 'text-foreground'}`}>
                      {p.stock}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No low stock items</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Top Selling */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-foreground">Top Selling</h2>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
                <tr>
                  <th className="px-4 py-2 w-8">#</th>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2 text-right">Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topSelling.length > 0 ? topSelling.map((p: any, i: number) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-[180px]">{p.name}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{p.sold}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No sales data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ───── 5. Quick Actions ───── */}
      <div className="bg-card border rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl font-semibold text-sm transition-colors ${action.bg}`}
            >
              <action.icon className="w-5 h-5" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ───── 6. Advanced Reports (existing data) ───── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-black text-foreground">Advanced Reports</h2>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {dashboard?.statuses && Object.entries(dashboard.statuses).map(([status, count]: [string, any]) => {
            const Icon = statusIcons[status] || Package;
            const colorClass = statusColors[status] || 'bg-slate-100 text-slate-700';
            return (
              <div key={status} className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-primary transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{status}</span>
                  <div className={`p-1.5 rounded-lg ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Stock Value Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-900/60 uppercase tracking-wider">Total Stock Value</h3>
              <p className="text-3xl font-bold text-emerald-700">৳ {Number(dashboard?.stock_value || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Ads Source Report Table */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h2 className="font-bold text-lg">Ads Source Report</h2>
            <a href="#" className="text-sm text-primary hover:underline">(View Full Report)</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-center">Total Order</th>
                  <th className="px-4 py-3 text-center text-red-600">Cancel Order</th>
                  <th className="px-4 py-3 text-center text-orange-600">Return Order</th>
                  <th className="px-4 py-3 text-center text-emerald-600">Return Received</th>
                  <th className="px-4 py-3 text-right text-red-600">Fail Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dashboard?.ads_source_report?.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{row.source}</td>
                    <td className="px-4 py-3 text-center font-bold">{row.total_order}</td>
                    <td className="px-4 py-3 text-center">{row.cancel_order}</td>
                    <td className="px-4 py-3 text-center">{row.return_order}</td>
                    <td className="px-4 py-3 text-center">{row.return_received}</td>
                    <td className="px-4 py-3 text-right font-bold">{row.fail_rate}%</td>
                  </tr>
                ))}
                {(!dashboard?.ads_source_report || dashboard.ads_source_report.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No traffic source data available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Report Table */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h2 className="font-bold text-lg">Product Report</h2>
            <a href="#" className="text-sm text-primary hover:underline">(View Full Report)</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 border-b text-muted-foreground whitespace-nowrap">
                <tr>
                  <th className="px-4 py-3 w-8">#</th>
                  <th className="px-4 py-3 min-w-[300px]">Product Name</th>
                  <th className="px-4 py-3 text-center">Purchase (In)</th>
                  <th className="px-4 py-3 text-center">Orders (Out)</th>
                  <th className="px-4 py-3 text-center">Available Qty</th>
                  <th className="px-4 py-3 text-center text-orange-600">Pending Return</th>
                  <th className="px-4 py-3 text-center text-blue-600">Delivered + Partials</th>
                  <th className="px-4 py-3 text-center text-emerald-600">Return Received + Partials</th>
                  <th className="px-4 py-3 text-right font-semibold">Sale - RTN - Partials = Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dashboard?.product_report?.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/30 whitespace-nowrap">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-wrap">{row.name}</td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-600">{row.purchase_in}</td>
                    <td className="px-4 py-3 text-center font-semibold text-blue-600">{row.orders_out}</td>
                    <td className="px-4 py-3 text-center font-bold">{row.available_qty}</td>
                    <td className="px-4 py-3 text-center">{row.pending_return}</td>
                    <td className="px-4 py-3 text-center">{row.delivered_partials}</td>
                    <td className="px-4 py-3 text-center">{row.return_received_partials}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-700 bg-slate-50/50">{row.amount_calculation}</td>
                  </tr>
                ))}
                {(!dashboard?.product_report || dashboard.product_report.length === 0) && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No product data available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
