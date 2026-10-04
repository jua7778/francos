<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'price' => ['required', 'integer', 'min:0', 'max:10000000'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_available' => ['boolean'],
            'is_active' => ['boolean'],
            'image' => ['nullable', 'image', 'max:4096'],
            'remove_image' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Escriba el nombre del producto.',
            'category_id.required' => 'Elija la categoría.',
            'price.required' => 'Escriba el precio.',
            'price.integer' => 'El precio debe ser un número sin puntos ni comas.',
            'image.image' => 'El archivo debe ser una foto (JPG, PNG o WEBP).',
            'image.max' => 'La foto es muy pesada (máximo 4 MB).',
        ];
    }
}
