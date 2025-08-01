/**
 * Centralized schema exports for all domains
 * This file aggregates all schema definitions for easy importing
 */

// Re-export everything from core schemas
export * from "./core";
export * from "./members";
export * from "./teams";
export * from "./facilities";
export * from "./finances";
export * from "./communication";
export * from "./subscriptions";

// Live Chat exports (separate namespace to avoid conflicts)
export {
  chatRooms as liveChatRooms,
  chatRoomParticipants,
  liveChatMessages,
  liveChatMessageReadStatus,
  userActivity,
  type ChatRoom as LiveChatRoom,
  type NewChatRoom as NewLiveChatRoom,
  type LiveChatMessage,
  type NewLiveChatMessage,
  type NewChatRoomParticipant as NewLiveChatRoomParticipant,
  type NewLiveChatMessageReadStatus,
  type NewUserActivity,
} from "./chat";

// Update relations to include cross-domain references
import { relations } from "drizzle-orm";
import { clubs } from "./core";
import { members, teamMemberships } from "./members";
import { teams } from "./teams";
import { facilities, bookings } from "./facilities";
import { finances, memberFees, trainingFees } from "./finances";
import { 
  messages, 
  notifications, 
  messageFormSchema, 
  announcementFormSchema,
  insertAnnouncementSchema 
} from "./communication";

// Enhanced club relations to include all entities
export const clubsRelationsEnhanced = relations(clubs, ({ many }) => ({
  memberships: many(members),
  members: many(members),
  teams: many(teams),
  facilities: many(facilities),
  bookings: many(bookings),
  finances: many(finances),
  memberFees: many(memberFees),
  trainingFees: many(trainingFees),
  messages: many(messages),

  notifications: many(notifications),
}));

// Enhanced member relations
export const membersRelationsEnhanced = relations(members, ({ one, many }) => ({
  club: one(clubs, {
    fields: [members.clubId],
    references: [clubs.id],
  }),
  teamMemberships: many(teamMemberships),
  bookings: many(bookings),
  finances: many(finances),
  memberFees: many(memberFees),
}));

// Enhanced team relations
export const teamsRelationsEnhanced = relations(teams, ({ one, many }) => ({
  club: one(clubs, {
    fields: [teams.clubId],
    references: [clubs.id],
  }),
  memberships: many(teamMemberships),
  bookings: many(bookings),
  finances: many(finances),
}));

// Add reference to teams in teamMemberships
export const teamMembershipsRelationsEnhanced = relations(teamMemberships, ({ one }) => ({
  team: one(teams, {
    fields: [teamMemberships.teamId],
    references: [teams.id],
  }),
  member: one(members, {
    fields: [teamMemberships.memberId],
    references: [members.id],
  }),
}));

// Export all schemas and types for easier access
export {
  messages,
  notifications,
  messageFormSchema,
  announcementFormSchema,
  insertAnnouncementSchema,
  insertNotificationSchema
} from "./communication";