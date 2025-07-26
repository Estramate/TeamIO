import {
  users,
  clubs,
  clubMemberships,
  clubJoinRequests,
  members,
  teams,
  teamMemberships,
  players,
  playerTeamAssignments,
  playerStats,
  facilities,
  bookings,
  finances,
  memberFees,
  trainingFees,
  messages,
  messageRecipients,
  announcements,
  notifications,
  communicationPreferences,
  type User,
  type UpsertUser,
  type Club,
  type InsertClub,
  type ClubMembership,
  type InsertClubMembership,
  type ClubJoinRequest,
  type InsertClubJoinRequest,
  type Member,
  type InsertMember,
  type Team,
  type InsertTeam,
  type TeamMembership,
  type InsertTeamMembership,
  type Player,
  type InsertPlayer,
  type PlayerTeamAssignment,
  type InsertPlayerTeamAssignment,
  type PlayerStats,
  type InsertPlayerStats,
  type Facility,
  type InsertFacility,
  type Booking,
  type InsertBooking,
  type Finance,
  type InsertFinance,
  type MemberFee,
  type InsertMemberFee,
  type TrainingFee,
  type InsertTrainingFee,
  type Message,
  type InsertMessage,
  type MessageRecipient,
  type InsertMessageRecipient,
  type Announcement,
  type InsertAnnouncement,
  type Notification,
  type InsertNotification,
  type CommunicationPreferences,
  type InsertCommunicationPreferences,
  type MessageWithRecipients,
  type AnnouncementWithAuthor,
  type CommunicationStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, ne, or, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (supports multiple auth providers)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;

  // Club operations
  getClubs(): Promise<Club[]>;
  getClub(id: number): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  updateClub(id: number, club: Partial<InsertClub>): Promise<Club>;
  deleteClub(id: number): Promise<void>;

  // Club membership operations
  getUserClubs(userId: string): Promise<ClubMembership[]>;
  getClubMembers(clubId: number): Promise<ClubMembership[]>;
  addUserToClub(membership: InsertClubMembership): Promise<ClubMembership>;
  removeUserFromClub(userId: string, clubId: number): Promise<void>;
  updateClubMembership(userId: string, clubId: number, updates: Partial<InsertClubMembership>): Promise<ClubMembership>;
  getUserClubMembership(userId: string, clubId: number): Promise<ClubMembership | undefined>;

  // Club join request operations
  createJoinRequest(request: InsertClubJoinRequest): Promise<ClubJoinRequest>;
  getClubJoinRequests(clubId: number): Promise<ClubJoinRequest[]>;
  getUserJoinRequests(userId: string): Promise<ClubJoinRequest[]>;
  getJoinRequest(requestId: number): Promise<ClubJoinRequest | undefined>;
  updateJoinRequestStatus(requestId: number, status: 'approved' | 'rejected', reviewedBy: string, reviewNotes?: string, approvedRole?: string): Promise<ClubJoinRequest>;
  getPendingJoinRequests(clubId: number): Promise<ClubJoinRequest[]>;

  // Member operations
  getMembers(clubId: number): Promise<Member[]>;
  getMember(id: number): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member>;
  deleteMember(id: number): Promise<void>;

  // Team operations
  getTeams(clubId: number): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;

  // Team membership operations
  getTeamMembers(teamId: number): Promise<TeamMembership[]>;
  getMemberTeams(memberId: number): Promise<TeamMembership[]>;
  addMemberToTeam(membership: InsertTeamMembership): Promise<TeamMembership>;
  removeMemberFromTeam(memberId: number, teamId: number): Promise<void>;
  updateTeamMembership(memberId: number, teamId: number, updates: Partial<InsertTeamMembership>): Promise<TeamMembership>;

  // Player operations
  getPlayers(clubId: number): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player>;
  deletePlayer(id: number): Promise<void>;

  // Player-Team assignment operations
  getPlayerTeams(playerId: number): Promise<PlayerTeamAssignment[]>;
  getTeamPlayers(teamId: number): Promise<PlayerTeamAssignment[]>;
  assignPlayerToTeam(assignment: InsertPlayerTeamAssignment): Promise<PlayerTeamAssignment>;
  removePlayerFromTeam(playerId: number, teamId: number): Promise<void>;
  updatePlayerTeamAssignment(playerId: number, teamId: number, updates: Partial<InsertPlayerTeamAssignment>): Promise<PlayerTeamAssignment>;

  // Player stats operations
  getPlayerStats(playerId: number, season?: string): Promise<PlayerStats[]>;
  getTeamStats(teamId: number, season?: string): Promise<PlayerStats[]>;
  createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats>;
  updatePlayerStats(id: number, stats: Partial<InsertPlayerStats>): Promise<PlayerStats>;
  deletePlayerStats(id: number): Promise<void>;

  // Facility operations
  getFacilities(clubId: number): Promise<Facility[]>;
  getFacility(id: number): Promise<Facility | undefined>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacility(id: number, facility: Partial<InsertFacility>): Promise<Facility>;
  deleteFacility(id: number): Promise<void>;

  // Booking operations
  getBookings(clubId: number): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking>;
  deleteBooking(id: number): Promise<void>;
  checkBookingAvailability(facilityId: number, startTime: Date, endTime: Date, excludeBookingId?: number): Promise<{ available: boolean; maxConcurrent: number; currentBookings: number; conflictingBookings: any[] }>;



  // Finance operations
  getFinances(clubId: number): Promise<Finance[]>;
  getFinance(id: number): Promise<Finance | undefined>;
  createFinance(finance: InsertFinance): Promise<Finance>;
  updateFinance(id: number, finance: Partial<InsertFinance>): Promise<Finance>;
  deleteFinance(id: number): Promise<void>;

  // Member fees operations
  getMemberFees(clubId: number): Promise<MemberFee[]>;
  createMemberFee(memberFee: InsertMemberFee): Promise<MemberFee>;
  updateMemberFee(id: number, memberFee: Partial<InsertMemberFee>): Promise<MemberFee>;
  deleteMemberFee(id: number): Promise<void>;

  // Training fees operations
  getTrainingFees(clubId: number): Promise<TrainingFee[]>;
  createTrainingFee(trainingFee: InsertTrainingFee): Promise<TrainingFee>;
  updateTrainingFee(id: number, trainingFee: Partial<InsertTrainingFee>): Promise<TrainingFee>;
  deleteTrainingFee(id: number): Promise<void>;

  // User permission operations  
  getUserTeamAssignments(userId: string, clubId: number): Promise<any[]>;

  // Dashboard operations
  getDashboardStats(clubId: number): Promise<any>;
  getRecentActivity(clubId: number): Promise<any[]>;

  // Communication operations
  // Message operations
  getMessages(clubId: number, userId?: string): Promise<MessageWithRecipients[]>;
  getMessage(id: number): Promise<MessageWithRecipients | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message>;
  deleteMessage(id: number): Promise<void>;
  markMessageAsRead(messageId: number, userId: string): Promise<void>;
  
  // Message recipient operations
  getMessageRecipients(messageId: number): Promise<MessageRecipient[]>;
  addMessageRecipients(recipients: InsertMessageRecipient[]): Promise<MessageRecipient[]>;
  updateMessageRecipientStatus(messageId: number, userId: string, status: string): Promise<void>;

  // Announcement operations
  getAnnouncements(clubId: number): Promise<AnnouncementWithAuthor[]>;
  getAnnouncement(id: number): Promise<AnnouncementWithAuthor | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;
  publishAnnouncement(id: number): Promise<Announcement>;
  pinAnnouncement(id: number, isPinned: boolean): Promise<Announcement>;

  // Notification operations
  getNotifications(userId: string, clubId: number): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: string, clubId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: string, clubId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;

  // Communication preferences operations
  getCommunicationPreferences(userId: string, clubId: number): Promise<CommunicationPreferences | undefined>;
  updateCommunicationPreferences(userId: string, clubId: number, preferences: Partial<InsertCommunicationPreferences>): Promise<CommunicationPreferences>;

  // Communication statistics
  getCommunicationStats(clubId: number, userId?: string): Promise<CommunicationStats>;

  // Search operations
  searchMessages(clubId: number, query: string, userId?: string): Promise<MessageWithRecipients[]>;
  searchAnnouncements(clubId: number, query: string): Promise<AnnouncementWithAuthor[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByEmailAndProvider(email: string, authProvider: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.authProvider, authProvider)));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First check if user exists by email + authProvider combination
    if (userData.email && userData.authProvider) {
      const existingUser = await this.getUserByEmailAndProvider(userData.email, userData.authProvider);
      if (existingUser) {
        // User with this email + provider combination exists - update and return
        const [updatedUser] = await db
          .update(users)
          .set({
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(users.email, userData.email), eq(users.authProvider, userData.authProvider)))
          .returning();
        return updatedUser;
      }
    }

    try {
      // Try to insert new user
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          authProvider: userData.authProvider || 'replit',
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error: any) {
      // Final fallback - if any error occurs, try to find existing user by email
      if (userData.email) {
        const existingUser = await this.getUserByEmail(userData.email);
        if (existingUser) {
          return existingUser;
        }
      }
      throw error;
    }
  }

  async getUserByEmailAndProvider(email: string, authProvider: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.authProvider, authProvider)));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  // Club operations
  async getClubs(): Promise<Club[]> {
    return await db.select().from(clubs).orderBy(asc(clubs.name));
  }

  async getClub(id: number): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club;
  }

  async createClub(club: InsertClub): Promise<Club> {
    const [newClub] = await db.insert(clubs).values(club).returning();
    return newClub;
  }

  async updateClub(id: number, club: Partial<InsertClub>): Promise<Club> {
    const [updatedClub] = await db
      .update(clubs)
      .set({ ...club, updatedAt: new Date() })
      .where(eq(clubs.id, id))
      .returning();
    return updatedClub;
  }

  async deleteClub(id: number): Promise<void> {
    await db.delete(clubs).where(eq(clubs.id, id));
  }

  // Club membership operations
  async getUserClubs(userId: string): Promise<ClubMembership[]> {
    return await db
      .select()
      .from(clubMemberships)
      .where(eq(clubMemberships.userId, userId))
      .orderBy(desc(clubMemberships.joinedAt));
  }

  async getClubMembers(clubId: number): Promise<ClubMembership[]> {
    return await db
      .select()
      .from(clubMemberships)
      .where(eq(clubMemberships.clubId, clubId))
      .orderBy(asc(clubMemberships.role));
  }

  async addUserToClub(membership: InsertClubMembership): Promise<ClubMembership> {
    const [newMembership] = await db
      .insert(clubMemberships)
      .values(membership)
      .returning();
    return newMembership;
  }

  async removeUserFromClub(userId: string, clubId: number): Promise<void> {
    await db
      .delete(clubMemberships)
      .where(
        and(
          eq(clubMemberships.userId, userId),
          eq(clubMemberships.clubId, clubId)
        )
      );
  }

  async updateClubMembership(
    userId: string,
    clubId: number,
    updates: Partial<InsertClubMembership>
  ): Promise<ClubMembership> {
    const [updatedMembership] = await db
      .update(clubMemberships)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(
          eq(clubMemberships.userId, userId),
          eq(clubMemberships.clubId, clubId)
        )
      )
      .returning();
    return updatedMembership;
  }

  async getUserClubMembership(userId: string, clubId: number): Promise<ClubMembership | undefined> {
    const [membership] = await db
      .select()
      .from(clubMemberships)
      .where(
        and(
          eq(clubMemberships.userId, userId),
          eq(clubMemberships.clubId, clubId)
        )
      );
    return membership;
  }

  // Club join request operations
  async createJoinRequest(request: InsertClubJoinRequest): Promise<ClubJoinRequest> {
    // Check if user already has a pending request for this club
    const existingRequest = await db
      .select()
      .from(clubJoinRequests)
      .where(
        and(
          eq(clubJoinRequests.userId, request.userId),
          eq(clubJoinRequests.clubId, request.clubId),
          eq(clubJoinRequests.status, 'pending')
        )
      );

    if (existingRequest.length > 0) {
      throw new Error('You already have a pending request for this club');
    }

    const [newRequest] = await db.insert(clubJoinRequests).values(request).returning();
    return newRequest;
  }

  async getClubJoinRequests(clubId: number): Promise<ClubJoinRequest[]> {
    return await db
      .select()
      .from(clubJoinRequests)
      .where(eq(clubJoinRequests.clubId, clubId))
      .orderBy(desc(clubJoinRequests.createdAt));
  }

  async getUserJoinRequests(userId: string): Promise<ClubJoinRequest[]> {
    return await db
      .select()
      .from(clubJoinRequests)
      .where(eq(clubJoinRequests.userId, userId))
      .orderBy(desc(clubJoinRequests.createdAt));
  }

  async getJoinRequest(requestId: number): Promise<ClubJoinRequest | undefined> {
    const [request] = await db
      .select()
      .from(clubJoinRequests)
      .where(eq(clubJoinRequests.id, requestId));
    return request;
  }

  async updateJoinRequestStatus(
    requestId: number, 
    status: 'approved' | 'rejected', 
    reviewedBy: string, 
    reviewNotes?: string, 
    approvedRole?: string
  ): Promise<ClubJoinRequest> {
    const [updatedRequest] = await db
      .update(clubJoinRequests)
      .set({ 
        status, 
        reviewedBy, 
        reviewedAt: new Date(),
        reviewNotes,
        approvedRole,
        updatedAt: new Date()
      })
      .where(eq(clubJoinRequests.id, requestId))
      .returning();

    // If approved, create club membership
    if (status === 'approved' && updatedRequest) {
      await this.addUserToClub({
        userId: updatedRequest.userId,
        clubId: updatedRequest.clubId,
        role: approvedRole || updatedRequest.requestedRole || 'member',
        status: 'active'
      });
    }

    return updatedRequest;
  }

  async getPendingJoinRequests(clubId: number): Promise<ClubJoinRequest[]> {
    return await db
      .select()
      .from(clubJoinRequests)
      .where(
        and(
          eq(clubJoinRequests.clubId, clubId),
          eq(clubJoinRequests.status, 'pending')
        )
      )
      .orderBy(desc(clubJoinRequests.createdAt));
  }

  // Member operations
  async getMembers(clubId: number): Promise<Member[]> {
    return await db
      .select()
      .from(members)
      .where(eq(members.clubId, clubId))
      .orderBy(asc(members.lastName), asc(members.firstName));
  }

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [newMember] = await db.insert(members).values(member).returning();
    return newMember;
  }

  async updateMember(id: number, member: Partial<InsertMember>): Promise<Member> {
    const [updatedMember] = await db
      .update(members)
      .set({ ...member, updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();
    return updatedMember;
  }

  async deleteMember(id: number): Promise<void> {
    await db.delete(members).where(eq(members.id, id));
  }

  // Team operations
  async getTeams(clubId: number): Promise<Team[]> {
    return await db
      .select()
      .from(teams)
      .where(eq(teams.clubId, clubId))
      .orderBy(asc(teams.name));
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const [updatedTeam] = await db
      .update(teams)
      .set({ ...team, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<void> {
    try {
      // First, remove all player assignments for this team
      await db.delete(playerTeamAssignments).where(eq(playerTeamAssignments.teamId, id));
      
      // Remove all player stats for this team  
      await db.delete(playerStats).where(eq(playerStats.teamId, id));
      
      // Update any bookings that reference this team to set teamId to null
      await db.update(bookings)
        .set({ teamId: null })
        .where(eq(bookings.teamId, id));
      
      // Finally, delete the team
      await db.delete(teams).where(eq(teams.id, id));
    } catch (error) {
      console.error(`Error deleting team ${id}:`, error);
      throw new Error(`Failed to delete team: ${error}`);
    }
  }

  // Team membership operations
  async getTeamMembers(teamId: number): Promise<TeamMembership[]> {
    return await db
      .select()
      .from(teamMemberships)
      .where(eq(teamMemberships.teamId, teamId))
      .orderBy(asc(teamMemberships.role));
  }

  async getMemberTeams(memberId: number): Promise<TeamMembership[]> {
    return await db
      .select()
      .from(teamMemberships)
      .where(eq(teamMemberships.memberId, memberId));
  }

  async addMemberToTeam(membership: InsertTeamMembership): Promise<TeamMembership> {
    const [newMembership] = await db
      .insert(teamMemberships)
      .values(membership)
      .returning();
    return newMembership;
  }

  async removeMemberFromTeam(memberId: number, teamId: number): Promise<void> {
    await db
      .delete(teamMemberships)
      .where(
        and(
          eq(teamMemberships.memberId, memberId),
          eq(teamMemberships.teamId, teamId)
        )
      );
  }

  async updateTeamMembership(
    memberId: number,
    teamId: number,
    updates: Partial<InsertTeamMembership>
  ): Promise<TeamMembership> {
    const [updatedMembership] = await db
      .update(teamMemberships)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(
          eq(teamMemberships.memberId, memberId),
          eq(teamMemberships.teamId, teamId)
        )
      )
      .returning();
    return updatedMembership;
  }

  async getTeamMemberships(clubId: number): Promise<TeamMembership[]> {
    return await db
      .select({
        id: teamMemberships.id,
        teamId: teamMemberships.teamId,
        memberId: teamMemberships.memberId,
        role: teamMemberships.role,
        position: teamMemberships.position,
        jerseyNumber: teamMemberships.jerseyNumber,
        joinedAt: teamMemberships.joinedAt,
        leftAt: teamMemberships.leftAt,
        status: teamMemberships.status,
        createdAt: teamMemberships.createdAt,
        updatedAt: teamMemberships.updatedAt,
      })
      .from(teamMemberships)
      .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
      .where(eq(teams.clubId, clubId));
  }

  async removeTeamTrainers(teamId: number): Promise<void> {
    await db
      .delete(teamMemberships)
      .where(
        and(
          eq(teamMemberships.teamId, teamId),
          eq(teamMemberships.role, 'trainer')
        )
      );
  }

  // Facility operations
  async getFacilities(clubId: number): Promise<Facility[]> {
    return await db
      .select()
      .from(facilities)
      .where(eq(facilities.clubId, clubId))
      .orderBy(asc(facilities.name));
  }

  async getFacility(id: number): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility;
  }

  async createFacility(facility: InsertFacility): Promise<Facility> {
    const [newFacility] = await db.insert(facilities).values(facility).returning();
    return newFacility;
  }

  async updateFacility(id: number, facility: Partial<InsertFacility>): Promise<Facility> {
    const [updatedFacility] = await db
      .update(facilities)
      .set({ ...facility, updatedAt: new Date() })
      .where(eq(facilities.id, id))
      .returning();
    return updatedFacility;
  }

  async deleteFacility(id: number): Promise<void> {
    await db.delete(facilities).where(eq(facilities.id, id));
  }

  // Booking operations
  async getBookings(clubId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.clubId, clubId))
      .orderBy(desc(bookings.startTime));
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async checkBookingAvailability(facilityId: number, startTime: Date, endTime: Date, excludeBookingId?: number): Promise<{ available: boolean; maxConcurrent: number; currentBookings: number; conflictingBookings: any[] }> {
    // Get facility to check maxConcurrentBookings
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, facilityId));
    if (!facility) {
      throw new Error('Facility not found');
    }

    // Find ALL overlapping bookings first (excluding only cancelled bookings)
    const allBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.facilityId, facilityId),
          ne(bookings.status, 'cancelled') // Exclude cancelled bookings
        )
      );

    // Filter for time overlaps in JavaScript for precise time comparison
    const allConflictingBookings = allBookings.filter(booking => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      return startTime < bookingEnd && endTime > bookingStart;
    });

    // Now exclude the specific booking ID if provided (for edit scenarios)
    const conflictingBookings = excludeBookingId 
      ? allConflictingBookings.filter(booking => booking.id !== excludeBookingId)
      : allConflictingBookings;

    const currentBookings = conflictingBookings.length;
    const maxConcurrent = facility.maxConcurrentBookings || 1;
    const available = currentBookings < maxConcurrent;

    console.log('Availability check:', {
      facilityId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      excludeBookingId,
      allConflictingBookings: allConflictingBookings.length,
      afterExclusion: currentBookings,
      maxConcurrent,
      available
    });

    // For display purposes, show total conflicting bookings (including current booking being edited)
    // But for availability calculation, use the filtered count (excluding current booking)
    const displayBookings = allConflictingBookings.length;

    return {
      available,
      maxConcurrent,
      currentBookings: displayBookings, // Show total for user display
      conflictingBookings
    };
  }



  // Finance operations
  async getFinances(clubId: number): Promise<Finance[]> {
    return await db
      .select()
      .from(finances)
      .where(eq(finances.clubId, clubId))
      .orderBy(desc(finances.date));
  }

  async getFinance(id: number): Promise<Finance | undefined> {
    const [finance] = await db.select().from(finances).where(eq(finances.id, id));
    return finance;
  }

  async createFinance(finance: InsertFinance): Promise<Finance> {
    const [newFinance] = await db.insert(finances).values(finance).returning();
    return newFinance;
  }

  async updateFinance(id: number, finance: Partial<InsertFinance>): Promise<Finance> {
    // Ensure amount is converted to string if it's a number
    const updateData = {
      ...finance,
      updatedAt: new Date(),
      ...(finance.amount !== undefined && { amount: String(finance.amount) })
    };
    
    const [updatedFinance] = await db
      .update(finances)
      .set(updateData)
      .where(eq(finances.id, id))
      .returning();
    return updatedFinance;
  }

  // Member fees operations (corrected)
  async getMemberFees(clubId: number): Promise<MemberFee[]> {
    return await db
      .select()
      .from(memberFees)
      .where(eq(memberFees.clubId, clubId))
      .orderBy(desc(memberFees.createdAt));
  }

  async createMemberFee(memberFee: InsertMemberFee): Promise<MemberFee> {
    const [created] = await db
      .insert(memberFees)
      .values(memberFee)
      .returning();
    return created;
  }

  async updateMemberFee(id: number, memberFee: Partial<InsertMemberFee>): Promise<MemberFee> {
    const [updated] = await db
      .update(memberFees)
      .set({ ...memberFee, updatedAt: new Date() })
      .where(eq(memberFees.id, id))
      .returning();
    return updated;
  }

  async deleteMemberFee(id: number): Promise<void> {
    await db.delete(memberFees).where(eq(memberFees.id, id));
  }

  // Training fees operations (corrected)
  async getTrainingFees(clubId: number): Promise<TrainingFee[]> {
    return await db
      .select()
      .from(trainingFees)
      .where(eq(trainingFees.clubId, clubId))
      .orderBy(desc(trainingFees.createdAt));
  }

  async createTrainingFee(trainingFee: InsertTrainingFee): Promise<TrainingFee> {
    const [created] = await db
      .insert(trainingFees)
      .values(trainingFee)
      .returning();
    return created;
  }

  async updateTrainingFee(id: number, trainingFee: Partial<InsertTrainingFee>): Promise<TrainingFee> {
    const [updated] = await db
      .update(trainingFees)
      .set({ ...trainingFee, updatedAt: new Date() })
      .where(eq(trainingFees.id, id))
      .returning();
    return updated;
  }

  async deleteTrainingFee(id: number): Promise<void> {
    await db.delete(trainingFees).where(eq(trainingFees.id, id));
  }

  async deleteFinance(id: number): Promise<void> {
    await db.delete(finances).where(eq(finances.id, id));
  }

  // Dashboard operations
  async getDashboardStats(clubId: number): Promise<any> {
    // Korrekte Anzahl der Mitglieder
    const memberCount = await db
      .select()
      .from(members)
      .where(eq(members.clubId, clubId));

    // Korrekte Anzahl der Teams
    const teamCount = await db
      .select()
      .from(teams)
      .where(eq(teams.clubId, clubId));

    // Alle Buchungen abrufen und clientseitig filtern
    const allBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.clubId, clubId));

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const todayBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= todayStart && bookingDate <= todayEnd;
    });

    // Monatsfinanzen
    const allFinances = await db
      .select()
      .from(finances)
      .where(eq(finances.clubId, clubId));

    const thisMonth = new Date();
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);

    const monthlyFinances = allFinances.filter(finance => {
      const financeDate = new Date(finance.date + 'T00:00:00');
      return financeDate >= monthStart;
    });

    const totalIncome = monthlyFinances
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + Number(f.amount), 0);

    const totalExpenses = monthlyFinances
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + Number(f.amount), 0);

    return {
      memberCount: memberCount.length,
      teamCount: teamCount.length,
      todayBookingsCount: todayBookings.length,
      pendingBookingsCount: todayBookings.filter(b => b.status === 'pending').length,
      monthlyBudget: totalIncome - totalExpenses,
    };
  }

  async getRecentActivity(clubId: number): Promise<any[]> {
    try {
      // Alle Aktivitäten ohne Datumsbeschränkung abrufen und clientseitig filtern
      const allMembers = await db
        .select()
        .from(members)
        .where(eq(members.clubId, clubId))
        .orderBy(desc(members.createdAt))
        .limit(20);

      const allBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.clubId, clubId))
        .orderBy(desc(bookings.createdAt))
        .limit(20);

      const activities = [
        ...allMembers.map(m => ({
          type: 'member_added',
          description: `${m.firstName} ${m.lastName} wurde als neues Mitglied hinzugefügt`,
          timestamp: m.createdAt,
          icon: 'user-plus',
        })),
        ...allBookings.filter(b => b.type !== 'event').map(b => ({
          type: 'booking_created',
          description: `${b.title} wurde gebucht`,
          timestamp: b.createdAt,
          icon: 'calendar',
        })),
        ...allBookings.filter(b => b.type === 'event').map(e => ({
          type: 'event_created',
          description: `${e.title} wurde als neuer Termin hinzugefügt`,
          timestamp: e.createdAt,
          icon: 'calendar',
        })),
      ];

      return activities
        .sort((a, b) => {
          const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 10);
    } catch (error) {
      console.error('Recent Activity Error:', error);
      return [];
    }
  }

  // Player operations
  async getPlayers(clubId: number): Promise<(Player & { teams?: Team[] })[]> {
    const playersData = await db
      .select()
      .from(players)
      .where(eq(players.clubId, clubId))
      .orderBy(asc(players.lastName), asc(players.firstName));

    // Get team assignments for all players
    const playersWithTeams = await Promise.all(
      playersData.map(async (player) => {
        const teamAssignments = await db
          .select({
            team: teams,
          })
          .from(playerTeamAssignments)
          .innerJoin(teams, eq(playerTeamAssignments.teamId, teams.id))
          .where(
            and(
              eq(playerTeamAssignments.playerId, player.id),
              eq(playerTeamAssignments.isActive, true)
            )
          );

        return {
          ...player,
          teams: teamAssignments.map(ta => ta.team),
        };
      })
    );

    return playersWithTeams;
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }

  async createPlayer(playerData: InsertPlayer): Promise<Player> {
    const [player] = await db.insert(players).values(playerData).returning();
    return player;
  }

  async updatePlayer(id: number, playerData: Partial<InsertPlayer>): Promise<Player> {
    const [player] = await db
      .update(players)
      .set({ ...playerData, updatedAt: new Date() })
      .where(eq(players.id, id))
      .returning();
    return player;
  }

  async deletePlayer(id: number): Promise<void> {
    // First delete all related assignments and stats
    await db.delete(playerTeamAssignments).where(eq(playerTeamAssignments.playerId, id));
    await db.delete(playerStats).where(eq(playerStats.playerId, id));
    await db.delete(players).where(eq(players.id, id));
  }

  // Player-Team assignment operations
  async getPlayerTeams(playerId: number): Promise<PlayerTeamAssignment[]> {
    return await db
      .select()
      .from(playerTeamAssignments)
      .where(eq(playerTeamAssignments.playerId, playerId))
      .orderBy(desc(playerTeamAssignments.isActive), asc(playerTeamAssignments.joinedAt));
  }

  async getTeamPlayers(teamId: number): Promise<PlayerTeamAssignment[]> {
    return await db
      .select()
      .from(playerTeamAssignments)
      .where(and(eq(playerTeamAssignments.teamId, teamId), eq(playerTeamAssignments.isActive, true)))
      .orderBy(asc(playerTeamAssignments.joinedAt));
  }

  async assignPlayerToTeam(assignmentData: InsertPlayerTeamAssignment): Promise<PlayerTeamAssignment> {
    const [assignment] = await db.insert(playerTeamAssignments).values(assignmentData).returning();
    return assignment;
  }

  async removePlayerFromTeam(playerId: number, teamId: number): Promise<void> {
    await db
      .update(playerTeamAssignments)
      .set({ isActive: false, leftAt: new Date(), updatedAt: new Date() })
      .where(and(
        eq(playerTeamAssignments.playerId, playerId),
        eq(playerTeamAssignments.teamId, teamId),
        eq(playerTeamAssignments.isActive, true)
      ));
  }

  async updatePlayerTeamAssignment(
    playerId: number,
    teamId: number,
    updates: Partial<InsertPlayerTeamAssignment>
  ): Promise<PlayerTeamAssignment> {
    const [assignment] = await db
      .update(playerTeamAssignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(playerTeamAssignments.playerId, playerId),
        eq(playerTeamAssignments.teamId, teamId),
        eq(playerTeamAssignments.isActive, true)
      ))
      .returning();
    return assignment;
  }

  // Player stats operations
  async getPlayerStats(playerId: number, season?: string): Promise<PlayerStats[]> {
    const conditions = [eq(playerStats.playerId, playerId)];
    
    if (season) {
      conditions.push(eq(playerStats.season, season));
    }
    
    return await db
      .select()
      .from(playerStats)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(playerStats.season));
  }

  async getTeamStats(teamId: number, season?: string): Promise<PlayerStats[]> {
    const conditions = [eq(playerStats.teamId, teamId)];
    
    if (season) {
      conditions.push(eq(playerStats.season, season));
    }
    
    return await db
      .select()
      .from(playerStats)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(playerStats.goals), desc(playerStats.assists));
  }

  async createPlayerStats(statsData: InsertPlayerStats): Promise<PlayerStats> {
    const [stats] = await db.insert(playerStats).values(statsData).returning();
    return stats;
  }

  async updatePlayerStats(id: number, statsData: Partial<InsertPlayerStats>): Promise<PlayerStats> {
    const [stats] = await db
      .update(playerStats)
      .set({ ...statsData, updatedAt: new Date() })
      .where(eq(playerStats.id, id))
      .returning();
    return stats;
  }

  async deletePlayerStats(id: number): Promise<void> {
    await db.delete(playerStats).where(eq(playerStats.id, id));
  }

  // User permission operations

  async getUserTeamAssignments(userId: string, clubId: number): Promise<any[]> {
    try {
      // First get user as member
      const member = await db
        .select()
        .from(members)
        .where(and(
          eq(members.email, userId), // Assuming email is used as user identifier
          eq(members.clubId, clubId)
        ))
        .limit(1);

      if (!member[0]) {
        return [];
      }

      // Get team assignments for this member
      const assignments = await db
        .select({
          teamId: teamMemberships.teamId,
          role: teamMemberships.role,
        })
        .from(teamMemberships)
        .where(eq(teamMemberships.memberId, member[0].id));

      return assignments;
    } catch (error) {
      console.error('Error getting user team assignments:', error);
      throw error;
    }
  }

  // Communication operations
  // Message operations
  async getMessages(clubId: number, userId?: string): Promise<MessageWithRecipients[]> {
    // Get main messages (not replies) first
    const messagesData = await db
      .select({
        message: messages,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(
        eq(messages.clubId, clubId),
        isNull(messages.deletedAt), // Only non-deleted messages
        isNull(messages.threadId) // Only main messages, not replies
      ))
      .orderBy(desc(messages.createdAt));

    // Get recipients and replies for each message
    const messagesWithRecipients = await Promise.all(
      messagesData.map(async (messageData) => {
        const recipients = await this.getMessageRecipients(messageData.message.id);
        const replies = await this.getMessageReplies(messageData.message.id);
        const replyCount = replies.length;
        
        return {
          ...messageData.message,
          recipients,
          sender: messageData.sender,
          replies,
          replyCount,
        };
      })
    );

    // Filter messages based on user access if userId is provided
    if (userId) {
      return messagesWithRecipients.filter(message => 
        message.senderId === userId || 
        message.recipients.some(r => 
          (r.recipientType === 'user' && r.recipientId === userId) ||
          r.recipientType === 'all'
        )
      );
    }

    return messagesWithRecipients;
  }

  async getMessage(id: number): Promise<MessageWithRecipients | undefined> {
    const [messageData] = await db
      .select({
        message: messages,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(
        eq(messages.id, id),
        isNull(messages.deletedAt)
      ));

    if (!messageData) return undefined;

    const recipients = await this.getMessageRecipients(id);
    
    return {
      ...messageData.message,
      recipients,
      sender: messageData.sender,
    };
  }

  async deleteMessage(messageId: number): Promise<void> {
    // Soft delete by setting deletedAt timestamp
    await db
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(eq(messages.id, messageId));
      
    // Also delete related replies
    await db
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(eq(messages.threadId, messageId));
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    
    // Create recipient record for sender (so they can mark it as read)
    if (messageData.senderId) {
      await db.insert(messageRecipients).values({
        messageId: message.id,
        recipientType: 'user',
        recipientId: messageData.senderId,
        status: 'sent',
        deliveredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return message;
  }

  async updateMessage(id: number, messageData: Partial<InsertMessage>): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({ ...messageData, updatedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return message;
  }



  async markMessageAsRead(messageId: number, userId: string): Promise<void> {
    const now = new Date();
    
    // Try to update existing recipient record
    const updated = await db
      .update(messageRecipients)
      .set({ 
        status: 'read',
        readAt: now,
        updatedAt: now
      })
      .where(and(
        eq(messageRecipients.messageId, messageId),
        eq(messageRecipients.recipientId, userId)
      ))
      .returning();

    // If no record was updated, create a new one
    if (updated.length === 0) {
      await db.insert(messageRecipients).values({
        messageId,
        recipientType: 'user',
        recipientId: userId,
        status: 'read',
        readAt: now,
        deliveredAt: now,
        createdAt: now,
        updatedAt: now
      });
    }
    
    // Log the operation for debugging
    console.log(`Message ${messageId} marked as read for user ${userId}`);
  }

  // Message recipient operations
  async getMessageRecipients(messageId: number): Promise<MessageRecipient[]> {
    return await db
      .select()
      .from(messageRecipients)
      .where(eq(messageRecipients.messageId, messageId))
      .orderBy(asc(messageRecipients.createdAt));
  }

  async addMessageRecipients(recipients: InsertMessageRecipient[]): Promise<MessageRecipient[]> {
    return await db.insert(messageRecipients).values(recipients).returning();
  }

  // Get replies for a specific message (thread support)
  async getMessageReplies(messageId: number): Promise<MessageWithRecipients[]> {
    const repliesData = await db
      .select({
        message: messages,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(
        eq(messages.threadId, messageId),
        isNull(messages.deletedAt)
      ))
      .orderBy(asc(messages.createdAt)); // Replies in chronological order

    // Get recipients for each reply
    const repliesWithRecipients = await Promise.all(
      repliesData.map(async (replyData) => {
        const recipients = await this.getMessageRecipients(replyData.message.id);
        return {
          ...replyData.message,
          recipients,
          sender: replyData.sender,
        };
      })
    );

    return repliesWithRecipients;
  }

  // Create a reply to an existing message
  async createMessageReply(parentMessageId: number, messageData: InsertMessage): Promise<Message> {
    console.log('Creating reply with parentMessageId:', parentMessageId, 'messageData:', messageData);
    
    const replyData = {
      ...messageData,
      threadId: parentMessageId,
      messageType: 'reply' as const
    };
    
    console.log('Reply data to insert:', replyData);
    
    try {
      const [reply] = await db.insert(messages).values(replyData).returning();
      console.log('Reply created successfully:', reply);
      
      // Create simple recipient - get original message sender
      try {
        // Create recipient for the reply - use simple query to avoid circular dependency
        const [originalMessage] = await db
          .select({ senderId: messages.senderId })
          .from(messages)
          .where(eq(messages.id, parentMessageId))
          .limit(1);
          
        if (originalMessage) {
          await db.insert(messageRecipients).values({
            messageId: reply.id,
            recipientType: 'user',
            recipientId: originalMessage.senderId,
            status: 'sent'
          });
          console.log('Reply recipient created for original sender:', originalMessage.senderId);
        } else {
          console.warn('Could not find original message to create recipient');
        }
      } catch (recipientError) {
        console.error('Error creating reply recipient:', recipientError);
        // Continue anyway - reply was created
      }
      
      return reply;
    } catch (error) {
      console.error('Error in createMessageReply:', error);
      throw error;
    }
  }

  async updateMessageRecipientStatus(messageId: number, userId: string, status: string): Promise<void> {
    await db
      .update(messageRecipients)
      .set({ 
        status,
        readAt: status === 'read' ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(and(
        eq(messageRecipients.messageId, messageId),
        eq(messageRecipients.recipientId, userId)
      ));
  }

  // Announcement operations
  async getAnnouncements(clubId: number): Promise<AnnouncementWithAuthor[]> {
    const announcementsData = await db
      .select({
        announcement: announcements,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .where(and(
        eq(announcements.clubId, clubId),
        isNull(announcements.deletedAt),
        eq(announcements.isPublished, true)
      ))
      .orderBy(desc(announcements.isPinned), desc(announcements.publishedAt));

    return announcementsData.map(data => ({
      ...data.announcement,
      author: data.author,
    }));
  }

  async getAnnouncement(id: number): Promise<AnnouncementWithAuthor | undefined> {
    const [announcementData] = await db
      .select({
        announcement: announcements,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .where(and(
        eq(announcements.id, id),
        isNull(announcements.deletedAt)
      ));

    if (!announcementData) return undefined;

    return {
      ...announcementData.announcement,
      author: announcementData.author,
    };
  }

  async createAnnouncement(announcementData: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(announcementData).returning();
    return announcement;
  }

  async updateAnnouncement(id: number, announcementData: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [announcement] = await db
      .update(announcements)
      .set({ ...announcementData, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return announcement;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db
      .update(announcements)
      .set({ deletedAt: new Date() })
      .where(eq(announcements.id, id));
  }

  async publishAnnouncement(id: number): Promise<Announcement> {
    const [announcement] = await db
      .update(announcements)
      .set({ 
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(announcements.id, id))
      .returning();
    return announcement;
  }

  async pinAnnouncement(id: number, isPinned: boolean): Promise<Announcement> {
    const [announcement] = await db
      .update(announcements)
      .set({ 
        isPinned,
        updatedAt: new Date()
      })
      .where(eq(announcements.id, id))
      .returning();
    return announcement;
  }

  // Notification operations
  async getNotifications(userId: string, clubId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.clubId, clubId)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsCount(userId: string, clubId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.clubId, clubId),
        eq(notifications.status, 'unread')
      ));
    return result?.count || 0;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        status: 'read',
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string, clubId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        status: 'read',
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.clubId, clubId),
        eq(notifications.status, 'unread')
      ));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Communication preferences operations
  async getCommunicationPreferences(userId: string, clubId: number): Promise<CommunicationPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(communicationPreferences)
      .where(and(
        eq(communicationPreferences.userId, userId),
        eq(communicationPreferences.clubId, clubId)
      ));
    return preferences;
  }

  async updateCommunicationPreferences(
    userId: string, 
    clubId: number, 
    preferencesData: Partial<InsertCommunicationPreferences>
  ): Promise<CommunicationPreferences> {
    const [preferences] = await db
      .insert(communicationPreferences)
      .values({
        userId,
        clubId,
        ...preferencesData,
      })
      .onConflictDoUpdate({
        target: [communicationPreferences.userId, communicationPreferences.clubId],
        set: {
          ...preferencesData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return preferences;
  }

  // Communication statistics
  async getCommunicationStats(clubId: number, userId?: string): Promise<CommunicationStats> {
    // Count only main messages (not replies)
    const [messageStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.clubId, clubId),
        isNull(messages.deletedAt),
        isNull(messages.threadId) // Only count main messages, not replies
      ));

    const [announcementStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(announcements)
      .where(and(
        eq(announcements.clubId, clubId),
        isNull(announcements.deletedAt),
        eq(announcements.isPublished, true)
      ));

    let unreadMessages = 0;
    let unreadNotifications = 0;

    if (userId) {
      const [unreadMessageStats] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messageRecipients)
        .innerJoin(messages, eq(messageRecipients.messageId, messages.id))
        .where(and(
          eq(messages.clubId, clubId),
          eq(messageRecipients.recipientId, userId),
          isNull(messageRecipients.readAt), // Check for null readAt instead of status
          isNull(messages.deletedAt),
          isNull(messages.threadId) // Only count main messages, not replies
        ));

      unreadMessages = unreadMessageStats?.count || 0;
      unreadNotifications = await this.getUnreadNotificationsCount(userId, clubId);
    }

    const recentActivity = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.clubId, clubId),
        gte(messages.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // Last 7 days
        isNull(messages.deletedAt)
      ));

    return {
      totalMessages: messageStats?.count || 0,
      unreadMessages,
      totalAnnouncements: announcementStats?.count || 0,
      unreadNotifications,
      recentActivity: recentActivity[0]?.count || 0,
    };
  }

  // Search operations
  async searchMessages(clubId: number, query: string, userId?: string): Promise<MessageWithRecipients[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const messagesData = await db
      .select({
        message: messages,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(
        eq(messages.clubId, clubId),
        isNull(messages.deletedAt),
        or(
          sql`lower(${messages.content}) like ${searchTerm}`,
          sql`lower(${messages.subject}) like ${searchTerm}`
        )
      ))
      .orderBy(desc(messages.createdAt))
      .limit(50);

    const messagesWithRecipients = await Promise.all(
      messagesData.map(async (messageData) => {
        const recipients = await this.getMessageRecipients(messageData.message.id);
        return {
          ...messageData.message,
          recipients,
          sender: messageData.sender,
        };
      })
    );

    // Filter based on user access if userId is provided
    if (userId) {
      return messagesWithRecipients.filter(message => 
        message.senderId === userId || 
        message.recipients.some(r => 
          (r.recipientType === 'user' && r.recipientId === userId) ||
          r.recipientType === 'all'
        )
      );
    }

    return messagesWithRecipients;
  }

  async searchAnnouncements(clubId: number, query: string): Promise<AnnouncementWithAuthor[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const announcementsData = await db
      .select({
        announcement: announcements,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .where(and(
        eq(announcements.clubId, clubId),
        isNull(announcements.deletedAt),
        eq(announcements.isPublished, true),
        or(
          sql`lower(${announcements.content}) like ${searchTerm}`,
          sql`lower(${announcements.title}) like ${searchTerm}`
        )
      ))
      .orderBy(desc(announcements.isPinned), desc(announcements.publishedAt))
      .limit(50);

    return announcementsData.map(data => ({
      ...data.announcement,
      author: data.author,
    }));
  }

}

export const storage = new DatabaseStorage();
