<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ChangeTracker;
use Illuminate\Http\Request;

/**
 * Cocina (o admin) marca un producto como agotado o disponible con un clic.
 */
class ProductAvailabilityController extends Controller
{
    public function __invoke(Request $request, Product $product, ChangeTracker $changes): ProductResource
    {
        $data = $request->validate(['is_available' => ['required', 'boolean']]);

        $product->update(['is_available' => $data['is_available']]);
        $changes->touch('catalog');

        return new ProductResource($product->load('category'));
    }
}
