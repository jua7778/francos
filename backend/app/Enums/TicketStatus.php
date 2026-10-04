<?php

namespace App\Enums;

/**
 * Estado de una comanda (cada envío a cocina).
 */
enum TicketStatus: string
{
    case Pendiente = 'pendiente';
    case EnPreparacion = 'en_preparacion';
    case Listo = 'listo';
    case Entregado = 'entregado';
    case Cancelado = 'cancelado';

    public function label(): string
    {
        return match ($this) {
            self::Pendiente => 'Pendiente',
            self::EnPreparacion => 'En preparación',
            self::Listo => 'Listo',
            self::Entregado => 'Entregado',
            self::Cancelado => 'Cancelado',
        };
    }

    /** Siguiente estado permitido para cocina. */
    public function next(): ?self
    {
        return match ($this) {
            self::Pendiente => self::EnPreparacion,
            self::EnPreparacion => self::Listo,
            default => null,
        };
    }

    public function isInKitchen(): bool
    {
        return $this === self::Pendiente || $this === self::EnPreparacion;
    }
}
