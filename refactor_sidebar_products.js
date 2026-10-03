const fs = require('fs');

let content = fs.readFileSync('src/components/admin/Sidebar.tsx', 'utf-8');

// 1. Remove individual top-level items to avoid duplication
content = content.replace(/\{ href: '\/admin\/categories', label: 'Categories'.*?\},\n\s*/g, '');
content = content.replace(/\{ href: '\/admin\/attributes', label: 'Attributes & Specs'.*?\},\n\s*/g, '');
content = content.replace(/\{ href: '\/admin\/tags', label: 'Tags & Badges'.*?\},\n\s*/g, '');

// 2. Locate the existing top-level Products entry and replace it with the new grouped structure
const newProductsGroup = `{ 
      href: '/admin/products', 
      label: 'Products', 
      icon: Package, 
      allowedRoles: ['super_admin', 'store_manager'],
      subItems: [
        { href: '/admin/products', label: 'Product List' },
        { href: '/admin/products/create', label: 'Add Product' },
        { href: '/admin/categories', label: 'Categories' },
        { href: '/admin/attributes', label: 'Attributes & Specs' },
        { href: '/admin/tags', label: 'Tags & Badges' },
        { href: '/admin/brands', label: 'Brands' },
        { href: '/admin/product-types', label: 'Product Types' },
        { href: '/admin/products/print-barcode', label: 'Print Barcode' },
        { href: '/admin/inventory/adjustments', label: 'Adjustment List' },
        { href: '/admin/inventory/adjustments/create', label: 'Add Adjustment' },
        { href: '/admin/products/reviews', label: 'Product Reviews' },
        { href: '/admin/pages', label: 'Landing Pages' },
        { href: '/admin/media', label: 'Media Library' }
      ]
    },`;

content = content.replace(/\{ href: '\/admin\/products', label: 'Products', icon: Package, allowedRoles: \['super_admin', 'store_manager'\] \},/, newProductsGroup);

fs.writeFileSync('src/components/admin/Sidebar.tsx', content);
console.log('Sidebar perfectly updated with Products submenu.');
