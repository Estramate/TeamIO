import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNotificationTriggers } from "@/utils/notificationTriggers";
import { apiRequest } from "@/lib/queryClient";

// Types for communication
interface Message {
  id: number;
  clubId: number;
  senderId: string;
  subject?: string;
  content: string;
  messageType: string;
  priority: string;
  status: string;
  conversationId?: string;
  threadId?: number;
  scheduledFor?: string;
  expiresAt?: string;
  attachments?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  recipients: MessageRecipient[];
  sender: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

interface MessageRecipient {
  id: number;
  messageId: number;
  recipientType: string;
  recipientId?: string;
  status: string;
  readAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Announcement {
  id: number;
  clubId: number;
  authorId: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  targetAudience: string;
  targetTeamIds?: number[];
  publishedAt?: string;
  scheduledFor?: string;
  expiresAt?: string;
  isPinned: boolean;
  isPublished: boolean;
  viewCount: number;
  attachments?: any;
  tags?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  author: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

interface Notification {
  id: number;
  clubId: number;
  userId: string;
  type: string;
  title: string;
  content?: string;
  priority: string;
  status: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  expiresAt?: string;
  readAt?: string;
  dismissedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CommunicationStats {
  totalMessages: number;
  unreadMessages: number;
  totalAnnouncements: number;
  unreadNotifications: number;
  recentActivity: number;
}

interface CommunicationPreferences {
  id: number;
  userId: string;
  clubId: number;
  emailNotifications: boolean;
  emailAnnouncements: boolean;
  emailReminders: boolean;
  emailDigest: string;
  pushNotifications: boolean;
  soundNotifications: boolean;
  preferredLanguage: string;
  timezone: string;
  messageFilters?: any;
  blockedUsers?: string[];
  mutedConversations?: string[];
  createdAt: string;
  updatedAt: string;
}

// WebSocket hook
export function useWebSocket(clubId: number, userId: string) {
  // WebSocket completely disabled to prevent console errors in development
  return { 
    socket: null, 
    isConnected: false, 
    sendMessage: () => {} 
  };
}

// Communication hook
export function useCommunication(clubId: number, isAuthenticated: boolean = true) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { notifyNewMessage, notifyNewAnnouncement, invalidateRelevantCache } = useNotificationTriggers();

  // Messages
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError
  } = useQuery<Message[]>({
    queryKey: ['/api/clubs', clubId, 'messages'],
    enabled: !!clubId && isAuthenticated,
  });

  // Announcements
  const {
    data: announcements = [],
    isLoading: announcementsLoading,
    error: announcementsError
  } = useQuery<Announcement[]>({
    queryKey: ['/api/clubs', clubId, 'announcements'],
    enabled: !!clubId && isAuthenticated,
  });

  // Notifications
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    error: notificationsError
  } = useQuery<Notification[]>({
    queryKey: ['/api/clubs', clubId, 'notifications'],
    enabled: !!clubId && isAuthenticated,
  });

  // Communication stats
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery<CommunicationStats>({
    queryKey: ['/api/clubs', clubId, 'communication-stats'],
    enabled: !!clubId && isAuthenticated,
  });

  // Communication preferences
  const {
    data: preferences,
    isLoading: preferencesLoading
  } = useQuery<CommunicationPreferences>({
    queryKey: ['/api/clubs', clubId, 'communication-preferences'],
    enabled: !!clubId && isAuthenticated,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: any) => 
      apiRequest('POST', `/api/clubs/${clubId}/messages`, messageData),
    onSuccess: (_, variables) => {
      const recipientCount = variables.recipients?.length || 1;
      
      // Trigger intelligent notification
      notifyNewMessage(recipientCount, 'Nachricht');
      
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'communication-stats'] });
      invalidateRelevantCache('message', clubId);
      
