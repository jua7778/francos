<?php

namespace App\Http\Resources;

use App\Enums\OrderStatus;
use App\Enums\TicketStatus;
use App\Models\KitchenTicket;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\DiningTable */
class TableResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $order = $this->relationLoaded('openOrder') ? $this->openOrder : null;

        return [
            'id' => $this->id,
            'number' => $this->number,
            'name' => $this->name,
            'label' => $this->label(),
            'seats' => $this->seats,
            'is_active' => $this->is_active,
            'state' => $this->when($this->relationLoaded('openOrder'), fn () => $this->state($order)),
            'order' => $order ? [
                'id' => $order->id,
                'status' => $order->status->value,
                'total' => $order->total,
                'created_at' => $order->created_at->toIso8601String(),
                'waiter' => $order->relationLoaded('waiter') ? $order->waiter->name : null,
            ] : null,
        ];
    }

    /**
     * Estado visual de la mesa para el mesero:
     * disponible, ocupada, en_preparacion, listo o pendiente_pago.
     */
    private function state($order): string
    {
        if (! $order) {
            return 'disponible';
        }
        if ($order->status === OrderStatus::EnCaja) {
            return 'pendiente_pago';
        }

        $tickets = $order->tickets;

        // "Listo" tiene prioridad: hay comida esperando a que el mesero la lleve.
        if ($tickets->contains(fn (KitchenTicket $t) => $t->status === TicketStatus::Listo)) {
            return 'listo';
        }
        if ($tickets->contains(fn (KitchenTicket $t) => $t->status->isInKitchen())) {
            return 'en_preparacion';
        }

        return 'ocupada';
    }
}
