# Sistema de pedidos del restaurante

Flujo **MESERO → COCINA → CAJA**, con control de productos agotados, Menú del Día y panel administrativo.

- `backend/` — Laravel 13 · API REST · Sanctum (tokens) · PostgreSQL
- `frontend/` — React 19 · React Router · Tailwind CSS 4 (Vite)

## Puesta en marcha (desarrollo)

Requisitos: PHP 8.3+ con `pdo_pgsql`, Composer, Node 20+, PostgreSQL (o Docker).

```bash
# 1. Base de datos (contenedor propio en el puerto 5433)
docker run -d --name restaurante-postgres -e POSTGRES_USER=restaurante -e POSTGRES_PASSWORD=restaurante \
  -e POSTGRES_DB=restaurante -p 127.0.0.1:5433:5432 -v restaurante-pgdata:/var/lib/postgresql/data postgres:17

# 2. Backend
cd backend
composer install
php artisan migrate:fresh --seed   # crea tablas + datos de ejemplo
php artisan storage:link           # fotos de productos
php artisan serve                  # http://127.0.0.1:8000

# 3. Frontend (otra terminal)
cd frontend
npm install
npm run dev                        # http://localhost:8090 · en la red: http://<IP-del-PC>:8090
# o bien: npm run restaurante      # versión compilada, recomendada para el uso diario
```

Vite reenvía `/api` y `/storage` al backend, así que no hace falta configurar CORS.

### Usuarios de ejemplo (contraseña `1234`)

| Usuario  | Rol           | Pantalla          |
|----------|---------------|-------------------|
| `admin`  | Administrador | `/admin` (y todas)|
| `maria`, `carlos` | Mesero | `/mesas`        |
| `cocina` | Cocina        | `/cocina`         |
| `caja`   | Caja          | `/caja`           |

Cambie estas contraseñas desde **Administrar → Usuarios** antes de usarlo en el restaurante.

## Cómo funciona

**Pedido = la cuenta de una mesa.** Cada envío a cocina crea una **comanda** (`kitchen_tickets`).
Un pedido adicional ("otro jugo para la Mesa 4") es una comanda nueva dentro del mismo pedido:
cocina ve solo lo nuevo y la cuenta conserva todo el historial.

Estados de la comanda: `pendiente → en_preparacion → listo → entregado` (o `cancelado`).
El estado del pedido (`pendiente`, `en_preparacion`, `listo`, `en_caja`, `pagado`, `cancelado`)
lo calcula el backend a partir de sus comandas (`OrderService::refresh`).

**Tiempo real:** las pantallas consultan `GET /api/pulse` cada 2 s. Es una respuesta mínima con
contadores de versión (`orders`, `catalog`, `tables`) y solo se recargan los datos cuando cambia
alguno. No requiere un servidor de WebSockets extra. Si se pierde la conexión, aparece un aviso rojo.

**Historial seguro:** nombre y precio se copian en `order_items` al pedir. Los productos usados
no se borran, se desactivan. Un índice único parcial en PostgreSQL impide dos pedidos abiertos
en la misma mesa.

**Permisos:** middleware `role:` en las rutas + Policies (`OrderPolicy`, `KitchenTicketPolicy`).
React solo oculta pantallas; toda validación y permiso se aplica en Laravel.

## API principal

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/login`, `/api/logout` · GET `/api/me` | todos |
| GET | `/api/pulse`, `/api/catalog`, `/api/categories`, `/api/products`, `/api/daily-menu` | todos |
| GET | `/api/tables`, `/api/tables/{id}`, `/api/orders`, `/api/orders/{id}` | mesero, caja |
| POST | `/api/orders` (envía a cocina / agrega adicional) | mesero |
| PATCH | `/api/orders/{id}/status` (`en_caja` o `cancelado`) | mesero, caja |
| GET | `/api/kitchen/tickets` | cocina |
| PATCH | `/api/tickets/{id}/status` | cocina (preparar/listo), mesero (entregado/cancelar) |
| PATCH | `/api/products/{id}/availability`, `/api/daily-menu/{id}/availability` | cocina |
| GET/POST | `/api/payments` | caja |
| * | `/api/admin/...` (dashboard, reports, categories, products, tables, users, roles, daily-menus) | admin |

El administrador pasa todas las verificaciones de rol.

## Pruebas

```bash
cd backend
docker exec restaurante-postgres psql -U restaurante -c "CREATE DATABASE restaurante_test"   # una sola vez
php artisan test
```

`tests/Feature/RestaurantFlowTest.php` cubre: el flujo completo, pedidos adicionales, agotado y
vuelta a disponible, el Menú del Día (con plato principal o acompañante agotado), pedidos
simultáneos, cancelaciones, el doble cobro, los permisos por rol, usuarios inactivos, productos
desactivados con historial, copiar el menú de ayer y el índice de una sola cuenta abierta por mesa.

## Uso en la red local del restaurante

- `iniciar-restaurante.bat`: con doble clic arranca todo y muestra la dirección para las tablets.
- `abrir-puerto-firewall.bat`: se ejecuta **una sola vez** como administrador y abre el puerto 8090.
- En tablets y celulares conectados al mismo WiFi/red, abra `http://<IP-del-PC>:8090`.
- Laravel solo escucha en `127.0.0.1:8000`. Desde la red se entra únicamente por el puerto 8090.
