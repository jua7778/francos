<?php

namespace App\Http\Controllers\Admin;

use App\Enums\MenuSlot;
use App\Http\Controllers\Controller;
use App\Http\Requests\DailyMenuRequest;
use App\Http\Resources\DailyMenuResource;
use App\Http\Resources\ProductResource;
use App\Models\DailyMenu;
use App\Models\Product;
use App\Services\ChangeTracker;
use App\Services\DailyMenuService;
use Illuminate\Http\JsonResponse;

class DailyMenuController extends Controller
{
    public function __construct(private DailyMenuService $service) {}

    /** Menús de hoy + las opciones de cada desplegable (productos agrupados por componente). */
    public function index(): JsonResponse
    {
        $options = [];
        foreach (MenuSlot::cases() as $slot) {
            $options[] = [
                'slot' => $slot->value,
                'label' => $slot->label(),
                'icon' => $slot->icon(),
                'required' => $slot === MenuSlot::Principal,
                'products' => ProductResource::collection(
                    Product::active()
                        ->whereHas('category', fn ($q) => $q->where('menu_slot', $slot->value))
                        ->orderBy('name')
                        ->get(),
                ),
            ];
        }

        return response()->json([
            'date' => today()->toDateString(),
            'menus' => DailyMenuResource::collection(
                DailyMenu::forToday()->with('items.product')->withCount('orderItems')->orderBy('name')->get(),
            ),
            'slots' => $options,
            'can_copy' => DailyMenu::whereDate('menu_date', '<', today())->exists(),
        ]);
    }

    public function store(DailyMenuRequest $request): JsonResponse
    {
        $menu = $this->service->save($request->validated());

        return response()->json(['message' => 'Menú del día guardado.', 'menu' => new DailyMenuResource($menu)], 201);
    }

    public function update(DailyMenuRequest $request, DailyMenu $dailyMenu): JsonResponse
    {
        $menu = $this->service->save($request->validated(), $dailyMenu);

        return response()->json(['message' => 'Menú del día guardado.', 'menu' => new DailyMenuResource($menu)]);
    }

    public function destroy(DailyMenu $dailyMenu, ChangeTracker $changes): JsonResponse
    {
        if ($dailyMenu->orderItems()->exists()) {
            $dailyMenu->update(['is_available' => false]);
            $message = 'Este menú ya se vendió hoy: se marcó como no disponible.';
        } else {
            $dailyMenu->delete();
            $message = 'Menú eliminado.';
        }

        $changes->touch('catalog');

        return response()->json(['message' => $message]);
    }

    public function copyLatest(): JsonResponse
    {
        $count = $this->service->copyLatestToToday();

        return response()->json([
            'message' => $count > 0
                ? "Se copiaron {$count} menú(s) del último día."
                : 'Los menús del último día ya estaban creados hoy.',
        ]);
    }
}
