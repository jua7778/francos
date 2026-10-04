<?php

namespace App\Policies;

use App\Enums\RoleSlug;
use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        // Cocina trabaja con comandas, no con cuentas.
        return ! $user->hasRole(RoleSlug::Cocina);
    }

    public function sendToCashier(User $user, Order $order): bool
    {
        return $user->hasRole(RoleSlug::Admin, RoleSlug::Mesero, RoleSlug::Caja);
    }

    /**
     * Admin y caja pueden cancelar un pedido abierto.
     * El mesero solo si cocina todavía no empezó a preparar nada.
     */
    public function cancel(User $user, Order $order): bool
    {
        if ($user->hasRole(RoleSlug::Admin, RoleSlug::Caja)) {
            return true;
        }

        $order->loadMissing('tickets');

        return $user->hasRole(RoleSlug::Mesero) && ! $order->hasStartedTickets();
    }
}
