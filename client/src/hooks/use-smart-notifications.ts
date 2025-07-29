import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useClub } from '@/hooks/use-club';
import { useNotifications } from '@/hooks/use-notifications';

interface NotificationEvent {
  id: string;
  type: 'message' | 'announcement' | 'event' | 'payment' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
}

// Hook for automatic smart notifications based on data changes
export function useSmartNotifications() {
  const { selectedClub } = useClub();
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();
  
  // Track the previous club ID to detect actual club switches
  const prevClubIdRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);

  // Monitor new messages
  const { data: messages = [], dataUpdatedAt: messagesUpdatedAt } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'messages'],
    enabled: !!selectedClub?.id,
    staleTime: 30 * 1000, // Check every 30 seconds
    refetchInterval: 30 * 1000,
  });

  // Monitor new notifications  
  const { data: notifications = [], dataUpdatedAt: notificationsUpdatedAt } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'notifications'],
    enabled: !!selectedClub?.id,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  // Monitor communication stats for changes
  const { data: stats, dataUpdatedAt: statsUpdatedAt } = useQuery<{
    totalMessages: number;
    unreadMessages: number;
    totalAnnouncements: number;
    unreadNotifications: number;
    recentActivity: number;
  }>({
    queryKey: ['/api/clubs', selectedClub?.id, 'communication-stats'],
    enabled: !!selectedClub?.id,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  // Track previous values to detect changes
  useEffect(() => {
    if (!selectedClub?.id || !stats) return;

    const previousStats = queryClient.getQueryData(['/api/clubs', selectedClub.id, 'communication-stats-previous']);
    
    if (previousStats) {
      const prevStats = previousStats as typeof stats;
      
      // Check for new messages
      if (stats.unreadMessages > prevStats.unreadMessages) {
        const newMessageCount = stats.unreadMessages - prevStats.unreadMessages;
        showNotification({
          title: 'Neue Nachricht(en)',
          message: `Sie haben ${newMessageCount} neue Nachricht${newMessageCount > 1 ? 'en' : ''} erhalten`,
          type: 'info',
          priority: 'normal',
          actionUrl: '/communication',
          actionLabel: 'Ansehen'
        });
      }

      // Check for new announcements/notifications
      if (stats.unreadNotifications > prevStats.unreadNotifications) {
        const newNotificationCount = stats.unreadNotifications - prevStats.unreadNotifications;
        showNotification({
          title: 'Neue Ankündigung(en)',
          message: `${newNotificationCount} neue Ankündigung${newNotificationCount > 1 ? 'en' : ''} verfügbar`,
          type: 'info',
          priority: 'high',
          actionUrl: '/communication?tab=announcements',
          actionLabel: 'Ansehen'
        });
      }

      // Check for increased activity
      if (stats.recentActivity > prevStats.recentActivity && stats.recentActivity > 5) {
        showNotification({
          title: 'Erhöhte Vereinsaktivität',
          message: 'Viele neue Aktivitäten in Ihrem Verein',
          type: 'info',
          priority: 'low',
          actionUrl: '/dashboard'
        });
      }
    }

    // Store current stats for next comparison
    queryClient.setQueryData(['/api/clubs', selectedClub.id, 'communication-stats-previous'], stats);
  }, [stats, selectedClub?.id, showNotification, queryClient]);

  // Monitor individual notifications for real-time alerts
  useEffect(() => {
    if (!notifications.length) return;

    // Find notifications created in the last minute that aren't read
    const recentNotifications = notifications.filter(notification => {
      const createdAt = new Date(notification.createdAt);
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      return createdAt > oneMinuteAgo && !notification.isRead;
    });

    recentNotifications.forEach(notification => {
      showNotification({
        title: notification.title || 'Neue Benachrichtigung',
        message: notification.message || 'Eine neue Benachrichtigung ist verfügbar',
        type: notification.type === 'error' ? 'error' : 'info',
        priority: notification.priority || 'normal',
        actionUrl: notification.actionUrl || '/communication',
        actionLabel: 'Details ansehen'
      });
    });
  }, [notifications, showNotification]);

  // System health monitoring
  useEffect(() => {
    const handleOnline = () => {
      showNotification({
        title: 'Verbindung wiederhergestellt',
        message: 'Sie sind wieder online und alle Daten werden synchronisiert',
        type: 'success',
        priority: 'normal'
      });
    };

    const handleOffline = () => {
      showNotification({
        title: 'Verbindung unterbrochen',
        message: 'Sie sind offline. Einige Funktionen sind möglicherweise nicht verfügbar',
        type: 'warning',
        priority: 'high',
        persistent: true
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showNotification]);

  // Club switching notifications - only trigger on actual club changes
  useEffect(() => {
    if (!selectedClub?.id) return;

    console.log('🔔 Club switch check:', {
      currentClubId: selectedClub.id,
      previousClubId: prevClubIdRef.current,
      hasInitialized: hasInitializedRef.current,
      clubName: selectedClub.name
    });

    // On first load, just store the current club ID without showing notification
    if (!hasInitializedRef.current) {
      prevClubIdRef.current = selectedClub.id;
      hasInitializedRef.current = true;
      console.log('🔔 First load - no notification');
      return;
    }

    // Only show notification if the club ID actually changed
    if (prevClubIdRef.current !== null && prevClubIdRef.current !== selectedClub.id) {
      console.log('🔔 Club actually changed - showing notification');
      showNotification({
        title: `Verein gewechselt`,
        message: `Sie haben zu "${selectedClub.name}" gewechselt`,
        type: 'info',
        priority: 'low'
      });
    } else {
      console.log('🔔 Same club - no notification needed');
    }

    // Update the previous club ID
    prevClubIdRef.current = selectedClub.id;
  }, [selectedClub?.id, selectedClub?.name, showNotification]);

  return {
    // Manually trigger specific notifications
    notifyNewMessage: (count: number = 1) => {
      showNotification({
        title: 'Neue Nachricht(en)',
        message: `Sie haben ${count} neue Nachricht${count > 1 ? 'en' : ''} erhalten`,
        type: 'info',
        priority: 'normal',
        actionUrl: '/communication'
      });
    },

    notifyPaymentDue: (amount: string, dueDate: string) => {
      showNotification({
        title: 'Zahlung fällig',
        message: `${amount} € bis ${dueDate} fällig`,
        type: 'warning',
        priority: 'critical',
        persistent: true,
        actionUrl: '/finances'
      });
    },

    notifyEventReminder: (eventName: string, time: string) => {
      showNotification({
        title: 'Termin-Erinnerung',
        message: `"${eventName}" beginnt ${time}`,
        type: 'info',
        priority: 'high',
        actionUrl: '/calendar'
      });
    },

    notifySystemMaintenance: (scheduledTime: string) => {
      showNotification({
        title: 'Wartung geplant',
        message: `Systemwartung am ${scheduledTime}. Kurze Unterbrechungen möglich`,
        type: 'warning',
        priority: 'high',
        persistent: true
      });
    }
  };
}