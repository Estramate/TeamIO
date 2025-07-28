import { pgTable, serial, integer, text, timestamp, boolean, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { clubs } from './core';

// Chat rooms table
export const chatRooms = pgTable('chat_rooms', {
  id: serial('id').primaryKey(),
  clubId: integer('club_id').notNull().references(() => clubs.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'direct', 'group', 'team'
  description: text('description'),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  lastMessageId: integer('last_message_id'),
  lastActivity: timestamp('last_activity').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Chat room participants
export const chatRoomParticipants = pgTable('chat_room_participants', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').notNull().references(() => chatRooms.id),
  userId: varchar('user_id', { length: 255 }).notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
  lastReadAt: timestamp('last_read_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});

// Live chat messages table - different from communication messages
export const liveChatMessages = pgTable('live_chat_messages', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').notNull().references(() => chatRooms.id),
  senderId: varchar('sender_id', { length: 255 }).notNull(),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 50 }).default('text'), // 'text', 'image', 'file', 'system'
  replyToId: integer('reply_to_id').references(() => liveChatMessages.id),
  editedAt: timestamp('edited_at'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Live chat message read status
export const liveChatMessageReadStatus = pgTable('live_chat_message_read_status', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id').notNull().references(() => liveChatMessages.id),
  userId: varchar('user_id', { length: 255 }).notNull(),
  readAt: timestamp('read_at').defaultNow(),
});

// User activity tracking for online status
export const userActivity = pgTable('user_activity', {
  id: serial('id').primaryKey(),
  clubId: integer('club_id').notNull().references(() => clubs.id),
  userId: varchar('user_id', { length: 255 }).notNull(),
  lastSeen: timestamp('last_seen').defaultNow(),
  isOnline: boolean('is_online').default(true),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  club: one(clubs, {
    fields: [chatRooms.clubId],
    references: [clubs.id],
  }),
  participants: many(chatRoomParticipants),
  messages: many(liveChatMessages),
  // lastMessage: one(chatMessages, {
  //   fields: [chatRooms.lastMessageId],
  //   references: [chatMessages.id],
  // }),
}));

export const chatRoomParticipantsRelations = relations(chatRoomParticipants, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatRoomParticipants.roomId],
    references: [chatRooms.id],
  }),
}));

export const liveChatMessagesRelations = relations(liveChatMessages, ({ one, many }) => ({
  room: one(chatRooms, {
    fields: [liveChatMessages.roomId],
    references: [chatRooms.id],
  }),
  // replyTo: one(liveChatMessages, {
  //   fields: [liveChatMessages.replyToId],
  //   references: [liveChatMessages.id],
  // }),
  readStatus: many(liveChatMessageReadStatus),
}));

export const liveChatMessageReadStatusRelations = relations(liveChatMessageReadStatus, ({ one }) => ({
  message: one(liveChatMessages, {
    fields: [liveChatMessageReadStatus.messageId],
    references: [liveChatMessages.id],
  }),
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  club: one(clubs, {
    fields: [userActivity.clubId],
    references: [clubs.id],
  }),
}));

// TypeScript types
export type ChatRoom = typeof chatRooms.$inferSelect;
export type NewChatRoom = typeof chatRooms.$inferInsert;

export type ChatRoomParticipant = typeof chatRoomParticipants.$inferSelect;
export type NewChatRoomParticipant = typeof chatRoomParticipants.$inferInsert;

export type LiveChatMessage = typeof liveChatMessages.$inferSelect;
export type NewLiveChatMessage = typeof liveChatMessages.$inferInsert;

export type LiveChatMessageReadStatus = typeof liveChatMessageReadStatus.$inferSelect;
export type NewLiveChatMessageReadStatus = typeof liveChatMessageReadStatus.$inferInsert;

export type UserActivity = typeof userActivity.$inferSelect;
export type NewUserActivity = typeof userActivity.$inferInsert;