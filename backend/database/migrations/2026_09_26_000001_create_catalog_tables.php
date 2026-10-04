<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mesas del restaurante.
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('number')->unique();
            $table->string('name', 40)->nullable(); // Ej: "Terraza 1". Si es nulo se muestra "Mesa {number}".
            $table->unsignedSmallInteger('seats')->default(4);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Categorías de la carta.
        // section: 'comida' o 'bebida' (las bebidas tienen su propia sección en la pantalla del mesero).
        // menu_slot: indica qué componente del Menú del Día puede salir de esta categoría.
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60)->unique();
            $table->string('icon', 16)->default('🍽️');
            $table->string('section', 10)->default('comida');
            $table->string('menu_slot', 20)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('name', 80);
            $table->string('description', 255)->nullable();
            $table->unsignedInteger('price'); // Pesos colombianos, sin decimales.
            $table->string('image_path')->nullable();
            $table->boolean('is_available')->default(true); // Agotado / disponible (lo cambia cocina).
            $table->boolean('is_active')->default(true);    // Desactivado por admin (no se borra por el historial).
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['category_id', 'is_active']);
        });

        DB::statement("ALTER TABLE categories ADD CONSTRAINT categories_section_check CHECK (section IN ('comida', 'bebida'))");
        DB::statement("ALTER TABLE categories ADD CONSTRAINT categories_menu_slot_check CHECK (menu_slot IS NULL OR menu_slot IN ('principal', 'sopa', 'ensalada', 'acompanamiento', 'bebida'))");
        DB::statement('ALTER TABLE products ADD CONSTRAINT products_price_check CHECK (price >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('tables');
    }
};
