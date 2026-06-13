// src/components/CartDrawer.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, Tag } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose }) {
  const {
    cartItems,
    subtotal,
    deliveryFee,
    platformFee,
    taxAmount,
    grandTotal,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={18} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
                  <p className="text-xs text-gray-500">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                id="close-cart-drawer"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag size={36} className="text-gray-300" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-1">Your cart is empty</p>
                  <p className="text-sm text-gray-500 mb-6">Add items from stores to get started</p>
                  <Link
                    to="/stores"
                    onClick={onClose}
                    className="btn-primary py-3 px-6"
                  >
                    Browse Stores
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Free delivery banner */}
                  {deliveryFee === 0 && subtotal > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5"
                    >
                      <Truck size={16} className="text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-700">🎉 You got free delivery!</p>
                    </motion.div>
                  )}
                  {deliveryFee > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5">
                      <Tag size={16} className="text-amber-600" />
                      <p className="text-sm text-amber-700">Add <span className="font-bold">₹{499 - subtotal}</span> more for free delivery</p>
                    </div>
                  )}

                  <AnimatePresence>
                    {cartItems.map(item => (
                      <motion.div
                        key={item._id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100"
                      >
                        {/* Product Icon/Image */}
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-2xl border border-gray-200 shrink-0 shadow-sm">
                          {item.category === 'Dairy' ? '🥛' :
                           item.category === 'Bakery' ? '🍞' :
                           item.category === 'Fruits' ? '🍎' :
                           item.category === 'Vegetables' ? '🥦' :
                           item.category === 'Medicine' ? '💊' :
                           item.category === 'Audio' ? '🎧' :
                           item.category === 'Main Course' ? '🍛' : '📦'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.name}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{item.store?.shopName}</p>
                          <p className="text-primary-600 font-bold text-sm mt-1">₹{item.price}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-0.5 shadow-sm">
                            <button
                              onClick={() => updateQuantity(item._id, -1)}
                              id={`decrease-${item._id}`}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-primary-600 rounded-lg transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, 1)}
                              id={`increase-${item._id}`}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-primary-600 hover:text-white rounded-lg transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800">₹{item.price * item.quantity}</span>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              id={`remove-${item._id}`}
                              className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer: Fee breakdown + Checkout */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-100 bg-white px-6 py-5 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
                {/* Fee Rows */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee === 0 ? 'text-emerald-600 font-semibold' : ''}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Platform Fee + GST</span>
                    <span>₹{platformFee + taxAmount}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t border-gray-100 mt-1">
                    <span>Grand Total</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    id="continue-shopping"
                    className="flex-1 btn-secondary py-3 text-sm"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/checkout'); }}
                    id="proceed-checkout"
                    className="flex-2 btn-primary py-3 text-sm shadow-lg flex items-center justify-center gap-2 flex-grow"
                  >
                    Checkout
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
