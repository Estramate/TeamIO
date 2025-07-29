/**
 * Facilities and Bookings schema definitions
 * Contains: Facilities, Bookings/Events
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
import { clubs } from "./core";
import { members } from "./members";
import { teams } from "./teams";

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
  maxConcurrentBookings: integer("max_concurrent_bookings").notNull().default(1), // Maximum number of concurrent bookings allowed
  status: varchar("status", { length: 20 }).notNull().default("available"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bookings/Events table - unified table for both bookings and events
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  facilityId: integer("facility_id").references(() => facilities.id), // nullable for events without facility
  teamId: integer("team_id").references(() => teams.id),
  memberId: integer("member_id").references(() => members.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // training, match, event, meeting, booking
  location: varchar("location", { length: 255 }), // for events without facility
  isPublic: boolean("is_public").default(true), // for events visibility
  recurring: boolean("recurring").default(false),
  recurringPattern: varchar("recurring_pattern", { length: 50 }), // weekly, monthly
  recurringUntil: date("recurring_until"),
  contactPerson: varchar("contact_person", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  participants: jsonb("participants"), // can store numbers or participant lists
  cost: varchar("cost", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("confirmed"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for facilities and bookings
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

// Insert schemas for facilities and bookings
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

// Separate insert schema for events (without facilityId requirement)
export const insertEventSchema = createInsertSchema(bookings, {
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().optional().nullable(),
  startTime: z.string().min(1, "Startzeit ist erforderlich"),
  endTime: z.string().min(1, "Endzeit ist erforderlich"),
  type: z.string().default("event"),
  location: z.string().optional().nullable(),
  teamId: z.number().nullable().optional(), // Team is optional for events
}).omit({
  id: true,
  clubId: true,
  facilityId: true, // Events don't require facility
  createdAt: true,
  updatedAt: true,
});

// Form schemas for facilities and bookings
export const facilityFormSchema = createInsertSchema(facilities, {
  name: z.string().min(1, "Facility name is required"),
  type: z.string().min(1, "Facility type is required"),
  description: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  location: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  rules: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  maintenanceNotes: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
}).omit({
  id: true,
  clubId: true,
  createdAt: true,
  updatedAt: true,
});

export const bookingFormSchema = createInsertSchema(bookings, {
  title: z.string().min(1, "Title is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  type: z.string().min(1, "Booking type is required"),
  description: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  location: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  contactPerson: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  contactEmail: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  contactPhone: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  cost: z.string().optional().nullable().transform((val) => 
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

// Export types for facilities and bookings
export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Event = typeof bookings.$inferSelect; // Events use same table as bookings
export type InsertEvent = z.infer<typeof insertEventSchema>;