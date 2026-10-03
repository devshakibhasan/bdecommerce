const fs = require('fs');
const path = require('path');

const writePage = (route, content) => {
    const dir = path.join('src/app/admin', route);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'page.tsx'), content, 'utf-8');
};

// 1. Print Barcode
writePage('products/print-barcode', `'use client';
import { useState } from 'react';
import { Search, Printer, Settings2, Barcode, X } from 'lucide-react';
import Link from 'next/link';

export default function PrintBarcodePage() {
  const [productQuery, setProductQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [labelCount, setLabelCount] = useState(1);
  const [paperSize, setPaperSize] = useState('38x25');

  return (
    <div className="space-y-6">
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
              <div>
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
                </div>
              </div>

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
                <button className="w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <Printer className="w-4 h-4" /> Generate Print Preview
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-8 min-h-[400px] border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center">
             <div className="text-center space-y-3">
               <Barcode className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Search a product and click Generate to see the print preview.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}`);

// 2. Brands
writePage('brands', `'use client';
import { Plus, Tag, Search, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Tag className="w-6 h-6 text-primary" /> Brands
        </h1>
        <button className="neu-btn-primary flex items-center gap-2 px-4 py-2">
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      <div className="bg-white dark:bg-[#111622] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input type="text" placeholder="Search brands..." className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm outline-none focus:border-primary" />
          </div>
        </div>
        
        <div className="p-8 text-center text-slate-500">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
            <Tag className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-bold">No brands created yet.</p>
          <p className="text-xs mt-1">Click Add Brand to create your first brand.</p>
        </div>
      </div>
    </div>
  );
}`);

// 3. Product Types
writePage('product-types', `'use client';
import { Plus, Layers, Search } from 'lucide-react';

export default function ProductTypesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Layers className="w-6 h-6 text-primary" /> Product Types
        </h1>
        <button className="neu-btn-primary flex items-center gap-2 px-4 py-2">
          <Plus className="w-4 h-4" /> Add Type
        </button>
      </div>

      <div className="bg-white dark:bg-[#111622] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="p-8 text-center text-slate-500">
          <Layers className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold">No product types configured.</p>
        </div>
      </div>
    </div>
  );
}`);

// 4. Product Reviews
writePage('products/reviews', `'use client';
import { Star, MessageSquare } from 'lucide-react';

export default function ProductReviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-current" /> Customer Reviews
        </h1>
      </div>

      <div className="bg-white dark:bg-[#111622] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">
        <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-bold">No reviews found.</p>
        <p className="text-xs mt-1">When customers review your products, they will appear here.</p>
      </div>
    </div>
  );
}`);

// 5. Media Library
writePage('media', `'use client';
import { Image as ImageIcon, UploadCloud } from 'lucide-react';

export default function MediaLibraryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-primary" /> Media Library
        </h1>
        <button className="neu-btn-primary flex items-center gap-2 px-4 py-2">
          <UploadCloud className="w-4 h-4" /> Upload Files
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
           <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center animate-pulse">
             <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600" />
           </div>
        ))}
      </div>
    </div>
  );
}`);

// 6. Quantity Adjustments
writePage('inventory/adjustments', `'use client';
import { Plus, SlidersHorizontal, Search } from 'lucide-react';
import Link from 'next/link';

export default function AdjustmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-primary" /> Quantity Adjustments
        </h1>
        <Link href="/admin/inventory/adjustments/create" className="neu-btn-primary flex items-center gap-2 px-4 py-2">
          <Plus className="w-4 h-4" /> Add Adjustment
        </Link>
      </div>

      <div className="bg-white dark:bg-[#111622] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">
        <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-bold">No inventory adjustments recorded.</p>
      </div>
    </div>
  );
}`);

// 7. Add Adjustment
writePage('inventory/adjustments/create', `'use client';
import { Save, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';

export default function CreateAdjustmentPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/inventory/adjustments" className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-black">New Stock Adjustment</h1>
        </div>
        <button className="neu-btn-primary flex items-center gap-2 px-5 py-2">
          <Save className="w-4 h-4" /> Save Adjustment
        </button>
      </div>

      <div className="bg-white dark:bg-[#111622] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold mb-1 block">Warehouse / Location</label>
            <select className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none">
              <option>Main Warehouse</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-bold mb-1 block">Reference Note</label>
            <input type="text" placeholder="e.g. Damaged stock removal" className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none" />
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <label className="text-sm font-bold mb-2 block">Search & Add Products</label>
          <div className="relative mb-4">
            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <input type="text" placeholder="Scan barcode or search by name..." className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary" />
          </div>
          
          <div className="text-center p-8 border border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-sm">
            Search for products above to adjust their stock levels (+ or -).
          </div>
        </div>
      </div>
    </div>
  );
}`);

console.log('Successfully generated all missing submenu pages!');
