import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clubs table - main entity for multi-club support
export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logo: varchar("logo", { length: 500 }),
  // Club theme and branding
  primaryColor: varchar("primary_color", { length: 7 }).default("#3b82f6"), // hex color
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#64748b"), // hex color
  accentColor: varchar("accent_color", { length: 7 }).default("#10b981"), // hex color
  logoUrl: varchar("logo_url", { length: 500 }),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Club memberships - links users to clubs with roles
export const clubMemberships = pgTable("club_memberships", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  role: varchar("role", { length: 100 }).notNull(), // club-administrator, president, etc.
  permissions: jsonb("permissions"), // specific permissions for this user in this club
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, suspended
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Players table - active players in teams
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  jerseyNumber: integer("jersey_number"),
  position: varchar("position", { length: 50 }), // Tor, Verteidigung, Mittelfeld, Sturm
  birthDate: date("birth_date"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  nationality: varchar("nationality", { length: 50 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  height: integer("height"), // in cm
  weight: integer("weight"), // in kg
  preferredFoot: varchar("preferred_foot", { length: 10 }), // left, right, both
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, injured, suspended, inactive
  contractStart: date("contract_start"),
  contractEnd: date("contract_end"),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Player-Team assignments (many-to-many relationship)
export const playerTeamAssignments = pgTable("player_team_assignments", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  teamId: integer("team_id").notNull().references(() => teams.id),
  season: varchar("season", { length: 20 }).notNull().default("2024/25"),
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Player statistics
export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  teamId: integer("team_id").notNull().references(() => teams.id),
  season: varchar("season", { length: 20 }).notNull().default("2024/25"),
  gamesPlayed: integer("games_played").notNull().default(0),
  goals: integer("goals").notNull().default(0),
  assists: integer("assists").notNull().default(0),
  yellowCards: integer("yellow_cards").notNull().default(0),
  redCards: integer("red_cards").notNull().default(0),
  minutesPlayed: integer("minutes_played").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Members table - actual club members (can be different from system users)
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  birthDate: date("birth_date"),
  address: text("address"),
  membershipNumber: varchar("membership_number", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  joinDate: date("join_date"),
  notes: text("notes"),
  emergencyContact: jsonb("emergency_contact"),
  paysMembershipFee: boolean("pays_membership_fee").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }), // youth, senior, etc.
  ageGroup: varchar("age_group", { length: 50 }), // U17, U15, etc.
  gender: varchar("gender", { length: 20 }), // male, female, mixed
  description: text("description"),
  maxMembers: integer("max_members"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  season: varchar("season", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team memberships - links members to teams
export const teamMemberships = pgTable("team_memberships", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  role: varchar("role", { length: 100 }).notNull().default("player"), // player, captain, trainer, etc.
  position: varchar("position", { length: 100 }), // goalkeeper, defender, etc.
  jerseyNumber: integer("jersey_number"),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facilities table
export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // field, court, gym, etc.
  description: text("description"),
  capacity: integer("capacity"),
  location: varchar("location", { length: 255 }),
  equipment: jsonb("equipment"),
  rules: text("rules"),
  maintenanceNotes: text("maintenance_notes"),
  status: varchar("status", { length: 20 }).notNull().default("available"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  facilityId: integer("facility_id").notNull().references(() => facilities.id),
  teamId: integer("team_id").references(() => teams.id),
  memberId: integer("member_id").references(() => members.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // training, match, event
  recurring: boolean("recurring").default(false),
  recurringPattern: varchar("recurring_pattern", { length: 50 }), // weekly, monthly
  recurringUntil: date("recurring_until"),
  contactPerson: varchar("contact_person", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  participants: integer("participants"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("confirmed"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events/Calendar table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  teamId: integer("team_id").references(() => teams.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: varchar("location", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull(), // match, training, meeting, event
  isPublic: boolean("is_public").default(true),
  participants: jsonb("participants"),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Finance table - Complete club financial management
export const finances = pgTable("finances", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  memberId: integer("member_id").references(() => members.id),
  playerId: integer("player_id").references(() => players.id),
  teamId: integer("team_id").references(() => teams.id),
  type: varchar("type", { length: 20 }).notNull(), // income, expense
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
  dueDate: date("due_date"),
  reference: varchar("reference", { length: 255 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, paid, overdue, cancelled
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  recurring: boolean("recurring").default(false),
  recurringInterval: varchar("recurring_interval", { length: 20 }), // monthly, quarterly, yearly
  nextDueDate: date("next_due_date"),
  attachments: jsonb("attachments"),
  tags: jsonb("tags"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Member fees tracking table
export const memberFees = pgTable("member_fees", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  feeType: varchar("fee_type", { length: 50 }).notNull(), // membership, training, registration, equipment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(), // monthly, quarterly, yearly, one-time
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, suspended, cancelled
  lastPayment: date("last_payment"),
  nextPayment: date("next_payment"),
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).default("0"),
  totalOwed: decimal("total_owed", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training fees for players
export const trainingFees = pgTable("training_fees", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  playerId: integer("player_id").notNull().references(() => players.id),
  teamId: integer("team_id").references(() => teams.id),
  feeType: varchar("fee_type", { length: 50 }).notNull(), // training, coaching, camp, equipment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(), // monthly, quarterly, yearly, one-time
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  lastPayment: date("last_payment"),
  nextPayment: date("next_payment"),
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).default("0"),
  totalOwed: decimal("total_owed", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clubMemberships: many(clubMemberships),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  memberships: many(clubMemberships),
  members: many(members),
  players: many(players),
  teams: many(teams),
  facilities: many(facilities),
  bookings: many(bookings),
  events: many(events),
  finances: many(finances),
  memberFees: many(memberFees),
  trainingFees: many(trainingFees),
}));

export const clubMembershipsRelations = relations(clubMemberships, ({ one }) => ({
  user: one(users, {
    fields: [clubMemberships.userId],
    references: [users.id],
  }),
  club: one(clubs, {
    fields: [clubMemberships.clubId],
    references: [clubs.id],
  }),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  club: one(clubs, {
    fields: [players.clubId],
    references: [clubs.id],
  }),
  teamAssignments: many(playerTeamAssignments),
  stats: many(playerStats),
}));

export const playerTeamAssignmentsRelations = relations(playerTeamAssignments, ({ one }) => ({
  player: one(players, {
    fields: [playerTeamAssignments.playerId],
    references: [players.id],
  }),
  team: one(teams, {
    fields: [playerTeamAssignments.teamId],
    references: [teams.id],
  }),
}));

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
  player: one(players, {
    fields: [playerStats.playerId],
    references: [players.id],
  }),
  team: one(teams, {
    fields: [playerStats.teamId],
    references: [teams.id],
  }),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  club: one(clubs, {
    fields: [members.clubId],
    references: [clubs.id],
  }),
  teamMemberships: many(teamMemberships),
  bookings: many(bookings),
  finances: many(finances),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  club: one(clubs, {
    fields: [teams.clubId],
    references: [clubs.id],
  }),
  memberships: many(teamMemberships),
  playerAssignments: many(playerTeamAssignments),
  playerStats: many(playerStats),
  bookings: many(bookings),
  events: many(events),
  finances: many(finances),
}));

export const teamMembershipsRelations = relations(teamMemberships, ({ one }) => ({
  team: one(teams, {
    fields: [teamMemberships.teamId],
    references: [teams.id],
  }),
  member: one(members, {
    fields: [teamMemberships.memberId],
    references: [members.id],
  }),
}));

export const facilitiesRelations = relations(facilities, ({ one, many }) => ({
  club: one(clubs, {
    fields: [facilities.clubId],
    references: [clubs.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  club: one(clubs, {
    fields: [bookings.clubId],
    references: [clubs.id],
  }),
  facility: one(facilities, {
    fields: [bookings.facilityId],
    references: [facilities.id],
  }),
  team: one(teams, {
    fields: [bookings.teamId],
    references: [teams.id],
  }),
  member: one(members, {
    fields: [bookings.memberId],
    references: [members.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  club: one(clubs, {
    fields: [events.clubId],
    references: [clubs.id],
  }),
  team: one(teams, {
    fields: [events.teamId],
    references: [teams.id],
  }),
}));

export const financesRelations = relations(finances, ({ one }) => ({
  club: one(clubs, {
    fields: [finances.clubId],
    references: [clubs.id],
  }),
  member: one(members, {
    fields: [finances.memberId],
    references: [members.id],
  }),
  player: one(players, {
    fields: [finances.playerId],
    references: [players.id],
  }),
  team: one(teams, {
    fields: [finances.teamId],
    references: [teams.id],
  }),
}));

export const memberFeesRelations = relations(memberFees, ({ one }) => ({
  club: one(clubs, {
    fields: [memberFees.clubId],
    references: [clubs.id],
  }),
  member: one(members, {
    fields: [memberFees.memberId],
    references: [members.id],
  }),
}));

export const trainingFeesRelations = relations(trainingFees, ({ one }) => ({
  club: one(clubs, {
    fields: [trainingFees.clubId],
    references: [clubs.id],
  }),
  player: one(players, {
    fields: [trainingFees.playerId],
    references: [players.id],
  }),
  team: one(teams, {
    fields: [trainingFees.teamId],
    references: [teams.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);

export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClubMembershipSchema = createInsertSchema(clubMemberships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMembershipSchema = createInsertSchema(teamMemberships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacilitySchema = createInsertSchema(facilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFinanceSchema = createInsertSchema(finances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => 
    typeof val === 'string' ? parseFloat(val) : val
  ),
  memberId: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val === '' || val === undefined || val === null ? null : 
    typeof val === 'string' ? parseInt(val) : val
  ),
  playerId: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val === '' || val === undefined || val === null ? null : 
    typeof val === 'string' ? parseInt(val) : val
  ),
  teamId: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val === '' || val === undefined || val === null ? null : 
    typeof val === 'string' ? parseInt(val) : val
  ),
  subcategory: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  paymentMethod: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  notes: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  recurringInterval: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  dueDate: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlayerTeamAssignmentSchema = createInsertSchema(playerTeamAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlayerStatsSchema = createInsertSchema(playerStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMemberFeeSchema = createInsertSchema(memberFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingFeeSchema = createInsertSchema(trainingFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Form schemas for member fees
export const memberFeeFormSchema = createInsertSchema(memberFees, {
  amount: z.string().min(1, "Amount is required"),
  memberId: z.string().min(1, "Member is required"),
  feeType: z.string().min(1, "Fee type is required"),
  period: z.enum(['monthly', 'quarterly', 'annually']),
  startDate: z.string().min(1, "Start date is required"),
}).omit({
  id: true,
  clubId: true,
  createdAt: true,
  updatedAt: true,
});

// Form schemas for training fees  
export const trainingFeeFormSchema = createInsertSchema(trainingFees, {
  name: z.string().min(1, "Name is required"),
  amount: z.string().min(1, "Amount is required"),
  feeType: z.string().min(1, "Fee type is required"),
  period: z.enum(['monthly', 'quarterly', 'annually', 'one-time']),
  startDate: z.string().min(1, "Start date is required"),
  targetType: z.enum(['team', 'player', 'both']),
}).omit({
  id: true,
  clubId: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Club = typeof clubs.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type ClubMembership = typeof clubMemberships.$inferSelect;
export type InsertClubMembership = z.infer<typeof insertClubMembershipSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMembership = typeof teamMemberships.$inferSelect;
export type InsertTeamMembership = z.infer<typeof insertTeamMembershipSchema>;
export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Finance = typeof finances.$inferSelect;
export type InsertFinance = z.infer<typeof insertFinanceSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type PlayerTeamAssignment = typeof playerTeamAssignments.$inferSelect;
export type InsertPlayerTeamAssignment = z.infer<typeof insertPlayerTeamAssignmentSchema>;
export type PlayerStats = typeof playerStats.$inferSelect;
export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type MemberFee = typeof memberFees.$inferSelect;
export type InsertMemberFee = z.infer<typeof insertMemberFeeSchema>;
export type TrainingFee = typeof trainingFees.$inferSelect;
export type InsertTrainingFee = z.infer<typeof insertTrainingFeeSchema>;
