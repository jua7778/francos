<?php

namespace App\Http\Controllers;

use App\Enums\TicketStatus;
use App\Http\Requests\UpdateTicketStatusRequest;
use App\Http\Resources\TicketResource;
use App\Models\KitchenTicket;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class TicketController extends Controller
{
    public function __construct(private OrderService $orders) {}

    /**
     * Tablero de cocina: comandas pendientes y en preparación (las más antiguas primero),
     * más las que se marcaron listas en los últimos 20 minutos por si hay que deshacer.
     */
    public function kitchen(): AnonymousResourceCollection
    {
        $tickets = KitchenTicket::with(['items', 'order.table', 'creator'])
            ->where(fn ($q) => $q
                ->whereIn('status', [TicketStatus::Pendiente->value, TicketStatus::EnPreparacion->value])
                ->orWhere(fn ($q) => $q->where('status', TicketStatus::Listo->value)->where('ready_at', '>=', now()->subMinutes(20))))
            ->oldest()
            ->get();

        return TicketResource::collection($tickets);
    }

    public function updateStatus(UpdateTicketStatusRequest $request, KitchenTicket $ticket): JsonResponse
    {
        $to = $request->status();
        Gate::authorize('changeStatus', [$ticket, $to]);

        $ticket = $this->orders->changeTicketStatus($ticket, $to);
        $label = $ticket->order->table->label();

        return response()->json([
            'message' => match ($to) {
                TicketStatus::EnPreparacion => "Preparando pedido de {$label}.",
                TicketStatus::Listo => "Pedido de {$label} listo.",
                TicketStatus::Entregado => "Pedido de {$label} entregado.",
                TicketStatus::Cancelado => "Comanda de {$label} cancelada.",
                default => 'Listo.',
            },
            'ticket' => new TicketResource($ticket),
        ]);
    }
}
