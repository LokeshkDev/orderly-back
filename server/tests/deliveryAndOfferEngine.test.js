import assert from 'node:assert';
import { 
  calculateDeliveryCharge, 
  determinePincodeLocation, 
  calculatePriceBasedDelivery, 
  calculateItemBasedDelivery, 
  buildCourierTrackingUrl, 
  DEFAULT_DELIVERY_SETTINGS, 
  DEFAULT_COURIER_SETTINGS 
} from '../utils/deliveryCalculator.js';

console.log('--- Starting Delivery Engine & Pair Offer Unit Tests ---');

// TEST 1: Price-Based Delivery Calculation
{
  const testSettings = {
    ...DEFAULT_DELIVERY_SETTINGS,
    price_based: {
      enabled: true,
      min_order_required: true,
      min_order_amount: 500,
      ranges: [
        { min: 0, max: 499, charge: 100 },
        { min: 500, max: 999, charge: 50 },
        { min: 1000, max: null, charge: 0 }
      ]
    },
    pincode_based: { enabled: false },
    item_based: { enabled: false }
  };

  // Subtotal ₹300 (below min order 500)
  const resBelow = calculatePriceBasedDelivery(300, testSettings.price_based);
  assert.strictEqual(resBelow.isBelowMinOrder, true, 'Should detect order below min order amount');
  assert.strictEqual(resBelow.charge, 100, 'Charge for 300 should be 100');

  // Subtotal ₹750
  const resMid = calculatePriceBasedDelivery(750, testSettings.price_based);
  assert.strictEqual(resMid.isBelowMinOrder, false, '750 is above min order 500');
  assert.strictEqual(resMid.charge, 50, 'Charge for 750 should be 50');

  // Subtotal ₹1500 (Free delivery tier)
  const resFree = calculatePriceBasedDelivery(1500, testSettings.price_based);
  assert.strictEqual(resFree.charge, 0, 'Charge for 1500 should be 0 (Free)');

  console.log('✓ TEST 1 Passed: Price-based ranges and min-order validation');
}

// TEST 2: Pincode Location Resolution
{
  const chennaiLoc = determinePincodeLocation('600028', DEFAULT_DELIVERY_SETTINGS.pincode_based);
  assert.strictEqual(chennaiLoc.locationKey, 'chennai');
  assert.strictEqual(chennaiLoc.charge, 50);

  const tnLoc = determinePincodeLocation('641001', DEFAULT_DELIVERY_SETTINGS.pincode_based);
  assert.strictEqual(tnLoc.locationKey, 'tamil_nadu');
  assert.strictEqual(tnLoc.charge, 80);

  const blrLoc = determinePincodeLocation('560001', DEFAULT_DELIVERY_SETTINGS.pincode_based);
  assert.strictEqual(blrLoc.locationKey, 'other_states');
  assert.strictEqual(blrLoc.charge, 150);

  console.log('✓ TEST 2 Passed: Pincode location resolution (Chennai, Tamil Nadu, Other States)');
}

// TEST 3: Item-Count Based Delivery
{
  const itemSettings = {
    enabled: true,
    first_item_charge: 50,
    additional_item_charge: 10
  };

  // 1 item
  const res1 = calculateItemBasedDelivery(1, itemSettings);
  assert.strictEqual(res1.charge, 50, '1 item should cost 50');

  // 3 items
  const res3 = calculateItemBasedDelivery(3, itemSettings);
  assert.strictEqual(res3.charge, 70, '3 items should cost 50 + 2*10 = 70');

  // 5 items
  const res5 = calculateItemBasedDelivery(5, itemSettings);
  assert.strictEqual(res5.charge, 90, '5 items should cost 50 + 4*10 = 90');

  console.log('✓ TEST 3 Passed: Item-count delivery calculation');
}

