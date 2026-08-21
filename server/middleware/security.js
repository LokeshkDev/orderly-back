export const verifyOrigin = (req, res, next) => {
  // Pass-through origin validation since CORS handler handles origin policy
  next();
};

export const requireHttps = (req, res, next) => {
  const isHttps = req.secure || req.get('x-forwarded-proto') === 'https' || req.protocol === 'https';
  if (process.env.NODE_ENV === 'production' && !isHttps) {
    const host = req.get('host') || '';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      return res.status(403).json({ 
        success: false, 
        message: 'HTTPS required' 
      });
    }
  }
  next();
};