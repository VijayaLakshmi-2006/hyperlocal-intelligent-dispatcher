import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      return toast.error('Please fill in all fields')
    }

    try {
      setLoading(true)
      const res = await authAPI.login(formData)
      login(res.data.user, res.data.token)
      toast.success('Welcome back!')
      navigate('/orders')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left split - Image/Branding */}
      <div className="hidden lg:flex w-1/2 bg-primary-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-500 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-primary-700 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 text-white">
            <div className="w-10 h-10 rounded-xl bg-white text-primary-600 flex items-center justify-center font-bold text-xl shadow-lg">H</div>
            <span className="text-2xl font-bold tracking-tight">HyperDispatch</span>
          </Link>
        </div>

        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-4xl font-black mb-6 leading-tight">Welcome back to the fastest delivery network.</h2>
          <p className="text-primary-100 text-lg">Manage your orders, track live agents, and power your local logistics seamlessly.</p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 text-primary-200 text-sm font-medium">
          <div className="flex -space-x-3">
            {[1,2,3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-primary-600 bg-primary-300"></div>
            ))}
          </div>
          <p>Join 5,000+ active users</p>
        </div>
      </div>

      {/* Right split - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-gray-50 lg:bg-white relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md bg-white p-8 lg:p-0 rounded-3xl lg:rounded-none shadow-card lg:shadow-none border border-gray-100 lg:border-none"
        >
          <div className="text-center lg:text-left mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in to your account</h1>
            <p className="text-gray-500">Don't have an account? <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">Create one</Link></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="input-field" 
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700">Forgot password?</a>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="input-field pr-12" 
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input type="checkbox" id="remember" className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Remember me for 30 days</label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`btn-primary w-full py-3.5 text-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
