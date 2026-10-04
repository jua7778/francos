<?php

namespace App\Http\Requests;

use App\Enums\MenuSlot;
use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:60', Rule::unique('categories', 'name')->ignore($this->route('category'))],
            'icon' => ['required', 'string', 'max:16'],
            'section' => ['required', Rule::in(Category::SECTIONS)],
            'menu_slot' => ['nullable', Rule::enum(MenuSlot::class)],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Escriba el nombre de la categoría.',
            'name.unique' => 'Ya existe una categoría con ese nombre.',
        ];
    }
}
