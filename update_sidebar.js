const fs = require('fs');
let path = 'src/components/admin/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf-8');

const feedbackMenu = `
  {
    title: 'Feedback & Reviews',
    icon: <MessageSquare className="w-5 h-5" />,
    path: '/admin/feedback',
    roles: ['admin', 'manager'],
    submenu: [
      { title: 'Product Reviews', path: '/admin/feedback/reviews' },
      { title: 'Customer Complaints', path: '/admin/feedback/complaints' }
    ]
  },`;

const securityMenu = `
  {
    title: 'Security & Blocks',
    icon: <ShieldAlert className="w-5 h-5" />,
    path: '/admin/security',
    roles: ['admin', 'manager'],
    submenu: [
      { title: 'Blocked IPs', path: '/admin/security/blocked-ips' },
      { title: 'Blocked Phones', path: '/admin/security/blocked-phones' }
    ]
  },`;

// Look for 'Settings & System' section and add them before it.
if (!content.includes('Feedback & Reviews')) {
    content = content.replace(
        "{ title: 'Settings & System',",
        feedbackMenu + "\n" + securityMenu + "\n  { title: 'Settings & System',"
    );
    
    // Add imports for MessageSquare and ShieldAlert if they don't exist
    if (!content.includes('MessageSquare')) {
        content = content.replace('} from "lucide-react";', 'MessageSquare, ShieldAlert } from "lucide-react";');
    }
    
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Sidebar updated');
} else {
    console.log('Sidebar already has these items');
}
