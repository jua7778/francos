<?php

namespace App\Http\Controllers;

use App\Services\ChangeTracker;
use Illuminate\Http\JsonResponse;

/**
 * Consulta liviana que las pantallas hacen cada pocos segundos
 * para saber si deben recargar pedidos, carta o mesas.
 */
class PulseController extends Controller
{
    public function __invoke(ChangeTracker $changes): JsonResponse
    {
        return response()->json([
            'versions' => $changes->versions(),
            'server_time' => now()->toIso8601String(),
        ]);
    }
}
