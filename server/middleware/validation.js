import { body, query, param, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

export const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).escape().withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Valid Indian phone number required'),
  validate
];

export const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.quantity').optional().isInt({ min: 1, max: 99 }).withMessage('Quantity must be 1-99'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('shippingAddress.email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('shippingAddress.phone')
    .custom((val) => {
      const clean = String(val || '').replace(/\D/g, '');
      return clean.length >= 10 && clean.length <= 13;
    })
    .withMessage('Valid phone number required'),
  body('shippingAddress.address').trim().isLength({ min: 3, max: 500 }).escape().withMessage('Address required (3-500 chars)'),
  body('shippingAddress.city').trim().isLength({ min: 2, max: 100 }).escape().withMessage('City required'),
  body('shippingAddress.state').trim().isLength({ min: 2, max: 100 }).escape().withMessage('State required'),
  body('shippingAddress.pincode').matches(/^\d{6}$/).withMessage('Valid 6-digit pincode required'),
  body('payment_method')
    .optional()
    .customSanitizer(val => String(val || '').toLowerCase())
    .isIn(['cod', 'online', 'card', 'upi', 'razorpay'])
    .withMessage('Valid payment method required'),
  body('paymentMethod')
    .optional()
    .customSanitizer(val => String(val || '').toLowerCase())
    .isIn(['cod', 'online', 'card', 'upi', 'razorpay'])
    .withMessage('Valid payment method required'),
  validate
];

export const adminCreateValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).escape().withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('role').optional().isIn(['admin', 'editor']).withMessage('Role must be admin or editor'),
  validate
];

export const productValidation = [
  body('name').trim().isLength({ min: 2, max: 200 }).escape().withMessage('Name must be 2-200 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('original_price').optional().isFloat({ min: 0 }).withMessage('Valid original price required'),
  body('description').optional().trim().isLength({ max: 5000 }).escape().withMessage('Description max 5000 characters'),
  body('category').optional().isInt().withMessage('Valid category ID required'),
  body('brand').optional().isInt().withMessage('Valid brand ID required'),
  validate
];

export const categoryValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).escape().withMessage('Name must be 2-100 characters'),
  body('slug').trim().matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase alphanumeric with hyphens'),
  body('description').optional().trim().isLength({ max: 1000 }).escape().withMessage('Description max 1000 characters'),
  validate
];

export const settingsValidation = [
  body('key').trim().isLength({ min: 1, max: 100 }).escape().withMessage('Key required'),
  body('value').optional(),
  body('type').isIn(['string', 'number', 'boolean', 'json']).withMessage('Valid type required'),
  validate
];

export const idParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid ID required'),
  validate
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().trim().escape(),
  query('order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
  validate
];