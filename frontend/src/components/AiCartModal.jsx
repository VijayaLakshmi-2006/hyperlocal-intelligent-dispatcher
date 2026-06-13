import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { X, Sparkles, ShoppingCart, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { aiCartAPI } from '../services/api';
import { useCart } from '../context/CartContext';

const EXAMPLES = [
  'Need snacks for 5 friends under ₹500',
  'Ingredients for chicken biryani for 4 people',
  'Monthly groceries for one person',
  'Birthday party items under ₹1000',
  'Healthy breakfast items for a week',
];

const LOADING_STEPS = [
  { text: 'Analyzing your request...', icon: '🧠' },
  { text: 'Finding nearby stores...', icon: '🏪' },
  { text: 'Optimizing your cart...', icon: '🛒' },
  { text: 'Getting the best prices...', icon: '💰' },
];

export default function AiCartModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { addToCart, cartItems, setCartItems } = useCart();
  const inputRef = useRef(null);
  const loadingTimerRef = useRef(null);

  const startLoadingAnimation = () => {
    setLoadingStep(0);
    let step = 0;
    loadingTimerRef.current = setInterval(() => {
      step = (step + 1) % LOADING_STEPS.length;
      setLoadingStep(step);
    }, 1200);
  };

  const stopLoadingAnimation = () => {
    if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
    }
  };

  const handleGenerate = async (promptQuery = null) => {
    const q = promptQuery || query;
    if (!q.trim()) {
      toast.error('Please describe what you need!');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    startLoadingAnimation();

    try {
      const res = await aiCartAPI.buildCart(q.trim());
      setResult(res.data);
      if (promptQuery) setQuery(promptQuery);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate cart. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      stopLoadingAnimation();
    }
  };

  const handleAddAllToCart = async () => {
    if (!result?.cart?.length) return;

    const availableItems = result.cart.filter((item) => !item.unavailable);

    if (availableItems.length === 0) {
      toast.error('No available items to add to cart.');
      return;
    }

    // Build cart-compatible items using the store as the shop
    const store = result.shop || {};
    const addedCount = availableItems.length;

    // Use the existing CartContext addToCart for each item
    for (const item of availableItems) {
      const cartProduct = {
        _id: item.productId || `ai-${item.name}`,
        name: item.name,
        price: item.price,
        category: item.category || 'general',
      };
      const selectedStore = {
        _id: store.id,
        shopName: store.name,
        address: store.address,
      };
      addToCart(cartProduct, selectedStore);
    }

    // Override individual toast from addToCart with a single summary one
    toast.success(`🛒 ${addedCount} items added to cart!`, { duration: 4000 });
    onClose();
  };

  const handleClose = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setLoading(false);
    stopLoadingAnimation();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-700 p-6 text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                    <h2 className="text-xl font-bold">AI Shopping Assistant</h2>
                  </div>
                  <button onClick={handleClose} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <p className="text-primary-200 text-sm">Describe what you need — I'll build the perfect cart</p>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Input area */}
              {!result && !loading && (
                <>
                  <div className="relative">
                    <textarea
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
                      placeholder="e.g. Need snacks for 5 friends under ₹500..."
                      rows={3}
                      className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all placeholder:text-gray-400"
                    />
                  </div>

                  {/* Example chips */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Examples</p>
                    <div className="flex flex-wrap gap-2">
                      {EXAMPLES.map((ex) => (
                        <button
                          key={ex}
                          onClick={() => handleGenerate(ex)}
                          className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full border border-primary-100 hover:bg-primary-100 transition-colors font-medium"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                      <AlertCircle size={16} />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}
                </>
              )}

              {/* Loading state */}
              {loading && (
                <div className="py-8 flex flex-col items-center gap-6">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">
                      {LOADING_STEPS[loadingStep].icon}
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingStep}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="text-gray-700 font-semibold text-center"
                    >
                      {LOADING_STEPS[loadingStep].text}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-gray-400 text-sm text-center">Powered by Gemini AI</p>
                </div>
              )}

              {/* Result */}
              {result && !loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  
                  {/* Cart items */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">AI Recommended Cart</h3>
                    <div className="space-y-2">
                      {result.cart.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
                            item.unavailable
                              ? 'bg-gray-50 border-gray-100 opacity-60'
                              : 'bg-green-50 border-green-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.unavailable ? (
                              <AlertCircle size={16} className="text-gray-400 shrink-0" />
                            ) : (
                              <CheckCircle size={16} className="text-green-500 shrink-0" />
                            )}
                            <div>
                              <p className={`font-semibold text-sm ${item.unavailable ? 'text-gray-500' : 'text-gray-900'}`}>
                                {item.name}
                                {item.unavailable && <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Estimated</span>}
                              </p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className={`font-bold text-sm ${item.unavailable ? 'text-gray-400' : 'text-gray-900'}`}>
                            ₹{(item.price * item.quantity).toFixed(0)}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Store & Total */}
                  <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl p-4 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        {result.shop && (
                          <div className="mb-2">
                            <p className="text-primary-200 text-xs font-semibold">Best Store</p>
                            <p className="font-bold">{result.shop.name}</p>
                            {result.shop.rating && (
                              <p className="text-primary-200 text-xs">⭐ {result.shop.rating} rating</p>
                            )}
                          </div>
                        )}
                        <div>
                          <p className="text-primary-200 text-xs font-semibold">ETA</p>
                          <p className="font-bold">{result.estimatedTime}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-primary-200 text-xs font-semibold">Total</p>
                        <p className="text-3xl font-black">₹{result.total?.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-5 border-t border-gray-100 flex-shrink-0 bg-white">
              {!result && !loading && (
                <button
                  onClick={() => handleGenerate()}
                  disabled={!query.trim()}
                  className="w-full btn-primary py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  Generate Cart
                </button>
              )}

              {result && !loading && (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setResult(null); setError(null); }}
                    className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Regenerate
                  </button>
                  <button
                    onClick={handleAddAllToCart}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} />
                    Add All To Cart
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
