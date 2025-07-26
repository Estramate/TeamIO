import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';
import { logger, AuthorizationError } from './logger';

// Security configuration
export const setupSecurity = (app: Express) => {
  // Conditional CSP configuration - disabled in development for Vite compatibility
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  app.use(helmet({
    contentSecurityPolicy: isDevelopment ? false : {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
        connectSrc: ["'self'", "ws:", "wss:", "*.neon.tech"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for Vite compatibility
  }));

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: {
        type: 'RateLimitError',
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString(),
        requestId: 'rate-limit',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });
      res.status(429).json({
        error: {
          type: 'RateLimitError',
          message: 'Too many requests from this IP, please try again later.',
          timestamp: new Date().toISOString(),
          requestId: (req as any).id || 'rate-limit',
        },
      });
    },
  });

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Increased limit to prevent auth loops
    message: {
      error: {
        type: 'AuthRateLimitError',
        message: 'Too many authentication attempts, please try again later.',
        timestamp: new Date().toISOString(),
        requestId: 'auth-rate-limit',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting
  app.use('/api/', generalLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api/auth/', authLimiter);

  logger.info('Security middleware configured');
};

// Enhanced club access middleware with better error handling
export const requireClubAccess = async (req: any, res: any, next: any) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub;
    
    if (!userId) {
      throw new AuthorizationError('Authentication required');
    }

    if (!clubId || isNaN(clubId)) {
      return res.status(400).json({
        error: {
          type: 'ValidationError',
          message: 'Invalid club ID',
          field: 'clubId',
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    }

    // Import storage here to avoid circular dependency
    const { storage } = await import('./storage');
    
    // Check if user is member of the club
    const userClubs = await storage.getUserClubs(userId);
    const hasAccess = userClubs.some(membership => 
      membership.clubId === clubId && membership.status === 'active'
    );

    if (!hasAccess) {
      throw new AuthorizationError('Access denied. You are not a member of this club.');
    }

    // Add club access info to request for downstream use
    req.clubAccess = {
      clubId,
      userId,
      membership: userClubs.find(m => m.clubId === clubId),
    };

    next();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(error.statusCode).json({
        error: {
          type: error.type,
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    }

    logger.error('Error checking club access', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.claims?.sub,
      clubId: req.params.clubId,
      requestId: (req as any).id,
    });

    res.status(500).json({
      error: {
        type: 'InternalServerError',
        message: 'Failed to verify club access',
        timestamp: new Date().toISOString(),
        requestId: (req as any).id,
      },
    });
  }
};

// CSRF protection for state-changing operations
export const csrfProtection = (req: any, res: any, next: any) => {
  // Skip CSRF for GET and HEAD requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Whitelist routes that don't need CSRF protection
  const csrfWhitelist = [
    '/api/auth/firebase',
    '/api/login',
    '/api/logout', 
    '/api/callback',
    '/api/errors',
    '/api/performance'
  ];

  // Skip CSRF for whitelisted routes
  if (csrfWhitelist.some(route => req.path.startsWith(route))) {
    return next();
  }

  // Check for CSRF token in header
  const token = req.get('X-CSRF-Token') || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    logger.warn('CSRF token validation failed', {
      hasToken: !!token,
      hasSessionToken: !!sessionToken,
      tokensMatch: token === sessionToken,
      method: req.method,
      url: req.url,
      userId: req.user?.claims?.sub,
      requestId: (req as any).id,
    });

    return res.status(403).json({
      error: {
        type: 'CSRFError',
        message: 'Invalid CSRF token',
        timestamp: new Date().toISOString(),
        requestId: (req as any).id,
      },
    });
  }

  next();
};

// Generate CSRF token endpoint
export const generateCSRFToken = (req: any, res: any) => {
  const token = Math.random().toString(36).substr(2, 16);
  req.session.csrfToken = token;
  res.json({ csrfToken: token });
};