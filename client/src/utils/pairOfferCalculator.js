/**
 * Pair Well With — Multi-Product Offer Calculation Engine (Client-side)
 * Currency-safe, authoritative calculations based on MRP for PDP, Cart Drawer, and Checkout.
 */

export const DEFAULT_PAIR_OFFER_SETTINGS = {
  enabled: true,
  discount_percent: 25,
  min_distinct_products: 2
};

/**
 * Currency-safe rounding to 2 decimal places for INR and financial calculations.
 */
export const roundCurrency = (val) => {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Checks if a cart or order item is designated as an eligible Pair Well With product.
 */
export const isPairItem = (item) => {
  if (!item) return false;
  return Boolean(
    item.isPairOffer || 
    item.is_pair_offer || 
    item.pairOffer?.enabled || 
    item.pair_offer?.enabled ||
    item.isPairItem
  );
};

/**
 * Authoritative Pair Offer Calculation Engine
 * 
 * Rules:
 * 1. Single Main Product Only (0 suggested items): Uses standard single-product pricing / catalog offers.
 * 2. Main Product + 1 Suggested Product: Configured Pair Offer % (e.g. 20%) applies to the COMBINED MRP of [Main Product + Suggested Product].
 * 3. Main Product + 2 or More Suggested Products: Flat 25% OFF (default or admin configured %) applies to the COMBINED MRP of [Main Product + ALL Suggested Products] + FREE DELIVERY.
 * 4. All promotional discounts calculate strictly from MRP.
 */
export const calculatePairOffers = ({
  items = [],
  pairSettings = DEFAULT_PAIR_OFFER_SETTINGS,
  mainProducts = []
}) => {
  const isEnabled = pairSettings?.enabled !== false && String(pairSettings?.enabled) !== 'false';
  const multiOfferPercent = Math.max(0, Math.min(100, Number(pairSettings?.discount_percent ?? DEFAULT_PAIR_OFFER_SETTINGS.discount_percent)));
  const minDistinctRequired = Math.max(1, Number(pairSettings?.min_distinct_products ?? DEFAULT_PAIR_OFFER_SETTINGS.min_distinct_products));

  if (!Array.isArray(items) || items.length === 0) {
    return {
      isMultiOfferActive: false,
      isPairOfferActive: false,
      distinctPairProductCount: 0,
      minDistinctRequired,
      discountPercent: multiOfferPercent,
      totalMrp: 0,
      pairWellWithMrpTotal: 0,
      pairWellWithDiscount: 0,
      pairWellWithTotal: 0,
      mainProductsSubtotal: 0,
      subtotal: 0,
      originalSubtotal: 0,
      pairOfferSavings: 0,
      isFreeDeliveryEligible: false,
      normalizedItems: []
    };
  }

  // 1. Separate pair items from main/standard items
  const pairItems = [];
  const mainItems = [];

  const mainProductIds = new Set();
  const allowedSuggestedIds = new Set();

  items.forEach(item => {
    const pId = String(item.productId || item.product_id || item.id || '');
    if (!isPairItem(item)) {
      if (pId) mainProductIds.add(pId);
      if (Array.isArray(item.suggested_products)) {
        item.suggested_products.forEach(sid => allowedSuggestedIds.add(String(sid)));
      }
    }
  });

  if (Array.isArray(mainProducts)) {
    mainProducts.forEach(mp => {
      const mpId = String(mp.id || mp.productId || mp.product_id || '');
      if (mpId) mainProductIds.add(mpId);
      if (Array.isArray(mp.suggested_products)) {
        mp.suggested_products.forEach(sid => allowedSuggestedIds.add(String(sid)));
      }
    });
  }

  items.forEach(item => {
    const pId = String(item.productId || item.product_id || item.id || '');
    const explicitlyPaired = isPairItem(item);
    const isLinkedToMain = explicitlyPaired || (allowedSuggestedIds.has(pId) && mainProductIds.size > 0 && !mainProductIds.has(pId));

    if (explicitlyPaired || isLinkedToMain) {
      pairItems.push(item);
    } else {
      mainItems.push(item);
    }
  });

  // 2. Count distinct eligible suggested products
  const distinctProductIds = new Set(
    pairItems.map(item => String(item.productId || item.product_id || item.id || item.name))
  );
  const distinctPairProductCount = distinctProductIds.size;
  const isPairOfferActive = isEnabled && distinctPairProductCount > 0 && mainItems.length > 0;
  const isMultiOfferActive = isEnabled && distinctPairProductCount >= minDistinctRequired && mainItems.length > 0;

  // Determine the applicable bundle discount %
  let bundleDiscountPercent = 0;
  if (isMultiOfferActive) {
    bundleDiscountPercent = multiOfferPercent; // 25% default
  } else if (isPairOfferActive) {
    // 1 suggested product: use configured single pair % (default 20% or per-product config)
    const firstPair = pairItems[0];
    bundleDiscountPercent = Math.max(0, Math.min(90, Number(
      firstPair?.pairOffer?.discount_percent ??
      firstPair?.pairOffer?.discountPercent ??
      firstPair?.pair_offer?.discount_percent ??
      firstPair?.discount_percent ??
      20
    )));
  }

  let totalBundleMrp = 0;
  let totalBundleDiscount = 0;
  let totalBundleSelling = 0;

  let standaloneSubtotal = 0;
  let originalSubtotal = 0;

  // 3. Process Main Products
  const normalizedMainItems = mainItems.map(item => {
    const qty = Math.max(1, Number(item.quantity || 1));
    const regularSellingPrice = roundCurrency(Number(item.price ?? item.unit_price ?? item.sellingPrice ?? 0));
    const mrp = roundCurrency(Number(item.originalPrice ?? item.original_price ?? item.mrp ?? regularSellingPrice));
    const lineMrp = roundCurrency(mrp * qty);
    originalSubtotal = roundCurrency(originalSubtotal + lineMrp);

    if (isPairOfferActive) {
      // Main product is part of the bundle offer calculated on MRP
      totalBundleMrp = roundCurrency(totalBundleMrp + lineMrp);
      const unitDiscount = roundCurrency(mrp * (bundleDiscountPercent / 100));
      const effectiveUnitPrice = Math.max(0, roundCurrency(mrp - unitDiscount));
      const lineDiscount = roundCurrency(unitDiscount * qty);
      const lineTotal = roundCurrency(effectiveUnitPrice * qty);

      totalBundleDiscount = roundCurrency(totalBundleDiscount + lineDiscount);
      totalBundleSelling = roundCurrency(totalBundleSelling + lineTotal);

      return {
        ...item,
        quantity: qty,
        unit_price: effectiveUnitPrice,
        price: effectiveUnitPrice,
        original_price: mrp,
        originalPrice: mrp,
        isPairOffer: false,
        isBundleOfferApplied: true,
        appliedPairDiscountPercent: bundleDiscountPercent,
        line_subtotal: lineMrp,
        line_discount: lineDiscount,
        line_total: lineTotal
      };
    } else {
      // Standalone single product (no suggested products in cart)
      const lineTotal = roundCurrency(regularSellingPrice * qty);
      standaloneSubtotal = roundCurrency(standaloneSubtotal + lineTotal);

      return {
        ...item,
        quantity: qty,
        unit_price: regularSellingPrice,
        price: regularSellingPrice,
        original_price: mrp,
        originalPrice: mrp,
        isPairOffer: false,
        isBundleOfferApplied: false,
        line_subtotal: lineMrp,
        line_discount: 0,
        line_total: lineTotal
      };
    }
  });

  // 4. Process Suggested (Pair Well With) Items
  const normalizedPairItems = pairItems.map(item => {
    const qty = Math.max(1, Number(item.quantity || 1));
    const regularSellingPrice = roundCurrency(Number(item.base_selling_price ?? item.sellingPrice ?? item.price ?? item.unit_price ?? 0));
    const mrp = roundCurrency(Number(item.originalPrice ?? item.original_price ?? item.mrp ?? item.price ?? 0));
    const lineMrp = roundCurrency(mrp * qty);
    originalSubtotal = roundCurrency(originalSubtotal + lineMrp);
    totalBundleMrp = roundCurrency(totalBundleMrp + lineMrp);

    const unitDiscount = roundCurrency(mrp * (bundleDiscountPercent / 100));
    const effectiveUnitPrice = Math.max(0, roundCurrency(mrp - unitDiscount));
    const lineDiscount = roundCurrency(unitDiscount * qty);
    const lineTotal = roundCurrency(effectiveUnitPrice * qty);

    totalBundleDiscount = roundCurrency(totalBundleDiscount + lineDiscount);
    totalBundleSelling = roundCurrency(totalBundleSelling + lineTotal);

    return {
      ...item,
      quantity: qty,
      base_selling_price: regularSellingPrice,
      unit_price: effectiveUnitPrice,
      price: effectiveUnitPrice,
      original_price: mrp,
      originalPrice: mrp,
      isPairOffer: true,
      isBundleOfferApplied: isPairOfferActive,
      isMultiPairOfferApplied: isMultiOfferActive,
      appliedPairDiscountPercent: bundleDiscountPercent,
      line_subtotal: lineMrp,
      line_discount: lineDiscount,
      line_total: lineTotal,
      pairOffer: {
        ...(item.pairOffer || {}),
        enabled: true,
        isMultiOfferActive,
        discount_percent: bundleDiscountPercent
      }
    };
  });

  // Calculate final subtotal and discount totals
  let finalSubtotal = 0;
  let finalPairDiscount = 0;

  if (isPairOfferActive) {
    // Re-verify exact bundle discount from total bundle MRP to eliminate any decimal drift
    finalPairDiscount = roundCurrency(totalBundleMrp * (bundleDiscountPercent / 100));
    finalSubtotal = roundCurrency(totalBundleMrp - finalPairDiscount);
  } else {
    finalSubtotal = standaloneSubtotal;
    finalPairDiscount = 0;
  }

  const isFreeDeliveryEligible = isMultiOfferActive;

  // Combine normalized items preserving input order
  const normalizedItems = items.map(originalItem => {
    const pId = String(originalItem.productId || originalItem.product_id || originalItem.id || '');
    const isPair = isPairItem(originalItem) || (allowedSuggestedIds.has(pId) && mainProductIds.size > 0 && !mainProductIds.has(pId));
    
    if (isPair) {
      return normalizedPairItems.find(i => 
        String(i.productId || i.product_id || i.id) === pId && 
        i.selectedSize === originalItem.selectedSize &&
        i.selectedColor === originalItem.selectedColor
      ) || normalizedPairItems[0];
    } else {
      return normalizedMainItems.find(i => 
        String(i.productId || i.product_id || i.id) === pId && 
        i.selectedSize === originalItem.selectedSize &&
        i.selectedColor === originalItem.selectedColor
      ) || normalizedMainItems[0];
    }
  });

  return {
    isMultiOfferActive,
    isPairOfferActive,
    distinctPairProductCount,
    minDistinctRequired,
    discountPercent: bundleDiscountPercent,
    totalMrp: isPairOfferActive ? totalBundleMrp : originalSubtotal,
    pairWellWithMrpTotal: totalBundleMrp,
    pairWellWithDiscount: finalPairDiscount,
    pairWellWithTotal: finalSubtotal,
    mainProductsSubtotal: standaloneSubtotal,
    subtotal: finalSubtotal,
    originalSubtotal,
    pairOfferSavings: finalPairDiscount,
    isFreeDeliveryEligible,
    normalizedItems
  };
};

/**
 * Returns promotional banner and UI status details for PDP and Cart Drawer.
 */
export const getPairOfferStatus = ({
  cartItems = [],
  pairSettings = DEFAULT_PAIR_OFFER_SETTINGS,
  selectedSuggestedCount = 0
}) => {
  const isEnabled = pairSettings?.enabled !== false && String(pairSettings?.enabled) !== 'false';
  const multiOfferPercent = Number(pairSettings?.discount_percent ?? DEFAULT_PAIR_OFFER_SETTINGS.discount_percent);
  const minDistinctRequired = Number(pairSettings?.min_distinct_products ?? DEFAULT_PAIR_OFFER_SETTINGS.min_distinct_products);

  const pairItems = cartItems.filter(isPairItem);
  const distinctIds = new Set(pairItems.map(item => String(item.productId || item.product_id || item.id || item.name)));
  const totalCount = distinctIds.size + selectedSuggestedCount;

  if (!isEnabled) {
    return {
      status: 'disabled',
      badge: '',
      bannerText: '',
      isUnlocked: false
    };
  }

  if (totalCount === 0) {
    return {
      status: 'idle',
      badge: `AVAIL ${multiOfferPercent}% OFF`,
      bannerText: `Add 2 or more Pair Well With products to unlock flat ${multiOfferPercent}% OFF on total MRP + FREE DELIVERY!`,
      isUnlocked: false,
      itemsNeeded: minDistinctRequired
    };
  }

  if (totalCount < minDistinctRequired) {
    const needed = minDistinctRequired - totalCount;
    return {
      status: 'progress',
      badge: 'ADD 1 MORE',
      bannerText: `Add ${needed} more Pair Well With product to unlock flat ${multiOfferPercent}% OFF on all items + FREE DELIVERY!`,
      isUnlocked: false,
      itemsNeeded: needed
    };
  }

  return {
    status: 'unlocked',
    badge: `${multiOfferPercent}% OFF UNLOCKED`,
    bannerText: `🎉 Flat ${multiOfferPercent}% OFF on Total MRP Unlocked + FREE DELIVERY!`,
    isUnlocked: true,
    itemsNeeded: 0
  };
};
