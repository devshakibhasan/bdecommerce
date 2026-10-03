'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  BarChart3, TrendingUp, Calendar, Download, DollarSign, ShoppingCart, 
  Package, RefreshCw, Plus, Trash2, Edit, X, AlertCircle, CheckCircle2, 
  Flame, Megaphone, Truck, Factory, Layers, ShieldCheck, Tag, Info,
  PieChart, LineChart, Table, SlidersHorizontal, ArrowUpRight, ArrowDownRight,
  Sparkles, Lock, Unlock, FileSpreadsheet, Check, Eye, HelpCircle, Users, Briefcase,
  Save, Search, Filter, Maximize2, Minimize2, Edit3, ArrowRight, UserCheck
} from 'lucide-react';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';

export function ReportsSuite({ isEmbeddedInDashboard = false }: { isEmbeddedInDashboard?: boolean }) {
  const queryClient = useQueryClient();

  // Current month default in YYYY-MM format
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [activeFilterMode, setActiveFilterMode] = useState<'month' | 'range'>('month');
  const [dateRange, setDateRange] = useState('30_days');

  // Main View Navigation: 'overview' | 'charts' | 'lists' | 'month_crud'
  const [activeView, setActiveView] = useState<'overview' | 'charts' | 'lists' | 'month_crud'>('overview');

  // Sub-list tab inside 'lists' view: 'products' | 'months' | 'expenses' | 'daily' | 'categories'
  const [activeListTab, setActiveListTab] = useState<'products' | 'months' | 'expenses' | 'daily' | 'categories'>('products');

  // Search & Filter for tables
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // ====================================================
  // MODALS STATE & EXPANSIVE COST HUB
  // ====================================================

  // 1. Full-Page "Log Monthly Ads, Extra & Making Costs" Hub
  const [isFullCostHubOpen, setIsFullCostHubOpen] = useState(false);
  const [isCostHubMaximized, setIsCostHubMaximized] = useState(false);
  const [costHubTab, setCostHubTab] = useState<'matrix' | 'overhead' | 'single'>('matrix');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixCategory, setMatrixCategory] = useState('all');

  // Draft costs for every product in the catalog (product_id -> { making_cost, base_price, ads_cost, extra_cost, notes, saved })
  const [productCostDrafts, setProductCostDrafts] = useState<Record<number, {
    making_cost: string;
    base_price: string;
    ads_cost: string;
    extra_cost: string;
    notes: string;
    saved?: boolean;
  }>>({});

  // Storewide General Overhead Draft
  const [overheadDraft, setOverheadDraft] = useState({
    general_ads_cost: '',
    general_extra_cost: '',
    general_notes: '',
  });

  // 2. Single Product Direct Cost Edit Modal (Triggered from Product Profit Table)
  const [isSingleProductEditOpen, setIsSingleProductEditOpen] = useState(false);
  const [editingProductData, setEditingProductData] = useState<{
    product_id: number;
    product_name: string;
    category_name: string;
    making_cost: string;
    base_price: string;
    ads_cost: string;
    extra_cost: string;
    notes: string;
  } | null>(null);

  // 3. Quick Edit Month Targets Modal (From Overview)
  const [isQuickTargetModalOpen, setIsQuickTargetModalOpen] = useState(false);
  const [quickTargetForm, setQuickTargetForm] = useState({
    target_revenue: '',
    budget_ads: '',
    budget_extra: '',
    target_net_profit: '',
    title: '',
    status: 'active',
    notes: '',
  });

  // 4. Quick Edit Staff Salaries Modal (From Overview)
  const [isQuickSalaryModalOpen, setIsQuickSalaryModalOpen] = useState(false);
  const [salaryDrafts, setSalaryDrafts] = useState<Record<number, { salary: string; designation: string }>>({});

  // 5. Classic Expense Modal State (Create or Edit single expense)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    product_id: '',
    making_cost: '',
    month: selectedMonth,
    ads_cost: '',
    extra_cost: '',
    notes: '',
  });

  // 6. Month CRUD Modal State (Create or Edit)
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [editingMonthId, setEditingMonthId] = useState<number | null>(null);
  const [monthForm, setMonthForm] = useState({
    month: '',
    title: '',
    target_revenue: '',
    budget_ads: '',
    budget_extra: '',
    target_net_profit: '',
    status: 'active',
    notes: '',
  });

  // Hover state for interactive SVG charts
  const [hoveredDailyIndex, setHoveredDailyIndex] = useState<number | null>(null);

  // ====================================================
  // DATA FETCHING
  // ====================================================

  // 1. Fetch Comprehensive Summary Report
  const { data: reportData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-reports-summary', selectedMonth, activeFilterMode, dateRange],
    queryFn: async () => {
      try {
        const query = activeFilterMode === 'month' 
          ? `month=${selectedMonth}` 
          : `range=${dateRange}`;
        // const res: any = await api.get(`/admin/reports/summary?${query}`);
        const res: any = {}; // TODO: Implement backend
        return res?.data?.data || res?.data || {};
      } catch (err) {
        console.error('Failed to load report summary', err);
        return {};
      }
    }
  });

  // 2. Fetch All Financial Months (Month CRUD Table)
  const { data: financialMonthsData, refetch: refetchMonths } = useQuery({
    queryKey: ['admin-reports-months'],
    queryFn: async () => {
      try {
        // const res: any = await api.get('/admin/reports/months');
        const res: any = { data: [] }; // TODO: Implement backend
        return res?.data?.data || res?.data || [];
      } catch (err) {
        console.error('Failed to load financial months', err);
        return [];
      }
    }
  });

  // ====================================================
  // MUTATIONS (EXPENSE CRUD)
  // ====================================================

  const saveExpenseMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingExpenseId) {
        return await api.put(`/admin/reports/expenses/${editingExpenseId}`, payload);
      }
      return await api.post('/admin/reports/expenses', payload);
    },
    onSuccess: () => {
      toast.success(editingExpenseId ? 'Expense entry updated successfully!' : 'Monthly expense recorded & Net Profit recalculated!');
      setIsExpenseModalOpen(false);
      setEditingExpenseId(null);
      setExpenseForm({
        product_id: '',
        making_cost: '',
        month: selectedMonth,
        ads_cost: '',
        extra_cost: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-months'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save expense');
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/admin/reports/expenses/${id}`);
    },
    onSuccess: () => {
      toast.success('Expense record removed');
      queryClient.invalidateQueries({ queryKey: ['admin-reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-months'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete expense');
    }
  });

  // ====================================================
  // MUTATIONS (MONTH CRUD)
  // ====================================================

  const saveMonthMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingMonthId) {
        return await api.put(`/admin/reports/months/${editingMonthId}`, payload);
      }
      return await api.post('/admin/reports/months', payload);
    },
    onSuccess: () => {
      toast.success(editingMonthId ? 'Financial month updated successfully!' : 'New financial month created successfully!');
      setIsMonthModalOpen(false);
      setEditingMonthId(null);
      setMonthForm({
        month: '',
        title: '',
        target_revenue: '',
        budget_ads: '',
        budget_extra: '',
        target_net_profit: '',
        status: 'active',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-months'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-summary'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save financial month');
    }
  });

  const deleteMonthMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/admin/reports/months/${id}`);
    },
    onSuccess: () => {
      toast.success('Financial month deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-reports-months'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-summary'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete financial month');
    }
  });

  // ====================================================
  // MUTATIONS (PRODUCT COSTS, BULK MATRIX & QUICK CRUD)
  // ====================================================

  const updateProductCostsMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      return await api.put(`/admin/reports/products/${id}/costs`, payload);
    },
    onSuccess: (_, vars) => {
      toast.success('Product making cost & expenses saved!');
      setProductCostDrafts(prev => ({
        ...prev,
        [vars.id]: { ...(prev[vars.id] || { making_cost: '', base_price: '', ads_cost: '', extra_cost: '', notes: '' }), saved: true }
      }));
      setIsSingleProductEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-months'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update product costs');
    }
  });

  const bulkUpdateCostsMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/admin/reports/products/bulk-costs', payload);
    },
    onSuccess: () => {
      toast.success('All catalog making costs, ads, and expenses saved successfully!');
      setIsFullCostHubOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-months'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save product costs');
    }
  });

  const quickUpdateTargetsMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.put('/admin/reports/months/quick-targets', payload);
    },
    onSuccess: () => {
      toast.success('Month targets updated & variance recalculated!');
      setIsQuickTargetModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-months'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update month targets');
    }
  });

  const quickUpdateSalariesMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.put('/admin/reports/staff-salaries', payload);
    },
    onSuccess: () => {
      toast.success('Staff salaries updated! Net profit recalculated.');
      setIsQuickSalaryModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-months'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update staff salaries');
    }
  });

  // ====================================================
  // DATA PREPARATION & DERIVED VALUES
  // ====================================================

  const kpis = reportData?.financial_kpis || {
    gross_revenue: 0,
    total_production_cost: 0,
    total_courier_cost: 0,
    total_ads_cost: 0,
    total_extra_cost: 0,
    total_salary_cost: 0,
    net_profit: 0,
    profit_margin: 0,
    gross_margin: 0,
    total_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
    units_sold: 0,
    average_order_value: 0,
  };

  const costPercentages = reportData?.cost_percentages || {
    production_pct: 0,
    courier_pct: 0,
    ads_pct: 0,
    extra_pct: 0,
    salary_pct: 0,
    net_profit_pct: 0,
  };

  const targetAnalysis = reportData?.target_analysis || {
    target_revenue: 0,
    budget_ads: 0,
    budget_extra: 0,
    target_net_profit: 0,
    revenue_progress_pct: 0,
    profit_progress_pct: 0,
    ads_budget_used_pct: 0,
    revenue_variance: 0,
    profit_variance: 0,
    status: 'active',
  };

  const productProfits: any[] = reportData?.product_profits || [];
  const topProfitable: any[] = reportData?.top_profitable || [];
  const categoryBreakdown: any[] = reportData?.category_breakdown || [];
  const dailySales: any[] = reportData?.daily_sales || [];
  const expensesList: any[] = reportData?.expenses_list || [];
  const catalogProducts: any[] = reportData?.catalog_products || [];
  const availableMonths: string[] = reportData?.available_months || [selectedMonth];
  const allFinancialMonths: any[] = financialMonthsData || [];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productProfits.filter((p: any) => {
      const matchSearch = (p.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.category_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || p.category_name === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [productProfits, searchQuery, categoryFilter]);

  // Distinct Categories for Filter Dropdown
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    productProfits.forEach((p: any) => {
      if (p.category_name) cats.add(p.category_name);
    });
    return Array.from(cats);
  }, [productProfits]);

  const staffMembers: any[] = reportData?.staff_members || [];
  const generalOverhead = reportData?.general_overhead || { ads_cost: 0, extra_cost: 0 };

  // Sync catalog product draft inputs whenever catalogProducts changes
  useEffect(() => {
    if (catalogProducts && catalogProducts.length > 0) {
      setProductCostDrafts(prev => {
        const next = { ...prev };
        catalogProducts.forEach((p: any) => {
          if (!next[p.id]) {
            next[p.id] = {
              making_cost: String(p.making_cost ?? p.cost_price ?? 0),
              base_price: String(p.base_price ?? 0),
              ads_cost: String(p.ads_cost ?? 0),
              extra_cost: String(p.extra_cost ?? 0),
              notes: p.notes ?? '',
              saved: false,
            };
          }
        });
        return next;
      });
    }
  }, [catalogProducts]);

  // Sync storewide overhead draft
  useEffect(() => {
    if (reportData?.general_overhead) {
      setOverheadDraft({
        general_ads_cost: String(reportData.general_overhead.ads_cost ?? 0),
        general_extra_cost: String(reportData.general_overhead.extra_cost ?? 0),
        general_notes: '',
      });
    }
  }, [reportData?.general_overhead]);

  // Sync quick target form
  useEffect(() => {
    if (reportData?.financial_month) {
      setQuickTargetForm({
        target_revenue: String(reportData.financial_month.target_revenue ?? ''),
        budget_ads: String(reportData.financial_month.budget_ads ?? ''),
        budget_extra: String(reportData.financial_month.budget_extra ?? ''),
        target_net_profit: String(reportData.financial_month.target_net_profit ?? ''),
        title: reportData.financial_month.title ?? '',
        status: reportData.financial_month.status ?? 'active',
        notes: reportData.financial_month.notes ?? '',
      });
    }
  }, [reportData?.financial_month]);

  // Sync staff salaries
  useEffect(() => {
    if (reportData?.staff_members && Array.isArray(reportData.staff_members)) {
      const sMap: Record<number, { salary: string; designation: string }> = {};
      reportData.staff_members.forEach((st: any) => {
        sMap[st.id] = {
          salary: String(st.salary ?? 0),
          designation: st.designation ?? '',
        };
      });
      setSalaryDrafts(sMap);
    }
  }, [reportData?.staff_members]);

  // Filtered Matrix Products for the Cost Hub
  const filteredMatrixProducts = useMemo(() => {
    return catalogProducts.filter((p: any) => {
      const matchSearch = (p.name_en || '').toLowerCase().includes(matrixSearch.toLowerCase()) ||
                          (p.name_bn || '').toLowerCase().includes(matrixSearch.toLowerCase()) ||
                          (p.sku_prefix || '').toLowerCase().includes(matrixSearch.toLowerCase());
      const catName = p.category_name || p.category?.name_en || 'Uncategorized';
      const matchCat = matrixCategory === 'all' || catName === matrixCategory;
      return matchSearch && matchCat;
    });
  }, [catalogProducts, matrixSearch, matrixCategory]);

  const matrixCategoriesList = useMemo(() => {
    const cats = new Set<string>();
    catalogProducts.forEach((p: any) => {
      const c = p.category_name || p.category?.name_en;
      if (c) cats.add(c);
    });
    return Array.from(cats);
  }, [catalogProducts]);

  // Matrix Summary Totals
  const matrixTotalAds = useMemo(() => {
    return Object.values(productCostDrafts).reduce((acc, curr) => acc + (parseFloat(curr.ads_cost || '0') || 0), 0);
  }, [productCostDrafts]);

  const matrixTotalExtra = useMemo(() => {
    return Object.values(productCostDrafts).reduce((acc, curr) => acc + (parseFloat(curr.extra_cost || '0') || 0), 0);
  }, [productCostDrafts]);

  // Open Edit Product Modal from Table
  const handleOpenEditProduct = (item: any) => {
    setEditingProductData({
      product_id: item.product_id,
      product_name: item.product_name,
      category_name: item.category_name,
      making_cost: String(item.making_cost ?? item.unit_production_cost ?? 0),
      base_price: String(item.base_price ?? item.unit_selling_price ?? 0),
      ads_cost: String(item.direct_ads ?? item.ads_cost ?? 0),
      extra_cost: String(item.direct_extra ?? item.extra_cost ?? 0),
      notes: item.notes ?? '',
    });
    setIsSingleProductEditOpen(true);
  };

  // Open Edit Expense Modal
  const handleEditExpense = (expense: any) => {
    setEditingExpenseId(expense.id);
    setExpenseForm({
      product_id: expense.product_id ? String(expense.product_id) : '',
      making_cost: expense.making_cost !== undefined && expense.making_cost !== null ? String(expense.making_cost) : '',
      month: expense.month || selectedMonth,
      ads_cost: String(expense.ads_cost || 0),
      extra_cost: String(expense.extra_cost || 0),
      notes: expense.notes || '',
    });
    setIsExpenseModalOpen(true);
  };

  // Open Edit Month Modal
  const handleEditMonth = (m: any) => {
    setEditingMonthId(m.id);
    setMonthForm({
      month: m.month,
      title: m.title || '',
      target_revenue: String(m.target_revenue || 0),
      budget_ads: String(m.budget_ads || 0),
      budget_extra: String(m.budget_extra || 0),
      target_net_profit: String(m.target_net_profit || 0),
      status: m.status || 'active',
      notes: m.notes || '',
    });
    setIsMonthModalOpen(true);
  };

  // Open Create Month Modal
  const handleOpenCreateMonth = () => {
    setEditingMonthId(null);
    setMonthForm({
      month: currentMonthStr,
      title: '',
      target_revenue: '500000',
      budget_ads: '50000',
      budget_extra: '20000',
      target_net_profit: '150000',
      status: 'active',
      notes: '',
    });
    setIsMonthModalOpen(true);
  };

  // Export Comprehensive CSV
  const handleExportCSV = () => {
    if (!productProfits.length) {
      toast.error('No product sales data available to export for this period.');
      return;
    }

    const headers = [
      'Product ID',
      'Product Name',
      'Category',
      'Units Sold',
      'Avg Selling Price (BDT)',
      'Unit Production Cost (BDT)',
      'Sales Revenue (BDT)',
      'Total Production Cost (BDT)',
      'Allocated Courier Cost (BDT)',
      'Allocated Ads Cost (BDT)',
      'Allocated Extra Cost (BDT)',
      'Allocated Salary Cost (BDT)',
      'True Net Profit (BDT)',
      'Net Profit Margin (%)',
      'ROI Status',
    ];

    const rows = productProfits.map((p) => [
      p.product_id,
      `"${p.product_name.replace(/"/g, '""')}"`,
      `"${p.category_name}"`,
      p.units_sold,
      p.unit_selling_price,
      p.unit_production_cost,
      p.gross_revenue,
      p.production_cost,
      p.courier_cost,
      p.ads_cost,
      p.extra_cost,
      p.salary_cost || 0,
      p.net_profit,
      p.profit_margin,
      p.status,
    ]);

    // Add Summary Row at bottom
    rows.push([]);
    rows.push([
      'TOTALS / STOREWIDE',
      'All Sold Products',
      'All Categories',
      kpis.units_sold,
      '-',
      '-',
      kpis.gross_revenue,
      kpis.total_production_cost,
      kpis.total_courier_cost,
      kpis.total_ads_cost,
      kpis.total_extra_cost,
      kpis.total_salary_cost,
      kpis.net_profit,
      `${kpis.profit_margin}%`,
      kpis.net_profit >= 0 ? 'PROFITABLE' : 'NET LOSS',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `True-Net-Profit-Revenue-Statement-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported complete statement for ${selectedMonth}!`);
  };

  // Chart max value calculations
  const maxDailyRevenue = Math.max(...dailySales.map((d: any) => d.revenue), 1000);
  const maxTopProfit = Math.max(...topProfitable.map((p: any) => p.net_profit), 1000);

  return (
    <div className="space-y-6 pb-16">
      {/* ==================================================== */}
      {/* TOP HEADER & ACTION BAR                             */}
      {/* ==================================================== */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary dark:text-primary rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                {isEmbeddedInDashboard ? 'Dashboard Reports & Revenue Intelligence' : 'Reports & Revenue Analytics'}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/20 dark:bg-primary/10 text-primary dark:text-primary border border-primary/40 dark:border-primary/80">
                  True Net Profit (All Costs Deducted)
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                True Net Profit = Revenue − Making (COGS) − Courier − Ads − Extra − Employee Salary
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Month Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-background border rounded-xl px-3 py-2 text-xs font-semibold shadow-xs">
            <Calendar className="w-4 h-4 text-primary" />
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setActiveFilterMode('month');
              }}
              className="bg-transparent font-bold text-foreground focus:outline-hidden cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="dark:bg-slate-900">
                  Month: {m}
                </option>
              ))}
            </select>
          </div>

          {/* Month CRUD Button */}
          <button
            onClick={handleOpenCreateMonth}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Create or configure a new financial month period"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Month</span>
          </button>

          {/* Expansive Cost & Making Cost Hub Button */}
          <button
            onClick={() => setIsFullCostHubOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition-all shadow-md hover:shadow-purple-500/25 cursor-pointer"
            title="Log Monthly Ads, Extra Costs & Product Making Costs Hub"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Log Monthly Costs Hub</span>
          </button>

          {/* Quick Edit Targets Button */}
          <button
            onClick={() => setIsQuickTargetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-xs cursor-pointer"
            title="Quick edit active month targets and budgets"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Targets</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border hover:bg-muted text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            title="Export Statement to CSV"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            <span>CSV</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              refetch();
              refetchMonths();
              toast.success('Reports updated with latest store sales & costs!');
            }}
            disabled={isRefetching}
            className="p-2 rounded-xl bg-card border hover:bg-muted text-muted-foreground transition-colors shadow-xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MULTI-WAY VIEW NAVIGATION TABS                      */}
      {/* ==================================================== */}
      {/* ==================================================== */}
      {/* MULTI-WAY VIEW NAVIGATION TABS                      */}
      {/* ==================================================== */}
      <div className="flex items-center justify-between border-b border-border pb-1 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'overview'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>1. Executive Overview (All-in-One Master)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-extrabold">
              Complete View
            </span>
          </button>

          <button
            onClick={() => setActiveView('charts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'charts'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <LineChart className="w-4 h-4" />
            <span>2. Multiple Charts & Graphs</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-extrabold">
              5 Graphs
            </span>
          </button>

          <button
            onClick={() => setActiveView('lists')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'lists'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>3. Multiple Lists & Ledgers</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 font-extrabold">
              5 Lists
            </span>
          </button>

          <button
            onClick={() => setActiveView('month_crud')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'month_crud'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>4. Month CRUD Management</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-400 font-extrabold">
              {allFinancialMonths.length} Months
            </span>
          </button>
        </div>

        <div className="text-xs text-muted-foreground hidden sm:block">
          Active Fiscal Month: <strong className="text-primary font-bold">{selectedMonth}</strong>
        </div>
      </div>

      {/* ==================================================== */}
      {/* VIEW 1: EXECUTIVE OVERVIEW                           */}
      {/* ==================================================== */}
      {activeView === 'overview' && (
        <div id="section-overview-kpis" className="space-y-6">
          {/* Quick-Jump Anchor Bar for All-in-One Overview */}
          <div className="p-2.5 rounded-2xl bg-card border shadow-xs flex items-center justify-between gap-2 overflow-x-auto text-xs">
            <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0">Quick Jump:</span>
              <button
                type="button"
                onClick={() => document.getElementById('section-overview-kpis')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-1.5 rounded-xl hover:bg-muted hover:text-foreground transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                <span>1. Executive KPIs</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('section-charts')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-1.5 rounded-xl hover:bg-muted hover:text-foreground transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <LineChart className="w-3.5 h-3.5 text-primary" />
                <span>2. Charts & Graphs (5)</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('section-lists')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-1.5 rounded-xl hover:bg-muted hover:text-foreground transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Table className="w-3.5 h-3.5 text-indigo-500" />
                <span>3. Lists & Ledgers (5)</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('section-month-crud')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-1.5 rounded-xl hover:bg-muted hover:text-foreground transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                <span>4. Month CRUD Manager</span>
              </button>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground font-medium shrink-0">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>All 4 operational suites embedded in Executive Overview</span>
            </div>
          </div>

          {/* True Net Profit Equation Formula Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-teal-500/10 to-blue-500/10 border border-primary/40/40 dark:border-primary/80/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
                <span className="font-bold text-foreground">Standardized True Net Profit Formula:</span>
                <code className="bg-background/80 px-2 py-0.5 rounded-md font-mono text-primary dark:text-primary font-bold">
                  Net Profit = Revenue − Making − Courier − Ads − Extra − Employee Salary
                </code>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground font-medium shrink-0">
                <span>Month: <strong className="text-foreground">{selectedMonth}</strong></span>
                <span>•</span>
                <span>Delivered: <strong className="text-foreground">{kpis.delivered_orders} / {kpis.total_orders}</strong></span>
              </div>
            </div>
          </div>

          {/* 7 Financial Master KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
            {/* 1. Sales Revenue */}
            <div className="bg-card border rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase">
                <span>1. Sales Revenue</span>
                <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-xl font-black text-foreground">
                  ৳{formatBDT(kpis.gross_revenue)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {kpis.total_orders} orders • {kpis.units_sold} items
                </p>
              </div>
              <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 pt-2 border-t truncate">
                Target: ৳{formatBDT(targetAnalysis.target_revenue)}
              </div>
            </div>

            {/* 2. Production Cost (COGS) */}
            <div className="bg-card border rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase">
                <span>2. Making Cost (COGS)</span>
                <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Factory className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-xl font-black text-foreground">
                  ৳{formatBDT(kpis.total_production_cost)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Unit making/purchase costs
                </p>
              </div>
              <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 pt-2 border-t">
                {costPercentages.production_pct}% of Gross Sales
              </div>
            </div>

            {/* 3. Courier Cost */}
            <div className="bg-card border rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase">
                <span>3. Courier Fees</span>
                <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Truck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-xl font-black text-foreground">
                  ৳{formatBDT(kpis.total_courier_cost)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Delivery partner charges
                </p>
              </div>
              <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 pt-2 border-t">
                {costPercentages.courier_pct}% of Gross Sales
              </div>
            </div>

            {/* 4. Ads Cost */}
            <div className="bg-card border rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase">
                <span>4. Marketing Ads</span>
                <div className="p-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-xl font-black text-foreground">
                  ৳{formatBDT(kpis.total_ads_cost)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Facebook & Google marketing
                </p>
              </div>
              <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 pt-2 border-t">
                Budget: ৳{formatBDT(targetAnalysis.budget_ads)}
              </div>
            </div>

            {/* 5. Extra Cost */}
            <div className="bg-card border rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase">
                <span>5. Extra Costs</span>
                <div className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
                  <Package className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-xl font-black text-foreground">
                  ৳{formatBDT(kpis.total_extra_cost)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Packaging, poly, photoshoots
                </p>
              </div>
              <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 pt-2 border-t">
                Budget: ৳{formatBDT(targetAnalysis.budget_extra)}
              </div>
            </div>

            {/* 6. Employee Salary Cost (NEW) */}
            <div className="bg-card border rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase">
                <span>6. Employee Salaries</span>
                <button
                  type="button"
                  onClick={() => setIsQuickSalaryModalOpen(true)}
                  className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-lg cursor-pointer transition-colors"
                  title="Quick Adjust Staff Payroll"
                >
                  <Users className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="my-2">
                <div className="text-xl font-black text-teal-600 dark:text-teal-400">
                  ৳{formatBDT(kpis.total_salary_cost)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Active staff monthly payroll
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-teal-600 dark:text-teal-400 pt-2 border-t">
                <span>{costPercentages.salary_pct}% of Sales</span>
                <button
                  type="button"
                  onClick={() => setIsQuickSalaryModalOpen(true)}
                  className="text-[10px] font-bold underline hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer"
                >
                  Edit Payroll
                </button>
              </div>
            </div>

            {/* 7. True Net Profit Master Card */}
            <div className={`rounded-2xl p-4 shadow-sm border flex flex-col justify-between ${
              kpis.net_profit >= 0 
                ? 'bg-gradient-to-br from-primary/15 via-primary/5 to-teal-500/10 border-primary/50/50' 
                : 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-red-500/10 border-rose-400/50'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                <span className={kpis.net_profit >= 0 ? 'text-primary dark:text-primary/40' : 'text-rose-700 dark:text-rose-300'}>
                  7. True Net Profit
                </span>
                <div className={`p-1.5 rounded-lg ${
                  kpis.net_profit >= 0 ? 'bg-primary/20 text-primary dark:text-primary' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}>
                  <Flame className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-2">
                <div className={`text-xl font-black tracking-tight ${
                  kpis.net_profit >= 0 ? 'text-primary dark:text-primary' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  ৳{formatBDT(kpis.net_profit)}
                </div>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                  kpis.net_profit >= 0 ? 'bg-primary/20 text-primary dark:text-primary/40' : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                }`}>
                  {kpis.profit_margin}% Net Margin
                </span>
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground pt-2 border-t">
                Gross: <strong className="text-foreground">{kpis.gross_margin}%</strong>
              </div>
            </div>
          </div>

          {/* Revenue Cost Allocation Progress Bar with Employee Salary */}
          <div className="bg-card border rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Visual Cost Allocation of Total Sales Revenue
                </h3>
                <p className="text-xs text-muted-foreground">
                  Where does every ৳100 earned go? Detailed breakdown into production, delivery, ads, extra, salaries, and net profit.
                </p>
              </div>
              <span className="text-xs font-bold text-primary dark:text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {costPercentages.net_profit_pct}% Net Retained
              </span>
            </div>

            {/* Allocation Multi-Segment Bar */}
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex border p-0.5 gap-0.5">
              <div
                style={{ width: `${Math.max(1, costPercentages.production_pct)}%` }}
                className="bg-indigo-500 hover:opacity-90 transition-all rounded-l-full"
                title={`Production Cost: ${costPercentages.production_pct}%`}
              />
              <div
                style={{ width: `${Math.max(0.5, costPercentages.courier_pct)}%` }}
                className="bg-amber-500 hover:opacity-90 transition-all"
                title={`Courier Delivery: ${costPercentages.courier_pct}%`}
              />
              <div
                style={{ width: `${Math.max(0.5, costPercentages.ads_pct)}%` }}
                className="bg-purple-500 hover:opacity-90 transition-all"
                title={`Marketing Ads: ${costPercentages.ads_pct}%`}
              />
              <div
                style={{ width: `${Math.max(0.5, costPercentages.extra_pct)}%` }}
                className="bg-rose-500 hover:opacity-90 transition-all"
                title={`Extra Costs: ${costPercentages.extra_pct}%`}
              />
              <div
                style={{ width: `${Math.max(0.5, costPercentages.salary_pct)}%` }}
                className="bg-teal-500 hover:opacity-90 transition-all"
                title={`Employee Salaries: ${costPercentages.salary_pct}%`}
              />
              <div
                style={{ width: `${Math.max(1, costPercentages.net_profit_pct)}%` }}
                className="bg-primary hover:opacity-90 transition-all rounded-r-full"
                title={`True Net Profit: ${costPercentages.net_profit_pct}%`}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-indigo-500 shrink-0" />
                <span>Making Cost ({costPercentages.production_pct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                <span>Courier Cost ({costPercentages.courier_pct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-purple-500 shrink-0" />
                <span>Ads Cost ({costPercentages.ads_pct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-rose-500 shrink-0" />
                <span>Extra Cost ({costPercentages.extra_pct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-teal-500 shrink-0" />
                <span>Salaries ({costPercentages.salary_pct}%)</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-primary dark:text-primary">
                <span className="w-3 h-3 rounded-md bg-primary shrink-0" />
                <span>Net Profit ({costPercentages.net_profit_pct}%)</span>
              </div>
            </div>
          </div>

          {/* Targets & Variance Progress Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                Active Month Targets & Budget Variance ({selectedMonth})
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  {targetAnalysis.status || 'Active'}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Compare actual sales revenue, marketing spend, and bottom line against targets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsQuickTargetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border hover:bg-muted text-xs font-bold text-foreground transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span>Edit Targets & Budgets</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Revenue Target Progress */}
            <div className="bg-card border rounded-2xl p-5 shadow-xs">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-muted-foreground uppercase">Revenue Target Progress</span>
                <span className="text-primary font-bold">{targetAnalysis.revenue_progress_pct}%</span>
              </div>
              <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, targetAnalysis.revenue_progress_pct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
                <span>Achieved: ৳{formatBDT(kpis.gross_revenue)}</span>
                <span>Target: ৳{formatBDT(targetAnalysis.target_revenue)}</span>
              </div>
            </div>

            {/* Ads Budget Utilization */}
            <div className="bg-card border rounded-2xl p-5 shadow-xs">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-muted-foreground uppercase">Ads Budget Used</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">{targetAnalysis.ads_budget_used_pct}%</span>
              </div>
              <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, targetAnalysis.ads_budget_used_pct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
                <span>Spent: ৳{formatBDT(kpis.total_ads_cost)}</span>
                <span>Budget: ৳{formatBDT(targetAnalysis.budget_ads)}</span>
              </div>
            </div>

            {/* Profit Target Progress */}
            <div className="bg-card border rounded-2xl p-5 shadow-xs">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-muted-foreground uppercase">Profit Target Progress</span>
                <span className="text-primary dark:text-primary font-bold">{targetAnalysis.profit_progress_pct}%</span>
              </div>
              <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, targetAnalysis.profit_progress_pct))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
                <span>Profit: ৳{formatBDT(kpis.net_profit)}</span>
                <span>Target: ৳{formatBDT(targetAnalysis.target_net_profit)}</span>
              </div>
            </div>
          </div>

          {/* Top 3 Performers Quick Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                Top 3 Most Profitable Products
              </h3>
              <div className="space-y-2.5">
                {topProfitable.slice(0, 3).map((item, idx) => (
                  <div key={item.product_id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary dark:text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{item.product_name}</div>
                        <div className="text-[10px] text-muted-foreground">{item.category_name} • {item.units_sold} sold</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-primary dark:text-primary">
                        ৳{formatBDT(item.net_profit)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold">{item.profit_margin}% margin</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Sales Volume by Category
              </h3>
              <div className="space-y-2.5">
                {categoryBreakdown.slice(0, 3).map((cat) => (
                  <div key={cat.category_name} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border">
                    <div>
                      <div className="text-xs font-bold">{cat.category_name}</div>
                      <div className="text-[10px] text-muted-foreground">{cat.units_sold} units sold</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-foreground">
                        ৳{formatBDT(cat.gross_revenue)}
                      </div>
                      <div className="text-[10px] text-primary dark:text-primary font-semibold">
                        ৳{formatBDT(cat.net_profit)} profit
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW 2: MULTIPLE CHARTS & GRAPHS HUB                */}
      {/* ==================================================== */}
      {(activeView === 'charts' || activeView === 'overview') && (
        <div id="section-charts" className="space-y-6 pt-4 border-t border-border/60">
          {/* Header depending on whether in All-in-One Overview or Separate Tab */}
          {activeView === 'overview' ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-teal-500/5 to-cyan-500/10 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/20 text-primary dark:text-primary border border-primary/30">
                  <LineChart className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground flex items-center gap-2 flex-wrap">
                    2. Multiple Analytical Charts & Performance Graphs
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/20 text-primary dark:text-primary">
                      5 Visual Analytics
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Interactive real-time daily sales timeline, cost stack waterfall, category comparisons, and profit velocity curves.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveView('charts');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-card border hover:bg-muted text-xs font-bold text-foreground transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                title="Open Charts in dedicated separate view"
              >
                <span>Open in Separate View</span>
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/15 text-primary dark:text-primary">
                  <LineChart className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                    Separate View: 2. Multiple Charts & Graphs
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary dark:text-primary">
                      Isolated View
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Dedicated analytical charts view focusing on daily timelines, margin waterfalls, and targets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveView('overview');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <span>← Back to All-in-One Executive Overview</span>
              </button>
            </div>
          )}

          {/* Graph 1: Daily Revenue vs Net Profit Trend (Line / Area Graph) */}
          <div className="bg-card border rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Graph 1: Daily Revenue vs Net Profit Trend Curve
                </h3>
                <p className="text-xs text-muted-foreground">
                  Interactive timeline tracking gross revenue inflow against true net profit generated daily.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  Revenue (৳)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-primary dark:text-primary">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  Net Profit (৳)
                </span>
              </div>
            </div>

            {/* Interactive SVG Area Graph */}
            {dailySales.length > 0 ? (
              <div className="relative pt-6">
                <div className="h-64 flex items-end justify-between gap-2 border-b border-l border-border px-2 pb-2">
                  {dailySales.map((day: any, idx: number) => {
                    const revHeight = Math.max(8, (day.revenue / maxDailyRevenue) * 100);
                    const profitHeight = Math.max(4, (Math.max(0, day.net_profit) / maxDailyRevenue) * 100);
                    const isHovered = hoveredDailyIndex === idx;

                    return (
                      <div
                        key={day.date}
                        onMouseEnter={() => setHoveredDailyIndex(idx)}
                        onMouseLeave={() => setHoveredDailyIndex(null)}
                        className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                      >
                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-24 z-20 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 p-2.5 rounded-xl shadow-xl text-xs whitespace-nowrap pointer-events-none border border-slate-700">
                            <div className="font-bold border-b pb-1 mb-1">{day.date}</div>
                            <div className="text-blue-400 font-semibold">Revenue: ৳{formatBDT(day.revenue)}</div>
                            <div className="text-primary font-bold">Net Profit: ৳{formatBDT(day.net_profit)}</div>
                            <div className="text-slate-400 text-[10px]">{day.orders_count} orders</div>
                          </div>
                        )}

                        {/* Dual Bar / Curve Column */}
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          {/* Revenue Bar */}
                          <div
                            style={{ height: `${revHeight}%` }}
                            className="w-1/2 max-w-[1.2rem] bg-blue-500/80 group-hover:bg-blue-600 rounded-t-md transition-all duration-300"
                          />
                          {/* Profit Bar */}
                          <div
                            style={{ height: `${profitHeight}%` }}
                            className="w-1/2 max-w-[1.2rem] bg-primary group-hover:bg-primary/80 rounded-t-md transition-all duration-300 shadow-xs"
                          />
                        </div>

                        {/* Date Label */}
                        <span className="text-[10px] font-mono text-muted-foreground mt-2 truncate max-w-full">
                          {day.date.substring(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No daily order records logged for {selectedMonth}.
              </div>
            )}
          </div>

          {/* Two-Column Graphs Row: Cost Breakdown & Expense Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graph 2: Cost Breakdown Multi-Bar Comparison */}
            <div className="bg-card border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Graph 2: Cost Centers vs Revenue Breakdown
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Comparison of all expenditure categories including employee salaries against gross revenue in BDT.
                </p>

                <div className="space-y-3.5">
                  {/* Sales Revenue */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        1. Sales Revenue
                      </span>
                      <span>৳{formatBDT(kpis.gross_revenue)} (100%)</span>
                    </div>
                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  {/* Production Cost */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        2. Making Cost (COGS)
                      </span>
                      <span>৳{formatBDT(kpis.total_production_cost)} ({costPercentages.production_pct}%)</span>
                    </div>
                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, costPercentages.production_pct)}%` }} />
                    </div>
                  </div>

                  {/* Courier Cost */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        3. Courier Delivery Fees
                      </span>
                      <span>৳{formatBDT(kpis.total_courier_cost)} ({costPercentages.courier_pct}%)</span>
                    </div>
                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, costPercentages.courier_pct)}%` }} />
                    </div>
                  </div>

                  {/* Ads Spend */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        4. Marketing Ads Spend
                      </span>
                      <span>৳{formatBDT(kpis.total_ads_cost)} ({costPercentages.ads_pct}%)</span>
                    </div>
                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min(100, costPercentages.ads_pct)}%` }} />
                    </div>
                  </div>

                  {/* Extra Costs */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        5. Extra / Packaging Costs
                      </span>
                      <span>৳{formatBDT(kpis.total_extra_cost)} ({costPercentages.extra_pct}%)</span>
                    </div>
                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, costPercentages.extra_pct)}%` }} />
                    </div>
                  </div>

                  {/* Employee Salaries (NEW) */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                        6. Employee Salaries (Staff Payroll)
                      </span>
                      <span>৳{formatBDT(kpis.total_salary_cost)} ({costPercentages.salary_pct}%)</span>
                    </div>
                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${Math.min(100, costPercentages.salary_pct)}%` }} />
                    </div>
                  </div>

                  {/* True Net Profit */}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-1.5 text-primary dark:text-primary">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        7. True Net Profit (After All Costs)
                      </span>
                      <span className="text-primary dark:text-primary">
                        ৳{formatBDT(kpis.net_profit)} ({costPercentages.net_profit_pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, costPercentages.net_profit_pct))}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Graph 3: Expense Distribution Donut Graph */}
            <div className="bg-card border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-500" />
                  Graph 3: Expense & Profit Distribution Donut
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Percentage distribution of cost components vs net retained earnings.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                  {/* Visual Radial Ring */}
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      {/* Background circle */}
                      <circle cx="18" cy="18" r="15.915" fill="none" className="stroke-muted" strokeWidth="3.5" />
                      {/* Production slice */}
                      <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        className="stroke-indigo-500 transition-all duration-700"
                        strokeWidth="3.5"
                        strokeDasharray={`${costPercentages.production_pct} 100`}
                        strokeDashoffset="0"
                      />
                      {/* Courier slice */}
                      <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        className="stroke-amber-500 transition-all duration-700"
                        strokeWidth="3.5"
                        strokeDasharray={`${costPercentages.courier_pct} 100`}
                        strokeDashoffset={`-${costPercentages.production_pct}`}
                      />
                      {/* Ads slice */}
                      <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        className="stroke-purple-600 transition-all duration-700"
                        strokeWidth="3.5"
                        strokeDasharray={`${costPercentages.ads_pct} 100`}
                        strokeDashoffset={`-${costPercentages.production_pct + costPercentages.courier_pct}`}
                      />
                      {/* Extra slice */}
                      <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        className="stroke-rose-500 transition-all duration-700"
                        strokeWidth="3.5"
                        strokeDasharray={`${costPercentages.extra_pct} 100`}
                        strokeDashoffset={`-${costPercentages.production_pct + costPercentages.courier_pct + costPercentages.ads_pct}`}
                      />
                      {/* Salary slice */}
                      <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        className="stroke-teal-500 transition-all duration-700"
                        strokeWidth="3.5"
                        strokeDasharray={`${costPercentages.salary_pct} 100`}
                        strokeDashoffset={`-${costPercentages.production_pct + costPercentages.courier_pct + costPercentages.ads_pct + costPercentages.extra_pct}`}
                      />
                      {/* Net profit slice */}
                      <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        className="stroke-primary transition-all duration-700"
                        strokeWidth="3.5"
                        strokeDasharray={`${Math.max(0, costPercentages.net_profit_pct)} 100`}
                        strokeDashoffset={`-${100 - Math.max(0, costPercentages.net_profit_pct)}`}
                      />
                    </svg>

                    {/* Donut Center Label */}
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black text-primary dark:text-primary">
                        {kpis.profit_margin}%
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        Net Margin
                      </span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="space-y-2 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span>Making ({costPercentages.production_pct}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>Courier ({costPercentages.courier_pct}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-purple-600" />
                      <span>Marketing Ads ({costPercentages.ads_pct}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500" />
                      <span>Extra Costs ({costPercentages.extra_pct}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-teal-500" />
                      <span>Salaries ({costPercentages.salary_pct}%)</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary dark:text-primary font-bold">
                      <span className="w-3 h-3 rounded-full bg-primary" />
                      <span>Net Profit ({costPercentages.net_profit_pct}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Graphs Row: Top 5 Products Bar & Margin Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graph 4: Top 5 Profitable Products Ranking (Horizontal Bar Graph) */}
            <div className="bg-card border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  Graph 4: Top 5 Profitable Products Ranking
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Ranked by highest net profit in Bangladeshi Taka (BDT).
                </p>

                <div className="space-y-3.5">
                  {topProfitable.map((p, idx) => {
                    const widthPct = Math.max(5, (p.net_profit / maxTopProfit) * 100);
                    return (
                      <div key={p.product_id} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="truncate max-w-[65%]">
                            #{idx + 1} {p.product_name}
                          </span>
                          <span className="text-primary dark:text-primary font-black">
                            ৳{formatBDT(p.net_profit)} ({p.profit_margin}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Graph 5: Gross Margin vs Net Margin Efficiency Gauge */}
            <div className="bg-card border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-500" />
                  Graph 5: Profit Margin Efficiency (Gross vs Net)
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Measures operational efficiency and margin retention from gross to bottom-line after all expenses including salaries.
                </p>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-muted/40 border">
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      Gross Margin
                    </span>
                    <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 my-2">
                      {kpis.gross_margin}%
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      (Revenue − Making Cost) / Revenue
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <span className="text-xs font-bold text-primary dark:text-primary/40 uppercase">
                      True Net Margin
                    </span>
                    <div className="text-3xl font-black text-primary dark:text-primary my-2">
                      {kpis.profit_margin}%
                    </div>
                    <span className="text-[10px] text-primary/80 dark:text-primary/80">
                      After courier, ads, extra, and salaries
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Bottom-Line Efficiency:</strong> Retaining <strong>{kpis.profit_margin}%</strong> net profit after making ({costPercentages.production_pct}%), courier ({costPercentages.courier_pct}%), marketing ({costPercentages.ads_pct}%), packaging ({costPercentages.extra_pct}%), and employee salaries ({costPercentages.salary_pct}%).
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW 3: MULTIPLE LISTS & LEDGERS HUB                */}
      {/* ==================================================== */}
      {(activeView === 'lists' || activeView === 'overview') && (
        <div id="section-lists" className="space-y-4 pt-4 border-t border-border/60">
          {/* Header depending on whether in All-in-One Overview or Separate Tab */}
          {activeView === 'overview' ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-blue-500/10 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  <Table className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground flex items-center gap-2 flex-wrap">
                    3. Multiple Lists & Operational Financial Ledgers
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                      5 Comprehensive Ledgers
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Granular product unit economics, monthly archive, expense journals, daily sales breakdown, and category profitability.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveView('lists');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-card border hover:bg-muted text-xs font-bold text-foreground transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                title="Open Lists in dedicated separate view"
              >
                <span>Open in Separate View</span>
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  <Table className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                    Separate View: 3. Multiple Lists & Ledgers
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                      Isolated View
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Focused data tables and financial journals across products, expenses, and archives
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveView('overview');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <span>← Back to All-in-One Executive Overview</span>
              </button>
            </div>
          )}

          {/* Sub-List Navigation Tabs */}
          <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveListTab('products')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeListTab === 'products'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-card border text-muted-foreground hover:bg-muted'
              }`}
            >
              1. Product Profitability Table ({productProfits.length})
            </button>

            <button
              onClick={() => setActiveListTab('months')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeListTab === 'months'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-card border text-muted-foreground hover:bg-muted'
              }`}
            >
              2. Financial Months CRUD Ledger ({allFinancialMonths.length})
            </button>

            <button
              onClick={() => setActiveListTab('expenses')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeListTab === 'expenses'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-card border text-muted-foreground hover:bg-muted'
              }`}
            >
              3. Monthly Expense Ledger CRUD ({expensesList.length})
            </button>

            <button
              onClick={() => setActiveListTab('daily')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeListTab === 'daily'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-card border text-muted-foreground hover:bg-muted'
              }`}
            >
              4. Daily Sales & Profit Ledger ({dailySales.length})
            </button>

            <button
              onClick={() => setActiveListTab('categories')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeListTab === 'categories'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-card border text-muted-foreground hover:bg-muted'
              }`}
            >
              5. Category Profitability Breakdown ({categoryBreakdown.length})
            </button>
          </div>

          {/* ---------------------------------------------------- */}
          {/* SUB-LIST 1: PRODUCT PROFITABILITY TABLE              */}
          {/* ---------------------------------------------------- */}
          {activeListTab === 'products' && (
            <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/20">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Product-by-Product True Profit Statement ({filteredProducts.length} items)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    True Net Profit = Sales Revenue − Making Cost − Courier Cost − Ads Cost − Extra Cost − Employee Salary
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-background border text-xs w-full sm:w-48 focus:outline-hidden"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-background border text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="all">All Categories</option>
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsFullCostHubOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Batch Cost Hub</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b">
                    <tr>
                      <th className="px-4 py-3 font-bold">Product</th>
                      <th className="px-3 py-3 font-bold text-center">Units Sold</th>
                      <th className="px-3 py-3 font-bold text-right">Avg Sell Price</th>
                      <th className="px-3 py-3 font-bold text-right">Unit Making Cost</th>
                      <th className="px-4 py-3 font-bold text-right">Sales Revenue</th>
                      <th className="px-3 py-3 font-bold text-right text-indigo-600 dark:text-indigo-400">Total Making</th>
                      <th className="px-3 py-3 font-bold text-right text-amber-600 dark:text-amber-400">Courier</th>
                      <th className="px-3 py-3 font-bold text-right text-purple-600 dark:text-purple-400">Ads Cost</th>
                      <th className="px-3 py-3 font-bold text-right text-rose-600 dark:text-rose-400">Extra Cost</th>
                      <th className="px-3 py-3 font-bold text-right text-teal-600 dark:text-teal-400">Salary Share</th>
                      <th className="px-4 py-3 font-bold text-right text-primary dark:text-primary">True Net Profit</th>
                      <th className="px-3 py-3 font-bold text-center">Margin %</th>
                      <th className="px-3 py-3 font-bold text-center">ROI Status</th>
                      <th className="px-3 py-3 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((item) => (
                        <tr key={item.product_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-foreground truncate max-w-[180px]">
                              {item.product_name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {item.category_name}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center font-bold">
                            {item.units_sold}
                          </td>
                          <td className="px-3 py-3 text-right">
                            ৳{formatBDT(item.unit_selling_price)}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                            ৳{formatBDT(item.unit_production_cost)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            ৳{formatBDT(item.gross_revenue)}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                            ৳{formatBDT(item.production_cost)}
                          </td>
                          <td className="px-3 py-3 text-right text-amber-600 dark:text-amber-400">
                            ৳{formatBDT(item.courier_cost)}
                          </td>
                          <td className="px-3 py-3 text-right text-purple-600 dark:text-purple-400">
                            ৳{formatBDT(item.ads_cost)}
                          </td>
                          <td className="px-3 py-3 text-right text-rose-600 dark:text-rose-400">
                            ৳{formatBDT(item.extra_cost)}
                          </td>
                          <td className="px-3 py-3 text-right text-teal-600 dark:text-teal-400">
                            ৳{formatBDT(item.salary_cost || 0)}
                          </td>
                          <td className={`px-4 py-3 text-right font-black ${
                            item.net_profit >= 0 ? 'text-primary dark:text-primary' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            ৳{formatBDT(item.net_profit)}
                          </td>
                          <td className="px-3 py-3 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.net_profit >= 0 ? 'bg-primary/10 text-primary dark:text-primary' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                              {item.profit_margin}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {item.status === 'high_profit' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 dark:bg-primary/10 text-primary dark:text-primary border border-primary/40 dark:border-primary/80">
                                🔥 High ROI
                              </span>
                            ) : item.status === 'moderate' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                                ⚡ Steady
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                                ⚠️ Loss
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(item)}
                              className="px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold shadow-2xs"
                              title="Edit Making Cost, Selling Price, Ads & Extra"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={14} className="px-4 py-8 text-center text-muted-foreground">
                          No product sales records match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* SUB-LIST 2: FINANCIAL MONTHS CRUD TABLE              */}
          {/* ---------------------------------------------------- */}
          {activeListTab === 'months' && (
            <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Financial Months Management & Variance ({allFinancialMonths.length} Months)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Create, edit, lock, or delete monthly fiscal periods with targets, salaries, and budgets.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateMonth}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Month</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b">
                    <tr>
                      <th className="px-4 py-3 font-bold">Month</th>
                      <th className="px-4 py-3 font-bold">Title / Campaign</th>
                      <th className="px-3 py-3 font-bold text-center">Status</th>
                      <th className="px-3 py-3 font-bold text-right">Target Revenue</th>
                      <th className="px-3 py-3 font-bold text-right">Actual Revenue</th>
                      <th className="px-3 py-3 font-bold text-right">Revenue Variance</th>
                      <th className="px-3 py-3 font-bold text-right">Ads Budget</th>
                      <th className="px-3 py-3 font-bold text-right text-teal-600 dark:text-teal-400">Monthly Payroll</th>
                      <th className="px-4 py-3 font-bold text-right text-primary dark:text-primary">Actual Net Profit</th>
                      <th className="px-3 py-3 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allFinancialMonths.length > 0 ? (
                      allFinancialMonths.map((m: any) => (
                        <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-foreground">
                            {m.month}
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {m.title || '-'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.status === 'active'
                                ? 'bg-primary/20 text-primary dark:text-primary'
                                : m.status === 'closed'
                                ? 'bg-slate-500/20 text-slate-600 dark:text-slate-400'
                                : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            }`}>
                              {m.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            ৳{formatBDT(m.target_revenue)}
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-foreground">
                            ৳{formatBDT(m.actual_revenue || 0)}
                          </td>
                          <td className={`px-3 py-3 text-right font-bold ${
                            (m.revenue_variance || 0) >= 0 ? 'text-primary dark:text-primary' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {(m.revenue_variance || 0) >= 0 ? '+' : ''}৳{formatBDT(m.revenue_variance || 0)}
                          </td>
                          <td className="px-3 py-3 text-right text-purple-600 dark:text-purple-400">
                            ৳{formatBDT(m.budget_ads)}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-teal-600 dark:text-teal-400">
                            ৳{formatBDT(m.actual_salary || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-primary dark:text-primary">
                            ৳{formatBDT(m.actual_net_profit || 0)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedMonth(m.month);
                                  toast.success(`Switched active reporting to ${m.month}`);
                                }}
                                className="p-1 rounded-lg hover:bg-muted text-primary transition-colors cursor-pointer"
                                title="Set as active report month"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditMonth(m)}
                                className="p-1 rounded-lg hover:bg-muted text-blue-600 transition-colors cursor-pointer"
                                title="Edit Month"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete month ${m.month}?`)) {
                                    deleteMonthMutation.mutate(m.id);
                                  }
                                }}
                                className="p-1 rounded-lg hover:bg-muted text-destructive transition-colors cursor-pointer"
                                title="Delete Month"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                          No financial months configured. Click "Create Month" to set up your first fiscal period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* SUB-LIST 3: EXPENSE LEDGER CRUD TABLE                */}
          {/* ---------------------------------------------------- */}
          {activeListTab === 'expenses' && (
            <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Monthly Expense Ledger ({expensesList.length} Records)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ads and extra operational costs recorded for month: <strong>{selectedMonth}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingExpenseId(null);
                    setExpenseForm({
                      product_id: '',
                      making_cost: '',
                      month: selectedMonth,
                      ads_cost: '',
                      extra_cost: '',
                      notes: '',
                    });
                    setIsExpenseModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Expense</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b">
                    <tr>
                      <th className="px-4 py-3 font-bold">Month</th>
                      <th className="px-4 py-3 font-bold">Assigned Target</th>
                      <th className="px-4 py-3 font-bold text-right text-purple-600 dark:text-purple-400">Ads Cost</th>
                      <th className="px-4 py-3 font-bold text-right text-rose-600 dark:text-rose-400">Extra Cost</th>
                      <th className="px-4 py-3 font-bold text-right">Total Expense</th>
                      <th className="px-4 py-3 font-bold">Notes / Campaign</th>
                      <th className="px-3 py-3 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {expensesList.length > 0 ? (
                      expensesList.map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold">
                            {exp.month}
                          </td>
                          <td className="px-4 py-3">
                            {exp.product ? (
                              <div className="font-bold text-primary">
                                {exp.product.name_en}
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                                Storewide General Overhead
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-purple-600 dark:text-purple-400">
                            ৳{formatBDT(exp.ads_cost)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">
                            ৳{formatBDT(exp.extra_cost)}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-foreground">
                            ৳{formatBDT(Number(exp.ads_cost || 0) + Number(exp.extra_cost || 0))}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                            {exp.notes || '-'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditExpense(exp)}
                                className="p-1 rounded-lg hover:bg-muted text-blue-600 transition-colors cursor-pointer"
                                title="Edit Expense"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this expense record?')) {
                                    deleteExpenseMutation.mutate(exp.id);
                                  }
                                }}
                                className="p-1 rounded-lg hover:bg-muted text-destructive transition-colors cursor-pointer"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No expenses recorded for this month. Click "Log Expense" to add ads or operational costs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* SUB-LIST 4: DAILY SALES & PROFIT LEDGER              */}
          {/* ---------------------------------------------------- */}
          {activeListTab === 'daily' && (
            <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b bg-muted/20">
                <h3 className="text-sm font-bold text-foreground">
                  Daily Sales & Estimated Profit Ledger ({dailySales.length} Days Active)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Day-by-day breakdown of orders, revenue inflow, allocated salaries, and estimated net profit.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b">
                    <tr>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold text-center">Total Orders</th>
                      <th className="px-4 py-3 font-bold text-right">Gross Revenue</th>
                      <th className="px-3 py-3 font-bold text-right text-indigo-600 dark:text-indigo-400">Making Cost</th>
                      <th className="px-3 py-3 font-bold text-right text-amber-600 dark:text-amber-400">Courier Cost</th>
                      <th className="px-3 py-3 font-bold text-right text-purple-600 dark:text-purple-400">Ads Share</th>
                      <th className="px-3 py-3 font-bold text-right text-rose-600 dark:text-rose-400">Extra Share</th>
                      <th className="px-3 py-3 font-bold text-right text-teal-600 dark:text-teal-400">Salary Share</th>
                      <th className="px-4 py-3 font-bold text-right text-primary dark:text-primary">Daily Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dailySales.length > 0 ? (
                      dailySales.map((d: any) => (
                        <tr key={d.date} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-foreground">
                            {d.date}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">
                            {d.orders_count}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            ৳{formatBDT(d.revenue)}
                          </td>
                          <td className="px-3 py-3 text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                            ৳{formatBDT(d.cogs)}
                          </td>
                          <td className="px-3 py-3 text-right text-amber-600 dark:text-amber-400">
                            ৳{formatBDT(d.courier_cost)}
                          </td>
                          <td className="px-3 py-3 text-right text-purple-600 dark:text-purple-400">
                            ৳{formatBDT(d.ads_cost)}
                          </td>
                          <td className="px-3 py-3 text-right text-rose-600 dark:text-rose-400">
                            ৳{formatBDT(d.extra_cost)}
                          </td>
                          <td className="px-3 py-3 text-right text-teal-600 dark:text-teal-400 font-semibold">
                            ৳{formatBDT(d.salary_cost || 0)}
                          </td>
                          <td className={`px-4 py-3 text-right font-black ${
                            d.net_profit >= 0 ? 'text-primary dark:text-primary' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            ৳{formatBDT(d.net_profit)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                          No daily sales data logged for {selectedMonth}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* SUB-LIST 5: CATEGORY PROFITABILITY BREAKDOWN         */}
          {/* ---------------------------------------------------- */}
          {activeListTab === 'categories' && (
            <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b bg-muted/20">
                <h3 className="text-sm font-bold text-foreground">
                  Category Profitability Breakdown ({categoryBreakdown.length} Categories)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Revenue, unit production costs, salaries, and net margin per product category.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b">
                    <tr>
                      <th className="px-4 py-3 font-bold">Category Name</th>
                      <th className="px-3 py-3 font-bold text-center">Units Sold</th>
                      <th className="px-4 py-3 font-bold text-right">Sales Revenue</th>
                      <th className="px-3 py-3 font-bold text-right text-indigo-600 dark:text-indigo-400">Making Cost</th>
                      <th className="px-3 py-3 font-bold text-right text-amber-600 dark:text-amber-400">Courier Cost</th>
                      <th className="px-3 py-3 font-bold text-right text-purple-600 dark:text-purple-400">Ads Cost</th>
                      <th className="px-3 py-3 font-bold text-right text-rose-600 dark:text-rose-400">Extra Cost</th>
                      <th className="px-3 py-3 font-bold text-right text-teal-600 dark:text-teal-400">Salary Share</th>
                      <th className="px-4 py-3 font-bold text-right text-primary dark:text-primary">Net Profit</th>
                      <th className="px-3 py-3 font-bold text-center">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categoryBreakdown.length > 0 ? (
                      categoryBreakdown.map((cat: any) => (
                        <tr key={cat.category_name} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground">
                            {cat.category_name}
                          </td>
                          <td className="px-3 py-3 text-center font-semibold">
                            {cat.units_sold}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            ৳{formatBDT(cat.gross_revenue)}
                          </td>
                          <td className="px-3 py-3 text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                            ৳{formatBDT(cat.production_cost)}
                          </td>
                          <td className="px-3 py-3 text-right text-amber-600 dark:text-amber-400">
                            ৳{formatBDT(cat.courier_cost)}
                          </td>
                          <td className="px-3 py-3 text-right text-purple-600 dark:text-purple-400">
                            ৳{formatBDT(cat.ads_cost)}
                          </td>
                          <td className="px-3 py-3 text-right text-rose-600 dark:text-rose-400">
                            ৳{formatBDT(cat.extra_cost)}
                          </td>
                          <td className="px-3 py-3 text-right text-teal-600 dark:text-teal-400 font-semibold">
                            ৳{formatBDT(cat.salary_cost || 0)}
                          </td>
                          <td className={`px-4 py-3 text-right font-black ${
                            cat.net_profit >= 0 ? 'text-primary dark:text-primary' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            ৳{formatBDT(cat.net_profit)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:text-primary font-bold text-[10px]">
                              {cat.profit_margin}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                          No category sales records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW 4: MONTH CRUD MANAGEMENT HUB                    */}
      {/* ==================================================== */}
      {(activeView === 'month_crud' || activeView === 'overview') && (
        <div id="section-month-crud" className="space-y-6 pt-4 border-t border-border/60">
          {/* Header depending on whether in All-in-One Overview or Separate Tab */}
          {activeView === 'overview' ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-indigo-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground flex items-center gap-2 flex-wrap">
                    4. Fiscal Month Period CRUD & Target Management Hub
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400">
                      {allFinancialMonths.length} Months Configured
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Define and customize each calendar month's target revenue, ads marketing budget, extra budget, and target net profit.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenCreateMonth}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Month</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('month_crud');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-card border hover:bg-muted text-xs font-bold text-foreground transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Open Month CRUD in dedicated separate view"
                >
                  <span>Open in Separate View</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border rounded-2xl p-6 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Separate View: 4. Fiscal Month Period CRUD & Targets Manager
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define and customize each calendar month's target revenue, ads marketing budget, extra budget, and target net profit.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCreateMonth}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Month</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('overview');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>← Back to All-in-One Executive Overview</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allFinancialMonths.map((m: any) => {
              const isSelected = selectedMonth === m.month;
              return (
                <div
                  key={m.id}
                  className={`bg-card border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${
                    isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-black text-foreground">
                        {m.month}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'active'
                          ? 'bg-primary/20 text-primary dark:text-primary'
                          : m.status === 'closed'
                          ? 'bg-slate-500/20 text-slate-600 dark:text-slate-400'
                          : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}>
                        {m.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-foreground mb-3">
                      {m.title || `Fiscal Period ${m.month}`}
                    </h3>

                    <div className="space-y-2 text-xs border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Revenue:</span>
                        <span className="font-bold">৳{formatBDT(m.target_revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Actual Revenue:</span>
                        <span className="font-bold text-foreground">৳{formatBDT(m.actual_revenue || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ads Budget:</span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">৳{formatBDT(m.budget_ads)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Payroll:</span>
                        <span className="font-semibold text-teal-600 dark:text-teal-400">৳{formatBDT(m.actual_salary || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Profit:</span>
                        <span className="font-semibold text-primary dark:text-primary">৳{formatBDT(m.target_net_profit)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-bold">
                        <span className="text-primary dark:text-primary/40">Actual Net Profit:</span>
                        <span className="text-primary dark:text-primary">৳{formatBDT(m.actual_net_profit || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t">
                    <button
                      onClick={() => {
                        setSelectedMonth(m.month);
                        toast.success(`Switched active reporting to ${m.month}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-primary/20 text-primary dark:text-primary font-black' 
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                    >
                      {isSelected ? '✓ Active Reporting' : 'Switch Month'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditMonth(m)}
                        className="p-1.5 rounded-lg hover:bg-muted text-blue-600 transition-colors cursor-pointer"
                        title="Edit Month"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete financial month ${m.month}?`)) {
                            deleteMonthMutation.mutate(m.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted text-destructive transition-colors cursor-pointer"
                        title="Delete Month"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: MONTH CRUD MODAL (NEUMORPHIC DESIGN)        */}
      {/* ==================================================== */}
      {isMonthModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsMonthModalOpen(false); }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="neu-modal w-full max-w-lg p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 relative cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground">
                    {editingMonthId ? 'Edit Financial Month' : 'Create Financial Month Period'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Configure monthly targets, marketing budgets, and fiscal status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMonthModalOpen(false)}
                className="neu-close-btn"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMonthMutation.mutate({
                  month: monthForm.month,
                  title: monthForm.title || null,
                  target_revenue: parseFloat(monthForm.target_revenue) || 0,
                  budget_ads: parseFloat(monthForm.budget_ads) || 0,
                  budget_extra: parseFloat(monthForm.budget_extra) || 0,
                  target_net_profit: parseFloat(monthForm.target_net_profit) || 0,
                  status: monthForm.status,
                  notes: monthForm.notes || null,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Month Period (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    required
                    value={monthForm.month}
                    onChange={(e) => setMonthForm({ ...monthForm, month: e.target.value })}
                    disabled={Boolean(editingMonthId)}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Fiscal Status
                  </label>
                  <select
                    value={monthForm.status}
                    onChange={(e) => setMonthForm({ ...monthForm, status: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="active">Active Fiscal Month</option>
                    <option value="closed">Closed / Locked</option>
                    <option value="projected">Projected / Future</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Custom Campaign Name / Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Eid Mega Shopping Fest 2026"
                  value={monthForm.title}
                  onChange={(e) => setMonthForm({ ...monthForm, title: e.target.value })}
                  className="neu-input w-full px-3.5 py-2.5 text-xs focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Target Revenue (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="৳ 500,000"
                    value={monthForm.target_revenue}
                    onChange={(e) => setMonthForm({ ...monthForm, target_revenue: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary dark:text-primary">
                    Target Net Profit (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="৳ 150,000"
                    value={monthForm.target_net_profit}
                    onChange={(e) => setMonthForm({ ...monthForm, target_net_profit: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold text-primary dark:text-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-purple-600 dark:text-purple-400">
                    Budget for Ads (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="৳ 50,000"
                    value={monthForm.budget_ads}
                    onChange={(e) => setMonthForm({ ...monthForm, budget_ads: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-rose-600 dark:text-rose-400">
                    Budget for Extra Costs (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="৳ 20,000"
                    value={monthForm.budget_extra}
                    onChange={(e) => setMonthForm({ ...monthForm, budget_extra: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Operational Notes & Milestones
                </label>
                <textarea
                  rows={2}
                  placeholder="Goals, promo strategies, supplier payments, seasonal targets..."
                  value={monthForm.notes}
                  onChange={(e) => setMonthForm({ ...monthForm, notes: e.target.value })}
                  className="neu-input w-full px-3.5 py-2 text-xs focus:outline-hidden"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsMonthModalOpen(false)}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMonthMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saveMonthMutation.isPending ? 'Saving...' : editingMonthId ? 'Update Month' : 'Create Month'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: EXPENSE CRUD MODAL (NEUMORPHIC DESIGN)      */}
      {/* ==================================================== */}
      {isExpenseModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsExpenseModalOpen(false); }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="neu-modal w-full max-w-lg p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 relative cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-xs">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground">
                    {editingExpenseId ? 'Edit Monthly Expense' : 'Log Monthly Ads & Extra Costs'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Assign marketing or operational costs to a specific product or storewide overhead
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="neu-close-btn"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveExpenseMutation.mutate({
                  product_id: expenseForm.product_id ? parseInt(expenseForm.product_id) : null,
                  making_cost: expenseForm.making_cost ? parseFloat(expenseForm.making_cost) : null,
                  month: expenseForm.month,
                  ads_cost: parseFloat(expenseForm.ads_cost) || 0,
                  extra_cost: parseFloat(expenseForm.extra_cost) || 0,
                  notes: expenseForm.notes,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Month Period *
                  </label>
                  <input
                    type="month"
                    required
                    value={expenseForm.month}
                    onChange={(e) => setExpenseForm({ ...expenseForm, month: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Target Assignment
                  </label>
                  <select
                    value={expenseForm.product_id}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const selectedProd = catalogProducts.find((p) => String(p.id) === pId);
                      setExpenseForm({ 
                        ...expenseForm, 
                        product_id: pId,
                        making_cost: selectedProd ? String(selectedProd.making_cost || selectedProd.cost_price || '') : '',
                      });
                    }}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="">Storewide Overhead (Shared)</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {expenseForm.product_id && (
                <div className="neu-card-inset p-3.5 space-y-1.5">
                  <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 block">
                    Product Making Cost / Production Price (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 650"
                    value={expenseForm.making_cost}
                    onChange={(e) => setExpenseForm({ ...expenseForm, making_cost: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Setting this overrides standard unit COGS for the monthly profit formula.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-600 dark:text-purple-400 block">
                    Ads Marketing Spend (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 15000"
                    value={expenseForm.ads_cost}
                    onChange={(e) => setExpenseForm({ ...expenseForm, ads_cost: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                    Extra Operational Cost (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 5000"
                    value={expenseForm.extra_cost}
                    onChange={(e) => setExpenseForm({ ...expenseForm, extra_cost: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Notes / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Facebook Conversion Ad Campaign, Custom Bubble Wrap Packaging..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="neu-input w-full px-3.5 py-2.5 text-xs focus:outline-hidden"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveExpenseMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saveExpenseMutation.isPending ? 'Saving...' : editingExpenseId ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: FULL-PAGE LOG MONTHLY COSTS & MATRIX HUB    */}
      {/* ==================================================== */}
      {isFullCostHubOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullCostHubOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center neu-backdrop p-2 sm:p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`neu-modal flex flex-col w-full transition-all duration-300 cursor-default ${
            isCostHubMaximized ? 'fixed inset-2 z-50 h-[calc(100vh-16px)]' : 'max-w-7xl max-h-[92vh] min-h-[75vh]'
          }`}>
            {/* Modal Header */}
            <div className="p-5 neu-modal-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                  <Factory className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black tracking-tight text-foreground">
                      Monthly Expense, Marketing Ads & Product Making Costs Hub
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                      Month: {selectedMonth}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure product unit making costs, dedicated Facebook/Google ad spend, and packaging overhead.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsCostHubMaximized(!isCostHubMaximized)}
                  className="neu-close-btn hidden md:flex"
                  title={isCostHubMaximized ? 'Restore View' : 'Maximize Full View'}
                >
                  {isCostHubMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullCostHubOpen(false)}
                  className="neu-close-btn"
                  title="Close Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hub Navigation Tabs (Tactile Neumorphic Pills) */}
            <div className="flex items-center gap-3 px-6 py-3 neu-modal-header overflow-x-auto">
              <button
                type="button"
                onClick={() => setCostHubTab('matrix')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  costHubTab === 'matrix'
                    ? 'neu-tile-active'
                    : 'neu-tile-inactive'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Product Cost & Ads Matrix ({catalogProducts.length} Items)</span>
              </button>

              <button
                type="button"
                onClick={() => setCostHubTab('overhead')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  costHubTab === 'overhead'
                    ? 'neu-tile-active'
                    : 'neu-tile-inactive'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Storewide General Overhead</span>
              </button>

              <button
                type="button"
                onClick={() => setCostHubTab('single')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  costHubTab === 'single'
                    ? 'neu-tile-active'
                    : 'neu-tile-inactive'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Single Product Fast-Log</span>
              </button>
            </div>

            {/* Hub Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: PRODUCT COST & ADS MATRIX */}
              {costHubTab === 'matrix' && (
                <div className="space-y-4">
                  {/* Filter & Summary Bar in Sunken Cavity */}
                  <div className="neu-card-inset p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search product or SKU..."
                          value={matrixSearch}
                          onChange={(e) => setMatrixSearch(e.target.value)}
                          className="neu-input w-full pl-8 pr-3 py-2 text-xs text-foreground focus:outline-hidden"
                        />
                      </div>

                      <select
                        value={matrixCategory}
                        onChange={(e) => setMatrixCategory(e.target.value)}
                        className="neu-input px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-hidden"
                      >
                        <option value="all">All Categories</option>
                        {matrixCategoriesList.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground flex-wrap">
                      <span>Total Matrix Ads: <strong className="text-purple-600 dark:text-purple-400 font-bold">৳{formatBDT(matrixTotalAds)}</strong></span>
                      <span>•</span>
                      <span>Total Matrix Extra: <strong className="text-rose-600 dark:text-rose-400 font-bold">৳{formatBDT(matrixTotalExtra)}</strong></span>
                    </div>
                  </div>

                  {/* Matrix Table inside Sculpted Container */}
                  <div className="neu-card-inset p-1.5 overflow-hidden">
                    <div className="overflow-x-auto max-h-[50vh] rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/40 text-muted-foreground text-[11px] font-black uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                          <tr>
                            <th className="px-3 py-3">Product Name & SKU</th>
                            <th className="px-3 py-3 text-right">Selling Price (৳)</th>
                            <th className="px-3 py-3 text-right">Making Cost (৳)</th>
                            <th className="px-3 py-3 text-right">Direct Ads Spend (৳)</th>
                            <th className="px-3 py-3 text-right">Direct Extra Cost (৳)</th>
                            <th className="px-3 py-3 text-right">Gross Profit / Margin</th>
                            <th className="px-3 py-3">Notes</th>
                            <th className="px-3 py-3 text-center">Save</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {filteredMatrixProducts.length > 0 ? (
                            filteredMatrixProducts.map((p: any) => {
                              const draft = productCostDrafts[p.id] || {
                                making_cost: String(p.making_cost || p.cost_price || 0),
                                base_price: String(p.base_price || p.unit_selling_price || 0),
                                ads_cost: String(p.ads_cost || 0),
                                extra_cost: String(p.extra_cost || 0),
                                notes: p.notes || '',
                                saved: true,
                              };

                              const sp = parseFloat(draft.base_price) || 0;
                              const mc = parseFloat(draft.making_cost) || 0;
                              const unitProfit = sp - mc;
                              const marginPct = sp > 0 ? Math.round((unitProfit / sp) * 100) : 0;

                              return (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-3 py-3">
                                    <div className="font-bold text-foreground line-clamp-1">{p.name_en}</div>
                                    <div className="text-[10px] text-muted-foreground">{p.sku || `ID: #${p.id}`} • {p.category?.name_en || 'General'}</div>
                                  </td>

                                  <td className="px-3 py-3 text-right">
                                    <div className="relative inline-block">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={draft.base_price}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setProductCostDrafts(prev => ({
                                            ...prev,
                                            [p.id]: { ...(prev[p.id] || draft), base_price: val, saved: false }
                                          }));
                                        }}
                                        className="neu-input w-24 px-2 py-1.5 text-xs font-bold text-right focus:outline-hidden"
                                      />
                                    </div>
                                  </td>

                                  <td className="px-3 py-3 text-right">
                                    <div className="relative inline-block">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={draft.making_cost}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setProductCostDrafts(prev => ({
                                            ...prev,
                                            [p.id]: { ...(prev[p.id] || draft), making_cost: val, saved: false }
                                          }));
                                        }}
                                        className="neu-input w-24 px-2 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 text-right focus:outline-hidden"
                                      />
                                    </div>
                                  </td>

                                  <td className="px-3 py-3 text-right">
                                    <div className="relative inline-block">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0"
                                        value={draft.ads_cost}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setProductCostDrafts(prev => ({
                                            ...prev,
                                            [p.id]: { ...(prev[p.id] || draft), ads_cost: val, saved: false }
                                          }));
                                        }}
                                        className="neu-input w-24 px-2 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 text-right focus:outline-hidden"
                                      />
                                    </div>
                                  </td>

                                  <td className="px-3 py-3 text-right">
                                    <div className="relative inline-block">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0"
                                        value={draft.extra_cost}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setProductCostDrafts(prev => ({
                                            ...prev,
                                            [p.id]: { ...(prev[p.id] || draft), extra_cost: val, saved: false }
                                          }));
                                        }}
                                        className="neu-input w-24 px-2 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 text-right focus:outline-hidden"
                                      />
                                    </div>
                                  </td>

                                  <td className="px-3 py-3 text-right">
                                    <div className={`font-black text-xs ${unitProfit >= 0 ? 'text-primary dark:text-primary' : 'text-rose-600 dark:text-rose-400'}`}>
                                      ৳{formatBDT(unitProfit)}
                                    </div>
                                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-md ${unitProfit >= 0 ? 'bg-primary/10 text-primary dark:text-primary' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                      {marginPct}% Margin
                                    </span>
                                  </td>

                                  <td className="px-3 py-3">
                                    <input
                                      type="text"
                                      placeholder="Ad campaign note..."
                                      value={draft.notes}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setProductCostDrafts(prev => ({
                                          ...prev,
                                          [p.id]: { ...(prev[p.id] || draft), notes: val, saved: false }
                                        }));
                                      }}
                                      className="neu-input w-32 px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden"
                                    />
                                  </td>

                                  <td className="px-3 py-3 text-center">
                                    <button
                                      type="button"
                                      disabled={updateProductCostsMutation.isPending}
                                      onClick={() => {
                                        updateProductCostsMutation.mutate({
                                          id: p.id,
                                          payload: {
                                            month: selectedMonth,
                                            making_cost: parseFloat(draft.making_cost || '0') || 0,
                                            base_price: parseFloat(draft.base_price || '0') || 0,
                                            ads_cost: parseFloat(draft.ads_cost || '0') || 0,
                                            extra_cost: parseFloat(draft.extra_cost || '0') || 0,
                                            notes: draft.notes || '',
                                          }
                                        });
                                      }}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                        draft.saved 
                                          ? 'bg-primary text-white shadow-xs' 
                                          : 'neu-btn-primary'
                                      }`}
                                      title="Save this product's cost & expenses"
                                    >
                                      {draft.saved ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Saved</span>
                                        </>
                                      ) : (
                                        <>
                                          <Save className="w-3.5 h-3.5" />
                                          <span>Save</span>
                                        </>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                No catalog products match your search.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sticky Matrix Footer */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 neu-modal-footer">
                    <span className="text-xs text-muted-foreground">
                      Editing costs for month: <strong className="text-foreground">{selectedMonth}</strong> ({catalogProducts.length} Total Catalog Items)
                    </span>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsFullCostHubOpen(false)}
                        className="neu-btn-secondary px-5 py-2 text-xs font-bold cursor-pointer"
                      >
                        Close
                      </button>

                      <button
                        type="button"
                        disabled={bulkUpdateCostsMutation.isPending}
                        onClick={() => {
                          const items = catalogProducts.map((p: any) => {
                            const draft = productCostDrafts[p.id];
                            return {
                              product_id: p.id,
                              making_cost: parseFloat(draft?.making_cost || '0') || 0,
                              base_price: parseFloat(draft?.base_price || '0') || 0,
                              ads_cost: parseFloat(draft?.ads_cost || '0') || 0,
                              extra_cost: parseFloat(draft?.extra_cost || '0') || 0,
                              notes: draft?.notes || null,
                            };
                          });

                          bulkUpdateCostsMutation.mutate({
                            month: selectedMonth,
                            general_ads_cost: parseFloat(overheadDraft.general_ads_cost || '0') || 0,
                            general_extra_cost: parseFloat(overheadDraft.general_extra_cost || '0') || 0,
                            general_notes: overheadDraft.general_notes || null,
                            items,
                          });
                        }}
                        className="neu-btn-primary px-7 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{bulkUpdateCostsMutation.isPending ? 'Saving All Products...' : 'Save All Making Costs & Ads'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STOREWIDE OVERHEAD */}
              {costHubTab === 'overhead' && (
                <div className="neu-card-inset max-w-2xl mx-auto p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Storewide General Marketing & Operational Overhead
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        General brand ad spend or storewide extra costs not allocated to any single product.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveExpenseMutation.mutate({
                        product_id: null,
                        month: selectedMonth,
                        ads_cost: parseFloat(overheadDraft.general_ads_cost) || 0,
                        extra_cost: parseFloat(overheadDraft.general_extra_cost) || 0,
                        notes: overheadDraft.general_notes,
                      });
                    }}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-foreground">
                          General Brand Ads Spend (৳)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 15000"
                          value={overheadDraft.general_ads_cost}
                          onChange={(e) => setOverheadDraft({ ...overheadDraft, general_ads_cost: e.target.value })}
                          className="neu-input w-full px-3.5 py-2.5 text-xs font-bold text-purple-600 dark:text-purple-400 focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-foreground">
                          General Packaging & Storage Extra Cost (৳)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 5000"
                          value={overheadDraft.general_extra_cost}
                          onChange={(e) => setOverheadDraft({ ...overheadDraft, general_extra_cost: e.target.value })}
                          className="neu-input w-full px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-foreground">
                        Campaign Notes / Strategy
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Storewide brand awareness campaigns, festive promotions, warehouse supplies..."
                        value={overheadDraft.general_notes}
                        onChange={(e) => setOverheadDraft({ ...overheadDraft, general_notes: e.target.value })}
                        className="neu-input w-full px-3.5 py-2.5 text-xs focus:outline-hidden"
                      />
                    </div>

                    <div className="flex justify-end pt-4 neu-modal-footer">
                      <button
                        type="submit"
                        disabled={saveExpenseMutation.isPending}
                        className="neu-btn-primary px-6 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {saveExpenseMutation.isPending ? 'Saving...' : 'Save General Overhead'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: SINGLE PRODUCT FAST LOG */}
              {costHubTab === 'single' && (
                <div className="neu-card-inset max-w-xl mx-auto p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary dark:text-primary">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Single Product Cost Logger
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Quickly update making cost or assign dedicated ad spend to one item.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!expenseForm.product_id) {
                        toast.error('Please choose a product or use Storewide Overhead tab.');
                        return;
                      }
                      updateProductCostsMutation.mutate({
                        id: parseInt(expenseForm.product_id),
                        payload: {
                          month: selectedMonth,
                          making_cost: parseFloat(expenseForm.making_cost) || 0,
                          ads_cost: parseFloat(expenseForm.ads_cost) || 0,
                          extra_cost: parseFloat(expenseForm.extra_cost) || 0,
                          notes: expenseForm.notes,
                        }
                      });
                    }}
                    className="space-y-4 pt-2"
                  >
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-foreground">
                        Select Product *
                      </label>
                      <select
                        required
                        value={expenseForm.product_id}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const selectedProd = catalogProducts.find((p) => String(p.id) === pId);
                          setExpenseForm({ 
                            ...expenseForm, 
                            product_id: pId,
                            making_cost: selectedProd ? String(selectedProd.making_cost || selectedProd.cost_price || '') : '',
                          });
                        }}
                        className="neu-input w-full px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-hidden"
                      >
                        <option value="">Select a Product</option>
                        {catalogProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name_en} (Current Making: ৳{p.making_cost || p.cost_price || 0})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          Making Cost (৳)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 650"
                          value={expenseForm.making_cost}
                          onChange={(e) => setExpenseForm({ ...expenseForm, making_cost: e.target.value })}
                          className="neu-input w-full px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-purple-600 dark:text-purple-400">
                          Ads Cost (৳)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 3000"
                          value={expenseForm.ads_cost}
                          onChange={(e) => setExpenseForm({ ...expenseForm, ads_cost: e.target.value })}
                          className="neu-input w-full px-3 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-rose-600 dark:text-rose-400">
                          Extra Cost (৳)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 1000"
                          value={expenseForm.extra_cost}
                          onChange={(e) => setExpenseForm({ ...expenseForm, extra_cost: e.target.value })}
                          className="neu-input w-full px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-foreground">
                        Notes
                      </label>
                      <input
                        type="text"
                        placeholder="Campaign details..."
                        value={expenseForm.notes}
                        onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                        className="neu-input w-full px-3.5 py-2.5 text-xs focus:outline-hidden"
                      />
                    </div>

                    <div className="flex justify-end pt-4 neu-modal-footer">
                      <button
                        type="submit"
                        disabled={updateProductCostsMutation.isPending}
                        className="neu-btn-primary px-6 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {updateProductCostsMutation.isPending ? 'Saving...' : 'Save Product Cost'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: SINGLE PRODUCT COST & PRICE EDIT MODAL      */}
      {/* ==================================================== */}
      {isSingleProductEditOpen && editingProductData && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSingleProductEditOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal w-full max-w-lg p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 relative cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground">
                    Edit Costs & Selling Price
                  </h3>
                  <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                    {editingProductData.product_name} ({editingProductData.category_name})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSingleProductEditOpen(false)}
                className="neu-close-btn"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProductCostsMutation.mutate({
                  id: editingProductData.product_id,
                  payload: {
                    month: selectedMonth,
                    making_cost: parseFloat(editingProductData.making_cost) || 0,
                    base_price: parseFloat(editingProductData.base_price) || 0,
                    ads_cost: parseFloat(editingProductData.ads_cost) || 0,
                    extra_cost: parseFloat(editingProductData.extra_cost) || 0,
                    notes: editingProductData.notes,
                  }
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Selling Price (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProductData.base_price}
                    onChange={(e) => setEditingProductData({ ...editingProductData, base_price: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Making Cost (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProductData.making_cost}
                    onChange={(e) => setEditingProductData({ ...editingProductData, making_cost: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Profit preview in Sunken Card */}
              {(() => {
                const sp = parseFloat(editingProductData.base_price) || 0;
                const mc = parseFloat(editingProductData.making_cost) || 0;
                const p = sp - mc;
                const m = sp > 0 ? Math.round((p / sp) * 100) : 0;
                return (
                  <div className="neu-card-inset p-3.5 flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">Projected Unit Gross Margin:</span>
                    <div className="text-right">
                      <span className={`font-black ${p >= 0 ? 'text-primary dark:text-primary' : 'text-rose-600 dark:text-rose-400'}`}>
                        ৳{formatBDT(p)} ({m}%)
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-purple-600 dark:text-purple-400">
                    Monthly Ads Spend (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={editingProductData.ads_cost}
                    onChange={(e) => setEditingProductData({ ...editingProductData, ads_cost: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold text-purple-700 dark:text-purple-300 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-rose-600 dark:text-rose-400">
                    Monthly Extra Cost (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={editingProductData.extra_cost}
                    onChange={(e) => setEditingProductData({ ...editingProductData, extra_cost: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Notes on packaging, supplier discount, or ad campaign..."
                  value={editingProductData.notes}
                  onChange={(e) => setEditingProductData({ ...editingProductData, notes: e.target.value })}
                  className="neu-input w-full px-3.5 py-2.5 text-xs focus:outline-hidden"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsSingleProductEditOpen(false)}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProductCostsMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {updateProductCostsMutation.isPending ? 'Saving...' : 'Save & Recalculate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 5: QUICK EDIT MONTH TARGETS & BUDGETS MODAL    */}
      {/* ==================================================== */}
      {isQuickTargetModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsQuickTargetModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal w-full max-w-lg p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 relative cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground">
                    Quick Edit Month Targets & Budgets
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Update active targets for fiscal month <strong className="text-foreground">{selectedMonth}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickTargetModalOpen(false)}
                className="neu-close-btn"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                quickUpdateTargetsMutation.mutate({
                  month: selectedMonth,
                  title: quickTargetForm.title || null,
                  target_revenue: parseFloat(quickTargetForm.target_revenue) || 0,
                  budget_ads: parseFloat(quickTargetForm.budget_ads) || 0,
                  budget_extra: parseFloat(quickTargetForm.budget_extra) || 0,
                  target_net_profit: parseFloat(quickTargetForm.target_net_profit) || 0,
                  status: quickTargetForm.status,
                  notes: quickTargetForm.notes || null,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Campaign Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Autumn Festive Sale 2026"
                  value={quickTargetForm.title}
                  onChange={(e) => setQuickTargetForm({ ...quickTargetForm, title: e.target.value })}
                  className="neu-input w-full px-3.5 py-2.5 text-xs focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Target Revenue (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quickTargetForm.target_revenue}
                    onChange={(e) => setQuickTargetForm({ ...quickTargetForm, target_revenue: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary dark:text-primary">
                    Target Net Profit (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickTargetForm.target_net_profit}
                    onChange={(e) => setQuickTargetForm({ ...quickTargetForm, target_net_profit: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold text-primary dark:text-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-purple-600 dark:text-purple-400">
                    Budget for Ads (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quickTargetForm.budget_ads}
                    onChange={(e) => setQuickTargetForm({ ...quickTargetForm, budget_ads: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-rose-600 dark:text-rose-400">
                    Budget for Extra Costs (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quickTargetForm.budget_extra}
                    onChange={(e) => setQuickTargetForm({ ...quickTargetForm, budget_extra: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Fiscal Status
                </label>
                <select
                  value={quickTargetForm.status}
                  onChange={(e) => setQuickTargetForm({ ...quickTargetForm, status: e.target.value })}
                  className="neu-input w-full px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed / Locked</option>
                  <option value="projected">Projected / Future</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsQuickTargetModalOpen(false)}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickUpdateTargetsMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {quickUpdateTargetsMutation.isPending ? 'Updating...' : 'Save Targets'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 6: QUICK STAFF SALARIES ADJUSTER MODAL         */}
      {/* ==================================================== */}
      {isQuickSalaryModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsQuickSalaryModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal w-full max-w-lg p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 relative cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground">
                    Quick Staff Payroll & Salary Adjuster
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Adjust monthly employee salaries. Deducted directly in True Net Profit.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickSalaryModalOpen(false)}
                className="neu-close-btn"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const staffPayload = staffMembers.map((st: any) => ({
                  id: st.id,
                  salary: parseFloat(salaryDrafts[st.id]?.salary || '0') || 0,
                  designation: salaryDrafts[st.id]?.designation || st.designation,
                }));

                quickUpdateSalariesMutation.mutate({
                  staff: staffPayload
                });
              }}
              className="space-y-4"
            >
              <div className="neu-card-inset p-3 max-h-64 overflow-y-auto space-y-2.5">
                {staffMembers.length > 0 ? (
                  staffMembers.map((st: any) => (
                    <div key={st.id} className="p-3 rounded-xl bg-background/50 dark:bg-slate-900/50 border border-white/50 dark:border-white/5 flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-foreground">{st.name}</div>
                        <div className="text-[10px] text-muted-foreground">{st.designation || 'Staff Member'} • {st.email}</div>
                      </div>

                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-[10px] text-teal-600 dark:text-teal-400 font-bold">৳</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={salaryDrafts[st.id]?.salary ?? String(st.salary || 0)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSalaryDrafts(prev => ({
                              ...prev,
                              [st.id]: { ...(prev[st.id] || { salary: '', designation: '' }), salary: val }
                            }));
                          }}
                          className="neu-input w-28 pl-6 pr-2.5 py-1.5 text-xs font-black text-teal-700 dark:text-teal-300 text-right focus:outline-hidden"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    No active staff members found in RBAC.
                  </div>
                )}
              </div>

              {/* Live payroll total */}
              <div className="neu-card-inset p-3.5 flex justify-between items-center text-xs">
                <span className="text-teal-800 dark:text-teal-300 font-bold">Total Monthly Payroll:</span>
                <span className="font-black text-teal-700 dark:text-teal-300 text-sm">
                  ৳{formatBDT(Object.values(salaryDrafts).reduce((sum, curr) => sum + (parseFloat(curr.salary || '0') || 0), 0))}
                </span>
              </div>

              <div className="pt-4 flex justify-end gap-3 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsQuickSalaryModalOpen(false)}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickUpdateSalariesMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {quickUpdateSalariesMutation.isPending ? 'Updating...' : 'Save Salaries'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsSuite;
