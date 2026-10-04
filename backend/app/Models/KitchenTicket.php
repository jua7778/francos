<?php

namespace App\Models;

use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Comanda: un envío a cocina. El primer envío de la mesa es la secuencia 1
 * y cada pedido adicional crea una comanda nueva dentro del mismo pedido.
 */
#[Fillable(['order_id', 'sequence', 'status', 'created_by', 'started_at', 'ready_at', 'delivered_at', 'cancelled_at'])]
class KitchenTicket extends Model
{
    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'started_at' => 'datetime',
            'ready_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class)->orderBy('id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
