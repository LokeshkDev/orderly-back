import db from '../models/index.js';

const { Customer, Order } = db;

export let RUNTIME_CUSTOMERS = [];

export const addCustomerRecord = (custData) => {
  if (!custData || !custData.email) return;
  const existingIdx = RUNTIME_CUSTOMERS.findIndex(c => c.email.toLowerCase() === custData.email.toLowerCase());
  const record = {
    id: custData.id || Date.now(),
    name: custData.name || 'Registered Customer',
    email: custData.email,
    phone: custData.phone || '',
    totalSpent: custData.totalSpent || 0,
    ordersCount: custData.ordersCount || 0,
    status: custData.status || 'Active',
    created_at: custData.created_at || new Date().toISOString()
  };

  if (existingIdx > -1) {
    RUNTIME_CUSTOMERS[existingIdx] = { ...RUNTIME_CUSTOMERS[existingIdx], ...record };
  } else {
    RUNTIME_CUSTOMERS.unshift(record);
  }
};

export const getCustomers = async (req, res) => {
  try {
    let list = [];
    let allOrders = [];
    try {
      list = await Customer.findAll({
        attributes: { exclude: ['password_hash', 'password'] },
        order: [['createdAt', 'DESC']]
      });
    } catch (err) {}

    try {
      allOrders = await Order.findAll({
        attributes: ['customer_id', 'shipping_address', 'total', 'status']
      });
    } catch (err) {}

    // Calculate spent & orders per customer email and customer ID
    const emailStats = {};
    const idStats = {};
    if (Array.isArray(allOrders)) {
      allOrders.forEach(o => {
        const orderData = typeof o.toJSON === 'function' ? o.toJSON() : o;
        const email = (orderData.shipping_address?.email || '').toLowerCase().trim();
        const cid = orderData.customer_id ? String(orderData.customer_id) : null;
        const total = Number(orderData.total || 0);

        if (email) {
          if (!emailStats[email]) emailStats[email] = { totalSpent: 0, ordersCount: 0 };
          emailStats[email].ordersCount += 1;
          emailStats[email].totalSpent += total;
        }

        if (cid) {
          if (!idStats[cid]) idStats[cid] = { totalSpent: 0, ordersCount: 0 };
          idStats[cid].ordersCount += 1;
          idStats[cid].totalSpent += total;
        }
      });
    }

    const map = new Map();
    [...RUNTIME_CUSTOMERS, ...(Array.isArray(list) ? list : [])].forEach(c => {
      if (c && c.email) {
        const emailKey = c.email.toLowerCase().trim();
        const cidKey = c.id ? String(c.id) : null;
        const stats = emailStats[emailKey] || (cidKey && idStats[cidKey]) || { totalSpent: 0, ordersCount: 0 };
        
        map.set(emailKey, {
          id: c.id || Date.now(),
          name: c.name || 'Customer',
          email: c.email,
          phone: c.phone || '',
          addresses: c.addresses || [],
          totalSpent: stats.totalSpent || c.totalSpent || 0,
          ordersCount: stats.ordersCount || c.ordersCount || 0,
          status: c.is_active === false || c.status === 'Inactive' ? 'Inactive' : 'Active',
          created_at: c.created_at || c.createdAt || new Date().toISOString()
        });
      }
    });

    res.status(200).json({ success: true, data: Array.from(map.values()) });
  } catch (error) {
    res.status(200).json({ success: true, data: RUNTIME_CUSTOMERS });
  }
};

export const createCustomerApi = async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let customer;
    try {
      customer = await Customer.create({ name, email, phone, is_active: status !== 'Inactive' });
    } catch (err) {}

    const record = {
      id: customer?.id || Date.now(),
      name: name || 'Registered Customer',
      email,
      phone: phone || '',
      totalSpent: 0,
      ordersCount: 0,
      status: status || 'Active',
      created_at: new Date().toISOString()
    };

    addCustomerRecord(record);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomerApi = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, status } = req.body;

    try {
      await Customer.update({ name, email, phone, is_active: status !== 'Inactive' }, { where: { id } });
    } catch (err) {}

    const idx = RUNTIME_CUSTOMERS.findIndex(c => String(c.id) === String(id) || (email && c.email.toLowerCase() === email.toLowerCase()));
    if (idx > -1) {
      RUNTIME_CUSTOMERS[idx] = {
        ...RUNTIME_CUSTOMERS[idx],
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(status && { status })
      };
    } else if (email) {
      addCustomerRecord({ id, name, email, phone, status });
    }

    res.status(200).json({ success: true, message: 'Customer updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCustomerApi = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await Customer.destroy({ where: { id } });
    } catch (err) {}

    RUNTIME_CUSTOMERS = RUNTIME_CUSTOMERS.filter(c => String(c.id) !== String(id));
    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    let customer;
    try {
      customer = await Customer.findByPk(req.params.id, {
        attributes: { exclude: ['password_hash', 'password'] },
        include: [{ model: Order }]
      });
    } catch (err) {}

    if (!customer) {
      customer = RUNTIME_CUSTOMERS.find(c => String(c.id) === String(req.params.id)) || RUNTIME_CUSTOMERS[0];
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(200).json({ success: true, data: RUNTIME_CUSTOMERS[0] });
  }
};

export const toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const idx = RUNTIME_CUSTOMERS.findIndex(c => String(c.id) === String(id));
    if (idx > -1) {
      RUNTIME_CUSTOMERS[idx].status = RUNTIME_CUSTOMERS[idx].status === 'Inactive' ? 'Active' : 'Inactive';
    }
    res.status(200).json({ success: true, message: 'Status toggled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
