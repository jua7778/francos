<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\KitchenTicket */
class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'sequence' => $this->sequence,
            'is_additional' => $this->sequence > 1,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'created_at' => $this->created_at?->toIso8601String(),
            'started_at' => $this->started_at?->toIso8601String(),
            'ready_at' => $this->ready_at?->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'table' => $this->whenLoaded('order', fn () => $this->order->relationLoaded('table') ? [
                'id' => $this->order->table->id,
                'number' => $this->order->table->number,
                'label' => $this->order->table->label(),
            ] : null),
            'waiter' => $this->whenLoaded('creator', fn () => $this->creator->name),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
