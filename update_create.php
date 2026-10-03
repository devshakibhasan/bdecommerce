<?php
$file = "c:/xampp/htdocs/bd-ecommerce/frontend/src/app/admin/products/create/page.tsx";
$code = file_get_contents($file);

// 1. Add fields to formData
$code = str_replace(
    "category_id: '',",
    "category_id: '',\n    brand_id: '',\n    product_type_id: '',",
    $code
);

// 2. Add queries for brands and product types
$queries = <<<EOT
  // 1. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-select'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/categories');
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['admin-brands-select'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/brands');
        return res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['admin-product-types-select'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/product-types');
        return res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });
EOT;

$code = preg_replace("/\/\/ 1\. Fetch Categories.*?\}\n  \}\);\n/s", $queries, $code);

// 3. Update payload
$code = str_replace(
    "category_id: formData.category_id ? parseInt(formData.category_id) : undefined,",
    "category_id: formData.category_id ? parseInt(formData.category_id) : undefined,\n          brand_id: formData.brand_id ? parseInt(formData.brand_id) : undefined,\n          product_type_id: formData.product_type_id ? parseInt(formData.product_type_id) : undefined,",
    $code
);

// 4. Update the UI layout
$ui = <<<EOT
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">URL Slug</label>
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    Generate
                  </button>
                </div>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">SKU Prefix</label>
                <input
                  type="text"
                  name="sku_prefix"
                  value={formData.sku_prefix}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-mono uppercase focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name_en}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Brand</label>
                <select
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="">Select Brand</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name_en}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Product Type</label>
                <select
                  name="product_type_id"
                  value={formData.product_type_id}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="">Select Type</option>
                  {productTypes.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
EOT;

$code = preg_replace("/<div className=\"grid grid-cols-1 sm:grid-cols-3 gap-4\">.*?<\/div>\n\n            {\/\* Pricing Grid \*\/}/s", $ui . "\n\n            {/* Pricing Grid */}", $code);

file_put_contents($file, $code);
echo "DONE\n";
?>
