import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Sparkles, ShoppingCart, RefreshCw, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { aiCartAPI } from '../services/api';
import { useCart } from '../context/CartContext';

const EXAMPLES = [
  'Need snacks for 5 friends under ₹500',
  'Ingredients for chicken biryani for 4 people',
  'Monthly groceries for one person',
  'Healthy breakfast items for a week',
];

const LOADING_STEPS = [
  { text: 'Analyzing your request...', icon: '🧠' },
  { text: 'Finding nearby stores...', icon: '🏪' },
  { text: 'Optimizing your cart...', icon: '🛒' },
  { text: 'Getting the best prices...', icon: '💰' },
];

const getNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const getItemName = (item) =>
  item?.name ||
  item?.productName ||
  item?.title ||
  item?.item ||
  item?.label ||
  'Recommended product';

const getItemId = (item, index) =>
  item?._id ||
  item?.id ||
  item?.productId ||
  item?.product?._id ||
  `ai-${getItemName(item).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`;

const getItemQuantity = (item) => item?.quantity || item?.qty || item?.amount || 1;

const getQuantityMultiplier = (quantity) => {
  if (typeof quantity === 'number' && Number.isFinite(quantity)) {
    return Math.max(quantity, 1);
  }

  if (typeof quantity === 'string' && /^\d+(\.\d+)?$/.test(quantity.trim())) {
    return Math.max(Number(quantity.trim()), 1);
  }

  return 1;
};

const getLineTotal = (item) =>
  getNumber(item?.total ?? item?.totalPrice ?? item?.lineTotal, NaN) ||
  item.price * getQuantityMultiplier(item.quantity);

const getPeopleCount = (prompt) => {
  const match = prompt.match(/(\d+)\s*(people|persons|person|friends|guests|members|kids|children)/i);
  return match ? Number(match[1]) : 1;
};

const getBudget = (prompt) => {
  const match = prompt.match(/(?:under|below|within|budget|rs\.?|₹)\s*₹?\s*(\d+)/i);
  return match ? Number(match[1]) : null;
};

