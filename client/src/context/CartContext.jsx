import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, validateCoupon } from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('orderly_cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const res = await getSettings();
      if (active && res?.success) setSettings(res.data);
    };
    load();
    const onSync = () => load();
    window.addEventListener('orderly_settings_updated', onSync);
    window.addEventListener('storage', onSync);
    return () => {
      active = false;
      window.removeEventListener('orderly_settings_updated', onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('orderly_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, selectedSize = 'M', selectedColor = null, quantity = 1) => {
    setCart((prevCart) => {
      if (product && product.isCombo) {
        const itemKey = product.id || `combo-${Date.now()}`;
        return [...prevCart, { ...product, cartItemId: itemKey, quantity: (typeof selectedSize === 'number' ? selectedSize : quantity) || 1 }];
      }

      const colorName = selectedColor ? (selectedColor.name || selectedColor) : (product.colors?.[0]?.name || 'Standard');
      const itemKey = `${product.id}-${selectedSize}-${colorName}`;

      const existingIndex = prevCart.findIndex(item => item.cartItemId === itemKey);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prevCart,
          {
            ...product,
            cartItemId: itemKey,
            selectedSize,
            selectedColor: colorName,
            quantity
          }
        ];
      }
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const freeShippingThreshold = Number(settings?.free_shipping_threshold) || 0;
  const shippingFee = Number(settings?.shipping_fee) || 0;
  const shippingCost = subtotal === 0 || (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) ? 0 : shippingFee;
  const total = Math.max(0, subtotal + shippingCost - discountAmount);

  const applyCoupon = async (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Please enter a coupon code.' };

    const res = await validateCoupon(cleanCode, subtotal);
    if (res && res.success) {
      const discount = Math.min(Number(res.data?.discount) || 0, subtotal);
      setDiscountAmount(discount);
      setAppliedCoupon({
        code: res.data?.code || cleanCode,
        discountPercent: res.data?.discountType === 'percentage' || res.data?.discount_type === 'percentage' ? Number(res.data?.discountValue ?? res.data?.discount_value) : null
      });
      return { success: true, message: res.message || 'Coupon applied!' };
    }
    return { success: false, message: res?.message || 'Invalid or expired coupon code.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        total,
        shippingCost,
        freeShippingThreshold,
        shippingFee,
        appliedCoupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
        totalItems: cart.reduce((acc, item) => acc + item.quantity, 0)
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);