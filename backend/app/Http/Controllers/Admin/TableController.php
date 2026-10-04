<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TableRequest;
use App\Http\Resources\TableResource;
use App\Models\DiningTable;
use App\Services\ChangeTracker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TableController extends Controller
{
    public function __construct(private ChangeTracker $changes) {}

    public function index(): AnonymousResourceCollection
    {
        return TableResource::collection(DiningTable::with('openOrder.tickets')->orderBy('number')->get());
    }

    public function store(TableRequest $request): JsonResponse
    {
        $table = DiningTable::create($request->validated());
        $this->changes->touch('tables');

        return response()->json(['message' => "{$table->label()} creada.", 'table' => new TableResource($table)], 201);
    }

    public function update(TableRequest $request, DiningTable $table): JsonResponse
    {
        if (! $request->boolean('is_active', true) && $table->openOrder()->exists()) {
            return response()->json(['message' => 'No se puede desactivar: la mesa tiene un pedido abierto.'], 422);
        }

        $table->update($request->validated());
        $this->changes->touch('tables');

        return response()->json(['message' => "{$table->label()} guardada.", 'table' => new TableResource($table)]);
    }

    /** Si la mesa tiene pedidos históricos solo se desactiva. */
    public function destroy(DiningTable $table): JsonResponse
    {
        if ($table->openOrder()->exists()) {
            return response()->json(['message' => 'No se puede quitar: la mesa tiene un pedido abierto.'], 422);
        }

        if ($table->orders()->exists()) {
            $table->update(['is_active' => false]);
            $message = "{$table->label()} desactivada.";
        } else {
            $table->delete();
            $message = "{$table->label()} eliminada.";
        }

        $this->changes->touch('tables');

        return response()->json(['message' => $message]);
    }
}
