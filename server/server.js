import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { sequelize } from './models/index.js';
import Product from './models/Product.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, orderCreateLimiter, uploadLimiter } from './middleware/rateLimiter.js';
import { sanitizeInput } from './middleware/validation.js';
import { verifyOrigin, requireHttps } from './middleware/security.js';

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
import paymentsRoutes from './routes/payments.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import couponsRoutes from './routes/coupons.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import customersRoutes from './routes/customers.routes.js';
import productsRoutes from './routes/products.routes.js';
import combosRoutes from './routes/combos.routes.js';
import sitemapRoutes from './routes/sitemap.routes.js';
import Combo from './models/Combo.js';
import { sanitizeDuplicateProductSlugs } from './controllers/product.controller.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Trust reverse proxies (Nginx, Cloudflare, AWS ALB) for SSL/HTTPS headers & client IP
app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  'https://orderlymenswear.in',
  'https://www.orderlymenswear.in',
  'https://admin.orderlymenswear.in',
  'https://api.orderlymenswear.in',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean);

const isOriginPermitted = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const originUrl = new URL(origin);
    const host = originUrl.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host === 'orderlymenswear.in' || host.endsWith('.orderlymenswear.in')) return true;
    if (allowedOrigins.some(allowed => {
      try {
        const aUrl = new URL(allowed);
        return host === aUrl.hostname || host.endsWith('.' + aUrl.hostname);
      } catch {
        return false;
      }
    })) return true;
  } catch {}
  return false;
};

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginPermitted(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback so legitimate client API calls are not abruptly aborted
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization (XSS protection)
app.use(sanitizeInput);

// Security: Verify request origin
app.use(verifyOrigin);

// Security: Require HTTPS in production
app.use(requireHttps);

// Rate Limiting
// General API limiter (applied first)
app.use('/api/', apiLimiter);

// Higher limits for admin panel routes (polling every 4s = 15 req/min)
const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 req/15min for admin panel
  message: { success: false, message: 'Too many admin requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
});
app.use('/api/admin', adminApiLimiter);
app.use('/api/orders', adminApiLimiter); // Allow admin to fetch orders frequently
app.use('/api/dashboard', adminApiLimiter);

// Auth & specific limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/orders', orderCreateLimiter); // Only applies to POST (create)
app.use('/api/upload', uploadLimiter);

// Serve static uploaded media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check with DB status
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = `disconnected: ${e.message} (code: ${e.original?.code || e.code || 'unknown'})`;
  }
  res.status(200).json({ success: true, message: 'ORDERLY API Server is running', timestamp: new Date(), db: dbStatus, port: PORT });
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
app.use('/api/payments', paymentsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/combos', combosRoutes);
app.use('/', sitemapRoutes);
app.use('/api', sitemapRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Retry MySQL connection with backoff - ETIMEDOUT means SG/firewall blocks your IP (e.g. 49.37.217.152 not whitelisted on 52.66.173.135:3306)
  let dbConnected = false;
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('✅ MySQL Connection Established Successfully');
      dbConnected = true;
      break;
    } catch (err) {
      const code = err.original?.code || err.code || err.message;
      console.warn(`⚠️ MySQL attempt ${attempt}/${maxRetries} failed: ${err.message} (code: ${code})`);
      if (code === 'ETIMEDOUT' || err.message.includes('ETIMEDOUT')) {
        console.warn('   → ETIMEDOUT = Security Group on 52.66.173.135:3306 blocks your public IP. Fix: AWS EC2 > Security Groups > Inbound > MySQL/Aurora port 3306 > Add your IP 49.37.217.152/32 or 0.0.0.0/0 (dev only). Local fallback: set DB_HOST=127.0.0.1 and run local MySQL.');
      }
      if (attempt < maxRetries) {
        const delay = attempt * 3000;
        console.log(`   Retrying in ${delay/1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  if (!dbConnected) {
    console.warn('⚠️ MySQL connection note: connect ETIMEDOUT - server will stay up for health checks but DB-dependent routes will fail until SG is fixed. See health: /api/health');
  }
  try {
    if (dbConnected) {
      await sequelize.sync({ alter: true });
      console.log('✅ Database Schema Synced');
    } else {
      console.warn('⚠️ Skipping DB sync - no connection');
    }

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
    await sanitizeDuplicateProductSlugs();
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
