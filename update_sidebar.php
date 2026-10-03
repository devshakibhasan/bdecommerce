<?php
$file = 'src/components/admin/Sidebar.tsx';
$content = file_get_contents($file);

$ordersSubItems = <<<JS
      subItems: [
        { href: '/admin/orders', label: 'All Orders' },
        { href: '/admin/orders/create', label: 'Create New Order' }, 
        { href: '/admin/returns', label: 'Returns (RMA)', allowedRoles: ['super_admin', 'returns'] },
        { href: '/admin/quotations', label: 'Quotations', allowedRoles: ['super_admin', 'crm'] },
        { href: '/admin/orders/today-labels', label: 'Today Labels', allowedRoles: ['super_admin', 'order_pack'] },
JS;

$content = str_replace("      subItems: [\n        { href: '/admin/orders', label: 'All Orders' },\n        { href: '/admin/orders/create', label: 'Create New Order' }, \n        { href: '/admin/orders/today-labels', label: 'Today Labels', allowedRoles: ['super_admin', 'order_pack'] },", $ordersSubItems, $content);
file_put_contents($file, $content);
echo "Sidebar updated.\n";
