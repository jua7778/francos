<?php

namespace App\Http\Requests;

use App\Enums\MenuSlot;
use App\Models\DailyMenu;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DailyMenuRequest extends FormRequest
{
    public function rules(): array
    {
        /** @var DailyMenu|null $menu */
        $menu = $this->route('daily_menu');
        $date = $menu?->menu_date->toDateString() ?? today()->toDateString();

        $rules = [
            'name' => ['required', 'string', 'max:40', Rule::unique('daily_menus', 'name')->where('menu_date', $date)->ignore($menu)],
            'price' => ['required', 'integer', 'min:0', 'max:10000000'],
            'is_available' => ['required', 'boolean'],
            'components' => ['required', 'array'],
            'components.'.MenuSlot::Principal->value => ['required', 'integer', 'exists:products,id'],
        ];

        foreach (MenuSlot::cases() as $slot) {
            if ($slot !== MenuSlot::Principal) {
                $rules['components.'.$slot->value] = ['nullable', 'integer', 'exists:products,id'];
            }
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'Ya hay un menú de hoy con ese nombre.',
            'price.required' => 'Escriba el precio del menú.',
            'components.principal.required' => 'Elija el plato principal.',
        ];
    }
}
