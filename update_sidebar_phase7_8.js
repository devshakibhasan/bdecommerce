const fs = require('fs');
let path = 'src/components/admin/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Inject Couriers and Pixels into the Settings & System submenu
if (!content.includes('Courier APIs')) {
    content = content.replace(
        "{ title: 'Theme Changer', path: '/admin/theme' }",
        "{ title: 'Theme Changer', path: '/admin/theme' },\n      { title: 'Courier APIs', path: '/admin/settings/couriers' },\n      { title: 'Marketing Pixels', path: '/admin/settings/pixels' }"
    );
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Sidebar updated with Phase 7 & 8 links.');
} else {
    console.log('Sidebar already has Phase 7 & 8 items.');
}
