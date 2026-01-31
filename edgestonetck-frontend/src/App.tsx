import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import OverviewPage from './pages/dashboard/OverviewPage'
import TicketsPage from './pages/dashboard/TicketsPage'
import ClientsPage from './pages/dashboard/ClientsPage'
import VendorsPage from './pages/dashboard/VendorsPage'
import AssignAgentsPage from './pages/dashboard/AssignAgentsPage'
import SLAPage from './pages/dashboard/SLAPage'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard/:id" element={<DashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="assign-agents" element={
              <ProtectedRoute requireSuperAdmin={true}>
                <AssignAgentsPage />
              </ProtectedRoute>
            } />
            <Route path="sla" element={<SLAPage />} />
          </Route>

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Fallback for 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
