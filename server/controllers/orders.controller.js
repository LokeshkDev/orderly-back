import db from '../models/index.js';
import { Op } from 'sequelize';
import { sendOrderEmail } from '../utils/emailService.js';
import { 
  calculateDeliveryCharge, 
  buildCourierTrackingUrl, 
  DEFAULT_DELIVERY_SETTINGS, 
  DEFAULT_COURIER_SETTINGS 
} from '../utils/deliveryCalculator.js';
import { 
  calculatePairOffers, 
  DEFAULT_PAIR_OFFER_SETTINGS, 
  roundCurrency 
} from '../utils/pairOfferCalculator.js';
import { DEFAULT_EMAIL_SETTINGS } from './settings.controller.js';
import Product from '../models/Product.js';

const { Order, OrderItem, Customer, SiteSetting } = db;

export let RUNTIME_ORDERS = [];

export const addRuntimeOrder = (orderObj) => {
  if (!orderObj) return;
  const idx = RUNTIME_ORDERS.findIndex(o => 
    String(o.id) === String(orderObj.id) || (o.order_number && o.order_number === orderObj.order_number)
  );
  if (idx >= 0) {
    RUNTIME_ORDERS[idx] = { ...RUNTIME_ORDERS[idx], ...orderObj };
  } else {
    RUNTIME_ORDERS.unshift(orderObj);
  }
};

const getParsedSettings = async () => {
  try {
    const rows = await SiteSetting.findAll();
    const settings = {};
    rows.forEach(r => {
      if (r.setting_type === 'json' && typeof r.setting_value === 'string') {
        try { settings[r.setting_key] = JSON.parse(r.setting_value); } catch (e) { settings[r.setting_key] = r.setting_value; }
      } else if (r.setting_type === 'boolean') {
        settings[r.setting_key] = r.setting_value === 'true' || r.setting_value === true;
      } else {
        settings[r.setting_key] = r.setting_value;
      }
    });
    const pairSettings = {
      enabled: settings.pair_offer_enabled !== 'false' && settings.pair_offer_enabled !== false,
      discount_percent: Number(settings.pair_offer_discount_percent ?? DEFAULT_PAIR_OFFER_SETTINGS.discount_percent),
      min_distinct_products: Number(settings.pair_offer_min_products ?? DEFAULT_PAIR_OFFER_SETTINGS.min_distinct_products)
    };
    return {
      delivery_settings: settings.delivery_settings || DEFAULT_DELIVERY_SETTINGS,
      courier_settings: settings.courier_settings || DEFAULT_COURIER_SETTINGS,
      email_settings: settings.email_settings || DEFAULT_EMAIL_SETTINGS,
      pair_settings: pairSettings,
      raw: settings
    };
  } catch (err) {
    return {
      delivery_settings: DEFAULT_DELIVERY_SETTINGS,
      courier_settings: DEFAULT_COURIER_SETTINGS,
      email_settings: DEFAULT_EMAIL_SETTINGS,
      pair_settings: DEFAULT_PAIR_OFFER_SETTINGS,
      raw: {}
    };
  }
};

