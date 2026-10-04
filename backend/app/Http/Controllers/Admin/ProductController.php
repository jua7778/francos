<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\DailyMenuItem;
use App\Models\Product;
use App\Services\ChangeTracker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function __construct(private ChangeTracker $changes) {}

    /** Todos los productos, incluidos los desactivados. */
    public function index(): AnonymousResourceCollection
    {
        return ProductResource::collection(
            Product::with('category')->orderBy('sort_order')->orderBy('name')->get(),
        );
    }

    public function store(ProductRequest $request): JsonResponse
    {
        $product = new Product($request->safe()->except(['image', 'remove_image']));
        $product->sort_order = (int) Product::where('category_id', $product->category_id)->max('sort_order') + 1;

        if ($request->hasFile('image')) {
            $product->image_path = $request->file('image')->store('products', 'public');
        }

        $product->save();
        $this->changes->touch('catalog');

        return response()->json([
            'message' => 'Producto guardado.',
            'product' => new ProductResource($product->load('category')),
        ], 201);
    }

    public function update(ProductRequest $request, Product $product): JsonResponse
    {
        $product->fill($request->safe()->except(['image', 'remove_image']));

        if ($request->hasFile('image') || $request->boolean('remove_image')) {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $product->image_path = $request->hasFile('image')
                ? $request->file('image')->store('products', 'public')
                : null;
        }

        $product->save();
        $this->changes->touch('catalog');

        return response()->json([
            'message' => 'Producto guardado.',
            'product' => new ProductResource($product->load('category')),
        ]);
    }

    /**
     * Si el producto ya se vendió o está en un Menú del Día, solo se desactiva
     * para no romper el historial. Si nunca se usó, se elimina.
     */
    public function destroy(Product $product): JsonResponse
    {
        $used = $product->orderItems()->exists()
            || DailyMenuItem::where('product_id', $product->id)->exists();

        if ($used) {
            $product->update(['is_active' => false]);
            $message = 'Producto desactivado. Se conserva en los pedidos anteriores.';
        } else {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $product->delete();
            $message = 'Producto eliminado.';
        }

        $this->changes->touch('catalog');

        return response()->json(['message' => $message]);
    }
}
