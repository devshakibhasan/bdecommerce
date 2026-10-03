<?php
$file = __DIR__ . '/src/app/admin/categories/page.tsx';
$code = file_get_contents($file);
$code = str_replace(
    "UploadCloud\n} from 'lucide-react';",
    "UploadCloud, Loader2\n} from 'lucide-react';",
    $code
);
file_put_contents($file, $code);
echo "Fixed Loader2 import\n";
