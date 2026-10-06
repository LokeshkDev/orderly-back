import test from 'node:test';
import assert from 'node:assert/strict';

import { buildOrderEmailPayload } from '../utils/emailService.js';

test('buildOrderEmailPayload includes customer and admin recipients and a clear subject', () => {
  const payload = buildOrderEmailPayload({
    orderNumber: 'ORD-123456',
    customerName: 'Ava',
    customerEmail: 'ava@example.com',
    adminEmail: 'admin@orderly.com',
    status: 'confirmed',
    type: 'order_placed',
    paymentStatus: 'paid',
    amount: 3499
  });

  assert.equal(payload.customer.to, 'ava@example.com');
  assert.equal(payload.admin.to, 'admin@orderly.com');
  assert.match(payload.customer.subject, /ORD-123456/);
  assert.match(payload.admin.subject, /ORD-123456/);
  assert.match(payload.customer.html, /orderlymenswear\.in\/logo\.png/);
  assert.match(payload.admin.html, /orderlymenswear\.in\/logo\.png/);
});

test('Failed order dispatches email to customer mail id with payment incomplete alert', () => {
  const payload = buildOrderEmailPayload({
    orderNumber: 'ORD-999888',
    customerName: 'Karthik',
    customerEmail: 'karthik@example.com',
    adminEmail: 'admin@orderly.com',
    status: 'failed',
    type: 'payment_failed',
    paymentStatus: 'failed',
    failReason: 'Card was declined by issuing bank',
    amount: 1325,
    items: [
      { name: 'Clubhouse Polo T-Shirt - Beige', quantity: 1, price: 795 },
      { name: 'Old-Money Tees Brown', quantity: 1, price: 480 }
    ],
    shippingAddress: {
      fullName: 'Karthik',
      email: 'karthik@example.com',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001'
    }
  });

  // Must send to customer's exact email address
  assert.equal(payload.customer.to, 'karthik@example.com', 'Customer email must be set to customer email id');
  assert.equal(payload.admin.to, 'admin@orderly.com', 'Admin email must be set');
  assert.match(payload.customer.subject, /Payment Incomplete for Order #ORD-999888/i);
  assert.match(payload.customer.html, /PAYMENT INCOMPLETE \/ FAILED/);
  assert.match(payload.customer.html, /Card was declined by issuing bank/);
  assert.match(payload.customer.html, /Retry Payment \/ Checkout/);
  assert.match(payload.customer.html, /orderlymenswear\.in\/logo\.png/);
});

test('Failed order recovers customer email from shippingAddress when customerEmail is omitted', () => {
  const payload = buildOrderEmailPayload({
    orderNumber: 'ORD-777666',
    status: 'failed',
    type: 'payment_failed',
    amount: 1599,
    shippingAddress: {
      fullName: 'Lokesh Kumar',
      email: 'lokeshk2492@gmail.com',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600041'
    }
  });

  assert.equal(payload.customer.to, 'lokeshk2492@gmail.com', 'Should resolve customer email from shippingAddress');
  assert.match(payload.customer.subject, /Payment Incomplete for Order #ORD-777666/i);
  assert.match(payload.customer.html, /Hello Lokesh Kumar/);
});

