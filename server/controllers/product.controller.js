import Product from '../models/Product.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';

let productSchemaEnsured = false;
export const ensureProductColumnsExist = async () => {
  if (productSchemaEnsured) return;
  const queries = [
    "ALTER TABLE `Products` ADD COLUMN `categories` JSON NULL;",
    "ALTER TABLE `products` ADD COLUMN `categories` JSON NULL;"
  ];
  for (const q of queries) {
    try {
      await sequelize.query(q);
    } catch (e) {}
  }
  productSchemaEnsured = true;
};

export const getProducts = async (req, res) => {
  try {
    await ensureProductColumnsExist();
    const { category, subcategory, occasion, brand, search, status, includeDeleted, includeDrafts, all, is_bestseller, is_new_arrival } = req.query;
    const andConditions = [];

    // Soft-deleted products are hidden by default (from website and admin).
    if (includeDeleted !== 'true') andConditions.push({ deleted: false });

    if (category && category !== 'All') {
      andConditions.push({
        [Op.or]: [
          { category: category },
          { categories: { [Op.like]: `%"${category}"%` } }
        ]
      });
    }
    if (subcategory && subcategory !== 'All') andConditions.push({ subcategory: subcategory });
    if (occasion && occasion !== 'All') andConditions.push({ occasion: occasion });
    if (brand && brand !== 'All') andConditions.push({ brand: brand });
    if (is_bestseller === 'true') andConditions.push({ is_bestseller: true });
    if (is_new_arrival === 'true') andConditions.push({ is_new_arrival: true });

    // If all or includeDrafts is true (admin requests), show all or filter by requested status.
    // Otherwise, on public website, strictly filter to Active products only!
    if (all === 'true' || includeDrafts === 'true') {
      if (status && status !== 'All') andConditions.push({ status: status });
    } else {
      andConditions.push({ status: status || 'Active' });
    }

    if (search) {
      andConditions.push({
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { brand: { [Op.like]: `%${search}%` } }
        ]
      });
    }

    const where = andConditions.length > 0 ? { [Op.and]: andConditions } : {};
    const products = await Product.findAll({ where, order: [['createdAt', 'DESC']] });
    return res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    console.warn('⚠️ Product DB query warning (using fallback):', err.message);
    return res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeDrafts, all } = req.query;
    const where = {
      [Op.or]: [{ id }, { slug: id }],
      deleted: false
    };

    // On public website, draft products cannot be viewed
    if (all !== 'true' && includeDrafts !== 'true') {
      where.status = 'Active';
    }

    let product = await Product.findOne({
      where
    });

    // Fallback: If not found, try matching cleaned slug prefix or name
    if (!product && typeof id === 'string') {
      const cleanReq = id
        .replace(/\s*\(copy(?:\s*\d+)?\)\s*/gi, '')
        .replace(/(?:-copy(?:-\d+)?)+.*/gi, '')
        .replace(/-\d{10,}.*/g, '')
        .trim();
      if (cleanReq) {
        product = await Product.findOne({
          where: {
            slug: { [Op.like]: `${cleanReq}%` },
            deleted: false,
            ...(all !== 'true' && includeDrafts !== 'true' ? { status: 'Active' } : {})
          }
        });
      }
    }

    if (!product) {
      return res.json({ success: false, data: null });
    }

    return res.json({ success: true, data: product });
  } catch (err) {
    console.warn('⚠️ ProductById DB query warning:', err.message);
    return res.status(500).json({ success: false, message: err.message, data: null });
  }
};

