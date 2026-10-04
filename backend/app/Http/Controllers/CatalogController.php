<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Http\Resources\DailyMenuResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\DailyMenu;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Carta vigente (solo lectura). La usan mesero, cocina y caja.
 */
class CatalogController extends Controller
{
    /** Todo lo que el mesero necesita en una sola consulta: categorías, productos y menús de hoy. */
    public function catalog(): JsonResponse
    {
        return response()->json([
            'categories' => CategoryResource::collection($this->activeCategories()),
            'daily_menus' => DailyMenuResource::collection($this->todayMenus()),
        ]);
    }

    public function categories(): AnonymousResourceCollection
    {
        return CategoryResource::collection($this->activeCategories());
    }

    public function products(Request $request): AnonymousResourceCollection
    {
        $products = Product::active()
            ->with('category')
            ->whereHas('category', fn ($q) => $q->where('is_active', true))
            ->when($request->integer('category_id'), fn ($q, $id) => $q->where('category_id', $id))
            ->orderBy('sort_order')->orderBy('name')
            ->get();

        return ProductResource::collection($products);
    }

    public function dailyMenus(): AnonymousResourceCollection
    {
        return DailyMenuResource::collection($this->todayMenus());
    }

    private function activeCategories()
    {
        return Category::where('is_active', true)
            ->with(['products' => fn ($q) => $q->active()->orderBy('sort_order')->orderBy('name')])
            ->orderBy('sort_order')->orderBy('name')
            ->get();
    }

    private function todayMenus()
    {
        return DailyMenu::forToday()->with('items.product')->orderBy('name')->get();
    }
}
