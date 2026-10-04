<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['table_id', 'waiter_id', 'status', 'total', 'sent_to_cashier_at', 'paid_at', 'cancelled_at', 'cancelled_by', 'cancel_reason'])]
class Order extends Model
{
    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'total' => 'integer',
            'sent_to_cashier_at' => 'datetime',
            'paid_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }

    public function waiter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'waiter_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(KitchenTicket::class)->orderBy('sequence');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function scopeOpen(Builder $query): void
    {
        $query->whereIn('status', OrderStatus::openValues());
    }

    public function isOpen(): bool
    {
        return $this->status->isOpen();
    }

    /** ¿Hay comandas que cocina todavía no termina? */
    public function hasTicketsInKitchen(): bool
    {
        return $this->tickets->contains(fn (KitchenTicket $t) => $t->status->isInKitchen());
    }

    /** ¿Cocina ya empezó alguna comanda? (define si el mesero todavía puede cancelar). */
    public function hasStartedTickets(): bool
    {
        return $this->tickets->contains(
            fn (KitchenTicket $t) => ! in_array($t->status, [TicketStatus::Pendiente, TicketStatus::Cancelado], true),
        );
    }
}
