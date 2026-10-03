<?php
$file = __DIR__ . '/src/app/admin/products/page.tsx';
$code = file_get_contents($file);

preg_match('/import \{([\s\S]*?)\} from \'lucide-react\';/', $code, $matches);
if (isset($matches[1])) {
    $imports = $matches[1];
    if (strpos($imports, 'MoreHorizontal') === false) {
        $imports .= ', MoreHorizontal, Copy, History, Printer, List, ChevronDown, CheckSquare';
    }
    $code = str_replace($matches[0], "import { $imports } from 'lucide-react';", $code);
}

// Now we need to replace the columns array.
// I will locate the start of columns array and the end.
$startPos = strpos($code, 'const columns: Column<Product>[] = [');
$endPos = strpos($code, '];', $startPos) + 2;

$newColumns = <<<JS
const columns: Column<Product>[] = [
    {
      key: 'checkbox',
      label: '✓',
      render: (row) => (
        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
      )
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="relative group/dropdown">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
            Action <ChevronDown className="w-3 h-3" />
          </button>
          {/* Dropdown Menu */}
          <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-50 overflow-hidden">
            <button onClick={() => handleOpenImageModal(row)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <ImageIcon className="w-3.5 h-3.5 text-primary" /> Manage Images
            </button>
            <Link href={`/products/\${row.slug}`} target="_blank" className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <Eye className="w-3.5 h-3.5 text-blue-500" /> View Storefront
            </Link>
            <Link href={`/admin/products/\${row.id}/edit`} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <Edit className="w-3.5 h-3.5 text-amber-500" /> Edit Product
            </Link>
            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <Copy className="w-3.5 h-3.5 text-green-500" /> Duplicate
            </button>
            <Link href={`/admin/products/reviews?product_id=\${row.id}`} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <History className="w-3.5 h-3.5 text-indigo-500" /> Product History
            </Link>
            <Link href={`/admin/products/print-barcode?data=\${row.slug}`} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Barcode
            </Link>
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
            <button onClick={() => setDeletingProduct({ id: row.id, name: row.name_en })} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )
    },
    {
      key: 'primary_image_url',
      label: 'Image',
      render: (row: any) => {
        const rawImg = row.primary_image_url || row.images?.[0]?.url || row.images?.[0]?.path || 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85';
        const imgUrl = formatImageUrl(rawImg, row.updated_at);
        const imageCount = row.images?.length || (row.primary_image_url ? 1 : 0);

        return (
          <div 
            onClick={() => handleOpenImageModal(row)}
            className="relative w-12 h-12 rounded-2xl neu-inset overflow-hidden flex items-center justify-center p-1 group cursor-pointer hover:border-primary border border-transparent transition-all shadow-xs"
          >
            <img 
              src={imgUrl} 
              alt={row.name_en} 
              className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85'; }}
            />
            {imageCount > 1 ? (
              <span className="absolute bottom-0 right-0 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-tl-lg shadow-sm">{imageCount}</span>
            ) : null}
          </div>
        );
      }
    },
    { 
      key: 'name_en', 
      label: 'Name', 
      render: (row) => (
        <Link href={`/admin/products/\${row.id}/edit`} className="font-black text-slate-900 dark:text-white hover:text-primary transition-colors line-clamp-1">
          {row.name_en}
        </Link>
      )
    },
    { 
      key: 'slug', 
      label: 'Code', 
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.slug}</span>
    },
    { 
      key: 'category', 
      label: 'Category', 
      render: (row) => row.category ? <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.category.name_en}</span> : '-'
    },
    { 
      key: 'is_in_stock', 
      label: 'Quantity', 
      render: (row: any) => {
        const totalStock = row.variants?.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0) ?? (row.stock || 0);
        return (
          <button
            onClick={() => { setQuickStockProduct(row); setQuickStockValue(totalStock); }}
            className={`px-2 py-0.5 rounded text-[11px] font-black cursor-pointer shadow-xs transition-transform active:scale-95 \${
              totalStock > 10 ? 'bg-primary/20 text-primary dark:bg-primary/10/60 dark:text-primary' :
              totalStock > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60' : 'bg-red-100 text-red-800'
            }`}
          >
            {totalStock} in stock
          </button>
        );
      }
    },
    {
      key: 'purchase_count',
      label: 'Purchase',
      render: (row) => <span className="text-xs font-bold">0</span>
    },
    { 
      key: 'cost_price', 
      label: 'Cost', 
      render: (row: any) => <span className="text-xs font-black">{formatBDT(row.cost_price || 0)}</span>
    },
    { 
      key: 'base_price', 
      label: 'Price', 
      render: (row) => <span className="text-xs font-black">{formatBDT(row.base_price || 0)}</span>
    },
    { 
      key: 'wprice', 
      label: 'wprice', 
      render: (row: any) => <span className="text-xs font-black text-slate-500">{formatBDT(row.wholesale_price || 0)}</span>
    },
    { 
      key: 'is_active', 
      label: 'Active', 
      render: (row) => (
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={row.is_active} onChange={() => toggleStatusMutation.mutate({ id: row.id, is_active: !row.is_active })} />
          <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
        </label>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row: any) => <span className="text-xs text-slate-500">{row.position || 0}</span>
    },
    {
      key: 'type',
      label: 'Type',
      render: (row: any) => <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded">Standard</span>
    }
  ];
JS;

$code = substr_replace($code, $newColumns, $startPos, $endPos - $startPos);
file_put_contents($file, $code);
echo "Columns successfully updated!";
