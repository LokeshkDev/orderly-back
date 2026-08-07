import db from '../models/index.js';

const { Occasion } = db;

export const getOccasions = async (req, res) => {
  try {
    let list = [];
    try {
      list = await Occasion.findAll({ order: [['display_order', 'ASC'], ['createdAt', 'ASC']] });
    } catch (err) {}
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(200).json({ success: true, data: [] });
  }
};

export const getOccasion = async (req, res) => {
  try {
    let item;
    try {
      item = await Occasion.findByPk(req.params.id);
    } catch (err) {}
    res.status(200).json({ success: true, data: item || null });
  } catch (error) {
    res.status(200).json({ success: true, data: null });
  }
};

export const createOccasion = async (req, res) => {
  try {
    const occasion = await Occasion.create(req.body);
    res.status(201).json({ success: true, data: occasion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateOccasion = async (req, res) => {
  try {
    const occasion = await Occasion.findByPk(req.params.id);
    if (!occasion) return res.status(404).json({ success: false, message: 'Occasion not found' });
    await occasion.update(req.body);
    res.status(200).json({ success: true, data: occasion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteOccasion = async (req, res) => {
  try {
    const occasion = await Occasion.findByPk(req.params.id);
    if (!occasion) return res.status(404).json({ success: false, message: 'Occasion not found' });
    await occasion.destroy();
    res.status(200).json({ success: true, message: 'Occasion deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
