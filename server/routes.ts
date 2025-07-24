import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { seedPlayers } from "./seedPlayers";
import {
  insertClubSchema,
  insertMemberSchema,
  insertTeamSchema,
  insertFacilitySchema,
  insertBookingSchema,
  bookingFormSchema,
  insertEventSchema,
  insertFinanceSchema,
  insertPlayerSchema,
  insertPlayerTeamAssignmentSchema,
  memberFeeFormSchema,
  trainingFeeFormSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Club routes
  app.get('/api/clubs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userClubs = await storage.getUserClubs(userId);
      const clubs = await Promise.all(
        userClubs.map(async (membership) => {
          const club = await storage.getClub(membership.clubId);
          return { ...club, role: membership.role, status: membership.status };
        })
      );
      res.json(clubs);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      res.status(500).json({ message: "Failed to fetch clubs" });
    }
  });

  app.post('/api/clubs', isAuthenticated, async (req: any, res) => {
    try {
      const clubData = insertClubSchema.parse(req.body);
      const club = await storage.createClub(clubData);
      
      // Add the creator as a club administrator
      await storage.addUserToClub({
        userId: req.user.claims.sub,
        clubId: club.id,
        role: 'club-administrator',
        status: 'active',
      });

      res.json(club);
    } catch (error) {
      console.error("Error creating club:", error);
      res.status(500).json({ message: "Failed to create club" });
    }
  });

  // Dashboard routes
  app.get('/api/clubs/:clubId/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const stats = await storage.getDashboardStats(clubId);
      const activities = await storage.getRecentActivity(clubId);
      res.json({ stats, activities });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Member routes
  app.get('/api/clubs/:clubId/members', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const members = await storage.getMembers(clubId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post('/api/clubs/:clubId/members', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const memberData = insertMemberSchema.parse({ ...req.body, clubId });
      const member = await storage.createMember(memberData);
      res.json(member);
    } catch (error) {
      console.error("Error creating member:", error);
      res.status(500).json({ message: "Failed to create member" });
    }
  });

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
        bookingData.facilityId, 
        bookingData.startTime, 
        bookingData.endTime
      );
      
      if (!availability.available) {
        return res.status(400).json({ 
          message: `Anlage ist zur gewählten Zeit nicht verfügbar. Maximal ${availability.maxConcurrent} Buchung(en) erlaubt, aktuell ${availability.currentBookings} Buchung(en) vorhanden.`,
          conflictingBookings: availability.conflictingBookings
        });
      }
      
      const booking = await storage.createBooking(bookingData);
      console.log("DEBUG Route: Created booking:", booking);
      res.json(booking);
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
      
      // Clean up cost field for proper decimal handling
      if (updates.cost) {
        updates.cost = parseFloat(updates.cost).toString();
      }
      
      // Check availability if time or facility is being updated
      if (updates.facilityId || updates.startTime || updates.endTime) {
        const currentBooking = await storage.getBooking(id);
        if (!currentBooking) {
          return res.status(404).json({ message: "Booking not found" });
        }
        
        const facilityId = updates.facilityId || currentBooking.facilityId;
        const startTime = updates.startTime ? new Date(updates.startTime) : new Date(currentBooking.startTime);
        const endTime = updates.endTime ? new Date(updates.endTime) : new Date(currentBooking.endTime);
        
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

  // Event routes
  app.get('/api/clubs/:clubId/events', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const events = await storage.getEvents(clubId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post('/api/clubs/:clubId/events', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const eventData = insertEventSchema.parse({ ...req.body, clubId });
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
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

  // Member fees routes
  app.get('/api/clubs/:clubId/member-fees', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const memberFees = await storage.getMemberFees(clubId);
      res.json(memberFees);
    } catch (error) {
      console.error('Error fetching member fees:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/clubs/:clubId/member-fees', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const memberFeeData = { ...req.body, clubId };
      const memberFee = await storage.createMemberFee(memberFeeData);
      res.status(201).json(memberFee);
    } catch (error) {
      console.error('Error creating member fee:', error);
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

  // Seed data route (for development)
  app.post('/api/seed-data', isAuthenticated, async (req: any, res) => {
    try {
      // Create sample club
      const club = await storage.createClub({
        name: "FC Musterverein",
        description: "Ein Musterverein für die Demonstration der TeamIO Anwendung",
        address: "Musterstraße 123, 12345 Musterstadt",
        phone: "+49 123 456789",
        email: "info@fc-musterverein.de",
        website: "https://fc-musterverein.de",
      });

      // Add current user as club administrator
      await storage.addUserToClub({
        userId: req.user.claims.sub,
        clubId: club.id,
        role: 'club-administrator',
        status: 'active',
      });

      // Create sample teams
      const teams = await Promise.all([
        storage.createTeam({
          clubId: club.id,
          name: "Herren 1",
          category: "senior",
          gender: "male",
          maxMembers: 20,
          status: "active",
        }),
        storage.createTeam({
          clubId: club.id,
          name: "U17 Mädchen",
          category: "youth",
          ageGroup: "U17",
          gender: "female",
          maxMembers: 16,
          status: "active",
        }),
        storage.createTeam({
          clubId: club.id,
          name: "U15 Jungen",
          category: "youth",
          ageGroup: "U15",
          gender: "male",
          maxMembers: 16,
          status: "active",
        }),
      ]);

      // Create sample facilities
      await Promise.all([
        storage.createFacility({
          clubId: club.id,
          name: "Hauptplatz",
          type: "field",
          description: "Hauptspielfeld mit Rasen",
          capacity: 500,
          location: "Zentral",
          status: "active",
        }),
        storage.createFacility({
          clubId: club.id,
          name: "Nebenplatz",
          type: "field",
          description: "Trainingsplatz mit Kunstrasen",
          capacity: 200,
          location: "Neben dem Hauptplatz",
          status: "active",
        }),
      ]);

      // Create sample members
      const sampleMembers = [
        { firstName: "Max", lastName: "Mustermann", email: "max@example.com", birthDate: "1990-05-15" },
        { firstName: "Lisa", lastName: "Müller", email: "lisa@example.com", birthDate: "2005-08-22" },
        { firstName: "Tom", lastName: "Schmidt", email: "tom@example.com", birthDate: "2007-03-10" },
        { firstName: "Anna", lastName: "Weber", email: "anna@example.com", birthDate: "2006-11-30" },
        { firstName: "Chris", lastName: "Johnson", email: "chris@example.com", birthDate: "1988-12-05" },
      ];

      for (const memberData of sampleMembers) {
        await storage.createMember({
          clubId: club.id,
          ...memberData,
          status: "active",
          joinDate: new Date().toISOString().split('T')[0],
        });
      }

      res.json({ message: "Sample data created successfully", club });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  // Seed players route (for development)
  app.post('/api/seed-players', isAuthenticated, async (req: any, res) => {
    try {
      await seedPlayers();
      res.json({ message: "Player data seeded successfully" });
    } catch (error) {
      console.error("Error seeding player data:", error);
      res.status(500).json({ message: "Failed to seed player data" });
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

  const httpServer = createServer(app);
  return httpServer;
}