export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    const authorName = req.headers['x-admin-name'] ? decodeURIComponent(req.headers['x-admin-name']) : (productData.last_updated_by || 'Admin');
    productData.last_updated_by = authorName;
    if (!productData.id) {
      productData.id = 'prod-' + Date.now();
    }

    // Always generate a clean, readable SEO slug from product name (never include copy/timestamps)
    const cleanBase = (productData.name || 'product')
      .toLowerCase()
      .replace(/\s*\(copy(?:\s*\d+)?\)\s*/gi, '')
      .replace(/(?:-copy(?:-\d+)?)+/gi, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'product';

    let candidateSlug = cleanBase;
    let counter = 1;
    while (await Product.findOne({ where: { slug: candidateSlug } })) {
      counter++;
      candidateSlug = `${cleanBase}-${counter}`;
    }
    productData.slug = candidateSlug;

    if (productData.is_bestseller !== undefined) {
      productData.is_bestseller = productData.is_bestseller === true || productData.is_bestseller === 'true' || productData.is_bestseller === 1;
    }
    if (productData.is_new_arrival !== undefined) {
      productData.is_new_arrival = productData.is_new_arrival === true || productData.is_new_arrival === 'true' || productData.is_new_arrival === 1;
    }

    // Normalize categories array and primary category
    if (Array.isArray(productData.categories) && productData.categories.length > 0) {
      productData.categories = productData.categories.map(c => typeof c === 'string' ? c.trim() : c.name || c).filter(Boolean);
      if (!productData.category || !productData.categories.includes(productData.category)) {
        productData.category = productData.categories[0];
      }
    } else if (productData.category && typeof productData.category === 'string') {
      productData.categories = [productData.category.trim()];
    }

    const product = await Product.create(productData);
    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    await ensureProductColumnsExist();
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const updateData = { ...req.body };
    const authorName = req.headers['x-admin-name'] ? decodeURIComponent(req.headers['x-admin-name']) : (updateData.last_updated_by || 'Admin');
    updateData.last_updated_by = authorName;

    // If product name is changed OR existing slug is dirty, generate a clean SEO slug from name
    if (updateData.name && (updateData.name !== product.name || !product.slug || product.slug.includes('copy') || product.slug.startsWith('prod-'))) {
      const cleanBase = updateData.name
        .toLowerCase()
        .replace(/\s*\(copy(?:\s*\d+)?\)\s*/gi, '')
        .replace(/(?:-copy(?:-\d+)?)+/gi, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'product';

      let candidateSlug = cleanBase;
      let counter = 1;
      while (await Product.findOne({ where: { slug: candidateSlug, id: { [Op.ne]: product.id } } })) {
        counter++;
        candidateSlug = `${cleanBase}-${counter}`;
      }
      updateData.slug = candidateSlug;
    }

    if (updateData.is_bestseller !== undefined) {
      updateData.is_bestseller = updateData.is_bestseller === true || updateData.is_bestseller === 'true' || updateData.is_bestseller === 1;
    }
    if (updateData.is_new_arrival !== undefined) {
      updateData.is_new_arrival = updateData.is_new_arrival === true || updateData.is_new_arrival === 'true' || updateData.is_new_arrival === 1;
    }

    // Normalize categories array and primary category
    if (Array.isArray(updateData.categories)) {
      updateData.categories = updateData.categories.map(c => typeof c === 'string' ? c.trim() : c.name || c).filter(Boolean);
      if (updateData.categories.length > 0) {
        if (!updateData.category || !updateData.categories.includes(updateData.category)) {
          updateData.category = updateData.categories[0];
        }
      }
    } else if (updateData.category && typeof updateData.category === 'string') {
      updateData.categories = [updateData.category.trim()];
    }

    await product.update(updateData);
    return res.json({ success: true, data: product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Soft delete: keep the row so the seeder never re-creates it, but hide it everywhere.
    await product.update({ deleted: true });
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const bulkUpdateProducts = async (req, res) => {
  try {
    await ensureProductColumnsExist();
    const { ids, updates = {}, priceChange } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No product IDs provided' });
    }

    const authorName = req.headers['x-admin-name'] 
      ? decodeURIComponent(req.headers['x-admin-name']) 
      : 'Admin';

    const products = await Product.findAll({
      where: { id: { [Op.in]: ids } }
    });

    const updatedProducts = [];

    for (const product of products) {
      const patch = { last_updated_by: authorName };

      if (updates.categories !== undefined && Array.isArray(updates.categories)) {
        const newCats = updates.categories.map(c => typeof c === 'string' ? c.trim() : c.name || c).filter(Boolean);
        if (updates.categoryMode === 'append') {
          const existing = Array.isArray(product.categories) && product.categories.length > 0 
            ? product.categories 
            : (product.category ? [product.category] : []);
          const merged = Array.from(new Set([...existing, ...newCats]));
          patch.categories = merged;
          patch.category = merged[0] || product.category;
        } else {
          patch.categories = newCats;
          patch.category = newCats[0] || updates.category || product.category;
        }
      } else if (updates.category !== undefined) {
        patch.category = updates.category;
        patch.categories = [updates.category];
      }
      if (updates.subcategory !== undefined) {
        patch.subcategory = updates.subcategory ? updates.subcategory.trim() : null;
      }
      if (updates.status !== undefined) {
        patch.status = updates.status;
      }
      if (updates.is_bestseller !== undefined) {
        patch.is_bestseller = updates.is_bestseller;
      }
      if (updates.is_new_arrival !== undefined) {
        patch.is_new_arrival = updates.is_new_arrival;
      }

      if (priceChange && priceChange.type) {
        const val = Number(priceChange.value) || 0;
        const target = priceChange.target || 'price'; // 'price', 'originalPrice', 'both'

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

        if (target === 'price' || target === 'both') {
          patch.price = calcNewPrice(product.price);
        }
        if (target === 'originalPrice' || target === 'both') {
          patch.originalPrice = calcNewPrice(product.originalPrice || product.price);
        }
      }

      await product.update(patch);
      updatedProducts.push(product);
    }

    return res.json({
      success: true,
      message: `Successfully updated ${updatedProducts.length} products`,
      data: updatedProducts
    });
  } catch (err) {
    console.error('bulkUpdateProducts error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const sanitizeDuplicateProductSlugs = async () => {
  try {
    const messyProducts = await Product.findAll({
      where: {
        slug: { [Op.like]: '%-copy-%' }
      }
    });
    for (const p of messyProducts) {
      if (/\d{10,}/.test(p.slug)) {
        let cleanBase = p.slug
          .replace(/(?:-copy(?:-\d+)?)+-\d{10,}.*/gi, '-copy')
          .replace(/-\d{10,}/g, '')
          .replace(/[^a-z0-9-]+/g, '')
          .replace(/-+/g, '-')
          .replace(/(^-|-$)/g, '');
        let newSlug = cleanBase;
        let count = 1;
        while (await Product.findOne({ where: { slug: newSlug, id: { [Op.ne]: p.id } } })) {
          count++;
          newSlug = `${cleanBase}-${count}`;
        }
        await p.update({ slug: newSlug });
      }
    }
  } catch (e) {
    // Database connection or table might be optional/offline
  }
};
