<?php

namespace App\Models;

use App\Enums\MenuSlot;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['daily_menu_id', 'slot', 'product_id'])]
class DailyMenuItem extends Model
{
    protected function casts(): array
    {
        return ['slot' => MenuSlot::class];
    }

    public function dailyMenu(): BelongsTo
    {
        return $this->belongsTo(DailyMenu::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
