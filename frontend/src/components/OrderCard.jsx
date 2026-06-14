import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { MapPin, Phone, RefreshCw, XCircle, CreditCard, ChevronRight, Package, Store, Calendar, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found better price',
  'Delivery taking too long',
  'Changed my mind',
  'Other'
];

export default function OrderCard({ order, role }) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const { addToCart, clearCart } = useCart();
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PLACED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AGENT_ASSIGNED':
      case 'PICKED_UP': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDisplayStatus = (status) => {
    switch(status) {
      case 'PLACED': return 'Pending';
      case 'CONFIRMED': return 'Confirmed';
      case 'AGENT_ASSIGNED':
      case 'PICKED_UP': return 'Preparing';
      case 'OUT_FOR_DELIVERY': return 'Out For Delivery';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) {
      toast.error('Please select a cancellation reason.');
      return;
    }
    setIsCancelling(true);
    try {
      // In a real app we'd pass reason: cancelReason via API. 
      // Assuming orderAPI.cancel supports (id, payload)
      await orderAPI.cancel(order._id, { reason: cancelReason });
      toast.success('Order cancelled successfully.');
      setShowCancelModal(false);
      window.location.reload(); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReorder = () => {
    if (!order.commerceItems || order.commerceItems.length === 0) {
      toast.error("Can't reorder. No products found.");
      return;
    }
    clearCart();
    
    const store = {
      _id: order.shop?._id || order.shop,
      shopName: order.shop?.shopName || 'Previous Store',
      address: order.pickupAddress,
    };

    order.commerceItems.forEach((item) => {
      const cartProduct = {
        _id: item._id || Math.random().toString(),
        name: item.productName,
        price: item.unitPrice,
        category: item.category || 'General',
        requestedQuantity: item.quantity,
        storeId: store._id,
        storeName: store.shopName,
      };
      // add item quantity times
      for(let i=0; i < item.quantity; i++){
        addToCart(cartProduct, store, true);
      }
    });

    toast.success('Items added to cart!');
    navigate('/checkout');
  };

  const handlePayment = () => {
    navigate('/payment', { state: { orderPayload: null }}); // The real app might pass actual details to process
    toast('Payment flow initiated', { icon: '💳' });
  };

  // Timeline Tracker Logic
  const timelineSteps = [
    { key: 'PLACED', label: 'Pending' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'AGENT_ASSIGNED', label: 'Preparing' }, // Combine preparing
    { key: 'OUT_FOR_DELIVERY', label: 'Out For Delivery' },
    { key: 'DELIVERED', label: 'Delivered' }
  ];

  const currentStepIndex = timelineSteps.findIndex(s => 
    s.key === order.status || (order.status === 'PICKED_UP' && s.key === 'AGENT_ASSIGNED')
  );

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-card-hover transition-all overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-gray-50 flex justify-between items-start bg-gray-50/30">
        <div>
          <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">#{order._id.slice(-6).toUpperCase()}</span>
          <h3 className="font-bold text-gray-900 mt-2 flex items-center gap-1.5 truncate max-w-[200px]" title={order.shop?.shopName || 'Store'}>
            <Store size={14} className="text-gray-400" />
            {order.shop?.shopName || 'Local Store'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <Calendar size={12} /> {formatDate(order.createdAt)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
          {getDisplayStatus(order.status)}
        </span>
      </div>

      {/* Progress Timeline (if active) */}
      {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
        <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-50">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
            {timelineSteps.map((step, idx) => {
              const isCompleted = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;
              return (
                <div key={step.key} className="flex flex-col items-center gap-1 relative z-10 bg-gray-50/50 px-1">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                    isCompleted ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300'
                  }`}>
                    {isCompleted && !isCurrent && <CheckCircle2 size={10} />}
                    {isCurrent && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isCurrent ? 'text-primary-700' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-5 flex-grow space-y-5">
        
        {/* Product Information */}
        {order.commerceItems && order.commerceItems.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Products</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {order.commerceItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                      <Package size={12} className="text-gray-400" />
                    </div>
                    <span className="font-medium text-gray-800 truncate">{item.productName}</span>
                    <span className="text-xs text-gray-500 shrink-0">x{item.quantity}</span>
                  </div>
                  <span className="font-semibold text-gray-900 shrink-0">₹{item.unitPrice * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Details */}
        <div>
           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery</h4>
           <div className="flex items-start gap-2 text-sm text-gray-600">
             <MapPin size={14} className="mt-0.5 text-red-400 shrink-0" />
             <span className="line-clamp-2 leading-relaxed" title={order.deliveryAddress}>{order.deliveryAddress}</span>
           </div>
        </div>

      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 p-5 mt-auto">
        <div className="space-y-1.5 text-sm mb-4">
           <div className="flex justify-between text-gray-500">
             <span>Items ({order.commerceItems?.reduce((acc, item) => acc + item.quantity, 0) || 0})</span>
             <span>₹{order.price - (order.deliveryFee||0) - (order.platformFee||0) - (order.taxAmount||0)}</span>
           </div>
           <div className="flex justify-between text-gray-500">
             <span>Delivery Fee</span>
             <span>{order.deliveryFee ? `₹${order.deliveryFee}` : 'Free'}</span>
           </div>
           <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
             <span>Grand Total</span>
             <span>₹{order.price}</span>
           </div>
           {order.paymentMethod === 'online' && order.paymentStatus === 'pending' && (
             <div className="flex justify-between text-amber-600 text-xs font-semibold pt-1">
               <span>Payment Status</span>
               <span>Pending</span>
             </div>
           )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {['PLACED', 'CONFIRMED', 'AGENT_ASSIGNED'].includes(order.status) && (
            <button 
              onClick={() => {
                setCancelReason('');
                setShowCancelModal(true);
              }}
              className="w-full py-2.5 rounded-xl font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={16} /> Cancel Order
            </button>
          )}

          {order.status === 'DELIVERED' || order.status === 'CANCELLED' ? (
             <button 
               onClick={handleReorder}
               className="w-full py-2.5 rounded-xl font-bold text-sm btn-primary flex items-center justify-center gap-2"
             >
               <RefreshCw size={16} /> Reorder
             </button>
          ) : (
            <Link 
              to={`/orders/track/${order._id}`}
              className="w-full text-center block py-2.5 rounded-xl font-bold text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
            >
              Track Order <ChevronRight size={16} className="inline mb-0.5" />
            </Link>
          )}

          {order.paymentStatus === 'pending' && order.paymentMethod === 'online' && order.status !== 'CANCELLED' && (
            <button 
              onClick={handlePayment}
              className="w-full py-2.5 mt-1 rounded-xl font-bold text-sm bg-gray-900 text-white hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard size={16} /> Proceed to Payment
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Order?</h3>
              
              {order.status === 'AGENT_ASSIGNED' && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm mb-4">
                  <strong>Warning:</strong> Agent is already assigned. Cancellation fee may apply.
                </div>
              )}
              
              <p className="text-gray-500 text-sm mb-4">Please select a reason for cancellation:</p>
              
              <div className="space-y-2 mb-6">
                {CANCEL_REASONS.map(reason => (
                  <label key={reason} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="cancelReason" 
                      value={reason} 
                      checked={cancelReason === reason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    {reason}
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  No, Keep it
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
