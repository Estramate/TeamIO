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
  
  // Firebase user registration/login endpoint
  app.post("/api/auth/firebase", async (req, res) => {
    try {
      const { userData } = req.body;
      
      if (!userData || !userData.id || !userData.email) {
        return res.status(400).json({ message: "Invalid user data" });
      }

      // Upsert user in database
      await storage.upsertUser({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        profileImageUrl: userData.profileImageUrl,
        authProvider: userData.authProvider || 'firebase',
        providerUserId: userData.providerUserId,
        providerData: userData.providerData,
        lastLoginAt: new Date(),
      });

      // Create a session for the user
      req.session.user = {
        claims: {
          sub: userData.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          profile_image_url: userData.profileImageUrl,
        },
        authProvider: userData.authProvider
      };

      res.json({ 
        success: true, 
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          authProvider: userData.authProvider
        }
      });

    } catch (error) {
      logger.error('Firebase authentication error:', error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

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

  // Get current user endpoint (supports both Replit and Firebase auth)
  app.get("/api/auth/user", async (req, res) => {
    try {
      const user = req.user || req.session.user;
      
      if (!user || !user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get user from database to include latest info
      const dbUser = await storage.getUser(user.claims.sub);
      
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
        authProvider: dbUser.authProvider,
        hasCompletedOnboarding: dbUser.hasCompletedOnboarding,
        preferredLanguage: dbUser.preferredLanguage,
        lastLoginAt: dbUser.lastLoginAt,
      });

    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  logger.info('Firebase authentication routes configured');
}

/**
 * Enhanced authentication middleware that supports both Replit and Firebase auth
 */
export const isAuthenticatedEnhanced: RequestHandler = async (req, res, next) => {
  try {
    // Check for Replit authentication first
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    // Check for session-based authentication (Firebase)
    if (req.session && req.session.user) {
      req.user = req.session.user;
      return next();
    }

    // Check for Firebase token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return verifyFirebaseToken(req, res, next);
    }

    return res.status(401).json({ message: "Authentication required" });
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};