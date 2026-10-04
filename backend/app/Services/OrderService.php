<?php

namespace App\Services;

use App\Enums\MenuSlot;
use App\Enums\OrderStatus;
use App\Enums\TicketStatus;
use App\Models\DailyMenu;
use App\Models\DiningTable;
use App\Models\KitchenTicket;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Reglas de negocio del flujo MESERO → COCINA → CAJA.
 */
class OrderService
{
    public function __construct(private ChangeTracker $changes) {}

    /**
     * Envía productos a cocina para una mesa. Si la mesa ya tiene un pedido abierto,
     * los productos se agregan a ese pedido como una comanda nueva (pedido adicional).
     *
     * @param  list<array{product_id?: int|null, daily_menu_id?: int|null, quantity: int, notes?: string|null}>  $lines
     */
    public function sendToKitchen(DiningTable $table, User $waiter, array $lines): KitchenTicket
    {
        $ticket = DB::transaction(function () use ($table, $waiter, $lines) {
            // Bloquea la mesa: si dos meseros envían a la vez, se atienden en orden y comparten el mismo pedido.
            DiningTable::whereKey($table->id)->lockForUpdate()->first();

            if (! $table->is_active) {
                throw ValidationException::withMessages(['table_id' => 'Esta mesa está desactivada.']);
            }

            $order = Order::open()->where('table_id', $table->id)->first()
                ?? Order::create([
                    'table_id' => $table->id,
                    'waiter_id' => $waiter->id,
                    'status' => OrderStatus::Pendiente,
                ]);

            $ticket = $order->tickets()->create([
                'sequence' => (int) $order->tickets()->max('sequence') + 1,
                'status' => TicketStatus::Pendiente,
                'created_by' => $waiter->id,
            ]);

            foreach ($lines as $line) {
                $ticket->items()->create(['order_id' => $order->id] + $this->buildItem($line));
            }

            // Si la mesa ya había pedido la cuenta y pide algo más, vuelve a quedar abierta.
            $order->sent_to_cashier_at = null;
            $this->refresh($order);

            return $ticket;
        });

        $this->changes->touch('orders', 'tables');

        return $ticket->load('items', 'order.table');
    }

    /** Cocina avanza una comanda: pendiente → en preparación → listo. */
    public function changeTicketStatus(KitchenTicket $ticket, TicketStatus $to): KitchenTicket
    {
        DB::transaction(function () use ($ticket, $to) {
            $ticket = KitchenTicket::whereKey($ticket->id)->lockForUpdate()->firstOrFail();
            $from = $ticket->status;

            if (! $ticket->order->isOpen()) {
                throw ValidationException::withMessages(['status' => 'Este pedido ya está cerrado.']);
            }
            if (! $this->canTransition($from, $to)) {
                throw ValidationException::withMessages([
                    'status' => "No se puede pasar de \"{$from->label()}\" a \"{$to->label()}\".",
                ]);
            }

            $ticket->status = $to;
            match ($to) {
                TicketStatus::EnPreparacion => $ticket->started_at ??= now(),
                TicketStatus::Listo => $ticket->ready_at = now(),
                TicketStatus::Entregado => $ticket->delivered_at = now(),
                TicketStatus::Cancelado => $ticket->cancelled_at = now(),
                default => null,
            };
            if ($to === TicketStatus::Listo) {
                $ticket->started_at ??= now();
            }
            $ticket->save();

            $this->refresh($ticket->order);
        });

        $this->changes->touch('orders', 'tables');

        return $ticket->refresh()->load('items', 'order.table');
    }

    /** El mesero (o caja) indica que la mesa pidió la cuenta. */
    public function sendToCashier(Order $order): Order
    {
        DB::transaction(function () use ($order) {
            $order = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if (! $order->isOpen()) {
                throw ValidationException::withMessages(['status' => 'Este pedido ya está cerrado.']);
            }
            if ($order->hasTicketsInKitchen()) {
                throw ValidationException::withMessages(['status' => 'Todavía hay productos en cocina. Espere a que estén listos.']);
            }

            $order->sent_to_cashier_at = now();
            $this->refresh($order);
        });

        $this->changes->touch('orders', 'tables');

        return $order->refresh();
    }

