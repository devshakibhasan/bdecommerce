const fs = require('fs');
let path = 'src/components/admin/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Inject into Sidebar
if (!content.includes('Cart Rules & BOGO')) {
    content = content.replace(
        "{ title: 'Flash Sales Engine', path: '/admin/marketing/flash-sales' }",
        "{ title: 'Flash Sales Engine', path: '/admin/marketing/flash-sales' },\n      { title: 'Cart Rules & BOGO', path: '/admin/marketing/cart-rules' }"
    );
}

if (!content.includes('Social Login (OAuth)')) {
    content = content.replace(
        "{ title: 'SMS Gateways', path: '/admin/settings/sms-gateways' }",
        "{ title: 'SMS Gateways', path: '/admin/settings/sms-gateways' },\n      { title: 'Social Login (OAuth)', path: '/admin/settings/oauth' }"
    );
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Sidebar Updated for Phase 14!');
