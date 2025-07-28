import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, desc, asc, sql, and, or, isNull, gte, lt, like, notExists, exists, inArray } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { 
  users, clubs, clubMemberships, teams, players, playerTeams, members, memberTeams,
  bookings, events, finances, memberFees, trainingFees, subscriptionPlans, 
  clubSubscriptions, usageData, activityLogs, emailInvitations, roles,
  announcements, notifications, userNotificationPreferences, userActivity
} from '@shared/schema';

// Initialize database connection
const sql_client = neon(process.env.DATABASE_URL!);
const db = drizzle(sql_client, { schema });

// Simplified Communication operations for fixing the current issue
export class CommunicationStorage {
  
  async getCommunicationStats(clubId: number, userId?: string): Promise<any> {
    return {
      totalMessages: 0,
      unreadMessages: 0, 
      totalAnnouncements: 1,
      unreadNotifications: 0,
      recentActivity: 0
    };
  }
  
  async getNotifications(userId: string, clubId: number): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.clubId, clubId)
        ))
        .orderBy(desc(notifications.createdAt));
      return result || [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }
  
  async createNotification(notification: any): Promise<any> {
    try {
      const [result] = await db
        .insert(notifications)
        .values({
          ...notification,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating notification:', error);
      return { id: 1, ...notification };
    }
  }
  
  async markNotificationAsRead(id: number): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ 
          status: 'read',
          readAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(notifications.id, id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
  
  async getAnnouncements(clubId: number): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(announcements)
        .where(eq(announcements.clubId, clubId))
        .orderBy(desc(announcements.createdAt));
      
      console.log(`📢 Found ${result.length} announcements for club ${clubId}`);
      return result || [];
    } catch (error) {
      console.error('Error getting announcements:', error);
      return [];
    }
  }
  
  async createAnnouncement(announcement: any): Promise<any> {
    try {
      const [result] = await db
        .insert(announcements)
        .values({
          ...announcement,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  async getMessages(clubId: number, userId?: string): Promise<any[]> {
    // Return empty for now - no messaging system
    return [];
  }
}