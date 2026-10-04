<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\RoleSlug;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\TicketResource;
use App\Models\DiningTable;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    private const DETAIL_RELATIONS = ['table', 'waiter', 'tickets.items', 'tickets.creator', 'payment.cashier'];

    public function __construct(private OrderService $orders) {}

    /**
     * Lista de pedidos. Filtros: status (uno o varios separados por coma), date (Y-m-d), open=1.
     * El mesero solo ve pedidos abiertos; el historial es para caja y admin.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'status' => ['nullable', 'string'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'open' => ['nullable', 'boolean'],
        ]);

        $statuses = array_filter(explode(',', (string) $request->query('status')));
        foreach ($statuses as $status) {
            validator(['status' => $status], ['status' => [Rule::enum(OrderStatus::class)]])->validate();
        }

        $onlyOpen = $request->boolean('open') || $request->user()->hasRole(RoleSlug::Mesero);

        $orders = Order::with(self::DETAIL_RELATIONS)
            ->when($onlyOpen, fn ($q) => $q->open())
            ->when($statuses, fn ($q) => $q->whereIn('status', $statuses))
            ->when($request->query('date'), fn ($q, $date) => $q->whereDate('created_at', $date))
            ->latest()
            ->limit(200)
            ->get();

        return OrderResource::collection($orders);
    }

    /** Envía productos a cocina. Crea el pedido de la mesa o le agrega una comanda adicional. */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $table = DiningTable::findOrFail($request->validated('table_id'));

        $ticket = $this->orders->sendToKitchen($table, $request->user(), $request->validated('items'));

        return response()->json([
            'message' => $ticket->sequence > 1
                ? "Pedido adicional de {$table->label()} enviado a cocina."
                : "Pedido de {$table->label()} enviado a cocina.",
            'ticket' => new TicketResource($ticket),
            'order' => new OrderResource($ticket->order->load(self::DETAIL_RELATIONS)),
        ], 201);
    }

    public function show(Order $order): OrderResource
    {
        Gate::authorize('view', $order);

        return new OrderResource($order->load(self::DETAIL_RELATIONS));
    }

    /** Solo "en_caja" (pedir la cuenta) y "cancelado"; el resto lo decide el sistema. */
    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $label = $order->table->label();

        if ($request->status() === OrderStatus::EnCaja) {
            Gate::authorize('sendToCashier', $order);
            $order = $this->orders->sendToCashier($order);
            $message = "{$label} enviada a caja.";
        } else {
            Gate::authorize('cancel', $order);
            $order = $this->orders->cancel($order, $request->user(), $request->validated('reason'));
            $message = "Pedido de {$label} cancelado.";
        }

        return response()->json([
            'message' => $message,
            'order' => new OrderResource($order->load(self::DETAIL_RELATIONS)),
        ]);
    }
}
