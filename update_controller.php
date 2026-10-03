<?php
$file = "c:/xampp/htdocs/bd-ecommerce/backend/app/Http/Controllers/Api/V1/Catalog/ProductController.php";
$code = file_get_contents($file);

if (strpos($code, 'public function bulkAction') === false) {
    $bulkMethod = <<<EOT
    public function bulkAction(Request \$request)
    {
        \$request->validate([
            'action' => 'required|string',
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:products,id'
        ]);

        \$action = \$request->action;
        \$ids = \$request->ids;

        DB::beginTransaction();
        try {
            switch (\$action) {
                case 'active_home':
                    Product::whereIn('id', \$ids)->update(['is_featured' => true]);
                    break;
                case 'deactive_home':
                    Product::whereIn('id', \$ids)->update(['is_featured' => false]);
                    break;
                case 'active_product':
                    Product::whereIn('id', \$ids)->update(['is_active' => true]);
                    break;
                case 'deactive_product':
                    Product::whereIn('id', \$ids)->update(['is_active' => false]);
                    break;
                // Add more cases here (like product_type) if needed
            }

            DB::commit();
            \$this->invalidateProductCache();
            return \$this->sendResponse(null, 'Bulk action completed successfully.');
        } catch (\Exception \$e) {
            DB::rollBack();
            return \$this->sendError('Failed to perform bulk action.', \$e->getMessage());
        }
    }
}
EOT;

    $code = preg_replace('/}\s*$/', "\n$bulkMethod\n}", $code);
    file_put_contents($file, $code);
    echo "ProductController updated.\n";
} else {
    echo "bulkAction already exists.\n";
}
?>
