import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const customerAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Customer authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'orderly_customer_jwt_secret_2026';
    const decoded = jwt.verify(token, secret);
    req.customer = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired customer token' });
  }
};

// Attaches the customer when a valid token is present, otherwise continues
// as a guest (used for public order placement).
export const optionalCustomerAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'orderly_customer_jwt_secret_2026';
      req.customer = jwt.verify(token, secret);
    }
  } catch (error) {}
  next();
};
