<?php
$source = __DIR__ . '/src/app/admin/products/[id]/edit/page.tsx';
$dest = __DIR__ . '/src/app/admin/products/create/page.tsx';

if (!file_exists($source)) die("Source not found");

$content = file_get_contents($source);

// 1. Rename Component
$content = str_replace('export default function EditProductPage()', 'export default function CreateProductPage()', $content);

// 2. Remove useParams
$content = str_replace('const { id } = useParams();', '', $content);

// 3. Remove product fetching
$content = preg_replace('/const \{ data: product, isLoading: isProductLoading \} = useQuery\(\{[^}]+\}\);/s', '', $content);

// 4. Remove useEffect
$content = preg_replace('/useEffect\(\(\) => \{.*?\}, \[product\]\);/s', '', $content);

// 5. Change submit endpoint
$content = preg_replace('/api\.put\(\`\/admin\/products\/\$\{id\}\`, payload\)/', "api.post('/admin/products', payload)", $content);

// Redirect to edit page
$redirectLogic = "toast.success('Product created successfully! Redirecting...');\n      if(res?.data?.data?.id) {\n        router.push(`/admin/products/\${res.data.data.id}/edit`);\n      } else {\n        router.push('/admin/products');\n      }";
$content = preg_replace('/toast\.success\(\'Product updated successfully!\'\);/', $redirectLogic, $content);

// 6. Disable image upload mutations
$imageUploadReplacement = "const imageUploadMutation = useMutation({
    mutationFn: async () => {
      toast.error('Please save the product first before uploading images.');
      throw new Error('No ID');
    }
  });";
$content = preg_replace('/const imageUploadMutation = useMutation\(\{[^}]+\}\);/s', $imageUploadReplacement, $content);

$content = str_replace('Edit Product', 'Add Product', $content);
$content = str_replace('Edit product details, variants, and images', 'Create new product details', $content);
$content = preg_replace('/if \(isProductLoading\) \{.*?\}\s*return/s', 'return', $content);
$content = preg_replace('/const deleteMutation = useMutation\(\{[^}]+\}\);/s', "const deleteMutation = useMutation({ mutationFn: async () => {} });", $content);

file_put_contents($dest, $content);
echo "Successfully cloned Edit to Create!";
