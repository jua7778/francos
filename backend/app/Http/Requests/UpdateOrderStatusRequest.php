<?php

namespace App\Http\Requests;

use App\Enums\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Cambios de estado que se piden manualmente sobre el pedido.
 * Los demás estados (pendiente, en preparación, listo) los calcula el sistema
 * a partir de las comandas, y "pagado" se registra con POST /api/payments.
 */
class UpdateOrderStatusRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([OrderStatus::EnCaja->value, OrderStatus::Cancelado->value])],
            'reason' => ['nullable', 'string', 'max:200'],
        ];
    }

    public function status(): OrderStatus
    {
        return OrderStatus::from($this->validated('status'));
    }
}
