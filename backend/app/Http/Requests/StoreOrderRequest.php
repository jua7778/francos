<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'table_id' => ['required', 'integer', 'exists:tables,id'],
            'items' => ['required', 'array', 'min:1', 'max:60'],
            'items.*.product_id' => ['nullable', 'integer', 'required_without:items.*.daily_menu_id', 'exists:products,id'],
            'items.*.daily_menu_id' => ['nullable', 'integer', 'required_without:items.*.product_id', 'exists:daily_menus,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
            'items.*.notes' => ['nullable', 'string', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'El pedido está vacío. Agregue al menos un producto.',
            'items.min' => 'El pedido está vacío. Agregue al menos un producto.',
            'items.*.quantity.max' => 'La cantidad máxima por producto es 50.',
            'items.*.notes.max' => 'La observación es muy larga (máximo 200 letras).',
        ];
    }
}
