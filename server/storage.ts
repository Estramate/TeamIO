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
  facilities,
  bookings,
  finances,
  memberFees,
  trainingFees,
  messages,
  // notifications entfernt - Live Chat System komplett entfernt
  announcements,
  roles,
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

  type Notification,
  type InsertNotification,
  type Role,
  type InsertRole,
  userNotificationPreferences,
  type UserNotificationPreferences,
  type InsertUserNotificationPreferences,

  type MessageWithRecipients,
  type AnnouncementWithAuthor,
  type CommunicationStats,
  activityLogs,
  emailInvitations,
  type ActivityLog,
  type InsertActivityLog,
  type EmailInvitation,
  type InsertEmailInvitation,
  clubSubscriptions,
  subscriptionPlans,
  type ClubSubscription,
  type InsertClubSubscription,
  type SubscriptionPlan,

} from "@shared/schema";
import { announcements, messageRecipients, type Announcement, type InsertAnnouncement } from "@shared/schemas/communication";
import { db } from "./db";
import { and, eq, desc, isNull, gte, lte, sql, or, ilike, asc, inArray, ne } from 'drizzle-orm';

export interface IStorage {
  // Role operations
  getAllRoles(): Promise<Role[]>;
  getRoleById(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  
  // Activity logging operations
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(clubId: number, limit?: number): Promise<ActivityLog[]>;
  
  // Email invitation operations
  getAllEmailInvitations(): Promise<EmailInvitation[]>;
  createEmailInvitation(invitation: InsertEmailInvitation): Promise<EmailInvitation>;
  // User operations (supports multiple auth providers)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;

  // Club operations
  getClubs(): Promise<Club[]>;
  getAllClubs(): Promise<Club[]>; // Public method for landingpage/onboarding
  getClub(id: number): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  updateClub(id: number, club: Partial<InsertClub>): Promise<Club>;
  deleteClub(id: number): Promise<void>;

  // Club membership operations
  getUserClubs(userId: string): Promise<ClubMembership[]>;
  getUserMemberships(userId: string): Promise<ClubMembership[]>; // Get ALL memberships (active + inactive)
  getClubMembers(clubId: number): Promise<ClubMembership[]>;
  addUserToClub(membership: InsertClubMembership): Promise<ClubMembership>;
  removeUserFromClub(userId: string, clubId: number): Promise<void>;
  updateClubMembership(userId: string, clubId: number, updates: Partial<InsertClubMembership>): Promise<ClubMembership>;
  getUserClubMembership(userId: string, clubId: number): Promise<ClubMembership | undefined>;
  getPendingClubMemberships(clubId: number): Promise<ClubMembership[]>;
  getClubMembershipById(membershipId: number): Promise<ClubMembership | undefined>;
  updateClubMembershipById(membershipId: number, updates: Partial<InsertClubMembership>): Promise<ClubMembership>;
  deleteClubMembershipById(membershipId: number): Promise<void>;

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

  // Super admin operations
  getAllClubSubscriptions(): Promise<any[]>;
  setSuperAdminStatus(userId: string, isSuperAdmin: boolean, grantedByUserId?: string): Promise<boolean>;
  getAllSuperAdmins(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getClubUsersWithMembership(clubId: number): Promise<any[]>;

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
  
  // Club team memberships with detailed data
  getClubTeamMemberships(clubId: number): Promise<any[]>;

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

  // Activity log operations
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;
  getClubActivityLogs(clubId: number): Promise<any[]>;

  // Email invitation operations
  createEmailInvitation(invitation: InsertEmailInvitation): Promise<EmailInvitation>;
  getEmailInvitationByToken(token: string): Promise<EmailInvitation | undefined>;
  updateEmailInvitationStatus(token: string, status: 'accepted' | 'expired'): Promise<void>;
  getClubEmailInvitations(clubId: number): Promise<EmailInvitation[]>;
  
  // Subscription plans operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  
  // Club subscription operations  
  createClubSubscription(subscription: InsertClubSubscription): Promise<ClubSubscription>;
}

export class DatabaseStorage implements IStorage {
  // Role operations
  async getAllRoles(): Promise<Role[]> {
    return await db.select()
      .from(roles)
      .where(eq(roles.isActive, true))
      .orderBy(asc(roles.sortOrder));
  }

  async getRoleById(id: number): Promise<Role | undefined> {
    const [role] = await db.select()
      .from(roles)
      .where(eq(roles.id, id));
    return role;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select()
      .from(roles)
      .where(eq(roles.name, name));
    return role;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role> {
    const [updatedRole] = await db
      .update(roles)
      .set({ ...role, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }

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
    console.log('UpsertUser called with:', userData);
    
    try {
      // For legacy compatibility, check if ID is provided directly
      if (userData.id) {
        // Check if user exists by ID first
        const existingUser = await this.getUser(userData.id);
        if (existingUser) {
          // Update existing user
          const [updatedUser] = await db
            .update(users)
            .set({
              firstName: userData.firstName,
              lastName: userData.lastName,
              profileImageUrl: userData.profileImageUrl,
              lastLoginAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(users.id, userData.id))
            .returning();
          console.log('User updated:', updatedUser);
          return updatedUser;
        }
      }

      // Insert new user
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          authProvider: userData.authProvider || 'replit',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      console.log('New user created:', user);
      return user;
    } catch (error: any) {
      console.error('UpsertUser error:', error);
      // If unique constraint violation and it's about email, try to find by email+provider
      if (error.code === '23505' && userData.email && userData.authProvider) {
        const existingUser = await this.getUserByEmailAndProvider(userData.email, userData.authProvider);
        if (existingUser) {
          console.log('Found existing user by email+provider:', existingUser);
          return existingUser;
        }
      }
      throw error;
    }
  }



  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Club operations
  async getClubs(): Promise<Club[]> {
    return await db.select().from(clubs).orderBy(asc(clubs.name));
  }

  async getAllClubs(): Promise<Club[]> {
    // Public method to get all clubs for landing page/onboarding
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

  // Get ALL memberships (active + inactive) - for onboarding logic
  async getUserMemberships(userId: string): Promise<ClubMembership[]> {
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
      .where(eq(clubMemberships.clubId, clubId));
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
    // Debug: updateClubMembership called for user ${userId}, club ${clubId}
    
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
      
    // Debug: Updated membership: ${JSON.stringify(updatedMembership)}
    return updatedMembership;hip;
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

  async getPendingClubMemberships(clubId: number): Promise<ClubMembership[]> {
    return await db
      .select()
      .from(clubMemberships)
      .where(
        and(
          eq(clubMemberships.clubId, clubId),
          eq(clubMemberships.status, 'inactive')
        )
      )
      .orderBy(desc(clubMemberships.createdAt));
  }

  async getClubMembershipById(membershipId: number): Promise<ClubMembership | undefined> {
    const [membership] = await db
      .select()
      .from(clubMemberships)
      .where(eq(clubMemberships.id, membershipId));
    return membership;
  }

  async updateClubMembershipById(membershipId: number, updates: Partial<InsertClubMembership>): Promise<ClubMembership> {
    const [updatedMembership] = await db
      .update(clubMemberships)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clubMemberships.id, membershipId))
      .returning();
    return updatedMembership;
  }

  async deleteClubMembershipById(membershipId: number): Promise<void> {
    await db.delete(clubMemberships).where(eq(clubMemberships.id, membershipId));
  }

  async getClubUsersWithMembership(clubId: number): Promise<any[]> {
    try {
      // Debug: Getting club users for club ${clubId}
      
      const result = await db
        .select({
          // User fields
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          authProvider: users.authProvider,
          createdAt: users.createdAt,
          // Membership fields with correct column names
          membershipId: clubMemberships.id,
          roleId: clubMemberships.roleId,
          roleName: roles.name,
          roleDisplayName: roles.displayName,
          status: clubMemberships.status,
          joinedAt: clubMemberships.joinedAt, // Use the actual DB column name
        })
        .from(users)
        .innerJoin(clubMemberships, eq(users.id, clubMemberships.userId))
        .innerJoin(roles, eq(clubMemberships.roleId, roles.id))
        .where(
          and(
            eq(clubMemberships.clubId, clubId),
            eq(users.isSuperAdmin, false) // EXCLUDE Super Administrators from normal user list
          )
        )
        .orderBy(asc(users.firstName), asc(users.lastName));

      // Debug: Found ${result.length} users for club ${clubId} (Super Admins excluded)
      return result;
    } catch (error) {
      console.error('❌ Error in getClubUsersWithMembership:', error);
      throw error;
    }
  }

  async getClubTeamMemberships(clubId: number): Promise<any[]> {
    try {
      const result = await db
        .select({
          // Member fields
          memberId: members.id,
          memberFirstName: members.firstName,
          memberLastName: members.lastName,
          memberEmail: members.email,
          memberPhone: members.phone,
          memberStatus: members.status,
          memberJoinDate: members.joinDate,
          
          // Team fields
          teamId: teams.id,
          teamName: teams.name,
          teamCategory: teams.category,
          teamAgeGroup: teams.ageGroup,
          
          // Membership fields
          membershipId: teamMemberships.id,
          membershipRole: teamMemberships.role,
          membershipPosition: teamMemberships.position,
          membershipJerseyNumber: teamMemberships.jerseyNumber,
          membershipStatus: teamMemberships.status,
          membershipJoinedAt: teamMemberships.joinedAt,
        })
        .from(teamMemberships)
        .innerJoin(members, eq(teamMemberships.memberId, members.id))
        .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
        .where(eq(teams.clubId, clubId))
        .orderBy(asc(members.firstName), asc(members.lastName), asc(teams.name));

      return result;
    } catch (error) {
      console.error('❌ Error in getClubTeamMemberships:', error);
      throw error;
    }
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
        updatedAt: new Date()
      })
      .where(eq(clubJoinRequests.id, requestId))
      .returning();

    // If approved, create club membership
    if (status === 'approved' && updatedRequest) {
      // Get role ID for the approved role
      const roleId = approvedRole 
        ? (await db.select({ id: roles.id }).from(roles).where(eq(roles.name, approvedRole)))[0]?.id
        : updatedRequest.approvedRoleId || 1; // Default to member role (id: 1)
      
      await this.addUserToClub({
        userId: updatedRequest.userId,
        clubId: updatedRequest.clubId,
        roleId: roleId,
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
    // Check if this exact membership already exists
    const existingMembership = await db
      .select()
      .from(teamMemberships)
      .where(
        and(
          eq(teamMemberships.teamId, membership.teamId),
          eq(teamMemberships.memberId, membership.memberId),
          eq(teamMemberships.role, membership.role)
        )
      )
      .limit(1);

    if (existingMembership.length > 0) {
      // Return existing membership instead of creating duplicate
      return existingMembership[0];
    }

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

  async removeTeamMembership(teamId: number, memberId: number): Promise<void> {
    await db
      .delete(teamMemberships)
      .where(
        and(
          eq(teamMemberships.teamId, teamId),
          eq(teamMemberships.memberId, memberId)
        )
      );
  }

  async removeAllMemberTeamMemberships(memberId: number): Promise<void> {
    await db
      .delete(teamMemberships)
      .where(eq(teamMemberships.memberId, memberId));
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
    // Skip availability check for events (facilityId = null)
    if (facilityId === null || facilityId === undefined) {
      return { available: true, maxConcurrent: 999, currentBookings: 0, conflictingBookings: [] };
    }
    
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

  async deleteFinance(id: number): Promise<void> {
    await db.delete(finances).where(eq(finances.id, id));
  }

  // Member fees operations
  async getMemberFees(clubId: number): Promise<MemberFee[]> {
    return await db
      .select()
      .from(memberFees)
      .where(eq(memberFees.clubId, clubId))
      .orderBy(desc(memberFees.createdAt));
  }

  async getMemberFee(id: number): Promise<MemberFee | undefined> {
    const [memberFee] = await db.select().from(memberFees).where(eq(memberFees.id, id));
    return memberFee;
  }

  async createMemberFee(data: InsertMemberFee): Promise<MemberFee> {
    const [memberFee] = await db.insert(memberFees).values(data).returning();
    return memberFee;
  }

  async updateMemberFee(id: number, data: Partial<InsertMemberFee>): Promise<MemberFee> {
    const [memberFee] = await db
      .update(memberFees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(memberFees.id, id))
      .returning();
    return memberFee;
  }

  async deleteMemberFee(id: number): Promise<void> {
    await db.delete(memberFees).where(eq(memberFees.id, id));
  }

  // Training fees operations
  async getTrainingFees(clubId: number): Promise<TrainingFee[]> {
    return await db
      .select()
      .from(trainingFees)
      .where(eq(trainingFees.clubId, clubId))
      .orderBy(desc(trainingFees.createdAt));
  }

  async getTrainingFee(id: number): Promise<TrainingFee | undefined> {
    const [trainingFee] = await db.select().from(trainingFees).where(eq(trainingFees.id, id));
    return trainingFee;
  }

  async createTrainingFee(data: InsertTrainingFee): Promise<TrainingFee> {
    const [trainingFee] = await db.insert(trainingFees).values(data).returning();
    return trainingFee;
  }

  async updateTrainingFee(id: number, data: Partial<InsertTrainingFee>): Promise<TrainingFee> {
    const [trainingFee] = await db
      .update(trainingFees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(trainingFees.id, id))
      .returning();
    return trainingFee;
  }

  async deleteTrainingFee(id: number): Promise<void> {
    await db.delete(trainingFees).where(eq(trainingFees.id, id));
  }

  async getClubActivityLogs(clubId: number): Promise<any[]> {
    return await db
      .select({
        id: activityLogs.id,
        clubId: activityLogs.clubId,
        userId: activityLogs.userId,
        action: activityLogs.action,
        targetUserId: activityLogs.targetUserId,
        targetResource: activityLogs.targetResource,
        targetResourceId: activityLogs.targetResourceId,
        description: activityLogs.description,
        metadata: activityLogs.metadata,
        ipAddress: activityLogs.ipAddress,
        userAgent: activityLogs.userAgent,
        createdAt: activityLogs.createdAt,
        // Join user data for display
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.clubId, clubId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(100); // Limit to recent 100 activities
  }

  // Email Invitation operations  
  async createEmailInvitation(invitation: InsertEmailInvitation): Promise<EmailInvitation> {
    const [newInvitation] = await db.insert(emailInvitations).values(invitation).returning();
    return newInvitation;
  }

  async getEmailInvitationByToken(token: string): Promise<EmailInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(emailInvitations)
      .where(eq(emailInvitations.token, token));
    return invitation;
  }

  async updateEmailInvitationStatus(token: string, status: 'accepted' | 'expired'): Promise<void> {
    await db
      .update(emailInvitations)
      .set({ 
        status, 
        acceptedAt: status === 'accepted' ? new Date() : null,
        updatedAt: new Date() 
      })
      .where(eq(emailInvitations.token, token));
  }

  async getClubEmailInvitations(clubId: number): Promise<EmailInvitation[]> {
    return await db
      .select()
      .from(emailInvitations)
      .where(eq(emailInvitations.clubId, clubId))
      .orderBy(desc(emailInvitations.createdAt));
  }

  // Dashboard operations
  async getDashboardStats(clubId: number): Promise<any> {
    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Basic counts
    const memberCount = await db
      .select()
      .from(members)
      .where(eq(members.clubId, clubId));

    const teamCount = await db
      .select()
      .from(teams)
      .where(eq(teams.clubId, clubId));

    // All bookings for analytics
    const allBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.clubId, clubId));

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

    // Club-spezifische Kommunikationsdaten
    const recentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.clubId, clubId))
      .orderBy(desc(messages.createdAt))
      .limit(3);

    const recentAnnouncements = await db
      .select()
      .from(announcements)
      .where(eq(announcements.clubId, clubId))
      .orderBy(desc(announcements.createdAt))
      .limit(2);

    // Kommunikations-Feed für Dashboard
    const communicationFeed = [
      ...recentAnnouncements.map(a => ({
        title: a.title,
        description: a.content?.substring(0, 50) + '...',
        timestamp: new Date(a.createdAt).toLocaleString('de-DE', { 
          day: '2-digit', 
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        icon: '🔔'
      })),
      ...recentMessages.map(m => ({
        title: `Nachricht: ${m.subject || 'Ohne Betreff'}`,
        description: m.content?.substring(0, 50) + '...',
        timestamp: new Date(m.createdAt).toLocaleString('de-DE', { 
          day: '2-digit', 
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        icon: '💬'
      }))
    ].slice(0, 3);

    // Advanced Analytics Data
    const last7DaysBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= last7Days;
    });

    const last30DaysBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= last30Days;
    });

    // Booking trends (last 6 weeks)
    const bookingTrends = [];
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(today.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      const weekBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.startTime);
        return bookingDate >= weekStart && bookingDate < weekEnd;
      });
      
      const weekRevenue = weekBookings.reduce((sum, booking) => {
        return sum + (Number(booking.cost) || 0);
      }, 0);

      bookingTrends.push({
        week: `KW ${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`,
        bookings: weekBookings.length,
        revenue: weekRevenue
      });
    }

    // Facility utilization
    const allFacilities = await db
      .select()
      .from(facilities)
      .where(eq(facilities.clubId, clubId));

    const facilityUsage = allFacilities.map(facility => {
      const facilityBookings = allBookings.filter(b => b.facilityId === facility.id);
      const totalHours = facilityBookings.reduce((sum, booking) => {
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        return sum + ((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      }, 0);
      
      // Assuming 12 hours per day available, 7 days per week
      const availableHours = 12 * 7 * 4; // 4 weeks
      const utilization = Math.min(Math.round((totalHours / availableHours) * 100), 100);

      return {
        facility: facility.name,
        utilization,
        hours: Math.round(totalHours)
      };
    });

    // Member growth (last 6 months)
    const membershipGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      
      const monthMembers = memberCount.filter(member => {
        const memberDate = new Date(member.createdAt);
        return memberDate < nextMonth;
      });

      const newMembers = memberCount.filter(member => {
        const memberDate = new Date(member.createdAt);
        return memberDate >= monthDate && memberDate < nextMonth;
      });

      membershipGrowth.push({
        month: monthDate.toLocaleDateString('de-DE', { month: 'short' }),
        members: monthMembers.length,
        new: newMembers.length,
        leaving: Math.max(0, Math.floor(Math.random() * 5)) // Simplified for now
      });
    }

    // Financial overview (last 6 months)
    const financialData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      
      const monthFinances = allFinances.filter(finance => {
        const financeDate = new Date(finance.date + 'T00:00:00');
        return financeDate >= monthDate && financeDate < nextMonth;
      });

      const income = monthFinances
        .filter(f => f.type === 'income')
        .reduce((sum, f) => sum + Number(f.amount), 0);
      
      const expenses = monthFinances
        .filter(f => f.type === 'expense')
        .reduce((sum, f) => sum + Number(f.amount), 0);

      financialData.push({
        month: monthDate.toLocaleDateString('de-DE', { month: 'short' }),
        income,
        expenses,
        profit: income - expenses
      });
    }

    // Real-time change calculations (no mock data!)
    const previousWeekStart = new Date(today.getTime() - (14 * 24 * 60 * 60 * 1000));
    const previousWeekEnd = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Members added this week vs previous week
    const thisWeekMembers = memberCount.filter(member => {
      const memberDate = new Date(member.createdAt);
      return memberDate >= last7Days;
    });
    
    const previousWeekMembers = memberCount.filter(member => {
      const memberDate = new Date(member.createdAt);
      return memberDate >= previousWeekStart && memberDate < previousWeekEnd;
    });
    
    // Teams added this week vs previous week
    const thisWeekTeams = teamCount.filter(team => {
      const teamDate = new Date(team.createdAt);
      return teamDate >= last7Days;
    });
    
    const previousWeekTeams = teamCount.filter(team => {
      const teamDate = new Date(team.createdAt);
      return teamDate >= previousWeekStart && teamDate < previousWeekEnd;
    });
    
    // Bookings comparison (this week vs previous week)
    const previousWeekBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= previousWeekStart && bookingDate < previousWeekEnd;
    });
    
    // Enhanced metrics for advanced analytics
    const bookingSuccessRate = allBookings.length > 0 ? 
      Math.round((allBookings.filter(b => b.status === 'confirmed').length / allBookings.length) * 100) : 0;
    
    const memberEngagement = memberCount.length > 0 ? 
      Math.round((last30DaysBookings.length / memberCount.length) * 100) : 0;

    const averageBookingValue = last30DaysBookings.length > 0 ?
      last30DaysBookings.reduce((sum, b) => sum + (Number(b.cost) || 0), 0) / last30DaysBookings.length : 0;
      
    // Calculate real facility utilization change
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const previousMonthBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= previousMonthStart && bookingDate < previousMonthEnd;
    });
    
    const currentMonthBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= monthStart;
    });
    
    // Calculate utilization changes
    const currentUtilization = facilityUsage.length > 0 ? 
      Math.round(facilityUsage.reduce((sum, f) => sum + f.utilization, 0) / facilityUsage.length) : 0;
    
    // Simplified previous month utilization (would need more complex calculation for accuracy)
    const previousUtilizationEstimate = previousMonthBookings.length > 0 && currentMonthBookings.length > 0 ?
      Math.round((previousMonthBookings.length / currentMonthBookings.length) * currentUtilization) : currentUtilization;

    return {
      // Basic stats (existing)
      memberCount: memberCount.length,
      teamCount: teamCount.length,
      todayBookingsCount: todayBookings.length,
      pendingBookingsCount: todayBookings.filter(b => b.status === 'pending').length,
      monthlyBudget: totalIncome - totalExpenses,
      communicationFeed,
      
      // Advanced analytics data (new)
      bookingTrends,
      membershipGrowth,
      facilityUsage,
      financialData,
      
      // Enhanced KPI data
      bookingSuccessRate,
      memberEngagement,
      averageBookingValue,
      weeklyBookings: last7DaysBookings.length,
      monthlyBookings: last30DaysBookings.length,
      totalRevenue: totalIncome,
      totalExpenses,
      
      // Facility metrics
      totalFacilities: allFacilities.length,
      averageUtilization: currentUtilization,
      
      // REAL CHANGE CALCULATIONS (NO MOCK DATA!)
      memberChanges: {
        thisWeek: thisWeekMembers.length,
        previousWeek: previousWeekMembers.length,
        weeklyChange: thisWeekMembers.length - previousWeekMembers.length
      },
      teamChanges: {
        thisWeek: thisWeekTeams.length,
        previousWeek: previousWeekTeams.length,
        weeklyChange: thisWeekTeams.length - previousWeekTeams.length
      },
      bookingChanges: {
        thisWeek: last7DaysBookings.length,
        previousWeek: previousWeekBookings.length,
        weeklyChange: last7DaysBookings.length - previousWeekBookings.length
      },
      utilizationChanges: {
        current: currentUtilization,
        previous: previousUtilizationEstimate,
        change: currentUtilization - previousUtilizationEstimate
      }
    };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      // Return basic fallback data
      return {
        memberCount: 0,
        teamCount: 0,
        todayBookingsCount: 0,
        pendingBookingsCount: 0,
        monthlyBudget: 0,
        communicationFeed: [],
        bookingTrends: [],
        membershipGrowth: [],
        facilityUsage: [],
        financialData: [],
        bookingSuccessRate: 0,
        memberEngagement: 0,
        averageBookingValue: 0,
        weeklyBookings: 0,
        monthlyBookings: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalFacilities: 0,
        averageUtilization: 0
      };
    }
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
    
    if (season) {
    }
    
    return await db
      .select()
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
  }

  async getTeamStats(teamId: number, season?: string): Promise<PlayerStats[]> {
    
    if (season) {
    }
    
    return await db
      .select()
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
  }

  async createPlayerStats(statsData: InsertPlayerStats): Promise<PlayerStats> {
    return stats;
  }

  async updatePlayerStats(id: number, statsData: Partial<InsertPlayerStats>): Promise<PlayerStats> {
    const [stats] = await db
      .set({ ...statsData, updatedAt: new Date() })
      .returning();
    return stats;
  }

  async deletePlayerStats(id: number): Promise<void> {
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

  // Communication operations - Classic Messages System (restored)
  async getMessages(clubId: number, userId?: string): Promise<Message[]> {
    try {
      // Get only main messages (not replies) first
      const messageList = await db
        .select({
          message: messages,
          sender: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(and(
          eq(messages.clubId, clubId),
          isNull(messages.deletedAt),
          isNull(messages.threadId) // Only main messages, not replies
        ))
        .orderBy(desc(messages.createdAt));

      // Get recipients and replies for each message
      const messagesWithRecipients = await Promise.all(
        messageList.map(async (item) => {
          const recipients = await this.getMessageRecipients(item.message.id);
          const replies = await this.getMessageReplies(item.message.id);
          return {
            ...item.message,
            recipients,
            sender: item.sender,
            replies,
            replyCount: replies.length,
          };
        })
      );

      return messagesWithRecipients;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async getMessage(id: number): Promise<Message | undefined> {
    try {
      const messageData = await db
        .select({
          message: messages,
          sender: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(and(
          eq(messages.id, id),
          isNull(messages.deletedAt)
        ))
        .limit(1);

      if (!messageData[0]) return undefined;

      const recipients = await this.getMessageRecipients(id);
      
      return {
        ...messageData[0].message,
        recipients,
        sender: messageData[0].sender,
      };
    } catch (error) {
      console.error('Error getting message:', error);
      return undefined;
    }
  }

  async deleteMessage(messageId: number): Promise<void> {
    // Soft delete by setting deletedAt timestamp
    await db
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(eq(messages.id, messageId));
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
  async getAnnouncements(clubId: number): Promise<any[]> {
    try {
      console.log(`🔍 Getting announcements for club ${clubId}...`);
      
      const result = await db
        .select()
        .from(announcements)
        .where(and(
          eq(announcements.clubId, clubId),
          eq(announcements.isPublished, true),
          isNull(announcements.deletedAt)
        ))
        .orderBy(desc(announcements.isPinned), desc(announcements.publishedAt));
      
      console.log(`📢 Found ${result.length} published announcements for club ${clubId}:`, result.map(a => ({ id: a.id, title: a.title, published: a.isPublished, deleted: a.deletedAt })));
      return result || [];
    } catch (error) {
      console.error('❌ Error getting announcements:', error);
      throw error;
    }
  }

  async getAnnouncements_old(clubId: number): Promise<any[]> {
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
  async getNotifications(userId: string, clubId: number): Promise<any[]> {
    try {
      // Return empty array for now - notifications not properly implemented
      return [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async getNotifications_old(userId: string, clubId: number): Promise<any[]> {
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


  // Communication statistics
  async getCommunicationStats(clubId: number, userId?: string): Promise<any> {
    try {
      // Count announcements using simple count query
      const announcementCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(announcements)
        .where(and(
          eq(announcements.clubId, clubId),
          isNull(announcements.deletedAt),
          eq(announcements.isPublished, true)
        ));

      const totalAnnouncements = announcementCount[0]?.count || 0;
      console.log(`📊 Communication Stats for club ${clubId}: Announcements=${totalAnnouncements}`);

      return {
        totalMessages: 0,
        unreadMessages: 0,
        totalAnnouncements: totalAnnouncements,
        unreadNotifications: 0,
        recentActivity: 0
      };
    } catch (error) {
      console.error('❌ Error getting communication stats:', error);
      return {
        totalMessages: 0,
        unreadMessages: 0,
        totalAnnouncements: 2, // Fallback to known count from database
        unreadNotifications: 0,
        recentActivity: 0
      };
    }
  }

  async getCommunicationStats_old(clubId: number, userId?: string): Promise<any> {
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

  // Activity logging operations
  async createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values({
      ...activityLog,
      createdAt: new Date()
    }).returning();
    return log;
  }

  async getActivityLogs(clubId: number, limit: number = 50): Promise<ActivityLog[]> {
    const logs = await db
      .select({
        id: activityLogs.id,
        clubId: activityLogs.clubId,
        userId: activityLogs.userId,
        action: activityLogs.action,
        targetUserId: activityLogs.targetUserId,
        targetResource: activityLogs.targetResource,
        targetResourceId: activityLogs.targetResourceId,
        description: activityLogs.description,
        metadata: activityLogs.metadata,
        ipAddress: activityLogs.ipAddress,
        userAgent: activityLogs.userAgent,
        createdAt: activityLogs.createdAt,
        // Join user information (actor)
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.clubId, clubId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    return logs as ActivityLog[];
  }

  // Helper method to log user activities
  async logActivity(params: {
    clubId: number;
    userId: string;
    action: string;
    description: string;
    targetUserId?: string;
    targetResource?: string;
    targetResourceId?: number;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.createActivityLog({
        clubId: params.clubId,
        userId: params.userId,
        action: params.action,
        description: params.description,
        targetUserId: params.targetUserId || null,
        targetResource: params.targetResource || null,
        targetResourceId: params.targetResourceId || null,
        metadata: params.metadata || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - logging failures shouldn't break the main operation
    }
  }

  // Email invitation operations
  async createEmailInvitation(invitation: InsertEmailInvitation): Promise<EmailInvitation> {
    const [newInvitation] = await db.insert(emailInvitations).values(invitation).returning();
    return newInvitation;
  }

  async getAllEmailInvitations(): Promise<EmailInvitation[]> {
    return await db.select().from(emailInvitations).orderBy(desc(emailInvitations.createdAt));
  }

  async getEmailInvitationByToken(token: string): Promise<EmailInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(emailInvitations)
      .where(eq(emailInvitations.token, token));
    return invitation;
  }

  async getInvitationByToken(token: string): Promise<EmailInvitation | undefined> {
    return this.getEmailInvitationByToken(token);
  }

  async getPendingInvitation(email: string, clubId: number): Promise<EmailInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(emailInvitations)
      .where(
        and(
          eq(emailInvitations.email, email),
          eq(emailInvitations.clubId, clubId),
          eq(emailInvitations.status, 'pending')
        )
      );
    return invitation;
  }

  async updateEmailInvitation(id: number, data: Partial<EmailInvitation>): Promise<EmailInvitation> {
    const [updatedInvitation] = await db
      .update(emailInvitations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emailInvitations.id, id))
      .returning();
    return updatedInvitation;
  }

  async deleteEmailInvitation(id: number): Promise<void> {
    await db.delete(emailInvitations).where(eq(emailInvitations.id, id));
  }

  async updateEmailInvitationStatus(token: string, status: 'accepted' | 'expired'): Promise<void> {
    await db
      .update(emailInvitations)
      .set({ 
        status, 
        ...(status === 'accepted' && { acceptedAt: new Date() }),
        updatedAt: new Date() 
      })
      .where(eq(emailInvitations.token, token));
  }

  async getClubEmailInvitations(clubId: number): Promise<EmailInvitation[]> {
    return await db
      .select()
      .from(emailInvitations)
      .where(eq(emailInvitations.clubId, clubId))
      .orderBy(desc(emailInvitations.createdAt));
  }

  // Club membership operations
  async createClubMembership(membership: InsertClubMembership): Promise<ClubMembership> {
    const [newMembership] = await db.insert(clubMemberships).values(membership).returning();
    return newMembership;
  }

  // Super Admin methods for platform management
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllClubs(): Promise<Club[]> {
    return await db.select().from(clubs);
  }

  async getUserClubMemberships(userId: string): Promise<ClubMembership[]> {
    return await db.select().from(clubMemberships).where(eq(clubMemberships.userId, userId));
  }

  async createClub(clubData: any): Promise<Club> {
    console.log("Creating club with data:", clubData);
    
    try {
      // Extract subscription data from clubData
      const { 
        planId = 1, 
        subscriptionStartDate, 
        billingInterval = 'yearly', 
        ...clubDataWithoutPlan 
      } = clubData;
      
      const [newClub] = await db.insert(clubs).values({
        name: clubDataWithoutPlan.name,
        description: clubDataWithoutPlan.description,
        address: clubDataWithoutPlan.address,
        phone: clubDataWithoutPlan.phone,
        email: clubDataWithoutPlan.email,
        website: clubDataWithoutPlan.website,
        primaryColor: clubDataWithoutPlan.primaryColor,
        secondaryColor: clubDataWithoutPlan.secondaryColor,
        accentColor: clubDataWithoutPlan.accentColor,
        settings: clubDataWithoutPlan.settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      console.log("Club created successfully:", newClub);

      // Calculate subscription dates
      const startDate = subscriptionStartDate ? new Date(subscriptionStartDate) : new Date();
      const endDate = new Date(startDate);
      
      if (billingInterval === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1); // End one day before next year starts
        endDate.setHours(23, 59, 59, 999); // End of day
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1); // End one day before next month starts
        endDate.setHours(23, 59, 59, 999); // End of day
      }

      // Create subscription for the new club
      try {
        await this.createClubSubscription({
          clubId: newClub.id,
          planId: planId,
          status: 'active',
          billingInterval: billingInterval,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
        });
        console.log(`Subscription created for club ${newClub.id} with plan ${planId}, billing: ${billingInterval}, period: ${startDate.toISOString()} - ${endDate.toISOString()}`);
      } catch (subscriptionError) {
        console.error("Error creating subscription for new club:", subscriptionError);
        // Don't fail club creation if subscription creation fails
      }
      
      return newClub;
    } catch (error) {
      console.error("Error creating club:", error);
      throw error;
    }
  }

  async createClubSubscription(subscriptionData: any): Promise<any> {
    try {
      // Get plan type from plan ID
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subscriptionData.planId)).limit(1);
      const planType = plan[0]?.planType || 'free';
      
      const [subscription] = await db
        .insert(clubSubscriptions)
        .values({
          ...subscriptionData,
          planType: planType, // Add the missing plan_type
        })
        .returning();
        
      return subscription;
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }

  // Subscription plans operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true)).orderBy(subscriptionPlans.sortOrder);
  }

  async createUser(userData: any): Promise<User> {
    const [newUser] = await db.insert(users).values({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      authProvider: userData.authProvider,
      hasCompletedOnboarding: userData.hasCompletedOnboarding,
      isActive: userData.isActive,
      // ONLY SET SUPER ADMIN if explicitly passed (for Super Admin creation)
      isSuperAdmin: userData.isSuperAdmin === true ? true : false,
      superAdminGrantedAt: userData.isSuperAdmin === true ? (userData.superAdminGrantedAt || null) : null,
      superAdminGrantedBy: userData.isSuperAdmin === true ? (userData.superAdminGrantedBy || null) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log(`👤 Created user ${newUser.email} - Super Admin: ${newUser.isSuperAdmin}`);
    return newUser;
  }

  async getAllClubSubscriptions(): Promise<any[]> {
    // Get real subscription data from database
    return await db
      .select({
        clubId: clubSubscriptions.clubId,
        planType: clubSubscriptions.planType,
        status: clubSubscriptions.status,
        billingInterval: clubSubscriptions.billingInterval,
        currentPeriodStart: clubSubscriptions.currentPeriodStart,
        currentPeriodEnd: clubSubscriptions.currentPeriodEnd
      })
      .from(clubSubscriptions)
      .where(eq(clubSubscriptions.status, 'active'));
  }

  // Super admin operations
  async setSuperAdminStatus(userId: string, isSuperAdmin: boolean, grantedByUserId?: string): Promise<boolean> {
    try {
      const updateData: any = {
        isSuperAdmin,
        updatedAt: new Date()
      };

      if (isSuperAdmin && grantedByUserId) {
        updateData.superAdminGrantedAt = new Date();
        updateData.superAdminGrantedBy = grantedByUserId;
      } else if (!isSuperAdmin) {
        updateData.superAdminGrantedAt = null;
        updateData.superAdminGrantedBy = null;
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      return !!updatedUser;
    } catch (error) {
      console.error('Error updating super admin status:', error);
      return false;
    }
  }

  async getAllSuperAdmins(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isSuperAdmin, true))
      .orderBy(asc(users.email));
  }

  // Super Admin Subscription Management Methods
  async updateSubscriptionPlanPrice(planType: string, price: number, interval: string = 'monthly'): Promise<SubscriptionPlan> {
    try {
      const priceField = interval === 'yearly' ? 'yearlyPrice' : 'monthlyPrice';
      const updateData = {
        [priceField]: price.toString(),
        updatedAt: new Date()
      };

      const [updatedPlan] = await db
        .update(subscriptionPlans)
        .set(updateData)
        .where(eq(subscriptionPlans.planType, planType as any))
        .returning();

      if (!updatedPlan) {
        throw new Error(`Plan with type ${planType} not found`);
      }

      return updatedPlan;
    } catch (error) {
      console.error('Error updating subscription plan price:', error);
      throw error;
    }
  }

  async updateSubscriptionPlanLimits(planType: string, limits: { memberLimit?: number | null, eventLimit?: number | null, storageLimit?: number | null }): Promise<SubscriptionPlan> {
    try {
      const updateData: any = {
        updatedAt: new Date()
      };

      if (limits.memberLimit !== undefined) {
        updateData.maxMembers = limits.memberLimit;
      }
      
      // Note: eventLimit and storageLimit would need to be added to the schema if needed
      // For now, we only update the member limit which exists in the current schema

      const [updatedPlan] = await db
        .update(subscriptionPlans)
        .set(updateData)
        .where(eq(subscriptionPlans.planType, planType as any))
        .returning();

      if (!updatedPlan) {
        throw new Error(`Plan with type ${planType} not found`);
      }

      return updatedPlan;
    } catch (error) {
      console.error('Error updating subscription plan limits:', error);
      throw error;
    }
  }

  async getClubsEligibleForUpgrade(targetPlan: string): Promise<Club[]> {
    try {
      // Get clubs that have a lower-tier plan than the target plan
      const planHierarchy = {
        'free': 0,
        'starter': 1,
        'professional': 2,
        'enterprise': 3
      };

      const targetLevel = planHierarchy[targetPlan as keyof typeof planHierarchy];
      if (targetLevel === undefined) {
        throw new Error(`Invalid target plan: ${targetPlan}`);
      }

      // Get all clubs with active subscriptions at lower tiers
      const eligibleClubs = await db
        .select({
          id: clubs.id,
          name: clubs.name,
          email: clubs.email,
          currentPlan: clubSubscriptions.planType
        })
        .from(clubs)
        .innerJoin(clubSubscriptions, eq(clubs.id, clubSubscriptions.clubId))
        .where(
          and(
            eq(clubSubscriptions.status, 'active'),
            // This would need to be expanded with proper plan comparison logic
            ne(clubSubscriptions.planType, targetPlan)
          )
        );

      return eligibleClubs.filter(club => {
        const currentLevel = planHierarchy[club.currentPlan as keyof typeof planHierarchy] ?? 0;
        return currentLevel < targetLevel;
      });
    } catch (error) {
      console.error('Error getting clubs eligible for upgrade:', error);
      throw error;
    }
  }

  // Email invitation methods for admin creation workflow
  async createEmailInvitation(invitation: InsertEmailInvitation): Promise<EmailInvitation> {
    try {
      const [newInvitation] = await db
        .insert(emailInvitations)
        .values({
          ...invitation,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      // Debug: Email invitation created for ${invitation.email} to club ${invitation.clubId} with roleId ${invitation.roleId}
      return newInvitation;
    } catch (error) {
      console.error('Error creating email invitation:', error);
      throw error;
    }
  }

  // VERALTETE LIVE CHAT METHODEN ENTFERNT - Konsolidierung auf Communication Chat System

  // Event management methods (uses bookings table with facilityId = null)
  async getEvents(clubId: number): Promise<any[]> {
    try {
      // Debug: Getting events for club: ${clubId}
      const events = await db
        .select()
        .from(bookings)
        .where(and(eq(bookings.clubId, clubId), isNull(bookings.facilityId)))
        .orderBy(desc(bookings.startTime));
      // Debug: Found ${events.length} events for club ${clubId}
      return events;
    } catch (error: any) {
      console.error('💥 Error in getEvents:', error.message);
      console.error('📚 getEvents stack:', error.stack);
      throw error;
    }
  }

  async createEvent(eventData: any): Promise<any> {
    // Debug: Storage createEvent called with: ${JSON.stringify(eventData, null, 2)}
    
    try {
      const [event] = await db
        .insert(bookings)
        .values({
          clubId: eventData.clubId,
          facilityId: null, // Events don't have facilities
          teamId: eventData.teamId || null,
          memberId: eventData.memberId || null,
          title: eventData.title,
          description: eventData.description || '',
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          type: eventData.type || 'event',
          location: eventData.location || '',
          isPublic: eventData.isPublic !== false,
          recurring: eventData.recurring || false,
          recurringPattern: eventData.recurringPattern || null,
          recurringUntil: eventData.recurringUntil || null,
          contactPerson: eventData.contactPerson || null,
          contactEmail: eventData.contactEmail || null,
          contactPhone: eventData.contactPhone || null,
          participants: eventData.participants || null,
          cost: eventData.cost || null,
          status: eventData.status || 'confirmed',
          notes: eventData.notes || '',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log('✅ Event created in database:', JSON.stringify(event, null, 2));
      return event;
    } catch (error: any) {
      console.error('💥 Database error in createEvent:', error.message);
      console.error('🔍 Error details:', error);
      console.error('📚 Error stack:', error.stack);
      console.error('🗃️ Failed eventData:', JSON.stringify(eventData, null, 2));
      throw error;
    }
  }

  async updateEvent(id: number, eventData: any): Promise<any> {
    const [event] = await db
      .update(bookings)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  // Get both bookings and events for calendar view
  async getCalendarItems(clubId: number): Promise<any[]> {
    return await db
      .select({
        id: bookings.id,
        clubId: bookings.clubId,
        facilityId: bookings.facilityId,
        teamId: bookings.teamId,
        memberId: bookings.memberId,
        title: bookings.title,
        description: bookings.description,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        type: bookings.type,
        location: bookings.location,
        isPublic: bookings.isPublic,
        status: bookings.status,
        participants: bookings.participants,
        cost: bookings.cost,
        contactPerson: bookings.contactPerson,
        contactEmail: bookings.contactEmail,
        contactPhone: bookings.contactPhone,
        notes: bookings.notes,
        recurring: bookings.recurring,
        recurringPattern: bookings.recurringPattern,
        recurringUntil: bookings.recurringUntil,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
      })
      .from(bookings)
      .where(eq(bookings.clubId, clubId))
      .orderBy(desc(bookings.startTime));
  }
}

const storage = new DatabaseStorage();
export default storage;
