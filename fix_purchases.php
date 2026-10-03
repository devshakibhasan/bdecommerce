<?php
$c = file_get_contents('src/app/admin/purchases/page.tsx');
$c = preg_replace('/\{\/\* Supplier Modal \*\/\}.*?<\/Modal>\s*<\/div>/is', '', $c);
file_put_contents('src/app/admin/purchases/page.tsx', $c);
echo "Done";
