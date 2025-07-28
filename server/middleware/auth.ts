import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { storage } from '../storage';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
      selectedClub?: number;
    }
  }
}

/**
 * Basic authentication check - requires user to be logged in
 */
export const requiresAuth = (req: any, res: Response, next: NextFunction) => {
  if (!req.user?.id && !req.user?.claims?.sub) {
    logger.warn('Unauthorized access attempt', { 
      path: req.path, 
      method: req.method,
      ip: req.ip 
    });
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

/**
 * Requires user to be a member of the specified club
 */
export const requiresClubMembership = async (req: any, res: Response, next: NextFunction) => {
  try {
    const clubId = parseInt(req.params.clubId || req.body.clubId || req.query.clubId as string);
    const userId = req.user?.id || req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!clubId) {
      return res.status(400).json({ message: 'Club ID required' });
    }

    // Check if user is a member of the club
    const membership = await storage.getClubMembership(clubId, userId);
    
    if (!membership || membership.status !== 'active') {
      logger.warn('Unauthorized club access attempt', {
        userId,
        clubId,
        membershipStatus: membership?.status || 'none'
      });
      return res.status(403).json({ message: 'Club membership required' });
    }

    // Store club ID for use in route handlers
    req.selectedClub = clubId;
    next();
  } catch (error) {
    logger.error('Error checking club membership', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Requires user to be a club administrator (club-administrator or obmann role)
 */
export const requiresClubAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const clubId = parseInt(req.params.clubId || req.body.clubId || req.query.clubId as string);
    const userId = req.user?.id || req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!clubId) {
      return res.status(400).json({ message: 'Club ID required' });
    }

    // Check if user has admin rights in the club
    const membership = await storage.getClubMembership(clubId, userId);
    
    if (!membership || membership.status !== 'active') {
      return res.status(403).json({ message: 'Club membership required' });
    }

    // Get user's role in the club
    const role = await storage.getRoleById(membership.roleId);
    
    if (!role || !['club-administrator', 'obmann'].includes(role.name)) {
      logger.warn('Unauthorized admin access attempt', {
        userId,
        clubId,
        roleName: role?.name || 'none'
      });
      return res.status(403).json({ message: 'Club administrator privileges required' });
    }

    req.selectedClub = clubId;
    next();
  } catch (error) {
    logger.error('Error checking club admin privileges', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Requires user to be a super administrator
 */
export const requiresSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is a super admin
    const user = await storage.getUserById(userId);
    
    if (!user || !user.isSuperAdmin) {
      logger.warn('Unauthorized super admin access attempt', {
        userId,
        path: req.path
      });
      return res.status(403).json({ message: 'Super administrator privileges required' });
    }

    next();
  } catch (error) {
    logger.error('Error checking super admin privileges', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Optional authentication - allows both authenticated and unauthenticated users
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Always proceed, whether authenticated or not
  next();
};