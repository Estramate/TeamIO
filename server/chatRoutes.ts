import { Router } from 'express';
import { z } from 'zod';
import { requiresClubAdmin, requiresAuth } from './middleware/auth';
import { db } from './db';
import { 
  chatRooms, 
  chatParticipants, 
  chatMessages, 
  messageReadStatus,
  videoCallSessions,
  insertChatRoomSchema,
  insertChatMessageSchema,
  insertVideoCallSessionSchema
} from '@shared/schemas';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

const router = Router();

// Get all chat rooms for a club
router.get('/clubs/:clubId/chat-rooms', requiresAuth, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user!.id;

    // Get rooms where user is a participant
    const rooms = await db
      .select({
        id: chatRooms.id,
        name: chatRooms.name,
        type: chatRooms.type,
        description: chatRooms.description,
        createdAt: chatRooms.createdAt,
        updatedAt: chatRooms.updatedAt,
      })
      .from(chatRooms)
      .innerJoin(chatParticipants, eq(chatRooms.id, chatParticipants.chatRoomId))
      .where(
        and(
          eq(chatRooms.clubId, clubId),
          eq(chatParticipants.userId, userId),
          eq(chatRooms.isActive, true)
        )
      )
      .orderBy(desc(chatRooms.updatedAt));

    // Get participants and unread counts for each room
    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        // Get participants
        const participants = await db
          .select({
            id: chatParticipants.id,
            userId: chatParticipants.userId,
            role: chatParticipants.role,
            isOnline: chatParticipants.isOnline,
            lastSeen: chatParticipants.lastSeen,
            joinedAt: chatParticipants.joinedAt,
          })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatRoomId, room.id));

        // Get last message
        const lastMessage = await db
          .select({
            id: chatMessages.id,
            content: chatMessages.content,
            messageType: chatMessages.messageType,
            senderId: chatMessages.senderId,
            createdAt: chatMessages.createdAt,
          })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.chatRoomId, room.id),
              eq(chatMessages.isDeleted, false)
            )
          )
          .orderBy(desc(chatMessages.createdAt))
          .limit(1);

        // Get unread count for current user
        const unreadCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(chatMessages)
          .leftJoin(
            messageReadStatus,
            and(
              eq(messageReadStatus.messageId, chatMessages.id),
              eq(messageReadStatus.userId, userId)
            )
          )
          .where(
            and(
              eq(chatMessages.chatRoomId, room.id),
              eq(chatMessages.isDeleted, false),
              sql`${messageReadStatus.userId} IS NULL`
            )
          );

        return {
          ...room,
          participants,
          lastMessage: lastMessage[0] || null,
          unreadCount: unreadCount[0]?.count || 0,
        };
      })
    );

    res.json(roomsWithDetails);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new chat room
