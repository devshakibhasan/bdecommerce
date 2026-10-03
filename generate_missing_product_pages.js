const fs = require('fs');
const path = require('path');

function createPlaceholder(route, title) {
    const dir = path.join('src/app/admin', route);
    fs.mkdirSync(dir, { recursive: true });
    
    const content = `'use client';
export default function ${title.replace(/[^a-zA-Z]/g, '')}Page() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">${title}</h1>
      <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground shadow-sm">
        This module is currently being scaffolded. The backend database tables are ready.
      </div>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(dir, 'page.tsx'), content, 'utf-8');
}

createPlaceholder('products/create', 'Add New Product');
createPlaceholder('brands', 'Brands Management');
createPlaceholder('product-types', 'Product Types');
createPlaceholder('products/print-barcode', 'Print Barcodes');
createPlaceholder('inventory/adjustments', 'Quantity Adjustments');
createPlaceholder('inventory/adjustments/create', 'Add Adjustment');
createPlaceholder('products/reviews', 'Product Reviews');
createPlaceholder('media', 'Media Library');

console.log('Placeholder pages generated to prevent 404s.');
