<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(private ChangeTracker $changes) {}

    /** Registra el pago, cierra el pedido y deja la mesa disponible. */
    public function pay(Order $order, User $cashier, PaymentMethod $method, ?int $received): Payment
    {
        $payment = DB::transaction(function () use ($order, $cashier, $method, $received) {
            $order = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($order->status === OrderStatus::Pagado) {
                throw ValidationException::withMessages(['order_id' => 'Este pedido ya fue pagado.']);
            }
            if (! in_array($order->status, [OrderStatus::Listo, OrderStatus::EnCaja], true)) {
                throw ValidationException::withMessages(['order_id' => 'Este pedido todavía no se puede cobrar: hay productos en cocina.']);
            }
            if ($method === PaymentMethod::Efectivo && $received !== null && $received < $order->total) {
                throw ValidationException::withMessages(['received_amount' => 'El dinero recibido es menor que el total.']);
            }

            $received = $method === PaymentMethod::Efectivo ? ($received ?? $order->total) : null;

            $payment = $order->payment()->create([
                'cashier_id' => $cashier->id,
                'amount' => $order->total,
                'method' => $method,
                'received_amount' => $received,
                'change_amount' => $received !== null ? $received - $order->total : null,
                'paid_at' => now(),
            ]);

            $order->forceFill(['status' => OrderStatus::Pagado, 'paid_at' => now()])->save();

            return $payment;
        });

        $this->changes->touch('orders', 'tables');

        return $payment->load('order.table');
    }
}
