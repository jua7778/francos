<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /** Pagos de un día (hoy por defecto) con el resumen por forma de pago. */
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate(['date' => ['nullable', 'date_format:Y-m-d']]);
        $date = $data['date'] ?? today()->toDateString();

        $payments = Payment::with(['order.table', 'cashier'])
            ->whereDate('paid_at', $date)
            ->latest('paid_at')
            ->get();

        return response()->json([
            'date' => $date,
            'total' => $payments->sum('amount'),
            'by_method' => collect(PaymentMethod::cases())->map(fn (PaymentMethod $m) => [
                'method' => $m->value,
                'label' => $m->label(),
                'total' => $payments->where('method', $m)->sum('amount'),
                'count' => $payments->where('method', $m)->count(),
            ]),
            'payments' => PaymentResource::collection($payments),
        ]);
    }

    public function store(StorePaymentRequest $request, PaymentService $service): JsonResponse
    {
        $order = Order::with('table')->findOrFail($request->validated('order_id'));

        $payment = $service->pay(
            $order,
            $request->user(),
            PaymentMethod::from($request->validated('method')),
            $request->validated('received_amount'),
        );

        return response()->json([
            'message' => "{$order->table->label()} pagada correctamente.",
            'payment' => new PaymentResource($payment),
        ], 201);
    }
}
