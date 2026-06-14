// src/pages/Payment.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, CreditCard, Smartphone, Wallet, Banknote,
  Lock, ChevronRight, ArrowLeft, MapPin, Package, Clock,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/serviceFactory';
import toast from 'react-hot-toast';

const UPI_APPS = [
  { id: 'gpay',    name: 'Google Pay',  icon: '🔵', color: 'bg-blue-50 border-blue-300' },
  { id: 'phonepe', name: 'PhonePe',     icon: '💜', color: 'bg-purple-50 border-purple-300' },
  { id: 'paytm',   name: 'Paytm',       icon: '🔷', color: 'bg-sky-50 border-sky-300' },
  { id: 'other',   name: 'Other UPI',   icon: '📱', color: 'bg-gray-50 border-gray-300' },
];

const PAYMENT_METHODS = [
  { id: 'upi',    label: 'UPI',               icon: <Smartphone size={20} />,  desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card',   label: 'Credit/Debit Card',  icon: <CreditCard size={20} />,  desc: 'Visa, Mastercard, Rupay' },
  { id: 'wallet', label: 'Wallet',              icon: <Wallet size={20} />,       desc: 'Paytm, Amazon Pay' },
  { id: 'cod',    label: 'Cash on Delivery',    icon: <Banknote size={20} />,     desc: 'Pay at doorstep' },
];

/** Countdown from 7 minutes. Returns "MM:SS" string and fires onDone when complete. */
function useCountdown(startSeconds = 7 * 60) {
  const [remaining, setRemaining] = useState(startSeconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  return { display: `${mins}:${secs}`, done: remaining <= 0 };
}

function SuccessScreen({ orderId, method, grandTotal, subtotal, deliveryAddress, contactName, contactPhone }) {
  const navigate = useNavigate();
  const countdown = useCountdown(7 * 60);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4 pt-20">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 16 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center"
      >
        {/* Animated Checkmark */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10, delay: 0.4 }}>
              <CheckCircle size={62} className="text-emerald-500" />
            </motion.div>
          </motion.div>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: [0, Math.cos(i * 60 * Math.PI / 180) * 52], y: [0, Math.sin(i * 60 * Math.PI / 180) * 52] }}
              transition={{ delay: 0.5 + i * 0.06, duration: 0.9 }}
              className="absolute top-1/2 left-1/2 w-3 h-3 bg-emerald-400 rounded-full"
              style={{ marginTop: -6, marginLeft: -6 }}
            />
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-3xl font-black text-gray-900 mb-1">Order Confirmed! 🎉</h2>
          <p className="text-gray-500 mb-4 text-sm">Your order has been placed successfully.</p>

          {/* Live Countdown */}
          {!countdown.done ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-center justify-center gap-3">
              <Clock size={22} className="text-amber-600" />
              <div className="text-left">
                <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Arriving in</p>
                <p className="text-3xl font-black text-amber-900 font-mono tabular-nums">{countdown.display}</p>
              </div>
              <div className="text-2xl animate-bounce">⚡</div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5 text-emerald-700 font-bold">
              Your delivery should be arriving! 🚴
            </div>
          )}

          {/* Order Details */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono font-bold text-primary-600">#{orderId?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-black text-gray-900 text-base">₹{grandTotal || subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment</span>
              <span className="font-semibold text-gray-700 capitalize">{PAYMENT_METHODS.find(m => m.id === method)?.label}</span>
            </div>
            {deliveryAddress && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    {contactName && <p className="font-semibold text-gray-900 text-xs">{contactName}{contactPhone ? ` • ${contactPhone}` : ''}</p>}
                    <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{deliveryAddress}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button id="track-order-btn" onClick={() => navigate(`/orders/track/${orderId}`)} className="btn-primary w-full py-4 text-lg mb-3 shadow-lg">
            Track Live Order
          </button>
          <button onClick={() => navigate('/orders')} className="btn-secondary w-full py-3 text-base">
            View All Orders
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, grandTotal, subtotal, deliveryFee, platformFee, taxAmount, clearCart } = useCart();

  const orderPayload = location.state?.orderPayload;

  const [method, setMethod] = useState('cod');
  const [upiApp, setUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Format card expiry as MM/YY
  const handleExpiryChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    setCardExpiry(v);
  };

  // Redirect if no cart and no payload
  useEffect(() => {
    if (cartItems.length === 0 && !orderPayload) navigate('/');
  }, []);

  const validatePayment = () => {
    if (method === 'card') {
      if (!cardName.trim()) { toast.error('Please enter cardholder name'); return false; }
      if (cardNum.length !== 16) { toast.error('Please enter a valid 16-digit card number'); return false; }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) { toast.error('Please enter expiry in MM/YY format'); return false; }
      if (cardCvv.length !== 3) { toast.error('Please enter a valid 3-digit CVV'); return false; }
    }
    if (method === 'upi' && upiApp === 'other' && !upiId.trim()) {
      toast.error('Please enter your UPI ID');
      return false;
    }
    return true;
  };

  const handlePay = async () => {
    if (!validatePayment()) return;

    setProcessing(true);

    try {
      // Simulate payment gateway delay (UPI/Card/Wallet only, not COD)
      if (method !== 'cod') {
        await new Promise(r => setTimeout(r, 2200));
      }

      // Build the payload — ensure deliveryLocation always has an address
      const deliveryLoc = orderPayload?.deliveryLocation || {};
      const deliveryAddress = deliveryLoc.address || deliveryLoc.fullAddress || 'Delivery Address';

      const payload = {
        ...(orderPayload || {}),
        pickupLocation: orderPayload?.pickupLocation || {
          address: cartItems[0]?.store?.address || 'Store location',
          latitude: cartItems[0]?.store?.location?.coordinates?.[1] || 17.44,
          longitude: cartItems[0]?.store?.location?.coordinates?.[0] || 78.39,
        },
        deliveryLocation: {
          ...deliveryLoc,
          address: deliveryAddress,
        },
        packageDetails: orderPayload?.packageDetails ||
          cartItems.map(i => `${i.quantity}x ${i.name}`).join(', ') ||
          'Delivery Package',
        commerceItems: orderPayload?.commerceItems || cartItems.map(item => ({
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          category: item.category || 'General',
        })),
        price: grandTotal || subtotal || 0,
        deliveryFee: deliveryFee ?? 0,
        platformFee: platformFee ?? 0,
        taxAmount: taxAmount ?? 0,
        paymentMethod: method === 'cod' ? 'cash' : 'online',
        shopId: orderPayload?.shopId || cartItems[0]?.store?._id,
      };

      const res = await orderService.createOrder(payload);
      const newOrderId = res.data?.orderId || res.data?.order?._id;

      setOrderId(newOrderId);
      clearCart();
      setOrderSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payment failed. Please try again.';
      toast.error(msg);
      setProcessing(false);
    }
  };

  if (orderSuccess) {
    const deliveryLoc = orderPayload?.deliveryLocation;
    const deliveryAddress = deliveryLoc?.address || deliveryLoc?.fullAddress || '';
    return (
      <SuccessScreen
        orderId={orderId}
        method={method}
        grandTotal={grandTotal}
        subtotal={subtotal}
        deliveryAddress={deliveryAddress}
        contactName={orderPayload?.contactName}
        contactPhone={orderPayload?.contactPhone}
      />
    );
  }

  const displayAddress = orderPayload?.deliveryLocation?.address || orderPayload?.deliveryLocation?.fullAddress;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={18} /> Back to Checkout
        </button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-gray-900">Secure Payment</h1>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-bold text-sm">
            ⚡ Estimated Delivery: 5–7 Minutes
          </div>
        </div>

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
                    key={m.id} id={`pay-${m.id}`}
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

            {/* Payment Detail Panels */}
            <AnimatePresence mode="wait">
              {method === 'upi' && (
                <motion.div key="upi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Choose UPI App</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {UPI_APPS.map(app => (
                      <button key={app.id} id={`upi-${app.id}`} onClick={() => setUpiApp(app.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                          upiApp === app.id ? `${app.color} shadow-sm` : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{app.icon}</span>
                        <span className="text-sm font-semibold text-gray-800">{app.name}</span>
                      </button>
                    ))}
                  </div>
                  {upiApp === 'other' && (
                    <input type="text" placeholder="Enter UPI ID (e.g. name@upi)" value={upiId}
                      onChange={e => setUpiId(e.target.value)} className="input-field" id="upi-id" />
                  )}
                  <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                    <Lock size={11} className="text-emerald-500" /> We will redirect you to the selected UPI app to complete payment.
                  </p>
                </motion.div>
              )}

              {method === 'card' && (
                <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <h3 className="font-bold text-gray-900">Card Details</h3>
                  <input type="text" placeholder="Cardholder Name" value={cardName}
                    onChange={e => setCardName(e.target.value)} className="input-field" id="card-name" />
                  <input type="text" placeholder="Card Number (16 digits)" value={cardNum}
                    onChange={e => setCardNum(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    maxLength={16} className="input-field font-mono tracking-widest" id="card-number" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input type="text" placeholder="MM/YY" value={cardExpiry}
                        onChange={handleExpiryChange} maxLength={5} className="input-field font-mono" id="card-expiry" />
                    </div>
                    <div>
                      <input type="password" placeholder="CVV" value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        maxLength={3} className="input-field font-mono" id="card-cvv" />
                    </div>
                  </div>
                </motion.div>
              )}

              {method === 'wallet' && (
                <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Select Wallet</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Paytm Wallet', bal: '₹250', icon: '🔷' },
                      { name: 'Amazon Pay', bal: '₹480', icon: '🟡' },
                      { name: 'Ola Money', bal: '₹120', icon: '⬛' },
                    ].map(w => (
                      <div key={w.name} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-primary-300 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{w.icon}</span>
                          <span className="font-semibold text-gray-900">{w.name}</span>
                        </div>
                        <span className="text-sm text-emerald-600 font-bold">{w.bal} available</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {method === 'cod' && (
                <motion.div key="cod" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-50 rounded-3xl border border-amber-200 p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">💵</span>
                    <div>
                      <p className="font-bold text-amber-900 text-base">Cash on Delivery Selected</p>
                      <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                        Please keep exact change ready.<br/>
                        <strong>Amount to collect: ₹{grandTotal}</strong>
                      </p>
                      <p className="text-xs text-amber-600 mt-2">Our delivery partner will collect the amount at your doorstep upon delivery.</p>
                    </div>
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

          {/* RIGHT: Payment Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-5 pb-4 border-b border-gray-100">Payment Summary</h2>

              {/* ETA & Address */}
              <div className="mb-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">⚡</span>
                  <p className="font-bold text-amber-900 text-sm">Estimated Delivery: 5–7 Minutes</p>
                </div>
                {displayAddress && (
                  <div className="border-t border-amber-200 pt-3 mt-2">
                    <p className="text-amber-700 text-xs font-semibold uppercase tracking-wide mb-1">Delivering To:</p>
                    <div className="flex items-start gap-1.5">
                      <MapPin size={13} className="text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-amber-900 text-xs font-medium leading-relaxed">{displayAddress}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2.5 mb-5 max-h-36 overflow-y-auto">
                {cartItems.slice(0, 6).map(item => (
                  <div key={item._id} className="flex justify-between items-start text-sm">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-800 shrink-0">₹{item.price * item.quantity}</p>
                  </div>
                ))}
                {cartItems.length > 6 && (
                  <p className="text-xs text-gray-400 text-center">+{cartItems.length - 6} more items</p>
                )}
              </div>

              {/* Fee Breakdown */}
              <div className="space-y-2.5 pt-4 border-t border-gray-100 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-600 font-semibold' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600"><span>Platform Fee</span><span>₹{platformFee}</span></div>
                <div className="flex justify-between text-gray-600"><span>GST (5%)</span><span>₹{taxAmount}</span></div>
                {deliveryFee === 0 && subtotal > 0 && (
                  <div className="flex justify-between text-emerald-600 text-xs">
                    <span>🎉 Free delivery on orders ≥ ₹499</span><span>-₹29</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t border-gray-100 mt-2">
                  <span>Total</span><span>₹{grandTotal}</span>
                </div>
              </div>

              {/* Confirm checkbox */}
              <div className="mt-5 mb-4 flex items-start gap-3">
                <input type="checkbox" id="confirm-details" checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 cursor-pointer mt-0.5" />
                <label htmlFor="confirm-details" className="text-sm font-medium text-gray-700 cursor-pointer">
                  I confirm that my address and order details are correct.
                </label>
              </div>

              <button
                id="pay-now-btn"
                onClick={handlePay}
                disabled={processing || !confirmed}
                className={`btn-primary w-full py-4 text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
                  (processing || !confirmed) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {processing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {method === 'cod' ? 'Confirming Order...' : 'Processing Payment...'}
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    {method === 'cod' ? `Confirm COD Order • ₹${grandTotal}` : `Pay ₹${grandTotal} Securely`}
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
