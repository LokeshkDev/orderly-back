export const DEFAULT_DELIVERY_SETTINGS = {
  price_based: {
    enabled: true,
    min_order_required: false,
    min_order_amount: 500,
    ranges: [
      { min: 0, max: 499, charge: 100 },
      { min: 500, max: 999, charge: 75 },
      { min: 1000, max: 1999, charge: 50 },
      { min: 2000, max: null, charge: 0 }
    ]
  },
  pincode_based: {
    enabled: true,
    chennai: {
      charge: 50,
      pincodes: [
        '600001', '600002', '600003', '600004', '600005', '600006', '600007', '600008', '600009', '600010',
        '600011', '600012', '600013', '600014', '600015', '600016', '600017', '600018', '600019', '600020',
        '600021', '600022', '600023', '600024', '600025', '600026', '600027', '600028', '600029', '600030',
        '600031', '600032', '600033', '600034', '600035', '600036', '600037', '600038', '600039', '600040',
        '600041', '600042', '600043', '600044', '600045', '600048', '600049', '600050', '600051', '600052',
        '600053', '600054', '600056', '600058', '600059', '600061', '600062', '600064', '600069', '600070',
        '600073', '600075', '600077', '600078', '600082', '600083', '600084', '600085', '600087', '600088',
        '600089', '600091', '600092', '600093', '600094', '600095', '600096', '600097', '600099', '600100',
        '600101', '600102', '600106', '600107', '600108', '600113', '600114', '600116', '600117', '600118',
        '600119', '600122', '600123', '600124', '600125', '600126', '600127', '600128', '600129', '600130'
      ],
      pincode_ranges: [
        { from: '600001', to: '600130' }
      ]
    },
    tamil_nadu: {
      charge: 80,
      pincodes: [],
      pincode_ranges: [
        { from: '600001', to: '643999' }
      ]
    },
    other_states: {
      charge: 150
    }
  },
  item_based: {
    enabled: false,
    first_item_charge: 50,
    additional_item_charge: 10
  },
  combo_delivery: {
    enabled: true,
    charge: 99,
    free_delivery_above: 1999,
    per_combo_charge: 0,
    label: 'Combo Express Delivery'
  },
  priority: 'pincode_based'
};

export const DEFAULT_COURIER_SETTINGS = [
  {
    id: 'st_courier',
    name: 'ST Courier',
    tracking_url_template: 'https://stcourier.com/track?tracking={trackingNumber}',
    active: true
  },
  {
    id: 'dtdc',
    name: 'DTDC',
    tracking_url_template: 'https://www.dtdc.in/tracking/shipment-tracking.asp?trackingNumber={trackingNumber}',
    active: true
  },
  {
    id: 'franch',
    name: 'Franch',
    tracking_url_template: 'https://www.franchexpress.com/tracking?awb={trackingNumber}',
    active: true
  },
  {
    id: 'professional',
    name: 'Professional',
    tracking_url_template: 'https://www.tpcindia.com/track.aspx?awb={trackingNumber}',
    active: true
  }
];

