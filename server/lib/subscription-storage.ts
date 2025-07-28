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
        .where(eq(subscriptionPlans.planType, (subscription as any).planType))
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
      .values([subscription])
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
    // Since subscription_usage table doesn't exist yet, return mock data
    // In a real implementation, this would track actual usage
    return {
      id: 1,
      clubId,
      subscriptionId: 1,
      memberCount: 25,
      teamCount: 3,
      facilityCount: 2,
      messagesSent: 0,
      emailsSent: 0,
      smsSent: 0,
      apiCalls: 0,
      storageUsed: 50,
      periodStart: new Date('2025-07-01'),
      periodEnd: new Date('2025-07-31'),
      recordedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SubscriptionUsage;
  }

  async createUsageRecord(usage: InsertSubscriptionUsage): Promise<SubscriptionUsage> {
    // Mock implementation since subscription_usage table doesn't exist yet
    return {
      ...usage,
      id: 1,
      recordedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SubscriptionUsage;
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
    // Mock implementation since subscription_usage table doesn't exist yet
    console.log(`Usage metrics updated for club ${clubId}:`, metrics);
  }

  // Feature Access Logging
  async logFeatureAccess(log: InsertFeatureAccessLog): Promise<FeatureAccessLog> {
    // Mock implementation since featureAccessLog table doesn't exist yet
    return {
      ...log,
      id: 1,
      accessedAt: new Date(),
      createdAt: new Date(),
    } as FeatureAccessLog;
  }

  async getFeatureAccessStats(clubId: number, days = 30): Promise<Array<{
    featureName: string;
    accessCount: number;
    lastAccessed: Date;
  }>> {
    // Mock implementation since featureAccessLog table doesn't exist yet
    return [
      {
        featureName: 'basicManagement',
        accessCount: 45,
        lastAccessed: new Date()
      },
      {
        featureName: 'teamManagement',
        accessCount: 12,
        lastAccessed: new Date()
      }
    ];
  }
}

// Initialize storage
export const subscriptionStorage = new PostgreSQLSubscriptionStorage();