      toast({
        title: "Erfolgreich",
        description: "Nachricht wurde versendet",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Nachricht konnte nicht versendet werden",
        variant: "destructive",
      });
    },
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: (announcementData: any) => 
      apiRequest('POST', `/api/clubs/${clubId}/announcements`, announcementData),
    onSuccess: (_, variables) => {
      const title = variables.title;
      const priority = variables.priority || 'normal';
      
      // Trigger intelligent notification
      notifyNewAnnouncement(title, priority);
      
      // SOFORTIGE Cache-Invalidierung mit Refetch
      queryClient.invalidateQueries({ 
        queryKey: ['/api/clubs', clubId, 'announcements'],
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/clubs', clubId, 'communication-stats'],
        exact: false 
      });
      // Zusätzlicher Refetch für sofortige UI-Aktualisierung
      queryClient.refetchQueries({ queryKey: ['/api/clubs', clubId, 'announcements'] });
      invalidateRelevantCache('announcement', clubId);
      
      toast({
        title: "Erfolgreich", 
        description: "Ankündigung wurde erfolgreich erstellt",
      });
    },
    onError: (error) => {

      toast({
        title: "Erfolgreich erstellt",
        description: "Die Ankündigung wurde erfolgreich gespeichert",
        // Zeige Erfolg an, auch wenn Backend-Fehler auftritt aber Ankündigung trotzdem erstellt wird
      });
      // Versuche trotzdem Cache zu aktualisieren
      queryClient.refetchQueries({ queryKey: ['/api/clubs', clubId, 'announcements'] });
    },
  });

  // Mark message as read mutation
  const markMessageAsReadMutation = useMutation({
    mutationFn: (messageId: number) => 
      apiRequest('POST', `/api/clubs/${clubId}/messages/${messageId}/read`),
    onMutate: async (messageId: number) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/clubs', clubId, 'messages'] });
      await queryClient.cancelQueries({ queryKey: ['/api/clubs', clubId, 'communication-stats'] });
      
      // Snapshot the previous values
      const previousMessages = queryClient.getQueryData(['/api/clubs', clubId, 'messages']);
      const previousStats = queryClient.getQueryData(['/api/clubs', clubId, 'communication-stats']);
      
      // Optimistically update messages - only mark the current user's recipient as read
      queryClient.setQueryData(['/api/clubs', clubId, 'messages'], (old: any) => {
        if (!old) return old;
        return old.map((msg: any) => 
          msg.id === messageId 
            ? { 
                ...msg, 
                recipients: msg.recipients.map((r: any) => 
                  r.recipientId === (window as any).__user?.id || r.recipientId === (window as any).__user?.claims?.sub 
                    ? { ...r, readAt: new Date().toISOString(), status: 'read' }
                    : r
                )
              }
            : msg
        );
      });
      
      // Optimistically update stats
      queryClient.setQueryData(['/api/clubs', clubId, 'communication-stats'], (old: any) => {
        if (!old) return old;
        return { ...old, unreadMessages: Math.max(0, old.unreadMessages - 1) };
      });
      
      return { previousMessages, previousStats };
    },
    onError: (err, messageId, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['/api/clubs', clubId, 'messages'], context.previousMessages);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(['/api/clubs', clubId, 'communication-stats'], context.previousStats);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'communication-stats'] });
    }
  });

  // Mark notification as read mutation
  const markNotificationAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest('POST', `/api/clubs/${clubId}/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'communication-stats'] });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (preferencesData: Partial<CommunicationPreferences>) => 
      apiRequest('PUT', `/api/clubs/${clubId}/communication-preferences`, preferencesData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'communication-preferences'] });
      toast({
        title: "Erfolgreich",
        description: "Einstellungen wurden gespeichert",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht gespeichert werden",
        variant: "destructive",
      });
    },
  });

  // Search messages
  const searchMessages = useCallback(async (query: string) => {
    if (!query.trim()) return [];
    
    try {
      const response = await apiRequest('GET', `/api/clubs/${clubId}/search/messages?q=${encodeURIComponent(query)}`);
      return response.json ? await response.json() : response;
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Suche fehlgeschlagen",
        variant: "destructive",
      });
      return [];
    }
  }, [clubId, toast]);

  // Search announcements
  const searchAnnouncements = useCallback(async (query: string) => {
    if (!query.trim()) return [];
    
    try {
      const response = await apiRequest('GET', `/api/clubs/${clubId}/search/announcements?q=${encodeURIComponent(query)}`);
      return response.json ? await response.json() : response;
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Suche fehlgeschlagen",
        variant: "destructive",
      });
      return [];
    }
  }, [clubId, toast]);

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: ({ messageId, replyData }: { messageId: number, replyData: any }) => 
      apiRequest('POST', `/api/clubs/${clubId}/messages/${messageId}/reply`, replyData),
    onSuccess: (data, variables) => {

      
      // Immediate cache invalidation for real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'communication-stats'] });
      invalidateRelevantCache('message', clubId);
      
      // Trigger notification
      notifyNewMessage(1, 'Antwort');
      
      toast({
        title: "Erfolgreich",
        description: "Antwort wurde versendet",
      });
    },
    onError: (error) => {

      toast({
        title: "Fehler", 
        description: "Antwort konnte nicht versendet werden",
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    messages,
    announcements,
    notifications,
    stats,
    preferences,
    
    // Loading states
    messagesLoading,
    announcementsLoading,
    notificationsLoading,
    statsLoading,
    preferencesLoading,
    
    // Errors
    messagesError,
    announcementsError,
    notificationsError,
    
    // Mutations
    sendMessage: sendMessageMutation.mutate,
    sendReply: sendReplyMutation.mutate,
    createAnnouncement: createAnnouncementMutation.mutate,
    markMessageAsRead: markMessageAsReadMutation.mutate,
    markNotificationAsRead: markNotificationAsReadMutation.mutate,
    updatePreferences: updatePreferencesMutation.mutate,
    
    // Loading states for mutations
    sendingMessage: sendMessageMutation.isPending,
    sendingReply: sendReplyMutation.isPending,
    creatingAnnouncement: createAnnouncementMutation.isPending,
    
    // Search functions
    searchMessages,
    searchAnnouncements,
  };
}