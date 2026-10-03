const fs = require('fs');
let path = 'src/components/admin/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Inject Warehouses and Stock Transfers into the Stock & Inventory submenu
if (!content.includes('Warehouses')) {
    content = content.replace(
        "{ title: 'Smart Restock', path: '/admin/inventory/restock' }",
        "{ title: 'Smart Restock', path: '/admin/inventory/restock' },\n      { title: 'Warehouses', path: '/admin/inventory/warehouses' },\n      { title: 'Stock Transfers', path: '/admin/inventory/stock-transfers' }"
    );
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Sidebar updated with Phase 3 links.');
} else {
    console.log('Sidebar already has Phase 3 items.');
}
