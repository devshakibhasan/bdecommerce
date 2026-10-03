<?php
$f = __DIR__ . '/src/lib/api.ts';
$c = file_get_contents($f);

$search = "  categories = {";
$replace = "  brands = {\n" .
"    list: () => this.get('/brands'),\n" .
"  };\n\n" .
"  productTypes = {\n" .
"    list: () => this.get('/product-types'),\n" .
"  };\n\n" .
"  categories = {";

file_put_contents($f, str_replace($search, $replace, $c));
echo "API endpoints added to api.ts\n";
