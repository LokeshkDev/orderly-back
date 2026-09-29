import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  skip: (req) => {
    const url = req.originalUrl || req.url || '';
    return (
      url.startsWith('/api/admin') ||
      url.startsWith('/api/upload') ||
      url.startsWith('/api/dashboard') ||
      url.startsWith('/api/orders') ||
      Boolean(req.headers['authorization']) ||
      Boolean(req.headers['x-admin-name'])
    );
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
});

export const orderCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many orders created, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 uploads per 15 minutes
  message: { success: false, message: 'Too many uploads, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  skip: (req) => {
    // Authenticated admin users are never blocked by upload rate limiting
    return Boolean(req.headers['authorization']) || Boolean(req.headers['x-admin-name']);
  }
});