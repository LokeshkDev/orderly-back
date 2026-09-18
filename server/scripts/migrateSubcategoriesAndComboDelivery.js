import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

import db from '../models/index.js';

export const runMigration = async () => {
  const qi = db.sequelize.getQueryInterface();

  console.log('Checking database columns for subcategories and combo delivery...');

  // 1. Categories table -> parent_id
  try {
    const catCols = await qi.describeTable('Categories');
    if (!catCols.parent_id) {
      await qi.addColumn('Categories', 'parent_id', {
        type: db.sequelize.Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Added parent_id column to Categories');
    } else {
      console.log('ℹ️ Categories.parent_id already exists');
    }
  } catch (e) {
    console.warn('⚠️ Categories table check warning:', e.message);
  }

  // 2. Products table -> subcategory
  try {
    const prodCols = await qi.describeTable('Products');
    if (!prodCols.subcategory) {
      await qi.addColumn('Products', 'subcategory', {
        type: db.sequelize.Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added subcategory column to Products');
    } else {
      console.log('ℹ️ Products.subcategory already exists');
    }
  } catch (e) {
    console.warn('⚠️ Products table check warning:', e.message);
  }

  // 3. Combos table -> subcategory & subcategory_slug
  try {
    const comboCols = await qi.describeTable('Combos');
    if (!comboCols.subcategory) {
      await qi.addColumn('Combos', 'subcategory', {
        type: db.sequelize.Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added subcategory column to Combos');
    } else {
      console.log('ℹ️ Combos.subcategory already exists');
    }
    if (!comboCols.subcategory_slug) {
      await qi.addColumn('Combos', 'subcategory_slug', {
        type: db.sequelize.Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added subcategory_slug column to Combos');
    } else {
      console.log('ℹ️ Combos.subcategory_slug already exists');
    }
  } catch (e) {
    console.warn('⚠️ Combos table check warning:', e.message);
  }

  console.log('Migration completed successfully.');
};

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

