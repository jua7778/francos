<?php

namespace Database\Seeders;

use App\Enums\MenuSlot;
use App\Enums\RoleSlug;
use App\Models\Category;
use App\Models\DailyMenu;
use App\Models\DiningTable;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Datos iniciales de ejemplo para empezar a usar el sistema.
 * Todas las contraseñas de ejemplo son "1234"; cámbielas desde Administrar usuarios.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedUsers();
        $this->seedTables();
        $products = $this->seedCatalog();
        $this->seedDailyMenus($products);
    }

    private function seedUsers(): void
    {
        $users = [
            ['Administrador', 'admin', RoleSlug::Admin],
            ['María (Mesera)', 'maria', RoleSlug::Mesero],
            ['Carlos (Mesero)', 'carlos', RoleSlug::Mesero],
            ['Cocina', 'cocina', RoleSlug::Cocina],
            ['Caja', 'caja', RoleSlug::Caja],
        ];

        foreach ($users as [$name, $username, $role]) {
            User::create([
                'name' => $name,
                'username' => $username,
                'role_id' => Role::idFor($role),
                'password' => '1234',
            ]);
        }
    }

    private function seedTables(): void
    {
        foreach (range(1, 12) as $number) {
            DiningTable::create(['number' => $number, 'seats' => $number > 10 ? 6 : 4]);
        }
    }

    /** @return array<string, Product> Productos indexados por nombre. */
    private function seedCatalog(): array
    {
        $catalog = [
            ['Platos', '🍽️', 'comida', MenuSlot::Principal, [
                ['Pollo a la plancha', 25000],
                ['Carne asada', 28000],
                ['Carne en salsa', 27000],
                ['Arroz con pollo', 22000],
                ['Bandeja paisa', 32000],
                ['Mojarra frita', 30000],
            ]],
            ['Sopas', '🍲', 'comida', MenuSlot::Sopa, [
                ['Sopa de verduras', 9000],
                ['Sancocho', 14000],
                ['Ajiaco', 16000],
            ]],
            ['Ensaladas', '🥗', 'comida', MenuSlot::Ensalada, [
                ['Ensalada de la casa', 8000],
                ['Ensalada de repollo', 6000],
            ]],
            ['Acompañamientos', '🍚', 'comida', MenuSlot::Acompanamiento, [
                ['Arroz blanco', 4000],
                ['Papa a la francesa', 6000],
                ['Patacones', 6000],
                ['Frijoles', 5000],
            ]],
            ['Adicionales', '🍟', 'comida', null, [
                ['Huevo frito', 2500],
                ['Aguacate', 3500],
                ['Porción de queso', 3000],
            ]],
            ['Postres', '🍰', 'comida', null, [
                ['Flan de caramelo', 6000],
                ['Arroz con leche', 5000],
            ]],
            ['Jugos', '🧃', 'bebida', MenuSlot::Bebida, [
                ['Jugo natural', 6000],
                ['Jugo de mango', 6000],
                ['Limonada', 5000],
                ['Limonada de coco', 8000],
            ]],
            ['Gaseosas', '🥤', 'bebida', null, [
                ['Gaseosa personal', 4000],
                ['Gaseosa 1.5 L', 8000],
            ]],
            ['Agua', '💧', 'bebida', null, [
                ['Agua sin gas', 3000],
                ['Agua con gas', 3500],
            ]],
            ['Cafetería', '☕', 'bebida', null, [
                ['Tinto', 2000],
                ['Café con leche', 3500],
                ['Aromática', 2000],
            ]],
            ['Otras bebidas', '🍺', 'bebida', null, [
                ['Cerveza nacional', 6000],
            ]],
        ];

        $products = [];

        foreach ($catalog as $order => [$name, $icon, $section, $slot, $items]) {
            $category = Category::create([
                'name' => $name,
                'icon' => $icon,
                'section' => $section,
                'menu_slot' => $slot,
                'sort_order' => $order,
            ]);

            foreach ($items as $position => [$productName, $price]) {
                $products[$productName] = $category->products()->create([
                    'name' => $productName,
                    'price' => $price,
                    'sort_order' => $position,
                ]);
            }
        }

        return $products;
    }

    /** @param array<string, Product> $products */
    private function seedDailyMenus(array $products): void
    {
        $menus = [
            'Menú 1' => [18000, [
                MenuSlot::Principal->value => 'Pollo a la plancha',
                MenuSlot::Sopa->value => 'Sopa de verduras',
                MenuSlot::Ensalada->value => 'Ensalada de la casa',
                MenuSlot::Acompanamiento->value => 'Arroz blanco',
                MenuSlot::Bebida->value => 'Jugo natural',
            ]],
            'Menú 2' => [20000, [
                MenuSlot::Principal->value => 'Carne en salsa',
                MenuSlot::Sopa->value => 'Sopa de verduras',
                MenuSlot::Ensalada->value => 'Ensalada de repollo',
                MenuSlot::Acompanamiento->value => 'Arroz blanco',
                MenuSlot::Bebida->value => 'Limonada',
            ]],
        ];

        foreach ($menus as $name => [$price, $components]) {
            $menu = DailyMenu::create(['menu_date' => today(), 'name' => $name, 'price' => $price]);

            foreach ($components as $slot => $productName) {
                $menu->items()->create(['slot' => $slot, 'product_id' => $products[$productName]->id]);
            }
        }
    }
}
