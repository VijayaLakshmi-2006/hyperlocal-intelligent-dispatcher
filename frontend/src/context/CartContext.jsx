// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('hd_cart');
      if (savedCart) setCartItems(JSON.parse(savedCart));
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('hd_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  /**
   * Add a product to the cart. If it already exists, increment qty.
   * Pass silent=true to suppress toast (useful when adding multiple items).
   */
  const addToCart = useCallback((product, selectedStore, silent = false) => {
    setCartItems(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, store: selectedStore, quantity: 1 }];
    });
    if (!silent) toast.success(`${product.name} added to cart! 🛒`, { duration: 2000 });
  }, []);

  /**
   * Increase or decrease quantity by delta (+1 or -1).
   * Automatically removes item if quantity drops to 0.
   */
  const updateQuantity = useCallback((productId, delta) => {
    setCartItems(prev =>
      prev
        .map(item =>
          item._id === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter(item => item.quantity > 0) // auto-remove when qty hits 0
    );
  }, []);

  /**
   * Directly remove an item from cart regardless of quantity.
   */
  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => prev.filter(item => item._id !== productId));
    toast.success('Item removed from cart');
  }, []);

  /**
   * Wipe the entire cart.
   */
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Pre-computed fee values for reuse across pages
  const subtotal = cartTotal;
  const deliveryFee = cartTotal > 0 ? (cartTotal >= 499 ? 0 : 29) : 0;
  const platformFee = cartTotal > 0 ? 5 : 0;
  const taxAmount = Math.round(cartTotal * 0.05); // 5% GST
  const grandTotal = subtotal + deliveryFee + platformFee + taxAmount;

  return (
    <CartContext.Provider value={{
      cartItems,
      cartTotal,
      cartCount,
      subtotal,
      deliveryFee,
      platformFee,
      taxAmount,
      grandTotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
