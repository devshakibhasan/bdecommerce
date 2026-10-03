<?php
$file = __DIR__ . '/src/app/admin/categories/page.tsx';
$code = file_get_contents($file);

$code = str_replace(
    "api.post('/admin/categories', payload, { headers: { 'Content-Type': 'multipart/form-data' }})",
    "api.post('/admin/categories', payload)",
    $code
);

$code = str_replace(
    "api.post(`/admin/categories/\${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' }})",
    "api.post(`/admin/categories/\${id}`, payload)",
    $code
);

file_put_contents($file, $code);
echo "Fixed FormData Content-Type header bug!\n";
