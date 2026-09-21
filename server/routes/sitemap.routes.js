import express from 'express';
import db from '../models/index.js';

const router = express.Router();
const { Product, Combo, Category } = db;

const escapeXml = (unsafe) => {
  if (!unsafe || typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

router.get(['/sitemap.xml', '/sitemap'], async (req, res) => {
  try {
    const baseUrl = 'https://orderlymenswear.in';

    // Fetch active products, combos, and categories
    const [products, combos, categories] = await Promise.allSettled([
      Product.findAll({
        where: { status: 'Active', deleted: false },
        attributes: ['id', 'name', 'slug', 'images', 'updatedAt']
      }),
      Combo.findAll({
        where: { status: 'Active' },
        attributes: ['id', 'name', 'slug', 'cover_image', 'images', 'updatedAt']
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
      { url: '/returns-policy', priority: '0.3', changefreq: 'monthly' },
      { url: '/terms-and-conditions', priority: '0.3', changefreq: 'monthly' },
      { url: '/privacy-policy', priority: '0.3', changefreq: 'monthly' }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

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
      const catSlug = encodeURIComponent(cat.slug || cat.name || '');
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/shop?category=${catSlug}</loc>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Dynamic Live Products with Image Sitemaps
    activeProducts.forEach(prod => {
      const prodUrl = `${baseUrl}/product/${prod.slug || prod.id}`;
      const lastMod = prod.updatedAt ? new Date(prod.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      let prodImages = [];
      if (Array.isArray(prod.images)) {
        prodImages = prod.images;
      } else if (typeof prod.images === 'string') {
        try { prodImages = JSON.parse(prod.images); } catch (e) { prodImages = [prod.images]; }
      }

      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(prodUrl)}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';

      if (Array.isArray(prodImages) && prodImages.length > 0) {
        prodImages.slice(0, 5).forEach(img => {
          const imgUrl = typeof img === 'string' ? img : img?.url;
          if (imgUrl) {
            const absoluteImg = imgUrl.startsWith('http') ? imgUrl : `${baseUrl}${imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl}`;
            xml += '    <image:image>\n';
            xml += `      <image:loc>${escapeXml(absoluteImg)}</image:loc>\n`;
            if (prod.name) {
              xml += `      <image:title>${escapeXml(prod.name)}</image:title>\n`;
            }
            xml += '    </image:image>\n';
          }
        });
      }

      xml += '  </url>\n';
    });

    // Dynamic Live Combos with Image Sitemaps
    activeCombos.forEach(combo => {
      const comboUrl = `${baseUrl}/combo/${combo.slug || combo.id}`;
      const lastMod = combo.updatedAt ? new Date(combo.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      let comboImages = [];
      if (combo.cover_image) comboImages.push(combo.cover_image);
      if (Array.isArray(combo.images)) {
        comboImages.push(...combo.images);
      } else if (typeof combo.images === 'string') {
        try { 
          const parsed = JSON.parse(combo.images);
          if (Array.isArray(parsed)) comboImages.push(...parsed);
        } catch (e) {}
      }

      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(comboUrl)}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';

      if (comboImages.length > 0) {
        [...new Set(comboImages)].slice(0, 5).forEach(img => {
          const imgUrl = typeof img === 'string' ? img : img?.url;
          if (imgUrl) {
            const absoluteImg = imgUrl.startsWith('http') ? imgUrl : `${baseUrl}${imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl}`;
            xml += '    <image:image>\n';
            xml += `      <image:loc>${escapeXml(absoluteImg)}</image:loc>\n`;
            if (combo.name) {
              xml += `      <image:title>${escapeXml(combo.name)}</image:title>\n`;
            }
            xml += '    </image:image>\n';
          }
        });
      }

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
