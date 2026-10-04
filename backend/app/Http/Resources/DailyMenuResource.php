<?php

namespace App\Http\Resources;

use App\Enums\MenuSlot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\DailyMenu */
class DailyMenuResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $components = collect(MenuSlot::cases())
            ->map(function (MenuSlot $slot) {
                $item = $this->componentFor($slot);

                return $item ? [
                    'slot' => $slot->value,
                    'label' => $slot->label(),
                    'icon' => $slot->icon(),
                    'product_id' => $item->product_id,
                    'name' => $item->product->name,
                    'is_available' => $item->product->is_available && $item->product->is_active,
                ] : null;
            })
            ->filter()
            ->values();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'menu_date' => $this->menu_date->toDateString(),
            'price' => $this->price,
            'is_available' => $this->is_available,
            'is_sellable' => $this->isSellable(),
            'sold_out_components' => $this->soldOutComponents(),
            'components' => $components,
            'orders_count' => $this->whenCounted('orderItems'),
        ];
    }
}
