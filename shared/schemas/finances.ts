/**
 * Financial management schema definitions
 * Contains: Finances, Member Fees, Training Fees
 */

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { clubs } from "./core";
import { members } from "./members";
import { players, teams } from "./teams";

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

// NOTE: memberFees and trainingFees tables removed - were unused (0 rows)

// Relations for finances
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

// NOTE: memberFeesRelations and trainingFeesRelations removed - tables deleted

// Insert schemas for finances
export const insertFinanceSchema = createInsertSchema(finances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// NOTE: insertMemberFeeSchema and insertTrainingFeeSchema removed - tables deleted

// Form schemas for finances
export const financeFormSchema = createInsertSchema(finances, {
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  subcategory: z.string().optional().nullable().transform((val) => 
    val === '' || val === undefined ? null : val
  ),
  reference: z.string().optional().nullable().transform((val) => 
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
}).omit({
  id: true,
  clubId: true,
  createdAt: true,
  updatedAt: true,
});

// Export types for finances
export type Finance = typeof finances.$inferSelect;
export type InsertFinance = z.infer<typeof insertFinanceSchema>;