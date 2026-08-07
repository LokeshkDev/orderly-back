import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ADMIN_SECRET || 'orderly_admin_jwt_secret_2026';
    const decoded = jwt.verify(token, secret);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
};
