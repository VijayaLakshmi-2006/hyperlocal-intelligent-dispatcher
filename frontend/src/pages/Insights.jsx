// src/pages/Insights.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { analyticsAPI } from '../services/serviceFactory';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Wallet, Clock, TrendingDown, Store, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsAPI.getCustomerAnalytics();
        setData(res.data);
      } catch {
        toast.error('Failed to load insights');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="space-y-6 w-full max-w-7xl px-4">
          <div className="h-10 w-48 bg-gray-200 skeleton rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 skeleton rounded-2xl" />)}
          </div>
          <div className="h-72 bg-gray-200 skeleton rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Your Insights</h1>
          <p className="text-gray-500 mt-1">Hey {user?.name?.split(' ')[0]} 👋, here's your delivery overview</p>
        </div>

        {/* Key Metrics — 4 Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Orders"
            value={data.stats.ordersCount}
            icon={<ShoppingBag size={22} />}
            gradient="from-blue-500 to-blue-600"
            bg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <MetricCard
            label="Total Spending"
            value={`₹${(data.stats.avgOrderValue * data.stats.ordersCount || 0).toFixed(0)}`}
            icon={<Wallet size={22} />}
            gradient="from-violet-500 to-purple-600"
            bg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <MetricCard
            label="Avg Delivery"
            value={`${data.delivery.avgDeliveryTime}m`}
            icon={<Clock size={22} />}
            gradient="from-orange-500 to-amber-600"
            bg="bg-orange-50"
            iconColor="text-orange-600"
          />
          <MetricCard
            label="Money Saved"
            value={`₹${data.stats.moneySaved || 0}`}
            icon={<TrendingDown size={22} />}
            gradient="from-emerald-500 to-green-600"
            bg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>

        {/* Spending Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Spending Trend</h2>
          {data.monthlySpend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.monthlySpend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [`₹${v}`, 'Spent']}
                />
                <Line
                  type="monotone"
                  dataKey="spend"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#fff', strokeWidth: 2, stroke: '#2563eb' }}
                  activeDot={{ r: 7, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <ShoppingBag size={40} className="mb-3 text-gray-200" />
              <p className="text-sm">Place more orders to see your spending trend</p>
            </div>
          )}
        </motion.div>

        {/* Bottom Grid: Favorite Store + Most Ordered + Recent Orders */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Favorite Store */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col"
          >
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Store size={16} className="text-primary-600" /> Favourite Store
            </h2>
            {data.favoriteStore ? (
              <div className="flex-1 flex items-center gap-4 bg-primary-50 rounded-2xl p-4">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-2xl">🏪</div>
                <div>
                  <p className="font-bold text-gray-900">{data.favoriteStore}</p>
                  <p className="text-sm text-gray-500">Your go-to store</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-4">
                <Store size={36} className="mb-2 text-gray-200" />
                <p className="text-sm text-center">Order from stores to see your favourite</p>
              </div>
            )}
          </motion.div>

          {/* Most Ordered Category */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col"
          >
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart size={16} className="text-secondary-600" /> Top Category
            </h2>
            {data.favoriteCategory ? (
              <div className="flex-1 flex items-center gap-4 bg-secondary-50 rounded-2xl p-4">
                <div className="w-14 h-14 bg-secondary-100 rounded-2xl flex items-center justify-center text-2xl">
                  {data.favoriteCategory === 'Grocery' ? '🛒' :
                   data.favoriteCategory === 'Food' ? '🍕' :
                   data.favoriteCategory === 'Pharmacy' ? '💊' :
                   data.favoriteCategory === 'Electronics' ? '⚡' : '📦'}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{data.favoriteCategory}</p>
                  <p className="text-sm text-gray-500">Most ordered category</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-4">
                <ShoppingCart size={36} className="mb-2 text-gray-200" />
                <p className="text-sm text-center">No category data yet</p>
              </div>
            )}
          </motion.div>

          {/* Recent Orders */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
              <Link to="/orders" className="text-sm text-primary-600 font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {data.recentOrders?.length > 0 ? (
              <div className="space-y-3 flex-1">
                {data.recentOrders.slice(0, 5).map((order, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">#{order._id?.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">₹{order.price}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-4">
                <p className="text-sm text-center">No orders yet.</p>
                <Link to="/stores" className="mt-3 btn-primary py-2 px-4 text-sm">Browse Stores</Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, gradient, bg, iconColor }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
    >
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3 ${iconColor}`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </motion.div>
  );
}
