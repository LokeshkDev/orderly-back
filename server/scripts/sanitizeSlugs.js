import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
import db from '../models/index.js';
import { Op } from 'sequelize';

export const createCleanSlug = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s*\(copy(?:\s*\d+)?\)\s*/gi, '')
    .replace(/(?:-copy(?:-\d+)?)+/gi, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const sanitizeAllSlugs = async () => {
  try {
    // 1. Sanitize Products
    const products = await db.Product.findAll();
    console.log(`Checking ${products.length} products...`);
    let fixedProd = 0;
    for (const p of products) {
      const isMessy = !p.slug || p.slug.includes('copy') || p.slug.startsWith('prod-') || /\d{10,}/.test(p.slug);
      if (isMessy) {
        let base = createCleanSlug(p.name) || 'product';
        let candidate = base;
        let counter = 1;
        while (await db.Product.findOne({ where: { slug: candidate, id: { [Op.ne]: p.id } } })) {
          counter++;
          candidate = `${base}-${counter}`;
        }
        await p.update({ slug: candidate });
        console.log(`Product [${p.id}] "${p.name}" => ${candidate}`);
        fixedProd++;
      }
    }
    console.log(`Finished products: ${fixedProd} updated.`);

    // 2. Sanitize Combos
    const combos = await db.Combo.findAll();
    console.log(`Checking ${combos.length} combos...`);
    let fixedCombo = 0;
    for (const c of combos) {
      const isMessy = !c.slug || c.slug.includes('copy') || c.slug.startsWith('combo-') || /\d{10,}/.test(c.slug);
      if (isMessy) {
        let base = createCleanSlug(c.name) || 'combo';
        let candidate = base;
        let counter = 1;
        while (await db.Combo.findOne({ where: { slug: candidate, id: { [Op.ne]: c.id } } })) {
          counter++;
          candidate = `${base}-${counter}`;
        }
        await c.update({ slug: candidate });
        console.log(`Combo [${c.id}] "${c.name}" => ${candidate}`);
        fixedCombo++;
      }
    }
    console.log(`Finished combos: ${fixedCombo} updated.`);
    return { fixedProd, fixedCombo };
  } catch (err) {
    console.error('Slug sanitization error:', err);
    throw err;
  }
};

// If run directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  sanitizeAllSlugs().then(() => process.exit(0)).catch(() => process.exit(1));
}
