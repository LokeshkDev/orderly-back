import db from '../models/index.js';

const { Coupon } = db;

export const validateCoupon = async (req, res) => {
  const { code, cartTotal } = req.body;
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

  const cartAmount = Number(cartTotal || 0);
  const minOrder = Number(coupon.min_order || 0);
  if (cartAmount < minOrder) {
    return res.status(400).json({
      success: false,
      message: `This coupon requires a minimum order of ₹${minOrder.toLocaleString('en-IN')}`
    });
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
      finalTotal: Math.max(0, cartAmount - Math.round(discount))
    }
  });
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