// src/services/api.js
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hd_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Centralized error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hd_token')
      localStorage.removeItem('hd_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/* ===================== AUTH ===================== */
export const authAPI = {
  register: (data)          => api.post('/api/auth/register', data),
  login:    (data)          => api.post('/api/auth/login', data),
  getProfile: ()            => api.get('/api/auth/profile'),
  updateProfile: (data)     => api.put('/api/auth/profile', data),
  changePassword: (data)    => api.put('/api/auth/profile/password', data),
}

/* ===================== ORDERS ===================== */
export const orderAPI = {
  createOrder:   (data)     => api.post('/api/orders/create', data),
  getMyOrders:   ()         => api.get('/api/orders/my-orders'),
  trackOrder:    (orderId)  => api.get(`/api/orders/track/${orderId}`),
  // Agent-only
  getPending:    ()         => api.get('/api/orders/pending'),
  acceptOrder:   (orderId)  => api.put(`/api/orders/accept/${orderId}`),
  updateStatus:  (orderId, status) => api.put(`/api/orders/update-status/${orderId}`, { status }),
  getAgentOrders: ()        => api.get('/api/orders/agent-orders'),
  // New Lifecycle
  confirm:       (orderId)  => api.patch(`/api/orders/${orderId}/confirm`),
  assignAgent:   (orderId)  => api.patch(`/api/orders/${orderId}/assign-agent`),
  pickup:        (orderId)  => api.patch(`/api/orders/${orderId}/pickup`),
  outForDelivery:(orderId)  => api.patch(`/api/orders/${orderId}/out-for-delivery`),
  deliver:       (orderId)  => api.patch(`/api/orders/${orderId}/deliver`),
  cancel:        (orderId, payload) => api.patch(`/api/orders/${orderId}/cancel`, payload),
}

/* ===================== AGENTS ===================== */
export const agentAPI = {
  updateLocation: (data)    => api.put('/api/agents/location', data),
  getNearby: (params)       => api.get('/api/agents/nearby', { params }),
  getOnline: ()             => api.get('/api/agents/online'),
}

/* ===================== ADMIN ===================== */
export const adminAPI = {
  getMapDashboard: ()       => api.get('/api/admin/map-dashboard'),
}

/* ===================== AI ===================== */
export const aiAPI = {
  search: (data)            => api.post('/api/ai/search', data),
  placeOrder: (data)        => api.post('/api/ai/order', data),
  getAnalytics: ()          => api.get('/api/ai/analytics'),
}

/* ===================== SHOPS ===================== */
export const shopAPI = {
  getShops: ()              => api.get('/api/shops'),
  create: (data)            => api.post('/api/shops', data),
  seedDemo: ()              => api.post('/api/shops/seed-demo'),
}

/* ===================== ANALYTICS ===================== */
export const analyticsAPI = {
  getCustomerAnalytics: ()  => api.get('/api/analytics/customer'),
  getAdminAnalytics: ()     => api.get('/api/analytics/admin'),
}

/* ===================== AI CART BUILDER ===================== */
export const aiCartAPI = {
  buildCart:         (payload)  => api.post('/api/ai/cart-builder', payload),
  addCart:           (items)  => api.post('/api/ai/add-cart', { items }),
  spendingInsights:  ()       => api.get('/api/ai/spending-insights'),
  recommendReorder:  ()       => api.get('/api/ai/recommend-reorder'),
}

export default api
