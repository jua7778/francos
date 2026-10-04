<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Si el administrador desactiva a un usuario, su sesión deja de funcionar de inmediato.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->is_active) {
            $user->currentAccessToken()?->delete();
            abort(401, 'Su usuario está desactivado. Hable con el administrador.');
        }

        return $next($request);
    }
}
