// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('hd_token')
      const savedUser  = localStorage.getItem('hd_user')
      if (savedToken && savedUser) {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      }
    } catch {
      localStorage.removeItem('hd_token')
      localStorage.removeItem('hd_user')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback((userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('hd_token', authToken)
    localStorage.setItem('hd_user', JSON.stringify(userData))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('hd_token')
    localStorage.removeItem('hd_user')
  }, [])

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('hd_user', JSON.stringify(updatedUser))
  }, [])

  const isAuthenticated = !!token && !!user
  const isCustomer      = user?.role === 'customer'
  const isAgent         = user?.role === 'agent'
  const isAdmin         = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, logout, updateUser,
      isAuthenticated, isCustomer, isAgent, isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
