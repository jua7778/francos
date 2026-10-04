<?php

namespace App\Policies;

use App\Enums\RoleSlug;
use App\Enums\TicketStatus;
use App\Models\KitchenTicket;
use App\Models\User;

class KitchenTicketPolicy
{
    /**
     * Cocina prepara y marca listo. El mesero confirma la entrega o cancela
     * una comanda que cocina todavía no ha empezado.
     */
    public function changeStatus(User $user, KitchenTicket $ticket, TicketStatus $to): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return match ($to) {
            TicketStatus::EnPreparacion, TicketStatus::Listo => $user->hasRole(RoleSlug::Cocina),
            TicketStatus::Entregado, TicketStatus::Cancelado => $user->hasRole(RoleSlug::Mesero),
            default => false,
        };
    }
}
