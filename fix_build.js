const fs = require('fs');

function fixQueryClient() {
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
    }
}

function fixResLedger() {
    let path = 'src/app/admin/inventory/ledger/page.tsx';
    let content = fs.readFileSync(path, 'utf-8');
    content = content.replace(/res\.data/g, "res?.data");
    fs.writeFileSync(path, content, 'utf-8');
}

function fixResPurchases() {
    let path = 'src/app/admin/purchases/page.tsx';
    let content = fs.readFileSync(path, 'utf-8');
    content = content.replace(/res\.data/g, "res?.data");
    fs.writeFileSync(path, content, 'utf-8');
}

fixQueryClient();
// We'll check ledger and purchases first to be sure they just need `any` or something.
