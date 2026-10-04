<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /** Ventas entre dos fechas (por defecto, los últimos 7 días). */
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $from = Carbon::parse($data['from'] ?? today()->subDays(6))->startOfDay();
        $to = Carbon::parse($data['to'] ?? today())->endOfDay();

        $payments = Payment::whereBetween('paid_at', [$from, $to]);
        $total = (int) (clone $payments)->sum('amount');
        $count = (clone $payments)->count();

        $byDay = (clone $payments)
            ->selectRaw('DATE(paid_at) as day, SUM(amount) as total, COUNT(*) as orders')
            ->groupBy('day')->orderBy('day')
            ->get()
            ->map(fn ($row) => ['day' => (string) $row->day, 'total' => (int) $row->total, 'orders' => (int) $row->orders]);

        $byMethod = collect(PaymentMethod::cases())->map(fn (PaymentMethod $m) => [
            'method' => $m->value,
            'label' => $m->label(),
            'total' => (int) (clone $payments)->where('method', $m->value)->sum('amount'),
        ]);

        // Los más vendidos: se agrupa por el nombre guardado en el pedido (historial intacto).
        $topProducts = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('kitchen_tickets', 'kitchen_tickets.id', '=', 'order_items.kitchen_ticket_id')
            ->where('orders.status', OrderStatus::Pagado->value)
            ->where('kitchen_tickets.status', '!=', 'cancelado')
            ->whereBetween('orders.paid_at', [$from, $to])
            ->groupBy('order_items.name')
            ->select('order_items.name', DB::raw('SUM(order_items.quantity) as quantity'), DB::raw('SUM(order_items.subtotal) as total'))
            ->orderByDesc('quantity')
            ->limit(10)
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'quantity' => (int) $row->quantity, 'total' => (int) $row->total]);

        return response()->json([
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'total' => $total,
            'orders' => $count,
            'average' => $count ? intdiv($total, $count) : 0,
            'cancelled' => Order::where('status', OrderStatus::Cancelado->value)->whereBetween('created_at', [$from, $to])->count(),
            'by_day' => $byDay,
            'by_method' => $byMethod,
            'top_products' => $topProducts,
        ]);
    }
}
