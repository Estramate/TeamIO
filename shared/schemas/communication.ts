import { pgTable, serial, integer, text, timestamp, boolean, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { clubs } from './core';
import { users } from './core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Types will be exported after table definitions

// Chat Rooms Table
export const chatRooms = pgTable('chat_rooms', {
  id: serial('id').primaryKey(),
  clubId: integer('club_id').references(() => clubs.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull().default('group'), // 'direct', 'group', 'support'
  description: text('description'),
  createdBy: varchar('created_by', { length: 255 }).references(() => users.id).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chat Room Participants Table
export const chatParticipants = pgTable('chat_participants', {
  id: serial('id').primaryKey(),
  chatRoomId: integer('chat_room_id').references(() => chatRooms.id).notNull(),
  userId: varchar('user_id', { length: 255 }).references(() => users.id).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  lastSeen: timestamp('last_seen'),
  isOnline: boolean('is_online').default(false).notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(), // 'admin', 'moderator', 'member'
  mutedUntil: timestamp('muted_until'),
});

// Chat Messages Table
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  chatRoomId: integer('chat_room_id').references(() => chatRooms.id).notNull(),
  senderId: varchar('sender_id', { length: 255 }).references(() => users.id).notNull(),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 50 }).default('text').notNull(), // 'text', 'image', 'file', 'system'
  attachmentUrl: text('attachment_url'),
  attachmentType: varchar('attachment_type', { length: 100 }),
  attachmentSize: integer('attachment_size'),
  replyToId: integer('reply_to_id').references(() => chatMessages.id),
  isEdited: boolean('is_edited').default(false).notNull(),
  editedAt: timestamp('edited_at'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Message Read Status Table
export const messageReadStatus = pgTable('message_read_status', {
  messageId: integer('message_id').references(() => chatMessages.id).notNull(),
  userId: varchar('user_id', { length: 255 }).references(() => users.id).notNull(),
  readAt: timestamp('read_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.messageId, table.userId] }),
}));

// Video Call Sessions Table
export const videoCallSessions = pgTable('video_call_sessions', {
  id: serial('id').primaryKey(),
  chatRoomId: integer('chat_room_id').references(() => chatRooms.id).notNull(),
  initiatorId: varchar('initiator_id', { length: 255 }).references(() => users.id).notNull(),
  sessionId: varchar('session_id', { length: 255 }).unique().notNull(),
  status: varchar('status', { length: 50 }).default('waiting').notNull(), // 'waiting', 'active', 'ended'
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'), // in seconds
  participants: text('participants'), // JSON array of participant IDs
  recordingUrl: text('recording_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Classic Messages Table (restored for user request)
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  clubId: integer('club_id').references(() => clubs.id).notNull(),
  senderId: varchar('sender_id', { length: 255 }).references(() => users.id).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 50 }).default('direct').notNull(),
  priority: varchar('priority', { length: 50 }).default('normal').notNull(),
  status: varchar('status', { length: 50 }).default('sent').notNull(),
  conversationId: varchar('conversation_id', { length: 255 }),
  threadId: integer('thread_id').references(() => messages.id),
  scheduledFor: timestamp('scheduled_for'),
  expiresAt: timestamp('expires_at'),
  attachments: text('attachments'), // JSON array
  metadata: text('metadata'), // JSON object
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Classic Message Recipients Table (restored)
export const messageRecipients = pgTable('message_recipients', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id').references(() => messages.id).notNull(),
  recipientType: varchar('recipient_type', { length: 50 }).notNull(), // 'user', 'team', 'role'
  recipientId: varchar('recipient_id', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('sent').notNull(),
  readAt: timestamp('read_at'),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types for classic messages system (after table definitions)
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type MessageRecipient = typeof messageRecipients.$inferSelect;
export type InsertMessageRecipient = typeof messageRecipients.$inferInsert;

// Announcements Table
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  clubId: integer('club_id').references(() => clubs.id).notNull(),
  authorId: varchar('author_id', { length: 255 }).references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).default('general').notNull(), // 'news', 'event', 'training', 'important', 'general'
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // 'low', 'normal', 'high', 'urgent'
  targetAudience: varchar('target_audience', { length: 50 }).default('all').notNull(), // 'all', 'members', 'players', 'staff'
  isPinned: boolean('is_pinned').default(false).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  publishedAt: timestamp('published_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  club: one(clubs, {
    fields: [chatRooms.clubId],
    references: [clubs.id],
  }),
  creator: one(users, {
    fields: [chatRooms.createdBy],
    references: [users.id],
  }),
  participants: many(chatParticipants),
  messages: many(chatMessages),
  videoCalls: many(videoCallSessions),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  chatRoom: one(chatRooms, {
    fields: [chatParticipants.chatRoomId],
    references: [chatRooms.id],
  }),
  user: one(users, {
    fields: [chatParticipants.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  chatRoom: one(chatRooms, {
    fields: [chatMessages.chatRoomId],
    references: [chatRooms.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
  replyTo: one(chatMessages, {
    fields: [chatMessages.replyToId],
    references: [chatMessages.id],
    relationName: 'replies',
  }),
  replies: many(chatMessages, {
    relationName: 'replies',
  }),
  readStatus: many(messageReadStatus),
}));

export const messageReadStatusRelations = relations(messageReadStatus, ({ one }) => ({
  message: one(chatMessages, {
    fields: [messageReadStatus.messageId],
    references: [chatMessages.id],
  }),
  user: one(users, {
    fields: [messageReadStatus.userId],
    references: [users.id],
  }),
}));

export const videoCallSessionsRelations = relations(videoCallSessions, ({ one }) => ({
  chatRoom: one(chatRooms, {
    fields: [videoCallSessions.chatRoomId],
    references: [chatRooms.id],
  }),
  initiator: one(users, {
    fields: [videoCallSessions.initiatorId],
    references: [users.id],
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

// Zod Schemas
export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectChatRoomSchema = createSelectSchema(chatRooms);

export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
});

export const selectChatParticipantSchema = createSelectSchema(chatParticipants);

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectChatMessageSchema = createSelectSchema(chatMessages);

export const insertVideoCallSessionSchema = createInsertSchema(videoCallSessions).omit({
  id: true,
  createdAt: true,
});

export const selectVideoCallSessionSchema = createSelectSchema(videoCallSessions);

// Types
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type SelectChatRoom = z.infer<typeof selectChatRoomSchema>;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type SelectChatParticipant = z.infer<typeof selectChatParticipantSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type SelectChatMessage = z.infer<typeof selectChatMessageSchema>;
export type InsertVideoCallSession = z.infer<typeof insertVideoCallSessionSchema>;

// Classic messaging system compatibility - using separate naming to avoid conflicts

// Create a notifications table for compatibility
export const insertNotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Create notifications alias for backward compatibility
export const notifications = chatMessages;

// Create form schemas for compatibility
export const messageFormSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  type: z.string().default('text'),
});

export const announcementFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().default('general'),
  priority: z.string().default('normal'),
  targetAudience: z.string().default('all'),
  isPinned: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const selectAnnouncementSchema = createSelectSchema(announcements);

// Types
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type SelectVideoCallSession = z.infer<typeof selectVideoCallSessionSchema>;

// Extended types for API responses
export interface ChatRoomWithParticipants extends SelectChatRoom {
  participants: Array<SelectChatParticipant & {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
  lastMessage?: SelectChatMessage & {
    sender: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };
  unreadCount: number;
}

export interface ChatMessageWithSender extends SelectChatMessage {
  sender: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  readBy: string[];
  replyTo?: ChatMessageWithSender;
}