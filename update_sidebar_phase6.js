const fs = require('fs');
let path = 'src/components/admin/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Inject POS Terminal into the Sales & CRM submenu
if (!content.includes('POS Terminal')) {
    content = content.replace(
        "{ title: 'Lost Customers', path: '/admin/lost-customers' }",
        "{ title: 'POS Terminal', path: '/admin/pos' },\n      { title: 'Lost Customers', path: '/admin/lost-customers' }"
    );
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Sidebar updated with POS Terminal.');
} else {
    console.log('Sidebar already has POS Terminal.');
}
