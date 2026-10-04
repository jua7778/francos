<?php

namespace App\Enums;

/**
 * Estado de la cuenta de una mesa.
 */
enum OrderStatus: string
{
    case Pendiente = 'pendiente';
    case EnPreparacion = 'en_preparacion';
    case Listo = 'listo';
    case EnCaja = 'en_caja';
    case Pagado = 'pagado';
    case Cancelado = 'cancelado';

    public function label(): string
    {
        return match ($this) {
            self::Pendiente => 'Pendiente',
            self::EnPreparacion => 'En preparación',
            self::Listo => 'Listo',
            self::EnCaja => 'En caja',
            self::Pagado => 'Pagado',
            self::Cancelado => 'Cancelado',
        };
    }

    public function isOpen(): bool
    {
        return ! in_array($this, [self::Pagado, self::Cancelado], true);
    }

    /** @return list<string> */
    public static function openValues(): array
    {
        return array_values(array_map(
            fn (self $s) => $s->value,
            array_filter(self::cases(), fn (self $s) => $s->isOpen()),
        ));
    }
}
