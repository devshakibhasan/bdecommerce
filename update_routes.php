<?php
$file = "c:/xampp/htdocs/bd-ecommerce/backend/routes/api.php";
$code = file_get_contents($file);

if (strpos($code, "Route::post('/products/bulk-action'") === false) {
    // We need to place it before Route::apiResource('products'
    $code = str_replace(
        "Route::apiResource('products', \App\Http\Controllers\Api\V1\Catalog\ProductController::class);",
        "Route::post('/products/bulk-action', [\App\Http\Controllers\Api\V1\Catalog\ProductController::class, 'bulkAction']);\n            Route::apiResource('products', \App\Http\Controllers\Api\V1\Catalog\ProductController::class);",
        $code
    );
    file_put_contents($file, $code);
    echo "api.php updated.\n";
} else {
    echo "Route already exists.\n";
}
?>
