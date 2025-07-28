/**
 * Subscription storage interface and implementations
 */

import { eq, and, desc, count, max, gte } from "drizzle-orm";
import { db } from "../db";
import {
  subscriptionPlans,
  clubSubscriptions,
  subscriptionUsage,
  featureAccessLog,
  type SubscriptionPlan,
  type ClubSubscription,
  type SubscriptionUsage,
  type FeatureAccessLog,
  type InsertSubscriptionPlan,
  type InsertClubSubscription,
  type InsertSubscriptionUsage,
  type InsertFeatureAccessLog,
} from "@shared/schemas/subscriptions";

export interface ISubscriptionStorage {
  // Subscription Plans
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | null>;
  getSubscriptionPlanByType(planType: string): Promise<SubscriptionPlan | null>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | null>;
  deleteSubscriptionPlan(id: number): Promise<boolean>;

  // Club Subscriptions
  getClubSubscription(clubId: number): Promise<{
    subscription: ClubSubscription | null;
    plan: SubscriptionPlan | null;
    usage: SubscriptionUsage | null;
  }>;
  createClubSubscription(subscription: InsertClubSubscription): Promise<ClubSubscription>;
  updateClubSubscription(id: number, subscription: Partial<InsertClubSubscription>): Promise<ClubSubscription | null>;
  cancelClubSubscription(id: number, reason?: string): Promise<ClubSubscription | null>;

  // Usage Tracking
  getCurrentUsage(clubId: number): Promise<SubscriptionUsage | null>;
  createUsageRecord(usage: InsertSubscriptionUsage): Promise<SubscriptionUsage>;
  updateUsageMetrics(clubId: number, metrics: {
    memberCount?: number;
    teamCount?: number;
    facilityCount?: number;
    messagesSent?: number;
    emailsSent?: number;
    smsSent?: number;
    apiCalls?: number;
    storageUsed?: number;
  }): Promise<void>;

  // Feature Access Logging
  logFeatureAccess(log: InsertFeatureAccessLog): Promise<FeatureAccessLog>;
  getFeatureAccessStats(clubId: number, days?: number): Promise<Array<{
    featureName: string;
    accessCount: number;
    lastAccessed: Date;
  }>>;
}

export class PostgreSQLSubscriptionStorage implements ISubscriptionStorage {
  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | null> {
    const result = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  async getSubscriptionPlanByType(planType: string): Promise<SubscriptionPlan | null> {
    const result = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.planType, planType as any))
      .limit(1);
    
    return result[0] || null;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const result = await db
      .insert(subscriptionPlans)
      .values({
        ...plan,
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }

  async updateSubscriptionPlan(id: number, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | null> {
    const result = await db
      .update(subscriptionPlans)
      .set({
        ...plan,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    
    return result[0] || null;
  }

  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    const result = await db
      .update(subscriptionPlans)
      .set({ isActive: false })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Club Subscriptions
  async getClubSubscription(clubId: number): Promise<{
    subscription: ClubSubscription | null;
    plan: SubscriptionPlan | null;
    usage: SubscriptionUsage | null;
  }> {
    // Get active subscription
    const subscriptionResult = await db
      .select()
      .from(clubSubscriptions)
      .where(eq(clubSubscriptions.clubId, clubId))
      .orderBy(desc(clubSubscriptions.createdAt))
      .limit(1);

    const subscription = subscriptionResult[0] || null;
    
    // Get plan details
    let plan: SubscriptionPlan | null = null;
    if (subscription) {
      const planResult = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription.planId))
        .limit(1);
      
      plan = planResult[0] || null;
    }

    // Get current usage
    const usage = await this.getCurrentUsage(clubId);

    return { subscription, plan, usage };
  }

  async createClubSubscription(subscription: InsertClubSubscription): Promise<ClubSubscription> {
    const result = await db
      .insert(clubSubscriptions)
      .values(subscription)
      .returning();
    
    return result[0];
  }

  async updateClubSubscription(id: number, subscription: Partial<InsertClubSubscription>): Promise<ClubSubscription | null> {
    const result = await db
      .update(clubSubscriptions)
      .set({
        ...subscription,
        updatedAt: new Date(),
      } as any)
      .where(eq(clubSubscriptions.id, id))
      .returning();
    
    return result[0] || null;
  }

  async cancelClubSubscription(id: number, reason?: string): Promise<ClubSubscription | null> {
    const result = await db
      .update(clubSubscriptions)
      .set({
        status: 'cancelled',
        canceledAt: new Date(),
        metadata: reason ? { cancelReason: reason } : undefined,
        updatedAt: new Date(),
      })
      .where(eq(clubSubscriptions.id, id))
      .returning();
    
    return result[0] || null;
  }

  // Usage Tracking
  async getCurrentUsage(clubId: number): Promise<SubscriptionUsage | null> {
    const result = await db
      .select()
      .from(subscriptionUsage)
      .where(eq(subscriptionUsage.clubId, clubId))
      .orderBy(desc(subscriptionUsage.createdAt))
      .limit(1);
    
    return result[0] || null;
  }

  async createUsageRecord(usage: InsertSubscriptionUsage): Promise<SubscriptionUsage> {
    const result = await db
      .insert(subscriptionUsage)
      .values(usage)
      .returning();
    
    return result[0];
  }

  async updateUsageMetrics(clubId: number, metrics: {
    memberCount?: number;
    teamCount?: number;
    facilityCount?: number;
    messagesSent?: number;
    emailsSent?: number;
    smsSent?: number;
    apiCalls?: number;
    storageUsed?: number;
  }): Promise<void> {
    // Get current subscription
    const { subscription } = await this.getClubSubscription(clubId);
    if (!subscription) return;

    // Get or create current period usage record
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const existingUsage = await db
      .select()
      .from(subscriptionUsage)
      .where(
        and(
          eq(subscriptionUsage.clubId, clubId),
          eq(subscriptionUsage.subscriptionId, subscription.id)
        )
      )
      .orderBy(desc(subscriptionUsage.createdAt))
      .limit(1);

    if (existingUsage.length > 0) {
      // Update existing record
      await db
        .update(subscriptionUsage)
        .set(metrics)
        .where(eq(subscriptionUsage.id, existingUsage[0].id));
    } else {
      // Create new usage record
      await this.createUsageRecord({
        clubId,
        subscriptionId: subscription.id,
        periodStart: currentMonth,
        periodEnd: nextMonth,
        ...metrics,
      });
    }
  }

  // Feature Access Logging
  async logFeatureAccess(log: InsertFeatureAccessLog): Promise<FeatureAccessLog> {
    const result = await db
      .insert(featureAccessLog)
      .values(log as any)
      .returning();
    
    return result[0];
  }

  async getFeatureAccessStats(clubId: number, days = 30): Promise<Array<{
    featureName: string;
    accessCount: number;
    lastAccessed: Date;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db
      .select({
        featureName: featureAccessLog.featureName,
        accessCount: count(),
        lastAccessed: max(featureAccessLog.accessedAt),
      })
      .from(featureAccessLog)
      .where(
        and(
          eq(featureAccessLog.clubId, clubId),
          gte(featureAccessLog.accessedAt, startDate)
        )
      )
      .groupBy(featureAccessLog.featureName);

    return result.map(row => ({
      featureName: row.featureName,
      accessCount: Number(row.accessCount),
      lastAccessed: row.lastAccessed!,
    }));
  }
}

// Initialize storage
export const subscriptionStorage = new PostgreSQLSubscriptionStorage();