<?php

$catFile = __DIR__ . '/src/app/admin/categories/page.tsx';
$catCode = file_get_contents($catFile);

// Transform Categories to Brands
$brandCode = str_replace(
    ['admin-categories', 'api.categories.list()', 'categories', 'Category', 'category'],
    ['admin-brands', 'api.brands.list()', 'brands', 'Brand', 'brand'],
    $catCode
);

// We need to fix specific fields inside the form
// Remove Parent Category, Position, etc.
$brandCode = preg_replace('/<div className="space-y-1\.5">\s*<label className="text-xs font-bold ml-1">Parent Category<\/label>[\s\S]*?<\/div>\s*<\/div>/', '</div>', $brandCode);
$brandCode = preg_replace('/<div className="space-y-1\.5">\s*<label className="text-xs font-bold ml-1">Priority<\/label>[\s\S]*?<\/div>/', '', $brandCode);
$brandCode = preg_replace('/<div className="space-y-1\.5">\s*<label className="text-xs font-bold ml-1">CSS Class<\/label>[\s\S]*?<\/div>/', '', $brandCode);
$brandCode = preg_replace('/<div className="space-y-1\.5">\s*<label className="text-xs font-bold ml-1">Banner Image<\/label>[\s\S]*?<\/div>\s*<\/div>/', '</div></div>', $brandCode);
$brandCode = preg_replace('/<label className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border cursor-pointer hover:bg-slate-100 transition-colors">\s*<input type="checkbox" checked=\{formData.show_home\}[\s\S]*?<\/label>/', '', $brandCode);
$brandCode = preg_replace('/<label className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border cursor-pointer hover:bg-slate-100 transition-colors">\s*<input type="checkbox" checked=\{formData.show_menu\}[\s\S]*?<\/label>/', '', $brandCode);
$brandCode = preg_replace('/<label className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border cursor-pointer hover:bg-slate-100 transition-colors">\s*<input type="checkbox" checked=\{formData.is_featured\}[\s\S]*?<\/label>/', '', $brandCode);


file_put_contents(__DIR__ . '/src/app/admin/brands/page.tsx', $brandCode);
echo "Brands created\n";
