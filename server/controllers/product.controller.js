import Product from '../models/Product.js';
import { Op } from 'sequelize';

export const getProducts = async (req, res) => {
  try {
    const { category, occasion, brand, search, status, includeDeleted, includeDrafts, all, is_bestseller, is_new_arrival } = req.query;
    const where = {};

    // Soft-deleted products are hidden by default (from website and admin).
    if (includeDeleted !== 'true') where.deleted = false;

    if (category && category !== 'All') where.category = category;
    if (occasion && occasion !== 'All') where.occasion = occasion;
    if (brand && brand !== 'All') where.brand = brand;
    if (is_bestseller === 'true') where.is_bestseller = true;
    if (is_new_arrival === 'true') where.is_new_arrival = true;

    // If all or includeDrafts is true (admin requests), show all or filter by requested status.
    // Otherwise, on public website, strictly filter to Active products only!
    if (all === 'true' || includeDrafts === 'true') {
      if (status && status !== 'All') where.status = status;
    } else {
      where.status = status || 'Active';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];
    }

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

    // Fallback: If not found and id looks like a copy-chained slug, try matching prefix or cleaned slug
    if (!product && typeof id === 'string' && (id.includes('-copy-') || id.includes('copy'))) {
      const cleanPrefix = id.replace(/(?:-copy(?:-\d+)?)+.*/gi, '').replace(/-\d{10,}.*/g, '').trim();
      if (cleanPrefix) {
        product = await Product.findOne({
          where: {
            slug: { [Op.like]: `${cleanPrefix}%` },
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

    // Clean and normalize slug (strip raw copy timestamps and duplicates)
    let rawSlug = productData.slug;
    if (!rawSlug) {
      rawSlug = (productData.name || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    } else {
      rawSlug = rawSlug
        .replace(/(?:-copy(?:-\d+)?)+-\d{10,}/gi, '-copy')
        .replace(/(?:-copy)+/gi, '-copy')
        .replace(/-\d{10,}/g, '')
        .replace(/[^a-z0-9-]+/g, '')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Ensure uniqueness in database
    let candidateSlug = rawSlug || 'product';
    let counter = 1;
    while (await Product.findOne({ where: { slug: candidateSlug } })) {
      counter++;
      candidateSlug = `${rawSlug}-${counter}`;
    }
    productData.slug = candidateSlug;

    if (productData.is_bestseller !== undefined) {
      productData.is_bestseller = productData.is_bestseller === true || productData.is_bestseller === 'true' || productData.is_bestseller === 1;
    }
    if (productData.is_new_arrival !== undefined) {
      productData.is_new_arrival = productData.is_new_arrival === true || productData.is_new_arrival === 'true' || productData.is_new_arrival === 1;
    }
    const product = await Product.create(productData);
    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const updateData = { ...req.body };
    const authorName = req.headers['x-admin-name'] ? decodeURIComponent(req.headers['x-admin-name']) : (updateData.last_updated_by || 'Admin');
    updateData.last_updated_by = authorName;

    if (updateData.is_bestseller !== undefined) {
      updateData.is_bestseller = updateData.is_bestseller === true || updateData.is_bestseller === 'true' || updateData.is_bestseller === 1;
    }
    if (updateData.is_new_arrival !== undefined) {
      updateData.is_new_arrival = updateData.is_new_arrival === true || updateData.is_new_arrival === 'true' || updateData.is_new_arrival === 1;
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
