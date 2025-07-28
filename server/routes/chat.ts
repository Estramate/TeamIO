import { Router } from 'express';
import { requiresAuth, requiresClubMembership } from '../middleware/auth';
import { storage } from '../storage';

const router = Router();

// Chat rooms for a club
router.get('/clubs/:clubId/chat-rooms', requiresAuth, requiresClubMembership, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user!.id;

    // Get all chat rooms where user is a participant
    const rooms = await storage.getChatRooms(clubId, userId);
    
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

// Create a new chat room
router.post('/clubs/:clubId/chat-rooms', requiresAuth, requiresClubMembership, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user!.id;
    const { name, type, participantIds } = req.body;

    const room = await storage.createChatRoom({
      clubId,
      name,
      type,
      createdBy: userId,
      participantIds: [...participantIds, userId], // Include creator
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
});

// Get messages for a chat room
router.get('/clubs/:clubId/chat-rooms/:roomId/messages', requiresAuth, requiresClubMembership, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const roomId = parseInt(req.params.roomId);
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Verify user has access to this room
    const hasAccess = await storage.userHasRoomAccess(roomId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this chat room' });
    }

    const messages = await storage.getChatMessages(roomId, limit, offset);
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message to a chat room
router.post('/clubs/:clubId/chat-rooms/:roomId/messages', requiresAuth, requiresClubMembership, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const roomId = parseInt(req.params.roomId);
    const userId = req.user!.id;
    const { content, messageType = 'text', replyTo } = req.body;

    // Verify user has access to this room
    const hasAccess = await storage.userHasRoomAccess(roomId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this chat room' });
    }

    const message = await storage.createChatMessage({
      roomId,
      senderId: userId,
      content,
      messageType,
      replyTo,
    });

    // Update room's last message and timestamp
    await storage.updateRoomLastMessage(roomId, message.id);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read in a room
router.post('/clubs/:clubId/chat-rooms/:roomId/mark-read', requiresAuth, requiresClubMembership, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const userId = req.user!.id;

    // Verify user has access to this room
    const hasAccess = await storage.userHasRoomAccess(roomId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this chat room' });
    }

    await storage.markMessagesAsRead(roomId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get online users for a club
router.get('/clubs/:clubId/online-users', requiresAuth, requiresClubMembership, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    
    // Get users who were active in the last 5 minutes
    const onlineUsers = await storage.getOnlineUsers(clubId);
    
    res.json(onlineUsers);
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

// Update user's last seen timestamp
router.post('/clubs/:clubId/update-activity', requiresAuth, requiresClubMembership, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user!.id;

    await storage.updateUserActivity(clubId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Delete a message (only sender or admin)
router.delete('/clubs/:clubId/chat-rooms/:roomId/messages/:messageId', requiresAuth, requiresClubMembership, async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const userId = req.user!.id;

    // Check if user can delete this message (sender or admin)
    const canDelete = await storage.canDeleteMessage(messageId, userId);
    if (!canDelete) {
      return res.status(403).json({ error: 'Cannot delete this message' });
    }

    await storage.deleteChatMessage(messageId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Get unread count for all rooms
router.get('/clubs/:clubId/chat-unread-count', requiresAuth, requiresClubMembership, async (req, res) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const userId = req.user!.id;

    const unreadCount = await storage.getTotalUnreadCount(clubId, userId);
    
    res.json(unreadCount);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

export default router;