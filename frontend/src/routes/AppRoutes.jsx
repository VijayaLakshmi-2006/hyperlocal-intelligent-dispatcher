import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MainLayout from '../layouts/MainLayout'

// Pages
import Home from '../pages/Home'
import Stores from '../pages/Stores'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Profile from '../pages/Profile'
import Orders from '../pages/Orders'
import OrderTracking from '../pages/OrderTracking'
import Checkout from '../pages/Checkout'
import Payment from '../pages/Payment'
import Insights from '../pages/Insights'
import AdminDashboard from '../pages/AdminDashboard'
import AgentDashboard from '../pages/AgentDashboard'

// Protected Route Wrapper
const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          {/* Support both old and new tracking URL patterns */}
          <Route path="/orders/track/:id" element={<OrderTracking />} />
          <Route path="/order/:id/tracking" element={<OrderTracking />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
        </Route>
      </Route>
    </Routes>
  )
}
