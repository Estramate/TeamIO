/**
 * Super Administrator Management
 * Handles elevated permissions for platform management
 */

// Super administrators with full platform access
const SUPER_ADMINISTRATORS = [
  'koglerf@gmail.com'
];

/**
 * Check if a user email is a super administrator
 */
export function isSuperAdministrator(email: string): boolean {
  return SUPER_ADMINISTRATORS.includes(email.toLowerCase());
}

/**
 * Check if a user ID is a super administrator (for Replit auth)
 */
export function isSuperAdministratorById(userId: string): boolean {
  // For Replit user ID 45190315 (koglerf@gmail.com)
  return userId === '45190315';
}

/**
 * Get all super administrator emails
 */
export function getSuperAdministrators(): string[] {
  return [...SUPER_ADMINISTRATORS];
}

/**
 * Middleware to require super administrator access
 */
export function requiresSuperAdmin(req: any, res: any, next: any) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check by email (for email auth) or user ID (for Replit auth)
  const isSuper = (user.email && isSuperAdministrator(user.email)) || 
                  (user.claims?.sub && isSuperAdministratorById(user.claims.sub));
  
  if (!isSuper) {
    return res.status(403).json({ 
      error: 'Super administrator access required',
      message: 'This action requires super administrator privileges' 
    });
  }
  
  next();
}

/**
 * Check if current user has super admin privileges
 */
export function hasSuperAdminAccess(user: any): boolean {
  if (!user) return false;
  
  return (user.email && isSuperAdministrator(user.email)) || 
         (user.claims?.sub && isSuperAdministratorById(user.claims.sub));
}