import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePairOffers,
  roundCurrency,
  DEFAULT_PAIR_OFFER_SETTINGS,
  isPairItem
} from '../utils/pairOfferCalculator.js';
import { calculateDeliveryCharge } from '../utils/deliveryCalculator.js';
import { normalizeOrderPayload } from '../controllers/orders.controller.js';

test('1. Currency math & rounding helper works with 2 decimal precision without floating point errors', () => {
  assert.equal(roundCurrency(1800 * 0.20), 360);
  assert.equal(roundCurrency(2400 * 0.25), 600);
  assert.equal(roundCurrency(2900 * 0.25), 725);
  assert.equal(roundCurrency(0.1 + 0.2), 0.3);
});

test('2. SINGLE PRODUCT ONLY — Main Product alone (0 suggested items): standard single-product pricing', () => {
  const items = [
    { id: '1', name: 'Main Tuxedo Suit', price: 640, originalPrice: 1000, quantity: 1, isPairOffer: false }
  ];
  const result = calculatePairOffers({ items });
  assert.equal(result.isPairOfferActive, false);
  assert.equal(result.isMultiOfferActive, false);
  assert.equal(result.distinctPairProductCount, 0);
  assert.equal(result.pairWellWithDiscount, 0);
  assert.equal(result.subtotal, 640);
  assert.equal(result.normalizedItems[0].unit_price, 640);
});

test('3. MAIN PRODUCT + ONE SUGGESTED PRODUCT — Combined MRP calculation with configured %', () => {
  // Main Product MRP = ₹1,000
  // Suggested Product B MRP = ₹800, Admin offer = 20%
  // Total Bundle MRP = 1,000 + 800 = 1,800
  // Discount = 1,800 * 20 / 100 = 360
  // Subtotal = 1,800 - 360 = 1,440 (Main = 800, Pair = 640)
  const items = [
    { id: '1', name: 'Main Product', price: 640, originalPrice: 1000, quantity: 1, isPairOffer: false },
    { 
      id: '2', 
      name: 'Suggested Product B', 
      price: 800, 
      originalPrice: 800, 
      quantity: 1, 
      isPairOffer: true, 
      pairOffer: { enabled: true, discount_percent: 20 } 
    }
  ];
  const result = calculatePairOffers({ items });
  assert.equal(result.isPairOfferActive, true);
  assert.equal(result.isMultiOfferActive, false);
  assert.equal(result.distinctPairProductCount, 1);
  assert.equal(result.pairWellWithMrpTotal, 1800); // 1,000 + 800
  assert.equal(result.pairWellWithDiscount, 360); // 1,800 * 0.20
  assert.equal(result.subtotal, 1440); // 1,800 - 360
  assert.equal(result.normalizedItems[0].unit_price, 800); // 1,000 - 20%
  assert.equal(result.normalizedItems[1].unit_price, 640); // 800 - 20%
});

test('4. MAIN PRODUCT + TWO SUGGESTED PRODUCTS — 25% default on combined MRP + Free Delivery', () => {
  // Main Product MRP = ₹1,000
  // Suggested Product B MRP = ₹800
  // Suggested Product C MRP = ₹600
  // Total Combined MRP = 1,000 + 800 + 600 = 2,400
  // 25% discount = 2,400 * 0.25 = 600
  // Subtotal = 2,400 - 600 = 1,800 (Main = 750, Pair B = 600, Pair C = 450)
  const items = [
    { id: '1', name: 'Main Product', price: 640, originalPrice: 1000, quantity: 1, isPairOffer: false },
    { id: '2', name: 'Suggested Product B', price: 800, originalPrice: 800, quantity: 1, isPairOffer: true },
    { id: '3', name: 'Suggested Product C', price: 600, originalPrice: 600, quantity: 1, isPairOffer: true }
  ];
  const result = calculatePairOffers({ items });
  assert.equal(result.isPairOfferActive, true);
  assert.equal(result.isMultiOfferActive, true);
  assert.equal(result.distinctPairProductCount, 2);
  assert.equal(result.pairWellWithMrpTotal, 2400); // 1000 + 800 + 600
  assert.equal(result.pairWellWithDiscount, 600); // 2400 * 0.25
  assert.equal(result.subtotal, 1800); // 2400 - 600
  assert.equal(result.isFreeDeliveryEligible, true);
  assert.equal(result.normalizedItems[0].unit_price, 750); // 1,000 - 25%
  assert.equal(result.normalizedItems[1].unit_price, 600); // 800 - 25%
  assert.equal(result.normalizedItems[2].unit_price, 450); // 600 - 25%
});

