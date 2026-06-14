import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { shopService } from '../services/serviceFactory'
import StoreCard from '../components/StoreCard'
import AiCartSection from '../components/AiCartSection'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await shopService.getShops()
        setStores(res.data)
      } catch (err) {
        toast.error('Failed to load stores')
      } finally {
        setLoading(false)
      }
    }
    fetchStores()
  }, [])

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary-50 pt-20 pb-32">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 font-bold text-sm border border-amber-200 shadow-sm">
                  ⚡ Delivery in 5–7 Minutes
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm border border-primary-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                  </span>
                  Live Real-Time Tracking
                </div>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
                Delivery <span className="gradient-text">Reimagined</span> for Local Business
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed font-light">
                HyperDispatch connects you to the fastest delivery network. Track your orders live on the map with AI route optimization and an ultra-fast 5-7 minute delivery promise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => document.getElementById('ai-section').scrollIntoView({ behavior: 'smooth' })}
                      id="ai-cart-button"
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
                    >
                      <Sparkles size={20} />
                      🤖 Ask AI
                    </button>
                    <Link to="/stores" className="btn-secondary text-lg px-8 py-4">Explore Stores</Link>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary text-lg px-8 py-4 shadow-card-hover">Get Started Now</Link>
                    <Link to="/login" className="btn-secondary text-lg px-8 py-4">Sign In</Link>
                  </>
                )}
              </div>
              
              <div className="mt-12 flex items-center gap-8 text-gray-500">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-gray-900">5k+</span>
                  <span className="text-sm font-medium">Active Partners</span>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-gray-900">5-7m</span>
                  <span className="text-sm font-medium">Average ETA</span>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-gray-900">99.9%</span>
                  <span className="text-sm font-medium">Uptime SLA</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Abstract App UI Mockup */}
              <div className="relative mx-auto w-full max-w-md rounded-[2.5rem] bg-white border-[8px] border-gray-900 shadow-2xl overflow-hidden aspect-[9/19]">
                <div className="absolute top-0 w-full h-6 bg-gray-900 rounded-b-3xl z-20"></div>
                
                {/* Map background placeholder */}
                <div className="absolute inset-0 bg-[#E5E5E5]">
                  <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(#2563EB 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  
                  {/* Route SVG */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M20,80 C20,50 80,50 80,20" fill="none" stroke="#2563EB" strokeWidth="3" strokeDasharray="5,5" className="animate-pulse" />
                  </svg>
                  
                  {/* Markers */}
                  <div className="absolute top-[20%] right-[20%] w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg z-10"></div>
                  <div className="absolute bottom-[20%] left-[20%] w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg z-10"></div>
                  
                  {/* Agent moving */}
                  <motion.div 
                    animate={{ top: ['80%', '20%'], left: ['20%', '80%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="absolute w-8 h-8 bg-primary-600 rounded-full border-4 border-white shadow-lg z-20 flex items-center justify-center agent-marker-pulse"
                    style={{ transform: 'translate(-50%, -50%)' }}
                  >
                    <span className="text-xs text-white">🛵</span>
                  </motion.div>
                </div>

                {/* Bottom Sheet UI Mock */}
                <div className="absolute bottom-0 w-full h-2/5 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-5 z-30 flex flex-col">
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-bold text-lg">On the way</h4>
                      <p className="text-gray-500 text-sm">Arriving in 8 mins</p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-xl">
                      🚀
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl mt-auto">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-sm">Rahul Kumar</p>
                      <p className="text-xs text-gray-500">Suzuki Access • TS08AB1234</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Cart Section */}
      <div id="ai-section">
        <AiCartSection />
      </div>

      {/* Featured Stores Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Stores near you</h2>
              <p className="text-gray-600">Get fresh groceries, medicines, and food delivered in minutes.</p>
            </div>
            <div className="hidden sm:block">
              <Link to="/stores" className="inline-block px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50">View all stores →</Link>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="h-32 bg-gray-200 skeleton"></div>
                  <div className="p-5 flex-1 space-y-4">
                    <div className="h-6 w-1/2 bg-gray-200 skeleton rounded"></div>
                    <div className="h-4 w-3/4 bg-gray-100 skeleton rounded"></div>
                    <div className="space-y-3 pt-4">
                      <div className="h-12 w-full bg-gray-50 skeleton rounded-xl"></div>
                      <div className="h-12 w-full bg-gray-50 skeleton rounded-xl"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : stores.length > 0 ? (
            <div id="stores-grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stores.map((store, i) => (
                <motion.div
                  key={store._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <StoreCard store={store} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-4xl mb-4 block">🏪</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No stores available</h3>
              <p className="text-gray-500">We are expanding our network. Check back later!</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary-600 font-semibold tracking-wide uppercase text-sm mb-3">Enterprise Grade</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features for Modern Delivery</h3>
            <p className="text-lg text-gray-600">Everything you need to manage local logistics with precision and scale.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Real-Time Tracking', desc: 'Live socket connections show sub-second agent movement.', icon: '🛰️', color: 'bg-blue-100 text-blue-600' },
              { title: 'AI Route Sync', desc: 'Smart algorithms match nearest agents to reduce pickup times.', icon: '🧠', color: 'bg-purple-100 text-purple-600' },
              { title: 'Instant Notifications', desc: 'Status changes pushed immediately via WebSockets.', icon: '⚡', color: 'bg-yellow-100 text-yellow-600' },
              { title: 'Secure & Scalable', desc: 'Built on Node.js + MongoDB designed to handle scale.', icon: '🛡️', color: 'bg-green-100 text-green-600' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-card-hover transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-6 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-900/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How HyperDispatch Works</h2>
            <p className="text-gray-400 text-lg">Four simple steps to get anything delivered instantly.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Place Order', desc: 'Enter pickup & drop locations with package details.' },
              { step: '02', title: 'Agent Assigned', desc: 'Our AI finds the nearest available delivery partner.' },
              { step: '03', title: 'Track Live', desc: 'Watch your order move on the map in real-time.' },
              { step: '04', title: 'Delivered', desc: 'Package safely arrives at the destination.' },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="text-6xl font-black text-gray-800 mb-6 group-hover:text-primary-600 transition-colors duration-300">{item.step}</div>
                <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-10 -right-4 w-8 border-t-2 border-dashed border-gray-700"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
