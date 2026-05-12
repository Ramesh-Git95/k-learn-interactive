const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  console.log('🔐 Authentication middleware called for:', req.method, req.path);
  
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    console.log('🔑 Token received:', token ? 'YES' : 'NO');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'MISSING_TOKEN'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Authentication error',
      error: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user has premium access
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required',
      error: 'NOT_AUTHENTICATED'
    });
  }
  
  if (!req.user.hasPremiumAccess()) {
    return res.status(403).json({ 
      message: 'Premium subscription required',
      error: 'PREMIUM_REQUIRED',
      subscriptionType: req.user.subscription.type,
      subscriptionStatus: req.user.subscription.status
    });
  }
  
  next();
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
    
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

// Rate limiting middleware (simple in-memory store)
const rateLimitStore = new Map();

const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, timestamps] of rateLimitStore.entries()) {
      rateLimitStore.set(key, timestamps.filter(timestamp => timestamp > windowStart));
      if (rateLimitStore.get(key).length === 0) {
        rateLimitStore.delete(key);
      }
    }
    
    // Get current requests for this client
    const clientRequests = rateLimitStore.get(clientId) || [];
    const recentRequests = clientRequests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    rateLimitStore.set(clientId, recentRequests);
    
    next();
  };
};

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        errors
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requirePremium,
  optionalAuth,
  rateLimit,
  validateRequest
};
