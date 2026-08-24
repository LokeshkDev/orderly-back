import express from 'express';
import db from '../models/index.js';

const router = express.Router();
const { Product, Combo, Category } = db;

router.get(['/sitemap.xml', '/sitemap'], async (req, res) => {
  try {
    const baseUrl = 'https://orderlymenswear.in';

    // Fetch active products, combos, and categories
    const [products, combos, categories] = await Promise.allSettled([
      Product.findAll({
        where: { status: 'Active', deleted: false },
        attributes: ['id', 'slug', 'updatedAt']
      }),
      Combo.findAll({
        where: { status: 'Active' },
        attributes: ['id', 'slug', 'updatedAt']
      }),
      Category.findAll({
        attributes: ['id', 'name', 'slug', 'updatedAt']
      })
    ]);

    const activeProducts = products.status === 'fulfilled' ? products.value : [];
    const activeCombos = combos.status === 'fulfilled' ? combos.value : [];
    const activeCategories = categories.status === 'fulfilled' ? categories.value : [];

    const staticRoutes = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/shop', priority: '0.9', changefreq: 'daily' },
      { url: '/combos', priority: '0.9', changefreq: 'daily' },
      { url: '/about', priority: '0.5', changefreq: 'monthly' },
      { url: '/contact', priority: '0.5', changefreq: 'monthly' },
      { url: '/shipping-policy', priority: '0.3', changefreq: 'monthly' },
      { url: '/returns-policy', priority: '0.3', changefreq: 'monthly' }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    staticRoutes.forEach(route => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${route.url}</loc>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Category pages
    activeCategories.forEach(cat => {
      const catSlug = cat.slug || encodeURIComponent(cat.name);
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/shop?category=${catSlug}</loc>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Dynamic Live Products
    activeProducts.forEach(prod => {
      const prodUrl = `${baseUrl}/product/${prod.slug || prod.id}`;
      const lastMod = prod.updatedAt ? new Date(prod.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += '  <url>\n';
      xml += `    <loc>${prodUrl}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Dynamic Live Combos
    activeCombos.forEach(combo => {
      const comboUrl = `${baseUrl}/combo/${combo.slug || combo.id}`;
      const lastMod = combo.updatedAt ? new Date(combo.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += '  <url>\n';
      xml += `    <loc>${comboUrl}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).send('Error generating sitemap');
  }
});

export default router;
