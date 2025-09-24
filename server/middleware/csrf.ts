import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

// Generate secure random CSRF token
const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Modern CSRF protection using double-submit cookie pattern
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF protection for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF protection for health checks and some public endpoints
  if (req.path === '/health' || req.path === '/api/health' || req.path.startsWith('/api/public/')) {
    return next();
  }

  // Check if user is authenticated (CSRF only needed for authenticated requests)
  // Support both Replit OAuth and email/password session authentication
  const replitUser = (req as any).user;
  const sessionUser = (req as any).session?.user;
  
  const isAuthenticated = 
    (replitUser?.id || replitUser?.claims?.sub) || // Replit OAuth
    (sessionUser?.id); // Email/password session
  
  if (!isAuthenticated) {
    return next();
  }

  const tokenFromHeader = req.get('X-CSRF-Token');
  const tokenFromCookie = req.cookies['csrf-token'];

  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id || 'anonymous',
      hasHeaderToken: !!tokenFromHeader,
      hasCookieToken: !!tokenFromCookie,
      tokensMatch: tokenFromHeader === tokenFromCookie
    });
    
    return res.status(403).json({
      error: {
        type: 'CSRFError',
        message: 'Invalid CSRF token',
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

// CSRF token endpoint - provides token for authenticated users
export const provideCsrfToken = (req: Request, res: Response) => {
  const csrfToken = generateCsrfToken();
  
  // Set CSRF token in HTTP-only cookie
  res.cookie('csrf-token', csrfToken, {
    httpOnly: false, // Must be readable by JavaScript for header inclusion
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  res.json({ csrfToken });
};

// Context-aware input sanitization without aggressive HTML escaping
export const safeSanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (unsafe: string): string => {
    // Only remove clearly dangerous patterns, preserve legitimate data
    return unsafe
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:(?!image\/)/gi, '') // Allow data:image/ for legitimate images
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized: any = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          // Context-aware sanitization without HTML escaping
          sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object') {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};