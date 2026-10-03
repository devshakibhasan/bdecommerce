'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  BarChart3, TrendingUp, DollarSign, Package, Calendar, PieChart as PieChartIcon, 
  CreditCard, MonitorSmartphone, MapPinned, Search 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatBDT } from '@/utils/currency';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#64748b', '#14b8a6'];
const PAYMENT_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981'];
const SOURCE_COLORS = ['#8b5cf6', '#14b8a6', '#f43f5e', '#eab308'];

export default function OrderReportPage() {
  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Fetch up to 500 recent orders matching the filters
  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['admin-orders-analytics', search, statusFilter, paymentFilter, sourceFilter],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('per_page', '500'); // large limit for analytics
      if (statusFilter) queryParams.append('status', statusFilter);
      if (paymentFilter) queryParams.append('payment_status', paymentFilter);
      if (sourceFilter) queryParams.append('source', sourceFilter);
      if (search.trim()) queryParams.append('search', search.trim());
      
      const res: any = await api.get(`/admin/orders?${queryParams.toString()}`);
      return res?.data?.data || res?.data || [];
    }
  });

  const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.data || []);

  // --- Process Data for KPIs & Charts ---
  const { 
    kpiStats,
    timelineData, 
    statusData, 
    topDistrictsData, 
    paymentData, 
    sourceData, 
    topProductsData 
  } = useMemo(() => {
    if (!orders || orders.length === 0) {
      return { 
        kpiStats: { totalRevenue: 0, totalOrders: 0, aov: 0, pendingAction: 0 },
        timelineData: [], statusData: [], topDistrictsData: [], paymentData: [], sourceData: [], topProductsData: [] 
      };
    }

    let totalRevenue = 0;
    let pendingAction = 0;

    const timelineMap: Record<string, { date: string; revenue: number; orders: number }> = {};
    const statusMap: Record<string, number> = {};
    const districtMap: Record<string, number> = {};
    const paymentMap: Record<string, number> = {};
    const sourceMap: Record<string, number> = {};
    const productMap: Record<string, number> = {};

    orders.forEach((order: any) => {
      // KPIs
      totalRevenue += Number(order.total_payable || 0);
      if (order.fulfillment_status === 'pending') pendingAction++;

      // Timeline
      const dateStr = new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (!timelineMap[dateStr]) {
        timelineMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
      }
      timelineMap[dateStr].orders += 1;
      timelineMap[dateStr].revenue += Number(order.total_payable || 0);

      // Status
      const status = order.fulfillment_status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;

      // Payment
      const payment = order.payment_status || 'Unknown';
      paymentMap[payment] = (paymentMap[payment] || 0) + 1;

      // Source
      const source = order.source || 'web';
      sourceMap[source] = (sourceMap[source] || 0) + 1;

      // District
      let district = 'Unknown';
      if (order.shipping_address) {
        const parts = order.shipping_address.split(',');
        if (parts.length > 0) {
          district = parts[parts.length - 1].trim();
        }
      }
      if (district.toLowerCase() === 'dhaka') district = 'Dhaka'; // Normalize
      districtMap[district] = (districtMap[district] || 0) + 1;

      // Top Products
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const name = item.product?.name_en || 'Unknown Product';
          productMap[name] = (productMap[name] || 0) + Number(item.quantity || 1);
        });
      }
    });

    const kpiStats = {
      totalRevenue,
      totalOrders: orders.length,
      aov: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
      pendingAction
    };

    const timeline = Object.values(timelineMap).reverse();
    const statusFormatted = Object.entries(statusMap).map(([name, value]) => ({ name: name.toUpperCase().replace('_', ' '), value }));
    const paymentFormatted = Object.entries(paymentMap).map(([name, value]) => ({ name: name.toUpperCase(), value }));
    const sourceFormatted = Object.entries(sourceMap).map(([name, value]) => ({ name: name.toUpperCase(), value }));
    
    const districtsFormatted = Object.entries(districtMap)
      .map(([name, count]) => ({ name, orders: count as number }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    const productsFormatted = Object.entries(productMap)
      .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, units: count as number }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    return { 
      kpiStats,
      timelineData: timeline, 
      statusData: statusFormatted, 
      topDistrictsData: districtsFormatted,
      paymentData: paymentFormatted,
      sourceData: sourceFormatted,
      topProductsData: productsFormatted
    };
  }, [orders]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-border p-3 rounded-xl shadow-xl z-50">
          <p className="font-bold text-sm mb-2">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-semibold" style={{ color: p.color || p.fill }}>
              <span>{p.name}:</span>
              <span>{p.name === 'Revenue' ? formatBDT(p.value) : p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <div className="clay-card p-6 rounded-3xl flex items-center gap-4 border-2 border-indigo-500/10 bg-indigo-50/5">
        <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-indigo-600 font-black">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Order Analytics & Reports</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Deep dive into your sales performance, order statuses, and regional trends.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="clay-card p-4 rounded-3xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by order #, phone, customer, tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 neu-input rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="neu-input px-3 py-2.5 rounded-2xl text-xs font-bold text-foreground cursor-pointer focus:outline-none"
        >
          <option value="">All Fulfillment Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="handed_to_courier">Handed to Courier</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="returned">Returned</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="neu-input px-3 py-2.5 rounded-2xl text-xs font-bold text-foreground cursor-pointer focus:outline-none"
        >
          <option value="">All Payment Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="neu-input px-3 py-2.5 rounded-2xl text-xs font-bold text-foreground cursor-pointer focus:outline-none"
        >
          <option value="">All Traffic Sources</option>
          <option value="web">Web Storefront</option>
          <option value="app">Mobile App</option>
          <option value="pos">POS / Manual</option>
        </select>
        
        {(search || statusFilter || paymentFilter || sourceFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setPaymentFilter(''); setSourceFilter(''); }}
            className="px-3 py-2 neu-btn rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* KPI CARDS (Dynamic based on filters) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="clay-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 neu-inset rounded-full flex items-center justify-center text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-bold text-muted-foreground">Total Revenue</p>
          <h2 className="text-3xl font-black text-foreground mt-1 tracking-tight">
            {formatBDT(kpiStats.totalRevenue)}
          </h2>
        </div>
        
        <div className="clay-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 neu-inset rounded-full flex items-center justify-center text-blue-500">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-bold text-muted-foreground">Total Orders</p>
          <h2 className="text-3xl font-black text-foreground mt-1 tracking-tight">
            {kpiStats.totalOrders}
          </h2>
        </div>

        <div className="clay-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 neu-inset rounded-full flex items-center justify-center text-amber-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-bold text-muted-foreground">Average Order Value</p>
          <h2 className="text-3xl font-black text-foreground mt-1 tracking-tight">
            {formatBDT(kpiStats.aov)}
          </h2>
        </div>

        <div className="clay-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 neu-inset rounded-full flex items-center justify-center text-rose-500">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-bold text-muted-foreground">Pending Action</p>
          <h2 className="text-3xl font-black text-foreground mt-1 tracking-tight">
            {kpiStats.pendingAction}
          </h2>
        </div>
      </div>

      {isOrdersLoading ? (
        <div className="p-12 text-center text-muted-foreground font-bold animate-pulse">Compiling Analytics...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground font-bold">No orders match the selected filters.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="clay-card p-6 rounded-3xl lg:col-span-2 xl:col-span-3 flex flex-col h-[400px]">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-primary" /> Revenue & Order Volume Timeline
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} tickFormatter={(value) => '৳' + value} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="clay-card p-6 rounded-3xl flex flex-col h-[350px]">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-2">
              <PieChartIcon className="w-4 h-4 text-blue-500" /> Order Status Distribution
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {statusData.map((entry, index) => <Cell key={'cell-' + index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="clay-card p-6 rounded-3xl flex flex-col h-[350px]">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-amber-500" /> Payment Status
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value" stroke="none">
                    {paymentData.map((entry, index) => <Cell key={'cell-' + index} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="clay-card p-6 rounded-3xl flex flex-col h-[350px]">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-2">
              <MonitorSmartphone className="w-4 h-4 text-rose-500" /> Sales Source
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {sourceData.map((entry, index) => <Cell key={'cell-' + index} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="clay-card p-6 rounded-3xl flex flex-col h-[350px] lg:col-span-1 xl:col-span-2">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-6">
              <Package className="w-4 h-4 text-primary" /> Top Selling Products
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} width={120} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="units" name="Units Sold" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="clay-card p-6 rounded-3xl flex flex-col h-[350px] lg:col-span-1 xl:col-span-1">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-6">
              <MapPinned className="w-4 h-4 text-amber-500" /> Top Delivery Regions
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDistrictsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="orders" name="Orders" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}