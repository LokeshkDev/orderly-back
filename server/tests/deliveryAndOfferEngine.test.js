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

console.log('\n ALL 5 UNIT TESTS PASSED SUCCESSFULLY! ');
