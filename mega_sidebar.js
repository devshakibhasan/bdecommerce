const fs = require('fs');
let path = 'src/components/admin/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Sidebar injection logic
if (!content.includes('Marketplace')) {
    content = content.replace(
        "{ title: 'POS Terminal', path: '/admin/pos' },",
        "{ title: 'POS Terminal', path: '/admin/pos' },\n      { title: 'Multi-Vendor Marketplace', path: '/admin/marketplace/vendors' },"
    );
}

if (!content.includes('Flash Sales')) {
    content = content.replace(
        "{ title: 'Lost Customers', path: '/admin/lost-customers' }",
        "{ title: 'Lost Customers', path: '/admin/lost-customers' },\n      { title: 'Flash Sales Engine', path: '/admin/marketing/flash-sales' }"
    );
}

if (!content.includes('SMS Gateways')) {
    content = content.replace(
        "{ title: 'Marketing Pixels', path: '/admin/settings/pixels' }",
        "{ title: 'Marketing Pixels', path: '/admin/settings/pixels' },\n      { title: 'SMS Gateways', path: '/admin/settings/sms-gateways' }"
    );
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Sidebar Mega Updated!');
