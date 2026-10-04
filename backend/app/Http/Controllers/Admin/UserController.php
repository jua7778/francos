<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::with('role')->orderBy('name')->get());
    }

    public function roles(): JsonResponse
    {
        return response()->json(Role::orderBy('id')->get()->map(fn (Role $role) => [
            'id' => $role->id,
            'slug' => $role->slug->value,
            'name' => $role->name,
            'description' => $role->description,
        ]));
    }

    public function store(UserRequest $request): JsonResponse
    {
        $user = User::create($this->payload($request));

        return response()->json(['message' => 'Usuario creado.', 'user' => new UserResource($user->load('role'))], 201);
    }

    public function update(UserRequest $request, User $user): JsonResponse
    {
        $data = $this->payload($request);

        // Evita que el administrador se quite a sí mismo el acceso por error.
        if ($user->is($request->user()) && ($data['role_id'] !== $user->role_id || ! ($data['is_active'] ?? true))) {
            return response()->json(['message' => 'No puede cambiar su propio rol ni desactivarse.'], 422);
        }

        $user->update($data);

        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        return response()->json(['message' => 'Usuario guardado.', 'user' => new UserResource($user->load('role'))]);
    }

    /** Los usuarios no se borran (quedan en el historial de pedidos): se desactivan. */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->is($request->user())) {
            return response()->json(['message' => 'No puede desactivar su propio usuario.'], 422);
        }

        $user->update(['is_active' => false]);
        $user->tokens()->delete();

        return response()->json(['message' => "{$user->name} fue desactivado."]);
    }

    private function payload(UserRequest $request): array
    {
        $data = $request->validated();
        $data['username'] = mb_strtolower($data['username']);
        $data['role_id'] = (int) $data['role_id'];

        if (empty($data['password'])) {
            unset($data['password']);
        }

        return $data;
    }
}
