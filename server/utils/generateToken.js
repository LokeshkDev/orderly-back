import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateToken = (payload, secret, expiresIn = '7d') => {
  const objectPayload = (typeof payload === 'object' && payload !== null) ? payload : { id: payload };
  const tokenSecret = secret || process.env.JWT_ADMIN_SECRET || 'orderly_fallback_jwt_secret_2026';
  return jwt.sign(objectPayload, tokenSecret, { expiresIn });
};

export const generateAdminToken = (adminId) => {
  return generateToken(
    { id: adminId, role: 'admin' }, 
    process.env.JWT_ADMIN_SECRET || 'orderly_admin_jwt_secret_2026', 
    '7d'
  );
};

export const generateCustomerToken = (customerId) => {
  return generateToken(
    { id: customerId, role: 'customer' }, 
    process.env.JWT_SECRET || 'orderly_customer_jwt_secret_2026', 
    '30d'
  );
};
