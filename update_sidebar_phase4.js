const fs = require('fs');
let path = 'src/components/admin/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf-8');

const financeMenu = `
  {
    title: 'Finance & Accounting',
    icon: <CircleDollarSign className="w-5 h-5" />,
    path: '/admin/finance',
    roles: ['admin'],
    submenu: [
      { title: 'Income & Expenses', path: '/admin/finance/entries' },
      { title: 'Chart of Accounts', path: '/admin/finance/categories' }
    ]
  },`;

if (!content.includes('Finance & Accounting')) {
    content = content.replace(
        "{ title: 'Feedback & Reviews',",
        financeMenu + "\n  { title: 'Feedback & Reviews',"
    );
    
    // Add import for CircleDollarSign if not exists
    if (!content.includes('CircleDollarSign')) {
        content = content.replace('MessageSquare, ShieldAlert', 'CircleDollarSign, MessageSquare, ShieldAlert');
    }
    
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Sidebar updated with Phase 4 links.');
} else {
    console.log('Sidebar already has Phase 4 items.');
}
