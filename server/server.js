import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { sequelize } from './models/index.js';
import Product from './models/Product.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import occasionsRoutes from './routes/occasions.routes.js';
import brandsRoutes from './routes/brands.routes.js';
import heroRoutes from './routes/hero.routes.js';
import homepageRoutes from './routes/homepage.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import couponsRoutes from './routes/coupons.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import customersRoutes from './routes/customers.routes.js';
import productsRoutes from './routes/products.routes.js';
import combosRoutes from './routes/combos.routes.js';
import Combo from './models/Combo.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploaded media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'ORDERLY API Server is running', timestamp: new Date() });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/occasions', occasionsRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/hero-slides', heroRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/combos', combosRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connection Established Successfully');
    await sequelize.sync({ alter: true });
    console.log('✅ Database Schema Synced');

    // Seed the master catalog safely on every start:
    //  - A master product with NO database row gets created (full catalog).
    //  - Soft-deleted products (deleted = true) are NEVER re-created.
    // This is idempotent and makes the DB the single source of truth.
    let seedCatalog = [];
    let seedCombos = [];
    try {
      const { MASTER_PRODUCTS, MASTER_COMBOS } = await import('./seeders/masterCatalog.js');
      seedCatalog = MASTER_PRODUCTS || [];
      seedCombos = MASTER_COMBOS || [];
    } catch (err) {
      console.warn('Could not import master catalog, keeping DB as-is:', err.message);
    }
    let seededCount = 0;
    for (const item of seedCatalog) {
      try {
        const existing = await Product.findOne({
          where: { id: item.id, deleted: true }
        });
        if (existing) continue; // soft-deleted — never bring back
        const exists = await Product.findByPk(item.id);
        if (!exists) {
          await Product.create(item);
          seededCount += 1;
        }
      } catch (err) {
        console.warn(`Skipped seed for product ${item.id}: ${err.message}`);
      }
    }
    console.log(`✅ Seeded ${seededCount} missing master products (full catalog in sync)`);

    let seededCombosCount = 0;
    for (const comboItem of seedCombos) {
      try {
        const existing = await Combo.findOne({
          where: { id: comboItem.id, deleted: true }
        });
        if (existing) continue;
        const exists = await Combo.findByPk(comboItem.id);
        if (!exists) {
          await Combo.create(comboItem);
          seededCombosCount += 1;
        }
      } catch (err) {
        console.warn(`Skipped seed for combo ${comboItem.id}: ${err.message}`);
      }
    }
    console.log(`✅ Seeded ${seededCombosCount} missing master combos (combos in sync)`);
  } catch (error) {
    console.warn('⚠️ MySQL connection note:', error.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 ORDERLY API Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Free the port or set process.env.PORT to a different value.`);
    } else {
      console.error('⚠️ Server error:', err);
    }
  });
};

startServer();
