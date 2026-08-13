import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeOrderPayload } from '../controllers/orders.controller.js';

test('normalizeOrderPayload keeps payment details and serializes cart items for DB storage', () => {
  const payload = normalizeOrderPayload({
    items: [{
      id: 12,
      productId: 34,
      name: 'Classic Shirt',
      quantity: 2,
      price: 1499,
      selectedSize: 'M',
      selectedColor: 'Navy',
      isCombo: false,
      pairOffer: null,
      isPairOffer: false
    }],
    shippingAddress: { firstName: 'Ava', lastName: 'Stone', email: 'ava@example.com', phone: '9999999999', address: '1 Main St', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
    subtotal: 2998,
    discount: 0,
    shippingFee: 0,
    total: 2998,
    paymentMethod: 'online',
    pricingBreakdown: { subtotal: 2998, discount: 0, shippingFee: 0, total: 2998 }
  });

  assert.equal(payload.payment_method, 'online');
  assert.equal(payload.payment_status, 'pending');
  assert.equal(payload.orderItems.length, 1);
  assert.equal(payload.orderItems[0].product_name, 'Classic Shirt');
  assert.equal(payload.orderItems[0].quantity, 2);
  assert.equal(payload.orderItems[0].unit_price, 1499);
});
