<?php
$file = __DIR__ . '/src/app/admin/products/create/page.tsx';
$content = file_get_contents($file);

$search = "toast.success('Product details & image gallery updated successfully!');\n        syncEntityInCache(queryClient, 'product', updated);\n        refetch();";

$replace = "toast.success('Product created successfully! Redirecting to media upload...');\n        if(updated.id) {\n            router.push('/admin/products/' + updated.id + '/edit');\n        } else {\n            router.push('/admin/products');\n        }";

$content = str_replace($search, $replace, $content);
file_put_contents($file, $content);
echo "Fixed!";
