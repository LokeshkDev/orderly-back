import db from '../models/index.js';
import { Op } from 'sequelize';
import { sendOrderEmail } from '../utils/emailService.js';

const { Order, OrderItem, Customer } = db;
import Product from '../models/Product.js';

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

const normalizeOrder = (o) => {
  const row = o && typeof o.toJSON === 'function' ? o.toJSON() : (o || {});
  const orderItems = row.items || row.OrderItems || [];
  return {
    ...row,
    items: Array.isArray(orderItems) ? orderItems.map(item => ({
      ...item,
      id: item.id || item.order_item_id || null,
      name: item.name || item.product_name || item.productName || 'Product',
      productId: item.productId || item.product_id || item.productId || null,
      selectedSize: item.selectedSize || item.size || null,
      selectedColor: item.selectedColor || item.color || null,
      quantity: Number(item.quantity || 1),
      price: Number(item.price ?? item.unit_price ?? item.amount ?? 0),
      unit_price: Number(item.unit_price ?? item.price ?? item.amount ?? 0)
    })) : [],
    shippingAddress: row.shippingAddress || row.shipping_address || null,
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

export const normalizeOrderPayload = (payload = {}) => {
  const {
    items = [],
    shippingAddress,
    subtotal,
    discount = 0,
    shippingFee,
    shipping_fee = 0,
    total,
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

  const normalizedPaymentMethod = ['cod', 'online', 'card', 'upi'].includes(String(paymentMethod).toLowerCase())
    ? String(paymentMethod).toLowerCase()
    : 'online';

  const normalizedStatus = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].includes(String(status).toLowerCase())
    ? String(status).toLowerCase()
    : 'pending';

  const normalizedItems = Array.isArray(items) ? items.map((item, index) => {
    const productItem = item || {};
    return {
      product_id: productItem.productId ?? productItem.product_id ?? null,
      combo_id: productItem.comboId ?? productItem.combo_id ?? null,
      product_name: productItem.name || productItem.product_name || productItem.productName || `Item ${index + 1}`,
      size: productItem.selectedSize || productItem.size || null,
      color: productItem.selectedColor || productItem.color || null,
      quantity: Number(productItem.quantity || 1),
      unit_price: Number(productItem.price ?? productItem.unit_price ?? 0),
    };
  }) : [];

  return {
    customer_id: customer_id ?? null,
    order_number: order_number || `ORD-${Date.now().toString().slice(-8)}`,
    status: normalizedStatus,
    subtotal: Number(subtotal ?? total ?? 0),
    discount: Number(discount || 0),
    pricing_breakdown: pricingBreakdown || pricing_breakdown || null,
    shipping_fee: Number(shipping_fee || shippingFee || 0),
    total: Number(total || 0),
    shipping_address: shippingAddress || {},
    billing_address: shippingAddress || {},
    payment_method: normalizedPaymentMethod,
    payment_status: 'pending',
    payment_gateway: payment_gateway || 'razorpay',
    payment_amount: paymentAmount ?? null,
    cod_advance_percentage: codAdvancePercentage ?? null,
    cod_advance_amount: codAdvanceAmount ?? null,
    cod_due_amount: codDueAmount ?? null,
    orderItems: normalizedItems
  };
};

export const createOrder = async (req, res) => {
  try {
    const normalizedOrder = normalizeOrderPayload(req.body);
    const { orderItems, ...orderFields } = normalizedOrder;

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
          customer_name: req.body.shippingAddress ? `${req.body.shippingAddress.firstName} ${req.body.shippingAddress.lastName}` : 'Customer',
          email: req.body.shippingAddress?.email || '',
          phone: req.body.shippingAddress?.phone || '',
          total: Number(req.body.total || 0),
          status: normalizedOrder.status || 'pending',
          items: orderItems.map(item => ({
            name: item.product_name,
            selectedSize: item.size,
            selectedColor: item.color,
            quantity: item.quantity,
            price: item.unit_price,
            productId: item.product_id
          })),
          shippingAddress: req.body.shippingAddress || {},
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

    try {
      await sendOrderEmail({
        orderNumber: createdRecord.order_number,
        customerName: createdRecord.customer_name || (shippingAddress ? `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim() : 'Customer'),
        customerEmail: createdRecord.email || shippingAddress?.email || '',
        adminEmail: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@orderly.com',
        status: 'pending',
        type: 'order_placed',
        paymentStatus: normalizedOrder.payment_method === 'cod' ? 'pending' : 'pending',
        amount: Number(createdRecord.total || 0)
      });
    } catch (emailError) {
      console.warn('Order placement email failed:', emailError.message);
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
    const { status } = req.body;
    const orderId = req.params.id;
    if (!status) return res.status(400).json({ success: false, message: 'Status required' });

    // Standardize status format (Title Case e.g. "Confirmed", "Shipped", "Delivered")
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    try {
      const order = await Order.findOne({
        where: { [Op.or]: [{ id: orderId }, { order_number: orderId }] }
      });
      if (order) await order.update({ status: formattedStatus });
    } catch (err) {}

    let runtimeItem = RUNTIME_ORDERS.find(o => 
      String(o.id) === String(orderId) || 
      (o.order_number && String(o.order_number).toLowerCase() === String(orderId).toLowerCase())
    );

    if (runtimeItem) {
      runtimeItem.status = formattedStatus;
    } else {
      const newRecord = {
        id: orderId,
        order_number: String(orderId).startsWith('ORD-') ? orderId : `ORD-${orderId}`,
        status: formattedStatus,
        created_at: new Date().toISOString()
      };
      RUNTIME_ORDERS.unshift(newRecord);
    }

    try {
      const targetOrder = runtimeItem || { order_number: String(orderId).startsWith('ORD-') ? orderId : `ORD-${orderId}`, total: 0, customer_name: 'Customer', email: '' };
      await sendOrderEmail({
        orderNumber: targetOrder.order_number || orderId,
        customerName: targetOrder.customer_name || 'Customer',
        customerEmail: targetOrder.email || '',
        adminEmail: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@orderly.com',
        status: formattedStatus,
        type: 'status_update',
        paymentStatus: targetOrder.payment_status || 'pending',
        amount: Number(targetOrder.total || 0)
      });
    } catch (emailError) {
      console.warn('Order status email failed:', emailError.message);
    }

    res.status(200).json({ success: true, message: 'Status updated', status: formattedStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTrackingNumber = async (req, res) => {
  try {
    const { tracking, courier_name = 'Delhivery Express' } = req.body;
    const orderId = req.params.id;
    try {
      const order = await Order.findOne({
        where: { [Op.or]: [{ id: orderId }, { order_number: orderId }] }
      });
      if (order) await order.update({ tracking_number: tracking });
    } catch (err) {}

    let runtimeItem = RUNTIME_ORDERS.find(o => 
      String(o.id) === String(orderId) || 
      (o.order_number && String(o.order_number).toLowerCase() === String(orderId).toLowerCase())
    );

    if (runtimeItem) {
      runtimeItem.tracking_number = tracking;
      runtimeItem.courier_name = courier_name;
    }

    res.status(200).json({ success: true, message: 'Tracking updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTracking = updateTrackingNumber;

export const updateOrder = async (req, res) => {
  try {
    const { status, total, tracking_number, courier_name, shippingAddress, customer_name, email } = req.body;
    const orderId = req.params.id;
    try {
      const order = await Order.findOne({
        where: { [Op.or]: [{ id: orderId }, { order_number: orderId }] }
      });
      if (order) {
        await order.update({
          status: status || order.status,
          total: total !== undefined ? total : order.total,
          shipping_address: shippingAddress || order.shipping_address
        });
      }
    } catch (err) {}

    const runtimeItem = RUNTIME_ORDERS.find(o => String(o.id) === String(orderId) || o.order_number === orderId);
    if (runtimeItem) {
      if (status) runtimeItem.status = status;
      if (total !== undefined) runtimeItem.total = total;
      if (tracking_number) runtimeItem.tracking_number = tracking_number;
      if (courier_name) runtimeItem.courier_name = courier_name;
      if (shippingAddress) runtimeItem.shippingAddress = shippingAddress;
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
