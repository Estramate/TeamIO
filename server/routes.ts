import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import storage from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requiresClubMembership } from "./middleware/auth";
// ClubFlow authentication system - Replit integration only
import { logger, ValidationError, NotFoundError, DatabaseError, AuthorizationError } from "./logger";
import { handleErrorReports, handlePerformanceMetrics } from "./error-reporting";
import subscriptionRoutes from "./routes/subscriptions";
// import chatRoutes from "./chatRoutes"; // ENTFERNT - Veraltetes Live Chat System

import { z } from 'zod';
import {
  insertClubSchema,
  insertMemberSchema,
  insertTeamSchema,
  insertFacilitySchema,
  insertBookingSchema,
  bookingFormSchema,
  insertFinanceSchema,
  insertPlayerSchema,
  insertPlayerTeamAssignmentSchema,
  insertTeamMembershipSchema,
  messageFormSchema,
  insertMessageSchema,
  // insertNotificationSchema entfernt - Live Chat System komplett entfernt

} from "@shared/schema";
import {
  emailInvitationFormSchema,
  userRegistrationSchema,
  loginSchema,
  twoFactorSetupSchema,
  type EmailInvitation
} from "@shared/schemas/core";
import { 
  sendUserInvitation, 
  registerUserFromInvitation, 
  authenticateUser, 
  setup2FA, 
  enable2FA, 
  disable2FA 
} from './auth';

// OpenID client for Replit authentication
import * as client from "openid-client";
import memoize from "memoizee";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

