<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Roles del sistema: admin, mesero, cocina, caja. Los permisos dependen del slug.
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 30)->unique();
            $table->string('name', 60);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Los roles son datos de referencia: los permisos del código dependen de estos slugs.
        DB::table('roles')->insert([
            ['slug' => 'admin', 'name' => 'Administrador', 'description' => 'Acceso completo: carta, mesas, usuarios y reportes.', 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'mesero', 'name' => 'Mesero', 'description' => 'Toma pedidos en las mesas y los envía a cocina.', 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'cocina', 'name' => 'Cocina', 'description' => 'Prepara los pedidos y marca productos agotados.', 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'caja', 'name' => 'Caja', 'description' => 'Cobra los pedidos y libera las mesas.', 'created_at' => now(), 'updated_at' => now()],
        ]);

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username', 50)->unique();
            $table->foreignId('role_id')->constrained('roles')->restrictOnDelete();
            $table->boolean('is_active')->default(true);
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
    }
};