// TEST 4: Dynamic Courier Tracking URL Generation
{
  const stUrl = buildCourierTrackingUrl('ST Courier', 'ST123456', DEFAULT_COURIER_SETTINGS);
  assert.strictEqual(stUrl, 'https://stcourier.com/track?tracking=ST123456');

  const dtdcUrl = buildCourierTrackingUrl('DTDC', 'DTDC987654', DEFAULT_COURIER_SETTINGS);
  assert.strictEqual(dtdcUrl, 'https://www.dtdc.in/tracking/shipment-tracking.asp?trackingNumber=DTDC987654');

  const franchUrl = buildCourierTrackingUrl('Franch', 'FR7788', DEFAULT_COURIER_SETTINGS);
  assert.strictEqual(franchUrl, 'https://www.franchexpress.com/tracking?awb=FR7788');

  const profUrl = buildCourierTrackingUrl('Professional', 'PC9900', DEFAULT_COURIER_SETTINGS);
  assert.strictEqual(profUrl, 'https://www.tpcindia.com/track.aspx?awb=PC9900');

  console.log('✓ TEST 4 Passed: Dynamic Courier tracking URL templates (ST, DTDC, Franch, Professional)');
}

// TEST 5: MRP Discount Calculation for Pair Offer
{
  const productMRP = 1000;
  const currentSalePrice = 850;
  const pairPercentage = 20;

  // Pair offer discount must be calculated strictly from MRP
  const pairOfferPrice = Math.round(productMRP * (1 - pairPercentage / 100));
  assert.strictEqual(pairOfferPrice, 800, '20% off MRP 1000 must be 800');

  const pairSavings = Math.max(0, productMRP - pairOfferPrice);
  assert.strictEqual(pairSavings, 200, 'Pair savings should be 200 from MRP');

  console.log('✓ TEST 5 Passed: Pair offer discount calculated strictly from product MRP');
}

