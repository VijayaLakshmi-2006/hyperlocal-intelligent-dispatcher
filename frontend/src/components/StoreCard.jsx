// src/components/StoreCard.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { ShoppingCart, MapPin, Clock, Star, Truck, Plus, Minus, ChevronRight } from 'lucide-react';

// Category color themes
const CATEGORY_THEMES = {
  Grocery:     { gradient: 'from-green-500 to-emerald-600', badge: 'bg-green-100 text-green-800', emoji: '🛒' },
  Pharmacy:    { gradient: 'from-blue-500 to-cyan-600',   badge: 'bg-blue-100 text-blue-800',   emoji: '💊' },
  Electronics: { gradient: 'from-violet-500 to-purple-700', badge: 'bg-violet-100 text-violet-800', emoji: '⚡' },
  Food:        { gradient: 'from-orange-500 to-red-600',  badge: 'bg-orange-100 text-orange-800', emoji: '🍕' },
};

// Fallback Unsplash images by category
const CATEGORY_IMAGES = {
  Grocery:     'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  Pharmacy:    'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=800&q=80',
  Electronics: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  Food:        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
};

export default function StoreCard({ store }) {
  const { addToCart, cartItems, updateQuantity } = useCart();
  const [addingId, setAddingId] = useState(null);

  const theme = CATEGORY_THEMES[store.category] || CATEGORY_THEMES.Grocery;
  const bannerImage = store.imageUrl || CATEGORY_IMAGES[store.category] || CATEGORY_IMAGES.Grocery;

  // Mock deterministic distance/ETA based on store ID
  const seed = store._id ? store._id.charCodeAt(store._id.length - 1) : 0;
  const distance = ((seed % 35) / 10 + 0.5).toFixed(1);
  const etaMins = distance < 1 ? '8–10' : distance < 2 ? '12–15' : distance < 3.5 ? '18–22' : '25–30';

  const handleAdd = async (product) => {
    if (!store.isOpen) return;
    setAddingId(product._id);
    addToCart(product, store);
    await new Promise(r => setTimeout(r, 300));
    setAddingId(null);
  };

  const getCartQty = (productId) => {
    const item = cartItems.find(i => i._id === productId);
    return item ? item.quantity : 0;
  };

  const displayProducts = store.products?.slice(0, 4) || [];

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full group"
    >
      {/* Store Banner Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={bannerImage}
          alt={store.shopName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = CATEGORY_IMAGES.Grocery; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />

        {/* Open/Closed Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm ${
            store.isOpen
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-600 text-white'
          }`}>
            {store.isOpen ? '● Open Now' : '● Closed'}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm bg-white/20 border border-white/30 text-white`}>
            {theme.emoji} {store.category}
          </span>
        </div>

        {/* Rating + Name overlay */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <h3 className="text-white font-bold text-lg leading-tight drop-shadow">{store.shopName}</h3>
            <p className="text-white/80 text-xs mt-0.5">{store.address}</p>
          </div>
          <div className="flex items-center gap-1 bg-white rounded-full px-2.5 py-1 shadow-sm shrink-0">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-gray-900">{store.rating || '4.5'}</span>
          </div>
        </div>
      </div>

      {/* Meta Info Row */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-50">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin size={13} className="text-primary-500" />
          <span className="font-medium">{distance} km</span>
        </div>
        <span className="text-gray-200">|</span>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Clock size={13} className="text-primary-500" />
          <span className="font-medium">{etaMins} mins</span>
        </div>
        <span className="text-gray-200">|</span>
        <div className="flex items-center gap-1.5 text-sm">
          <Truck size={13} className="text-emerald-500" />
          <span className={`font-semibold ${store.deliveryFee === 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
            {store.deliveryFee === 0 ? 'Free Delivery' : `₹${store.deliveryFee} delivery`}
          </span>
        </div>
      </div>

      {/* Products */}
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3 flex items-center justify-between">
          <span>Popular Items</span>
          {store.products?.length > 4 && (
            <span className="text-primary-500 font-semibold normal-case">+{store.products.length - 4} more</span>
          )}
        </p>

        <div className="space-y-2.5 flex-1">
          {displayProducts.map(product => {
            const qty = getCartQty(product._id);
            return (
              <AnimatePresence key={product._id} mode="popLayout">
                <motion.div
                  layout
                  className={`flex items-center justify-between rounded-2xl p-3 border transition-all duration-200 ${
                    qty > 0
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-gray-50 border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm font-bold text-primary-600 mt-0.5">₹{product.price}</p>
                  </div>

                  {qty > 0 ? (
                    <div className="flex items-center gap-1.5 bg-primary-600 rounded-xl p-1">
                      <button
                        onClick={() => updateQuantity(product._id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-white hover:bg-primary-700 rounded-lg transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-white">{qty}</span>
                      <button
                        onClick={() => handleAdd(product)}
                        className="w-7 h-7 flex items-center justify-center text-white hover:bg-primary-700 rounded-lg transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAdd(product)}
                      disabled={addingId === product._id || !store.isOpen}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        !store.isOpen
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : addingId === product._id
                          ? 'bg-primary-100 text-primary-400'
                          : 'bg-white border border-primary-200 text-primary-700 hover:bg-primary-600 hover:text-white hover:border-primary-600 shadow-sm'
                      }`}
                    >
                      {addingId === product._id ? (
                        <span className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart size={14} />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>

        {!store.isOpen && (
          <div className="mt-3 text-center py-2 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 font-medium">⏰ Currently closed — opens at 9:00 AM</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
