<?php

namespace App\Http\Middleware;

use App\Enums\RoleSlug;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Uso en rutas: ->middleware('role:mesero,caja').
 * El administrador tiene acceso completo, por eso siempre pasa.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        $allowed = array_map(fn (string $role) => RoleSlug::from($role), $roles);

        if (! $user || (! $user->isAdmin() && ! $user->hasRole(...$allowed))) {
            abort(403, 'No tiene permiso para entrar a esta sección.');
        }

        return $next($request);
    }
}
