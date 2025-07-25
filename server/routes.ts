import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireClubAccess, csrfProtection, generateCSRFToken } from "./security";
import { logger, ValidationError, NotFoundError, DatabaseError, AuthorizationError } from "./logger";
import { handleErrorReports, handlePerformanceMetrics } from "./error-reporting";

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

// Helper function to handle async route errors
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // CSRF token endpoint
  app.get('/api/csrf-token', isAuthenticated, generateCSRFToken);

  // Error reporting endpoints
  app.post('/api/errors', handleErrorReports);
  app.post('/api/performance', handlePerformanceMetrics);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.claims.sub;
    if (!userId) {
      throw new AuthorizationError('User ID not found in token');
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    logger.info('User data retrieved', { userId, requestId: req.id });
    res.json(user);
  }));

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

  // Club routes
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

  app.post('/api/clubs', isAuthenticated, csrfProtection, asyncHandler(async (req: any, res: any) => {
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
  app.get('/api/clubs/:clubId/dashboard', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    
    const [stats, activities] = await Promise.all([
      storage.getDashboardStats(clubId),
      storage.getRecentActivity(clubId)
    ]);
    
    logger.info('Dashboard data retrieved', { clubId, requestId: req.id });
    res.json({ stats, activities });
  }));

  // Member routes
  app.get('/api/clubs/:clubId/members', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const members = await storage.getMembers(clubId);
    
    logger.info('Members retrieved', { clubId, count: members.length, requestId: req.id });
    res.json(members);
  }));

  app.post('/api/clubs/:clubId/members', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const memberData = insertMemberSchema.parse({ ...req.body, clubId });
    const member = await storage.createMember(memberData);
    
    logger.info('Member created', { clubId, memberId: member.id, requestId: req.id });
    res.status(201).json(member);
  }));

  app.put('/api/clubs/:clubId/members/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.delete('/api/clubs/:clubId/members/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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
  app.get('/api/clubs/:clubId/teams', isAuthenticated, requireClubAccess, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const teams = await storage.getTeams(clubId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post('/api/clubs/:clubId/teams', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.put('/api/clubs/:clubId/teams/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.delete('/api/clubs/:clubId/teams/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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
  app.get('/api/clubs/:clubId/team-memberships', isAuthenticated, requireClubAccess, async (req: any, res) => {
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
  app.get('/api/clubs/:clubId/facilities', isAuthenticated, requireClubAccess, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const facilities = await storage.getFacilities(clubId);
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.post('/api/clubs/:clubId/facilities', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.patch('/api/clubs/:clubId/facilities/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.delete('/api/clubs/:clubId/facilities/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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
  app.get('/api/clubs/:clubId/bookings', isAuthenticated, requireClubAccess, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const bookings = await storage.getBookings(clubId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/clubs/:clubId/bookings', isAuthenticated, requireClubAccess, async (req: any, res) => {
    try {
      console.log("DEBUG Route: Raw request body:", req.body);
      const clubId = parseInt(req.params.clubId);
      const bookingData = bookingFormSchema.parse({ ...req.body, clubId });
      console.log("DEBUG Route: Validated data:", bookingData);
      
      // Check availability before creating booking
      const availability = await storage.checkBookingAvailability(
        bookingData.facilityId!, 
        bookingData.startTime, 
        bookingData.endTime
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

  app.get('/api/clubs/:clubId/bookings/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.patch('/api/clubs/:clubId/bookings/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.delete('/api/clubs/:clubId/bookings/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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
  app.post('/api/clubs/:clubId/bookings/check-availability', isAuthenticated, requireClubAccess, async (req: any, res) => {
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
  app.get('/api/clubs/:clubId/finances', isAuthenticated, requireClubAccess, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const finances = await storage.getFinances(clubId);
      res.json(finances);
    } catch (error) {
      console.error("Error fetching finances:", error);
      res.status(500).json({ message: "Failed to fetch finances" });
    }
  });

  app.get('/api/clubs/:clubId/finances/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.post('/api/clubs/:clubId/finances', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.patch('/api/clubs/:clubId/finances/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.delete('/api/clubs/:clubId/finances/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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
  app.get('/api/clubs/:clubId/training-fees', isAuthenticated, requireClubAccess, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const trainingFees = await storage.getTrainingFees(clubId);
      res.json(trainingFees);
    } catch (error) {
      console.error('Error fetching training fees:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/clubs/:clubId/training-fees', isAuthenticated, requireClubAccess, async (req: any, res) => {
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
  app.get("/api/clubs/:clubId/players", isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.post("/api/clubs/:clubId/players", isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.patch("/api/clubs/:clubId/players/:id", isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.delete("/api/clubs/:clubId/players/:id", isAuthenticated, requireClubAccess, async (req: any, res) => {
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
  app.get('/api/clubs/:clubId/member-fees', isAuthenticated, requireClubAccess, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const memberFees = await storage.getMemberFees(clubId);
      res.json(memberFees);
    } catch (error) {
      console.error("Error fetching member fees:", error);
      res.status(500).json({ message: "Failed to fetch member fees" });
    }
  });

  app.post('/api/clubs/:clubId/member-fees', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.patch('/api/clubs/:clubId/member-fees/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const memberFee = await storage.updateMemberFee(id, req.body);
      res.json(memberFee);
    } catch (error) {
      console.error("Error updating member fee:", error);
      res.status(500).json({ message: "Failed to update member fee" });
    }  
  });

  app.delete('/api/clubs/:clubId/member-fees/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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
  app.get('/api/clubs/:clubId/training-fees', isAuthenticated, requireClubAccess, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const trainingFees = await storage.getTrainingFees(clubId);
      res.json(trainingFees);
    } catch (error) {
      console.error("Error fetching training fees:", error);
      res.status(500).json({ message: "Failed to fetch training fees" });
    }
  });

  app.post('/api/clubs/:clubId/training-fees', isAuthenticated, requireClubAccess, async (req: any, res) => {
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

  app.patch('/api/clubs/:clubId/training-fees/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const trainingFee = await storage.updateTrainingFee(id, req.body);
      res.json(trainingFee);
    } catch (error) {
      console.error("Error updating training fee:", error);
      res.status(500).json({ message: "Failed to update training fee" });
    }
  });

  app.delete('/api/clubs/:clubId/training-fees/:id', isAuthenticated, requireClubAccess, async (req: any, res) => {
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
  app.get('/api/clubs/:clubId/messages', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const messages = await storage.getMessages(clubId, userId);
    logger.info('Messages retrieved', { clubId, userId, count: messages.length, requestId: req.id });
    res.json(messages);
  }));

  app.get('/api/clubs/:clubId/messages/:messageId', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
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

  app.post('/api/clubs/:clubId/messages', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const validatedData = messageFormSchema.parse(req.body);
    
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

  app.patch('/api/clubs/:clubId/messages/:messageId', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
    const messageId = parseInt(req.params.messageId);
    
    if (!messageId || isNaN(messageId)) {
      throw new ValidationError('Invalid message ID', 'messageId');
    }
    
    const message = await storage.updateMessage(messageId, req.body);
    logger.info('Message updated', { messageId, requestId: req.id });
    res.json(message);
  }));

  app.delete('/api/clubs/:clubId/messages/:messageId', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
    const messageId = parseInt(req.params.messageId);
    
    if (!messageId || isNaN(messageId)) {
      throw new ValidationError('Invalid message ID', 'messageId');
    }
    
    await storage.deleteMessage(messageId);
    logger.info('Message deleted', { messageId, requestId: req.id });
    res.status(204).send();
  }));

  app.post('/api/clubs/:clubId/messages/:messageId/read', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
    const messageId = parseInt(req.params.messageId);
    const userId = req.user.claims.sub;
    
    if (!messageId || isNaN(messageId)) {
      throw new ValidationError('Invalid message ID', 'messageId');
    }
    
    await storage.markMessageAsRead(messageId, userId);
    logger.info('Message marked as read', { messageId, userId, requestId: req.id });
    res.status(204).send();
  }));

  // Announcement routes
  app.get('/api/clubs/:clubId/announcements', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const announcements = await storage.getAnnouncements(clubId);
    logger.info('Announcements retrieved', { clubId, count: announcements.length, requestId: req.id });
    res.json(announcements);
  }));

  app.get('/api/clubs/:clubId/announcements/:announcementId', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
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

  app.post('/api/clubs/:clubId/announcements', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const validatedData = announcementFormSchema.parse(req.body);
    
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

  app.patch('/api/clubs/:clubId/announcements/:announcementId', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
    const announcementId = parseInt(req.params.announcementId);
    
    if (!announcementId || isNaN(announcementId)) {
      throw new ValidationError('Invalid announcement ID', 'announcementId');
    }
    
    const announcement = await storage.updateAnnouncement(announcementId, req.body);
    logger.info('Announcement updated', { announcementId, requestId: req.id });
    res.json(announcement);
  }));

  app.delete('/api/clubs/:clubId/announcements/:announcementId', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
    const announcementId = parseInt(req.params.announcementId);
    
    if (!announcementId || isNaN(announcementId)) {
      throw new ValidationError('Invalid announcement ID', 'announcementId');
    }
    
    await storage.deleteAnnouncement(announcementId);
    logger.info('Announcement deleted', { announcementId, requestId: req.id });
    res.status(204).send();
  }));

  app.post('/api/clubs/:clubId/announcements/:announcementId/publish', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
    const announcementId = parseInt(req.params.announcementId);
    
    if (!announcementId || isNaN(announcementId)) {
      throw new ValidationError('Invalid announcement ID', 'announcementId');
    }
    
    const announcement = await storage.publishAnnouncement(announcementId);
    logger.info('Announcement published', { announcementId, requestId: req.id });
    res.json(announcement);
  }));

  app.post('/api/clubs/:clubId/announcements/:announcementId/pin', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
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
  app.get('/api/clubs/:clubId/notifications', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const notifications = await storage.getNotifications(userId, clubId);
    logger.info('Notifications retrieved', { clubId, userId, count: notifications.length, requestId: req.id });
    res.json(notifications);
  }));

  app.get('/api/clubs/:clubId/notifications/count', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const count = await storage.getUnreadNotificationsCount(userId, clubId);
    res.json({ count });
  }));

  app.post('/api/clubs/:clubId/notifications', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
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

  app.post('/api/clubs/:clubId/notifications/:notificationId/read', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
    const notificationId = parseInt(req.params.notificationId);
    
    if (!notificationId || isNaN(notificationId)) {
      throw new ValidationError('Invalid notification ID', 'notificationId');
    }
    
    await storage.markNotificationAsRead(notificationId);
    logger.info('Notification marked as read', { notificationId, requestId: req.id });
    res.status(204).send();
  }));

  app.post('/api/clubs/:clubId/notifications/read-all', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    await storage.markAllNotificationsAsRead(userId, clubId);
    logger.info('All notifications marked as read', { clubId, userId, requestId: req.id });
    res.status(204).send();
  }));

  app.delete('/api/clubs/:clubId/notifications/:notificationId', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
    const notificationId = parseInt(req.params.notificationId);
    
    if (!notificationId || isNaN(notificationId)) {
      throw new ValidationError('Invalid notification ID', 'notificationId');
    }
    
    await storage.deleteNotification(notificationId);
    logger.info('Notification deleted', { notificationId, requestId: req.id });
    res.status(204).send();
  }));

  // Communication preferences routes
  app.get('/api/clubs/:clubId/communication-preferences', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const preferences = await storage.getCommunicationPreferences(userId, clubId);
    res.json(preferences || {});
  }));

  app.put('/api/clubs/:clubId/communication-preferences', isAuthenticated, requireClubAccess, csrfProtection, asyncHandler(async (req: any, res: any) => {
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
  app.get('/api/clubs/:clubId/communication-stats', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user.claims.sub;
    
    if (!clubId || isNaN(clubId)) {
      throw new ValidationError('Invalid club ID', 'clubId');
    }
    
    const stats = await storage.getCommunicationStats(clubId, userId);
    res.json(stats);
  }));

  // Search routes
  app.get('/api/clubs/:clubId/search/messages', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
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

  app.get('/api/clubs/:clubId/search/announcements', isAuthenticated, requireClubAccess, asyncHandler(async (req: any, res: any) => {
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
