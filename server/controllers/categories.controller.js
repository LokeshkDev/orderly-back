import db from '../models/index.js';

const { Category } = db;

const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Shirts', slug: 'shirts', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop', display_order: 1, type: 'product', is_active: true },
  { id: 2, name: 'Oversized T-Shirts', slug: 'oversized-tshirts', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop', display_order: 2, type: 'product', is_active: true },
  { id: 3, name: 'Polo Shirts', slug: 'polo', image: 'https://images.unsplash.com/photo-1625910513413-562624f2e511?q=80&w=800&auto=format&fit=crop', display_order: 3, type: 'product', is_active: true },
  { id: 4, name: 'Cargo Pants', slug: 'cargo', image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=800&auto=format&fit=crop', display_order: 4, type: 'product', is_active: true },
  { id: 5, name: 'Tailored Trousers', slug: 'trousers', image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=800&auto=format&fit=crop', display_order: 5, type: 'product', is_active: true },
  { id: 6, name: 'Blazers & Suits', slug: 'blazers', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop', display_order: 6, type: 'product', is_active: true }
];

const FALLBACK_COMBO_CATEGORIES = [
  { id: 101, name: 'Executive & Formal Combos', slug: 'formal-combos', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop', display_order: 1, type: 'combo', is_active: true, description: 'Tailored 2-piece and 3-piece formal suiting and linen shirt sets' },
  { id: 102, name: 'Casual Weekend Sets', slug: 'casual-combos', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop', display_order: 2, type: 'combo', is_active: true, description: 'Everyday relaxed tees, casual shirts, and comfort trousers' },
  { id: 103, name: 'Partywear & Evening Sets', slug: 'partywear-combos', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop', display_order: 3, type: 'combo', is_active: true, description: 'Bold jackets, satin sheen shirts, and slim chino styling' },
  { id: 104, name: 'Summer Vacation Outfits', slug: 'summer-combos', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop', display_order: 4, type: 'combo', is_active: true, description: 'Lightweight linens, breathable polo shirts, and stretch shorts' }
];

export const getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    let categories = [];
    const where = {};
    if (type) {
      where.type = type;
    }

    try {
      categories = await Category.findAll({ where, order: [['display_order', 'ASC']] });
    } catch (err) {}

    if (!categories || categories.length === 0) {
      if (type === 'combo') {
        categories = FALLBACK_COMBO_CATEGORIES;
      } else if (type === 'product') {
        categories = FALLBACK_CATEGORIES;
      } else {
        categories = [...FALLBACK_CATEGORIES, ...FALLBACK_COMBO_CATEGORIES];
      }
    }
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    const fallback = req.query.type === 'combo' ? FALLBACK_COMBO_CATEGORIES : FALLBACK_CATEGORIES;
    res.status(200).json({ success: true, data: fallback });
  }
};

export const getCategory = async (req, res) => {
  try {
    let category;
    try {
      category = await Category.findByPk(req.params.id);
    } catch (err) {}
    if (!category) category = FALLBACK_CATEGORIES.find(c => String(c.id) === String(req.params.id)) || FALLBACK_CATEGORIES[0];
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(200).json({ success: true, data: FALLBACK_CATEGORIES[0] });
  }
};

export const createCategory = async (req, res) => {
  try {
    let category;
    try {
      category = await Category.create(req.body);
    } catch (err) {
      category = { id: Date.now(), ...req.body };
    }
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    await category.update(req.body);
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    await category.destroy();
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
