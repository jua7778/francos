<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\DailyMenuAvailabilityController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductAvailabilityController;
use App\Http\Controllers\PulseController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

/*
| Permisos por rol (el administrador pasa todas las verificaciones):
|   mesero → mesas, pedidos, consulta de disponibilidad
|   cocina → comandas y disponibilidad de productos
|   caja   → pedidos listos, pagos e historial
*/

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/pulse', PulseController::class);

    // Carta vigente (lectura para todos los roles).
    Route::get('/catalog', [CatalogController::class, 'catalog']);
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/products', [CatalogController::class, 'products']);
    Route::get('/daily-menu', [CatalogController::class, 'dailyMenus']);

    // Mesas y pedidos.
    Route::middleware('role:mesero,caja')->group(function () {
        Route::get('/tables', [TableController::class, 'index']);
        Route::get('/tables/{table}', [TableController::class, 'show']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    });
    Route::post('/orders', [OrderController::class, 'store'])->middleware('role:mesero');

    // Comandas: cocina las prepara; el mesero las entrega o cancela (la Policy decide cada caso).
    Route::get('/kitchen/tickets', [TicketController::class, 'kitchen'])->middleware('role:cocina');
    Route::patch('/tickets/{ticket}/status', [TicketController::class, 'updateStatus'])->middleware('role:cocina,mesero');

    // Agotado / disponible.
    Route::middleware('role:cocina')->group(function () {
        Route::patch('/products/{product}/availability', ProductAvailabilityController::class);
        Route::patch('/daily-menu/{dailyMenu}/availability', DailyMenuAvailabilityController::class);
    });

    // Caja.
    Route::middleware('role:caja')->group(function () {
        Route::get('/payments', [PaymentController::class, 'index']);
        Route::post('/payments', [PaymentController::class, 'store']);
    });

    // Panel administrativo.
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', Admin\DashboardController::class);
        Route::get('/reports', Admin\ReportController::class);

        Route::apiResource('categories', Admin\CategoryController::class)->except('show');
        Route::apiResource('products', Admin\ProductController::class)->except('show');
        // Los formularios con foto se envían como multipart: se acepta POST además de PUT.
        Route::post('/products/{product}', [Admin\ProductController::class, 'update']);
        Route::apiResource('tables', Admin\TableController::class)->except('show');

        Route::get('/roles', [Admin\UserController::class, 'roles']);
        Route::apiResource('users', Admin\UserController::class)->except('show');

        Route::post('/daily-menus/copy-latest', [Admin\DailyMenuController::class, 'copyLatest']);
        Route::apiResource('daily-menus', Admin\DailyMenuController::class)->except('show');
    });
});
