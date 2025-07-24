import {
  users,
  clubs,
  clubMemberships,
  members,
  teams,
  teamMemberships,
  players,
  playerTeamAssignments,
  playerStats,
  facilities,
  bookings,
  events,
  finances,
  memberFees,
  trainingFees,
  type User,
  type UpsertUser,
  type Club,
  type InsertClub,
  type ClubMembership,
  type InsertClubMembership,
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
  type Event,
  type InsertEvent,
  type Finance,
  type InsertFinance,
  type MemberFee,
  type InsertMemberFee,
  type TrainingFee,
  type InsertTrainingFee,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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

  // Event operations
  getEvents(clubId: number): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

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

  // Member fee operations
  getMemberFees(clubId: number): Promise<any[]>;
  createMemberFee(memberFee: any): Promise<any>;

  // Training fee operations
  getTrainingFees(clubId: number): Promise<any[]>;
  createTrainingFee(trainingFee: any): Promise<any>;

  // Dashboard operations
  getDashboardStats(clubId: number): Promise<any>;
  getRecentActivity(clubId: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
    await db.delete(teams).where(eq(teams.id, id));
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

  // Event operations
  async getEvents(clubId: number): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.clubId, clubId))
      .orderBy(desc(events.startDate));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
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

  // Member fees operations
  async getMemberFees(clubId: number): Promise<any[]> {
    return await db
      .select({
        id: memberFees.id,
        clubId: memberFees.clubId,
        memberId: memberFees.memberId,
        feeType: memberFees.feeType,
        amount: memberFees.amount,
        period: memberFees.period,
        startDate: memberFees.startDate,
        endDate: memberFees.endDate,
        status: memberFees.status,
        nextDueDate: memberFees.nextDueDate,
        autoGenerate: memberFees.autoGenerate,
        description: memberFees.description,
        createdAt: memberFees.createdAt,
        updatedAt: memberFees.updatedAt,
        member: {
          id: members.id,
          firstName: members.firstName,
          lastName: members.lastName,
          paysMembershipFee: members.paysMembershipFee,
        },
      })
      .from(memberFees)
      .leftJoin(members, eq(memberFees.memberId, members.id))
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

  // Training fees operations
  async getTrainingFees(clubId: number): Promise<any[]> {
    return await db
      .select({
        id: trainingFees.id,
        clubId: trainingFees.clubId,
        name: trainingFees.name,
        description: trainingFees.description,
        feeType: trainingFees.feeType,
        amount: trainingFees.amount,
        period: trainingFees.period,
        startDate: trainingFees.startDate,
        endDate: trainingFees.endDate,
        status: trainingFees.status,
        nextDueDate: trainingFees.nextDueDate,
        autoGenerate: trainingFees.autoGenerate,
        targetType: trainingFees.targetType,
        teamIds: trainingFees.teamIds,
        playerIds: trainingFees.playerIds,
        createdAt: trainingFees.createdAt,
        updatedAt: trainingFees.updatedAt,
      })
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
    const [memberCount] = await db
      .select({ count: members.id })
      .from(members)
      .where(eq(members.clubId, clubId));

    const [teamCount] = await db
      .select({ count: teams.id })
      .from(teams)
      .where(eq(teams.clubId, clubId));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.clubId, clubId),
          eq(bookings.startTime, todayStart),
          eq(bookings.endTime, todayEnd)
        )
      );

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyFinances = await db
      .select()
      .from(finances)
      .where(
        and(
          eq(finances.clubId, clubId),
          gte(finances.date, thisMonth.toISOString().split('T')[0])
        )
      );

    const totalIncome = monthlyFinances
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + Number(f.amount), 0);

    const totalExpenses = monthlyFinances
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + Number(f.amount), 0);

    return {
      memberCount: memberCount?.count || 0,
      teamCount: teamCount?.count || 0,
      todayBookingsCount: todayBookings.length,
      pendingBookingsCount: todayBookings.filter(b => b.status === 'pending').length,
      monthlyBudget: totalIncome - totalExpenses,
    };
  }

  async getRecentActivity(clubId: number): Promise<any[]> {
    // This would typically be a more complex query joining multiple tables
    // For now, return recent members and bookings
    const recentMembers = await db
      .select()
      .from(members)
      .where(eq(members.clubId, clubId))
      .orderBy(desc(members.createdAt))
      .limit(5);

    const recentBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.clubId, clubId))
      .orderBy(desc(bookings.createdAt))
      .limit(5);

    const activities = [
      ...recentMembers.map(m => ({
        type: 'member_added',
        description: `${m.firstName} ${m.lastName} wurde als neues Mitglied hinzugefügt`,
        timestamp: m.createdAt,
        icon: 'user-plus',
      })),
      ...recentBookings.map(b => ({
        type: 'booking_created',
        description: `${b.title} wurde gebucht`,
        timestamp: b.createdAt,
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

  // Member fee operations
  async getMemberFees(clubId: number): Promise<MemberFee[]> {
    return await db.select().from(memberFees).where(eq(memberFees.clubId, clubId)).orderBy(desc(memberFees.createdAt));
  }

  async createMemberFee(memberFeeData: InsertMemberFee): Promise<MemberFee> {
    const [memberFee] = await db.insert(memberFees).values(memberFeeData).returning();
    return memberFee;
  }

  // Training fee operations
  async getTrainingFees(clubId: number): Promise<TrainingFee[]> {
    return await db.select().from(trainingFees).where(eq(trainingFees.clubId, clubId)).orderBy(desc(trainingFees.createdAt));
  }

  async createTrainingFee(trainingFeeData: InsertTrainingFee): Promise<TrainingFee> {
    const [trainingFee] = await db.insert(trainingFees).values(trainingFeeData).returning();
    return trainingFee;
  }
}

export const storage = new DatabaseStorage();
