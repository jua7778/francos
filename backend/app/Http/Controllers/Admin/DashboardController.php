<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\DailyMenuResource;
use App\Http\Resources\ProductResource;
use App\Models\DailyMenu;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $ordersToday = Order::whereDate('created_at', today());
        $activeProducts = Product::active()->whereHas('category', fn ($q) => $q->where('is_active', true));
        $activeTables = DiningTable::where('is_active', true)->count();
        $occupied = Order::open()->count();

        return response()->json([
            'orders_today' => (clone $ordersToday)->whereNot('status', OrderStatus::Cancelado->value)->count(),
            'orders_open' => $occupied,
            'orders_cancelled_today' => (clone $ordersToday)->where('status', OrderStatus::Cancelado->value)->count(),
            'sales_today' => (int) Payment::whereDate('paid_at', today())->sum('amount'),
            'products_available' => (clone $activeProducts)->where('is_available', true)->count(),
            'products_sold_out' => (clone $activeProducts)->where('is_available', false)->count(),
            'sold_out' => ProductResource::collection((clone $activeProducts)->where('is_available', false)->with('category')->orderBy('name')->get()),
            'tables_total' => $activeTables,
            'tables_occupied' => $occupied,
            'tables_available' => max(0, $activeTables - $occupied),
            'daily_menus' => DailyMenuResource::collection(DailyMenu::forToday()->with('items.product')->orderBy('name')->get()),
        ]);
    }
}
