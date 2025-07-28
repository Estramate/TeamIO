import { Router } from 'express';
import { z } from 'zod';
import { isAuthenticated } from './middleware/auth';
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

// Helper function to get user ID from request
const getUserId = (req: any): string => {
  return req.user?.claims?.sub || req.user?.id || req.session?.passport?.user?.id || req.session?.user?.id;
};

// Get all chat rooms for a club
router.get('/clubs/:clubId/chat-rooms', isAuthenticated, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

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
        const lastMessages = await db
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
              eq(liveChatMessages.id, liveChatMessageReadStatus.messageId),
              eq(liveChatMessageReadStatus.userId, userId)
            )
          )
          .where(
            and(
              eq(liveChatMessages.roomId, room.id),
              eq(liveChatMessages.isDeleted, false),
              sql`${liveChatMessageReadStatus.messageId} IS NULL`
            )
          );

        return {
          ...room,
          participants,
          lastMessage: lastMessages[0] || null,
          unreadCount: unreadCount[0]?.count || 0,
        };
      })
    );

    res.json(roomsWithDetails);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get messages for a specific room
router.get('/clubs/:clubId/chat-rooms/:roomId/messages', isAuthenticated, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const roomId = parseInt(req.params.roomId);
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Verify user has access to this room
    const participant = await db
      .select()
      .from(chatRoomParticipants)
      .innerJoin(chatRooms, eq(chatRoomParticipants.roomId, chatRooms.id))
      .where(
        and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.userId, userId),
          eq(chatRooms.clubId, clubId),
          eq(chatRoomParticipants.isActive, true)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }

    // Get messages
    const messages = await db
      .select({
        id: liveChatMessages.id,
        senderId: liveChatMessages.senderId,
        content: liveChatMessages.content,
        messageType: liveChatMessages.messageType,
        attachmentUrl: liveChatMessages.attachmentUrl,
        replyToId: liveChatMessages.replyToId,
        isEdited: liveChatMessages.isEdited,
        createdAt: liveChatMessages.createdAt,
        updatedAt: liveChatMessages.updatedAt,
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

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send a message
router.post('/clubs/:clubId/chat-rooms/:roomId/messages', isAuthenticated, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const roomId = parseInt(req.params.roomId);
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const { content, messageType = 'text', replyToId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Verify user has access to this room
    const participant = await db
      .select()
      .from(chatRoomParticipants)
      .innerJoin(chatRooms, eq(chatRoomParticipants.roomId, chatRooms.id))
      .where(
        and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.userId, userId),
          eq(chatRooms.clubId, clubId),
          eq(chatRoomParticipants.isActive, true)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }

    // Insert message
    const newMessage = await db
      .insert(liveChatMessages)
      .values({
        roomId,
        senderId: userId,
        content: content.trim(),
        messageType,
        replyToId: replyToId || null,
      })
      .returning();

    // Update room's updated_at timestamp
    await db
      .update(chatRooms)
      .set({ updatedAt: new Date() })
      .where(eq(chatRooms.id, roomId));

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get unread message count for all rooms in a club
router.get('/clubs/:clubId/chat-unread-count', isAuthenticated, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    // Get all rooms user participates in
    const userRooms = await db
      .select({ roomId: chatRoomParticipants.roomId })
      .from(chatRoomParticipants)
      .innerJoin(chatRooms, eq(chatRoomParticipants.roomId, chatRooms.id))
      .where(
        and(
          eq(chatRoomParticipants.userId, userId),
          eq(chatRooms.clubId, clubId),
          eq(chatRoomParticipants.isActive, true),
          eq(chatRooms.isActive, true)
        )
      );

    if (userRooms.length === 0) {
      return res.json(0);
    }

    const roomIds = userRooms.map(r => r.roomId);

    // Count unread messages across all rooms
    const unreadCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(liveChatMessages)
      .leftJoin(
        liveChatMessageReadStatus,
        and(
          eq(liveChatMessages.id, liveChatMessageReadStatus.messageId),
          eq(liveChatMessageReadStatus.userId, userId)
        )
      )
      .where(
        and(
          inArray(liveChatMessages.roomId, roomIds),
          eq(liveChatMessages.isDeleted, false),
          sql`${liveChatMessageReadStatus.messageId} IS NULL`
        )
      );

    res.json(unreadCount[0]?.count || 0);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new chat room
router.post('/clubs/:clubId/chat-rooms', isAuthenticated, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const { name, type = 'group', description, participantUserIds = [] } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    // Create the room
    const newRoom = await db
      .insert(chatRooms)
      .values({
        clubId,
        name: name.trim(),
        type,
        description: description || null,
        createdBy: userId,
      })
      .returning();

    const roomId = newRoom[0].id;

    // Add creator as participant
    await db
      .insert(chatRoomParticipants)
      .values({
        roomId,
        userId,
      });

    // Add other participants if provided
    if (participantUserIds.length > 0) {
      const participantValues = participantUserIds
        .filter((id: string) => id !== userId) // Don't add creator twice
        .map((id: string) => ({
          roomId,
          userId: id,
        }));

      if (participantValues.length > 0) {
        await db
          .insert(chatRoomParticipants)
          .values(participantValues);
      }
    }

    res.status(201).json(newRoom[0]);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark messages as read
router.post('/clubs/:clubId/chat-rooms/:roomId/mark-read', isAuthenticated, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const roomId = parseInt(req.params.roomId);
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    // Verify user has access to this room
    const participant = await db
      .select()
      .from(chatRoomParticipants)
      .innerJoin(chatRooms, eq(chatRoomParticipants.roomId, chatRooms.id))
      .where(
        and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.userId, userId),
          eq(chatRooms.clubId, clubId),
          eq(chatRoomParticipants.isActive, true)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }

    // Get all unread messages for this user in this room
    const unreadMessages = await db
      .select({ id: liveChatMessages.id })
      .from(liveChatMessages)
      .leftJoin(
        liveChatMessageReadStatus,
        and(
          eq(liveChatMessages.id, liveChatMessageReadStatus.messageId),
          eq(liveChatMessageReadStatus.userId, userId)
        )
      )
      .where(
        and(
          eq(liveChatMessages.roomId, roomId),
          eq(liveChatMessages.isDeleted, false),
          sql`${liveChatMessageReadStatus.messageId} IS NULL`
        )
      );

    // Mark messages as read
    if (unreadMessages.length > 0) {
      const readStatusValues = unreadMessages.map(msg => ({
        messageId: msg.id,
        userId,
        readAt: new Date(),
      }));

      await db
        .insert(liveChatMessageReadStatus)
        .values(readStatusValues)
        .onConflictDoNothing();
    }

    // Update participant's last read timestamp
    await db
      .update(chatRoomParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.userId, userId)
        )
      );

    res.json({ success: true, markedCount: unreadMessages.length });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;