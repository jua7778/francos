<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function rules(): array
    {
        $creating = $this->route('user') === null;

        return [
            'name' => ['required', 'string', 'max:80'],
            'username' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('users', 'username')->ignore($this->route('user'))],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'is_active' => ['boolean'],
            'password' => [$creating ? 'required' : 'nullable', 'string', 'min:4', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.unique' => 'Ese usuario ya existe. Elija otro.',
            'username.alpha_dash' => 'El usuario solo puede tener letras, números y guiones (sin espacios).',
            'password.required' => 'Escriba una contraseña.',
            'password.min' => 'La contraseña debe tener al menos 4 caracteres.',
        ];
    }
}
