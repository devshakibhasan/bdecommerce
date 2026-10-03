<?php
$file = 'src/app/admin/purchases/page.tsx';
$c = file_get_contents($file);

$search = "          Suppliers Directory\n        </button>\n      \n\n      {activeTab === 'orders' && (";
$replace = "          Suppliers Directory\n        </button>\n      </div>\n\n      {activeTab === 'orders' && (";

$c = str_replace($search, $replace, $c);
file_put_contents($file, $c);
echo "Done";
