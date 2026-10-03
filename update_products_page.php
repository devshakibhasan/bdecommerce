<?php
$file = "c:/xampp/htdocs/bd-ecommerce/frontend/src/app/admin/products/page.tsx";
$code = file_get_contents($file);

// 1. Inject state and mutation at the beginning of the component
$stateInjection = <<<EOT
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deletingProduct, setDeletingProduct] = useState<{ id: number; name: string } | null>(null);
  const [quickStockProduct, setQuickStockProduct] = useState<any>(null);
  const [quickStockValue, setQuickStockValue] = useState<number>(0);
  
  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data?.data) {
      setSelectedIds(data.data.map((d: any) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };
EOT;

$code = str_replace(
  "const [selectedCategory, setSelectedCategory] = useState('');\n  const [selectedStatus, setSelectedStatus] = useState('');\n  const [deletingProduct, setDeletingProduct] = useState<{ id: number; name: string } | null>(null);\n  const [quickStockProduct, setQuickStockProduct] = useState<any>(null);\n  const [quickStockValue, setQuickStockValue] = useState<number>(0);",
  $stateInjection,
  $code
);

// 2. Inject Bulk Mutation right after the quickStockMutation
$mutationInjection = <<<EOT
  // 5. Quick Stock Update Mutation (Targeted update)
  const quickStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: number; stock: number }) => {
      return await api.put(`/admin/inventory/\${id}/stock`, { stock });
    },
    onSuccess: (_data, variables) => {
      toast.success('Stock level updated successfully');
      syncEntityInCache(queryClient, 'product', { id: variables.id, stock: variables.stock });
      setQuickStockProduct(null);
    },
    onError: () => {
      toast.error('Failed to update stock');
    }
  });

  // 6. Bulk Action Mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: number[] }) => {
      return await api.post('/admin/products/bulk-action', { action, ids });
    },
    onSuccess: () => {
      toast.success('Bulk action completed successfully');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => {
      toast.error('Failed to perform bulk action');
    }
  });

  const handleBulkAction = (action: string) => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    bulkActionMutation.mutate({ action, ids: selectedIds });
  };
EOT;

$code = preg_replace('/\/\/\ 5\.\ Quick Stock Update Mutation.*?\}\n  \}\);\n/s', $mutationInjection, $code);

// 3. Update the Columns definition
$oldCheckboxCol = <<<EOT
    {
      key: 'checkbox',
      label: 'o"',
      render: (row) => (
        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
      )
    },
EOT;

$newCheckboxCol = <<<EOT
    {
      key: 'checkbox',
      label: <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === (data?.data?.length || 0)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" />,
      render: (row) => (
        <input 
          type="checkbox" 
          checked={selectedIds.includes(row.id)}
          onChange={() => handleSelectRow(row.id)}
          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" 
        />
      )
    },
EOT;

$code = str_replace($oldCheckboxCol, $newCheckboxCol, $code);

// 4. Update the Action Buttons
$oldButtons = <<<EOT
          {/* Active / De-Active Bulk Actions */}
          <button className="px-3 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-colors shadow-xs">
            Active Home
          </button>
          <button className="px-3 py-2 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold transition-colors shadow-xs">
            De-Active Home
          </button>
          
          <button className="px-3 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-colors shadow-xs">
            Active Product
          </button>
          <button className="px-3 py-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold transition-colors shadow-xs">
            De-Active Product
          </button>
EOT;

$newButtons = <<<EOT
          {/* Active / De-Active Bulk Actions */}
          <button onClick={() => handleBulkAction('active_home')} disabled={bulkActionMutation.isPending || selectedIds.length === 0} className="px-3 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50">
            Active Home
          </button>
          <button onClick={() => handleBulkAction('deactive_home')} disabled={bulkActionMutation.isPending || selectedIds.length === 0} className="px-3 py-2 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50">
            De-Active Home
          </button>
          
          <button onClick={() => handleBulkAction('active_product')} disabled={bulkActionMutation.isPending || selectedIds.length === 0} className="px-3 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50">
            Active Product
          </button>
          <button onClick={() => handleBulkAction('deactive_product')} disabled={bulkActionMutation.isPending || selectedIds.length === 0} className="px-3 py-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50">
            De-Active Product
          </button>
EOT;

$code = str_replace($oldButtons, $newButtons, $code);

file_put_contents($file, $code);
echo "Products page updated.\n";
?>
