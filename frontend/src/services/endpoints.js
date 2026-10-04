import { api } from './api'

// Todas las llamadas a la API agrupadas por área del restaurante.

export const authApi = {
  login: (username, password) => api.post('/login', { username, password }),
  me: () => api.get('/me'),
  logout: () => api.post('/logout'),
}

export const liveApi = {
  pulse: () => api.get('/pulse'),
}

export const catalogApi = {
  catalog: () => api.get('/catalog'),
  setProductAvailability: (id, isAvailable) => api.patch(`/products/${id}/availability`, { is_available: isAvailable }),
  setMenuAvailability: (id, isAvailable) => api.patch(`/daily-menu/${id}/availability`, { is_available: isAvailable }),
}

export const tablesApi = {
  list: () => api.get('/tables'),
  show: (id) => api.get(`/tables/${id}`),
}

export const ordersApi = {
  list: (params = {}) => api.get(`/orders?${new URLSearchParams(params)}`),
  // Envía a cocina: crea el pedido de la mesa o agrega una comanda adicional.
  send: (tableId, items) => api.post('/orders', { table_id: tableId, items }),
  sendToCashier: (id) => api.patch(`/orders/${id}/status`, { status: 'en_caja' }),
  cancel: (id, reason) => api.patch(`/orders/${id}/status`, { status: 'cancelado', reason }),
}

export const ticketsApi = {
  kitchen: () => api.get('/kitchen/tickets'),
  setStatus: (id, status) => api.patch(`/tickets/${id}/status`, { status }),
}

export const paymentsApi = {
  list: (date) => api.get(`/payments${date ? `?date=${date}` : ''}`),
  pay: (orderId, method, receivedAmount) =>
    api.post('/payments', { order_id: orderId, method, received_amount: receivedAmount ?? null }),
}

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  reports: (from, to) => api.get(`/admin/reports?${new URLSearchParams({ from, to })}`),

  categories: () => api.get('/admin/categories'),
  saveCategory: (data, id) => (id ? api.put(`/admin/categories/${id}`, data) : api.post('/admin/categories', data)),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  products: () => api.get('/admin/products'),
  // Se usa FormData por la foto; la edición va por POST (Laravel no lee archivos en PUT).
  saveProduct: (formData, id) => api.post(id ? `/admin/products/${id}` : '/admin/products', formData),
  setProductActive: (product, isActive) =>
    api.put(`/admin/products/${product.id}`, {
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      description: product.description,
      is_available: product.is_available,
      is_active: isActive,
    }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  tables: () => api.get('/admin/tables'),
  saveTable: (data, id) => (id ? api.put(`/admin/tables/${id}`, data) : api.post('/admin/tables', data)),
  deleteTable: (id) => api.delete(`/admin/tables/${id}`),

  users: () => api.get('/admin/users'),
  roles: () => api.get('/admin/roles'),
  saveUser: (data, id) => (id ? api.put(`/admin/users/${id}`, data) : api.post('/admin/users', data)),
  deactivateUser: (id) => api.delete(`/admin/users/${id}`),

  dailyMenus: () => api.get('/admin/daily-menus'),
  saveDailyMenu: (data, id) => (id ? api.put(`/admin/daily-menus/${id}`, data) : api.post('/admin/daily-menus', data)),
  deleteDailyMenu: (id) => api.delete(`/admin/daily-menus/${id}`),
  copyLatestMenus: () => api.post('/admin/daily-menus/copy-latest'),
}