router.post('/clubs/:clubId/chat-rooms', requiresAuth, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user!.id;
    
    const validatedData = insertChatRoomSchema.parse({
      ...req.body,
      clubId,
      createdBy: userId,
    });

    const [newRoom] = await db
      .insert(chatRooms)
      .values(validatedData)
      .returning();

    // Add creator as admin participant
    await db.insert(chatParticipants).values({
      chatRoomId: newRoom.id,
      userId,
      role: 'admin',
      isOnline: true,
    });

    // Add other participants if provided
    if (req.body.participantIds && Array.isArray(req.body.participantIds)) {
      const participants = req.body.participantIds
        .filter((id: string) => id !== userId)
        .map((participantId: string) => ({
          chatRoomId: newRoom.id,
          userId: participantId,
          role: 'member',
          isOnline: false,
        }));

      if (participants.length > 0) {
        await db.insert(chatParticipants).values(participants);
      }
    }

    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a chat room
router.get('/clubs/:clubId/chat-rooms/:roomId/messages', requiresAuth, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const roomId = parseInt(req.params.roomId);
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Verify user is participant in this room
    const participation = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatRoomId, roomId),
          eq(chatParticipants.userId, userId)
        )
      )
      .limit(1);

    if (participation.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get messages with sender info
    const messages = await db
      .select({
        id: chatMessages.id,
        chatRoomId: chatMessages.chatRoomId,
        senderId: chatMessages.senderId,
        content: chatMessages.content,
        messageType: chatMessages.messageType,
        attachmentUrl: chatMessages.attachmentUrl,
        attachmentType: chatMessages.attachmentType,
        replyToId: chatMessages.replyToId,
        isEdited: chatMessages.isEdited,
        editedAt: chatMessages.editedAt,
        createdAt: chatMessages.createdAt,
        updatedAt: chatMessages.updatedAt,
      })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.chatRoomId, roomId),
          eq(chatMessages.isDeleted, false)
        )
      )
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get read status for each message
    const messagesWithReadStatus = await Promise.all(
      messages.map(async (message) => {
        const readBy = await db
          .select({ userId: messageReadStatus.userId })
          .from(messageReadStatus)
          .where(eq(messageReadStatus.messageId, message.id));

        return {
          ...message,
          readBy: readBy.map(r => r.userId),
          senderName: `User ${message.senderId}`, // In real app, join with users table
          senderRole: 'Member', // In real app, get from user role
        };
      })
    );

    res.json(messagesWithReadStatus.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
router.post('/clubs/:clubId/chat-rooms/:roomId/messages', requiresAuth, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const roomId = parseInt(req.params.roomId);
    const userId = req.user!.id;

    // Verify user is participant in this room
    const participation = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatRoomId, roomId),
          eq(chatParticipants.userId, userId)
        )
      )
      .limit(1);

    if (participation.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const validatedData = insertChatMessageSchema.parse({
      ...req.body,
      chatRoomId: roomId,
      senderId: userId,
    });

    const [newMessage] = await db
      .insert(chatMessages)
      .values(validatedData)
      .returning();

    // Update room's updatedAt timestamp
    await db
      .update(chatRooms)
      .set({ updatedAt: new Date() })
      .where(eq(chatRooms.id, roomId));

    // Mark message as read by sender
    await db.insert(messageReadStatus).values({
      messageId: newMessage.id,
      userId,
    });

    res.status(201).json({
      ...newMessage,
      senderName: `User ${userId}`,
      senderRole: 'Member',
      readBy: [userId],
    });
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark messages as read
router.post('/clubs/:clubId/chat-rooms/:roomId/messages/mark-read', requiresAuth, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const userId = req.user!.id;
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds)) {
      return res.status(400).json({ error: 'messageIds must be an array' });
    }

    // Verify user is participant
    const participation = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatRoomId, roomId),
          eq(chatParticipants.userId, userId)
        )
      )
      .limit(1);

    if (participation.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Insert read status for unread messages
    const readStatusValues = messageIds.map((messageId: number) => ({
      messageId,
      userId,
    }));

    await db
      .insert(messageReadStatus)
      .values(readStatusValues)
      .onConflictDoNothing();

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message count for user across all rooms
router.get('/clubs/:clubId/chat-unread-count', requiresAuth, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user!.id;

    const unreadCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .innerJoin(chatRooms, eq(chatMessages.chatRoomId, chatRooms.id))
      .innerJoin(chatParticipants, eq(chatRooms.id, chatParticipants.chatRoomId))
      .leftJoin(
        messageReadStatus,
        and(
          eq(messageReadStatus.messageId, chatMessages.id),
          eq(messageReadStatus.userId, userId)
        )
      )
      .where(
        and(
          eq(chatRooms.clubId, clubId),
          eq(chatParticipants.userId, userId),
          eq(chatMessages.isDeleted, false),
          sql`${messageReadStatus.userId} IS NULL`
        )
      );

    res.json(unreadCount[0]?.count || 0);
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start video call session
router.post('/clubs/:clubId/chat-rooms/:roomId/video-call', requiresAuth, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const userId = req.user!.id;

    // Generate unique session ID
    const sessionId = `call_${roomId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [videoCall] = await db
      .insert(videoCallSessions)
      .values({
        chatRoomId: roomId,
        initiatorId: userId,
        sessionId,
        status: 'waiting',
        participants: JSON.stringify([userId]),
      })
      .returning();

    // Send system message about video call
    await db.insert(chatMessages).values({
      chatRoomId: roomId,
      senderId: userId,
      content: `Video-Anruf gestartet: ${sessionId}`,
      messageType: 'system',
    });

    res.status(201).json(videoCall);
  } catch (error) {
    console.error('Error starting video call:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;