<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Catálogo de estados del pedido (cuenta de la mesa).
        Schema::create('order_statuses', function (Blueprint $table) {
            $table->string('code', 20)->primary();
            $table->string('name', 40);
            $table->string('color', 20);
            $table->unsignedSmallInteger('sort_order');
        });

        // Son datos de referencia del sistema (no de prueba): deben existir siempre.
        DB::table('order_statuses')->insert([
            ['code' => 'pendiente', 'name' => 'Pendiente', 'color' => 'amber', 'sort_order' => 1],
            ['code' => 'en_preparacion', 'name' => 'En preparación', 'color' => 'orange', 'sort_order' => 2],
            ['code' => 'listo', 'name' => 'Listo', 'color' => 'green', 'sort_order' => 3],
            ['code' => 'en_caja', 'name' => 'En caja', 'color' => 'blue', 'sort_order' => 4],
            ['code' => 'pagado', 'name' => 'Pagado', 'color' => 'slate', 'sort_order' => 5],
            ['code' => 'cancelado', 'name' => 'Cancelado', 'color' => 'red', 'sort_order' => 6],
        ]);

        // Un pedido = la cuenta de una mesa, desde que se sienta el cliente hasta que paga.
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->constrained('tables')->restrictOnDelete();
            $table->foreignId('waiter_id')->constrained('users')->restrictOnDelete();
            $table->string('status', 20);
            $table->foreign('status')->references('code')->on('order_statuses');
            $table->unsignedInteger('total')->default(0);
            $table->timestamp('sent_to_cashier_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('cancel_reason')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });

        // Solo puede existir un pedido abierto por mesa (protege contra dos meseros a la vez).
        DB::statement("CREATE UNIQUE INDEX orders_one_open_per_table ON orders (table_id) WHERE status NOT IN ('pagado', 'cancelado')");

        // Cada envío a cocina es una comanda. El primer envío y cada pedido adicional generan una comanda nueva.
        Schema::create('kitchen_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->restrictOnDelete();
            $table->unsignedSmallInteger('sequence'); // 1 = pedido inicial, 2+ = adicionales.
            $table->string('status', 20)->default('pendiente');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->unique(['order_id', 'sequence']);
            $table->index(['status', 'created_at']);
        });

        DB::statement("ALTER TABLE kitchen_tickets ADD CONSTRAINT kitchen_tickets_status_check CHECK (status IN ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'))");

        // Productos del pedido. Nombre y precio se copian al momento de pedir:
        // si luego cambia el precio o se desactiva el producto, el historial no se altera.
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->restrictOnDelete();
            $table->foreignId('kitchen_ticket_id')->constrained('kitchen_tickets')->restrictOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->restrictOnDelete();
            $table->foreignId('daily_menu_id')->nullable()->constrained('daily_menus')->restrictOnDelete();
            $table->string('name', 120);
            $table->unsignedInteger('unit_price');
            $table->unsignedSmallInteger('quantity');
            $table->unsignedInteger('subtotal');
            $table->string('notes', 200)->nullable();
            $table->json('components')->nullable(); // Componentes del Menú del Día al momento de pedir.
            $table->timestamps();
        });

        DB::statement('ALTER TABLE order_items ADD CONSTRAINT order_items_source_check CHECK ((product_id IS NOT NULL) <> (daily_menu_id IS NOT NULL))');
        DB::statement('ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_check CHECK (quantity > 0)');

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained('orders')->restrictOnDelete();
            $table->foreignId('cashier_id')->constrained('users')->restrictOnDelete();
            $table->unsignedInteger('amount');
            $table->string('method', 20);
            $table->unsignedInteger('received_amount')->nullable();
            $table->unsignedInteger('change_amount')->nullable();
            $table->timestamp('paid_at');
            $table->timestamps();

            $table->index('paid_at');
        });

        DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method IN ('efectivo', 'tarjeta', 'transferencia'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('kitchen_tickets');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('order_statuses');
    }
};
