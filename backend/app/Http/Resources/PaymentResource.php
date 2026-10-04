<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Payment */
class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'amount' => $this->amount,
            'method' => $this->method->value,
            'method_label' => $this->method->label(),
            'received_amount' => $this->received_amount,
            'change_amount' => $this->change_amount,
            'paid_at' => $this->paid_at->toIso8601String(),
            'cashier' => $this->whenLoaded('cashier', fn () => $this->cashier->name),
            'table' => $this->whenLoaded('order', fn () => $this->order->relationLoaded('table') ? $this->order->table->label() : null),
        ];
    }
}
