import { pgTable, serial, integer, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { clubs } from './core';
import { users } from './core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ===== LIVE CHAT SYSTEM VOLLSTÄNDIG ENTFERNT =====
// Alle Chat-Tabellen, Relations und Schemas wurden entfernt
// Nur klassisches Nachrichten-System bleibt verfügbar

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

// Relations - NUR FÜR KLASSISCHES SYSTEM
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
  replyTo: one(messages, {
    fields: [messages.threadId],
    references: [messages.id],
    relationName: 'thread',
  }),
  replies: many(messages, {
    relationName: 'thread',
  }),
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

// Insert and Select Schemas - NUR FÜR KLASSISCHES NACHRICHTEN-SYSTEM
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectMessageSchema = createSelectSchema(messages);

export const insertMessageRecipientSchema = createInsertSchema(messageRecipients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectMessageRecipientSchema = createSelectSchema(messageRecipients);

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const selectAnnouncementSchema = createSelectSchema(announcements);

// Types - NUR KLASSISCHES SYSTEM
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type MessageRecipient = typeof messageRecipients.$inferSelect;
export type InsertMessageRecipient = z.infer<typeof insertMessageRecipientSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// Form schemas
export const messageFormSchema = z.object({
  subject: z.string().optional(),
  content: z.string().min(1, "Nachricht ist erforderlich"),
  messageType: z.string().default("direct"),
  priority: z.string().default("normal"),
  recipients: z.array(z.object({
    type: z.string(),
    id: z.string().optional(),
  })).min(1, "Mindestens ein Empfänger ist erforderlich"),
});

export const announcementFormSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  content: z.string().min(1, 'Inhalt ist erforderlich'),
  category: z.string().default('general'),
  priority: z.string().default('normal'),
  targetAudience: z.string().default('all'),
  isPinned: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

// Extended types for API responses
export interface MessageWithSender extends Message {
  sender: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  recipients: MessageRecipient[];
  replyCount?: number;
  replies?: MessageWithSender[];
}

export interface AnnouncementWithAuthor extends Announcement {
  author: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

// Export für bessere Kompatibilität - alle Interface-Exports
export type { AnnouncementWithAuthor, MessageWithSender };