test('5. MAIN PRODUCT + THREE SUGGESTED PRODUCTS — Combined MRP @ 25% OFF', () => {
  // Main Product MRP = ₹1,000
  // Suggested A MRP = ₹800, Suggested B MRP = ₹600, Suggested C MRP = ₹500
  // Total Combined MRP = 1,000 + 800 + 600 + 500 = 2,900
  // 25% discount = 2,900 * 0.25 = 725
  // Subtotal = 2,900 - 725 = 2,175
  const items = [
    { id: '1', name: 'Main Product', price: 640, originalPrice: 1000, quantity: 1, isPairOffer: false },
    { id: '2', name: 'Suggested Product A', price: 800, originalPrice: 800, quantity: 1, isPairOffer: true },
    { id: '3', name: 'Suggested Product B', price: 600, originalPrice: 600, quantity: 1, isPairOffer: true },
    { id: '4', name: 'Suggested Product C', price: 500, originalPrice: 500, quantity: 1, isPairOffer: true }
  ];
  const result = calculatePairOffers({ items });
  assert.equal(result.distinctPairProductCount, 3);
  assert.equal(result.isMultiOfferActive, true);
  assert.equal(result.pairWellWithMrpTotal, 2900); // 1000 + 800 + 600 + 500
  assert.equal(result.pairWellWithDiscount, 725); // 2900 * 0.25
  assert.equal(result.subtotal, 2175); // 2900 - 725
});

test('6. Quantity handling on Main and Suggested items', () => {
  // Main Product MRP = ₹1,000 x 1 = ₹1,000
  // Pair A MRP = ₹800 x 2 = ₹1,600
  // Pair B MRP = ₹600 x 1 = ₹600
  // Total Combined MRP = 1,000 + 1,600 + 600 = 3,200
  // 25% = 3,200 * 0.25 = 800
  // Final = 3,200 - 800 = 2,400
  const items = [
    { id: '1', name: 'Main Product', price: 640, originalPrice: 1000, quantity: 1, isPairOffer: false },
    { id: '2', name: 'Pair A', price: 800, originalPrice: 800, quantity: 2, isPairOffer: true },
    { id: '3', name: 'Pair B', price: 600, originalPrice: 600, quantity: 1, isPairOffer: true }
  ];
  const result = calculatePairOffers({ items });
  assert.equal(result.distinctPairProductCount, 2);
  assert.equal(result.isMultiOfferActive, true);
  assert.equal(result.pairWellWithMrpTotal, 3200);
  assert.equal(result.pairWellWithDiscount, 800);
  assert.equal(result.subtotal, 2400);
});

test('7. Free Delivery Activation when 2+ suggested products are in cart', () => {
  const items = [
    { id: '1', name: 'Main Product', price: 640, originalPrice: 1000, quantity: 1, isPairOffer: false },
    { id: '2', name: 'Pair B', price: 800, originalPrice: 800, quantity: 1, isPairOffer: true },
    { id: '3', name: 'Pair C', price: 600, originalPrice: 600, quantity: 1, isPairOffer: true }
  ];
  const pairCalc = calculatePairOffers({ items });
  assert.equal(pairCalc.isMultiOfferActive, true);

  const deliveryResult = calculateDeliveryCharge({
    cartItems: pairCalc.normalizedItems,
    subtotal: pairCalc.subtotal,
    pincode: '600001',
    isMultiPairOfferActive: pairCalc.isMultiOfferActive
  });

  assert.equal(deliveryResult.shippingFee, 0);
  assert.equal(deliveryResult.method, 'pair_offer_free');
});

test('8. Backend normalizeOrderPayload authoritative combined MRP calculation & Free Delivery', async () => {
  const payload = {
    items: [
      { id: 101, name: 'Main Tuxedo', price: 640, originalPrice: 1000, quantity: 1, isPairOffer: false },
      { id: 102, name: 'Silk Bowtie B', price: 800, originalPrice: 800, quantity: 1, isPairOffer: true },
      { id: 103, name: 'Cufflinks C', price: 600, originalPrice: 600, quantity: 1, isPairOffer: true }
    ],
    shippingAddress: { fullName: 'John Doe', email: 'john@example.com', phone: '9876543210', pincode: '600001' }
  };

  const normalized = await normalizeOrderPayload(payload);
  assert.equal(normalized.subtotal, 1800); // (1000 + 800 + 600) * 0.75 = 1800
  assert.equal(normalized.shipping_fee, 0); // FREE DELIVERY
  assert.equal(normalized.total, 1800);
  assert.equal(normalized.orderItems.length, 3);
  assert.equal(normalized.orderItems[0].unit_price, 750); // 1000 - 25% = 750
  assert.equal(normalized.orderItems[1].unit_price, 600); // 800 - 25% = 600
  assert.equal(normalized.orderItems[2].unit_price, 450); // 600 - 25% = 450
});
