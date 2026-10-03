'use client';
import { useState, useEffect } from 'react';
import { Search, Printer, Settings2, Barcode, X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatImageUrl } from '@/utils/image';

export default function PrintBarcodePage() {
  const [productQuery, setProductQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [labelCount, setLabelCount] = useState(1);
  const [paperSize, setPaperSize] = useState('38x25');

  // Auto-load product if 'data' query param is present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dataParam = params.get('data');
      if (dataParam) {
        api.get(`/products/${dataParam}`).then((res: any) => {
          if (res.data?.data) {
            setSelectedProduct(res.data.data);
          } else if (res.data) {
            setSelectedProduct(res.data);
          }
        }).catch((err) => {
           // fallback to search
           api.get(`/admin/products?search=${encodeURIComponent(dataParam)}`).then((res: any) => {
              const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
              if (Array.isArray(items) && items.length > 0) setSelectedProduct(items[0]);
           }).catch(() => {});
        });
      }
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(productQuery), 500);
    return () => clearTimeout(timer);
  }, [productQuery]);

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['product-search-barcode', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const res: any = await api.get(`/admin/products?search=${encodeURIComponent(debouncedQuery)}`);
      const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      return Array.isArray(items) ? items : [];
    },
    enabled: debouncedQuery.length > 0
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Barcode className="w-6 h-6 text-primary" /> Print Barcode Labels
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#111622] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Print Settings
            </h2>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Search Product</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by Name, Code or SKU..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                  {isSearching && <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-primary" />}
                </div>

                {/* Search Results Dropdown */}
                {debouncedQuery && !selectedProduct && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((prod: any) => (
                        <div 
                          key={prod.id}
                          onClick={() => {
                            setSelectedProduct(prod);
                            setProductQuery('');
                            setDebouncedQuery('');
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                        >
                          <img src={formatImageUrl(prod.primary_image_url || prod.images?.[0]?.url)} className="w-8 h-8 rounded-lg object-cover bg-slate-100" />
                          <div className="flex-1 overflow-hidden">
                            <div className="text-xs font-bold truncate">{prod.name_en}</div>
                            <div className="text-[10px] text-slate-500 font-mono">SKU: {prod.sku_prefix || prod.variants?.[0]?.sku || prod.id}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      !isSearching && <div className="p-4 text-xs text-center text-slate-500">No products found.</div>
                    )}
                  </div>
                )}
              </div>

              {selectedProduct && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl relative">
                  <button 
                    onClick={() => setSelectedProduct(null)} 
                    className="absolute top-2 right-2 p-1 bg-white/50 rounded-md hover:bg-white text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="text-[10px] font-bold text-primary mb-1">SELECTED PRODUCT</div>
                  <div className="text-sm font-black truncate pr-6">{selectedProduct.name_en}</div>
                  <div className="text-xs text-slate-600 font-mono">SKU: {selectedProduct.sku_prefix || selectedProduct.variants?.[0]?.sku || selectedProduct.id}</div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Paper Size</label>
                <select 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value)}
                >
                  <option value="38x25">38mm x 25mm (Standard Label)</option>
                  <option value="50x25">50mm x 25mm</option>
                  <option value="A4">A4 (Multiple per page)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Number of Labels</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  value={labelCount}
                  onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="pt-2">
                <button 
                  disabled={!selectedProduct}
                  onClick={() => window.print()}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" /> Print Labels
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 print:col-span-3 print:absolute print:inset-0 print:bg-white print:z-[9999]">
          <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-8 min-h-[400px] border border-dashed border-slate-300 dark:border-slate-700 print:border-none print:bg-white print:p-0">
             {!selectedProduct ? (
               <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-3 opacity-50 print:hidden">
                 <Barcode className="w-12 h-12 mx-auto text-slate-400" />
                 <p className="text-sm font-medium">Search a product to generate the print preview.</p>
               </div>
             ) : (
               <div className="flex flex-wrap gap-4 print:gap-1 justify-center items-start">
                 {Array.from({ length: labelCount }).map((_, i) => (
                   <div 
                     key={i} 
                     className="bg-white text-black p-3 rounded-lg border border-slate-300 shadow-sm flex flex-col items-center justify-center print:border-0 print:shadow-none print:m-0"
                     style={
                       paperSize === '38x25' ? { width: '38mm', height: '25mm', padding: '2mm', overflow: 'hidden' } :
                       paperSize === '50x25' ? { width: '50mm', height: '25mm', padding: '2mm', overflow: 'hidden' } :
                       { width: '200px', height: 'auto' }
                     }
                   >
                     <div className="text-[8px] font-black uppercase text-center leading-tight truncate w-full">
                       {selectedProduct.name_en}
                     </div>
                     <Barcode className="w-full h-8 my-1 text-black" strokeWidth={1} />
                     <div className="text-[10px] font-mono font-bold tracking-widest">{selectedProduct.sku_prefix || selectedProduct.variants?.[0]?.sku || selectedProduct.id}</div>
                     <div className="text-[11px] font-black mt-0.5">৳{selectedProduct.base_price}</div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}