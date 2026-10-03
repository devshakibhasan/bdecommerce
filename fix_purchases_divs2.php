<?php
$file = 'src/app/admin/purchases/page.tsx';
$c = file_get_contents($file);

$search = '        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-indigo-600 font-black">
            <ShoppingBag className="w-6 h-6" />
          
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Procurement & Purchases</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Manage suppliers, create purchase orders, and receive goods.
            </p>
          
        
      ';

$replace = '        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-indigo-600 font-black">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Procurement & Purchases</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Manage suppliers, create purchase orders, and receive goods.
            </p>
          </div>
        </div>
      </div>';

$c = str_replace($search, $replace, $c);
file_put_contents($file, $c);
echo "Done";
