<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

/**
 * Contadores de versión para la actualización "en tiempo real" por polling.
 *
 * Cada vez que cambia algo (un pedido, la carta, la disponibilidad) se incrementa
 * el contador del canal. Las pantallas consultan GET /api/pulse cada pocos segundos
 * (respuesta de pocos bytes) y solo vuelven a pedir los datos cuando el contador cambió.
 */
class ChangeTracker
{
    /** orders: pedidos, comandas y pagos. catalog: carta, disponibilidad y menú del día. tables: mesas. */
    public const CHANNELS = ['orders', 'catalog', 'tables'];

    public function touch(string ...$channels): void
    {
        foreach ($channels as $channel) {
            $key = $this->key($channel);

            if (! Cache::has($key)) {
                // Arranca con la hora para que un reinicio del caché no repita versiones antiguas.
                Cache::forever($key, (int) (microtime(true) * 1000));
            }

            Cache::increment($key);
        }
    }

    /** @return array<string, int> */
    public function versions(): array
    {
        $versions = [];

        foreach (self::CHANNELS as $channel) {
            $versions[$channel] = (int) Cache::get($this->key($channel), 0);
        }

        return $versions;
    }

    private function key(string $channel): string
    {
        return "changes:{$channel}";
    }
}
