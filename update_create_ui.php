<?php
$file = "c:/xampp/htdocs/bd-ecommerce/frontend/src/app/admin/products/create/page.tsx";
$code = file_get_contents($file);

$search = <<<EOT
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
EOT;

$replace = <<<EOT
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

// Normalizing line endings for str_replace
$code = str_replace("\r\n", "\n", $code);
$search = str_replace("\r\n", "\n", $search);

$code = str_replace($search, $replace, $code);

file_put_contents($file, $code);
echo "DONE\n";
?>
