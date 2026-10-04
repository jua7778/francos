<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Table(name: 'tables')]
#[Fillable(['number', 'name', 'seats', 'is_active'])]
class DiningTable extends Model
{
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }

    /** El pedido abierto de la mesa (como máximo uno, garantizado por índice único parcial). */
    public function openOrder(): HasOne
    {
        return $this->hasOne(Order::class, 'table_id')->whereIn('status', OrderStatus::openValues());
    }

    public function label(): string
    {
        return $this->name ?: "Mesa {$this->number}";
    }
}
