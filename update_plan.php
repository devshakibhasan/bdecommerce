<?php
$file = 'C:/Users/shaki/.gemini/antigravity/brain/bfd28f69-46eb-413f-9e5e-54fbbf29c441/implementation_plan.md';
$content = file_get_contents($file);

$content = str_replace('### Phase 2: Returns & Quotations', '### Phase 2: Returns & Quotations [COMPLETED]', $content);
$content = str_replace('### Phase 3: Wholesale & Advanced Inventory', '### Phase 3: Wholesale & Advanced Inventory [PARTIALLY COMPLETED - Purchases Done]', $content);

file_put_contents($file, $content);
echo "Implementation plan updated.\n";