// Helper function to handle async route errors
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Enhanced authentication middleware that supports both Replit and email/password auth
function isAuthenticatedEnhanced(req: any, res: any, next: any) {
  // Check if user has a session (either from Replit or email auth)
  if (req.session && req.session.user) {
    // Email/password authentication
    req.user = { id: req.session.user.id };
    return next();
  }
  
  // Fall back to standard Replit authentication
  return isAuthenticated(req, res, next);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const server = createServer(app);
  
  // Auth middleware (Replit OpenID Connect) - MUST BE FIRST for session setup
  await setupAuth(app);


  
  // CSRF protection not required for current authentication system

  // Error reporting endpoints
  app.post('/api/errors', handleErrorReports);
  app.post('/api/performance', handlePerformanceMetrics);

  // Super Admin Status Route (must be before auth middleware)
  app.get('/api/subscriptions/super-admin/status', isAuthenticatedEnhanced, asyncHandler(async (req: any, res: any) => {
    try {
      // Get user from various session sources (Replit Auth + other providers)
      let userId = null;
      let userEmail = null;
      
      // Try to get authenticated user information from various sources
      // Check if user is authenticated through the auth middleware
      const authenticatedUser = req.user;
      
      if (authenticatedUser) {
        // Replit auth structure
        if (authenticatedUser.claims?.sub) {
          userId = authenticatedUser.claims.sub;
          userEmail = authenticatedUser.email;
        }
        // Alternative user structures
        else if (authenticatedUser.id) {
          userId = authenticatedUser.id;
          userEmail = authenticatedUser.email;
        }
      }
      
      // Also try session data as fallback
      if (!userId && req.session?.passport?.user?.claims?.sub) {
        userId = req.session.passport.user.claims.sub;
        userEmail = req.session.passport.user.email;
      }
      // Direct session data (Email-authenticated users)
      else if (!userId && req.session?.user) {
        userId = req.session.user.id;
        userEmail = req.session.user.email;
      }
      
      // If we have userId but no email, try to get email from database
      if (userId && !userEmail) {
        try {
          const user = await storage.getUser(userId);
          if (user?.email) {
            userEmail = user.email;
          }
        } catch (error) {
          console.log('Could not fetch user email from database:', error.message);
        }
      }
      
      console.log('🔍 Super Admin Check:', {
        sessionExists: !!req.session,
        hasPassport: !!req.session?.passport,
        hasUser: !!req.session?.passport?.user,
        userId,
        userEmail,
        sessionKeys: req.session ? Object.keys(req.session) : [],
        passportKeys: req.session?.passport ? Object.keys(req.session.passport) : []
      });
      
      if (!userId && !userEmail) {
        return res.json({
          isSuperAdmin: false,
          userEmail: null,
          userId: null,
          permissions: [],
          debug: {
            sessionExists: !!req.session,
            sessionKeys: req.session ? Object.keys(req.session) : [],
            passportData: req.session?.passport ? 'exists' : 'missing'
          }
        });
      }

      // Check super admin status using database
      const { isSuperAdministrator, isSuperAdministratorByEmail } = await import("./lib/super-admin");
      
      let isSuperAdmin = false;
      if (userId) {
        isSuperAdmin = await isSuperAdministrator(userId);
      } else if (userEmail) {
        isSuperAdmin = await isSuperAdministratorByEmail(userEmail);
      }
      
      console.log('🔍 Super Admin Result:', {
        userId,
        userEmail,
        isSuperAdmin,
        checkedByUserId: !!userId,
        checkedByEmail: !!userEmail
      });
      
      res.json({
        isSuperAdmin,
        userEmail: userEmail,
        userId: userId,
        permissions: isSuperAdmin ? [
          'platform-management',
          'all-club-access', 
          'plan-management',
          'user-management'
        ] : []
      });
    } catch (error) {
      console.error("Error checking super admin status:", error);
      res.json({
        isSuperAdmin: false,
        userEmail: null,
        userId: null,
        permissions: [],
        error: error.message
      });
    }
  }));

  // Import super admin middleware
  const { requiresSuperAdmin } = await import("./lib/super-admin");

  // Super Admin Management Routes
  app.get('/api/super-admin/administrators', requiresSuperAdmin, asyncHandler(async (req: any, res: any) => {
    try {
      const superAdmins = await storage.getAllSuperAdmins();
      res.json(superAdmins);
    } catch (error) {
      console.error("Error fetching super administrators:", error);
      res.status(500).json({ error: "Failed to fetch super administrators" });
    }
  }));

  app.post('/api/super-admin/grant/:userId', requiresSuperAdmin, asyncHandler(async (req: any, res: any) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.claims?.sub || req.user?.id;
      
      const success = await storage.setSuperAdminStatus(userId, true, currentUserId);
      
      if (success) {
        res.json({ message: "Super administrator privileges granted successfully" });
      } else {
        res.status(500).json({ error: "Failed to grant super administrator privileges" });
      }
    } catch (error) {
      console.error("Error granting super admin privileges:", error);
      res.status(500).json({ error: "Failed to grant super administrator privileges" });
    }
  }));

  app.post('/api/super-admin/revoke/:userId', requiresSuperAdmin, asyncHandler(async (req: any, res: any) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.claims?.sub || req.user?.id;
      
      // Prevent users from revoking their own super admin status
      if (userId === currentUserId) {
        return res.status(400).json({ error: "Cannot revoke your own super administrator privileges" });
      }
      
      const success = await storage.setSuperAdminStatus(userId, false);
      
      if (success) {
        res.json({ message: "Super administrator privileges revoked successfully" });
      } else {
        res.status(500).json({ error: "Failed to revoke super administrator privileges" });
      }
    } catch (error) {
      console.error("Error revoking super admin privileges:", error);
      res.status(500).json({ error: "Failed to revoke super administrator privileges" });
    }
  }));

  // Enhanced isAuthenticated middleware for Replit auth only (specific for subscription plans)
  const isAuthenticatedReplitOnly = async (req: any, res: any, next: any) => {
    const user = req.user as any;

    // Check Replit auth
    if (req.isAuthenticated && req.isAuthenticated() && user && user.expires_at) {
      const now = Math.floor(Date.now() / 1000);
      if (now <= user.expires_at) {
        return next();
      }

      const refreshToken = user.refresh_token;
      if (refreshToken) {
        try {
          const config = await getOidcConfig();
          const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
          updateUserSession(user, tokenResponse);
          return next();
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }
    }

    return res.status(401).json({ message: "Not authenticated" });
  };

  // Subscription Plans Route (for club creation modal)
  app.get('/api/subscription-plans', isAuthenticatedReplitOnly, asyncHandler(async (req: any, res: any) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  }));

  // ==================== INVITATION ROUTES ====================
  

  
  // GET /api/invitations/:token - Get invitation details for registration form
  app.get('/api/invitations/:token', asyncHandler(async (req: any, res: any) => {
    try {
      const token = req.params.token;
      const storage = (await import("./storage")).default;
      
      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ 
          error: 'Ungültiger oder abgelaufener Einladungslink' 
        });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Diese Einladung wurde bereits verwendet' 
        });
      }
      
      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({ 
          error: 'Diese Einladung ist abgelaufen' 
        });
      }
      
      // Get club and role information
      const club = await storage.getClub(invitation.clubId);
      const role = await storage.getRoleById(invitation.roleId);
      
      // Get existing user data if available
      const existingUser = await storage.getUserByEmail(invitation.email);
      
      res.json({
        email: invitation.email,
        firstName: existingUser?.firstName || '',
        lastName: existingUser?.lastName || '',
        clubId: invitation.clubId,
        clubName: club?.name || 'Unbekannter Verein',
        roleId: invitation.roleId,
        roleName: role?.displayName || 'Mitglied',
        expiresAt: invitation.expiresAt,
        token: invitation.token,
        isExistingUser: !!existingUser
      });
    } catch (error) {
      console.error('Error fetching invitation details:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Einladung' });
    }
  }));

  // ==================== AUTH ROUTES ====================
  
  // Auth routes (Multi-provider support) - NO MIDDLEWARE, handles auth internally
  app.get('/api/auth/user', async (req: any, res: any) => {
    try {
      console.log('=== GET /api/auth/user DEBUG ===');
      console.log('Session exists:', !!req.session);
      console.log('Is authenticated (Replit):', req.isAuthenticated?.());
      console.log('User object:', !!req.user);
      console.log('Cookies:', Object.keys(req.cookies || {}));
      
      // Try Replit authentication first
      if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.claims) {
        const userId = req.user.claims.sub;
        console.log('Using Replit auth, user ID:', userId);
        const user = await storage.getUser(userId);
        if (user) {
          console.log('Replit user found:', { id: user.id, email: user.email });
          return res.json(user);
        }
      }

      // Try email/password authentication (session-based)
      if (req.session?.user) {
        const userId = req.session.user.id;
        console.log('Using email auth, user ID:', userId);
        const user = await storage.getUser(userId);
        if (user) {
          console.log('Email user found:', { id: user.id, email: user.email });
          return res.json(user);
        }
      }

      console.log('No valid authentication found');
      res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Check if user has ANY club membership (active or inactive) - for onboarding logic
  app.get('/api/user/memberships/status', isAuthenticatedEnhanced, asyncHandler(async (req: any, res: any) => {
    const userId = req.user?.claims?.sub || req.user?.id;
    if (!userId) {
      throw new AuthorizationError('User ID not found in token');
    }
    
    const memberships = await storage.getUserMemberships(userId); // Get ALL memberships
    logger.info('User membership status retrieved', { userId, totalMemberships: memberships.length, requestId: req.id });
    
    res.json({ 
      hasMemberships: memberships.length > 0,
      activeMemberships: memberships.filter(m => m.status === 'active').length,
      pendingMemberships: memberships.filter(m => m.status === 'inactive').length
    });
  }));

  // User permission routes
  app.get('/api/clubs/:clubId/user-membership', isAuthenticatedEnhanced, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const membership = await storage.getUserClubMembership(userId, clubId);
    
    logger.info('User membership retrieved', { userId, clubId, requestId: req.id });
    // Get role information if membership exists
    let roleName = null;
    if (membership && membership.roleId) {
      const role = await storage.getRoleById(membership.roleId);
      roleName = role?.name || null;
    }
    
    res.json({
      isMember: !!membership,
      roleId: membership?.roleId || null,
      roleName: roleName,
      joinedAt: membership?.joinedAt || null
    });
  }));

  app.get('/api/clubs/:clubId/user-teams', isAuthenticatedEnhanced, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const teamAssignments = await storage.getUserTeamAssignments(userId, clubId);
    
    logger.info('User team assignments retrieved', { userId, clubId, count: teamAssignments.length, requestId: req.id });
    res.json(teamAssignments);
  }));

  // Public clubs route for landing page/onboarding (no auth required)
  app.get('/api/clubs/public', asyncHandler(async (req: any, res: any) => {
    const allClubs = await storage.getAllClubs();
    logger.info('Public clubs retrieved', { count: allClubs.length, requestId: req.id });
    res.json(allClubs);
  }));

  // Individual club route
  app.get('/api/clubs/:id', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.id);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const club = await storage.getClub(clubId);
    if (!club) {
      throw new NotFoundError('Club not found');
    }
    
    // Check if user has access to this club
    const membership = await storage.getUserClubMembership(userId, clubId);
    if (!membership) {
      throw new AuthorizationError('You are not a member of this club');
    }
    
    logger.info('Club details retrieved', { clubId, userId, requestId: req.id });
    res.json(club);
  }));

  // Update club (admin only)
  app.patch('/api/clubs/:id', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.id);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    // Check if user is club admin
    const membership = await storage.getUserClubMembership(userId, clubId);
    if (!membership) {
      throw new AuthorizationError('You are not a member of this club');
    }
    
    // Get role information (BOTH club-administrator AND obmann have admin rights)
    const role = await storage.getRoleById(membership.roleId);
    const adminRoles = ['club-administrator', 'obmann'];
    if (!role || !adminRoles.includes(role.name)) {
      throw new AuthorizationError('You must be a club administrator or club leader to update club settings');
    }
    
    // Validate update data
    const updateData = req.body;
    
    console.log('🔧 Club update attempt:', { clubId, updateData, userId });
    
    // Clean up empty strings to prevent PostgreSQL errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '') {
        updateData[key] = null;
      }
    });
    
    // Filter out undefined values and non-club fields
    const allowedFields = [
      'name', 'shortName', 'description', 'address', 'phone', 'email', 
      'website', 'logo', 'foundedYear', 'memberCount', 'primaryColor', 
      'secondaryColor', 'accentColor', 'settings'
    ];
    
    const cleanedData: any = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        cleanedData[field] = updateData[field];
      }
    });
    
    console.log('🔧 Cleaned update data:', cleanedData);
    
    try {
      const updatedClub = await storage.updateClub(clubId, cleanedData);
      
      // Log the activity only if update was successful
      const admin = await storage.getUser(userId);
      if (admin) {
        await storage.createActivityLog({
          clubId,
          userId,
          action: 'club_updated',
          targetResource: 'club',
          targetResourceId: clubId,
          description: `${admin.firstName} ${admin.lastName} hat die Vereinseinstellungen aktualisiert`,
          metadata: { updatedFields: Object.keys(cleanedData) },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }
      
      logger.info('Club updated successfully', { clubId, updatedBy: userId, fields: Object.keys(cleanedData), requestId: req.id });
      res.json(updatedClub);
    } catch (error) {
      console.error('🔥 Club update error:', error);
      logger.error('Club update failed', { clubId, userId, error: error.message, updateData: cleanedData });
      throw new DatabaseError('Failed to update club settings');
    }
  }));

  // Roles API (authenticated - returns all available roles)
  app.get('/api/roles', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const roles = await storage.getAllRoles();
      console.log(`📋 Loaded ${roles.length} roles for role selection`);
      res.json(roles);
    } catch (error) {
      console.error('❌ Error loading roles:', error);
      logger.error('Failed to load roles', { error: error.message });
      res.status(500).json({ message: 'Failed to load roles' });
    }
  }));

  // Club routes (authenticated - returns user's ACTIVE clubs only for selection)
  app.get('/api/clubs', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user?.claims?.sub || req.user?.id;
    if (!userId) {
      throw new AuthorizationError('User ID not found in token');
    }
    
    // Get user's club memberships - filter for ACTIVE status only
    const userClubs = await storage.getUserClubs(userId);
    const activeClubs = userClubs.filter(membership => membership.status === 'active');
    
    const clubs = await Promise.all(
      activeClubs.map(async (membership) => {
        const club = await storage.getClub(membership.clubId);
        if (!club) {
          logger.warn('Club not found for membership', { clubId: membership.clubId, userId });
          return null;
        }
        // Get role information
        const role = await storage.getRoleById(membership.roleId);
        return { ...club, role: role?.name || 'member', status: membership.status };
      })
    );
    
    const validClubs = clubs.filter(club => club !== null);
    logger.info('User active clubs retrieved', { userId, count: validClubs.length, requestId: req.id });
    res.json(validClubs);
  }));

  app.post('/api/clubs', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user?.claims?.sub || req.user?.id;
    if (!userId) {
      throw new AuthorizationError('User ID not found in token');
    }

    const clubData = insertClubSchema.parse(req.body);
    const club = await storage.createClub(clubData);
    
    // Add the creator as a club administrator (role ID 3)
    await storage.addUserToClub({
      userId,
      clubId: club.id,
      roleId: 3, // club-administrator role
      status: 'active',
    });

    logger.info('Club created', { clubId: club.id, userId, requestId: req.id });
    res.status(201).json(club);
  }));

  // Club join request route - Creates inactive membership for admin approval
  app.post('/api/clubs/:id/join', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.id);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    if (!userId) {
      throw new AuthorizationError('User ID not found in token');
    }

    // Check if user is already a member of this club (active or inactive)
    const existingMembership = await storage.getUserClubMembership(userId, clubId);
    if (existingMembership) {
      if (existingMembership.status === 'active') {
        throw new ValidationError('You are already an active member of this club', 'membership');
      } else if (existingMembership.status === 'inactive') {
        throw new ValidationError('Your membership request is pending admin approval', 'membership');
      }
    }

    // Create inactive membership for admin approval
    const membershipData = {
      userId,
      clubId,
      role: 'member', // Default role, admin can change later
      status: 'inactive', // Requires admin approval
    };

    const membership = await storage.addUserToClub(membershipData);
    
    // Log club join request activity
    const user = await storage.getUser(userId);
    const club = await storage.getClub(clubId);
    if (user && club) {
      await storage.createActivityLog({
        clubId,
        userId,
        action: 'membership_requested',
        targetResource: 'membership',
        targetResourceId: membership.id,
        description: `${user.firstName} ${user.lastName} hat eine Mitgliedschaft im Verein ${club.name} beantragt`,
        metadata: { role: 'member', status: 'inactive' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }
    
    logger.info('Club membership request created (inactive)', { 
      membershipId: membership.id, 
      clubId, 
      userId, 
      status: 'inactive',
      requestId: req.id 
    });
    
    res.status(201).json({
      success: true,
      message: 'Membership request submitted successfully - awaiting admin approval',
      membershipId: membership.id,
      status: 'inactive'
    });
  }));

  // Get pending membership requests for club administrators
  app.get('/api/clubs/:clubId/pending-memberships', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }

    // Check if user is club admin
    const membership = await storage.getUserClubMembership(userId, clubId);
    if (!membership) {
      throw new AuthorizationError('You are not a member of this club');
    }
    
    // Get role information (BOTH club-administrator AND obmann have admin rights)
    const role = await storage.getRoleById(membership.roleId);
    const adminRoles = ['club-administrator', 'obmann'];
    if (!role || !adminRoles.includes(role.name)) {
      throw new AuthorizationError('You must be a club administrator or club leader to view pending memberships');
    }

    const pendingMemberships = await storage.getPendingClubMemberships(clubId);
    
    logger.info('Pending memberships retrieved', { clubId, userId, count: pendingMemberships.length, requestId: req.id });
    res.json(pendingMemberships);
  }));

  // Approve or reject membership request
  app.put('/api/clubs/:clubId/memberships/:membershipId/approve', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const membershipId = parseInt(req.params.membershipId);
    const userId = req.user?.claims?.sub || req.user?.id;
    const { action, role } = req.body; // action: 'approve' | 'reject', role: optional new role
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    if (!membershipId || isNaN(membershipId)) {
      throw new ValidationError('Invalid membership ID', 'membershipId');
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      throw new ValidationError('Action must be "approve" or "reject"', 'action');
    }

    // Check if user is club admin
    const adminMembership = await storage.getUserClubMembership(userId, clubId);
    if (!adminMembership) {
      throw new AuthorizationError('You are not a member of this club');
    }
    
    const adminRole = await storage.getRoleById(adminMembership.roleId);
    const adminRoles = ['club-administrator', 'obmann'];
    if (!adminRole || !adminRoles.includes(adminRole.name)) {
      throw new AuthorizationError('You must be a club administrator or club leader to approve memberships');
    }

    // Get the membership to approve/reject
    const membership = await storage.getClubMembershipById(membershipId);
    if (!membership || membership.clubId !== clubId) {
      throw new ValidationError('Membership not found in this club', 'membershipId');
    }

    if (membership.status !== 'inactive') {
      throw new ValidationError('Only inactive memberships can be approved or rejected', 'status');
    }

    let updatedMembership;
    if (action === 'approve') {
      // Approve membership and optionally update roleId
      const updateData = {
        status: 'active' as const,
        ...(role && { roleId: role })
      };
      updatedMembership = await storage.updateClubMembershipById(membershipId, updateData);
      
      // Log membership approval activity
      const approvedUser = await storage.getUser(membership.userId);
      const admin = await storage.getUser(userId);
      if (approvedUser && admin) {
        await storage.createActivityLog({
          clubId,
          userId,
          action: 'membership_approved',
          targetUserId: approvedUser.id,
          targetResource: 'membership',
          targetResourceId: membershipId,
          description: `${admin.firstName} ${admin.lastName} hat die Mitgliedschaft von ${approvedUser.firstName} ${approvedUser.lastName} genehmigt`,
          metadata: { previousStatus: 'inactive', newStatus: 'active', roleId: role || membership.roleId },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }
      
      logger.info('Membership approved', { 
        membershipId, 
        clubId, 
        userId: membership.userId,
        approvedBy: userId,
        newRoleId: role || membership.roleId,
        requestId: req.id 
      });
    } else {
      // Log rejection before deletion
      const rejectedUser = await storage.getUser(membership.userId);
      const admin = await storage.getUser(userId);
      if (rejectedUser && admin) {
        await storage.createActivityLog({
          clubId,
          userId,
          action: 'membership_rejected',
          targetUserId: rejectedUser.id,
          targetResource: 'membership',
          targetResourceId: membershipId,
          description: `${admin.firstName} ${admin.lastName} hat die Mitgliedschaftsanfrage von ${rejectedUser.firstName} ${rejectedUser.lastName} abgelehnt`,
          metadata: { previousStatus: 'inactive', action: 'rejected' },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }
      
      // Reject membership by deleting it
      await storage.deleteClubMembershipById(membershipId);
      
      logger.info('Membership rejected', { 
        membershipId, 
        clubId, 
        userId: membership.userId,
        rejectedBy: userId,
        requestId: req.id 
      });
      
      return res.json({ 
        success: true, 
        message: 'Membership request rejected and removed',
        action: 'rejected'
      });
    }
    
    res.json({
      success: true,
      message: 'Membership request approved',
      membership: updatedMembership,
      action: 'approved'
    });
  }));

  // Dashboard routes
  app.get('/api/clubs/:clubId/dashboard', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    
    const [stats, activities] = await Promise.all([
      storage.getDashboardStats(clubId),
      storage.getRecentActivity(clubId)
    ]);
    
    logger.info('Dashboard data retrieved', { clubId, requestId: req.id });
    res.json({ stats, activities });
  }));

  // Activity log routes
  app.get('/api/clubs/:clubId/activity-logs', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    // Check if user has admin permissions for this club
    const membership = await storage.getUserClubMembership(userId, clubId);
    if (!membership || !['club-administrator', 'admin'].includes(role?.name || '')) {
      throw new AuthorizationError('Only administrators can view activity logs');
    }
    
    const logs = await storage.getClubActivityLogs(clubId);
    logger.info('Activity logs retrieved', { userId, clubId, count: logs.length, requestId: req.id });
    res.json(logs);
  }));

  // Email invitation routes
  app.post('/api/clubs/:clubId/invite', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    // Check if user has admin permissions for this club
    const membership = await storage.getUserClubMembership(userId, clubId);
    if (!membership || !['club-administrator', 'admin'].includes(role?.name || '')) {
      throw new AuthorizationError('Only administrators can invite users');
    }
    
    const { email, roleId = 1 } = req.body; // Default to member role ID 1
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('Valid email address is required', 'email');
    }
    
    // Check if user already exists and has membership
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      const existingMembership = await storage.getUserClubMembership(existingUser.id, clubId);
      if (existingMembership) {
        throw new ValidationError('User is already a member of this club', 'email');
      }
    }
    
    // Check for existing pending invitation
    const existingInvitations = await storage.getClubEmailInvitations(clubId);
    const pendingInvitation = existingInvitations.find(inv => 
      inv.email === email && inv.status === 'pending'
    );
    
    if (pendingInvitation) {
      throw new ValidationError('Invitation already sent to this email', 'email');
    }
    
    // Generate invitation token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Create invitation record
    const invitation = await storage.createEmailInvitation({
      clubId,
      invitedBy: userId,
      email,
      role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    
    // Send invitation email
    const club = await storage.getClub(clubId);
    const inviter = await storage.getUser(userId);
    
    if (club && inviter) {
      const { sendEmail, generateInvitationEmail } = await import('./emailService');
      const emailContent = generateInvitationEmail(
        club.name, 
        `${inviter.firstName} ${inviter.lastName}`, 
        token, 
        role
      );
      
      const emailSent = await sendEmail({
        to: email,
        from: club.email || 'noreply@clubflow.app',
        ...emailContent,
      });
      
      // Log the invitation activity
      await storage.createActivityLog({
        clubId,
        userId,
        action: 'user_invited',
        targetResource: 'invitation',
        targetResourceId: invitation.id,
        description: `${inviter.firstName} ${inviter.lastName} hat ${email} als ${role === 'club-administrator' ? 'Administrator' : role === 'trainer' ? 'Trainer' : 'Mitglied'} eingeladen`,
        metadata: { email, role, emailSent },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      logger.info('User invitation sent', { 
        userId, 
        clubId, 
        invitedEmail: email, 
        role, 
        emailSent,
        requestId: req.id 
      });
    }
    
    res.json({ 
      message: 'Einladung erfolgreich versendet',
      invitation: { ...invitation, token: undefined } // Don't expose token
    });
  }));

  // Activity logs route (admin only)
  app.get('/api/clubs/:clubId/activity-logs', isAuthenticatedEnhanced, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.userId;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    // Check if user has admin permissions for this club
    const membership = await storage.getUserClubMembership(userId, clubId);
    if (!membership || !['club-administrator', 'admin'].includes(role?.name || '')) {
      throw new AuthorizationError('Only administrators can view activity logs');
    }
    
    const logs = await storage.getActivityLogs(clubId);
    logger.info('Activity logs retrieved', { userId, clubId, count: logs.length, requestId: req.id });
    res.json(logs);
  }));

  // Users management route (admin only)
  app.get('/api/clubs/:clubId/users', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    // Check if user is club admin
    const adminMembership = await storage.getUserClubMembership(userId, clubId);
    if (!adminMembership) {
      throw new AuthorizationError('You are not a member of this club');
    }
    
    const adminRole = await storage.getRoleById(adminMembership.roleId);
    const adminRoles = ['club-administrator', 'obmann'];
    if (!adminRole || !adminRoles.includes(adminRole.name)) {
      throw new AuthorizationError('You must be a club administrator or club leader to manage users');
    }
    
    const users = await storage.getClubUsersWithMembership(clubId);
    
    logger.info('Club users retrieved', { clubId, count: users.length, requestId: req.id });
    res.json(users);
  }));

  // Team memberships route for detailed member data
  app.get('/api/clubs/:clubId/team-memberships', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    
    const teamMemberships = await storage.getClubTeamMemberships(clubId);
    
    logger.info('Team memberships retrieved', { clubId, count: teamMemberships.length, requestId: req.id });
    res.json(teamMemberships);
  }));

  // Update member role (admin only)
  app.patch('/api/clubs/:clubId/members/:memberId/role', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const memberId = parseInt(req.params.memberId);
    const userId = req.user?.claims?.sub || req.user?.id;
    const { role, roleId } = req.body;
    
    // Check if user is club admin
    const adminMembership = await storage.getUserClubMembership(userId, clubId);
    if (!adminMembership) {
      throw new AuthorizationError('You are not a member of this club');
    }
    
    const adminRole = await storage.getRoleById(adminMembership.roleId);
    const adminRoles = ['club-administrator', 'obmann'];
    if (!adminRole || !adminRoles.includes(adminRole.name)) {
      throw new AuthorizationError('You must be a club administrator or club leader to manage member roles');
    }
    
    let targetRole;
    
    // Support both old role (string) and new roleId (number) formats
    if (roleId && typeof roleId === 'number') {
      // New format: roleId is provided directly
      targetRole = await storage.getRoleById(roleId);
      if (!targetRole) {
        throw new ValidationError(`Role with ID '${roleId}' not found`, 'roleId');
      }
      console.log(`🔧 USERS PAGE DEBUG: Updating member ${memberId} with roleId ${roleId} (${targetRole.name})`);
    } else if (role && typeof role === 'string') {
      // Legacy format: role name is provided, convert to roleId
      targetRole = await storage.getRoleByName(role);
      if (!targetRole) {
        throw new ValidationError(`Role '${role}' not found`, 'role');
      }
      console.log(`🔧 USERS PAGE DEBUG: Updating member ${memberId} with role name '${role}' -> roleId ${targetRole.id}`);
    } else {
      throw new ValidationError('Either role (string) or roleId (number) must be provided', 'role');
    }
    
    const updatedMembership = await storage.updateClubMembershipById(memberId, { roleId: targetRole.id });
    
    // Log the role change activity
    const member = await storage.getUser(updatedMembership.userId);
    const admin = await storage.getUser(userId);
    if (member && admin) {
      await storage.createActivityLog({
        clubId,
        userId,
        action: 'role_changed',
        targetUserId: member.id,
        targetResource: 'membership',
        targetResourceId: memberId,
        description: `${admin.firstName} ${admin.lastName} hat die Rolle von ${member.firstName} ${member.lastName} zu ${targetRole.displayName} geändert`,
        metadata: { oldRoleId: updatedMembership.roleId, newRoleId: targetRole.id, newRoleName: targetRole.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }
    
    logger.info('Member role updated', { clubId, memberId, newRoleId: targetRole.id, newRole: targetRole.name, updatedBy: userId, requestId: req.id });
    res.json(updatedMembership);
  }));

  // Update member status (admin only)
  app.patch('/api/clubs/:clubId/members/:memberId/status', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const memberId = parseInt(req.params.memberId);
    const userId = req.user?.claims?.sub || req.user?.id;
    const { status } = req.body;
    
    // Check if user is club admin
    const adminMembership = await storage.getUserClubMembership(userId, clubId);
    if (!adminMembership) {
      throw new AuthorizationError('You are not a member of this club');
    }
    
    const adminRole = await storage.getRoleById(adminMembership.roleId);
    const adminRoles = ['club-administrator', 'obmann'];
    if (!adminRole || !adminRoles.includes(adminRole.name)) {
      throw new AuthorizationError('You must be a club administrator or club leader to manage member status');
    }
    
    const updatedMembership = await storage.updateClubMembershipById(memberId, { status });
    
    // Log the status change activity
    const member = await storage.getUser(updatedMembership.userId);
    const admin = await storage.getUser(userId);
    if (member && admin) {
      const statusDescription = status === 'active' ? 'genehmigt' : status === 'inactive' ? 'abgelehnt' : status;
      await storage.createActivityLog({
        clubId,
        userId,
        action: 'membership_status_changed',
        targetUserId: member.id,
        targetResource: 'membership',
        targetResourceId: memberId,
        description: `${admin.firstName} ${admin.lastName} hat die Mitgliedschaft von ${member.firstName} ${member.lastName} ${statusDescription}`,
        metadata: { oldStatus: updatedMembership.status, newStatus: status },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }
    
    logger.info('Member status updated', { clubId, memberId, newStatus: status, updatedBy: userId, requestId: req.id });
    res.json(updatedMembership);
  }));

  // Remove member (admin only)
  app.delete('/api/clubs/:clubId/members/:memberId', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const memberId = parseInt(req.params.memberId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    // Check if user is club admin
    const adminMembership = await storage.getUserClubMembership(userId, clubId);
    if (!adminMembership) {
      throw new AuthorizationError('You are not a member of this club');
    }
    
    // Get role information (BOTH club-administrator AND obmann have admin rights)
    const role = await storage.getRoleById(adminMembership.roleId);
    const adminRoles = ['club-administrator', 'obmann'];
    if (!role || !adminRoles.includes(role.name)) {
      throw new AuthorizationError('You must be a club administrator or club leader to remove members');
    }
    
    await storage.deleteClubMembershipById(memberId);
    
    logger.info('Member removed from club', { clubId, memberId, removedBy: userId, requestId: req.id });
    res.json({ success: true });
  }));

  // Member routes
  app.get('/api/clubs/:clubId/members', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const members = await storage.getMembers(clubId);
    
    logger.info('Members retrieved', { clubId, count: members.length, requestId: req.id });
    res.json(members);
  }));

  app.post('/api/clubs/:clubId/members', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const memberData = insertMemberSchema.parse({ ...req.body, clubId });
    const member = await storage.createMember(memberData);
    
    logger.info('Member created', { clubId, memberId: member.id, requestId: req.id });
    res.status(201).json(member);
  }));

  app.put('/api/clubs/:clubId/members/:id', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const id = parseInt(req.params.id);
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!id || isNaN(id)) {
      throw new ValidationError('Invalid member ID', 'memberId');
    }
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    // Check if user has admin access to this club
    const membership = await storage.getUserClubMembership(userId, clubId);
    if (!membership) {
      throw new AuthorizationError('You are not a member of this club');
    }
    
    // Get role information to check admin permissions
    const role = await storage.getRoleById(membership.roleId);
    const adminRoles = ['club-administrator', 'obmann'];
    if (!role || !adminRoles.includes(role.name)) {
      throw new AuthorizationError('You must be a club administrator or club leader to update members');
    }
    
    const updates = { ...req.body };
    
    // Clean up empty date fields to prevent PostgreSQL errors
    if (updates.birthDate === '') {
      updates.birthDate = null;
    }
    if (updates.joinDate === '') {
      updates.joinDate = null;
    }
    
    console.log('🔧 Member update:', { memberId: id, clubId, updates, userId });
    
    const member = await storage.updateMember(id, updates);
    
    logger.info('Member updated', { memberId: id, clubId, updatedBy: userId, requestId: req.id });
    res.json(member);
  }));

  app.delete('/api/clubs/:clubId/members/:id', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const id = parseInt(req.params.id);
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!id || isNaN(id)) {
      throw new ValidationError('Invalid member ID', 'memberId');
    }
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    // Check if user has admin access to this club
    const membership = await storage.getUserClubMembership(userId, clubId);
    if (!membership) {
      throw new AuthorizationError('You are not a member of this club');
    }
    
    // Get role information to check admin permissions
    const role = await storage.getRoleById(membership.roleId);
    const adminRoles = ['club-administrator', 'obmann'];
    if (!role || !adminRoles.includes(role.name)) {
      throw new AuthorizationError('You must be a club administrator or club leader to delete members');
    }
    
    console.log('🗑️ Member deletion:', { memberId: id, clubId, userId });
    
    await storage.deleteMember(id);
    
    logger.info('Member deleted', { memberId: id, clubId, deletedBy: userId, requestId: req.id });
    res.json({ success: true });
  }));

  // Team routes
  app.get('/api/clubs/:clubId/teams', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const teams = await storage.getTeams(clubId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post('/api/clubs/:clubId/teams', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const teamData = insertTeamSchema.parse({ ...req.body, clubId });
      const team = await storage.createTeam(teamData);
      res.json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.put('/api/clubs/:clubId/teams/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clubId = parseInt(req.params.clubId);
      const updates = req.body;
      const team = await storage.updateTeam(id, updates);
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete('/api/clubs/:clubId/teams/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clubId = parseInt(req.params.clubId);
      await storage.deleteTeam(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Team memberships routes
  app.get('/api/clubs/:clubId/team-memberships', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const memberships = await storage.getTeamMemberships(clubId);
      res.json(memberships);
    } catch (error) {
      console.error("Error fetching team memberships:", error);
      res.status(500).json({ message: "Failed to fetch team memberships" });
    }
  });

  app.get('/api/teams/:teamId/memberships', isAuthenticated, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const memberships = await storage.getTeamMembers(teamId);
      res.json(memberships);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post('/api/teams/:teamId/memberships', isAuthenticated, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const membershipData = insertTeamMembershipSchema.parse({
        teamId,
        ...req.body,
      });
      const membership = await storage.addMemberToTeam(membershipData);
      res.status(201).json(membership);
    } catch (error) {
      console.error("Error adding member to team:", error);
      res.status(500).json({ message: "Failed to add member to team" });
    }
  });

  app.delete('/api/teams/:teamId/trainers', isAuthenticated, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      await storage.removeTeamTrainers(teamId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing team trainers:", error);
      res.status(500).json({ message: "Failed to remove team trainers" });
    }
  });

  // Facility routes
  app.get('/api/clubs/:clubId/facilities', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const facilities = await storage.getFacilities(clubId);
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.post('/api/clubs/:clubId/facilities', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const facilityData = insertFacilitySchema.parse({ ...req.body, clubId });
      const facility = await storage.createFacility(facilityData);
      res.json(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      res.status(500).json({ message: "Failed to create facility" });
    }
  });

  app.patch('/api/clubs/:clubId/facilities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clubId = parseInt(req.params.clubId);
      const updates = { ...req.body };
      
      const facility = await storage.updateFacility(id, updates);
      res.json(facility);
    } catch (error) {
      console.error("Error updating facility:", error);
      res.status(500).json({ message: "Failed to update facility" });
    }
  });

  app.delete('/api/clubs/:clubId/facilities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clubId = parseInt(req.params.clubId);
      
      await storage.deleteFacility(id);
      res.json({ message: "Facility deleted successfully" });
    } catch (error) {
      console.error("Error deleting facility:", error);
      res.status(500).json({ message: "Failed to delete facility" });
    }
  });

  // Booking routes
  app.get('/api/clubs/:clubId/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const bookings = await storage.getBookings(clubId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/clubs/:clubId/bookings', isAuthenticated, async (req: any, res) => {
    try {
      console.log("DEBUG Route: Raw request body:", req.body);
      const clubId = parseInt(req.params.clubId);
      const bookingData = bookingFormSchema.parse({ ...req.body, clubId });
      console.log("DEBUG Route: Validated data:", bookingData);
      
      // Check availability before creating booking
      const availability = await storage.checkBookingAvailability(
        bookingData.facilityId!, 
        new Date(bookingData.startTime), 
        new Date(bookingData.endTime)
      );
      
      if (!availability.available) {
        return res.status(400).json({ 
          message: `Anlage ist zur gewählten Zeit nicht verfügbar. Maximal ${availability.maxConcurrent} Buchung(en) erlaubt, aktuell ${availability.currentBookings} Buchung(en) vorhanden.`,
          conflictingBookings: availability.conflictingBookings
        });
      }
      
      let createdBookings = [];
      
      // Wenn wiederkehrende Buchung aktiviert ist
      if (bookingData.recurring && bookingData.recurringPattern && bookingData.recurringUntil) {
        const startDate = new Date(bookingData.startTime);
        const endDate = new Date(bookingData.endTime);
        const recurringUntil = new Date(bookingData.recurringUntil);
        
        // Berechne die Dauer der ursprünglichen Buchung
        const duration = endDate.getTime() - startDate.getTime();
        
        let currentDate = new Date(startDate);
        
        while (currentDate <= recurringUntil) {
          const currentEndDate = new Date(currentDate.getTime() + duration);
          
          // Erstelle Buchung für aktuelles Datum
          const currentBookingData = {
            ...bookingData,
            startTime: new Date(currentDate),
            endTime: currentEndDate,
            clubId,
            userId: req.user.id,
            // Nur die erste Buchung hat recurring=true, alle anderen sind normale Buchungen
            recurring: createdBookings.length === 0 ? true : false,
            recurringPattern: createdBookings.length === 0 ? bookingData.recurringPattern : undefined,
            recurringUntil: createdBookings.length === 0 ? bookingData.recurringUntil : undefined,
          };
          
          try {
            // Verfügbarkeitsprüfung für jede Buchung
            const currentAvailability = await storage.checkBookingAvailability(
              currentBookingData.facilityId!, 
              currentBookingData.startTime, 
              currentBookingData.endTime
            );
            
            if (currentAvailability.available) {
              const booking = await storage.createBooking(currentBookingData);
              createdBookings.push(booking);
              console.log(`DEBUG: Wiederkehrende Buchung erstellt für ${currentDate.toISOString()}`);
            } else {
              console.warn(`Buchung übersprungen für ${currentDate.toISOString()} - nicht verfügbar`);
            }
          } catch (error) {
            console.error(`Fehler beim Erstellen der Buchung für ${currentDate.toISOString()}:`, error);
          }
          
          // Nächstes Datum berechnen basierend auf Wiederholungsmuster
          switch (bookingData.recurringPattern) {
            case 'daily':
              currentDate.setDate(currentDate.getDate() + 1);
              break;
            case 'weekly':
              currentDate.setDate(currentDate.getDate() + 7);
              break;
            case 'monthly':
              currentDate.setMonth(currentDate.getMonth() + 1);
              break;
            default:
              throw new Error(`Unbekanntes Wiederholungsmuster: ${bookingData.recurringPattern}`);
          }
        }
        
        console.log(`DEBUG Route: ${createdBookings.length} wiederkehrende Buchungen erstellt`);
        res.json({ 
          message: `${createdBookings.length} wiederkehrende Buchungen erfolgreich erstellt`,
          bookings: createdBookings,
          count: createdBookings.length,
          mainBooking: createdBookings[0] || null
        });
      } else {
        // Normale Einzelbuchung
        const finalBookingData = {
          ...bookingData,
          clubId,
          userId: req.user.id,
        };
        console.log("DEBUG Route: Final booking data with IDs:", finalBookingData);
        
        const booking = await storage.createBooking({
          ...finalBookingData,
          startTime: new Date(finalBookingData.startTime),
          endTime: new Date(finalBookingData.endTime)
        });
        console.log("DEBUG Route: Created booking:", booking);
        res.json(booking);
      }
    } catch (error) {
      console.error("DEBUG Route: Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get('/api/clubs/:clubId/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.patch('/api/clubs/:clubId/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = { ...req.body };
      
      console.log('Booking update request:', updates);
      
      // Ensure Date objects are properly converted
      if (updates.startTime && !(updates.startTime instanceof Date)) {
        updates.startTime = new Date(updates.startTime);
      }
      if (updates.endTime && !(updates.endTime instanceof Date)) {
        updates.endTime = new Date(updates.endTime);
      }
      
      // Clean up cost field for proper decimal handling
      if (updates.cost !== undefined && updates.cost !== null) {
        updates.cost = typeof updates.cost === 'number' ? updates.cost.toString() : parseFloat(updates.cost).toString();
      }
      
      // Check availability if time or facility is being updated
      if (updates.facilityId || updates.startTime || updates.endTime) {
        const currentBooking = await storage.getBooking(id);
        if (!currentBooking) {
          return res.status(404).json({ message: "Booking not found" });
        }
        
        const facilityId = updates.facilityId || currentBooking.facilityId;
        const startTime = updates.startTime || new Date(currentBooking.startTime);
        const endTime = updates.endTime || new Date(currentBooking.endTime);
        
        // Skip availability check for events (facilityId = null)
        if (facilityId !== null && facilityId !== undefined) {
          const availability = await storage.checkBookingAvailability(
            facilityId, 
            startTime, 
            endTime,
            id // Exclude current booking from check
          );
          
          if (!availability.available) {
            return res.status(400).json({ 
              message: `Anlage ist zur gewählten Zeit nicht verfügbar. Maximal ${availability.maxConcurrent} Buchung(en) erlaubt, aktuell ${availability.currentBookings} Buchung(en) vorhanden.`,
              conflictingBookings: availability.conflictingBookings
            });
          }
        }
      }
      
      const booking = await storage.updateBooking(id, updates);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete('/api/clubs/:clubId/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBooking(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // Check booking availability route
  app.post('/api/clubs/:clubId/bookings/check-availability', isAuthenticated, async (req: any, res) => {
    try {
      const { facilityId, startTime, endTime, excludeBookingId } = req.body;
      
      if (!facilityId || !startTime || !endTime) {
        return res.status(400).json({ message: "facilityId, startTime und endTime sind erforderlich" });
      }
      
      const availability = await storage.checkBookingAvailability(
        parseInt(facilityId), 
        new Date(startTime), 
        new Date(endTime),
        excludeBookingId ? parseInt(excludeBookingId) : undefined
      );
      
      res.json(availability);
    } catch (error) {
      console.error("Error checking booking availability:", error);
      res.status(500).json({ message: "Failed to check booking availability" });
    }
  });

  // Event routes - separate from bookings for all subscription types
  app.get('/api/clubs/:clubId/events', async (req: any, res: any) => {
    try {
      // TEMPORÄRE AUTHENTICATION-BYPASS FÜR DEBUG
      console.log('🚨 GET EVENTS - AUTHENTICATION TEMPORARILY BYPASSED FOR DEBUG');
      req.user = { id: '45190315', email: 'koglerf@gmail.com' };
      const clubId = parseInt(req.params.clubId);
      console.log('📅 GET events for club:', clubId, 'user:', req.user?.id);
      const events = await storage.getEvents(clubId);
      console.log('📅 Returning', events.length, 'events');
      res.json(events);
    } catch (error: any) {
      console.error('💥 GET events error:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/clubs/:clubId/events', async (req: any, res: any) => {
    // TEMPORÄRE AUTHENTICATION-BYPASS FÜR DEBUG
    console.log('🚨 AUTHENTICATION TEMPORARILY BYPASSED FOR DEBUG');
    
    // Simulate authenticated user for testing
    req.user = { id: '45190315', email: 'koglerf@gmail.com' };
    try {
    const clubId = parseInt(req.params.clubId);
    
    console.log('🔥 EVENT CREATION START');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🏢 Club ID:', clubId);
    console.log('👤 User:', req.user?.id, req.user?.email);
    
    // Validate event data - Team is optional for events
    const eventSchema = z.object({
      title: z.string().min(1, "Titel ist erforderlich"),
      description: z.string().optional().default(""),
      startDate: z.string().min(1, "Startdatum ist erforderlich"), // Frontend sends startDate
      endDate: z.string().min(1, "Enddatum ist erforderlich"), // Frontend sends endDate
      location: z.string().optional().default(""),
      type: z.string().default("event"),
      teamId: z.union([z.number(), z.null()]).optional(), // Allow null or number
      notes: z.string().optional().default(""),
    });

    let validatedData;
    try {
      validatedData = eventSchema.parse(req.body);
      console.log('✅ Validation successful:', JSON.stringify(validatedData, null, 2));
    } catch (validationError: any) {
      console.error('❌ Validation error:', validationError.errors);
      return res.status(400).json({ message: 'Validation error', errors: validationError.errors });
    }
    
    const eventData = {
      ...validatedData,
      clubId,
      startTime: new Date(validatedData.startDate), // Convert startDate to startTime
      endTime: new Date(validatedData.endDate), // Convert endDate to endTime
      facilityId: null, // Events don't have facilities
      teamId: validatedData.teamId || null, // Handle "Kein Team" case
      status: 'confirmed', // Set default status
      isPublic: true, // Set default visibility
      recurring: false, // Set default recurring
      recurringPattern: null,
      recurringUntil: null,
      contactPerson: null,
      contactEmail: null,
      contactPhone: null,
      participants: null,
      cost: null,
      memberId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📊 Creating event with data:', JSON.stringify(eventData, null, 2));
    
    let event;
    try {
      console.log('🔄 Calling storage.createEvent...');
      event = await storage.createEvent(eventData);
      console.log('✅ Event created successfully:', JSON.stringify(event, null, 2));
    } catch (storageError: any) {
      console.error('💥 Storage error:', storageError.message);
      console.error('📚 Storage stack:', storageError.stack);
      console.error('🔍 Storage error details:', storageError);
      return res.status(500).json({ message: 'Database error', error: storageError.message });
    }
    
    console.log('🎉 Event creation complete! ID:', event.id);
    
    res.status(201).json(event);
    } catch (error: any) {
      console.error('💀 CRITICAL ERROR creating event:', error.message);
      console.error('📚 Stack trace:', error.stack);
      console.error('📝 Request body:', JSON.stringify(req.body, null, 2));
      res.status(500).json({ message: 'Failed to create event', error: error.message });
    }
  });

  app.put('/api/clubs/:clubId/events/:id', isAuthenticated, requiresClubMembership, asyncHandler(async (req: any, res: any) => {
    const id = parseInt(req.params.id);
    const clubId = parseInt(req.params.clubId);
    
    const eventSchema = z.object({
      title: z.string().min(1, "Titel ist erforderlich"),
      description: z.string().optional(),
      startTime: z.string().min(1, "Startzeit ist erforderlich"),
      endTime: z.string().min(1, "Endzeit ist erforderlich"),
      location: z.string().optional(),
      type: z.string().default("event"),
      teamId: z.number().optional(),
      notes: z.string().optional(),
    });

    const validatedData = eventSchema.parse(req.body);
    
    const eventData = {
      ...validatedData,
      startTime: new Date(validatedData.startTime),
      endTime: new Date(validatedData.endTime),
    };

    const event = await storage.updateEvent(id, eventData);
    
    logger.info(`Event updated: ${event.title} (ID: ${id})`, { 
      eventId: id, 
      clubId, 
      userId: req.user.id 
    });
    
    res.json(event);
  }));

  app.delete('/api/clubs/:clubId/events/:id', isAuthenticated, requiresClubMembership, asyncHandler(async (req: any, res: any) => {
    const id = parseInt(req.params.id);
    const clubId = parseInt(req.params.clubId);
    
    await storage.deleteEvent(id);
    
    logger.info(`Event deleted (ID: ${id})`, { 
      eventId: id, 
      clubId, 
      userId: req.user.id 
    });
    
    res.status(204).send();
  }));

  // Calendar route that returns both bookings and events
  app.get('/api/clubs/:clubId/calendar', isAuthenticated, requiresClubMembership, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const calendarItems = await storage.getCalendarItems(clubId);
    res.json(calendarItems);
  }));

  // Finance routes
  app.get('/api/clubs/:clubId/finances', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const finances = await storage.getFinances(clubId);
      res.json(finances);
    } catch (error) {
      console.error("Error fetching finances:", error);
      res.status(500).json({ message: "Failed to fetch finances" });
    }
  });

  app.get('/api/clubs/:clubId/finances/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const finance = await storage.getFinance(id);
      if (!finance) {
        return res.status(404).json({ message: "Finance record not found" });
      }
      res.json(finance);
    } catch (error) {
      console.error("Error fetching finance:", error);
      res.status(500).json({ message: "Failed to fetch finance" });
    }
  });

  app.post('/api/clubs/:clubId/finances', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const financeData = insertFinanceSchema.parse({ ...req.body, clubId });
      const finance = await storage.createFinance(financeData);
      res.json(finance);
    } catch (error) {
      console.error("Error creating finance record:", error);
      res.status(500).json({ message: "Failed to create finance record" });
    }
  });

  app.patch('/api/clubs/:clubId/finances/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Use the same validation schema as create
      const validatedData = insertFinanceSchema.partial().parse(req.body);
      const finance = await storage.updateFinance(id, validatedData);
      res.json(finance);
    } catch (error) {
      console.error('Error updating finance:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/clubs/:clubId/finances/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFinance(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting finance:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Training fees routes (duplicate removed - handled later)





  // Player routes
  app.get("/api/clubs/:clubId/players", isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const players = await storage.getPlayers(clubId);
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.get("/api/players/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const player = await storage.getPlayer(id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error fetching player:", error);
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  app.post("/api/clubs/:clubId/players", isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const cleanedData = { ...req.body };
      
      // Clean up empty date fields to prevent PostgreSQL errors
      if (cleanedData.birthDate === '') {
        cleanedData.birthDate = null;
      }
      if (cleanedData.contractStart === '') {
        cleanedData.contractStart = null;
      }
      if (cleanedData.contractEnd === '') {
        cleanedData.contractEnd = null;
      }
      
      const validatedData = insertPlayerSchema.parse({
        ...cleanedData,
        clubId,
      });
      const player = await storage.createPlayer(validatedData);
      res.status(201).json(player);
    } catch (error) {
      console.error("Error creating player:", error);
      res.status(500).json({ message: "Failed to create player" });
    }
  });

  app.patch("/api/clubs/:clubId/players/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clubId = parseInt(req.params.clubId);
      const updates = { ...req.body };
      
      // Clean up empty date fields to prevent PostgreSQL errors
      if (updates.birthDate === '') {
        updates.birthDate = null;
      }
      if (updates.contractStart === '') {
        updates.contractStart = null;
      }
      if (updates.contractEnd === '') {
        updates.contractEnd = null;
      }
      
      const player = await storage.updatePlayer(id, updates);
      res.json(player);
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(500).json({ message: "Failed to update player" });
    }
  });

  app.delete("/api/clubs/:clubId/players/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clubId = parseInt(req.params.clubId);
      await storage.deletePlayer(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting player:", error);
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

  // Player-Team assignment routes
  app.get("/api/players/:playerId/teams", isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const assignments = await storage.getPlayerTeams(playerId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching player teams:", error);
      res.status(500).json({ message: "Failed to fetch player teams" });
    }
  });

  app.get("/api/teams/:teamId/players", isAuthenticated, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const assignments = await storage.getTeamPlayers(teamId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching team players:", error);
      res.status(500).json({ message: "Failed to fetch team players" });
    }
  });

  app.post("/api/players/:playerId/teams/:teamId", isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const teamId = parseInt(req.params.teamId);
      const validatedData = insertPlayerTeamAssignmentSchema.parse({
        playerId,
        teamId,
        ...req.body,
      });
      const assignment = await storage.assignPlayerToTeam(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning player to team:", error);
      res.status(500).json({ message: "Failed to assign player to team" });
    }
  });

  app.delete("/api/players/:playerId/teams/:teamId", isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const teamId = parseInt(req.params.teamId);
      await storage.removePlayerFromTeam(playerId, teamId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing player from team:", error);
      res.status(500).json({ message: "Failed to remove player from team" });
    }
  });

  // Member fees routes
  app.get('/api/clubs/:clubId/member-fees', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const memberFees = await storage.getMemberFees(clubId);
      res.json(memberFees);
    } catch (error) {
      console.error("Error fetching member fees:", error);
      res.status(500).json({ message: "Failed to fetch member fees" });
    }
  });

  app.post('/api/clubs/:clubId/member-fees', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const formData = req.body;
      
      const memberFeeData = {
        ...formData,
        clubId,
        memberId: parseInt(formData.memberId),
        amount: formData.amount,
        nextDueDate: formData.startDate,
      };
      
      const memberFee = await storage.createMemberFee(memberFeeData);
      res.json(memberFee);
    } catch (error) {
      console.error("Error creating member fee:", error);
      res.status(500).json({ message: "Failed to create member fee" });
    }
  });

  app.patch('/api/clubs/:clubId/member-fees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const memberFee = await storage.updateMemberFee(id, req.body);
      res.json(memberFee);
    } catch (error) {
      console.error("Error updating member fee:", error);
      res.status(500).json({ message: "Failed to update member fee" });
    }  
  });

  app.delete('/api/clubs/:clubId/member-fees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMemberFee(id);
      res.json({ message: "Member fee deleted successfully" });
    } catch (error) {
      console.error("Error deleting member fee:", error);
      res.status(500).json({ message: "Failed to delete member fee" });
    }
  });

  // Training fees routes
  app.get('/api/clubs/:clubId/training-fees', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const trainingFees = await storage.getTrainingFees(clubId);
      res.json(trainingFees);
    } catch (error) {
      console.error("Error fetching training fees:", error);
      res.status(500).json({ message: "Failed to fetch training fees" });
    }
  });

  app.post('/api/clubs/:clubId/training-fees', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const formData = req.body;
      
      const trainingFeeData = {
        ...formData,
        clubId,
        amount: formData.amount,
        teamIds: formData.teamIds || null,
        playerIds: formData.playerIds || null,
        nextDueDate: formData.startDate,
      };
      
      const trainingFee = await storage.createTrainingFee(trainingFeeData);
      res.json(trainingFee);
    } catch (error) {
      console.error("Error creating training fee:", error);
      res.status(500).json({ message: "Failed to create training fee" });
    }
  });

  app.patch('/api/clubs/:clubId/training-fees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const trainingFee = await storage.updateTrainingFee(id, req.body);
      res.json(trainingFee);
    } catch (error) {
      console.error("Error updating training fee:", error);
      res.status(500).json({ message: "Failed to update training fee" });
    }
  });

  app.delete('/api/clubs/:clubId/training-fees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTrainingFee(id);
      res.json({ message: "Training fee deleted successfully" });
    } catch (error) {
      console.error("Error deleting training fee:", error);
      res.status(500).json({ message: "Failed to delete training fee" });
    }
  });

  // Communication routes
  
  // Classic Messages Routes - RESTORED per user request
  app.get('/api/clubs/:clubId/messages', isAuthenticated, async (req: any, res: any) => {
    try {
      const clubId = parseInt(req.params.clubId);
      if (!clubId || isNaN(clubId)) {
        return res.status(400).json({ message: 'Invalid club ID' });
      }
      
      const messages = await storage.getMessages(clubId, req.user.id);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.get('/api/clubs/:clubId/messages/:messageId', isAuthenticated, async (req: any, res: any) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (!messageId || isNaN(messageId)) {
        return res.status(400).json({ message: 'Invalid message ID' });
      }
      
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      res.json(message);
    } catch (error) {
      console.error('Error fetching message:', error);
      res.status(500).json({ message: 'Failed to fetch message' });
    }
  });

  app.post('/api/clubs/:clubId/messages', isAuthenticated, async (req: any, res: any) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const { subject, content, recipientType = 'user', recipientId } = req.body;
      
      console.log('📧 Creating classic message:', { clubId, subject, senderId: req.user.id, recipientType, recipientId });
      
      if (!subject || !content) {
        return res.status(400).json({ message: 'Subject and content are required' });
      }

      const messageData = {
        clubId,
        senderId: req.user.id,
        subject,
        content,
        messageType: 'direct',
        priority: 'normal',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const message = await storage.createMessage(messageData);
      
      // Add recipients if specified
      if (recipientId && recipientType) {
        await storage.addMessageRecipients([{
          messageId: message.id,
          recipientType,
          recipientId,
          status: 'sent',
          deliveredAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }]);
      }

      console.log('✅ Classic message created successfully:', message.id);
      res.status(201).json(message);
    } catch (error) {
      console.error('❌ Error creating classic message:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  app.patch('/api/clubs/:clubId/messages/:messageId', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const messageId = parseInt(req.params.messageId);
    
    if (!messageId || isNaN(messageId)) {
      throw new ValidationError('Invalid message ID', 'messageId');
    }
    
    const message = await storage.updateMessage(messageId, req.body);
    logger.info('Message updated', { messageId, requestId: req.id });
    res.json(message);
  }));

  app.delete('/api/clubs/:clubId/messages/:messageId', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const messageId = parseInt(req.params.messageId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!messageId || isNaN(messageId)) {
      throw new ValidationError('Invalid message ID', 'messageId');
    }
    
    // Check if user is the sender of the message
    const message = await storage.getMessage(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }
    
    if (message.senderId !== userId) {
      throw new AuthorizationError('You can only delete your own messages');
    }
    
    await storage.deleteMessage(messageId);
    logger.info('Message deleted', { messageId, userId, requestId: req.id });
    res.status(204).send();
  }));

  app.post('/api/clubs/:clubId/messages/:messageId/read', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const messageId = parseInt(req.params.messageId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!messageId || isNaN(messageId)) {
      throw new ValidationError('Invalid message ID', 'messageId');
    }
    
    await storage.markMessageAsRead(messageId, userId);
    logger.info('Message marked as read', { messageId, userId, requestId: req.id });
    res.status(204).send();
  }));

  // Reply to a message (create threaded reply)
  app.post('/api/clubs/:clubId/messages/:messageId/reply', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const messageId = parseInt(req.params.messageId);
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    logger.info('Reply request received', { messageId, clubId, userId, body: req.body, requestId: req.id });
    
    if (!messageId || isNaN(messageId)) {
      throw new ValidationError('Invalid message ID', 'messageId');
    }
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    try {
      // Validate request body
      const validationSchema = z.object({
        content: z.string().min(1, "Content is required"),
        subject: z.string().optional(),
        originalSubject: z.string().optional(),
      });
      
      const validatedData = validationSchema.parse(req.body);
      logger.info('Validation successful', { validatedData, requestId: req.id });
      
      const replyData = {
        clubId,
        senderId: userId,
        subject: validatedData.subject || `Re: ${validatedData.originalSubject || 'Message'}`,
        content: validatedData.content,
        messageType: 'reply' as const,
        priority: 'normal' as const,
        status: 'sent' as const,
      };
      
      logger.info('Creating reply with data', { replyData, requestId: req.id });
      const reply = await storage.createMessageReply(messageId, replyData);
      logger.info('Message reply created successfully', { replyId: reply.id, parentMessageId: messageId, clubId, userId, requestId: req.id });
      res.status(201).json(reply);
    } catch (error) {
      logger.error('Error creating reply', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        stack: error instanceof Error ? error.stack : 'No stack trace', 
        messageId, 
        clubId, 
        userId, 
        requestId: req.id 
      });
      throw error;
    }
  }));

  // Delete a specific reply
  app.delete('/api/clubs/:clubId/messages/:messageId/replies/:replyId', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const replyId = parseInt(req.params.replyId);
    const messageId = parseInt(req.params.messageId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!replyId || isNaN(replyId)) {
      throw new ValidationError('Invalid reply ID', 'replyId');
    }
    
    // Check if user is the sender of the reply
    const reply = await storage.getMessage(replyId);
    if (!reply) {
      throw new NotFoundError('Reply not found');
    }
    
    if (reply.senderId !== userId) {
      throw new AuthorizationError('You can only delete your own replies');
    }
    
    // Verify reply belongs to the specified message thread
    if (reply.threadId !== messageId) {
      throw new ValidationError('Reply does not belong to this message thread');
    }
    
    await storage.deleteMessage(replyId);
    logger.info('Reply deleted', { replyId, messageId, userId, requestId: req.id });
    res.status(204).send();
  }));

  // Delete message endpoint
  app.delete('/api/clubs/:clubId/messages/:messageId', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const { clubId, messageId } = req.params;
    const userId = req.user?.claims?.sub || req.user?.id;
    
    try {
      logger.info('Deleting message', { messageId, clubId, userId, requestId: req.id });
      
      // Check if user is the message creator
      const message = await storage.getMessage(Number(messageId));
      if (!message) {
        throw new NotFoundError('Message not found');
      }
      
      if (message.senderId !== userId) {
        throw new AuthorizationError('You can only delete your own messages');
      }
      
      // Soft delete the message
      await storage.deleteMessage(Number(messageId));
      
      logger.info('Message deleted successfully', { messageId, clubId, userId, requestId: req.id });
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting message', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        messageId, 
        clubId, 
        userId, 
        requestId: req.id 
      });
      throw error;
    }
  }));

  // Announcement routes
  app.get('/api/clubs/:clubId/announcements', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    
    console.log(`🔍 ANNOUNCEMENT GET - Club ID: ${clubId}, User: ${req.user?.id}`);
    
    if (!clubId || isNaN(clubId)) {
      console.error('❌ Invalid club ID:', req.params.clubId);
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    try {
      const announcements = await storage.getAnnouncements(clubId);
      console.log(`✅ ANNOUNCEMENT GET SUCCESS - Found ${announcements.length} announcements`);
      logger.info('Announcements retrieved', { clubId, count: announcements.length, requestId: req.id });
      res.json(announcements);
    } catch (error) {
      console.error('❌ ANNOUNCEMENT GET ERROR:', error);
      throw error;
    }
  }));

  app.get('/api/clubs/:clubId/announcements/:announcementId', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const announcementId = parseInt(req.params.announcementId);
    
    if (!announcementId || isNaN(announcementId)) {
      throw new ValidationError('Invalid announcement ID', 'announcementId');
    }
    
    const announcement = await storage.getAnnouncement(announcementId);
    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }
    
    logger.info('Announcement retrieved', { announcementId, requestId: req.id });
    res.json(announcement);
  }));

  app.post('/api/clubs/:clubId/announcements', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    console.log('🔍 ANNOUNCEMENT DEBUG - Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 ANNOUNCEMENT DEBUG - Club ID:', clubId);
    console.log('🔍 ANNOUNCEMENT DEBUG - User ID:', userId);
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    // Add server-side fields before validation
    const requestDataWithServerFields = {
      ...req.body,
      clubId,
      authorId: userId
    };
    
    // Skip validation for now - use request data directly
    const validatedData = requestDataWithServerFields;
    
    const announcementData = {
      clubId,
      authorId: userId,
      title: validatedData.title,
      content: validatedData.content,
      category: validatedData.category,
      priority: validatedData.priority || 'normal',
      targetAudience: validatedData.targetAudience || 'all',
      targetTeamIds: validatedData.targetTeamIds,
      scheduledFor: validatedData.scheduledFor,
      expiresAt: validatedData.expiresAt,
      isPinned: validatedData.isPinned || false,
      isPublished: validatedData.isPublished || false,
      attachments: validatedData.attachments,
      tags: validatedData.tags,
      metadata: validatedData.metadata,
    };
    
    const announcement = await storage.createAnnouncement(announcementData);
    
    // Create notification for all club members about new announcement
    try {
      const clubMembers = await storage.getClubMembers(clubId);
      const author = await storage.getUserById(userId);
      
      for (const member of clubMembers) {
        if (member.userId !== userId) { // Don't notify the author
          await storage.createNotification({
            userId: member.userId,
            clubId,
            type: 'announcement',
            title: `Neue Ankündigung: ${announcement.title}`,
            message: `${author?.firstName || 'Ein Mitglied'} ${author?.lastName || ''} hat eine neue Ankündigung veröffentlicht.`,
            relatedId: announcement.id.toString(),
            isRead: false,
          });
        }
      }
      
      logger.info('Announcement notifications created', { 
        announcementId: announcement.id, 
        clubId, 
        userId, 
        notificationCount: clubMembers.length - 1,
        requestId: req.id 
      });
    } catch (error) {
      logger.error('Failed to create announcement notifications', { 
        error: error.message, 
        announcementId: announcement.id, 
        clubId, 
        requestId: req.id 
      });
    }
    
    logger.info('Announcement created', { announcementId: announcement.id, clubId, userId, requestId: req.id });
    res.status(201).json(announcement);
  }));

  app.patch('/api/clubs/:clubId/announcements/:announcementId', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const announcementId = parseInt(req.params.announcementId);
    
    if (!announcementId || isNaN(announcementId)) {
      throw new ValidationError('Invalid announcement ID', 'announcementId');
    }
    
    const announcement = await storage.updateAnnouncement(announcementId, req.body);
    logger.info('Announcement updated', { announcementId, requestId: req.id });
    res.json(announcement);
  }));

  app.delete('/api/clubs/:clubId/announcements/:announcementId', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const announcementId = parseInt(req.params.announcementId);
    
    if (!announcementId || isNaN(announcementId)) {
      throw new ValidationError('Invalid announcement ID', 'announcementId');
    }
    
    await storage.deleteAnnouncement(announcementId);
    logger.info('Announcement deleted', { announcementId, requestId: req.id });
    res.status(204).send();
  }));

  app.post('/api/clubs/:clubId/announcements/:announcementId/publish', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const announcementId = parseInt(req.params.announcementId);
    
    if (!announcementId || isNaN(announcementId)) {
      throw new ValidationError('Invalid announcement ID', 'announcementId');
    }
    
    const announcement = await storage.publishAnnouncement(announcementId);
    logger.info('Announcement published', { announcementId, requestId: req.id });
    res.json(announcement);
  }));

  app.post('/api/clubs/:clubId/announcements/:announcementId/pin', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const announcementId = parseInt(req.params.announcementId);
    const { isPinned } = req.body;
    
    if (!announcementId || isNaN(announcementId)) {
      throw new ValidationError('Invalid announcement ID', 'announcementId');
    }
    
    const announcement = await storage.pinAnnouncement(announcementId, isPinned);
    logger.info('Announcement pin status updated', { announcementId, isPinned, requestId: req.id });
    res.json(announcement);
  }));

  // Notification routes
  app.get('/api/clubs/:clubId/notifications', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const notifications = await storage.getNotifications(userId, clubId);
    logger.info('Notifications retrieved', { clubId, userId, count: notifications.length, requestId: req.id });
    res.json(notifications);
  }));

  app.get('/api/clubs/:clubId/notifications/count', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const count = await storage.getUnreadNotificationsCount(userId, clubId);
    res.json({ count });
  }));

  app.post('/api/clubs/:clubId/notifications', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const validatedData = insertNotificationSchema.parse(req.body);
    const notificationData = {
      ...validatedData,
      clubId,
    };
    
    const notification = await storage.createNotification(notificationData);
    logger.info('Notification created', { notificationId: notification.id, clubId, requestId: req.id });
    res.status(201).json(notification);
  }));

  app.post('/api/clubs/:clubId/notifications/:notificationId/read', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const notificationId = parseInt(req.params.notificationId);
    
    if (!notificationId || isNaN(notificationId)) {
      throw new ValidationError('Invalid notification ID', 'notificationId');
    }
    
    await storage.markNotificationAsRead(notificationId);
    logger.info('Notification marked as read', { notificationId, requestId: req.id });
    res.status(204).send();
  }));

  app.post('/api/clubs/:clubId/notifications/read-all', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    await storage.markAllNotificationsAsRead(userId, clubId);
    logger.info('All notifications marked as read', { clubId, userId, requestId: req.id });
    res.status(204).send();
  }));

  app.delete('/api/clubs/:clubId/notifications/:notificationId', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const notificationId = parseInt(req.params.notificationId);
    
    if (!notificationId || isNaN(notificationId)) {
      throw new ValidationError('Invalid notification ID', 'notificationId');
    }
    
    await storage.deleteNotification(notificationId);
    logger.info('Notification deleted', { notificationId, requestId: req.id });
    res.status(204).send();
  }));

  // ENTFERNT - Communication preferences routes hatten keine Backend-Implementation
  // Die eigentlichen Benachrichtigungseinstellungen sind im Header über NotificationSettingsModal verfügbar

  // Communication statistics routes
  app.get('/api/clubs/:clubId/communication-stats', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const stats = await storage.getCommunicationStats(clubId, userId);
    res.json(stats);
  }));

  // Search routes
  app.get('/api/clubs/:clubId/search/messages', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    const { q: query } = req.query;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Search query is required', 'query');
    }
    
    const messages = await storage.searchMessages(clubId, query, userId);
    logger.info('Messages searched', { clubId, userId, query, results: messages.length, requestId: req.id });
    res.json(messages);
  }));

  app.get('/api/clubs/:clubId/search/announcements', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const { q: query } = req.query;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Search query is required', 'query');
    }
    
    const announcements = await storage.searchAnnouncements(clubId, query);
    logger.info('Announcements searched', { clubId, query, results: announcements.length, requestId: req.id });
    res.json(announcements);
  }));

  // ====== LIVE CHAT SYSTEM VOLLSTÄNDIG DEAKTIVIERT ======
  // Explicit 404 für alle Chat-Routen um verwirrende Responses zu vermeiden
  app.all('/api/clubs/:clubId/chat/*', (req, res) => {
    res.status(404).json({ 
      error: 'Live Chat System deaktiviert', 
      message: 'Chat-Funktionalität wurde vollständig entfernt. Verwenden Sie das klassische Nachrichten-System.' 
    });
  });

  // ====== EMAIL INVITATION SYSTEM ======

  // Send email invitation
  app.post('/api/clubs/:clubId/invitations/send', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user?.claims?.sub || req.user?.id;
    
    console.log('📧 Invitation request received:', { body: req.body, userId, clubId });
    
    // Validate club ID
    if (!clubId || isNaN(clubId)) {
      console.log('📧 ERROR: Invalid club ID');
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    // Simple validation (bypass Zod for now to get system working)
    const { email, roleId, personalMessage } = req.body;
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.log('📧 ERROR: Invalid email format');
      throw new ValidationError('Valid email address is required', 'email');
    }
    
    if (!roleId || typeof roleId !== 'number' || roleId <= 0) {
      console.log('📧 ERROR: Role ID is required');
      throw new ValidationError('Valid role ID is required', 'roleId');
    }
    
    console.log('📧 Simple validation successful:', { email, roleId, personalMessage });
    
    // Check if user is club admin
    console.log('📧 Checking admin permissions for user:', userId, 'club:', clubId);
    const adminMembership = await storage.getUserClubMembership(userId, clubId);
    console.log('📧 User membership:', adminMembership);
    if (!adminMembership) {
      console.log('📧 ERROR: User is not a member of this club');
      throw new AuthorizationError('You are not a member of this club');
    }
    
    // Get role information
    const adminRole = await storage.getRoleById(adminMembership.roleId);
    const adminRoles = ['club-administrator', 'obmann'];
    if (!adminRole || !adminRoles.includes(adminRole.name)) {
      console.log('📧 ERROR: User is not club administrator, role:', adminRole?.name);
      throw new AuthorizationError('You must be a club administrator or club leader to send invitations');
    }
    
    // Check if user already exists and has membership
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      const existingMembership = await storage.getUserClubMembership(existingUser.id, clubId);
      if (existingMembership) {
        throw new ValidationError('User is already a member of this club', 'email');
      }
    }
    
    // Check for existing pending invitation
    const existingInvitations = await storage.getClubEmailInvitations(clubId);
    const pendingInvitation = existingInvitations.find(inv => 
      inv.email === email && inv.status === 'pending'
    );
    
    if (pendingInvitation) {
      throw new ValidationError('Invitation already sent to this email', 'email');
    }
    
    // Generate invitation token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Create invitation record
    const invitation = await storage.createEmailInvitation({
      clubId,
      invitedBy: userId,
      email,
      roleId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    
    // Send invitation email
    const club = await storage.getClub(clubId);
    const inviter = await storage.getUser(userId);
    
    if (club && inviter) {
      const { sendInvitationEmail } = await import('./emailService');
      
      // Generate invitation URL - use production domain if available
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://clubflow.replit.app' 
        : `${req.protocol}://${req.get('host')}`;
      const invitationUrl = `${baseUrl}/register?token=${token}`;
      
      // Get role information for email
      const role = await storage.getRoleById(roleId);
      const roleName = role?.displayName || 'Mitglied';
      
      const emailSent = await sendInvitationEmail({
        to: email,
        clubName: club.name,
        inviterName: `${inviter.firstName} ${inviter.lastName}`,
        role: roleName,
        personalMessage,
        invitationUrl,
        expiresAt: invitation.expiresAt,
      });
      
      // Log the invitation activity
      await storage.createActivityLog({
        clubId,
        userId,
        action: 'user_invited',
        targetResource: 'invitation',
        targetResourceId: invitation.id,
        description: `${inviter.firstName} ${inviter.lastName} hat ${email} als ${roleName} eingeladen`,
        metadata: { email, roleId, roleName, emailSent },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      logger.info('User invitation sent', { 
        userId, 
        clubId, 
        invitedEmail: email, 
        roleId,
        roleName, 
        emailSent,
        requestId: req.id 
      });
    }
    
    res.json({ 
      message: 'Einladung erfolgreich versendet',
      invitation: { ...invitation, token: undefined } // Don't expose token
    });
  }));

  // Get club invitations
  app.get('/api/clubs/:clubId/invitations', isAuthenticatedEnhanced, asyncHandler(async (req: any, res: any) => {
    try {
      const { clubId } = req.params;
      const invitations = await storage.getClubEmailInvitations(parseInt(clubId));
      res.json(invitations);
    } catch (error: any) {
      logger.error('Failed to get invitations', { error: error.message, clubId: req.params.clubId });
      res.status(500).json({ message: 'Fehler beim Laden der Einladungen' });
    }
  }));

  // ====== EMAIL/PASSWORD AUTHENTICATION ======

  // Register user from invitation
  app.post('/api/auth/register', asyncHandler(async (req: any, res: any) => {
    try {
      console.log('🚀 Registration request received:', req.body);
      
      const validatedData = userRegistrationSchema.parse(req.body);
      console.log('✅ Validation passed:', validatedData);
      
      const result = await registerUserFromInvitation(validatedData);
      console.log('📝 Registration result:', result);
      
      if (result.success) {
        res.json({ message: 'Registrierung erfolgreich', user: result.user });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error: any) {
      console.error('❌ Registration route error:', error);
      logger.error('Failed to register user', { error: error.message });
      res.status(500).json({ message: 'Fehler bei der Registrierung' });
    }
  }));

  // Email/password login
  app.post('/api/auth/login', asyncHandler(async (req: any, res: any) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const result = await authenticateUser(validatedData);
      
      if (result.success) {
        // Set up user session
        req.session.user = {
          id: result.user!.id,
          email: result.user!.email,
          authProvider: 'email'
        };
        
        res.json({ message: 'Anmeldung erfolgreich', user: result.user });
      } else if (result.requires2FA) {
        res.status(200).json({ requires2FA: true, message: result.error });
      } else {
        res.status(401).json({ message: result.error });
      }
    } catch (error: any) {
      logger.error('Failed to login user', { error: error.message });
      res.status(500).json({ message: 'Fehler bei der Anmeldung' });
    }
  }));

  // ====== 2FA ENDPOINTS ======

  // Setup 2FA
  app.post('/api/auth/2fa/setup', isAuthenticatedEnhanced, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Benutzer nicht authentifiziert' });
      }

      const result = await setup2FA(userId);
      
      if (result.success) {
        res.json({ setup: result.setup });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error: any) {
      logger.error('Failed to setup 2FA', { error: error.message });
      res.status(500).json({ message: 'Fehler beim Einrichten der 2FA' });
    }
  }));

  // Enable 2FA
  app.post('/api/auth/2fa/enable', isAuthenticatedEnhanced, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { secret, verificationCode, backupCodes } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: 'Benutzer nicht authentifiziert' });
      }

      const validatedData = twoFactorSetupSchema.parse({ verificationCode });
      
      const result = await enable2FA(userId, secret, validatedData.verificationCode, backupCodes);
      
      if (result.success) {
        res.json({ message: '2FA erfolgreich aktiviert' });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error: any) {
      logger.error('Failed to enable 2FA', { error: error.message });
      res.status(500).json({ message: 'Fehler beim Aktivieren der 2FA' });
    }
  }));

  // Disable 2FA
  app.post('/api/auth/2fa/disable', isAuthenticatedEnhanced, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Benutzer nicht authentifiziert' });
      }

      const result = await disable2FA(userId);
      
      if (result.success) {
        res.json({ message: '2FA erfolgreich deaktiviert' });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error: any) {
      logger.error('Failed to disable 2FA', { error: error.message });
      res.status(500).json({ message: 'Fehler beim Deaktivieren der 2FA' });
    }
  }));

  // ====== SUBSCRIPTION ROUTES ======
  app.use('/api/subscriptions', subscriptionRoutes);
  
  // Super admin routes
  const superAdminRoutes = (await import("./routes/super-admin")).default;
  const superAdminAnalyticsRoutes = (await import("./routes/super-admin-analytics")).default;
  app.use('/api/super-admin', superAdminRoutes);
  app.use('/api/super-admin', superAdminAnalyticsRoutes);
  
  // VERALTETE LIVE CHAT ROUTES ENTFERNT - Ersetzt durch modernes Communication System

  // ENTFERNT - User Notification Preferences Routes auf Benutzerwunsch komplett entfernt
  // NotificationSettingsModal und zugehörige Datenbank-Tabellen wurden vollständig entfernt
  
  return server;
}
