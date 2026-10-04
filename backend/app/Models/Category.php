<?php

namespace App\Models;

use App\Enums\MenuSlot;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'icon', 'section', 'menu_slot', 'sort_order', 'is_active'])]
class Category extends Model
{
    public const SECTIONS = ['comida', 'bebida'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'menu_slot' => MenuSlot::class,
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
