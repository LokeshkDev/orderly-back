import Combo from '../models/Combo.js';
import Product from '../models/Product.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';

let comboSchemaEnsured = false;
export const ensureComboColumnsExist = async () => {
  if (comboSchemaEnsured) return;
  const queries = [
    "ALTER TABLE `Combos` ADD COLUMN `cover_image` VARCHAR(255) NULL;",
    "ALTER TABLE `combos` ADD COLUMN `cover_image` VARCHAR(255) NULL;",
    "ALTER TABLE `Combos` ADD COLUMN `last_updated_by` VARCHAR(255) DEFAULT 'Super Admin';",
    "ALTER TABLE `combos` ADD COLUMN `last_updated_by` VARCHAR(255) DEFAULT 'Super Admin';",
    "ALTER TABLE `Combos` ADD COLUMN `deleted` TINYINT(1) DEFAULT 0;",
    "ALTER TABLE `combos` ADD COLUMN `deleted` TINYINT(1) DEFAULT 0;",
    "ALTER TABLE `Combos` ADD COLUMN `categories` JSON NULL;",
    "ALTER TABLE `combos` ADD COLUMN `categories` JSON NULL;",
    "ALTER TABLE `Combos` ADD COLUMN `category_slugs` JSON NULL;",
    "ALTER TABLE `combos` ADD COLUMN `category_slugs` JSON NULL;"
  ];
  for (const q of queries) {
    try {
      await sequelize.query(q);
    } catch (e) {}
  }
  comboSchemaEnsured = true;
};

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
      const syncedPrimaryImages = [];
      if (c.cover_image && typeof c.cover_image === 'string' && c.cover_image.trim()) {
        syncedPrimaryImages.push(c.cover_image.trim());
      }
      if (Array.isArray(c.items) && c.items.length > 0) {
        c.items.forEach(it => {
          if (it && it.productId && productMap.has(String(it.productId))) {
            const livePrimary = productMap.get(String(it.productId));
            if (livePrimary && !syncedPrimaryImages.includes(livePrimary)) {
              it.primaryImage = livePrimary;
              syncedPrimaryImages.push(livePrimary);
            }
          } else if (it) {
            const fallback = it.primaryImage || it.images?.[0] || it.colors?.[0]?.images?.[0] || it.image;
            if (fallback && !syncedPrimaryImages.includes(fallback)) syncedPrimaryImages.push(fallback);
          }
        });
      }
      if (syncedPrimaryImages.length > 0) {
        c.images = syncedPrimaryImages;
      }
    });
  } catch (err) {
    console.warn('⚠️ Product image sync warning in combos:', err.message);
  }

  return combos;
};

export const getCombos = async (req, res) => {
  try {
    await ensureComboColumnsExist();
    const { search, status, category, category_slug, subcategory, subcategory_slug, includeDeleted } = req.query;
    const andConditions = [];

    if (includeDeleted !== 'true') andConditions.push({ deleted: false });
    if (status) andConditions.push({ status });

    if (category) {
      andConditions.push({
        [Op.or]: [
          { category: category },
          { category_slug: category },
          { categories: { [Op.like]: `%"${category}"%` } },
          { category_slugs: { [Op.like]: `%"${category}"%` } }
        ]
      });
    }
    if (category_slug) {
      andConditions.push({
        [Op.or]: [
          { category_slug: category_slug },
          { category_slugs: { [Op.like]: `%"${category_slug}"%` } }
        ]
      });
    }
    if (subcategory) {
      andConditions.push({
        [Op.or]: [
          { subcategory: subcategory },
          { subcategory_slug: subcategory }
        ]
      });
    }
    if (subcategory_slug) {
      andConditions.push({ subcategory_slug });
    }

    if (search) {
      andConditions.push({
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { badge: { [Op.like]: `%${search}%` } },
          { category: { [Op.like]: `%${search}%` } }
        ]
      });
    }

    const where = andConditions.length > 0 ? { [Op.and]: andConditions } : {};
    const combos = await Combo.findAll({ where, order: [['createdAt', 'DESC']] });
    await syncComboPrimaryImages(combos);
    return res.json({ success: true, count: combos.length, data: combos });
  } catch (err) {
    // Retry once after forcing schema check if column was missing
    try {
      comboSchemaEnsured = false;
      await ensureComboColumnsExist();
      const { search, status, category, category_slug, subcategory, subcategory_slug, includeDeleted } = req.query;
      const where = {};
      if (includeDeleted !== 'true') where.deleted = false;
      if (status) where.status = status;
      if (category) where[Op.or] = [{ category }, { category_slug: category }];
      if (category_slug) where.category_slug = category_slug;
      if (subcategory) where[Op.or] = [{ subcategory }, { subcategory_slug: subcategory }];
      if (subcategory_slug) where.subcategory_slug = subcategory_slug;
      if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { badge: { [Op.like]: `%${search}%` } }, { category: { [Op.like]: `%${search}%` } }];
      const combos = await Combo.findAll({ where, order: [['createdAt', 'DESC']] });
      await syncComboPrimaryImages(combos);
      return res.json({ success: true, count: combos.length, data: combos });
    } catch (retryErr) {
      console.warn('⚠️ Combos DB query warning:', retryErr.message);
      return res.status(500).json({ success: false, message: retryErr.message, data: [] });
    }
  }
};

