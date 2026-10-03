const fs = require('fs');
let path = 'src/components/admin/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Inject Returns and Quotations into the Sales & CRM -> Orders submenu
if (!content.includes('Returns (RMA)')) {
    content = content.replace(
        "{ title: 'Lost Customers', path: '/admin/lost-customers' }",
        "{ title: 'Lost Customers', path: '/admin/lost-customers' },\n      { title: 'Returns (RMA)', path: '/admin/orders/returns' },\n      { title: 'Quotations', path: '/admin/orders/quotations' }"
    );
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Sidebar updated with Phase 2 links.');
} else {
    console.log('Sidebar already has Phase 2 items.');
}
