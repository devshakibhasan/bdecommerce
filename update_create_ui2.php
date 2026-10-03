<?php
$file = "c:/xampp/htdocs/bd-ecommerce/frontend/src/app/admin/products/create/page.tsx";
$code = file_get_contents($file);

$replace = <<<EOT
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
EOT;

$code = preg_replace('/<div>\s*<label className="text-xs font-bold text-foreground">Category<\/label>\s*<select\s*name="category_id"\s*value=\{formData\.category_id\}\s*onChange=\{handleChange\}\s*className="[^"]+"\s*>\s*<option value="">Select Category<\/option>\s*\{categories\.map\(\(cat: any\) => \(\s*<option key=\{cat\.id\} value=\{cat\.id\}>\{cat\.name_en\}<\/option>\s*\)\)\}\s*<\/select>\s*<\/div>/s', $replace, $code);

file_put_contents($file, $code);
echo "DONE\n";
?>
