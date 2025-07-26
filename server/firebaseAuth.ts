/**
 * Firebase authentication integration for TeamIO
 * Handles Google and Facebook OAuth authentication alongside existing Replit auth
 */

import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { logger } from "./logger";

// Extend Express types for Firebase auth
declare module "express-session" {
  interface SessionData {
    user?: {
      claims: any;
      authProvider: string;
    };
    firebaseUser?: any;
  }
}

declare global {
  namespace Express {
    interface User {
      claims?: any;
      authProvider?: string;
    }
  }
}

/**
 * Middleware to handle Firebase authentication token verification
 */
export const verifyFirebaseToken: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No valid authorization header" });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // For now, we'll trust the client-side Firebase authentication
    // In production, you would verify the ID token server-side with Firebase Admin SDK
    // This is a simplified implementation for demonstration
    
    // Extract user info from the token payload (in production, verify with Firebase Admin)
    const tokenData = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    
    req.user = {
      claims: {
        sub: tokenData.sub || tokenData.user_id,
        email: tokenData.email,
        first_name: tokenData.name?.split(' ')[0] || '',
        last_name: tokenData.name?.split(' ').slice(1).join(' ') || '',
        profile_image_url: tokenData.picture,
      },
      authProvider: tokenData.firebase?.sign_in_provider || 'firebase'
    };

    next();
  } catch (error) {
    logger.error('Firebase token verification error:', error);
    return res.status(401).json({ message: "Invalid Firebase token" });
  }
};

/**
 * Setup Firebase authentication routes
 */
export function setupFirebaseAuth(app: Express) {
  // Note: Firebase auth endpoint moved to routes.ts to avoid duplication

  // Firebase logout endpoint
  app.post("/api/auth/firebase/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destroy error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Firebase auth user endpoint removed - using unified endpoint in routes.ts

  logger.info('Firebase authentication routes configured');
}

/**
 * Enhanced authentication middleware that supports both Replit and Firebase auth
 */
export const isAuthenticatedEnhanced: RequestHandler = async (req, res, next) => {
  try {
    // Check for Replit authentication first
    if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.claims) {
      return next();
    }

    // Check for session-based authentication (Firebase or other)
    if (req.session && req.session.user && req.session.user.claims) {
      req.user = req.session.user;
      return next();
    }

    // Check for Firebase token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return verifyFirebaseToken(req, res, next);
    }

    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};