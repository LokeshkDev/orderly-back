import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, validateCoupon } from '../services/api';
import { calculateDeliveryCharge, DEFAULT_DELIVERY_SETTINGS } from '../utils/deliveryCalculator';
import { 
  calculatePairOffers, 
  DEFAULT_PAIR_OFFER_SETTINGS, 
  roundCurrency,
  isPairItem 
} from '../utils/pairOfferCalculator';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('orderly_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [settings, setSettings] = useState(null);
  const [pincode, setPincode] = useState('');

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

  const addToCart = (product, selectedSize = 'M', selectedColor = null, quantity = 1, sizeSpecificPrice = null, sizeSpecificOriginalPrice = null) => {
    setCart((prevCart) => {
      if (product && product.isCombo) {
        const itemKey = product.id || `combo-${Date.now()}`;
        return [...prevCart, { ...product, cartItemId: itemKey, quantity: (typeof selectedSize === 'number' ? selectedSize : quantity) || 1 }];
      }

      const colorName = selectedColor ? (selectedColor.name || selectedColor) : (product.colors?.[0]?.name || product.selectedColor || 'Standard');
      const sizeVal = selectedSize || product.selectedSize || product.sizes?.[0] || 'M';
      const isPair = Boolean(product.isPairOffer || product.pairOffer?.enabled || product.is_pair_offer);
      const itemKey = `${product.id}-${sizeVal}-${colorName}${isPair ? '-pair' : ''}`;

      const existingIndex = prevCart.findIndex(item => item.cartItemId === itemKey);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += (typeof selectedSize === 'number' ? selectedSize : quantity) || 1;
        return updated;
      } else {
        const baseSellingPrice = roundCurrency(Number(sizeSpecificPrice ?? product.price ?? product.unit_price ?? 0));
        const baseMrp = roundCurrency(Number(sizeSpecificOriginalPrice ?? product.originalPrice ?? product.original_price ?? product.price ?? 0));
        return [
          ...prevCart,
          {
            ...product,
            cartItemId: itemKey,
            selectedSize: sizeVal,
            selectedColor: colorName,
            quantity: (typeof selectedSize === 'number' ? selectedSize : quantity) || 1,
            price: baseSellingPrice,
            originalPrice: baseMrp,
            isPairOffer: isPair,
            pairOffer: product.pairOffer || (isPair ? { enabled: true } : null)
          }
        ];
      }
    });
  };

  const addMultipleToCart = (itemsList = []) => {
    if (!Array.isArray(itemsList) || itemsList.length === 0) return;
    setCart((prevCart) => {
      let updatedCart = [...prevCart];
      itemsList.forEach((product) => {
        if (!product) return;
        const colorName = product.selectedColor ? (product.selectedColor.name || product.selectedColor) : (product.colors?.[0]?.name || 'Standard');
        const sizeVal = product.selectedSize || product.sizes?.[0] || 'M';
        const qty = Math.max(1, Number(product.quantity || 1));
        const isPair = Boolean(product.isPairOffer || product.pairOffer?.enabled || product.is_pair_offer);
        const itemKey = `${product.id}-${sizeVal}-${colorName}${isPair ? '-pair' : ''}`;

        const existingIndex = updatedCart.findIndex(item => item.cartItemId === itemKey);
        if (existingIndex > -1) {
          updatedCart[existingIndex].quantity += qty;
        } else {
          const baseSellingPrice = roundCurrency(Number(product.price ?? product.unit_price ?? 0));
          const baseMrp = roundCurrency(Number(product.originalPrice ?? product.original_price ?? product.price ?? 0));
          updatedCart.push({
            ...product,
            cartItemId: itemKey,
            selectedSize: sizeVal,
            selectedColor: colorName,
            quantity: qty,
            price: baseSellingPrice,
            originalPrice: baseMrp,
            isPairOffer: isPair,
            pairOffer: product.pairOffer || (isPair ? { enabled: true } : null)
          });
        }
      });
      return updatedCart;
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => {
      const target = prev.find(item => item.cartItemId === cartItemId);
      if (!target) return prev;
      const next = prev.filter(item => item.cartItemId !== cartItemId);
      if (target.isPairOffer || target.isCombo) return next;
      const targetId = String(target.productId || target.product_id || target.id);
      const hasRemainingMain = next.some(item =>
        !item.isPairOffer && !item.isCombo &&
        String(item.productId || item.product_id || item.id) === targetId
      );
      if (hasRemainingMain) return next;
      const hasAnyMainLeft = next.some(item => !item.isPairOffer && !item.isCombo);
      return next.filter(item => {
        if (!item.isPairOffer) return true;
        const parentId = String(item.pairParentId ?? item.pair_parent_id ?? '');
        if (parentId === targetId) return false;
        if (!parentId) return hasAnyMainLeft;
        return true;
      });
    });
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

  // Pair Offer Dynamic Calculation Engine
  const pairSettings = {
    enabled: settings?.pair_offer_enabled !== false && String(settings?.pair_offer_enabled) !== 'false',
    discount_percent: Number(settings?.pair_offer_discount_percent ?? DEFAULT_PAIR_OFFER_SETTINGS.discount_percent),
    min_distinct_products: Number(settings?.pair_offer_min_products ?? DEFAULT_PAIR_OFFER_SETTINGS.min_distinct_products)
  };

  const pairCalc = calculatePairOffers({
    items: cart,
    pairSettings
  });

  const effectiveCart = pairCalc.normalizedItems;
  const subtotal = pairCalc.subtotal;
  const originalSubtotal = pairCalc.originalSubtotal;
  const pairOfferSavings = pairCalc.pairOfferSavings;
  const pairWellWithSubtotal = pairCalc.pairWellWithSubtotal;
  const pairWellWithDiscount = pairCalc.pairWellWithDiscount;
  const pairWellWithTotal = pairCalc.pairWellWithTotal;
  const isMultiPairOfferActive = pairCalc.isMultiOfferActive;
  const distinctPairProductCount = pairCalc.distinctPairProductCount;
  const mainProductsSubtotal = pairCalc.mainProductsSubtotal;

  // Delivery Calculation Engine Integration
  const deliverySettings = settings?.delivery_settings || DEFAULT_DELIVERY_SETTINGS;
  const deliveryResult = calculateDeliveryCharge({
    cartItems: effectiveCart,
    subtotal,
    pincode,
    deliverySettings,
    legacySettings: settings,
    isMultiPairOfferActive
  });

  const shippingCost = effectiveCart.length === 0 ? 0 : Number(deliveryResult.shippingFee || 0);
  const total = Math.max(0, roundCurrency(subtotal + shippingCost - discountAmount));
  const cartTotal = Math.max(0, roundCurrency(subtotal - discountAmount));
  const totalSavings = roundCurrency(pairOfferSavings + discountAmount);

  // Free shipping threshold for cart progress bar (from price based or legacy)
  const priceRanges = deliverySettings?.price_based?.ranges || [];
  const freeTier = priceRanges.find(r => Number(r.charge) === 0);
  const freeShippingThreshold = freeTier ? Number(freeTier.min) : (Number(settings?.free_shipping_threshold) || 2000);

  const pricingBreakdown = {
    isPairOfferActive: pairCalc.isPairOfferActive,
    isMultiPairOfferActive,
    discountPercent: pairCalc.discountPercent,
    totalMrp: pairCalc.totalMrp,
    mainProductsSubtotal,
    pairWellWithMrpTotal: pairCalc.pairWellWithMrpTotal,
    pairWellWithSubtotal,
    pairWellWithDiscount,
    pairWellWithTotal,
    pairOfferSavings,
    distinctPairProductCount,
    originalSubtotal,
    subtotal,
    couponDiscount: discountAmount,
    shippingCost,
    total,
    totalSavings,
    deliveryMethod: deliveryResult.method,
    deliveryLocation: deliveryResult.locationLabel,
    deliveryExplanation: deliveryResult.explanation,
    isBelowMinOrder: deliveryResult.isBelowMinOrder,
    minOrderAmount: deliveryResult.minOrderAmount
  };

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
        cart: effectiveCart,
        rawCart: cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        addMultipleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        originalSubtotal,
        mainProductsSubtotal,
        pairWellWithSubtotal,
        pairWellWithDiscount,
        pairWellWithTotal,
        pairOfferSavings,
        isMultiPairOfferActive,
        distinctPairProductCount,
        pairSettings,
        total,
        cartTotal,
        shippingCost,
        freeShippingThreshold,
        deliveryResult,
        deliverySettings,
        pincode,
        setPincode,
        shippingFee: shippingCost,
        appliedCoupon,
        discountAmount,
        pricingBreakdown,
        applyCoupon,
        removeCoupon,
        totalItems: effectiveCart.reduce((acc, item) => acc + item.quantity, 0)
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cart: [],
      rawCart: [],
      isCartOpen: false,
      setIsCartOpen: () => {},
      addToCart: () => {},
      addMultipleToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      subtotal: 0,
      originalSubtotal: 0,
      mainProductsSubtotal: 0,
      pairWellWithSubtotal: 0,
      pairWellWithDiscount: 0,
      pairWellWithTotal: 0,
      pairOfferSavings: 0,
      isMultiPairOfferActive: false,
      distinctPairProductCount: 0,
      pairSettings: DEFAULT_PAIR_OFFER_SETTINGS,
      total: 0,
      cartTotal: 0,
      shippingCost: 0,
      freeShippingThreshold: 0,
      deliveryResult: {},
      deliverySettings: {},
      pincode: '',
      setPincode: () => {},
      shippingFee: 0,
      appliedCoupon: null,
      discountAmount: 0,
      pricingBreakdown: {},
      applyCoupon: async () => ({ success: false, message: '' }),
      removeCoupon: () => {},
      totalItems: 0
    };
  }
  return context;
};
