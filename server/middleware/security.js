export const verifyOrigin = (req, res, next) => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ].filter(Boolean);

  const origin = req.headers.origin || req.headers.referer;
  
  // Allow requests without origin (server-to-server, curl, mobile apps)
  if (!origin) {
    return next();
  }

  try {
    const originUrl = new URL(origin);
    const isAllowed = allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        return false;
      }
    });

    // Also allow if origin hostname matches allowed origins (for subdomains)
    const isAllowedHostname = allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return originUrl.hostname === allowedUrl.hostname || 
               originUrl.hostname.endsWith('.' + allowedUrl.hostname);
      } catch {
        return false;
      }
    });

    if (!isAllowed && !isAllowedHostname && process.env.NODE_ENV === 'production') {
      console.warn('Origin blocked:', origin, 'Allowed:', allowedOrigins);
      return res.status(403).json({ 
        success: false, 
        message: 'Request origin not allowed' 
      });
    }
  } catch {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid origin header' 
      });
    }
  }

  next();
};

export const requireHttps = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.status(403).json({ 
      success: false, 
      message: 'HTTPS required' 
    });
  }
  next();
};