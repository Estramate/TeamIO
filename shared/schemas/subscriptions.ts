/**
 * Subscription and billing management schema definitions
 * Contains: Subscription Plans, Club Subscriptions, Feature Flags
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
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { clubs } from "./core";

// Enums for subscription status and plan types
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'inactive', 
  'cancelled',
  'expired',
  'trialing'
]);

export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'free',
  'starter', 
  'professional',
  'enterprise'
]);

export const billingIntervalEnum = pgEnum('billing_interval', [
  'monthly',
  'yearly'
]);

// Subscription Plans Definition Table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  planType: subscriptionPlanEnum("plan_type").notNull(),
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }).notNull(),
  maxMembers: integer("max_members"), // null = unlimited
  features: jsonb("features").$type<{
    basicManagement: boolean;
    teamManagement: boolean;
    facilityBooking: boolean;
    financialReports: boolean;
    advancedReports: boolean;
    automatedEmails: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
    customIntegrations: boolean;
    multiAdmin: boolean;
    bulkImport: boolean;
    exportData: boolean;
    smsNotifications: boolean;
    customFields: boolean;
  }>().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Club Subscriptions Table
export const clubSubscriptions = pgTable("club_subscriptions", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubs.id, { onDelete: "cascade" }).notNull(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  status: subscriptionStatusEnum("status").default('active').notNull(),
  billingInterval: billingIntervalEnum("billing_interval").default('monthly').notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  trialEnd: timestamp("trial_end"),
  planType: varchar("plan_type", { length: 50 }).notNull(), // Keep for backward compatibility
  canceledAt: timestamp("canceled_at"),
  
  // Billing information
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  
  // Usage tracking (commented out as it doesn't exist in database)
  // currentMemberCount: integer("current_member_count").default(0).notNull(),
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    upgradeReason?: string;
    downgradeReason?: string;
    cancelReason?: string;
    customFeatures?: string[];
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription Usage Tracking
export const subscriptionUsage = pgTable("subscription_usage", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubs.id, { onDelete: "cascade" }).notNull(),
  subscriptionId: integer("subscription_id").references(() => clubSubscriptions.id, { onDelete: "cascade" }).notNull(),
  
  // Usage metrics
  memberCount: integer("member_count").default(0).notNull(),
  teamCount: integer("team_count").default(0).notNull(),
  facilityCount: integer("facility_count").default(0).notNull(),
  messagesSent: integer("messages_sent").default(0).notNull(),
  emailsSent: integer("emails_sent").default(0).notNull(),
  smsSent: integer("sms_sent").default(0).notNull(),
  apiCalls: integer("api_calls").default(0).notNull(),
  storageUsed: integer("storage_used").default(0).notNull(), // in MB
  
  // Billing period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Feature Access Log (for tracking feature usage)
export const featureAccessLog = pgTable("feature_access_log", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubs.id, { onDelete: "cascade" }).notNull(),
  featureName: varchar("feature_name", { length: 100 }).notNull(),
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
  userId: integer("user_id"), // references users table
  metadata: jsonb("metadata").$type<{
    action?: string;
    resource?: string;
    result?: 'allowed' | 'denied';
    reason?: string;
  }>(),
});

// Relations
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  clubSubscriptions: many(clubSubscriptions),
}));

export const clubSubscriptionsRelations = relations(clubSubscriptions, ({ one, many }) => ({
  club: one(clubs, {
    fields: [clubSubscriptions.clubId],
    references: [clubs.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [clubSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  usage: many(subscriptionUsage),
}));

export const subscriptionUsageRelations = relations(subscriptionUsage, ({ one }) => ({
  club: one(clubs, {
    fields: [subscriptionUsage.clubId],
    references: [clubs.id],
  }),
  subscription: one(clubSubscriptions, {
    fields: [subscriptionUsage.subscriptionId],
    references: [clubSubscriptions.id],
  }),
}));

export const featureAccessLogRelations = relations(featureAccessLog, ({ one }) => ({
  club: one(clubs, {
    fields: [featureAccessLog.clubId],
    references: [clubs.id],
  }),
}));

// Insert schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClubSubscriptionSchema = createInsertSchema(clubSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionUsageSchema = createInsertSchema(subscriptionUsage).omit({
  id: true,
  createdAt: true,
});

export const insertFeatureAccessLogSchema = createInsertSchema(featureAccessLog).omit({
  id: true,
  accessedAt: true,
});

// Type exports
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type ClubSubscription = typeof clubSubscriptions.$inferSelect;
export type InsertClubSubscription = z.infer<typeof insertClubSubscriptionSchema>;

export type SubscriptionUsage = typeof subscriptionUsage.$inferSelect;
export type InsertSubscriptionUsage = z.infer<typeof insertSubscriptionUsageSchema>;

export type FeatureAccessLog = typeof featureAccessLog.$inferSelect;
export type InsertFeatureAccessLog = z.infer<typeof insertFeatureAccessLogSchema>;

// Feature definitions for easy reference
export const PLAN_FEATURES = {
  free: {
    basicManagement: true,
    teamManagement: false,
    facilityBooking: false,
    financialReports: false,
    advancedReports: false,
    automatedEmails: false,
    apiAccess: false,
    prioritySupport: false,
    whiteLabel: false,
    customIntegrations: false,
    multiAdmin: false,
    bulkImport: false,
    exportData: false,
    smsNotifications: false,
    customFields: false,
  },
  starter: {
    basicManagement: true,
    teamManagement: true,
    facilityBooking: true,
    financialReports: true,
    advancedReports: false,
    automatedEmails: true,
    apiAccess: false,
    prioritySupport: false,
    whiteLabel: false,
    customIntegrations: false,
    multiAdmin: false,
    bulkImport: false,
    exportData: true,
    smsNotifications: false,
    customFields: false,
  },
  professional: {
    basicManagement: true,
    teamManagement: true,
    facilityBooking: true,
    financialReports: true,
    advancedReports: true,
    automatedEmails: true,
    apiAccess: true,
    prioritySupport: true,
    whiteLabel: false,
    customIntegrations: true,
    multiAdmin: true,
    bulkImport: true,
    exportData: true,
    smsNotifications: true,
    customFields: true,
  },
  enterprise: {
    basicManagement: true,
    teamManagement: true,
    facilityBooking: true,
    financialReports: true,
    advancedReports: true,
    automatedEmails: true,
    apiAccess: true,
    prioritySupport: true,
    whiteLabel: true,
    customIntegrations: true,
    multiAdmin: true,
    bulkImport: true,
    exportData: true,
    smsNotifications: true,
    customFields: true,
  },
} as const;

// Member limits by plan
export const MEMBER_LIMITS = {
  free: 50,
  starter: 150,
  professional: 500,
  enterprise: null, // unlimited
} as const;

// Pricing constants
export const PLAN_PRICING = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 19, yearly: 190 }, // 2 months free yearly
  professional: { monthly: 49, yearly: 490 }, // 2 months free yearly
  enterprise: { monthly: 99, yearly: 990 }, // 2 months free yearly
} as const;