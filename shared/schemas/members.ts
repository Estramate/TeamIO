/**
 * Member management schema definitions
 * Contains: Members, Team Memberships
 */

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  serial,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { clubs, users } from "./core";

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

// Team memberships - links members to teams
export const teamMemberships = pgTable("team_memberships", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(), // Referenced from teams.ts
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

// Relations for members
export const membersRelations = relations(members, ({ one, many }) => ({
  club: one(clubs, {
    fields: [members.clubId],
    references: [clubs.id],
  }),
  teamMemberships: many(teamMemberships),
  // User who is assigned to this member
  user: one(users, {
    fields: [members.id],
    references: [users.memberId],
  }),
}));

export const teamMembershipsRelations = relations(teamMemberships, ({ one }) => ({
  member: one(members, {
    fields: [teamMemberships.memberId],
    references: [members.id],
  }),
}));

// Insert schemas for members
export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMembershipSchema = createInsertSchema(teamMemberships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Form schemas for members
export const memberFormSchema = createInsertSchema(members, {
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

// Export types for members
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type TeamMembership = typeof teamMemberships.$inferSelect;
export type InsertTeamMembership = z.infer<typeof insertTeamMembershipSchema>;