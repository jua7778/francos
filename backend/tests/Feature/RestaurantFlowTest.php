<?php

namespace Tests\Feature;

use App\Enums\MenuSlot;
use App\Enums\RoleSlug;
use App\Models\Category;
use App\Models\DailyMenu;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RestaurantFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $mesero;
    private User $cocina;
    private User $caja;
    private User $admin;
    private DiningTable $mesa5;
    private Product $pollo;
    private Product $gaseosa;
    private Product $jugo;
    private DailyMenu $menu;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mesero = User::factory()->role(RoleSlug::Mesero)->create();
        $this->cocina = User::factory()->role(RoleSlug::Cocina)->create();
        $this->caja = User::factory()->role(RoleSlug::Caja)->create();
        $this->admin = User::factory()->role(RoleSlug::Admin)->create();

        $this->mesa5 = DiningTable::create(['number' => 5, 'seats' => 4]);

        $platos = Category::create(['name' => 'Platos', 'section' => 'comida', 'menu_slot' => 'principal']);
        $sopas = Category::create(['name' => 'Sopas', 'section' => 'comida', 'menu_slot' => 'sopa']);
        $bebidas = Category::create(['name' => 'Jugos', 'section' => 'bebida', 'menu_slot' => 'bebida']);

        $this->pollo = $platos->products()->create(['name' => 'Pollo a la plancha', 'price' => 25000]);
        $sopa = $sopas->products()->create(['name' => 'Sopa de verduras', 'price' => 9000]);
        $this->jugo = $bebidas->products()->create(['name' => 'Jugo de mango', 'price' => 6000]);
        $this->gaseosa = $bebidas->products()->create(['name' => 'Gaseosa', 'price' => 4000]);

        $this->menu = DailyMenu::create(['menu_date' => today(), 'name' => 'Menú 1', 'price' => 18000]);
        $this->menu->items()->create(['slot' => MenuSlot::Principal->value, 'product_id' => $this->pollo->id]);
        $this->menu->items()->create(['slot' => MenuSlot::Sopa->value, 'product_id' => $sopa->id]);
        $this->menu->items()->create(['slot' => MenuSlot::Bebida->value, 'product_id' => $this->jugo->id]);
    }

    private function sendOrder(array $items, ?DiningTable $table = null)
    {
        Sanctum::actingAs($this->mesero);

        return $this->postJson('/api/orders', ['table_id' => ($table ?? $this->mesa5)->id, 'items' => $items]);
    }

    public function test_login_returns_token_and_role(): void
    {
        $user = User::factory()->role(RoleSlug::Mesero)->create(['username' => 'maria', 'password' => '1234']);

        $this->postJson('/api/login', ['username' => 'MARIA ', 'password' => '1234'])
            ->assertOk()
            ->assertJsonPath('user.role.slug', 'mesero')
            ->assertJsonStructure(['token']);

        $this->postJson('/api/login', ['username' => 'maria', 'password' => 'mala'])
            ->assertStatus(422)
            ->assertJsonPath('errors.username.0', 'Usuario o contraseña incorrectos.');

        $user->update(['is_active' => false]);
        $this->postJson('/api/login', ['username' => 'maria', 'password' => '1234'])->assertStatus(422);
    }

    public function test_complete_flow_mesero_cocina_caja(): void
    {
        // MESERO: Mesa 5 → menú del día + gaseosa → envía.
        $response = $this->sendOrder([
            ['daily_menu_id' => $this->menu->id, 'quantity' => 1],
            ['product_id' => $this->gaseosa->id, 'quantity' => 1, 'notes' => 'Bien fría'],
        ])->assertCreated()->assertJsonPath('message', 'Pedido de Mesa 5 enviado a cocina.');

        $orderId = $response->json('order.id');
        $ticketId = $response->json('ticket.id');
        $this->assertSame(22000, $response->json('order.total'));
        $this->assertSame('pendiente', $response->json('order.status'));

        $this->getJson('/api/tables')->assertJsonPath('0.state', 'en_preparacion');

        // COCINA: recibe → prepara → listo.
        Sanctum::actingAs($this->cocina);
        $this->getJson('/api/kitchen/tickets')->assertJsonCount(1)->assertJsonPath('0.table.label', 'Mesa 5');
        $this->patchJson("/api/tickets/{$ticketId}/status", ['status' => 'en_preparacion'])->assertOk();
        $this->assertSame('en_preparacion', Order::find($orderId)->status->value);
        $this->patchJson("/api/tickets/{$ticketId}/status", ['status' => 'listo'])
            ->assertOk()->assertJsonPath('message', 'Pedido de Mesa 5 listo.');

        // MESERO: ve la mesa en "listo" y la entrega.
        Sanctum::actingAs($this->mesero);
        $this->getJson('/api/tables')->assertJsonPath('0.state', 'listo');
        $this->patchJson("/api/tickets/{$ticketId}/status", ['status' => 'entregado'])->assertOk();
        $this->getJson('/api/tables')->assertJsonPath('0.state', 'ocupada');

        // CAJA: ve el pedido listo → cobra.
        Sanctum::actingAs($this->caja);
        $this->getJson('/api/orders?status=listo,en_caja')->assertJsonCount(1);
        $this->postJson('/api/payments', ['order_id' => $orderId, 'method' => 'efectivo', 'received_amount' => 50000])
            ->assertCreated()
            ->assertJsonPath('payment.change_amount', 28000)
            ->assertJsonPath('message', 'Mesa 5 pagada correctamente.');

        // MESA: vuelve a estar disponible y el historial se conserva.
        $this->getJson('/api/tables')->assertJsonPath('0.state', 'disponible');
        $this->assertSame('pagado', Order::find($orderId)->status->value);
        $this->assertDatabaseHas('payments', ['order_id' => $orderId, 'amount' => 22000]);
    }

    public function test_additional_order_goes_to_same_order_as_new_ticket(): void
    {
        $first = $this->sendOrder([['product_id' => $this->pollo->id, 'quantity' => 2]])->json();
        $second = $this->sendOrder([['product_id' => $this->jugo->id, 'quantity' => 1]])
            ->assertCreated()
            ->assertJsonPath('message', 'Pedido adicional de Mesa 5 enviado a cocina.')
            ->json();

        $this->assertSame($first['order']['id'], $second['order']['id']);
        $this->assertSame(2, $second['ticket']['sequence']);
        $this->assertSame(56000, $second['order']['total']);

        // Cocina ve el adicional como una tarjeta propia, con solo el producto nuevo.
        Sanctum::actingAs($this->cocina);
        $tickets = $this->getJson('/api/kitchen/tickets')->assertJsonCount(2)->json();
        $this->assertSame('Jugo de mango', $tickets[1]['items'][0]['name']);
        $this->assertCount(1, $tickets[1]['items']);
    }

    public function test_additional_order_after_asking_for_bill_reopens_order(): void
    {
        $ticket = $this->sendOrder([['product_id' => $this->pollo->id, 'quantity' => 1]])->json('ticket.id');
        Sanctum::actingAs($this->cocina);
        $this->patchJson("/api/tickets/{$ticket}/status", ['status' => 'listo']);

        Sanctum::actingAs($this->mesero);
        $order = Order::first();
        $this->patchJson("/api/orders/{$order->id}/status", ['status' => 'en_caja'])->assertOk();
        $this->getJson('/api/tables')->assertJsonPath('0.state', 'pendiente_pago');

        $this->sendOrder([['product_id' => $this->jugo->id, 'quantity' => 1]])->assertCreated();
        $this->assertSame('pendiente', $order->fresh()->status->value);
        $this->assertNull($order->fresh()->sent_to_cashier_at);
    }

    public function test_sold_out_product_cannot_be_ordered_until_available_again(): void
    {
        Sanctum::actingAs($this->cocina);
        $this->patchJson("/api/products/{$this->jugo->id}/availability", ['is_available' => false])
            ->assertOk()->assertJsonPath('is_available', false);

        Sanctum::actingAs($this->mesero);
        $this->getJson('/api/catalog')->assertOk();
        $this->sendOrder([['product_id' => $this->jugo->id, 'quantity' => 1]])
            ->assertStatus(422)
            ->assertJsonPath('errors.items.0', '"Jugo de mango" está AGOTADO.');
        $this->assertSame(0, Order::count());

        Sanctum::actingAs($this->cocina);
        $this->patchJson("/api/products/{$this->jugo->id}/availability", ['is_available' => true])->assertOk();
        $this->sendOrder([['product_id' => $this->jugo->id, 'quantity' => 1]])->assertCreated();
    }

    public function test_daily_menu_is_blocked_when_main_dish_is_sold_out(): void
    {
        $this->pollo->update(['is_available' => false]);

        Sanctum::actingAs($this->mesero);
        $this->getJson('/api/daily-menu')->assertJsonPath('0.is_sellable', false);
        $this->sendOrder([['daily_menu_id' => $this->menu->id, 'quantity' => 1]])->assertStatus(422);
    }

    public function test_daily_menu_still_sells_when_only_a_side_is_sold_out(): void
    {
        $this->jugo->update(['is_available' => false]);

        Sanctum::actingAs($this->mesero);
        $this->getJson('/api/daily-menu')
            ->assertJsonPath('0.is_sellable', true)
            ->assertJsonPath('0.sold_out_components.0', 'Jugo de mango');
        $this->sendOrder([['daily_menu_id' => $this->menu->id, 'quantity' => 2]])->assertCreated()
            ->assertJsonPath('order.total', 36000);
    }

    public function test_two_simultaneous_orders_for_different_tables(): void
    {
        $mesa6 = DiningTable::create(['number' => 6, 'seats' => 4]);

        $a = $this->sendOrder([['product_id' => $this->pollo->id, 'quantity' => 1]])->assertCreated()->json('order.id');
        $b = $this->sendOrder([['product_id' => $this->jugo->id, 'quantity' => 1]], $mesa6)->assertCreated()->json('order.id');

        $this->assertNotSame($a, $b);
        $this->assertSame(2, Order::open()->count());
    }

    public function test_waiter_can_cancel_only_before_kitchen_starts(): void
    {
        $response = $this->sendOrder([['product_id' => $this->pollo->id, 'quantity' => 1]]);
        $orderId = $response->json('order.id');
        $this->assertTrue($response->json('order.can.cancel'));

        Sanctum::actingAs($this->cocina);
        $this->patchJson("/api/tickets/{$response->json('ticket.id')}/status", ['status' => 'en_preparacion']);

        Sanctum::actingAs($this->mesero);
        $this->patchJson("/api/orders/{$orderId}/status", ['status' => 'cancelado'])->assertForbidden();

        Sanctum::actingAs($this->caja);
        $this->patchJson("/api/orders/{$orderId}/status", ['status' => 'cancelado', 'reason' => 'Cliente se fue'])
            ->assertOk()->assertJsonPath('order.status', 'cancelado');

        $this->getJson('/api/tables')->assertJsonPath('0.state', 'disponible');
    }

    public function test_cancelling_only_ticket_frees_the_table(): void
    {
        $ticket = $this->sendOrder([['product_id' => $this->pollo->id, 'quantity' => 1]])->json('ticket.id');

        $this->patchJson("/api/tickets/{$ticket}/status", ['status' => 'cancelado'])->assertOk();
        $this->assertSame('cancelado', Order::first()->status->value);
        $this->getJson('/api/tables')->assertJsonPath('0.state', 'disponible');
    }

    public function test_cannot_pay_while_kitchen_is_still_working(): void
    {
        $orderId = $this->sendOrder([['product_id' => $this->pollo->id, 'quantity' => 1]])->json('order.id');

        Sanctum::actingAs($this->caja);
        $this->postJson('/api/payments', ['order_id' => $orderId, 'method' => 'tarjeta'])->assertStatus(422);
    }

    public function test_cannot_pay_twice(): void
    {
        $response = $this->sendOrder([['product_id' => $this->pollo->id, 'quantity' => 1]]);
        Sanctum::actingAs($this->cocina);
        $this->patchJson("/api/tickets/{$response->json('ticket.id')}/status", ['status' => 'listo']);

        Sanctum::actingAs($this->caja);
        $this->postJson('/api/payments', ['order_id' => $response->json('order.id'), 'method' => 'tarjeta'])->assertCreated();
        $this->postJson('/api/payments', ['order_id' => $response->json('order.id'), 'method' => 'tarjeta'])->assertStatus(422);
    }

    public function test_roles_are_enforced_by_backend(): void
    {
        Sanctum::actingAs($this->cocina);
        $this->postJson('/api/orders', ['table_id' => $this->mesa5->id, 'items' => [['product_id' => $this->pollo->id, 'quantity' => 1]]])->assertForbidden();
        $this->getJson('/api/admin/products')->assertForbidden();
        $this->getJson('/api/payments')->assertForbidden();

        Sanctum::actingAs($this->mesero);
        $this->getJson('/api/kitchen/tickets')->assertForbidden();
        $this->patchJson("/api/products/{$this->pollo->id}/availability", ['is_available' => false])->assertForbidden();
        $this->postJson('/api/admin/products', ['name' => 'x'])->assertForbidden();
        $this->putJson("/api/admin/products/{$this->pollo->id}", ['price' => 1])->assertForbidden();

        Sanctum::actingAs($this->caja);
        $this->getJson('/api/admin/dashboard')->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/dashboard')->assertOk();
        $this->getJson('/api/kitchen/tickets')->assertOk();
    }

    public function test_kitchen_cannot_mark_delivered_and_waiter_cannot_mark_ready(): void
    {
        $ticket = $this->sendOrder([['product_id' => $this->pollo->id, 'quantity' => 1]])->json('ticket.id');

        $this->patchJson("/api/tickets/{$ticket}/status", ['status' => 'listo'])->assertForbidden();

        Sanctum::actingAs($this->cocina);
        $this->patchJson("/api/tickets/{$ticket}/status", ['status' => 'entregado'])->assertForbidden();
    }

    public function test_guest_and_inactive_users_are_rejected(): void
    {
        $this->getJson('/api/tables')->assertUnauthorized();

        $this->mesero->update(['is_active' => false]);
        Sanctum::actingAs($this->mesero);
        $this->getJson('/api/tables')->assertUnauthorized();
    }

    public function test_deactivated_product_keeps_order_history(): void
    {
        $orderId = $this->sendOrder([['product_id' => $this->gaseosa->id, 'quantity' => 3]])->json('order.id');

        Sanctum::actingAs($this->admin);
        $this->putJson("/api/admin/products/{$this->gaseosa->id}", [
            'name' => 'Gaseosa', 'category_id' => $this->gaseosa->category_id, 'price' => 9999,
        ])->assertOk();
        $this->deleteJson("/api/admin/products/{$this->gaseosa->id}")
            ->assertOk()->assertJsonPath('message', 'Producto desactivado. Se conserva en los pedidos anteriores.');

        $this->assertDatabaseHas('products', ['id' => $this->gaseosa->id, 'is_active' => false]);

        $order = $this->getJson("/api/orders/{$orderId}")->assertOk()->json();
        $this->assertSame('Gaseosa', $order['tickets'][0]['items'][0]['name']);
        $this->assertSame(4000, $order['tickets'][0]['items'][0]['unit_price']);
        $this->assertSame(12000, $order['total']);

        // No se puede volver a pedir.
        $this->sendOrder([['product_id' => $this->gaseosa->id, 'quantity' => 1]])->assertStatus(422);
    }

    public function test_admin_creates_daily_menu_with_dropdown_choices(): void
    {
        Sanctum::actingAs($this->admin);

        $slots = $this->getJson('/api/admin/daily-menus')->assertOk()->json('slots');
        $this->assertSame('principal', $slots[0]['slot']);
        $this->assertSame('Pollo a la plancha', $slots[0]['products'][0]['name']);

        $this->postJson('/api/admin/daily-menus', [
            'name' => 'Menú 2',
            'price' => 20000,
            'is_available' => true,
            'components' => ['principal' => $this->pollo->id, 'bebida' => $this->jugo->id],
        ])->assertCreated()->assertJsonPath('menu.components.1.name', 'Jugo de mango');

        // Una sopa no puede ser la bebida.
        $this->postJson('/api/admin/daily-menus', [
            'name' => 'Menú 3', 'price' => 1, 'is_available' => true,
            'components' => ['principal' => $this->pollo->id, 'bebida' => $this->pollo->id],
        ])->assertStatus(422);
    }

    public function test_copy_yesterday_menus(): void
    {
        $this->menu->update(['menu_date' => today()->subDay()]);

        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/daily-menus/copy-latest')->assertOk();

        $this->assertSame(1, DailyMenu::forToday()->count());
        $this->assertSame(3, DailyMenu::forToday()->first()->items()->count());
    }

    public function test_pulse_versions_change_when_orders_change(): void
    {
        Sanctum::actingAs($this->mesero);
        $before = $this->getJson('/api/pulse')->json('versions.orders');

        $this->sendOrder([['product_id' => $this->pollo->id, 'quantity' => 1]]);

        $this->assertNotSame($before, $this->getJson('/api/pulse')->json('versions.orders'));
    }

    public function test_one_open_order_per_table_is_enforced_by_database(): void
    {
        Order::create(['table_id' => $this->mesa5->id, 'waiter_id' => $this->mesero->id, 'status' => 'pendiente']);

        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);
        Order::create(['table_id' => $this->mesa5->id, 'waiter_id' => $this->mesero->id, 'status' => 'pendiente']);
    }
}
