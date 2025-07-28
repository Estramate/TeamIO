/**
 * Super Administrator Management
 * Database-based elevated permissions for platform management
 */

import { storage } from "../storage";

/**
 * Check if a user is a super administrator by database lookup
 */
export async function isSuperAdministrator(userId: string): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    return user?.isSuperAdmin || false;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

/**
 * Check if a user email is a super administrator (for email auth)
 */
export async function isSuperAdministratorByEmail(email: string): Promise<boolean> {
  try {
    const user = await storage.getUserByEmail(email);
    return user?.isSuperAdmin || false;
  } catch (error) {
    console.error('Error checking super admin status by email:', error);
    return false;
  }
}

/**
 * Grant super administrator privileges to a user
 */
export async function grantSuperAdminAccess(userId: string, grantedByUserId: string): Promise<boolean> {
  try {
    return await storage.setSuperAdminStatus(userId, true, grantedByUserId);
  } catch (error) {
    console.error('Error granting super admin access:', error);
    return false;
  }
}

/**
 * Revoke super administrator privileges from a user
 */
export async function revokeSuperAdminAccess(userId: string): Promise<boolean> {
  try {
    return await storage.setSuperAdminStatus(userId, false);
  } catch (error) {
    console.error('Error revoking super admin access:', error);
    return false;
  }
}

/**
 * Get all super administrators
 */
export async function getAllSuperAdministrators(): Promise<any[]> {
  try {
    return await storage.getAllSuperAdmins();
  } catch (error) {
    console.error('Error fetching super administrators:', error);
    return [];
  }
}

/**
 * Middleware to require super administrator access (async)
 */
export function requiresSuperAdmin(req: any, res: any, next: any) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Extract user ID for database lookup
  const userId = user.claims?.sub || user.id;
  const userEmail = user.email;
  
  // Check super admin status using database
  (async () => {
    try {
      let isSuper = false;
      
      if (userId) {
        isSuper = await isSuperAdministrator(userId);
      } else if (userEmail) {
        isSuper = await isSuperAdministratorByEmail(userEmail);
      }
      
      if (!isSuper) {
        return res.status(403).json({ 
          error: 'Super administrator access required',
          message: 'This action requires super administrator privileges' 
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in requiresSuperAdmin middleware:', error);
      res.status(500).json({ error: 'Internal server error during authorization' });
    }
  })();
}

/**
 * Check if current user has super admin privileges (async)
 */
export async function hasSuperAdminAccess(user: any): Promise<boolean> {
  if (!user) return false;
  
  const userId = user.claims?.sub || user.id;
  const userEmail = user.email;
  
  try {
    if (userId) {
      return await isSuperAdministrator(userId);
    } else if (userEmail) {
      return await isSuperAdministratorByEmail(userEmail);
    }
    return false;
  } catch (error) {
    console.error('Error checking super admin access:', error);
    return false;
  }
}