<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'is_active' => $this->is_active,
            'role' => [
                'id' => $this->role->id,
                'slug' => $this->role->slug->value,
                'name' => $this->role->name,
            ],
        ];
    }
}