const normalizeOrder = (o) => {
  const row = o && typeof o.toJSON === 'function' ? o.toJSON() : (o || {});
  const orderItems = row.items || row.OrderItems || [];
  return {
    ...row,
    id: row.id,
    order_number: row.order_number,
    status: row.status || 'pending',
    subtotal: Number(row.subtotal ?? row.total ?? 0),
    discount: Number(row.discount || 0),
    shipping_fee: Number(row.shipping_fee || row.shippingFee || 0),
    shippingFee: Number(row.shipping_fee || row.shippingFee || 0),
    total: Number(row.total || 0),
    delivery_method: row.delivery_method || null,
    delivery_location_label: row.delivery_location_label || null,
    courier_name: row.courier_name || null,
    tracking_number: row.tracking_number || null,
    tracking_url: row.tracking_url || null,
    shipped_at: row.shipped_at || null,
    delivered_at: row.delivered_at || null,
    new_order_email_sent: Boolean(row.new_order_email_sent),
    shipped_email_sent: Boolean(row.shipped_email_sent),
    delivered_email_sent: Boolean(row.delivered_email_sent),
    items: Array.isArray(orderItems) ? orderItems.map(item => ({
      ...item,
      id: item.id || item.order_item_id || null,
      name: item.name || item.product_name || item.productName || 'Product',
      productId: item.productId || item.product_id || null,
      product_id: item.productId || item.product_id || null,
      selectedSize: item.selectedSize || item.size || null,
      size: item.selectedSize || item.size || null,
      selectedColor: item.selectedColor || item.color || null,
      color: item.selectedColor || item.color || null,
      quantity: Number(item.quantity || 1),
      price: Number(item.price ?? item.unit_price ?? item.amount ?? 0),
      unit_price: Number(item.unit_price ?? item.price ?? item.amount ?? 0),
      originalPrice: Number(item.originalPrice ?? item.original_price ?? item.price ?? item.unit_price ?? 0),
      pairOffer: item.pairOffer || null,
      isPairOffer: Boolean(item.isPairOffer || item.pairOffer?.enabled)
    })) : [],
    shippingAddress: row.shippingAddress || row.shipping_address || null,
    shipping_address: row.shippingAddress || row.shipping_address || null,
    billingAddress: row.billingAddress || row.billing_address || null,
    pricingBreakdown: row.pricingBreakdown || row.pricing_breakdown || null,
    paymentAmount: row.paymentAmount || row.payment_amount || null,
    codAdvancePercentage: row.codAdvancePercentage || row.cod_advance_percentage || null,
    codAdvanceAmount: row.codAdvanceAmount || row.cod_advance_amount || null,
    codDueAmount: row.codDueAmount || row.cod_due_amount || null,
    email: row.email || row.shipping_address?.email || row.shippingAddress?.email || row.Customer?.email || '',
    phone: row.phone || row.shipping_address?.phone || row.shippingAddress?.phone || row.Customer?.phone || '',
    customer_name: row.customer_name || row.Customer?.name || row.shippingAddress?.fullName || row.shipping_address?.fullName || 'Guest Customer'
  };
};

