<?php
$file = 'C:/Users/shaki/.gemini/antigravity/brain/bfd28f69-46eb-413f-9e5e-54fbbf29c441/implementation_plan.md';
$content = file_get_contents($file);

$content = str_replace('### Phase 4: Finance & Accounting', '### Phase 4: Finance & Accounting [COMPLETED]', $content);
$content = str_replace('### Phase 5: Human Resource Management (HRM)', '### Phase 5: Human Resource Management (HRM) [COMPLETED]', $content);

file_put_contents($file, $content);
echo "Implementation plan updated.\n";
