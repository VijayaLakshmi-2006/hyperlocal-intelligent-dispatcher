import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { orderAPI, agentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Package, MapPin, Phone, User, Clock, CheckCircle, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState(null);
  const [pastOrders, setPastOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getAgentOrders();
      const allOrders = res.data || [];
      
      // Find the active order
      const active = allOrders.find(o => !['DELIVERED', 'CANCELLED', 'PLACED', 'CONFIRMED'].includes(o.status));
      setActiveOrder(active || null);
      
      // Filter past orders
      const past = allOrders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));
      setPastOrders(past);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (action) => {
    if (!activeOrder) return;
    try {
      if (action === 'pickup') {
        await orderAPI.pickup(activeOrder._id);
        toast.success('Order Marked as Picked Up');
      } else if (action === 'outForDelivery') {
        await orderAPI.outForDelivery(activeOrder._id);
        toast.success('Order Out For Delivery');
      } else if (action === 'deliver') {
        await orderAPI.deliver(activeOrder._id);
        toast.success('Order Delivered Successfully!');
      }
      fetchOrders();
    } catch (err) {
      toast.error('Status update failed');
    }
  };

  const simulateLocationUpdate = async () => {
    if (!activeOrder?.pickupLocation) return;
    try {
      // Send a dummy location just to test the backend API
      await agentAPI.updateLocation({
        latitude: activeOrder.pickupLocation.latitude + 0.001,
        longitude: activeOrder.pickupLocation.longitude + 0.001
      });
      toast.success('Location broadcasted successfully');
    } catch (err) {
      toast.error('Failed to update location');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-bold text-sm border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Online
        </div>
      </div>

      {/* Active Order Section */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Active Assignment</h2>
      
      {activeOrder ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden mb-8">
          
          {/* Status Header */}
          <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold">
              <Package size={20} />
              <span>{activeOrder.status.replace(/_/g, ' ')}</span>
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-semibold">
              #{activeOrder._id.slice(-6).toUpperCase()}
            </span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Customer Details</h3>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600 font-bold border border-gray-200 shadow-sm">
                    {activeOrder.customer?.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{activeOrder.customer?.name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone size={12} /> {activeOrder.customer?.phone || 'No phone'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-100">
                  <MapPin size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <p>{activeOrder.deliveryAddress}</p>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Order Details</h3>
                <p className="text-gray-900 font-medium mb-4">{activeOrder.packageDetails}</p>
                
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-gray-500 font-medium">To Collect</span>
                  <span className="text-xl font-bold text-green-600">
                    {activeOrder.paymentMethod === 'cash' && activeOrder.paymentStatus !== 'paid' ? `₹${activeOrder.price}` : 'Prepaid'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {activeOrder.status === 'AGENT_ASSIGNED' && (
                <button onClick={() => handleStatusUpdate('pickup')} className="flex-1 btn-primary py-4">
                  Confirm Pickup
                </button>
              )}
              {activeOrder.status === 'PICKED_UP' && (
                <button onClick={() => handleStatusUpdate('outForDelivery')} className="flex-1 btn bg-orange-500 text-white hover:bg-orange-600 py-4">
                  Start Delivery
                </button>
              )}
              {activeOrder.status === 'OUT_FOR_DELIVERY' && (
                <>
                  <button onClick={simulateLocationUpdate} className="flex-1 btn-secondary py-4">
                    <Navigation size={18} /> Send Live Location
                  </button>
                  <button onClick={() => handleStatusUpdate('deliver')} className="flex-1 btn bg-green-500 text-white hover:bg-green-600 py-4">
                    <CheckCircle size={18} /> Mark Delivered
                  </button>
                </>
              )}
              
              <button onClick={() => navigate(`/orders/track/${activeOrder._id}`)} className="btn-ghost border border-gray-200 py-4">
                View Map
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm text-gray-300 border border-gray-100">
            🛵
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Orders</h3>
          <p className="text-gray-500 max-w-md">You currently have no active assignments. Wait for a new order to be assigned to you.</p>
        </div>
      )}

      {/* History */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Deliveries</h2>
      <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
        {pastOrders.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {pastOrders.map(order => (
              <div key={order._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Order #{order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{order.price}</p>
                  <p className="text-xs font-semibold text-green-600">Completed</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">No past deliveries found.</div>
        )}
      </div>

    </div>
  );
}
