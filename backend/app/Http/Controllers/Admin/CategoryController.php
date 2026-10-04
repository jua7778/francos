<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\ChangeTracker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function __construct(private ChangeTracker $changes) {}

    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(
            Category::withCount('products')->orderBy('sort_order')->orderBy('name')->get(),
        );
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated() + ['sort_order' => (int) Category::max('sort_order') + 1]);
        $this->changes->touch('catalog');

        return response()->json(['message' => 'Categoría creada.', 'category' => new CategoryResource($category)], 201);
    }

    public function update(CategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());
        $this->changes->touch('catalog');

        return response()->json(['message' => 'Categoría guardada.', 'category' => new CategoryResource($category)]);
    }

    /** Solo se borra si está vacía; si tiene productos se debe desactivar. */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Esta categoría tiene productos. Puede desactivarla para ocultarla.',
            ], 422);
        }

        $category->delete();
        $this->changes->touch('catalog');

        return response()->json(['message' => 'Categoría eliminada.']);
    }
}
