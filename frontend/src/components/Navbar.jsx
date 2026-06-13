import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import NotificationBell from './NotificationBell'
import CartDrawer from './CartDrawer'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { isAuthenticated, logout, isCustomer, isAgent, isAdmin, user } = useAuth()
  const { cartCount } = useCart()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Stores', path: '/stores' },
    ...(isAuthenticated ? [{ name: 'Orders', path: '/orders' }] : []),
    ...(isCustomer ? [{ name: 'Insights', path: '/insights' }] : []),
    ...(isAdmin ? [{ name: 'Dashboard', path: '/admin/dashboard' }] : []),
    ...(isAgent ? [{ name: 'Agent Dashboard', path: '/agent/dashboard' }] : []),
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen
          ? 'bg-white/90 backdrop-blur-md shadow-card border-b border-gray-100 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white absolute z-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className={`text-xl font-bold tracking-tight ${isScrolled || mobileMenuOpen ? 'text-gray-900' : 'text-gray-900 lg:text-gray-900'}`}>
              Hyper<span className="text-primary-600">Dispatch</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`text-sm font-semibold transition-colors ${
                      isActive(link.path)
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-primary-600'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  
                  <div className="relative group">
                    <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-primary-200">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    </button>
                    
                    {/* Profile Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card-hover border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100">
                      <div className="p-3 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                      </div>
                      <div className="p-2">
                        <Link to="/profile" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Profile</Link>
                        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Logout</button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-primary-600">Login</Link>
                  <Link to="/register" className="btn-primary py-2 px-5 text-sm">Get Started</Link>
                  </>
              )}
              
              {/* Cart Button for Customers or Guests */}
              {(!isAuthenticated || isCustomer) && (
                <button 
                  onClick={() => setCartOpen(true)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-2"
                >
                  <span className="text-xl">🛒</span>
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-4">
            {(!isAuthenticated || isCustomer) && (
                <button 
                  onClick={() => setCartOpen(true)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-xl">🛒</span>
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                </button>
            )}
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -mr-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden bg-white border-b border-gray-100 shadow-lg"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-3 rounded-xl text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 mb-2">
                      <p className="text-base font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <Link to="/profile" className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50">Profile</Link>
                    <button onClick={handleLogout} className="w-full text-left px-3 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50">Logout</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 px-3">
                    <Link to="/login" className="btn-secondary w-full justify-center">Login</Link>
                    <Link to="/register" className="btn-primary w-full justify-center">Get Started</Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  )
}
