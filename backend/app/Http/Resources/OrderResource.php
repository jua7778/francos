<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'total' => $this->total,
            'table' => $this->whenLoaded('table', fn () => [
                'id' => $this->table->id,
                'number' => $this->table->number,
                'label' => $this->table->label(),
            ]),
            'waiter' => $this->whenLoaded('waiter', fn () => $this->waiter->name),
            'created_at' => $this->created_at?->toIso8601String(),
            'sent_to_cashier_at' => $this->sent_to_cashier_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancel_reason' => $this->cancel_reason,
            'tickets' => TicketResource::collection($this->whenLoaded('tickets')),
            'payment' => new PaymentResource($this->whenLoaded('payment')),
            'can' => $this->when($request->user() !== null, fn () => [
                'cancel' => $this->isOpen() && $request->user()->can('cancel', $this->resource),
                'send_to_cashier' => $this->isOpen() && $request->user()->can('sendToCashier', $this->resource),
            ]),
        ];
    }
}
