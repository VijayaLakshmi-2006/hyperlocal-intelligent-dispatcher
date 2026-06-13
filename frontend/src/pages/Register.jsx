import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', password: '', role: 'customer' 
  })
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error('Please fill in required fields')
    }

    try {
      setLoading(true)
      const res = await authAPI.register(formData)
      login(res.data.user, res.data.token)
      toast.success('Account created successfully!')
      navigate('/orders')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gray-50 pt-24 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white p-8 sm:p-12 rounded-3xl shadow-card border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h1>
          <p className="text-gray-500">Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Log in</Link></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Role selection toggle */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
            {['customer', 'agent'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormData({...formData, role})}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg capitalize transition-all ${
                  formData.role === role 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="input-field" 
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="input-field" 
                placeholder="you@company.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="input-field" 
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="input-field" 
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className={`btn-primary w-full py-3.5 text-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </div>
          
          <p className="text-xs text-center text-gray-500 mt-6">
            By clicking "Create Account", you agree to our <a href="#" className="underline hover:text-gray-700">Terms of Service</a> and <a href="#" className="underline hover:text-gray-700">Privacy Policy</a>.
          </p>
        </form>
      </motion.div>
    </div>
  )
}
