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
});
