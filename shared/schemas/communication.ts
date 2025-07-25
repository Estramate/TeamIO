/**
 * Communication schema definitions
 * Contains: Messages, Announcements, Notifications, Message Recipients, Message Attachments
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
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { clubs, users } from "./core";
import { members } from "./members";
import { teams } from "./teams";

// Messages table - for direct messages and group chats
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    clubId: integer("club_id").notNull().references(() => clubs.id),
    senderId: varchar("sender_id").notNull().references(() => users.id),
    subject: varchar("subject", { length: 255 }),
    content: text("content").notNull(),
    messageType: varchar("message_type", { length: 50 }).notNull().default("direct"), // direct, group, announcement
    priority: varchar("priority", { length: 20 }).notNull().default("normal"), // low, normal, high, urgent
    status: varchar("status", { length: 20 }).notNull().default("sent"), // draft, sent, delivered, read
    // Thread and conversation support
    threadId: integer("thread_id"), // reference to parent message for threading
    conversationId: uuid("conversation_id"), // unique conversation identifier
    // Additional metadata
    scheduledFor: timestamp("scheduled_for"), // for scheduled messages
    expiresAt: timestamp("expires_at"), // for temporary messages
    attachments: jsonb("attachments"), // file attachments metadata
    metadata: jsonb("metadata"), // extensible metadata field
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"), // soft delete
  },
  (table) => [
    index("idx_messages_club_id").on(table.clubId),
    index("idx_messages_sender_id").on(table.senderId),
    index("idx_messages_conversation_id").on(table.conversationId),
    index("idx_messages_thread_id").on(table.threadId),
    index("idx_messages_created_at").on(table.createdAt),
    index("idx_messages_status").on(table.status),
  ],
);

// Message recipients table - for managing who receives messages
export const messageRecipients = pgTable(
  "message_recipients",
  {
    id: serial("id").primaryKey(),
    messageId: integer("message_id").notNull().references(() => messages.id),
    recipientType: varchar("recipient_type", { length: 20 }).notNull(), // user, team, role, all
    recipientId: varchar("recipient_id"), // user ID, team ID, role name, or null for all
    status: varchar("status", { length: 20 }).notNull().default("sent"), // sent, delivered, read, deleted
    readAt: timestamp("read_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_message_recipients_message_id").on(table.messageId),
    index("idx_message_recipients_recipient").on(table.recipientType, table.recipientId),
    index("idx_message_recipients_status").on(table.status),
  ],
);

// Announcements table - for club-wide announcements
export const announcements = pgTable(
  "announcements",
  {
    id: serial("id").primaryKey(),
    clubId: integer("club_id").notNull().references(() => clubs.id),
    authorId: varchar("author_id").notNull().references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 50 }).notNull(), // general, training, event, urgent, etc.
    priority: varchar("priority", { length: 20 }).notNull().default("normal"), // low, normal, high, urgent
    targetAudience: varchar("target_audience", { length: 50 }).notNull().default("all"), // all, members, trainers, team-specific
    targetTeamIds: jsonb("target_team_ids"), // array of team IDs for team-specific announcements
    // Publication settings
    publishedAt: timestamp("published_at"),
    scheduledFor: timestamp("scheduled_for"),
    expiresAt: timestamp("expires_at"),
    isPinned: boolean("is_pinned").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    // Engagement metrics
    viewCount: integer("view_count").notNull().default(0),
    // Additional metadata
    attachments: jsonb("attachments"),
    tags: jsonb("tags"), // array of tags for categorization
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"), // soft delete
  },
  (table) => [
    index("idx_announcements_club_id").on(table.clubId),
    index("idx_announcements_author_id").on(table.authorId),
    index("idx_announcements_category").on(table.category),
    index("idx_announcements_published_at").on(table.publishedAt),
    index("idx_announcements_is_pinned").on(table.isPinned),
    index("idx_announcements_target_audience").on(table.targetAudience),
  ],
);

// Notifications table - for system notifications and alerts
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    clubId: integer("club_id").notNull().references(() => clubs.id),
    userId: varchar("user_id").notNull().references(() => users.id),
    type: varchar("type", { length: 50 }).notNull(), // message, announcement, booking, payment, etc.
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    priority: varchar("priority", { length: 20 }).notNull().default("normal"), // low, normal, high, urgent
    status: varchar("status", { length: 20 }).notNull().default("unread"), // unread, read, dismissed
    // Related entities
    relatedEntityType: varchar("related_entity_type", { length: 50 }), // message, announcement, booking, etc.
    relatedEntityId: integer("related_entity_id"), // ID of the related entity
    // Action information
    actionUrl: varchar("action_url", { length: 500 }), // URL to navigate to when clicked
    actionText: varchar("action_text", { length: 100 }), // Text for action button
    // Metadata and settings
    metadata: jsonb("metadata"),
    expiresAt: timestamp("expires_at"),
    readAt: timestamp("read_at"),
    dismissedAt: timestamp("dismissed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_notifications_club_id").on(table.clubId),
    index("idx_notifications_user_id").on(table.userId),
    index("idx_notifications_type").on(table.type),
    index("idx_notifications_status").on(table.status),
    index("idx_notifications_priority").on(table.priority),
    index("idx_notifications_created_at").on(table.createdAt),
  ],
);

// Communication preferences table - for user communication settings
export const communicationPreferences = pgTable(
  "communication_preferences",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id),
    clubId: integer("club_id").notNull().references(() => clubs.id),
    // Email preferences
    emailNotifications: boolean("email_notifications").notNull().default(true),
    emailAnnouncements: boolean("email_announcements").notNull().default(true),
    emailReminders: boolean("email_reminders").notNull().default(true),
    emailDigest: varchar("email_digest", { length: 20 }).notNull().default("daily"), // none, daily, weekly
    // In-app preferences
    pushNotifications: boolean("push_notifications").notNull().default(true),
    soundNotifications: boolean("sound_notifications").notNull().default(true),
    // Communication channels
    preferredLanguage: varchar("preferred_language", { length: 5 }).notNull().default("de"), // de, en
    timezone: varchar("timezone", { length: 50 }).notNull().default("Europe/Berlin"),
    // Message filtering
    messageFilters: jsonb("message_filters"), // custom filtering rules
    blockedUsers: jsonb("blocked_users"), // array of blocked user IDs
    mutedConversations: jsonb("muted_conversations"), // array of muted conversation IDs
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_communication_preferences_user_club").on(table.userId, table.clubId),
  ],
);

// Relations for communication entities
export const messagesRelations = relations(messages, ({ one, many }) => ({
  club: one(clubs, {
    fields: [messages.clubId],
    references: [clubs.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  recipients: many(messageRecipients),
  thread: one(messages, {
    fields: [messages.threadId],
    references: [messages.id],
  }),
  replies: many(messages),
}));

export const messageRecipientsRelations = relations(messageRecipients, ({ one }) => ({
  message: one(messages, {
    fields: [messageRecipients.messageId],
    references: [messages.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  club: one(clubs, {
    fields: [announcements.clubId],
    references: [clubs.id],
  }),
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  club: one(clubs, {
    fields: [notifications.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const communicationPreferencesRelations = relations(communicationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [communicationPreferences.userId],
    references: [users.id],
  }),
  club: one(clubs, {
    fields: [communicationPreferences.clubId],
    references: [clubs.id],
  }),
}));

// Insert schemas for communication entities
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const insertMessageRecipientSchema = createInsertSchema(messageRecipients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationPreferencesSchema = createInsertSchema(communicationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Form schemas with validation
export const messageFormSchema = insertMessageSchema.extend({
  content: z.string().min(1, "Nachricht ist erforderlich"),
  recipients: z.array(z.object({
    type: z.string(),
    id: z.string().optional(),
  })).min(1, "Mindestens ein Empfänger ist erforderlich"),
});

export const announcementFormSchema = insertAnnouncementSchema.extend({
  title: z.string().min(1, "Titel ist erforderlich"),
  content: z.string().min(1, "Inhalt ist erforderlich"),
  category: z.string().min(1, "Kategorie ist erforderlich"),
});

export const notificationFormSchema = insertNotificationSchema.extend({
  title: z.string().min(1, "Titel ist erforderlich"),
  type: z.string().min(1, "Typ ist erforderlich"),
});

// Export types for communication entities
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type MessageRecipient = typeof messageRecipients.$inferSelect;
export type InsertMessageRecipient = z.infer<typeof insertMessageRecipientSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type CommunicationPreferences = typeof communicationPreferences.$inferSelect;
export type InsertCommunicationPreferences = z.infer<typeof insertCommunicationPreferencesSchema>;

// Extended types with relations
export type MessageWithRecipients = Message & {
  recipients: MessageRecipient[];
  sender: { id: string; firstName?: string; lastName?: string; email?: string };
};

export type AnnouncementWithAuthor = Announcement & {
  author: { id: string; firstName?: string; lastName?: string; email?: string };
};

// Communication statistics type
export type CommunicationStats = {
  totalMessages: number;
  unreadMessages: number;
  totalAnnouncements: number;
  unreadNotifications: number;
  recentActivity: number;
};