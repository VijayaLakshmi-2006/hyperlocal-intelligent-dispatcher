import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { analyticsAPI } from '../services/serviceFactory';
import { DollarSign, Package, TrendingUp, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await analyticsAPI.getAdminAnalytics();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load admin analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-500 mt-2">Global metrics and performance overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`₹${data.stats.totalRevenue}`} icon={<DollarSign className="text-green-500" />} trend="+12%" />
        <StatCard title="Total Orders" value={data.stats.totalOrders} icon={<Package className="text-blue-500" />} trend="+8%" />
        <StatCard title="Completed Deliveries" value={data.stats.completedDeliveries} icon={<TrendingUp className="text-purple-500" />} trend="+5%" />
        <StatCard title="Active Deliveries" value={data.stats.activeDeliveries} icon={<Truck className="text-orange-500" />} isLive />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Revenue Trend */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-card border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend</h2>
          <div style={{ width: '100%', height: 320, minHeight: 320 }}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.revenueTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} tickFormatter={(val) => `₹${val}`} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Stores */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl shadow-card border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Stores</h2>
          <div className="space-y-4">
            {data.topStores.map((store, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="font-bold text-gray-900">{store.name}</p>
                  <p className="text-sm text-gray-500">{store.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">₹{store.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, isLive }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white p-6 rounded-3xl shadow-card border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-50 rounded-2xl">{icon}</div>
        {trend && <span className="text-sm font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">{trend}</span>}
        {isLive && <span className="flex items-center gap-1 text-sm font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg"><span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>Live</span>}
      </div>
      <div>
        <h3 className="text-gray-500 font-medium mb-1">{title}</h3>
        <p className="text-3xl font-black text-gray-900">{value}</p>
      </div>
    </motion.div>
  )
}
