// src/pages/Payment.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, CreditCard, Smartphone, Wallet, Banknote, Lock, ChevronRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/serviceFactory';
import toast from 'react-hot-toast';

const UPI_APPS = [
  { id: 'gpay',    name: 'Google Pay',  icon: '🔵', color: 'bg-blue-50 border-blue-200' },
  { id: 'phonepe', name: 'PhonePe',     icon: '💜', color: 'bg-purple-50 border-purple-200' },
  { id: 'paytm',   name: 'Paytm',       icon: '🔷', color: 'bg-sky-50 border-sky-200' },
  { id: 'other',   name: 'Other UPI',   icon: '📱', color: 'bg-gray-50 border-gray-200' },
];

const PAYMENT_METHODS = [
  { id: 'upi',  label: 'UPI',             icon: <Smartphone size={20} />,  desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Credit/Debit Card', icon: <CreditCard size={20} />,  desc: 'Visa, Mastercard, Rupay' },
  { id: 'wallet', label: 'Wallet',         icon: <Wallet size={20} />,       desc: 'Paytm, Amazon Pay' },
  { id: 'cod',  label: 'Cash on Delivery', icon: <Banknote size={20} />,     desc: 'Pay at doorstep' },
];

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, grandTotal, subtotal, deliveryFee, platformFee, taxAmount, clearCart } = useCart();

  const orderPayload = location.state?.orderPayload;

  const [method, setMethod] = useState('upi');
  const [upiApp, setUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Redirect if cart is empty and no order payload
  useEffect(() => {
    if (cartItems.length === 0 && !orderPayload) {
      navigate('/');
    }
  }, []);

  const handlePay = async () => {
    if (method === 'card') {
      if (!cardNum || !cardExpiry || !cardCvv || !cardName) {
        toast.error('Please fill all card details');
        return;
      }
    }
    if (method === 'upi' && upiApp === 'other' && !upiId) {
      toast.error('Please enter your UPI ID');
      return;
    }

    setProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise(r => setTimeout(r, 2000));

      // Place the actual order
      const payload = orderPayload || {
        pickupLocation: {
          address: cartItems[0]?.store?.address || 'Store location',
          latitude: cartItems[0]?.store?.location?.coordinates[1] || 17.44,
          longitude: cartItems[0]?.store?.location?.coordinates[0] || 78.39,
        },
        deliveryLocation: {
          address: 'My Home',
          latitude: 17.45,
          longitude: 78.40,
        },
        packageDetails: cartItems.map(i => `${i.quantity}x ${i.name}`).join(', '),
        commerceItems: cartItems.map(item => ({
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          category: item.category || 'General'
        })),
        price: grandTotal,
        deliveryFee: deliveryFee || 0,
        platformFee: platformFee || 0,
        taxAmount: taxAmount || 0,
        paymentMethod: method === 'cod' ? 'cash' : 'online',
        shopId: cartItems[0]?.store?._id,
      };

      const res = await orderService.createOrder(payload);
      const newOrderId = res.data.order._id;

      setOrderId(newOrderId);
      setSuccess(true);
      clearCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleTrackOrder = () => {
    navigate(`/orders/track/${orderId}`);
  };

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center"
        >
          {/* Success Ring Animation */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, delay: 0.4 }}
              >
                <CheckCircle size={60} className="text-emerald-500" />
              </motion.div>
            </motion.div>
            {/* Sparkle dots */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 48],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 48],
                }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.8 }}
                className="absolute top-1/2 left-1/2 w-3 h-3 bg-emerald-400 rounded-full"
                style={{ marginTop: -6, marginLeft: -6 }}
              />
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Successful! 🎉</h2>
            <p className="text-gray-500 mb-2">Your order has been placed and confirmed.</p>
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 mt-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-black text-gray-900 text-base">₹{grandTotal || subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-semibold text-gray-700 capitalize">{PAYMENT_METHODS.find(m => m.id === method)?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono font-semibold text-primary-600">#{orderId?.slice(-8).toUpperCase()}</span>
              </div>
            </div>
            <button
              id="track-order-btn"
              onClick={handleTrackOrder}
              className="btn-primary w-full py-4 text-lg mb-3 shadow-lg"
            >
              Track Live Order
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="btn-secondary w-full py-3 text-base"
            >
              View All Orders
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Checkout
        </button>

        <h1 className="text-3xl font-black text-gray-900 mb-8">Secure Payment</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* LEFT: Payment Form */}
          <div className="lg:col-span-3 space-y-6">

            {/* Payment Method Selector */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Lock size={18} className="text-emerald-500" />
                Payment Method
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    id={`pay-${m.id}`}
                    onClick={() => setMethod(m.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      method === m.id
                        ? 'border-primary-600 bg-primary-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`mb-2 ${method === m.id ? 'text-primary-600' : 'text-gray-500'}`}>{m.icon}</div>
                    <p className="font-bold text-sm text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* UPI Details */}
            <AnimatePresence mode="wait">
              {method === 'upi' && (
                <motion.div
                  key="upi"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6"
                >
                  <h3 className="font-bold text-gray-900 mb-4">Choose UPI App</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {UPI_APPS.map(app => (
                      <button
                        key={app.id}
                        id={`upi-${app.id}`}
                        onClick={() => setUpiApp(app.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                          upiApp === app.id ? `${app.color} border-current shadow-sm` : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{app.icon}</span>
                        <span className="text-sm font-semibold text-gray-800">{app.name}</span>
                      </button>
                    ))}
                  </div>
                  {upiApp === 'other' && (
                    <input
                      type="text"
                      placeholder="Enter UPI ID (e.g. name@upi)"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="input-field"
                    />
                  )}
                </motion.div>
              )}

              {method === 'card' && (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4"
                >
                  <h3 className="font-bold text-gray-900">Card Details</h3>
                  <input
                    type="text"
                    placeholder="Cardholder Name"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    className="input-field"
                    id="card-name"
                  />
                  <input
                    type="text"
                    placeholder="Card Number (16 digits)"
                    value={cardNum}
                    onChange={e => setCardNum(e.target.value.replace(/\D/g,'').slice(0,16))}
                    maxLength={16}
                    className="input-field font-mono"
                    id="card-number"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      className="input-field font-mono"
                      id="card-expiry"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,3))}
                      maxLength={3}
                      className="input-field font-mono"
                      id="card-cvv"
                    />
                  </div>
                </motion.div>
              )}

              {method === 'wallet' && (
                <motion.div
                  key="wallet"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6"
                >
                  <h3 className="font-bold text-gray-900 mb-4">Select Wallet</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Paytm Wallet', bal: '₹250' },
                      { name: 'Amazon Pay', bal: '₹480' },
                      { name: 'Ola Money', bal: '₹120' },
                    ].map(w => (
                      <div key={w.name} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-200">
                        <span className="font-semibold text-gray-900">{w.name}</span>
                        <span className="text-sm text-emerald-600 font-bold">{w.bal} available</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {method === 'cod' && (
                <motion.div
                  key="cod"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-50 rounded-3xl border border-amber-200 p-6 flex items-center gap-4"
                >
                  <span className="text-4xl">💵</span>
                  <div>
                    <p className="font-bold text-amber-900">Cash on Delivery selected</p>
                    <p className="text-sm text-amber-700 mt-1">Please keep exact change ready. Our delivery partner will collect ₹{grandTotal} at your doorstep.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security badge */}
            <div className="flex items-center gap-3 text-gray-500 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <Lock size={18} className="text-emerald-500 shrink-0" />
              <p className="text-sm">All transactions are 256-bit SSL encrypted and secure. We never store card details.</p>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-5 pb-4 border-b border-gray-100">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-5">
                {cartItems.slice(0, 5).map(item => (
                  <div key={item._id} className="flex justify-between items-start text-sm">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-800 shrink-0">₹{item.price * item.quantity}</p>
                  </div>
                ))}
                {cartItems.length > 5 && (
                  <p className="text-xs text-gray-400 text-center">+{cartItems.length - 5} more items</p>
                )}
              </div>

              {/* Fee Breakdown */}
              <div className="space-y-2.5 pt-4 border-t border-gray-100 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-600 font-semibold' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (5%)</span>
                  <span>₹{taxAmount}</span>
                </div>
                {deliveryFee === 0 && subtotal > 0 && (
                  <div className="flex justify-between text-emerald-600 text-xs">
                    <span>🎉 Free delivery on orders ≥ ₹499</span>
                    <span>-₹29</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t border-gray-100 mt-2">
                  <span>Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              <button
                id="pay-now-btn"
                onClick={handlePay}
                disabled={processing}
                className={`mt-6 btn-primary w-full py-4 text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
                  processing ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {processing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    {method === 'cod' ? 'Confirming Order...' : 'Processing Payment...'}
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    {method === 'cod' ? 'Confirm COD Order' : `Pay ₹${grandTotal} Securely`}
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
