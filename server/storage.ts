import {
  users,
  clubs,
  clubMemberships,
  members,
  teams,
  teamMemberships,
  facilities,
  bookings,
  events,
  finances,
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
  type Facility,
  type InsertFacility,
  type Booking,
  type InsertBooking,
  type Event,
  type InsertEvent,
  type Finance,
  type InsertFinance,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

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
    const [updatedFinance] = await db
      .update(finances)
      .set({ ...finance, updatedAt: new Date() })
      .where(eq(finances.id, id))
      .returning();
    return updatedFinance;
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
          eq(finances.date, thisMonth)
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
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }
}

export const storage = new DatabaseStorage();