    public function cancel(Order $order, User $user, ?string $reason): Order
    {
        DB::transaction(function () use ($order, $user, $reason) {
            $order = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if (! $order->isOpen()) {
                throw ValidationException::withMessages(['status' => 'Este pedido ya está cerrado.']);
            }

            $order->tickets()
                ->whereNot('status', TicketStatus::Cancelado->value)
                ->update(['status' => TicketStatus::Cancelado->value, 'cancelled_at' => now()]);

            $order->forceFill([
                'status' => OrderStatus::Cancelado,
                'cancelled_at' => now(),
                'cancelled_by' => $user->id,
                'cancel_reason' => $reason,
            ])->save();
        });

        $this->changes->touch('orders', 'tables');

        return $order->refresh();
    }

    /**
     * Recalcula total y estado del pedido a partir de sus comandas.
     * Es la única fuente de verdad del estado del pedido mientras está abierto.
     */
    public function refresh(Order $order): void
    {
        $order->unsetRelation('tickets');
        $order->load('tickets.items');

        $active = $order->tickets->reject(fn (KitchenTicket $t) => $t->status === TicketStatus::Cancelado);

        $order->total = $active->sum(fn (KitchenTicket $t) => $t->items->sum('subtotal'));

        if ($active->isEmpty()) {
            // Se cancelaron todas las comandas: el pedido queda cancelado y la mesa se libera.
            $order->status = OrderStatus::Cancelado;
            $order->cancelled_at ??= now();
        } elseif ($active->contains(fn (KitchenTicket $t) => $t->status === TicketStatus::EnPreparacion)) {
            $order->status = OrderStatus::EnPreparacion;
        } elseif ($active->contains(fn (KitchenTicket $t) => $t->status === TicketStatus::Pendiente)) {
            $order->status = OrderStatus::Pendiente;
        } else {
            $order->status = $order->sent_to_cashier_at ? OrderStatus::EnCaja : OrderStatus::Listo;
        }

        $order->save();
    }

    private function canTransition(TicketStatus $from, TicketStatus $to): bool
    {
        return in_array($to, match ($from) {
            TicketStatus::Pendiente => [TicketStatus::EnPreparacion, TicketStatus::Listo, TicketStatus::Cancelado],
            TicketStatus::EnPreparacion => [TicketStatus::Listo],
            // "Deshacer" si cocina marcó listo por error, o el mesero confirma que lo entregó.
            TicketStatus::Listo => [TicketStatus::EnPreparacion, TicketStatus::Entregado],
            default => [],
        }, true);
    }

    /**
     * Construye la línea del pedido copiando nombre y precio actuales,
     * y verifica en el servidor que el producto o menú se pueda vender.
     *
     * @param  array{product_id?: int|null, daily_menu_id?: int|null, quantity: int, notes?: string|null}  $line
     * @return array<string, mixed>
     */
    private function buildItem(array $line): array
    {
        $quantity = (int) $line['quantity'];
        $notes = filled($line['notes'] ?? null) ? trim($line['notes']) : null;

        if (! empty($line['product_id'])) {
            $product = Product::with('category')->findOrFail($line['product_id']);

            if (! $product->isSellable()) {
                throw ValidationException::withMessages([
                    'items' => $product->is_available
                        ? "\"{$product->name}\" ya no está en la carta."
                        : "\"{$product->name}\" está AGOTADO.",
                ]);
            }

            return [
                'product_id' => $product->id,
                'name' => $product->name,
                'unit_price' => $product->price,
                'quantity' => $quantity,
                'subtotal' => $product->price * $quantity,
                'notes' => $notes,
            ];
        }

        $menu = DailyMenu::with('items.product')->findOrFail($line['daily_menu_id']);

        if (! $menu->menu_date->isToday()) {
            throw ValidationException::withMessages(['items' => "\"{$menu->name}\" no es un menú de hoy."]);
        }
        if (! $menu->isSellable()) {
            throw ValidationException::withMessages(['items' => "\"{$menu->name}\" está AGOTADO."]);
        }

        $components = collect(MenuSlot::cases())
            ->map(fn (MenuSlot $slot) => $menu->componentFor($slot))
            ->filter()
            ->map(fn ($item) => [
                'slot' => $item->slot->value,
                'label' => $item->slot->label(),
                'name' => $item->product->name,
                'sold_out' => ! $item->product->is_available,
            ])
            ->values()
            ->all();

        return [
            'daily_menu_id' => $menu->id,
            'name' => $menu->name.': '.$menu->componentFor(MenuSlot::Principal)->product->name,
            'unit_price' => $menu->price,
            'quantity' => $quantity,
            'subtotal' => $menu->price * $quantity,
            'notes' => $notes,
            'components' => $components,
        ];
    }
}
