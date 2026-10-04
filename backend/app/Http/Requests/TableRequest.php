<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TableRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'number' => ['required', 'integer', 'min:1', 'max:999', Rule::unique('tables', 'number')->ignore($this->route('table'))],
            'name' => ['nullable', 'string', 'max:40'],
            'seats' => ['required', 'integer', 'min:1', 'max:50'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return ['number.unique' => 'Ya existe una mesa con ese número.'];
    }
}
