<?php

namespace App\Http\Controllers;

use App\Http\Resources\DailyMenuResource;
use App\Models\DailyMenu;
use App\Services\ChangeTracker;
use Illuminate\Http\Request;

/**
 * Cocina (o admin) marca un Menú del Día como agotado o disponible.
 */
class DailyMenuAvailabilityController extends Controller
{
    public function __invoke(Request $request, DailyMenu $dailyMenu, ChangeTracker $changes): DailyMenuResource
    {
        $data = $request->validate(['is_available' => ['required', 'boolean']]);

        $dailyMenu->update(['is_available' => $data['is_available']]);
        $changes->touch('catalog');

        return new DailyMenuResource($dailyMenu->load('items.product'));
    }
}
