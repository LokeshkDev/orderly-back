import crypto from 'crypto';
import https from 'https';
import { Op } from 'sequelize';
import db from '../models/index.js';
import { RUNTIME_ORDERS, addRuntimeOrder } from './orders.controller.js';
import { sendOrderEmail } from '../utils/emailService.js';

const { Order, SiteSetting } = db;

const DEFAULT_COD_ADVANCE_PERCENTAGE = 10;
const DEFAULT_CURRENCY = 'INR';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampPercentage = (value) => Math.min(100, Math.max(0, toNumber(value, DEFAULT_COD_ADVANCE_PERCENTAGE)));

const toPaise = (amount) => Math.round(toNumber(amount, 0) * 100);

const fromPaise = (amount) => Number((toNumber(amount, 0) / 100).toFixed(2));

const getSettingValue = async (key, fallback) => {
  try {
    const row = await SiteSetting.findOne({ where: { setting_key: key } });
    return row?.setting_value ?? fallback;
  } catch (error) {
    return fallback;
  }
};

const getCodAdvancePercentage = async () => {
  const configured = await getSettingValue('cod_advance_percentage', DEFAULT_COD_ADVANCE_PERCENTAGE);
  return clampPercentage(configured);
};

const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const currency = process.env.RAZORPAY_CURRENCY || DEFAULT_CURRENCY;

  if (!keyId || !keySecret) {
    const error = new Error('Razorpay keys are not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  return { keyId, keySecret, currency };
};

const findOrder = async (orderRef) => {
  if (!orderRef) return null;

  try {
    const orConditions = [{ order_number: String(orderRef) }];
    if (/^\d+$/.test(String(orderRef))) {
      orConditions.push({ id: Number(orderRef) });
    }

    const order = await Order.findOne({ where: { [Op.or]: orConditions } });
    if (order) return order;
  } catch (error) {}

  return RUNTIME_ORDERS.find((order) => (
    String(order.id) === String(orderRef) || String(order.order_number) === String(orderRef)
  )) || null;
};

const getPlainOrder = (order) => (
  order && typeof order.toJSON === 'function' ? order.toJSON() : (order || {})
);

const updateOrderPayment = async (order, updates) => {
  if (!order) return null;

  if (typeof order.update === 'function') {
    await order.update(updates);
    return getPlainOrder(order);
  }

  const updatedRuntimeOrder = { ...order, ...updates };
  addRuntimeOrder(updatedRuntimeOrder);
  return updatedRuntimeOrder;
};

const requestRazorpay = ({ path, method = 'POST', body, keyId, keySecret }) => (
  new Promise((resolve, reject) => {
    const payload = JSON.stringify(body || {});
    const request = https.request({
      hostname: 'api.razorpay.com',
      path,
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        let parsed = {};
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch (error) {
          parsed = { message: data };
        }

        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(parsed);
        } else {
          const error = new Error(parsed?.error?.description || parsed?.message || 'Razorpay request failed');
          error.statusCode = response.statusCode;
          error.details = parsed;
          reject(error);
        }
      });
    });

    request.on('error', reject);
    request.write(payload);
    request.end();
  })
);

const timingSafeCompare = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''), 'hex');
  const rightBuffer = Buffer.from(String(right || ''), 'hex');

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature, secret }) => {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return timingSafeCompare(expected, signature);
};

const buildPaymentBreakdown = async ({ order, paymentMethod }) => {
  const totalPaise = toPaise(order.total);
  const normalizedMethod = String(paymentMethod || order.payment_method || 'online').toLowerCase();
  const codAdvancePercentage = normalizedMethod === 'cod' ? await getCodAdvancePercentage() : 0;
  const amountPaise = normalizedMethod === 'cod'
    ? Math.round(totalPaise * (codAdvancePercentage / 100))
    : totalPaise;
  const codDuePaise = normalizedMethod === 'cod' ? Math.max(totalPaise - amountPaise, 0) : 0;

  return {
    paymentMethod: normalizedMethod,
    amountPaise,
    amount: fromPaise(amountPaise),
    codAdvancePercentage,
    codAdvanceAmount: fromPaise(amountPaise),
    codDueAmount: fromPaise(codDuePaise)
  };
};

