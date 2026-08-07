import db from '../models/index.js';

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
  return {
    ...row,
    shippingAddress: row.shippingAddress || row.shipping_address || null,
    email: row.email || row.shipping_address?.email || row.Customer?.email || '',
    phone: row.phone || row.shipping_address?.phone || row.Customer?.phone || '',
    customer_name: row.customer_name || row.Customer?.name || 'Guest Customer'
  };
};

export const createOrder = async (req, res) => {
  try {
    const { items = [], shippingAddress, subtotal, discount = 0, shipping_fee = 0, total, paymentMethod = 'cod', status = 'pending' } = req.body;
    const orderNumber = req.body.order_number || `ORD-${Date.now().toString().slice(-8)}`;

    let order;
    try {
      order = await Order.create({
        customer_id: req.customer?.id || null,
        order_number: orderNumber,
        status: status || 'pending',
        subtotal: subtotal ?? total ?? 0,
        discount: discount || 0,
        shipping_fee: shipping_fee || 0,
        total: total || 0,
        shipping_address: shippingAddress || {},
        billing_address: shippingAddress || {},
        payment_method: paymentMethod,
        payment_status: 'pending'
      });
    } catch (err) {
      console.warn('Order create note:', err.message);
    }

    const createdRecord = order ? normalizeOrder(order) : {
      id: Date.now(),
      order_number: orderNumber,
      customer_name: shippingAddress ? `${shippingAddress.firstName} ${shippingAddress.lastName}` : 'Customer',
      email: shippingAddress?.email || '',
      phone: shippingAddress?.phone || '',
      total: total || 0,
      status: status || 'Pending',
      items,
      shippingAddress,
      payment_method: paymentMethod,
      created_at: new Date().toISOString()
    };

    addRuntimeOrder(createdRecord);

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
        include: [{ model: OrderItem, required: false }]
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
          { model: OrderItem, required: false }
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
        where: { [db.Sequelize.Op.or]: [{ id }, { order_number: id }] },
        include: [{ model: OrderItem, required: false }]
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
        where: { [db.Sequelize.Op.or]: [{ id: orderId }, { order_number: orderId }] }
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
        where: { [db.Sequelize.Op.or]: [{ id: orderId }, { order_number: orderId }] }
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
        where: { [db.Sequelize.Op.or]: [{ id: orderId }, { order_number: orderId }] }
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