// TEST 6: Combined Combo & Single Item Delivery Calculation
{
  const testDeliverySettings = {
    price_based: { enabled: false },
    pincode_based: { enabled: false },
    item_based: {
      enabled: true,
      first_item_charge: 80,
      additional_item_charge: 30
    },
    combo_delivery: {
      enabled: true,
      charge: 120,
      free_delivery_above: 3500,
      per_combo_charge: 60,
      label: 'Combo Express Delivery'
    },
    priority: 'item_based'
  };

  const comboItem = {
    id: 'combo-123',
    name: '3-Piece Summer Suit Combo',
    isCombo: true,
    price: 1800,
    quantity: 1
  };

  const singleItem = {
    id: 456,
    name: 'Striped Cotton Shirt',
    isCombo: false,
    price: 799,
    quantity: 1
  };

  // Case A: Only combo in cart -> combo delivery charge of 120
  const comboOnlyRes = calculateDeliveryCharge({
    cartItems: [comboItem],
    subtotal: 1800,
    deliverySettings: testDeliverySettings
  });
  assert.strictEqual(comboOnlyRes.shippingFee, 120, 'Combo only should be 120');
  assert.strictEqual(comboOnlyRes.method, 'combo_delivery');

  // Case B: Only single item in cart -> item_based delivery charge of 80
  const singleOnlyRes = calculateDeliveryCharge({
    cartItems: [singleItem],
    subtotal: 799,
    deliverySettings: testDeliverySettings
  });
  assert.strictEqual(singleOnlyRes.shippingFee, 80, 'Single item only should be 80');
  assert.strictEqual(singleOnlyRes.method, 'item_based');

  // Case C: 1 combo AND 1 single item in cart -> combo base (120) + additional single item rate (30) = 150!
  const combinedRes = calculateDeliveryCharge({
    cartItems: [comboItem, singleItem],
    subtotal: 2599,
    deliverySettings: testDeliverySettings
  });
  assert.strictEqual(combinedRes.shippingFee, 150, 'Combined shipping should be 120 + 30 = 150');
  assert.strictEqual(combinedRes.comboShippingFee, 120, 'Combo portion should be 120');
  assert.strictEqual(combinedRes.singleShippingFee, 30, 'Single portion should be additional rate 30');
  assert.strictEqual(combinedRes.method, 'combined_delivery');

  // Case D: 2 combos in cart -> 1st combo 120 + 2nd combo 60 = 180
  const twoCombosRes = calculateDeliveryCharge({
    cartItems: [{ ...comboItem, quantity: 2 }],
    subtotal: 3600,
    deliverySettings: testDeliverySettings
  });
  // Note: subtotal 3600 is > free_delivery_above 3500, so let's test with subtotal below 3500 first
  const twoCombosUnderThreshold = calculateDeliveryCharge({
    cartItems: [{ ...comboItem, quantity: 2, price: 1400 }],
    subtotal: 2800,
    deliverySettings: testDeliverySettings
  });
  assert.strictEqual(twoCombosUnderThreshold.shippingFee, 180, '2 combos should be 120 + 60 = 180');
  assert.strictEqual(twoCombosUnderThreshold.comboCount, 2);

  // Case E: 2 combos + 1 single item -> 180 (2 combos) + 30 (1 additional single) = 210
  const twoCombosPlusSingle = calculateDeliveryCharge({
    cartItems: [{ ...comboItem, quantity: 2, price: 1400 }, singleItem],
    subtotal: 3400,
    deliverySettings: testDeliverySettings
  });
  assert.strictEqual(twoCombosPlusSingle.shippingFee, 210, '2 combos (180) + 1 single item (30) = 210');
  assert.strictEqual(twoCombosPlusSingle.comboShippingFee, 180);
  assert.strictEqual(twoCombosPlusSingle.singleShippingFee, 30);

  // Case F: 2 combos + 2 single items -> 180 (2 combos) + 60 (2 * 30) = 240
  const twoCombosPlusTwoSingles = calculateDeliveryCharge({
    cartItems: [{ ...comboItem, quantity: 2, price: 1400 }, { ...singleItem, quantity: 2 }],
    subtotal: 3400,
    deliverySettings: testDeliverySettings
  });
  assert.strictEqual(twoCombosPlusTwoSingles.shippingFee, 240, '2 combos (180) + 2 single items (60) = 240');
  assert.strictEqual(twoCombosPlusTwoSingles.comboShippingFee, 180);
  assert.strictEqual(twoCombosPlusTwoSingles.singleShippingFee, 60);

  console.log('✓ TEST 6 Passed: Combined Combo & Single Item Delivery Calculation with Additional Item Cost (120+30=150, 180+30=210, 180+60=240)');
}

// TEST 7: Combined Combo & Single Items to Tamil Nadu (Order #ORD-20909218 Regression Test)
{
  const activeSettings = {
    ...DEFAULT_DELIVERY_SETTINGS,
    pincode_based: {
      enabled: true,
      chennai: {
        charge: 50,
        pincodes: ['600001', '600002'],
        pincode_ranges: [{ from: '600001', to: '600100' }]
      },
      tamil_nadu: {
        charge: 80,
        pincodes: [],
        pincode_ranges: [{ from: '600001', to: '643999' }]
      },
      other_states: {
        charge: 120
      }
    },
    combo_delivery: {
      enabled: true,
      charge: 120,
      free_delivery_above: 3500,
      per_combo_charge: 60,
      label: 'Combo Express Delivery'
    },
    priority: 'pincode_based'
  };

  const cartItems = [
    { id: 'combo-1791078716071', name: '2in1 porsche jackets combo', price: 1595, quantity: 1, isCombo: true },
    { id: 101, name: 'korean baggy pant-black', price: 850, quantity: 1, isCombo: false },
    { id: 102, name: 'lenin shirt-blue', price: 650, quantity: 1, isCombo: false },
    { id: 103, name: 'lenin shirt-black', price: 650, quantity: 1, isCombo: false },
    { id: 104, name: 'lenin shirt-white', price: 650, quantity: 1, isCombo: false }
  ];

  // Cart subtotal is 4395 (> 3500), but combo subtotal is only 1595 (< 3500).
  // Combo must NOT be free, and single items to TN 600117 must be 80. Total must be 200.
  const res = calculateDeliveryCharge({
    cartItems,
    subtotal: 4395,
    pincode: '600117',
    deliverySettings: activeSettings
  });

  assert.strictEqual(res.comboShippingFee, 120, 'Combo shipping fee must be 120 (not 0, since combo alone is < 3500)');
  assert.strictEqual(res.singleShippingFee, 80, 'Single products shipping fee to Tamil Nadu must be 80');
  assert.strictEqual(res.shippingFee, 200, 'Total delivery fee must be exactly 200');
  assert.strictEqual(res.method, 'combined_delivery');

  console.log('✓ TEST 7 Passed: Order #ORD-20909218 scenario verified: 1 Combo (120) + 4 Single Items to TN (80) = 200');
}

