<?php

namespace Database\Factories;

use App\Enums\RoleSlug;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => fake()->unique()->userName(),
            'role_id' => fn () => Role::idFor(RoleSlug::Mesero),
            'is_active' => true,
            'password' => 'secreto123',
        ];
    }

    public function role(RoleSlug $slug): static
    {
        return $this->state(fn () => ['role_id' => Role::idFor($slug)]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