export const normalizeOrderPayload = async (payload = {}) => {
  const {
    items = [],
    shippingAddress = {},
    subtotal: clientSubtotal,
    discount = 0,
    shippingFee: clientShippingFee,
    shipping_fee: clientShipping_fee,
    total: clientTotal,
    paymentMethod = payload.paymentMethod || payload.payment_method || 'online',
    status = 'pending',
    pricingBreakdown = null,
    pricing_breakdown = null,
    paymentAmount = null,
    codAdvancePercentage = null,
    codAdvanceAmount = null,
    codDueAmount = null,
    order_number,
    customer_id = null,
    payment_gateway = 'razorpay'
  } = payload;

  const { delivery_settings, pair_settings, raw } = await getParsedSettings();

  const normalizedPaymentMethod = ['cod', 'online', 'card', 'upi'].includes(String(paymentMethod).toLowerCase())
    ? String(paymentMethod).toLowerCase()
    : 'online';

  const normalizedStatus = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].includes(String(status).toLowerCase())
    ? String(status).toLowerCase()
    : 'pending';

  // Authoritatively compute and validate item pricing & multi-product pair offers
  const pairCalc = calculatePairOffers({
    items: Array.isArray(items) ? items : [],
    pairSettings: pair_settings || DEFAULT_PAIR_OFFER_SETTINGS
  });

  const normalizedItems = pairCalc.normalizedItems.map((item, index) => ({
    product_id: item.productId ?? item.product_id ?? item.id ?? null,
    combo_id: item.comboId ?? item.combo_id ?? null,
    product_name: item.name || item.product_name || item.productName || `Item ${index + 1}`,
    size: item.selectedSize || item.size || null,
    color: item.selectedColor || item.color || null,
    quantity: Math.max(1, Number(item.quantity || 1)),
    unit_price: roundCurrency(item.unit_price ?? item.price ?? 0),
    original_price: roundCurrency(item.original_price ?? item.originalPrice ?? item.price ?? 0),
    is_pair_offer: Boolean(item.isPairOffer),
    line_total: roundCurrency(item.line_total ?? (Number(item.unit_price ?? item.price ?? 0) * Number(item.quantity || 1)))
  }));

  const effectiveSubtotal = pairCalc.subtotal > 0 ? pairCalc.subtotal : Number(clientSubtotal || 0);

  // Authoritative Backend Delivery Calculation
  const deliveryResult = calculateDeliveryCharge({
    cartItems: normalizedItems,
    subtotal: effectiveSubtotal,
    pincode: shippingAddress?.pincode || '',
    deliverySettings: delivery_settings,
    legacySettings: raw,
    isMultiPairOfferActive: pairCalc.isMultiOfferActive
  });

  const numericDiscount = Math.max(0, Number(discount || 0));
  const authoritativeShippingFee = Number(deliveryResult.shippingFee || 0);
  const computedGrandTotal = Math.max(0, roundCurrency(effectiveSubtotal + authoritativeShippingFee - numericDiscount));

  const authoritativePricingBreakdown = {
    mainProductsSubtotal: pairCalc.mainProductsSubtotal,
    pairWellWithMrpTotal: pairCalc.pairWellWithMrpTotal,
    pairWellWithSubtotal: pairCalc.pairWellWithSubtotal,
    pairWellWithDiscount: pairCalc.pairWellWithDiscount,
    pairWellWithTotal: pairCalc.pairWellWithTotal,
    pairOfferSavings: pairCalc.pairOfferSavings,
    isMultiPairOfferActive: pairCalc.isMultiOfferActive,
    distinctPairProductCount: pairCalc.distinctPairProductCount,
    originalSubtotal: pairCalc.originalSubtotal,
    subtotal: effectiveSubtotal,
    discount: numericDiscount,
    shippingCost: authoritativeShippingFee,
    total: computedGrandTotal,
    deliveryMethod: deliveryResult.method,
    deliveryExplanation: deliveryResult.explanation
  };

  return {
    customer_id: customer_id ?? null,
    order_number: order_number || `ORD-${Date.now().toString().slice(-8)}`,
    status: normalizedStatus,
    subtotal: effectiveSubtotal,
    mainProductsSubtotal: pairCalc.mainProductsSubtotal,
    pairWellWithSubtotal: pairCalc.pairWellWithSubtotal,
    pairWellWithDiscount: pairCalc.pairWellWithDiscount,
    pairWellWithTotal: pairCalc.pairWellWithTotal,
    pairOfferSavings: pairCalc.pairOfferSavings,
    discount: numericDiscount,
    pricing_breakdown: authoritativePricingBreakdown,
    pricingBreakdown: authoritativePricingBreakdown,
    shipping_fee: authoritativeShippingFee,
    delivery_method: deliveryResult.method,
    delivery_location_label: deliveryResult.locationLabel || null,
    total: computedGrandTotal,
    shipping_address: shippingAddress || {},
    billing_address: shippingAddress || {},
    payment_method: normalizedPaymentMethod,
    payment_status: 'pending',
    payment_gateway: payment_gateway || 'razorpay',
    payment_amount: paymentAmount ?? null,
    cod_advance_percentage: codAdvancePercentage ?? null,
    cod_advance_amount: codAdvanceAmount ?? null,
    cod_due_amount: codDueAmount ?? null,
    orderItems: normalizedItems,
    deliveryResult
  };
};