export const buildCourierTrackingUrl = (courierName, trackingNumber, customCouriers = null) => {
  if (!trackingNumber) return '';
  const cleanTracking = String(trackingNumber).trim();
  const couriers = Array.isArray(customCouriers) && customCouriers.length > 0
    ? customCouriers
    : DEFAULT_COURIER_SETTINGS;

  const normalizedName = String(courierName || '').trim().toLowerCase();
  const matched = couriers.find(c => 
    c.name.toLowerCase() === normalizedName ||
    c.id.toLowerCase() === normalizedName.replace(/\s+/g, '_') ||
    normalizedName.includes(c.name.toLowerCase())
  );

  if (matched?.tracking_url_template) {
    return matched.tracking_url_template.replace('{trackingNumber}', encodeURIComponent(cleanTracking));
  }

  if (normalizedName.includes('st')) {
    return `https://stcourier.com/track?tracking=${encodeURIComponent(cleanTracking)}`;
  }
  if (normalizedName.includes('dtdc')) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?trackingNumber=${encodeURIComponent(cleanTracking)}`;
  }
  if (normalizedName.includes('franch')) {
    return `https://www.franchexpress.com/tracking?awb=${encodeURIComponent(cleanTracking)}`;
  }
  if (normalizedName.includes('pro')) {
    return `https://www.tpcindia.com/track.aspx?awb=${encodeURIComponent(cleanTracking)}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${courierName || 'courier'} tracking ${cleanTracking}`)}`;
};

export const isValidPincode = (pincode) => {
  if (!pincode) return false;
  const clean = String(pincode).trim();
  return /^[1-9][0-9]{5}$/.test(clean);
};

export const determinePincodeLocation = (pincode, pincodeSettings = DEFAULT_DELIVERY_SETTINGS.pincode_based) => {
  if (!isValidPincode(pincode)) {
    return { location: 'Invalid Pincode', locationKey: 'invalid', charge: null, valid: false };
  }

  const codeStr = String(pincode).trim();
  const codeNum = parseInt(codeStr, 10);

  const chennaiConfig = pincodeSettings?.chennai || DEFAULT_DELIVERY_SETTINGS.pincode_based.chennai;
  const tnConfig = pincodeSettings?.tamil_nadu || DEFAULT_DELIVERY_SETTINGS.pincode_based.tamil_nadu;
  const otherConfig = pincodeSettings?.other_states || DEFAULT_DELIVERY_SETTINGS.pincode_based.other_states;

  if (Array.isArray(chennaiConfig.pincodes) && chennaiConfig.pincodes.map(String).includes(codeStr)) {
    return { location: 'Chennai', locationKey: 'chennai', charge: Number(chennaiConfig.charge ?? 50), valid: true };
  }

  if (Array.isArray(chennaiConfig.pincode_ranges)) {
    for (const range of chennaiConfig.pincode_ranges) {
      const from = parseInt(range.from, 10);
      const to = parseInt(range.to, 10);
      if (!isNaN(from) && !isNaN(to) && codeNum >= from && codeNum <= to) {
        return { location: 'Chennai', locationKey: 'chennai', charge: Number(chennaiConfig.charge ?? 50), valid: true };
      }
    }
  }

  if (Array.isArray(tnConfig.pincodes) && tnConfig.pincodes.map(String).includes(codeStr)) {
    return { location: 'Tamil Nadu', locationKey: 'tamil_nadu', charge: Number(tnConfig.charge ?? 80), valid: true };
  }

  if (Array.isArray(tnConfig.pincode_ranges)) {
    for (const range of tnConfig.pincode_ranges) {
      const from = parseInt(range.from, 10);
      const to = parseInt(range.to, 10);
      if (!isNaN(from) && !isNaN(to) && codeNum >= from && codeNum <= to) {
        return { location: 'Tamil Nadu', locationKey: 'tamil_nadu', charge: Number(tnConfig.charge ?? 80), valid: true };
      }
    }
  }

  if (codeNum >= 600001 && codeNum <= 643999) {
    return { location: 'Tamil Nadu', locationKey: 'tamil_nadu', charge: Number(tnConfig.charge ?? 80), valid: true };
  }

  return { location: 'Other State', locationKey: 'other_states', charge: Number(otherConfig.charge ?? 150), valid: true };
};

export const calculatePriceBasedDelivery = (subtotal, priceConfig = DEFAULT_DELIVERY_SETTINGS.price_based) => {
  const numericSubtotal = Math.max(0, Number(subtotal) || 0);
  const minOrderRequired = Boolean(priceConfig?.min_order_required);
  const minOrderAmount = Number(priceConfig?.min_order_amount) || 0;

  const isBelowMinOrder = minOrderRequired && numericSubtotal < minOrderAmount;
  const ranges = Array.isArray(priceConfig?.ranges) && priceConfig.ranges.length > 0
    ? priceConfig.ranges
    : DEFAULT_DELIVERY_SETTINGS.price_based.ranges;

  const sortedRanges = [...ranges].sort((a, b) => Number(a.min) - Number(b.min));

  let matchedCharge = 0;
  let matchedRange = null;

  for (const r of sortedRanges) {
    const min = Number(r.min) || 0;
    const max = r.max !== null && r.max !== undefined && r.max !== '' ? Number(r.max) : Infinity;

    if (numericSubtotal >= min && numericSubtotal <= max) {
      matchedCharge = Number(r.charge || 0);
      matchedRange = r;
      break;
    }
  }

  if (!matchedRange && sortedRanges.length > 0) {
    const highest = sortedRanges[sortedRanges.length - 1];
    if (numericSubtotal >= Number(highest.min || 0)) {
      matchedCharge = Number(highest.charge || 0);
      matchedRange = highest;
    }
  }

  return {
    charge: matchedCharge,
    isBelowMinOrder,
    minOrderAmount,
    minOrderRequired,
    matchedRange,
    description: matchedCharge === 0 ? 'Free Delivery' : `Price-Based Delivery: ₹${matchedCharge}`
  };
};

export const calculateItemBasedDelivery = (totalItems, itemConfig = DEFAULT_DELIVERY_SETTINGS.item_based, isAdditionalOnly = false) => {
  const count = Math.max(0, Number(totalItems) || 0);
  if (count === 0) return { charge: 0, totalItems: 0, description: '₹0 (0 items)' };

  const firstItemCharge = Number(itemConfig?.first_item_charge ?? 50);
  const additionalItemCharge = Number(itemConfig?.additional_item_charge ?? 10);

  const charge = isAdditionalOnly
    ? (count * additionalItemCharge)
    : (firstItemCharge + (Math.max(0, count - 1) * additionalItemCharge));

  return {
    charge,
    totalItems: count,
    firstItemCharge,
    additionalItemCharge,
    isAdditionalOnly,
    description: isAdditionalOnly
      ? `Additional Single Product Delivery (${count} item${count > 1 ? 's' : ''} @ ₹${additionalItemCharge}): ₹${charge}`
      : `Item-Based Delivery (${count} item${count > 1 ? 's' : ''}): ₹${charge}`
  };
};

export const isComboItem = (it) => {
  if (!it) return false;
  return Boolean(
    it.isCombo || 
    it.is_combo || 
    it.combo_id || 
    it.comboId ||
    it.type === 'combo' || 
    it.itemType === 'combo' ||
    it.pieces_count || 
    String(it.id || '').startsWith('combo-') || 
    String(it.productId || '').startsWith('combo-') ||
    String(it.product_id || '').startsWith('combo-') ||
    String(it.cartItemId || '').startsWith('combo-')
  );
};

export const calculateComboDelivery = ({
  comboItems = [],
  comboSubtotal = 0,
  cartSubtotal = 0,
  comboSettings = DEFAULT_DELIVERY_SETTINGS.combo_delivery
}) => {
  const comboConfig = comboSettings || DEFAULT_DELIVERY_SETTINGS.combo_delivery;
  const flatCharge = Number(comboConfig.charge ?? 99);
  const freeThreshold = Number(comboConfig.free_delivery_above ?? 1999);
  const perComboFee = Number(comboConfig.per_combo_charge ?? 0);
  const label = comboConfig.label || 'Combo Express Delivery';

  const comboCount = Array.isArray(comboItems)
    ? comboItems.reduce((acc, it) => acc + (Math.max(1, Number(it.quantity) || 1)), 0)
    : 0;

  if (comboCount === 0) {
    return {
      shippingFee: 0,
      comboCount: 0,
      label,
      isFree: false,
      breakdownText: '₹0',
      explanation: 'No combos in cart'
    };
  }

  const isFree = freeThreshold > 0 && (comboSubtotal >= freeThreshold || cartSubtotal >= freeThreshold);
  const charge = isFree ? 0 : (flatCharge + Math.max(0, comboCount - 1) * perComboFee);
  const comboLabel = comboCount > 1 ? `${label} (${comboCount} combos)` : label;

  return {
    shippingFee: charge,
    comboCount,
    label: comboLabel,
    baseCharge: flatCharge,
    perComboFee,
    isFree,
    breakdownText: isFree ? 'FREE Combo Shipping' : `${comboLabel}: ₹${charge}`,
    explanation: isFree 
      ? `Free Delivery threshold of ₹${freeThreshold} reached` 
      : (comboCount > 1 
          ? `Combo delivery (1st combo: ₹${flatCharge} + ${comboCount - 1} extra @ ₹${perComboFee} = ₹${charge})`
          : `Combo delivery (1 combo: ₹${flatCharge})`)
  };
};

export const calculateStandardDelivery = ({
  items = [],
  subtotal = 0,
  totalItemQuantity = 0,
  pincode = '',
  settings = DEFAULT_DELIVERY_SETTINGS,
  legacySettings = null,
  isAdditionalToCombo = false
}) => {
  const numSubtotal = Math.max(0, Number(subtotal) || 0);
  const totalQty = totalItemQuantity > 0 
    ? totalItemQuantity 
    : (Array.isArray(items) ? items.reduce((acc, item) => acc + (Math.max(1, Number(item.quantity) || 1)), 0) : 0);

  // When combos are already in the cart, single products are charged at the additional item rate
  if (isAdditionalToCombo) {
    const additionalPerItem = Number(settings?.item_based?.additional_item_charge ?? 10);
    const itemResult = calculateItemBasedDelivery(totalQty, settings?.item_based || DEFAULT_DELIVERY_SETTINGS.item_based, true);
    return {
      shippingFee: itemResult.charge,
      method: 'item_based_additional',
      methodLabel: totalQty === 1 ? 'Additional Single Product' : `Additional Single Products (${totalQty})`,
      locationLabel: null,
      isBelowMinOrder: false,
      minOrderAmount: 0,
      breakdownText: itemResult.description,
      explanation: `${totalQty} additional single product(s) @ ₹${additionalPerItem}`
    };
  }

  const isPriceEnabled = Boolean(settings?.price_based?.enabled);
  const isPincodeEnabled = Boolean(settings?.pincode_based?.enabled);
  const isItemEnabled = Boolean(settings?.item_based?.enabled);

  if (!isPriceEnabled && !isPincodeEnabled && !isItemEnabled) {
    const freeThreshold = Number(legacySettings?.free_shipping_threshold ?? 2500);
    const flatFee = Number(legacySettings?.shipping_fee ?? 199);
    const isFree = numSubtotal === 0 || (freeThreshold > 0 && numSubtotal >= freeThreshold);
    const legacyCharge = isFree ? 0 : flatFee;

    return {
      shippingFee: legacyCharge,
      method: 'legacy',
      methodLabel: isFree ? 'Complimentary Express Shipping' : 'Standard Shipping',
      locationLabel: null,
      isBelowMinOrder: false,
      minOrderAmount: 0,
      breakdownText: isFree ? 'FREE Shipping' : `Standard Shipping: ₹${legacyCharge}`,
      explanation: isFree ? `Free Shipping threshold of ₹${freeThreshold} reached` : `Flat fee ₹${flatFee}`
    };
  }

  const priorityPreference = settings.priority || 'pincode_based';
  const methodsInOrder = [];

  if (priorityPreference === 'pincode_based') {
    if (isPincodeEnabled) methodsInOrder.push('pincode_based');
    if (isPriceEnabled) methodsInOrder.push('price_based');
    if (isItemEnabled) methodsInOrder.push('item_based');
  } else if (priorityPreference === 'item_based') {
    if (isItemEnabled) methodsInOrder.push('item_based');
    if (isPincodeEnabled) methodsInOrder.push('pincode_based');
    if (isPriceEnabled) methodsInOrder.push('price_based');
  } else {
    if (isPriceEnabled) methodsInOrder.push('price_based');
    if (isPincodeEnabled) methodsInOrder.push('pincode_based');
    if (isItemEnabled) methodsInOrder.push('item_based');
  }

  if (isPriceEnabled && !methodsInOrder.includes('price_based')) methodsInOrder.push('price_based');
  if (isPincodeEnabled && !methodsInOrder.includes('pincode_based')) methodsInOrder.push('pincode_based');
  if (isItemEnabled && !methodsInOrder.includes('item_based')) methodsInOrder.push('item_based');

  for (const method of methodsInOrder) {
    if (method === 'pincode_based' && isPincodeEnabled) {
      if (isValidPincode(pincode)) {
        const pinResult = determinePincodeLocation(pincode, settings.pincode_based);
        return {
          shippingFee: pinResult.charge ?? 0,
          method: 'pincode_based',
          methodLabel: `Delivery to ${pinResult.location}`,
          locationLabel: pinResult.location,
          isBelowMinOrder: false,
          minOrderAmount: 0,
          breakdownText: `Delivery to ${pinResult.location}: ₹${pinResult.charge}`,
          explanation: `Calculated from pincode ${pincode} (${pinResult.location})`
        };
      }
      if (methodsInOrder.length === 1) {
        const pinResult = determinePincodeLocation(pincode, settings.pincode_based);
        const charge = pinResult.valid ? pinResult.charge : (Number(settings.pincode_based?.other_states?.charge) || 150);
        return {
          shippingFee: charge,
          method: 'pincode_based',
          methodLabel: pinResult.valid ? `Delivery to ${pinResult.location}` : 'Pincode-Based Delivery',
          locationLabel: pinResult.valid ? pinResult.location : null,
          isBelowMinOrder: false,
          minOrderAmount: 0,
          breakdownText: pinResult.valid ? `Delivery to ${pinResult.location}: ₹${charge}` : 'Enter Pincode for Exact Delivery Charge',
          explanation: pinResult.valid ? `Pincode ${pincode}` : 'Standard location-based calculation'
        };
      }
    }

    if (method === 'price_based' && isPriceEnabled) {
      const priceResult = calculatePriceBasedDelivery(numSubtotal, settings.price_based);
      return {
        shippingFee: priceResult.charge,
        method: 'price_based',
        methodLabel: priceResult.charge === 0 ? 'Free Delivery' : 'Order-Value Delivery',
        locationLabel: null,
        isBelowMinOrder: priceResult.isBelowMinOrder,
        minOrderAmount: priceResult.minOrderAmount,
        breakdownText: priceResult.description,
        explanation: `Order value ₹${numSubtotal.toLocaleString('en-IN')}`
      };
    }

    if (method === 'item_based' && isItemEnabled) {
      const itemResult = calculateItemBasedDelivery(totalQty, settings.item_based);
      return {
        shippingFee: itemResult.charge,
        method: 'item_based',
        methodLabel: 'Item-Based Delivery',
        locationLabel: null,
        isBelowMinOrder: false,
        minOrderAmount: 0,
        breakdownText: itemResult.description,
        explanation: `${totalQty} total item(s) in cart`
      };
    }
  }

  return {
    shippingFee: 0,
    method: 'free',
    methodLabel: 'Complimentary Delivery',
    locationLabel: null,
    isBelowMinOrder: false,
    minOrderAmount: 0,
    breakdownText: 'FREE Delivery',
    explanation: 'Complimentary delivery applied'
  };
};

export const calculateDeliveryCharge = ({
  cartItems = [],
  subtotal = 0,
  pincode = '',
  deliverySettings = null,
  legacySettings = null,
  isMultiPairOfferActive = false
}) => {
  const settings = deliverySettings || DEFAULT_DELIVERY_SETTINGS;
  const numSubtotal = Math.max(0, Number(subtotal) || 0);

  // If Multi-Product Pair Well With offer is active, delivery is unconditionally FREE
  if (isMultiPairOfferActive) {
    return {
      shippingFee: 0,
      comboShippingFee: 0,
      singleShippingFee: 0,
      method: 'pair_offer_free',
      methodLabel: 'FREE Express Delivery',
      locationLabel: null,
      isBelowMinOrder: false,
      minOrderAmount: 0,
      breakdownText: 'FREE Delivery (Pair Offer)',
      explanation: 'Unlocked with Pair Well With Offer'
    };
  }

  const items = Array.isArray(cartItems) ? cartItems : [];
  if (items.length === 0) {
    return {
      shippingFee: 0,
      comboShippingFee: 0,
      singleShippingFee: 0,
      method: 'free',
      methodLabel: 'Delivery',
      locationLabel: null,
      isBelowMinOrder: false,
      minOrderAmount: 0,
      breakdownText: '₹0',
      explanation: 'Cart is empty'
    };
  }

  const comboItems = items.filter(isComboItem);
  const singleItems = items.filter(it => !isComboItem(it));

  const hasCombos = comboItems.length > 0;
  const hasSingles = singleItems.length > 0;
  const isComboDeliveryEnabled = Boolean(settings?.combo_delivery?.enabled);

  // If combo delivery setting is enabled and cart contains combo items
  if (isComboDeliveryEnabled && hasCombos) {
    const comboSubtotal = comboItems.reduce((acc, it) => acc + (Number(it.line_total ?? (Number(it.price ?? it.unit_price ?? 0) * (Number(it.quantity) || 1))) || 0), 0);
    const comboRes = calculateComboDelivery({
      comboItems,
      comboSubtotal,
      cartSubtotal: numSubtotal,
      comboSettings: settings.combo_delivery
    });

    // Case 1: Both combo and single products are present in the cart -> sum both delivery charges
    if (hasSingles) {
      const singleSubtotal = singleItems.reduce((acc, it) => acc + (Number(it.line_total ?? (Number(it.price ?? it.unit_price ?? 0) * (Number(it.quantity) || 1))) || 0), 0);
      const singleQty = singleItems.reduce((acc, it) => acc + Math.max(1, Number(it.quantity) || 1), 0);

      const singleRes = calculateStandardDelivery({
        items: singleItems,
        subtotal: singleSubtotal,
        totalItemQuantity: singleQty,
        pincode,
        settings,
        legacySettings,
        isAdditionalToCombo: true
      });

      const totalShippingFee = comboRes.shippingFee + singleRes.shippingFee;

      let breakdownText = '';
      if (comboRes.shippingFee > 0 && singleRes.shippingFee > 0) {
        breakdownText = `${comboRes.label} (₹${comboRes.shippingFee}) + ${singleRes.methodLabel} (₹${singleRes.shippingFee}): Total ₹${totalShippingFee}`;
      } else if (comboRes.shippingFee > 0 && singleRes.shippingFee === 0) {
        breakdownText = `${comboRes.label} (₹${comboRes.shippingFee}) + Free Delivery (Single Items)`;
      } else if (comboRes.shippingFee === 0 && singleRes.shippingFee > 0) {
        breakdownText = `Free Combo Delivery + ${singleRes.methodLabel} (₹${singleRes.shippingFee}): Total ₹${totalShippingFee}`;
      } else {
        breakdownText = 'FREE Delivery (Combos & Single Products)';
      }

      return {
        shippingFee: totalShippingFee,
        comboShippingFee: comboRes.shippingFee,
        singleShippingFee: singleRes.shippingFee,
        comboCount: comboRes.comboCount,
        singleCount: singleQty,
        method: 'combined_delivery',
        methodLabel: `${comboRes.label} + ${singleRes.methodLabel}`,
        locationLabel: singleRes.locationLabel,
        isBelowMinOrder: singleRes.isBelowMinOrder,
        minOrderAmount: singleRes.minOrderAmount,
        breakdownText,
        explanation: `${comboRes.comboCount} combo(s) [₹${comboRes.shippingFee}] + ${singleQty} additional single product(s) [₹${singleRes.shippingFee}]`
      };
    }

    // Case 2: Only combo products in cart
    return {
      shippingFee: comboRes.shippingFee,
      comboShippingFee: comboRes.shippingFee,
      singleShippingFee: 0,
      comboCount: comboRes.comboCount,
      singleCount: 0,
      method: 'combo_delivery',
      methodLabel: comboRes.isFree ? 'Free Combo Delivery' : comboRes.label,
      locationLabel: null,
      isBelowMinOrder: false,
      minOrderAmount: 0,
      breakdownText: comboRes.breakdownText,
      explanation: comboRes.explanation
    };
  }

  // Case 3: Standard delivery only (single products only, or combo delivery disabled)
  const totalItemQuantity = items.reduce((acc, item) => acc + (Math.max(1, Number(item.quantity) || 1)), 0);
  const standardRes = calculateStandardDelivery({
    items,
    subtotal: numSubtotal,
    totalItemQuantity,
    pincode,
    settings,
    legacySettings,
    isAdditionalToCombo: false
  });

  return {
    ...standardRes,
    comboShippingFee: 0,
    singleShippingFee: standardRes.shippingFee,
    comboCount: 0,
    singleCount: totalItemQuantity
  };
};
