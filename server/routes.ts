import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupFirebaseAuth, isAuthenticatedEnhanced } from "./firebaseAuth";
// Security imports temporarily commented for Firebase overhaul
// import { requireClubAccess } from "./security";
import { logger, ValidationError, NotFoundError, DatabaseError, AuthorizationError } from "./logger";
import { handleErrorReports, handlePerformanceMetrics } from "./error-reporting";

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
  memberFeeFormSchema,
  trainingFeeFormSchema,
  messageFormSchema,
  announcementFormSchema,
  insertMessageSchema,
  insertAnnouncementSchema,
  insertNotificationSchema,
  insertCommunicationPreferencesSchema,
} from "@shared/schema";

// Additional imports for Firebase auth
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware (Replit OpenID Connect) - MUST BE FIRST for session setup
  await setupAuth(app);

  // Firebase authentication endpoint - Robust approach with proper error handling
  app.post('/api/auth/firebase', async (req: any, res: any) => {
    const { userData } = req.body;
    
    if (!userData || !userData.uid) {
      return res.status(400).json({ error: 'Invalid user data - missing uid' });
    }
    
    try {
      console.log('Firebase auth request received:', { uid: userData.uid, email: userData.email });
      
      // Create Firebase user with provider-specific ID (Google only)
      const firebaseUserId = `google_${userData.uid}`;
      
      const userDataToInsert = {
        id: firebaseUserId,
        email: userData.email,
        authProvider: 'google',
        providerUserId: userData.uid,
        firstName: userData.displayName?.split(' ')[0] || null,
        lastName: userData.displayName?.split(' ').slice(1).join(' ') || null,
        profileImageUrl: userData.photoURL,
        lastLoginAt: new Date(),
      };
      
      console.log('=== FIREBASE AUTH DEBUG ===');
      console.log('Original userData:', userData);
      console.log('Processed userDataToInsert:', userDataToInsert);
      
      console.log('User data to insert:', userDataToInsert);
      
      // Upsert Firebase user to database with provider info
      const dbUser = await storage.upsertUser(userDataToInsert);
      
      console.log('Database user created/updated:', { id: dbUser.id, email: dbUser.email });
      
      // Create simple session cookie manually - use database user data
      const userToken = Buffer.from(JSON.stringify({
        sub: dbUser.id, // Use actual database user ID
        email: dbUser.email,
        first_name: dbUser.firstName,
        last_name: dbUser.lastName,
        profile_image_url: dbUser.profileImageUrl,
        authProvider: 'google',
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      })).toString('base64');
      
      // Set cookie manually
      res.cookie('firebase-auth', userToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
      });
      
      logger.info('Firebase user authenticated successfully', { 
        userId: dbUser.id, 
        email: dbUser.email, 
        provider: 'firebase' 
      });
      
      res.json({ 
        success: true, 
        userId: dbUser.id, 
        message: 'Firebase authentication successful' 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Firebase authentication error:', error);
      logger.error('Firebase authentication failed', { 
        error: errorMessage, 
        userId: userData.uid, 
        email: userData.email 
      });
      res.status(500).json({ 
        error: 'Firebase authentication failed', 
        details: errorMessage,
        userData: userData
      });
    }
  });
  
  // Firebase auth setup (Google & Facebook)
  setupFirebaseAuth(app);

  // CSRF token endpoint
  // CSRF token temporarily disabled for Firebase overhaul
  // app.get('/api/csrf-token', isAuthenticated, generateCSRFToken);

  // Error reporting endpoints
  app.post('/api/errors', handleErrorReports);
  app.post('/api/performance', handlePerformanceMetrics);

  // Enhanced isAuthenticated middleware for both Replit and Firebase
  const isAuthenticatedEnhanced = async (req: any, res: any, next: any) => {
    const user = req.user as any;

    // Check Replit auth first
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
          // Fall through to Firebase auth check
        }
      }
    }

    // Check Firebase auth cookie
    const firebaseAuth = req.cookies['firebase-auth'];
    
    if (firebaseAuth) {
      try {
        let decodedCookie = firebaseAuth;
        try {
          decodedCookie = decodeURIComponent(firebaseAuth);
        } catch (e) {
          // Cookie might not be URL encoded
        }
        const userData = JSON.parse(Buffer.from(decodedCookie, 'base64').toString());
        
        if (userData.exp > Date.now()) {
          // Create compatible user object for downstream middleware
          req.user = {
            claims: {
              sub: userData.sub,
              email: userData.email,
              first_name: userData.first_name,
              last_name: userData.last_name,
              profile_image_url: userData.profile_image_url,
            },
            authProvider: userData.authProvider
          };
          return next();
        } else {
          console.log('Firebase token expired:', { exp: userData.exp, now: Date.now() });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('Firebase token decode error:', errorMessage, 'Cookie:', firebaseAuth?.substring(0, 50) + '...');
      }
    }

    return res.status(401).json({ message: "Not authenticated" });
  };

  // Auth routes (supports both Replit and Firebase auth) - NO MIDDLEWARE, handles auth internally
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

      // Try Firebase authentication
      const firebaseAuthCookie = req.cookies['firebase-auth'];
      if (firebaseAuthCookie) {
        console.log('Found Firebase auth cookie, decoding...');
        try {
          let decodedCookie = firebaseAuthCookie;
          
          // Handle URL-encoded cookies
          try {
            decodedCookie = decodeURIComponent(firebaseAuthCookie);
          } catch (e) {
            // Cookie might not be URL encoded, use as-is
            console.log('Cookie not URL encoded, using as-is');
          }
          
          const decoded = JSON.parse(Buffer.from(decodedCookie, 'base64').toString());
          console.log('Decoded Firebase token:', { 
            sub: decoded.sub, 
            email: decoded.email, 
            exp: decoded.exp,
            expDate: new Date(decoded.exp).toISOString(),
            now: new Date().toISOString(),
            valid: decoded.exp > Date.now()
          });
          
          if (decoded.exp && decoded.exp > Date.now()) {
            const firebaseUserId = decoded.sub;
            console.log('Looking up Firebase user:', firebaseUserId);
            const user = await storage.getUser(firebaseUserId);
            if (user) {
              console.log('Firebase user found in DB:', { id: user.id, email: user.email });
              return res.json(user);
            } else {
              console.log('Firebase user not found in database, user ID:', firebaseUserId);
              // Return 401 instead of trying to create user here
              return res.status(401).json({ message: "Firebase user not found in database" });
            }
          } else {
            console.log('Firebase token expired', {
              exp: decoded.exp,
              now: Date.now(),
              expired: decoded.exp <= Date.now()
            });
            return res.status(401).json({ message: "Firebase token expired" });
          }
        } catch (cookieError) {
          console.error('Firebase cookie parsing error:', cookieError);
          console.log('Raw cookie (first 100 chars):', firebaseAuthCookie?.substring(0, 100));
          return res.status(401).json({ message: "Invalid Firebase cookie" });
        }
      } else {
        console.log('No Firebase auth cookie found');
      }

      console.log('No valid authentication found');
      res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User permission routes
  app.get('/api/clubs/:clubId/user-membership', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const membership = await storage.getUserClubMembership(userId, clubId);
    
    logger.info('User membership retrieved', { userId, clubId, requestId: req.id });
    res.json({
      isMember: !!membership,
      role: membership?.role || null,
      joinedAt: membership?.joinedAt || null
    });
  }));

  app.get('/api/clubs/:clubId/user-teams', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
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

  // Club routes (authenticated - returns user's clubs with membership info)
  app.get('/api/clubs', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.claims.sub;
    if (!userId) {
      throw new AuthorizationError('User ID not found in token');
    }
    
    const userClubs = await storage.getUserClubs(userId);
    const clubs = await Promise.all(
      userClubs.map(async (membership) => {
        const club = await storage.getClub(membership.clubId);
        if (!club) {
          logger.warn('Club not found for membership', { clubId: membership.clubId, userId });
          return null;
        }
        return { ...club, role: membership.role, status: membership.status };
      })
    );
    
    const validClubs = clubs.filter(club => club !== null);
    logger.info('User clubs retrieved', { userId, count: validClubs.length, requestId: req.id });
    res.json(validClubs);
  }));

  app.post('/api/clubs', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.claims.sub;
    if (!userId) {
      throw new AuthorizationError('User ID not found in token');
    }

    const clubData = insertClubSchema.parse(req.body);
    const club = await storage.createClub(clubData);
    
    // Add the creator as a club administrator
    await storage.addUserToClub({
      userId,
      clubId: club.id,
      role: 'club-administrator',
      status: 'active',
    });

    logger.info('Club created', { clubId: club.id, userId, requestId: req.id });
    res.status(201).json(club);
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

  app.put('/api/clubs/:clubId/members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clubId = parseInt(req.params.clubId);
      const updates = { ...req.body };
      
      // Clean up empty date fields to prevent PostgreSQL errors
      if (updates.birthDate === '') {
        updates.birthDate = null;
      }
      if (updates.joinDate === '') {
        updates.joinDate = null;
      }
      
      const member = await storage.updateMember(id, updates);
      res.json(member);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  app.delete('/api/clubs/:clubId/members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clubId = parseInt(req.params.clubId);
      await storage.deleteMember(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

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

  // Event routes (Events sind jetzt Teil der Bookings - diese Route ist deprecated)
  // Der Kalender sollte nur noch /api/clubs/:clubId/bookings verwenden
  app.get('/api/clubs/:clubId/events', isAuthenticated, async (req: any, res) => {
    try {
      // Zurückgabe eines leeren Arrays, um Duplikate zu vermeiden
      // Alle Events sind jetzt in der Bookings-API enthalten
      res.json([]);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

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

  // Training fees routes
  app.get('/api/clubs/:clubId/training-fees', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const trainingFees = await storage.getTrainingFees(clubId);
      res.json(trainingFees);
    } catch (error) {
      console.error('Error fetching training fees:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/clubs/:clubId/training-fees', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const trainingFeeData = { ...req.body, clubId };
      const trainingFee = await storage.createTrainingFee(trainingFeeData);
      res.status(201).json(trainingFee);
    } catch (error) {
      console.error('Error creating training fee:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });





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
      
      // Parse and transform the form data
      const formData = memberFeeFormSchema.parse(req.body);
      const memberFeeData = {
        ...formData,
        clubId,
        memberId: parseInt(formData.memberId),
        amount: formData.amount,
        // Calculate next due date based on start date and period
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
      
      // Parse and transform the form data
      const formData = trainingFeeFormSchema.parse(req.body);
      const trainingFeeData = {
        ...formData,
        clubId,
        amount: formData.amount,
        // Parse team and player IDs from arrays
        teamIds: formData.teamIds || null,
        playerIds: formData.playerIds || null,
        // Calculate next due date based on start date and period
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
  
  // Message routes
  app.get('/api/clubs/:clubId/messages', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const messages = await storage.getMessages(clubId, userId);
    logger.info('Messages retrieved', { clubId, userId, count: messages.length, requestId: req.id });
    res.json(messages);
  }));

  app.get('/api/clubs/:clubId/messages/:messageId', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const messageId = parseInt(req.params.messageId);
    
    if (!messageId || isNaN(messageId)) {
      throw new ValidationError('Invalid message ID', 'messageId');
    }
    
    const message = await storage.getMessage(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }
    
    logger.info('Message retrieved', { messageId, requestId: req.id });
    res.json(message);
  }));

  app.post('/api/clubs/:clubId/messages', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    console.log('🔍 MESSAGE DEBUG - Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 MESSAGE DEBUG - Club ID:', clubId);
    console.log('🔍 MESSAGE DEBUG - User ID:', userId);
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    // Add server-side fields before validation
    const requestDataWithServerFields = {
      ...req.body,
      clubId,
      senderId: userId
    };
    
    try {
      const validatedData = messageFormSchema.parse(requestDataWithServerFields);
      console.log('🔍 MESSAGE DEBUG - Validation successful:', JSON.stringify(validatedData, null, 2));
    } catch (validationError) {
      console.error('🚨 MESSAGE VALIDATION ERROR:', validationError);
      throw validationError;
    }
    
    const validatedData = messageFormSchema.parse(requestDataWithServerFields);
    
    // Create the message
    const messageData = {
      clubId,
      senderId: userId,
      subject: validatedData.subject,
      content: validatedData.content,
      messageType: validatedData.messageType || 'direct',
      priority: validatedData.priority || 'normal',
      conversationId: validatedData.conversationId,
      threadId: validatedData.threadId,
      scheduledFor: validatedData.scheduledFor,
      expiresAt: validatedData.expiresAt,
      attachments: validatedData.attachments,
      metadata: validatedData.metadata,
    };
    
    const message = await storage.createMessage(messageData);
    
    // Add recipients
    if (validatedData.recipients && validatedData.recipients.length > 0) {
      const recipientData = validatedData.recipients.map(recipient => ({
        messageId: message.id,
        recipientType: recipient.type,
        recipientId: recipient.id,
      }));
      
      await storage.addMessageRecipients(recipientData);
    }
    
    logger.info('Message created', { messageId: message.id, clubId, userId, requestId: req.id });
    res.status(201).json(message);
  }));

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
    const userId = req.user.claims.sub;
    
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
    const userId = req.user.claims.sub;
    
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
    const userId = req.user.claims.sub;
    
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
    const userId = req.user.claims.sub;
    
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
    const userId = req.user.id;
    
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
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const announcements = await storage.getAnnouncements(clubId);
    logger.info('Announcements retrieved', { clubId, count: announcements.length, requestId: req.id });
    res.json(announcements);
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
    const userId = req.user.claims.sub;
    
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
    
    try {
      const validatedData = announcementFormSchema.parse(requestDataWithServerFields);
      console.log('🔍 ANNOUNCEMENT DEBUG - Validation successful:', JSON.stringify(validatedData, null, 2));
    } catch (validationError) {
      console.error('🚨 ANNOUNCEMENT VALIDATION ERROR:', validationError);
      throw validationError;
    }
    
    const validatedData = announcementFormSchema.parse(requestDataWithServerFields);
    
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
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const notifications = await storage.getNotifications(userId, clubId);
    logger.info('Notifications retrieved', { clubId, userId, count: notifications.length, requestId: req.id });
    res.json(notifications);
  }));

  app.get('/api/clubs/:clubId/notifications/count', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
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
    const userId = req.user.claims.sub;
    
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

  // Communication preferences routes
  app.get('/api/clubs/:clubId/communication-preferences', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const preferences = await storage.getCommunicationPreferences(userId, clubId);
    res.json(preferences || {});
  }));

  app.put('/api/clubs/:clubId/communication-preferences', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const validatedData = insertCommunicationPreferencesSchema.parse(req.body);
    const preferences = await storage.updateCommunicationPreferences(userId, clubId, validatedData);
    
    logger.info('Communication preferences updated', { clubId, userId, requestId: req.id });
    res.json(preferences);
  }));

  // Communication statistics routes
  app.get('/api/clubs/:clubId/communication-stats', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const stats = await storage.getCommunicationStats(clubId, userId);
    res.json(stats);
  }));

  // Search routes
  app.get('/api/clubs/:clubId/search/messages', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections by user and club
  const connections = new Map<string, { ws: WebSocket; userId: string; clubId: number; authenticated: boolean }>();
  
  wss.on('connection', (ws: WebSocket, req) => {
    const connectionId = Math.random().toString(36).substring(7);
    let connectionInfo = { ws, userId: '', clubId: 0, authenticated: false };
    
    logger.info('WebSocket connection established', { connectionId });
    
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'authenticate':
            // In a real implementation, you would validate the token here
            // For now, we'll accept the authentication data from the client
            connectionInfo.userId = message.userId;
            connectionInfo.clubId = message.clubId;
            connectionInfo.authenticated = true;
            connections.set(connectionId, connectionInfo);
            
            ws.send(JSON.stringify({
              type: 'authenticated',
              success: true,
              connectionId
            }));
            
            // Join user to club-specific room
            logger.info('WebSocket authenticated', { 
              connectionId, 
              userId: message.userId, 
              clubId: message.clubId 
            });
            break;
            
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
            
          case 'message_sent':
            // Broadcast new message to relevant club members
            if (connectionInfo.authenticated) {
              broadcastToClub(connectionInfo.clubId, {
                type: 'new_message',
                message: message.data,
                senderId: connectionInfo.userId
              });
            }
            break;
            
          case 'announcement_published':
            // Broadcast new announcement to club members
            if (connectionInfo.authenticated) {
              broadcastToClub(connectionInfo.clubId, {
                type: 'new_announcement',
                announcement: message.data,
                authorId: connectionInfo.userId
              });
            }
            break;
            
          case 'notification_created':
            // Send notification to specific user
            if (connectionInfo.authenticated && message.targetUserId) {
              sendToUser(message.targetUserId, connectionInfo.clubId, {
                type: 'new_notification',
                notification: message.data
              });
            }
            break;
            
          default:
            logger.warn('Unknown WebSocket message type', { type: message.type, connectionId });
        }
      } catch (error: any) {
        logger.error('WebSocket message error', { error: error.message, connectionId });
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
      connections.delete(connectionId);
      logger.info('WebSocket connection closed', { connectionId });
    });
    
    ws.on('error', (error: any) => {
      logger.error('WebSocket error', { error: error.message, connectionId });
      connections.delete(connectionId);
    });
  });
  
  // Helper function to broadcast message to all club members
  function broadcastToClub(clubId: number, message: any) {
    connections.forEach((connection, connectionId) => {
      if (connection.authenticated && 
          connection.clubId === clubId && 
          connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    });
  }
  
  // Helper function to send message to specific user
  function sendToUser(userId: string, clubId: number, message: any) {
    connections.forEach((connection, connectionId) => {
      if (connection.authenticated && 
          connection.userId === userId && 
          connection.clubId === clubId &&
          connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    });
  }
  
  // Store WebSocket utilities for use in routes
  (httpServer as any).broadcast = {
    toClub: broadcastToClub,
    toUser: sendToUser,
    connections
  };
  
  return httpServer;
}