export const createOrder = async (req, res) => {
  try {
    const normalizedOrder = await normalizeOrderPayload(req.body);
    const { orderItems, deliveryResult, ...orderFields } = normalizedOrder;

    // Validate minimum order requirement if price-based is active
    if (deliveryResult?.isBelowMinOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${deliveryResult.minOrderAmount} is required for delivery.`
      });
    }

    const { email_settings, courier_settings } = await getParsedSettings();

    let order;
    try {
      order = await Order.create(orderFields);
      if (order?.id && orderItems.length) {
        await OrderItem.bulkCreate(orderItems.map((item) => ({
          ...item,
          order_id: order.id
        })));
      }
    } catch (err) {
      console.warn('Order create note:', err.message);
    }

    const shippingAddress = req.body.shippingAddress || {};
    const customerFullName = shippingAddress.fullName || `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 'Valued Customer';

    const createdRecord = order
      ? normalizeOrder({
          ...order.toJSON(),
          items: orderItems.map((item) => ({
            ...item,
            name: item.product_name,
            selectedSize: item.size,
            selectedColor: item.color,
            price: item.unit_price,
            quantity: item.quantity,
            productId: item.product_id,
            product_id: item.product_id
          }))
        })
      : {
          id: Date.now(),
          order_number: normalizedOrder.order_number,
          customer_name: customerFullName,
          email: shippingAddress.email || '',
          phone: shippingAddress.phone || '',
          subtotal: normalizedOrder.subtotal,
          discount: normalizedOrder.discount,
          shipping_fee: normalizedOrder.shipping_fee,
          total: normalizedOrder.total,
          delivery_method: normalizedOrder.delivery_method,
          delivery_location_label: normalizedOrder.delivery_location_label,
          status: normalizedOrder.status || 'pending',
          items: orderItems.map(item => ({
            name: item.product_name,
            selectedSize: item.size,
            selectedColor: item.color,
            quantity: item.quantity,
            price: item.unit_price,
            productId: item.product_id
          })),
          shippingAddress: shippingAddress,
          pricingBreakdown: normalizedOrder.pricing_breakdown,
          payment_method: normalizedOrder.payment_method,
          payment_status: 'pending',
          payment_gateway: normalizedOrder.payment_gateway,
          payment_amount: normalizedOrder.payment_amount,
          cod_advance_percentage: normalizedOrder.cod_advance_percentage,
          cod_advance_amount: normalizedOrder.cod_advance_amount,
          cod_due_amount: normalizedOrder.cod_due_amount,
          created_at: new Date().toISOString()
        };

    addRuntimeOrder(createdRecord);

    // Send New Order Confirmation Email
    try {
      if (email_settings?.new_order?.enabled !== false) {
        await sendOrderEmail({
          orderNumber: createdRecord.order_number,
          customerName: customerFullName,
          customerEmail: createdRecord.email || shippingAddress.email || '',
          adminEmail: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@orderly.com',
          status: 'pending',
          type: 'order_placed',
          paymentStatus: normalizedOrder.payment_method === 'cod' ? 'pending' : 'pending',
          paymentMethod: normalizedOrder.payment_method,
          subtotal: Number(createdRecord.subtotal || 0),
          discount: Number(createdRecord.discount || 0),
          deliveryCharge: Number(createdRecord.shipping_fee || 0),
          amount: Number(createdRecord.total || 0),
          items: createdRecord.items,
          shippingAddress: shippingAddress,
          emailSettings: email_settings,
          courierSettings: courier_settings
        });

        if (order) {
          try { await order.update({ new_order_email_sent: true }); } catch (e) {}
        }
        createdRecord.new_order_email_sent = true;
      }
    } catch (emailError) {
      console.warn('Order placement email note:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    let orders = [];
    try {
      orders = await Order.findAll({
        where: { customer_id: req.customer?.id || null },
        include: [{ model: OrderItem, as: 'items', required: false }]
      });
      if (Array.isArray(orders)) {
        orders = orders.map(normalizeOrder);
      }
    } catch (err) {}

    const map = new Map();
    [...RUNTIME_ORDERS, ...orders].forEach(o => {
      const key = o.order_number || o.id;
      if (key) map.set(String(key), o);
    });

    res.status(200).json({ success: true, data: Array.from(map.values()) });
  } catch (error) {
    res.status(200).json({ success: true, data: RUNTIME_ORDERS });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    let dbOrders = [];
    try {
      dbOrders = await Order.findAll({
        order: [['createdAt', 'DESC']],
        include: [
          { model: Customer, attributes: ['name', 'email'], required: false },
          { model: OrderItem, as: 'items', required: false }
        ]
      });
      if (Array.isArray(dbOrders)) {
        dbOrders = dbOrders.map(normalizeOrder);
      }
    } catch (err) {}

    const map = new Map();
    [...RUNTIME_ORDERS, ...dbOrders].forEach(o => {
      const key = o.order_number || o.id;
      if (key) map.set(String(key), o);
    });

    res.status(200).json({ success: true, data: Array.from(map.values()) });
  } catch (error) {
    res.status(200).json({ success: true, data: RUNTIME_ORDERS });
  }
};

export const getOrders = getAllOrders;

export const getOrderById = async (req, res) => {
  try {
    const id = req.params.id;
    const runtimeFound = RUNTIME_ORDERS.find(o => String(o.id) === String(id) || o.order_number === id);
    if (runtimeFound) return res.status(200).json({ success: true, data: normalizeOrder(runtimeFound) });

    let order;
    try {
      order = await Order.findOne({
        where: { [Op.or]: [{ id }, { order_number: id }] },
        include: [{ model: OrderItem, as: 'items', required: false }]
      });
    } catch (err) {}

    res.status(200).json({ success: true, data: order ? normalizeOrder(order) : null });
  } catch (error) {
    res.status(200).json({ success: true, data: null });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, courier_name, tracking_number } = req.body;
    const orderId = req.params.id;
    if (!status) return res.status(400).json({ success: false, message: 'Status required' });

    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const lowerStatus = status.toLowerCase();

    const { courier_settings, email_settings } = await getParsedSettings();

    let dbOrder = null;
    try {
      dbOrder = await Order.findOne({
        where: { [Op.or]: [{ id: orderId }, { order_number: orderId }] },
        include: [{ model: OrderItem, as: 'items', required: false }]
      });
    } catch (err) {}

    let runtimeItem = RUNTIME_ORDERS.find(o => 
      String(o.id) === String(orderId) || 
      (o.order_number && String(o.order_number).toLowerCase() === String(orderId).toLowerCase())
    );

    const effectiveCourier = courier_name || dbOrder?.courier_name || runtimeItem?.courier_name || '';
    const effectiveTracking = tracking_number !== undefined ? tracking_number : (dbOrder?.tracking_number || runtimeItem?.tracking_number || '');
    const dynamicTrackingUrl = buildCourierTrackingUrl(effectiveCourier, effectiveTracking, courier_settings);

    const updateFields = {
      status: formattedStatus
    };

    if (effectiveCourier) updateFields.courier_name = effectiveCourier;
    if (effectiveTracking) updateFields.tracking_number = effectiveTracking;
    if (dynamicTrackingUrl) updateFields.tracking_url = dynamicTrackingUrl;

    if (lowerStatus === 'shipped') {
      updateFields.shipped_at = new Date();
    } else if (lowerStatus === 'delivered') {
      updateFields.delivered_at = new Date();
    }

    if (dbOrder) {
      try { await dbOrder.update(updateFields); } catch (e) {}
    }

    if (runtimeItem) {
      Object.assign(runtimeItem, updateFields);
    } else {
      runtimeItem = {
        id: orderId,
        order_number: String(orderId).startsWith('ORD-') ? orderId : `ORD-${orderId}`,
        ...updateFields,
        created_at: new Date().toISOString()
      };
      RUNTIME_ORDERS.unshift(runtimeItem);
    }

    const orderRecord = dbOrder ? normalizeOrder(dbOrder) : normalizeOrder(runtimeItem);

    // Check status-specific email trigger (deduplicated)
    if (lowerStatus === 'shipped') {
      const alreadySent = dbOrder ? dbOrder.shipped_email_sent : runtimeItem.shipped_email_sent;
      if (!alreadySent && email_settings?.order_shipped?.enabled !== false) {
        try {
          await sendOrderEmail({
            orderNumber: orderRecord.order_number,
            customerName: orderRecord.customer_name || 'Customer',
            customerEmail: orderRecord.email,
            adminEmail: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@orderly.com',
            status: 'Shipped',
            type: 'order_shipped',
            paymentStatus: orderRecord.payment_status || 'pending',
            paymentMethod: orderRecord.payment_method,
            subtotal: orderRecord.subtotal,
            discount: orderRecord.discount,
            deliveryCharge: orderRecord.shipping_fee,
            amount: orderRecord.total,
            items: orderRecord.items,
            shippingAddress: orderRecord.shippingAddress,
            courierName: effectiveCourier,
            trackingNumber: effectiveTracking,
            trackingUrl: dynamicTrackingUrl,
            shippedDate: new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' }),
            emailSettings: email_settings,
            courierSettings: courier_settings
          });

          if (dbOrder) {
            try { await dbOrder.update({ shipped_email_sent: true }); } catch (e) {}
          }
          runtimeItem.shipped_email_sent = true;
        } catch (emailError) {
          console.warn('Shipped email notification note:', emailError.message);
        }
      }
    } else if (lowerStatus === 'delivered') {
      const alreadySent = dbOrder ? dbOrder.delivered_email_sent : runtimeItem.delivered_email_sent;
      if (!alreadySent && email_settings?.order_delivered?.enabled !== false) {
        try {
          await sendOrderEmail({
            orderNumber: orderRecord.order_number,
            customerName: orderRecord.customer_name || 'Customer',
            customerEmail: orderRecord.email,
            adminEmail: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@orderly.com',
            status: 'Delivered',
            type: 'order_delivered',
            paymentStatus: orderRecord.payment_status || 'pending',
            paymentMethod: orderRecord.payment_method,
            subtotal: orderRecord.subtotal,
            discount: orderRecord.discount,
            deliveryCharge: orderRecord.shipping_fee,
            amount: orderRecord.total,
            items: orderRecord.items,
            shippingAddress: orderRecord.shippingAddress,
            deliveredDate: new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' }),
            emailSettings: email_settings,
            courierSettings: courier_settings
          });

          if (dbOrder) {
            try { await dbOrder.update({ delivered_email_sent: true }); } catch (e) {}
          }
          runtimeItem.delivered_email_sent = true;
        } catch (emailError) {
          console.warn('Delivered email notification note:', emailError.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Status updated',
      status: formattedStatus,
      tracking_url: dynamicTrackingUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTrackingNumber = async (req, res) => {
  try {
    const { tracking, tracking_number, courier_name } = req.body;
    const finalTracking = tracking_number !== undefined ? tracking_number : tracking;
    const orderId = req.params.id;

    const { courier_settings } = await getParsedSettings();
    const dynamicTrackingUrl = buildCourierTrackingUrl(courier_name, finalTracking, courier_settings);

    try {
      const order = await Order.findOne({
        where: { [Op.or]: [{ id: orderId }, { order_number: orderId }] }
      });
      if (order) {
        await order.update({
          tracking_number: finalTracking,
          courier_name: courier_name || order.courier_name,
          tracking_url: dynamicTrackingUrl
        });
      }
    } catch (err) {}

    let runtimeItem = RUNTIME_ORDERS.find(o => 
      String(o.id) === String(orderId) || 
      (o.order_number && String(o.order_number).toLowerCase() === String(orderId).toLowerCase())
    );

    if (runtimeItem) {
      runtimeItem.tracking_number = finalTracking;
      if (courier_name) runtimeItem.courier_name = courier_name;
      runtimeItem.tracking_url = dynamicTrackingUrl;
    }

    res.status(200).json({ 
      success: true, 
      message: 'Tracking updated', 
      tracking_url: dynamicTrackingUrl 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTracking = updateTrackingNumber;

export const updateOrder = async (req, res) => {
  try {
    const { 
      status, 
      total, 
      tracking_number, 
      courier_name, 
      shippingAddress, 
      customer_name, 
      email,
      shipping_fee,
      delivery_method 
    } = req.body;
    const orderId = req.params.id;

    const { courier_settings } = await getParsedSettings();
    const dynamicTrackingUrl = tracking_number ? buildCourierTrackingUrl(courier_name, tracking_number, courier_settings) : null;

    try {
      const order = await Order.findOne({
        where: { [Op.or]: [{ id: orderId }, { order_number: orderId }] }
      });
      if (order) {
        const updates = {};
        if (status) updates.status = status;
        if (total !== undefined) updates.total = total;
        if (shipping_fee !== undefined) updates.shipping_fee = shipping_fee;
        if (delivery_method) updates.delivery_method = delivery_method;
        if (tracking_number !== undefined) updates.tracking_number = tracking_number;
        if (courier_name !== undefined) updates.courier_name = courier_name;
        if (dynamicTrackingUrl) updates.tracking_url = dynamicTrackingUrl;
        if (shippingAddress) updates.shipping_address = shippingAddress;
        await order.update(updates);
      }
    } catch (err) {}

    const runtimeItem = RUNTIME_ORDERS.find(o => String(o.id) === String(orderId) || o.order_number === orderId);
    if (runtimeItem) {
      if (status) runtimeItem.status = status;
      if (total !== undefined) runtimeItem.total = total;
      if (shipping_fee !== undefined) runtimeItem.shipping_fee = shipping_fee;
      if (delivery_method) runtimeItem.delivery_method = delivery_method;
      if (tracking_number !== undefined) runtimeItem.tracking_number = tracking_number;
      if (courier_name !== undefined) runtimeItem.courier_name = courier_name;
      if (dynamicTrackingUrl) runtimeItem.tracking_url = dynamicTrackingUrl;
      if (shippingAddress) runtimeItem.shippingAddress = shippingAddress;
      if (customer_name) runtimeItem.customer_name = customer_name;
      if (email) runtimeItem.email = email;
    }

    res.status(200).json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    try {
      const order = await Order.findByPk(orderId);
      if (order) await order.destroy();
    } catch (err) {}

    RUNTIME_ORDERS = RUNTIME_ORDERS.filter(o => String(o.id) !== String(orderId) && o.order_number !== orderId);

    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
