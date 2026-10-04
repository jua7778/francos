<?php

namespace App\Services;

use App\Enums\MenuSlot;
use App\Models\DailyMenu;
use App\Models\Product;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DailyMenuService
{
    public function __construct(private ChangeTracker $changes) {}

    /**
     * Crea o actualiza un menú del día con sus componentes.
     *
     * @param  array{name: string, price: int, is_available: bool, menu_date?: string, components: array<string, int|null>}  $data
     */
    public function save(array $data, ?DailyMenu $menu = null): DailyMenu
    {
        $this->ensureComponentsMatchSlots($data['components']);

        $menu = DB::transaction(function () use ($data, $menu) {
            $menu ??= new DailyMenu(['menu_date' => $data['menu_date'] ?? today()->toDateString()]);
            $menu->fill([
                'name' => $data['name'],
                'price' => $data['price'],
                'is_available' => $data['is_available'],
            ])->save();

            foreach (MenuSlot::cases() as $slot) {
                $productId = $data['components'][$slot->value] ?? null;

                if ($productId) {
                    $menu->items()->updateOrCreate(['slot' => $slot->value], ['product_id' => $productId]);
                } else {
                    $menu->items()->where('slot', $slot->value)->delete();
                }
            }

            return $menu;
        });

        $this->changes->touch('catalog');

        return $menu->load('items.product');
    }

    /**
     * Copia los menús del último día que tenga menús hacia hoy,
     * para no tener que armarlos de nuevo cada mañana.
     *
     * @return int Cantidad de menús copiados.
     */
    public function copyLatestToToday(): int
    {
        $source = DailyMenu::whereDate('menu_date', '<', today())->max('menu_date');

        if (! $source) {
            throw ValidationException::withMessages(['menu' => 'No hay menús de días anteriores para copiar.']);
        }

        $copied = DB::transaction(function () use ($source) {
            $existing = DailyMenu::forToday()->pluck('name')->all();
            $count = 0;

            $menus = DailyMenu::with('items')->whereDate('menu_date', Carbon::parse($source))->get();

            foreach ($menus as $menu) {
                if (in_array($menu->name, $existing, true)) {
                    continue;
                }

                $copy = DailyMenu::create([
                    'menu_date' => today(),
                    'name' => $menu->name,
                    'price' => $menu->price,
                    'is_available' => true,
                ]);

                foreach ($menu->items as $item) {
                    $copy->items()->create(['slot' => $item->slot->value, 'product_id' => $item->product_id]);
                }
                $count++;
            }

            return $count;
        });

        $this->changes->touch('catalog');

        return $copied;
    }

    /**
     * Cada componente debe venir de una categoría asignada a ese componente
     * (ej. la sopa debe ser un producto de una categoría marcada como "Sopa").
     *
     * @param  array<string, int|null>  $components
     */
    private function ensureComponentsMatchSlots(array $components): void
    {
        foreach ($components as $slot => $productId) {
            if (! $productId) {
                continue;
            }

            $product = Product::with('category')->find($productId);

            if (! $product || $product->category->menu_slot?->value !== $slot) {
                throw ValidationException::withMessages([
                    "components.{$slot}" => 'El producto elegido no corresponde a '.MenuSlot::from($slot)->label().'.',
                ]);
            }
        }
    }
}
