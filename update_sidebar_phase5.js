const fs = require('fs');
let path = 'src/components/admin/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf-8');

const hrMenu = `
  {
    title: 'HR & Payroll',
    icon: <Users className="w-5 h-5" />,
    path: '/admin/hr',
    roles: ['admin', 'manager'],
    submenu: [
      { title: 'Employees', path: '/admin/hr/employees' },
      { title: 'Attendance', path: '/admin/hr/attendance' },
      { title: 'Payroll', path: '/admin/hr/payroll' }
    ]
  },`;

if (!content.includes('HR & Payroll')) {
    content = content.replace(
        "{ title: 'Customers & CRM',",
        hrMenu + "\n  { title: 'Customers & CRM',"
    );
    
    // Add import for Users if not exists
    if (!content.includes('Users')) {
        content = content.replace('CircleDollarSign, MessageSquare, ShieldAlert', 'CircleDollarSign, MessageSquare, ShieldAlert, Users');
    }
    
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Sidebar updated with Phase 5 links.');
} else {
    console.log('Sidebar already has Phase 5 items.');
}
