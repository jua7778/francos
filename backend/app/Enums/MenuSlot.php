<?php

namespace App\Enums;

/**
 * Componentes del Menú del Día.
 */
enum MenuSlot: string
{
    case Principal = 'principal';
    case Sopa = 'sopa';
    case Ensalada = 'ensalada';
    case Acompanamiento = 'acompanamiento';
    case Bebida = 'bebida';

    public function label(): string
    {
        return match ($this) {
            self::Principal => 'Plato principal',
            self::Sopa => 'Sopa',
            self::Ensalada => 'Ensalada',
            self::Acompanamiento => 'Seco / acompañamiento',
            self::Bebida => 'Bebida',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Principal => '🍗',
            self::Sopa => '🍲',
            self::Ensalada => '🥗',
            self::Acompanamiento => '🍚',
            self::Bebida => '🥤',
        };
    }
}
