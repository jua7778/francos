import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import RequireRole from './components/RequireRole'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ConfirmProvider } from './context/ConfirmContext'
import { LiveProvider } from './context/LiveContext'
import { ToastProvider } from './context/ToastContext'
import AdminLayout from './layouts/AdminLayout'
import AppLayout from './layouts/AppLayout'
import MeseroShell from './layouts/MeseroShell'
import CategoriesPage from './pages/admin/CategoriesPage'
import DailyMenuPage from './pages/admin/DailyMenuPage'
import DashboardPage from './pages/admin/DashboardPage'
import MenuPage from './pages/admin/MenuPage'
import ReportsPage from './pages/admin/ReportsPage'
import TablesAdminPage from './pages/admin/TablesAdminPage'
import UsersPage from './pages/admin/UsersPage'
import CashierPage from './pages/caja/CashierPage'
import PaymentsPage from './pages/caja/PaymentsPage'
import AvailabilityPage from './pages/cocina/AvailabilityPage'
import KitchenPage from './pages/cocina/KitchenPage'
import LoginPage from './pages/LoginPage'
import OrderPage from './pages/mesero/OrderPage'
import TablesPage from './pages/mesero/TablesPage'
import { ROLE_HOME } from './utils/status'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <LiveApp />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

function LiveApp() {
  const { status } = useAuth()

  return (
    <LiveProvider enabled={status === 'authed'}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireRole />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomeRedirect />} />

            <Route element={<RequireRole roles={['mesero']} />}>
              <Route element={<MeseroShell />}>
                <Route path="/mesas" element={<TablesPage />} />
                <Route path="/mesas/:tableId" element={<OrderPage />} />
              </Route>
            </Route>

            <Route element={<RequireRole roles={['cocina']} />}>
              <Route path="/cocina" element={<KitchenPage />} />
              <Route path="/cocina/agotados" element={<AvailabilityPage />} />
            </Route>

            <Route element={<RequireRole roles={['caja']} />}>
              <Route path="/caja" element={<CashierPage />} />
              <Route path="/caja/pagos" element={<PaymentsPage />} />
            </Route>

            <Route element={<RequireRole roles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<DashboardPage />} />
                <Route path="/admin/carta" element={<MenuPage />} />
                <Route path="/admin/categorias" element={<CategoriesPage />} />
                <Route path="/admin/menu-del-dia" element={<DailyMenuPage />} />
                <Route path="/admin/mesas" element={<TablesAdminPage />} />
                <Route path="/admin/usuarios" element={<UsersPage />} />
                <Route path="/admin/reportes" element={<ReportsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<HomeRedirect />} />
          </Route>
        </Route>
      </Routes>
    </LiveProvider>
  )
}

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={ROLE_HOME[user.role.slug]} replace />
}