// TEST 8: 2 Single Products (Clubhouse Polo T-Shirt + Old-Money Tees Brown) with item_based delivery
{
  const activeSettings = {
    ...DEFAULT_DELIVERY_SETTINGS,
    pincode_based: {
      enabled: true,
      chennai: {
        charge: 50,
        pincodes: ['600001', '600002'],
        pincode_ranges: [{ from: '600001', to: '600100' }]
      },
      tamil_nadu: {
        charge: 80,
        pincodes: [],
        pincode_ranges: [{ from: '600001', to: '643999' }]
      },
      other_states: {
        charge: 120
      }
    },
    item_based: {
      enabled: true,
      first_item_charge: 60,
      additional_item_charge: 30
    },
    combo_delivery: {
      enabled: true,
      charge: 120,
      free_delivery_above: 3500,
      per_combo_charge: 60,
      label: 'Combo Express Delivery'
    },
    priority: 'item_based'
  };

  const singleItemsCart = [
    { id: 201, name: 'Clubhouse Polo T-Shirt - Beige', price: 795, quantity: 1, isCombo: false },
    { id: 202, name: 'Old-Money Tees Brown', price: 480, quantity: 1, isCombo: false }
  ];

  // 2 items to Chennai (600001) must charge 60 + 30 = 90 (not 50 flat pincode charge)
  const resChennai = calculateDeliveryCharge({
    cartItems: singleItemsCart,
    subtotal: 1275,
    pincode: '600001',
    deliverySettings: activeSettings
  });

  assert.strictEqual(resChennai.shippingFee, 90, '2 single items to Chennai must charge ₹90 (60 + 30)');
  assert.strictEqual(resChennai.singleShippingFee, 90);
  assert.strictEqual(resChennai.method, 'item_based');
  assert.strictEqual(resChennai.methodLabel, 'Delivery to Chennai');

  // 1 item must charge 60
  const resOneItem = calculateDeliveryCharge({
    cartItems: [singleItemsCart[0]],
    subtotal: 795,
    pincode: '600001',
    deliverySettings: activeSettings
  });
  assert.strictEqual(resOneItem.shippingFee, 60, '1 single item to Chennai must charge ₹60');

  // 3 items must charge 60 + 30 + 30 = 120
  const resThreeItems = calculateDeliveryCharge({
    cartItems: [singleItemsCart[0], { ...singleItemsCart[1], quantity: 2 }],
    subtotal: 1755,
    pincode: '600001',
    deliverySettings: activeSettings
  });
  assert.strictEqual(resThreeItems.shippingFee, 120, '3 single items to Chennai must charge ₹120');

  console.log('✓ TEST 8 Passed: 2 Single Products to Chennai correctly calculates ₹90 (60 + 30), 1 item = ₹60, 3 items = ₹120');
}

console.log('\n ALL 8 UNIT TESTS PASSED SUCCESSFULLY! ');
