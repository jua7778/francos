<?php

namespace App\Models;

use App\Enums\MenuSlot;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['menu_date', 'name', 'price', 'is_available'])]
class DailyMenu extends Model
{
    protected function casts(): array
    {
        return [
            'menu_date' => 'date:Y-m-d',
            'price' => 'integer',
            'is_available' => 'boolean',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(DailyMenuItem::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function scopeForToday(Builder $query): void
    {
        $query->whereDate('menu_date', today());
    }

    public function componentFor(MenuSlot $slot): ?DailyMenuItem
    {
        return $this->items->first(fn (DailyMenuItem $item) => $item->slot === $slot);
    }

    /**
     * Regla de negocio: el menú se puede vender si está marcado como disponible
     * y su plato principal existe y no está agotado. Si falta otro componente
     * (ej. la sopa) se muestra un aviso, pero el menú se sigue vendiendo.
     */
    public function isSellable(): bool
    {
        $principal = $this->componentFor(MenuSlot::Principal)?->product;

        return $this->is_available && $principal !== null && $principal->is_active && $principal->is_available;
    }

    /** @return list<string> Nombres de los componentes agotados. */
    public function soldOutComponents(): array
    {
        return $this->items
            ->filter(fn (DailyMenuItem $item) => ! $item->product->is_available || ! $item->product->is_active)
            ->map(fn (DailyMenuItem $item) => $item->product->name)
            ->values()
            ->all();
    }
}
