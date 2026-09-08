import Combo from '../models/Combo.js';
import Product from '../models/Product.js';
import { Op } from 'sequelize';

const extractProductPrimaryImage = (p) => {
  if (!p) return null;
  if (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) {
    return typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url || p.images[0].image_url;
  }
  if (Array.isArray(p.colors) && p.colors[0] && Array.isArray(p.colors[0].images) && p.colors[0].images[0]) {
    const c0 = p.colors[0].images[0];
    return typeof c0 === 'string' ? c0 : c0.url || c0.image_url;
  }
  return null;
};

const syncComboPrimaryImages = async (combos) => {
  if (!combos) return combos;
  const isArray = Array.isArray(combos);
  const comboList = isArray ? combos : [combos];

  const productIds = new Set();
  comboList.forEach(c => {
    if (Array.isArray(c.items)) {
      c.items.forEach(it => {
        if (it && it.productId) productIds.add(String(it.productId));
      });
    }
  });

  if (productIds.size === 0) return combos;

  try {
    const products = await Product.findAll({
      where: {
        id: Array.from(productIds),
        deleted: false
      },
      attributes: ['id', 'name', 'images', 'colors']
    });

    const productMap = new Map();
    products.forEach(p => {
      productMap.set(String(p.id), extractProductPrimaryImage(p));
    });

    comboList.forEach(c => {
      if (Array.isArray(c.items) && c.items.length > 0) {
        const syncedPrimaryImages = [];
        c.items.forEach(it => {
          if (it && it.productId && productMap.has(String(it.productId))) {
            const livePrimary = productMap.get(String(it.productId));
            if (livePrimary) {
              it.primaryImage = livePrimary;
              syncedPrimaryImages.push(livePrimary);
            }
          } else if (it) {
            const fallback = it.primaryImage || it.images?.[0] || it.colors?.[0]?.images?.[0] || it.image;
            if (fallback) syncedPrimaryImages.push(fallback);
          }
        });
        if (syncedPrimaryImages.length > 0) {
          c.images = syncedPrimaryImages;
        }
      }
    });
  } catch (err) {
    console.warn('⚠️ Product image sync warning in combos:', err.message);
  }

  return combos;
};

export const getCombos = async (req, res) => {
  try {
    const { search, status, category, category_slug, includeDeleted } = req.query;
    const where = {};

    if (includeDeleted !== 'true') where.deleted = false;
    if (status) where.status = status;
    if (category) {
      where[Op.or] = [
        { category: category },
        { category_slug: category }
      ];
    }
    if (category_slug) {
      where.category_slug = category_slug;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { badge: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    const combos = await Combo.findAll({ where, order: [['createdAt', 'DESC']] });
    await syncComboPrimaryImages(combos);
    return res.json({ success: true, count: combos.length, data: combos });
  } catch (err) {
    console.warn('⚠️ Combos DB query warning:', err.message);
    return res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

export const getComboById = async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await Combo.findOne({
      where: {
        [Op.or]: [{ id }, { slug: id }],
        deleted: false
      }
    });

    if (!combo) {
      return res.status(404).json({ success: false, message: 'Combo not found', data: null });
    }

    await syncComboPrimaryImages(combo);
    return res.json({ success: true, data: combo });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const createCombo = async (req, res) => {
  try {
    const comboData = req.body;
    if (!comboData.id) {
      comboData.id = 'combo-' + Date.now();
    }
    if (!comboData.slug) {
      comboData.slug = comboData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    // Auto-derive combo images from child products if items provided
    if (Array.isArray(comboData.items) && comboData.items.length > 0) {
      const pImages = comboData.items
        .map(it => it.primaryImage || it.images?.[0] || it.colors?.[0]?.images?.[0] || it.image)
        .filter(Boolean);
      if (pImages.length > 0) {
        comboData.images = pImages;
      }
    }

    const authorName = req.headers['x-admin-name'] ? decodeURIComponent(req.headers['x-admin-name']) : 'Admin';
    comboData.last_updated_by = authorName;
    const combo = await Combo.create(comboData);
    await syncComboPrimaryImages(combo);
    return res.status(201).json({ success: true, data: combo });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await Combo.findByPk(id);
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });

    const updatePayload = { ...req.body };

    // Auto-derive combo images from child products if items provided
    if (Array.isArray(updatePayload.items) && updatePayload.items.length > 0) {
      const pImages = updatePayload.items
        .map(it => it.primaryImage || it.images?.[0] || it.colors?.[0]?.images?.[0] || it.image)
        .filter(Boolean);
      if (pImages.length > 0) {
        updatePayload.images = pImages;
      }
    }

    const authorName = req.headers['x-admin-name'] ? decodeURIComponent(req.headers['x-admin-name']) : 'Admin';
    updatePayload.last_updated_by = authorName;
    await combo.update(updatePayload);
    await syncComboPrimaryImages(combo);
    return res.json({ success: true, data: combo });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await Combo.findByPk(id);
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });

    await combo.update({ deleted: true });
    return res.json({ success: true, message: 'Combo deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
