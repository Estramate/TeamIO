/**
 * Core schema definitions for authentication and club management
 * Contains: Users, Clubs, Sessions, Club Memberships
 */

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
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

// Activity Log table for user actions tracking
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // 'user_invited', 'membership_approved', 'role_changed', etc.
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: 'cascade' }), // For actions on other users
  targetResource: varchar("target_resource", { length: 100 }), // 'membership', 'user', 'team', etc.
  targetResourceId: integer("target_resource_id"), // ID of the affected resource
  description: text("description").notNull(), // Human readable description
  metadata: jsonb("metadata"), // Additional data (old values, new values, etc.)
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_activity_logs_club_id").on(table.clubId),
  index("idx_activity_logs_user_id").on(table.userId),
  index("idx_activity_logs_created_at").on(table.createdAt),
]);

// Email Invitations table
export const emailInvitations = pgTable("email_invitations", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  invitedBy: varchar("invited_by").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default('member').notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 20 }).default('pending').notNull(), // 'pending', 'accepted', 'expired'
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_invitations_club_id").on(table.clubId),
  index("idx_email_invitations_email").on(table.email),
  index("idx_email_invitations_token").on(table.token),
]);

// User storage table (supports multiple auth providers + password auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"), // For email/password authentication
  // 2FA Settings
  twoFactorSecret: varchar("two_factor_secret"), // TOTP secret key
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorBackupCodes: jsonb("two_factor_backup_codes"), // Array of backup codes
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // OAuth provider information
  authProvider: varchar("auth_provider", { length: 50 }).notNull().default("replit"), // replit, email, google
  providerUserId: varchar("provider_user_id"), // original user ID from provider
  providerData: jsonb("provider_data"), // additional provider-specific data
  // User preferences and status
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("de"),
  isActive: boolean("is_active").default(true),
  // Platform administration privileges
  isSuperAdmin: boolean("is_super_admin").default(false),
  superAdminGrantedAt: timestamp("super_admin_granted_at"),
  superAdminGrantedBy: varchar("super_admin_granted_by").references(() => users.id),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clubs table - main entity for multi-club support
export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("short_name", { length: 10 }), // Club abbreviation like "SVO", "FCB", etc.
  description: text("description"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logo: varchar("logo", { length: 500 }),
  // Club metadata
  foundedYear: integer("founded_year").default(new Date().getFullYear()),
  memberCount: integer("member_count").default(0),
  // Club theme and branding
  primaryColor: varchar("primary_color", { length: 7 }).default("#3b82f6"), // hex color
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#64748b"), // hex color
  accentColor: varchar("accent_color", { length: 7 }).default("#10b981"), // hex color
  logoUrl: varchar("logo_url", { length: 500 }),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Club join requests - users request to join clubs
export const clubJoinRequests = pgTable("club_join_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  message: text("message"), // Optional message from user
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  requestedRole: varchar("requested_role", { length: 50 }).default("member"), // member, trainer, admin
  
  // Admin handling
  reviewedBy: varchar("reviewed_by").references(() => users.id), // admin who reviewed
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"), // admin notes
  approvedRole: varchar("approved_role", { length: 50 }), // actual role granted
  
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

// Relations for core entities
export const usersRelations = relations(users, ({ many }) => ({
  clubMemberships: many(clubMemberships),
  joinRequests: many(clubJoinRequests),
  reviewedRequests: many(clubJoinRequests, {
    relationName: "reviewer",
  }),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  memberships: many(clubMemberships),
  joinRequests: many(clubJoinRequests),
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

export const clubJoinRequestsRelations = relations(clubJoinRequests, ({ one }) => ({
  user: one(users, {
    fields: [clubJoinRequests.userId],
    references: [users.id],
  }),
  club: one(clubs, {
    fields: [clubJoinRequests.clubId],
    references: [clubs.id],
  }),
  reviewer: one(users, {
    fields: [clubJoinRequests.reviewedBy],
    references: [users.id],
    relationName: "reviewer",
  }),
}));

// Insert schemas for core entities
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
export const insertClubJoinRequestSchema = createInsertSchema(clubJoinRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertEmailInvitationSchema = createInsertSchema(emailInvitations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Form schemas for core entities
export const clubFormSchema = createInsertSchema(clubs, {
  name: z.string().min(1, "Club name is required"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const clubJoinRequestFormSchema = createInsertSchema(clubJoinRequests, {
  message: z.string().optional(),
  requestedRole: z.enum(["member", "trainer", "admin"]).default("member"),
}).omit({
  id: true,
  userId: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  reviewNotes: true,
  approvedRole: true,
  createdAt: true,
  updatedAt: true,
});

// Email Invitation Form Schema
export const emailInvitationFormSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  role: z.enum(["member", "trainer", "club-administrator"]).default("member"),
  personalMessage: z.string().optional(),
});

// User Registration Form Schema (for invited users)
export const userRegistrationSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben und eine Zahl enthalten"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  token: z.string().min(1, "Einladungstoken ist erforderlich"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

// Login Form Schema  
export const loginSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  password: z.string().min(1, "Passwort ist erforderlich"),
  twoFactorCode: z.string().optional(),
});

// 2FA Setup Schema
export const twoFactorSetupSchema = z.object({
  verificationCode: z.string().length(6, "Verifikationscode muss 6 Zeichen lang sein"),
});

// Export types for core entities
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Club = typeof clubs.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type ClubMembership = typeof clubMemberships.$inferSelect;
export type InsertClubMembership = z.infer<typeof insertClubMembershipSchema>;
export type ClubJoinRequest = typeof clubJoinRequests.$inferSelect;
export type InsertClubJoinRequest = z.infer<typeof insertClubJoinRequestSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type EmailInvitation = typeof emailInvitations.$inferSelect;
export type InsertEmailInvitation = z.infer<typeof insertEmailInvitationSchema>;