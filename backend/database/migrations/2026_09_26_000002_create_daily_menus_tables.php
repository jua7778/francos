<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cada fila es una opción de Menú del Día ("Menú 1", "Menú 2") para una fecha.
        Schema::create('daily_menus', function (Blueprint $table) {
            $table->id();
            $table->date('menu_date');
            $table->string('name', 40);
            $table->unsignedInteger('price');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->unique(['menu_date', 'name']);
        });

        // Componentes del menú: un producto por "slot" (principal, sopa, ensalada, acompañamiento, bebida).
        Schema::create('daily_menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_menu_id')->constrained('daily_menus')->cascadeOnDelete();
            $table->string('slot', 20);
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['daily_menu_id', 'slot']);
        });

        DB::statement("ALTER TABLE daily_menu_items ADD CONSTRAINT daily_menu_items_slot_check CHECK (slot IN ('principal', 'sopa', 'ensalada', 'acompanamiento', 'bebida'))");
        DB::statement('ALTER TABLE daily_menus ADD CONSTRAINT daily_menus_price_check CHECK (price >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_menu_items');
        Schema::dropIfExists('daily_menus');
    }
};