export const getPaymentConfig = async (req, res) => {
  try {
    const codAdvancePercentage = await getCodAdvancePercentage();
    res.status(200).json({
      success: true,
      data: {
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
        currency: process.env.RAZORPAY_CURRENCY || DEFAULT_CURRENCY,
        codAdvancePercentage
      }
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      data: {
        razorpayKeyId: '',
        currency: DEFAULT_CURRENCY,
        codAdvancePercentage: DEFAULT_COD_ADVANCE_PERCENTAGE
      }
    });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { keyId, keySecret, currency } = getRazorpayConfig();
    const { orderId, orderNumber, paymentMethod } = req.body;
    const orderRef = orderId || orderNumber;
    const order = await findOrder(orderRef);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found for payment.' });
    }

    const plainOrder = getPlainOrder(order);
    const payment = await buildPaymentBreakdown({ order: plainOrder, paymentMethod });

    if (payment.amountPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    const receipt = String(plainOrder.order_number || `ORD-${Date.now()}`).slice(0, 40);
    const razorpayOrder = await requestRazorpay({
      path: '/v1/orders',
      keyId,
      keySecret,
      body: {
        amount: payment.amountPaise,
        currency,
        receipt,
        notes: {
          internal_order_id: String(plainOrder.id || ''),
          internal_order_number: String(plainOrder.order_number || ''),
          payment_method: payment.paymentMethod
        }
      }
    });

    const updates = {
      payment_method: payment.paymentMethod,
      payment_gateway: 'razorpay',
      payment_amount: payment.amount,
      cod_advance_percentage: payment.paymentMethod === 'cod' ? payment.codAdvancePercentage : null,
      cod_advance_amount: payment.paymentMethod === 'cod' ? payment.codAdvanceAmount : null,
      cod_due_amount: payment.paymentMethod === 'cod' ? payment.codDueAmount : null,
      razorpay_order_id: razorpayOrder.id
    };
    await updateOrderPayment(order, updates);

    res.status(200).json({
      success: true,
      data: {
        keyId,
        currency,
        orderId: plainOrder.id,
        orderNumber: plainOrder.order_number,
        razorpayOrderId: razorpayOrder.id,
        amount: payment.amountPaise,
        amountRupees: payment.amount,
        paymentMethod: payment.paymentMethod,
        codAdvancePercentage: payment.codAdvancePercentage,
        codAdvanceAmount: payment.codAdvanceAmount,
        codDueAmount: payment.codDueAmount
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { keySecret } = getRazorpayConfig();
    const {
      orderId,
      orderNumber,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const order = await findOrder(orderId || orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found for verification.' });
    }

    const plainOrder = getPlainOrder(order);
    if (plainOrder.razorpay_order_id && plainOrder.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Payment order mismatch.' });
    }

    const verified = verifyRazorpaySignature({
      orderId: plainOrder.razorpay_order_id || razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      secret: keySecret
    });

    if (!verified) {
      await updateOrderPayment(order, {
        payment_status: 'failed',
        razorpay_payment_id,
        razorpay_signature
      });

      try {
        await sendOrderEmail({
          orderNumber: order?.order_number || orderId || 'ORDER',
          customerName: order?.customer_name || order?.shippingAddress?.fullName || 'Customer',
          customerEmail: order?.email || order?.shippingAddress?.email || '',
          adminEmail: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@orderly.com',
          status: 'payment_failed',
          type: 'payment_failed',
          paymentStatus: 'failed',
          amount: order?.total || 0
        });
      } catch (emailError) {
        console.warn('Order payment failed email failed:', emailError.message);
      }

      return res.status(400).json({ success: false, message: 'Razorpay payment signature mismatch.' });
    }

    const paymentMethod = String(plainOrder.payment_method || 'online').toLowerCase();
    const paymentStatus = paymentMethod === 'cod' ? 'partially_paid' : 'paid';
    const updatedOrder = await updateOrderPayment(order, {
      status: 'confirmed',
      payment_status: paymentStatus,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paid_at: new Date()
    });

    try {
      await sendOrderEmail({
        orderNumber: updatedOrder?.order_number || order?.order_number || razorpay_order_id,
        customerName: updatedOrder?.customer_name || updatedOrder?.shippingAddress?.fullName || 'Customer',
        customerEmail: updatedOrder?.email || updatedOrder?.shippingAddress?.email || '',
        adminEmail: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@orderly.com',
        status: 'confirmed',
        type: 'payment_success',
        paymentStatus: paymentStatus,
        amount: updatedOrder?.total || updatedOrder?.payment_amount || 0
      });
    } catch (emailError) {
      console.warn('Order payment success email failed:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: paymentMethod === 'cod' ? 'COD advance payment verified.' : 'Payment verified.',
      data: updatedOrder
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(200).json({ success: true, message: 'Webhook secret not configured; skipped.' });
    }

    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {})));
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    if (!timingSafeCompare(expected, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    const paymentEntity = event?.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;

    if (razorpayOrderId && ['payment.captured', 'order.paid'].includes(event.event)) {
      const order = await Order.findOne({ where: { razorpay_order_id: razorpayOrderId } });
      if (order) {
        const paymentMethod = String(order.payment_method || 'online').toLowerCase();
        await updateOrderPayment(order, {
          status: 'confirmed',
          payment_status: paymentMethod === 'cod' ? 'partially_paid' : 'paid',
          razorpay_payment_id: paymentEntity?.id || order.razorpay_payment_id,
          paid_at: order.paid_at || new Date()
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
