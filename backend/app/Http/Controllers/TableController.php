<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Http\Resources\TableResource;
use App\Models\DiningTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TableController extends Controller
{
    /** Mesas activas con su estado actual. */
    public function index(): AnonymousResourceCollection
    {
        $tables = DiningTable::where('is_active', true)
            ->with(['openOrder.tickets', 'openOrder.waiter'])
            ->orderBy('number')
            ->get();

        return TableResource::collection($tables);
    }

    /** Una mesa con el detalle completo de su pedido abierto (si tiene). */
    public function show(DiningTable $table): JsonResponse
    {
        $table->load(['openOrder.tickets.items', 'openOrder.tickets.creator', 'openOrder.waiter', 'openOrder.table']);

        return response()->json([
            'table' => new TableResource($table),
            'order' => $table->openOrder ? new OrderResource($table->openOrder) : null,
        ]);
    }
}
