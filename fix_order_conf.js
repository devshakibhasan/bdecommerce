const fs = require('fs');
let path = 'src/app/(storefront)/order-confirmation/[orderNumber]/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('useQueryClient')) {
    content = content.replace(
        "import { useParams, useSearchParams } from 'next/navigation';", 
        "import { useParams, useSearchParams } from 'next/navigation';\nimport { useQueryClient } from '@tanstack/react-query';"
    );
    content = content.replace(
        "const { locale } = useLocaleStore();",
        "const { locale } = useLocaleStore();\n  const queryClient = useQueryClient();"
    );
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Fixed queryClient');
} else {
    console.log('queryClient already imported');
}
