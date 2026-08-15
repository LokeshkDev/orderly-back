import db from '../models/index.js';

const { Coupon } = db;

const COUPON_DEFAULTS = [
  {
    code: 'ORDERLY20',
    discount_type: 'percentage',
    discount_value: 20,
    min_order: 1999,
    max_discount: null,
    usage_limit: 500,
    is_active: true,
    show_on_pdp: true,
    show_on_checkout: true,
    description: 'Get extra 20% off on orders above ₹1,999',
    expires_at: null
  },
  {
    code: 'FESTIVE500',
    discount_type: 'fixed',
    discount_value: 500,
    min_order: 2999,
    max_discount: null,
    usage_limit: 200,
    is_active: true,
    show_on_pdp: true,
    show_on_checkout: true,
    description: 'Flat ₹500 off on orders above ₹2,999',
    expires_at: null
  },
  {
    code: 'WELCOME100',
    discount_type: 'fixed',
    discount_value: 300,
    min_order: 999,
    max_discount: null,
    usage_limit: 1000,
    is_active: true,
    show_on_pdp: true,
    show_on_checkout: true,
    description: '₹300 off your first order above ₹999',
    expires_at: null
  }
];

export const ensureCouponDefaults = async () => {
  try {
    const count = await Coupon.count();
    if (count > 0) return;
    for (const def of COUPON_DEFAULTS) {
      const existing = await Coupon.findOne({ where: { code: def.code } });
      if (!existing) {
        await Coupon.create(def);
      }
    }
  } catch (err) {}
};

export const validateCoupon = async (req, res) => {
  const { code, total, cartTotal } = req.body;
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) {
    return res.status(400).json({ success: false, message: 'Coupon code is required' });
  }

  let coupon = null;
  try {
    coupon = await Coupon.findOne({ where: { code: cleanCode } });
  } catch (err) {}

  if (!coupon || !coupon.is_active) {
    return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
  }

  const cartAmount = Number(total ?? cartTotal ?? 0);
  const minOrder = Number(coupon.min_order || 0);
  if (cartAmount < minOrder) {
    return res.status(400).json({
      success: false,
      message: `This coupon requires a minimum order of ₹${minOrder.toLocaleString('en-IN')}`
    });
  }

  if (Number(coupon.usage_limit || 0) > 0 && Number(coupon.used_count || 0) >= Number(coupon.usage_limit)) {
    return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
  }

  let discount = coupon.discount_type === 'percentage'
    ? (cartAmount * Number(coupon.discount_value || 0)) / 100
    : Number(coupon.discount_value || 0);
  if (coupon.max_discount && discount > Number(coupon.max_discount)) {
    discount = Number(coupon.max_discount);
  }
  discount = Math.min(discount, cartAmount);

  res.status(200).json({
    success: true,
    data: {
      code: coupon.code,
      discount: Math.round(discount),
      finalTotal: Math.max(0, cartAmount - Math.round(discount)),
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value || 0)
    }
  });
};

export const getActiveCoupons = async (req, res) => {
  try {
    let list = [];
    try {
      list = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    } catch (err) {}
    const now = new Date();
    const active = list.filter(c =>
      c.is_active &&
      (!c.expires_at || new Date(c.expires_at) >= now)
    );
    res.status(200).json({ success: true, data: active });
  } catch (error) {
    res.status(200).json({ success: true, data: [] });
  }
};

export const getCoupons = async (req, res) => {
  try {
    let list = [];
    try {
      list = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    } catch (err) {}
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(200).json({ success: true, data: [] });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await coupon.update(req.body);
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await coupon.destroy();
    res.status(200).json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await coupon.update({ is_active: !coupon.is_active });
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};