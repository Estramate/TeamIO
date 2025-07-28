import { Router } from 'express';
import { z } from 'zod';
import { isAuthenticated } from './replitAuth';
import { db } from './db';
import { 
  chatRooms, 
  chatRoomParticipants, 
  liveChatMessages, 
  liveChatMessageReadStatus,
  userActivity
} from '@shared/schemas/chat';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

const router = Router();

// Get all chat rooms for a club
router.get('/clubs/:clubId/chat-rooms', isAuthenticated, async (req, res) => {
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
      .innerJoin(chatRoomParticipants, eq(chatRooms.id, chatRoomParticipants.roomId))
      .where(
        and(
          eq(chatRooms.clubId, clubId),
          eq(chatRoomParticipants.userId, userId),
          eq(chatRooms.isActive, true),
          eq(chatRoomParticipants.isActive, true)
        )
      )
      .orderBy(desc(chatRooms.updatedAt));

    // Get participants and unread counts for each room
    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        // Get participants
        const participants = await db
          .select({
            id: chatRoomParticipants.id,
            userId: chatRoomParticipants.userId,
            joinedAt: chatRoomParticipants.joinedAt,
            lastReadAt: chatRoomParticipants.lastReadAt,
            isActive: chatRoomParticipants.isActive,
          })
          .from(chatRoomParticipants)
          .where(eq(chatRoomParticipants.roomId, room.id));

        // Get last message
        const lastMessage = await db
          .select({
            id: liveChatMessages.id,
            content: liveChatMessages.content,
            messageType: liveChatMessages.messageType,
            senderId: liveChatMessages.senderId,
            createdAt: liveChatMessages.createdAt,
          })
          .from(liveChatMessages)
          .where(
            and(
              eq(liveChatMessages.roomId, room.id),
              eq(liveChatMessages.isDeleted, false)
            )
          )
          .orderBy(desc(liveChatMessages.createdAt))
          .limit(1);

        // Get unread count for current user
        const unreadCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(liveChatMessages)
          .leftJoin(
            liveChatMessageReadStatus,
            and(
              eq(liveChatMessageReadStatus.messageId, liveChatMessages.id),
              eq(liveChatMessageReadStatus.userId, userId)
            )
          )
          .where(
            and(
              eq(liveChatMessages.roomId, room.id),
              eq(liveChatMessages.isDeleted, false),
              sql`${liveChatMessageReadStatus.userId} IS NULL`
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
router.post('/clubs/:clubId/chat-rooms', isAuthenticated, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user!.id;
    
    const roomData = {
      clubId,
      name: req.body.name,
      type: req.body.type || 'group',
      description: req.body.description,
      createdBy: userId,
    };

    const [newRoom] = await db
      .insert(chatRooms)
      .values(roomData)
      .returning();

    // Add creator as participant
    await db.insert(chatRoomParticipants).values({
      roomId: newRoom.id,
      userId,
    });

    // Add other participants if provided
    if (req.body.participantIds && Array.isArray(req.body.participantIds)) {
      const participants = req.body.participantIds
        .filter((id: string) => id !== userId)
        .map((participantId: string) => ({
          roomId: newRoom.id,
          userId: participantId,
        }));

      if (participants.length > 0) {
        await db.insert(chatRoomParticipants).values(participants);
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
router.get('/clubs/:clubId/chat-rooms/:roomId/messages', isAuthenticated, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const roomId = parseInt(req.params.roomId);
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Verify user is participant in this room
    const participation = await db
      .select()
      .from(chatRoomParticipants)
      .where(
        and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.userId, userId),
          eq(chatRoomParticipants.isActive, true)
        )
      )
      .limit(1);

    if (participation.length === 0) {
      return res.status(403).json({ error: 'Not authorized to access this chat room' });
    }

    // Get messages
    const messages = await db
      .select({
        id: liveChatMessages.id,
        content: liveChatMessages.content,
        messageType: liveChatMessages.messageType,
        senderId: liveChatMessages.senderId,
        replyToId: liveChatMessages.replyToId,
        editedAt: liveChatMessages.editedAt,
        isDeleted: liveChatMessages.isDeleted,
        createdAt: liveChatMessages.createdAt,
      })
      .from(liveChatMessages)
      .where(
        and(
          eq(liveChatMessages.roomId, roomId),
          eq(liveChatMessages.isDeleted, false)
        )
      )
      .orderBy(desc(liveChatMessages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get read status for each message
    const messagesWithReadStatus = await Promise.all(
      messages.map(async (message) => {
        const readBy = await db
          .select({ userId: liveChatMessageReadStatus.userId })
          .from(liveChatMessageReadStatus)
          .where(eq(liveChatMessageReadStatus.messageId, message.id));

        return {
          ...message,
          readBy: readBy.map(r => r.userId),
          sender: {
            firstName: `User`,
            lastName: `${message.senderId}`,
            email: `user${message.senderId}@example.com`,
          },
          isRead: readBy.some(r => r.userId === userId),
        };
      })
    );

    res.json(messagesWithReadStatus.reverse())
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
router.post('/clubs/:clubId/chat-rooms/:roomId/messages', isAuthenticated, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const roomId = parseInt(req.params.roomId);
    const userId = req.user!.id;

    // Verify user is participant in this room
    const participation = await db
      .select()
      .from(chatRoomParticipants)
      .where(
        and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.userId, userId),
          eq(chatRoomParticipants.isActive, true)
        )
      )
      .limit(1);

    if (participation.length === 0) {
      return res.status(403).json({ error: 'Not authorized to send messages' });
    }

    const messageData = {
      roomId,
      senderId: userId,
      content: req.body.content,
      messageType: req.body.messageType || 'text',
    };

    const [newMessage] = await db
      .insert(liveChatMessages)
      .values(messageData)
      .returning();

    // Update room's lastActivity timestamp
    await db
      .update(chatRooms)
      .set({ lastActivity: new Date(), updatedAt: new Date() })
      .where(eq(chatRooms.id, roomId));

    // Mark message as read by sender
    await db.insert(liveChatMessageReadStatus).values({
      messageId: newMessage.id,
      userId,
    });

    res.status(201).json({
      ...newMessage,
      sender: {
        firstName: `User`,
        lastName: `${userId}`,
        email: `user${userId}@example.com`,
      },
      isRead: true,
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
router.post('/clubs/:clubId/chat-rooms/:roomId/messages/mark-read', isAuthenticated, async (req, res) => {
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
      .from(chatRoomParticipants)
      .where(
        and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.userId, userId),
          eq(chatRoomParticipants.isActive, true)
        )
      )
      .limit(1);

    if (participation.length === 0) {
      return res.status(403).json({ error: 'Not authorized for this chat room' });
    }

    // Insert read status for unread messages
    const readStatusValues = messageIds.map((messageId: number) => ({
      messageId,
      userId,
    }));

    await db
      .insert(liveChatMessageReadStatus)
      .values(readStatusValues)
      .onConflictDoNothing();

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message count for user across all rooms
router.get('/clubs/:clubId/chat-unread-count', isAuthenticated, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user!.id;

    const unreadCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(liveChatMessages)
      .innerJoin(chatRooms, eq(liveChatMessages.roomId, chatRooms.id))
      .innerJoin(chatRoomParticipants, eq(chatRooms.id, chatRoomParticipants.roomId))
      .leftJoin(
        liveChatMessageReadStatus,
        and(
          eq(liveChatMessageReadStatus.messageId, liveChatMessages.id),
          eq(liveChatMessageReadStatus.userId, userId)
        )
      )
      .where(
        and(
          eq(chatRooms.clubId, clubId),
          eq(chatRoomParticipants.userId, userId),
          eq(chatRoomParticipants.isActive, true),
          eq(liveChatMessages.isDeleted, false),
          sql`${liveChatMessageReadStatus.userId} IS NULL`
        )
      );

    res.json(unreadCount[0]?.count || 0);
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start video call session
router.post('/clubs/:clubId/chat-rooms/:roomId/video-call', isAuthenticated, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const userId = req.user!.id;

    // Generate unique session ID
    const sessionId = `call_${roomId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Video call feature placeholder - not fully implemented yet
    const videoCall = {
      id: Date.now(),
      roomId,
      initiatorId: userId,
      sessionId,
      status: 'waiting',
      participants: [userId],
    };

    // Send system message about video call (commented out - video calls not fully implemented)
    /* await db.insert(liveChatMessages).values({
      roomId: roomId,
      senderId: userId,
      content: `Video-Anruf gestartet: ${sessionId}`,
      messageType: 'system',
    }); */

    res.status(201).json(videoCall);
  } catch (error) {
    console.error('Error starting video call:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;