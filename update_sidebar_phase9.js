const fs = require('fs');
let path = 'src/components/admin/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Inject Custom Pages into the Landing Pages & CMS submenu
if (!content.includes('Custom Pages Builder')) {
    content = content.replace(
        "{ title: 'Hero Sliders', path: '/admin/sliders' }",
        "{ title: 'Hero Sliders', path: '/admin/sliders' },\n      { title: 'Custom Pages Builder', path: '/admin/cms/custom-pages' }"
    );
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Sidebar updated with Phase 9 Custom Pages.');
} else {
    console.log('Sidebar already has Phase 9 items.');
}
