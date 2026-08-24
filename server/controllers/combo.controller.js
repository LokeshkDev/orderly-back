import Combo from '../models/Combo.js';
import { Op } from 'sequelize';

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

    const authorName = req.headers['x-admin-name'] ? decodeURIComponent(req.headers['x-admin-name']) : 'Admin';
    comboData.last_updated_by = authorName;
    const combo = await Combo.create(comboData);
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

    const authorName = req.headers['x-admin-name'] ? decodeURIComponent(req.headers['x-admin-name']) : 'Admin';
    await combo.update({ ...req.body, last_updated_by: authorName });
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