export const getComboById = async (req, res) => {
  try {
    await ensureComboColumnsExist();
    const { id } = req.params;
    let combo = await Combo.findOne({
      where: {
        [Op.or]: [{ id }, { slug: id }],
        deleted: false
      }
    });

    // Fallback: If not found, try matching cleaned slug prefix or name
    if (!combo && typeof id === 'string') {
      const cleanReq = id
        .replace(/\s*\(copy(?:\s*\d+)?\)\s*/gi, '')
        .replace(/(?:-copy(?:-\d+)?)+.*/gi, '')
        .replace(/-\d{10,}.*/g, '')
        .trim();
      if (cleanReq) {
        combo = await Combo.findOne({
          where: {
            slug: { [Op.like]: `${cleanReq}%` },
            deleted: false
          }
        });
      }
    }

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
    await ensureComboColumnsExist();
    const comboData = { ...req.body };
    if (!comboData.id) {
      comboData.id = 'combo-' + Date.now();
    }

    // Always generate a clean, readable SEO slug from combo name (never include copy/timestamps)
    const cleanBase = (comboData.name || 'combo')
      .toLowerCase()
      .replace(/\s*\(copy(?:\s*\d+)?\)\s*/gi, '')
      .replace(/(?:-copy(?:-\d+)?)+/gi, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'combo';

    let candidateSlug = cleanBase;
    let counter = 1;
    while (await Combo.findOne({ where: { slug: candidateSlug } })) {
      counter++;
      candidateSlug = `${cleanBase}-${counter}`;
    }
    comboData.slug = candidateSlug;

    // Auto-derive combo images from child products if items provided
    if (Array.isArray(comboData.items) && comboData.items.length > 0) {
      const pImages = comboData.items
        .map(it => it.primaryImage || it.images?.[0] || it.colors?.[0]?.images?.[0] || it.image)
        .filter(Boolean);
      if (pImages.length > 0) {
        comboData.images = pImages;
      }
    }

    // Normalize categories & category_slugs
    if (Array.isArray(comboData.categories) && comboData.categories.length > 0) {
      comboData.categories = comboData.categories.map(c => typeof c === 'string' ? c.trim() : c.name || c).filter(Boolean);
      if (!comboData.category || !comboData.categories.includes(comboData.category)) {
        comboData.category = comboData.categories[0];
      }
      if (!comboData.category_slug) {
        comboData.category_slug = comboData.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      if (!Array.isArray(comboData.category_slugs) || comboData.category_slugs.length === 0) {
        comboData.category_slugs = comboData.categories.map(c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      }
    } else if (comboData.category && typeof comboData.category === 'string') {
      comboData.categories = [comboData.category.trim()];
      const s = comboData.category_slug || comboData.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      comboData.category_slug = s;
      comboData.category_slugs = [s];
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
    await ensureComboColumnsExist();
    const { id } = req.params;
    const combo = await Combo.findByPk(id);
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });

    const updatePayload = { ...req.body };

    // If combo name is changed OR existing slug is dirty, generate a clean SEO slug from name
    if (updatePayload.name && (updatePayload.name !== combo.name || !combo.slug || combo.slug.includes('copy') || combo.slug.startsWith('combo-'))) {
      const cleanBase = updatePayload.name
        .toLowerCase()
        .replace(/\s*\(copy(?:\s*\d+)?\)\s*/gi, '')
        .replace(/(?:-copy(?:-\d+)?)+/gi, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'combo';

      let candidateSlug = cleanBase;
      let counter = 1;
      while (await Combo.findOne({ where: { slug: candidateSlug, id: { [Op.ne]: combo.id } } })) {
        counter++;
        candidateSlug = `${cleanBase}-${counter}`;
      }
      updatePayload.slug = candidateSlug;
    }

    // Auto-derive combo images from child products if items provided
    if (Array.isArray(updatePayload.items) && updatePayload.items.length > 0) {
      const pImages = updatePayload.items
        .map(it => it.primaryImage || it.images?.[0] || it.colors?.[0]?.images?.[0] || it.image)
        .filter(Boolean);
      if (pImages.length > 0) {
        updatePayload.images = pImages;
      }
    }

    // Normalize categories & category_slugs
    if (Array.isArray(updatePayload.categories)) {
      updatePayload.categories = updatePayload.categories.map(c => typeof c === 'string' ? c.trim() : c.name || c).filter(Boolean);
      if (updatePayload.categories.length > 0) {
        if (!updatePayload.category || !updatePayload.categories.includes(updatePayload.category)) {
          updatePayload.category = updatePayload.categories[0];
        }
        if (!updatePayload.category_slug) {
          updatePayload.category_slug = updatePayload.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }
        updatePayload.category_slugs = updatePayload.categories.map(c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      }
    } else if (updatePayload.category && typeof updatePayload.category === 'string') {
      updatePayload.categories = [updatePayload.category.trim()];
      const s = updatePayload.category_slug || updatePayload.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      updatePayload.category_slug = s;
      updatePayload.category_slugs = [s];
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
    await ensureComboColumnsExist();
    const { id } = req.params;
    const { hard } = req.query;

    const combo = await Combo.findOne({
      where: {
        [Op.or]: [{ id }, { slug: id }]
      }
    });
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });

    if (hard === 'true' || combo.deleted) {
      await combo.destroy();
    } else {
      await combo.update({ deleted: true });
    }
    return res.json({ success: true, message: 'Combo deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const bulkUpdateCombos = async (req, res) => {
  try {
    await ensureComboColumnsExist();
    const { ids, updates = {}, priceChange } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No combo IDs provided' });
    }

    const authorName = req.headers['x-admin-name'] 
      ? decodeURIComponent(req.headers['x-admin-name']) 
      : 'Admin';

    const combos = await Combo.findAll({
      where: { id: { [Op.in]: ids } }
    });

    const updatedCombos = [];

    for (const combo of combos) {
      const patch = { last_updated_by: authorName };

      if (updates.categories !== undefined && Array.isArray(updates.categories)) {
        const newCats = updates.categories.map(c => typeof c === 'string' ? c.trim() : c.name || c).filter(Boolean);
        const newSlugs = newCats.map(c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        if (updates.categoryMode === 'append') {
          const existing = Array.isArray(combo.categories) && combo.categories.length > 0 
            ? combo.categories 
            : (combo.category ? [combo.category] : []);
          const merged = Array.from(new Set([...existing, ...newCats]));
          patch.categories = merged;
          patch.category = merged[0] || combo.category;
          patch.category_slug = (merged[0] || combo.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          patch.category_slugs = merged.map(c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        } else {
          patch.categories = newCats;
          patch.category = newCats[0] || updates.category || combo.category;
          patch.category_slug = (newCats[0] || updates.category || combo.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          patch.category_slugs = newSlugs;
        }
      } else if (updates.category !== undefined) {
        patch.category = updates.category;
        patch.category_slug = updates.category_slug || updates.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        patch.categories = [updates.category];
        patch.category_slugs = [patch.category_slug];
      }
      if (updates.subcategory !== undefined) {
        patch.subcategory = updates.subcategory ? updates.subcategory.trim() : null;
      }
      if (updates.subcategory_slug !== undefined) {
        patch.subcategory_slug = updates.subcategory_slug ? updates.subcategory_slug.trim() : null;
      }
      if (updates.status !== undefined) {
        patch.status = updates.status;
      }

      if (priceChange && priceChange.type) {
        const val = Number(priceChange.value) || 0;
        const target = priceChange.target || 'offer_price'; // 'offer_price', 'original_price', 'both'

        const calcNewPrice = (currentVal) => {
          const curr = Number(currentVal) || 0;
          let next = curr;
          switch (priceChange.type) {
            case 'fixed':
              next = val;
              break;
            case 'increase_amount':
              next = curr + val;
              break;
            case 'decrease_amount':
              next = Math.max(0, curr - val);
              break;
            case 'increase_percent':
              next = Math.round(curr * (1 + val / 100));
              break;
            case 'decrease_percent':
              next = Math.round(curr * (1 - val / 100));
              break;
            default:
              break;
          }
          return Math.max(0, Math.round(next));
        };

        let newOffer = combo.offer_price;
        let newOrig = combo.original_price;

        if (target === 'offer_price' || target === 'both') {
          newOffer = calcNewPrice(combo.offer_price);
          patch.offer_price = newOffer;
        }
        if (target === 'original_price' || target === 'both') {
          newOrig = calcNewPrice(combo.original_price);
          patch.original_price = newOrig;
        }

        // Auto update savings badge if valid
        if (newOrig > 0 && newOffer > 0 && newOrig > newOffer) {
          const discountPercent = Math.round(((newOrig - newOffer) / newOrig) * 100);
          if (discountPercent > 0) {
            patch.badge = `SAVE ${discountPercent}%`;
          }
        }
      }

      await combo.update(patch);
      updatedCombos.push(combo);
    }

    await syncComboPrimaryImages(updatedCombos);

    return res.json({
      success: true,
      message: `Successfully updated ${updatedCombos.length} combos`,
      data: updatedCombos
    });
  } catch (err) {
    console.error('bulkUpdateCombos error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

