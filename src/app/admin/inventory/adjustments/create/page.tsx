'use client';
import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Search, Loader2, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { formatImageUrl } from '@/utils/image';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CreateAdjustmentPage() {
  const [productQuery, setProductQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [warehouse, setWarehouse] = useState('Main Warehouse');
  const [note, setNote] = useState('');
  const router = useRouter();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(productQuery), 500);
    return () => clearTimeout(timer);
  }, [productQuery]);

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['product-search-adjust', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const res: any = await api.get(`/admin/products?search=${encodeURIComponent(debouncedQuery)}`);
      const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      return Array.isArray(items) ? items : [];
    },
    enabled: debouncedQuery.length > 0
  });

    const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        warehouse,
        note,
        items: selectedProducts.map(p => ({ product_id: p.id, type: p.type, quantity: p.adjustQty }))
      };
      return api.post('/admin/inventory-adjustments', payload);
    },
    onSuccess: () => {
      toast.success('Adjustment saved and stock updated!');
      router.push('/admin/inventory/adjustments');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save')
  });

  const addProduct = (prod: any) => {
    if (!selectedProducts.find(p => p.id === prod.id)) {
      setSelectedProducts([...selectedProducts, { ...prod, adjustQty: 1, type: 'add' }]);
    }
    setProductQuery('');
    setDebouncedQuery('');
  };

  const removeProduct = (id: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  const updateProduct = (id: number, key: string, value: any) => {
    setSelectedProducts(selectedProducts.map(p => p.id === id ? { ...p, [key]: value } : p));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/inventory/adjustments" className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-black">New Stock Adjustment</h1>
        </div>
        <button 
          onClick={() => saveMutation.mutate()}
          disabled={selectedProducts.length === 0 || saveMutation.isPending}
          className="neu-btn-primary flex items-center gap-2 px-5 py-2 disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving..." : <><Save className="w-4 h-4" /> Save Adjustment</>}
        </button>
      </div>

      <div className="bg-white dark:bg-[#111622] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold mb-1 block">Warehouse / Location</label>
            <select 
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
            >
              <option value="Main Warehouse">Main Warehouse</option>
              <option value="Retail Store">Retail Store Front</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-bold mb-1 block">Reference Note</label>
            <input 
              type="text" 
              placeholder="e.g. Damaged stock removal" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none" 
            />
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <label className="text-sm font-bold mb-2 block">Search & Add Products</label>
          <div className="relative mb-4">
            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Scan barcode or search by name..." 
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary" 
            />
            {isSearching && <Loader2 className="w-5 h-5 absolute right-3 top-3 animate-spin text-primary" />}

            {debouncedQuery && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((prod: any) => (
                    <div 
                      key={prod.id}
                      onClick={() => addProduct(prod)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                    >
                      <img src={formatImageUrl(prod.primary_image_url || prod.images?.[0]?.url)} className="w-8 h-8 rounded-lg object-cover bg-slate-100" />
                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-bold truncate">{prod.name_en}</div>
                        <div className="text-xs text-slate-500 font-mono">Stock: {prod.variants?.[0]?.stock ?? prod.stock ?? 0} • {prod.slug}</div>
                      </div>
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                  ))
                ) : (
                  !isSearching && <div className="p-4 text-xs text-center text-slate-500">No products found.</div>
                )}
              </div>
            )}
          </div>
          
          {selectedProducts.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-sm">
              Search for products above to adjust their stock levels (+ or -).
            </div>
          ) : (
            <div className="space-y-3">
              {selectedProducts.map((prod, idx) => (
                <div key={prod.id} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="w-8 text-center text-xs font-bold text-slate-400">{idx + 1}</div>
                  <img src={formatImageUrl(prod.primary_image_url || prod.images?.[0]?.url)} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="text-sm font-bold">{prod.name_en}</div>
                    <div className="text-xs text-slate-500">Current Stock: {prod.variants?.[0]?.stock ?? prod.stock ?? 0}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      value={prod.type}
                      onChange={(e) => updateProduct(prod.id, 'type', e.target.value)}
                      className="p-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 font-bold outline-none"
                    >
                      <option value="add">Add (+)</option>
                      <option value="subtract">Subtract (-)</option>
                    </select>
                    <input 
                      type="number" 
                      min="1"
                      value={prod.adjustQty}
                      onChange={(e) => updateProduct(prod.id, 'adjustQty', parseInt(e.target.value) || 1)}
                      className="w-20 p-2 border rounded-lg text-sm text-center bg-slate-50 dark:bg-slate-900 font-bold outline-none"
                    />
                    <button 
                      onClick={() => removeProduct(prod.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}