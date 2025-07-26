import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';
import { logger, AuthorizationError } from './logger';

// Security configuration for Replit-only auth
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
        scriptSrc: [
          "'self'", 
          "'unsafe-eval'", 
          "'unsafe-inline'"
        ],
        connectSrc: [
          "'self'", 
          "ws:", 
          "wss:", 
          "*.neon.tech",
          "https://clubflow.replit.app"
        ],
        frameSrc: [
          "'self'"
        ],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for Vite compatibility
  }));

  // Rate limiting - more lenient in development
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 1000 : 100, // Much higher limit in dev for testing
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
        }
      });
    },
  });

  // Stricter rate limiting for auth endpoints - more lenient in development
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 100 : 10, // Higher limit in dev for testing
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
    handler: (req, res) => {
      logger.warn('Auth rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });
      res.status(429).json({
        error: {
          type: 'AuthRateLimitError',
          message: 'Too many authentication attempts, please try again later.',
          timestamp: new Date().toISOString(),
        }
      });
    },
  });

  // Apply rate limiting
  app.use(generalLimiter);
  app.use('/api/auth', authLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api/logout', authLimiter);

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  logger.info('Security middleware configured successfully');
};