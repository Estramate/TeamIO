/**
 * Teams and Players schema definitions
 * Contains: Teams, Players, Player Team Assignments, Player Stats
 */

import {
  pgTable,
  text,
  varchar,
  timestamp,
  serial,
  integer,
  boolean,
  date,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { clubs } from "./core";
import { teamMemberships } from "./members";

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }), // youth, erwachsene, etc.
  ageGroup: varchar("age_group", { length: 50 }), // U17, U15, etc.
  gender: varchar("gender", { length: 20 }), // male, female, mixed
  description: text("description"),
  maxMembers: integer("max_members"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  season: varchar("season", { length: 20 }),
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
  oefbPlayerUrl: varchar("oefb_player_url", { length: 500 }), // OEFB official player page URL
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

// NOTE: playerStats table removed - was unused (0 rows)

// Relations for teams and players
export const teamsRelations = relations(teams, ({ one, many }) => ({
  club: one(clubs, {
    fields: [teams.clubId],
    references: [clubs.id],
  }),
  memberships: many(teamMemberships),
  playerAssignments: many(playerTeamAssignments),
  // playerStats removed - table deleted
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  club: one(clubs, {
    fields: [players.clubId],
    references: [clubs.id],
  }),
  teamAssignments: many(playerTeamAssignments),
  // stats removed - playerStats table deleted
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

// NOTE: playerStatsRelations removed - playerStats table deleted

// Insert schemas for teams and players
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// NOTE: insertPlayerStatsSchema removed - playerStats table deleted

// Form schemas for teams and players
export const teamFormSchema = createInsertSchema(teams, {
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
}).omit({
  id: true,
  clubId: true,
  createdAt: true,
  updatedAt: true,
});

export const playerFormSchema = createInsertSchema(players, {
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  address: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  notes: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
}).omit({
  id: true,
  clubId: true,
  createdAt: true,
  updatedAt: true,
});

// Export types for teams and players
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type PlayerTeamAssignment = typeof playerTeamAssignments.$inferSelect;
export type InsertPlayerTeamAssignment = z.infer<typeof insertPlayerTeamAssignmentSchema>;
// NOTE: PlayerStats types removed - playerStats table deleted