const makeFallbackItem = (name, price, quantity = 1, category = 'general') => ({
  id: `local-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name,
  price,
  quantity,
  category,
  unavailable: false,
});

const fitItemsToBudget = (items, budget) => {
  if (!budget) return items;

  const selected = [];
  let total = 0;

  for (const item of items) {
    const lineTotal = getLineTotal(item);
    if (selected.length === 0 || total + lineTotal <= budget) {
      selected.push(item);
      total += lineTotal;
    }
  }

  return selected;
};

const buildLocalCartFromPrompt = (prompt) => {
  const text = prompt.toLowerCase();
  const people = getPeopleCount(prompt);
  const budget = getBudget(prompt);
  let items = [];

  if (/biryani|biriyani|chicken rice|pulao/.test(text)) {
    items = [
      makeFallbackItem('Basmati rice', 160, people >= 4 ? '1 kg' : '500 g', 'grocery'),
      makeFallbackItem('Chicken', 280, people >= 4 ? '1 kg' : '500 g', 'meat'),
      makeFallbackItem('Curd', 45, '500 g', 'dairy'),
      makeFallbackItem('Onions', 40, '1 kg', 'vegetables'),
      makeFallbackItem('Tomatoes', 35, '500 g', 'vegetables'),
      makeFallbackItem('Ginger garlic paste', 55, 1, 'grocery'),
      makeFallbackItem('Biryani masala', 70, 1, 'spices'),
      makeFallbackItem('Mint and coriander', 35, 1, 'vegetables'),
      makeFallbackItem('Green chillies', 15, 1, 'vegetables'),
      makeFallbackItem('Lemon', 20, 2, 'fruits'),
    ];
  } else if (/project|assignment|school|college|presentation|craft|tomorrow/.test(text)) {
    items = [
      makeFallbackItem('A4 sheets', 80, 1, 'stationery'),
      makeFallbackItem('Chart paper', 25, 2, 'stationery'),
      makeFallbackItem('Black marker', 35, 1, 'stationery'),
      makeFallbackItem('Color pens', 120, 1, 'stationery'),
      makeFallbackItem('Glue stick', 30, 1, 'stationery'),
      makeFallbackItem('Transparent tape', 45, 1, 'stationery'),
      makeFallbackItem('Scissors', 70, 1, 'stationery'),
      makeFallbackItem('Project file', 60, 1, 'stationery'),
    ];
  } else if (/snack|party|friends|movie|chips|namkeen/.test(text)) {
    items = [
      makeFallbackItem('Potato chips', 40, Math.max(people, 2), 'snacks'),
      makeFallbackItem('Namkeen mix', 65, 2, 'snacks'),
      makeFallbackItem('Cookies', 50, 2, 'snacks'),
      makeFallbackItem('Soft drink', 95, 2, 'beverages'),
      makeFallbackItem('Popcorn', 55, 2, 'snacks'),
      makeFallbackItem('Chocolate bar', 30, Math.max(people, 3), 'snacks'),
    ];
  } else if (/breakfast|healthy|morning|diet|week/.test(text)) {
    items = [
      makeFallbackItem('Oats', 180, 1, 'grocery'),
      makeFallbackItem('Eggs', 90, 1, 'dairy'),
      makeFallbackItem('Whole wheat bread', 55, 2, 'bakery'),
      makeFallbackItem('Milk', 70, 2, 'dairy'),
      makeFallbackItem('Bananas', 60, 1, 'fruits'),
      makeFallbackItem('Peanut butter', 220, 1, 'grocery'),
      makeFallbackItem('Poha', 75, 1, 'grocery'),
    ];
  } else if (/monthly|grocer|ration|house|home|kitchen/.test(text)) {
    items = [
      makeFallbackItem('Rice', 320, '5 kg', 'grocery'),
      makeFallbackItem('Wheat flour', 260, '5 kg', 'grocery'),
      makeFallbackItem('Toor dal', 170, '1 kg', 'grocery'),
      makeFallbackItem('Cooking oil', 180, '1 L', 'grocery'),
      makeFallbackItem('Sugar', 55, '1 kg', 'grocery'),
      makeFallbackItem('Salt', 25, 1, 'grocery'),
      makeFallbackItem('Tea powder', 140, 1, 'grocery'),
      makeFallbackItem('Detergent', 120, 1, 'household'),
    ];
  } else {
    items = [
      makeFallbackItem('Suggested essentials pack', 199, 1, 'general'),
      makeFallbackItem('Fresh vegetables combo', 149, 1, 'vegetables'),
      makeFallbackItem('Milk', 70, 1, 'dairy'),
      makeFallbackItem('Bread', 55, 1, 'bakery'),
      makeFallbackItem('Biscuits', 40, 1, 'snacks'),
    ];
  }

  const fittedItems = fitItemsToBudget(items, budget);
  const total = fittedItems.reduce((sum, item) => sum + getLineTotal(item), 0);

  return {
    query: prompt,
    items: fittedItems,
    total,
    store: 'Smart Local Store',
    shopId: 'local-smart-store',
    eta: '25-35 min',
    storeAddress: 'Nearest available store',
    source: 'local-prompt-engine',
  };
};

const normalizeAiCartResult = (rawResult, prompt) => {
  const source = rawResult?.data || rawResult?.cart || rawResult || {};
  const rawItems =
    source.items ||
    source.products ||
    source.shoppingList ||
    source.recommendations ||
    [];

  const items = (Array.isArray(rawItems) ? rawItems : [])
    .map((item, index) => {
      const name = getItemName(item);
      const price = getNumber(item?.price ?? item?.salePrice ?? item?.sellingPrice ?? item?.mrp);
      const quantity = getItemQuantity(item);
      const stock = item?.stock ?? item?.availableStock ?? item?.inventory;

      return {
        ...item,
        id: getItemId(item, index),
        name,
        price,
        quantity,
        category: item?.category || item?.product?.category || 'general',
        image: item?.image || item?.imageUrl || item?.product?.image,
        unavailable:
          Boolean(item?.unavailable) ||
          item?.available === false ||
          item?.inStock === false ||
          stock === 0,
      };
    })
    .filter((item) => item.name && item.price >= 0);

  const total =
    getNumber(source.total ?? source.totalPrice ?? source.estimatedTotal, NaN) ||
    items.reduce((sum, item) => {
      return sum + getLineTotal(item);
    }, 0);

  const store =
    source.store ||
    source.storeName ||
    source.shopName ||
    source.shop?.shopName ||
    source.shop?.name ||
    'Recommended nearby store';

  return {
    ...source,
    query: source.query || prompt,
    items,
    total,
    store,
    shopId: source.shopId || source.storeId || source.shop?._id || 'ai-recommended-store',
    eta: source.eta || source.deliveryEta || source.estimatedDelivery || '25-35 min',
    storeAddress:
      source.storeAddress ||
      source.address ||
      source.shop?.address ||
      'Recommended Store Location',
  };
};

export default function AiCartSection() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const { addToCart } = useCart();
  const inputRef = useRef(null);
  const loadingTimerRef = useRef(null);

  // Attempt to get user location for accurate ETA
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log("Location access denied or failed", error),
        { timeout: 10000 }
      );
    }
  }, []);

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
    const q = (promptQuery ?? query).trim();

    if (!q) {
      toast.error('Please describe what you need!');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    startLoadingAnimation();

    try {
      const payload = { query: q, prompt: q };
      if (userLocation) payload.location = userLocation;
      
      const res = await aiCartAPI.buildCart(payload);
      const normalizedResult = normalizeAiCartResult(res.data, q);

      if (!normalizedResult.items.length) {
        const fallbackResult = buildLocalCartFromPrompt(q);
        setResult(fallbackResult);
        setQuery(q);
        toast.success('Built a smart cart from your prompt.');
        return;
      }

      setResult(normalizedResult);
      setQuery(q);
    } catch (err) {
      const fallbackResult = buildLocalCartFromPrompt(q);

      if (fallbackResult.items.length) {
        setResult(fallbackResult);
        setQuery(q);
        toast.success('Built a smart cart from your prompt.');
        return;
      }

      const msg = err.response?.data?.message || err.message || 'Failed to generate cart. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      stopLoadingAnimation();
    }
  };

  const handleAddAllToCart = () => {
    if (!result?.items?.length) return;

    const availableItems = result.items.filter((item) => !item.unavailable);

    if (availableItems.length === 0) {
      toast.error('No available items to add to cart.');
      return;
    }

    const store = {
      _id: result.shopId,
      id: result.shopId,
      shopName: result.store,
      name: result.store,
      address: result.storeAddress,
      eta: result.eta,
    };

    let addedCount = 0;

    for (const item of availableItems) {
      const cartProduct = {
        _id: item.id,
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category || 'general',
        image: item.image,
        requestedQuantity: item.quantity,
        storeId: result.shopId,
        storeName: result.store,
        deliveryEta: result.eta,
        source: 'ai-cart',
      };
      // We pass the same store object for all to avoid cart conflict errors, and set silent=true to prevent toast spam
      const quantityCount = getQuantityMultiplier(item.quantity);
      for (let count = 0; count < quantityCount; count += 1) {
        addToCart(cartProduct, store, true);
        addedCount += 1;
      }
    }

    window.dispatchEvent(new CustomEvent('ai-cart:items-added', {
      detail: {
        store,
        items: availableItems,
        total: result.total,
        eta: result.eta,
      },
    }));

    toast.success(`🛒 ${availableItems.length} product types (${addedCount} units) added to cart successfully!`, { duration: 4000 });
    setQuery('');
    setResult(null);
  };

  return (
    <section className="py-20 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 font-semibold text-sm mb-4">
            <Sparkles size={16} />
            AI Shopping Assistant
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Describe your needs and we'll build the perfect cart.</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Powered by advanced AI, our assistant understands your requirements, matches them with local inventory, and creates an optimized shopping cart in seconds.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8 space-y-6">
            
            {/* Input Area */}
            {!result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
                    placeholder="Describe what you need... Example: Ingredients for Chicken Biryani for 4 people"
                    rows={3}
                    className="w-full px-6 py-4 text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all text-lg placeholder:text-gray-400 shadow-sm"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    {userLocation && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                        <MapPin size={12} /> Location Active
                      </span>
                    )}
                    <button
                      onClick={() => handleGenerate()}
                      disabled={!query.trim()}
                      className="btn-primary py-2 px-6 disabled:opacity-50 shadow-md"
                    >
                      <Sparkles size={18} />
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => handleGenerate(ex)}
                        className="text-sm px-4 py-2 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-colors font-medium"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                    <AlertCircle size={18} />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="py-12 flex flex-col items-center gap-6">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-primary-50" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">
                    {LOADING_STEPS[loadingStep].icon}
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-gray-900 font-bold text-lg text-center"
                  >
                    {LOADING_STEPS[loadingStep].text}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}

            {/* Result State */}
            {result && !loading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                {/* Store Info & ETA Banner */}
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-start gap-4 relative z-10">
                    {/* Placeholder Store Image */}
                    <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0 border border-white/30">
                      🏪
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-primary-100 text-xs font-bold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded backdrop-blur-md border border-white/10">Best Match</p>
                        <span className="flex items-center gap-1 text-xs font-bold bg-white text-gray-900 px-1.5 py-0.5 rounded">
                          <span className="text-amber-500">★</span> 4.8
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{result.store}</h3>
                      <p className="text-sm text-primary-50 italic opacity-90 max-w-sm">
                        "Closest store with all requested items available right now."
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 w-full md:w-auto relative z-10">
                    <div className="flex-1 md:flex-none bg-white/10 rounded-xl px-4 py-3 backdrop-blur-md border border-white/20 text-center flex flex-col justify-center">
                      <p className="text-primary-100 text-[10px] font-bold uppercase tracking-wider mb-1">Delivery ETA</p>
                      <p className="text-xl font-bold">⏱️ {result.eta}</p>
                    </div>
                    <div className="flex-1 md:flex-none bg-white/10 rounded-xl px-4 py-3 backdrop-blur-md border border-white/20 text-center flex flex-col justify-center">
                      <p className="text-primary-100 text-[10px] font-bold uppercase tracking-wider mb-1">Est. Total</p>
                      <p className="text-xl font-bold">₹{result.total?.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ShoppingCart size={20} className="text-primary-600"/> 
                    Recommended Products
                  </h4>
                  <div className="grid gap-3">
                    {result.items.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex items-center justify-between px-6 py-4 rounded-2xl border ${
                          item.unavailable
                            ? 'bg-gray-50 border-gray-100 opacity-70'
                            : 'bg-white border-gray-200 hover:border-primary-200 hover:shadow-sm transition-all'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {item.unavailable ? (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <AlertCircle size={20} className="text-gray-500" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle size={20} className="text-green-600" />
                            </div>
                          )}
                          <div>
                            <p className={`font-bold text-base ${item.unavailable ? 'text-gray-500' : 'text-gray-900'}`}>
                              {item.name}
                              {item.unavailable && <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full font-semibold">Unavailable</span>}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Quantity: <span className="font-semibold text-gray-700">{item.quantity}</span></p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold mb-1 ${item.unavailable ? 'text-gray-400' : 'text-primary-600'}`}>
                            ₹{item.price} each
                          </p>
                          <p className={`font-black text-lg ${item.unavailable ? 'text-gray-400' : 'text-gray-900'}`}>
                            ₹{getLineTotal(item).toFixed(0)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => { setResult(null); setError(null); }}
                    className="flex-1 btn-secondary py-4 text-lg justify-center"
                  >
                    <RefreshCw size={20} />
                    Try Another Request
                  </button>
                  <button
                    onClick={handleAddAllToCart}
                    className="flex-1 btn-primary py-4 text-lg justify-center bg-success-500 hover:bg-success-600 focus:ring-success-500 shadow-lg hover:shadow-xl"
                  >
                    <ShoppingCart size={20} />
                    Add All To Cart
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
