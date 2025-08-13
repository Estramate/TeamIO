/**
 * Super Administrator Management
 * Database-based elevated permissions for platform management
 */

import storage from "../storage";

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
  let user = req.user;
  
  // For email-authenticated users, create user object from session if not present
  if (!user && req.session?.user) {
    user = { 
      id: req.session.user.id, 
      email: req.session.user.email 
    };
  }
  
  if (!user && !req.session?.user) {
    console.log('🔒 Super Admin Auth Failed: No user in request or session');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Extract user ID and email for database lookup - handle both Replit and Email auth
  const userId = user.claims?.sub || user.id;
  const userEmail = user.email;
  
  // Also check session data for email-authenticated users
  let sessionUserId = null;
  let sessionUserEmail = null;
  
  if (req.session?.user) {
    sessionUserId = req.session.user.id;
    sessionUserEmail = req.session.user.email;
  }
  
  // Final user identification - prioritize session data for email auth
  const finalUserId = sessionUserId || userId;
  const finalUserEmail = sessionUserEmail || userEmail;
  
  console.log('🔒 Super Admin Check Request:', { 
    userId: finalUserId, 
    userEmail: finalUserEmail,
    sessionUserId,
    sessionUserEmail,
    hasUser: !!user, 
    hasClaims: !!user.claims,
    hasSession: !!req.session?.user,
    userKeys: Object.keys(user),
    sessionKeys: req.session ? Object.keys(req.session) : []
  });
  
  // Check super admin status using database
  (async () => {
    try {
      let isSuper = false;
      let debugInfo = '';
      
      if (finalUserId) {
        isSuper = await isSuperAdministrator(finalUserId);
        debugInfo = `User ID: ${finalUserId}, Super Admin: ${isSuper}`;
      } else if (finalUserEmail) {
        isSuper = await isSuperAdministratorByEmail(finalUserEmail);
        debugInfo = `Email: ${finalUserEmail}, Super Admin: ${isSuper}`;
      } else {
        debugInfo = 'No userId or userEmail found';
      }
      
      console.log('🔒 Super Admin Database Check:', debugInfo);
      
      if (!isSuper) {
        console.log('🔒 Super Admin Access DENIED for:', finalUserId || finalUserEmail);
        return res.status(403).json({ 
          error: 'Super administrator access required',
          message: 'This action requires super administrator privileges' 
        });
      }
      
      console.log('🔒 Super Admin Access GRANTED for:', finalUserId || finalUserEmail);
      next();
    } catch (error) {
      console.error('🔒 Error in requiresSuperAdmin middleware:', error);
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