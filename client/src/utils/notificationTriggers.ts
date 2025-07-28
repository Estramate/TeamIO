import { useSmartNotifications } from '@/hooks/use-smart-notifications';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Smart Notification Triggers for wichtige Vereinsaktionen
 * Automatische Benachrichtigungen bei wichtigen Events
 */

export interface NotificationTriggerConfig {
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  priority: 'low' | 'normal' | 'high' | 'critical';
  sound?: boolean;
  desktop?: boolean;
  persistent?: boolean;
}

export function useNotificationTriggers() {
  const { triggerNotification, triggerSound } = useSmartNotifications();
  const queryClient = useQueryClient();

  // Neue Mitteilung versendet
  const notifyNewMessage = (recipientCount: number, messageType: string = 'Nachricht') => {
    const config: NotificationTriggerConfig = {
      title: `${messageType} versendet`,
      message: `Neue ${messageType.toLowerCase()} an ${recipientCount} Empfänger gesendet`,
      type: 'success',
      priority: 'normal',
      sound: true,
      desktop: true
    };
    
    triggerNotification(config.title, config.message, {
      type: config.type,
      priority: config.priority,
      persistent: false
    });
    
    if (config.sound) {
      triggerSound('normal');
    }
  };

  // Neue Ankündigung erstellt
  const notifyNewAnnouncement = (title: string, priority: string) => {
    const soundLevel = priority === 'urgent' ? 'high' : 'normal';
    
    const config: NotificationTriggerConfig = {
      title: 'Ankündigung veröffentlicht',
      message: `"${title}" wurde erfolgreich veröffentlicht`,
      type: 'success',
      priority: priority === 'urgent' ? 'high' : 'normal',
      sound: true,
      desktop: true
    };
    
    triggerNotification(config.title, config.message, {
      type: config.type,
      priority: config.priority,
      persistent: priority === 'urgent'
    });
    
    triggerSound(soundLevel as any);
  };

  // Neue Buchung erstellt
  const notifyNewBooking = (facilityName: string, date: string, memberName?: string) => {
    const config: NotificationTriggerConfig = {
      title: 'Buchung bestätigt',
      message: `${facilityName} für ${date}${memberName ? ` (${memberName})` : ''} gebucht`,
      type: 'success',
      priority: 'normal',
      sound: true,
      desktop: true
    };
    
    triggerNotification(config.title, config.message, {
      type: config.type,
      priority: config.priority
    });
    
    triggerSound('normal');
  };

  // Neues Mitglied hinzugefügt
  const notifyNewMember = (memberName: string, role?: string) => {
    const config: NotificationTriggerConfig = {
      title: 'Neues Mitglied',
      message: `${memberName}${role ? ` als ${role}` : ''} wurde hinzugefügt`,
      type: 'success',
      priority: 'normal',
      sound: true,
      desktop: true
    };
    
    triggerNotification(config.title, config.message, {
      type: config.type,
      priority: config.priority
    });
    
    triggerSound('normal');
  };

  // Mitgliedschaft genehmigt
  const notifyMembershipApproved = (memberName: string) => {
    const config: NotificationTriggerConfig = {
      title: 'Mitgliedschaft genehmigt',
      message: `${memberName} wurde als Vereinsmitglied genehmigt`,
      type: 'success',
      priority: 'high',
      sound: true,
      desktop: true,
      persistent: true
    };
    
    triggerNotification(config.title, config.message, {
      type: config.type,
      priority: config.priority,
      persistent: config.persistent
    });
    
    triggerSound('high');
  };

  // Neuer Spieler registriert
  const notifyNewPlayer = (playerName: string, teamName?: string) => {
    const config: NotificationTriggerConfig = {
      title: 'Spieler registriert',
      message: `${playerName}${teamName ? ` (${teamName})` : ''} wurde registriert`,
      type: 'success',
      priority: 'normal',
      sound: true,
      desktop: true
    };
    
    triggerNotification(config.title, config.message, {
      type: config.type,
      priority: config.priority
    });
    
    triggerSound('normal');
  };

  // Team erstellt/aktualisiert
  const notifyTeamChange = (teamName: string, action: 'erstellt' | 'aktualisiert') => {
    const config: NotificationTriggerConfig = {
      title: `Team ${action}`,
      message: `${teamName} wurde erfolgreich ${action}`,
      type: 'success',
      priority: 'normal',
      sound: true,
      desktop: true
    };
    
    triggerNotification(config.title, config.message, {
      type: config.type,
      priority: config.priority
    });
    
    triggerSound('normal');
  };

  // Finanz-Transaktion
  const notifyFinanceTransaction = (amount: number, type: 'Einnahme' | 'Ausgabe', description?: string) => {
    const config: NotificationTriggerConfig = {
      title: `${type} verbucht`,
      message: `${type}: €${amount}${description ? ` - ${description}` : ''}`,
      type: type === 'Einnahme' ? 'success' : 'info',
      priority: amount > 1000 ? 'high' : 'normal',
      sound: true,
      desktop: true
    };
    
    triggerNotification(config.title, config.message, {
      type: config.type,
      priority: config.priority
    });
    
    triggerSound(amount > 1000 ? 'high' : 'normal');
  };

  // Kritische System-Benachrichtigungen
  const notifySystemCritical = (title: string, message: string) => {
    const config: NotificationTriggerConfig = {
      title: `🚨 ${title}`,
      message,
      type: 'error',
      priority: 'critical',
      sound: true,
      desktop: true,
      persistent: true
    };
    
    triggerNotification(config.title, config.message, {
      type: config.type,
      priority: config.priority,
      persistent: config.persistent
    });
    
    triggerSound('critical');
  };

  // Benutzer-Einladung versendet
  const notifyUserInvitation = (email: string, role: string) => {
    const config: NotificationTriggerConfig = {
      title: 'Einladung versendet',
      message: `Einladung als ${role} an ${email} gesendet`,
      type: 'success',
      priority: 'normal',
      sound: true,
      desktop: true
    };
    
    triggerNotification(config.title, config.message, {
      type: config.type,
      priority: config.priority
    });
    
    triggerSound('normal');
  };

  // Cache-Invalidierung für relevante Daten
  const invalidateRelevantCache = (entityType: string, clubId?: number) => {
    if (entityType === 'member' || entityType === 'player') {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'players'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'dashboard'] });
    }
    
    if (entityType === 'message' || entityType === 'announcement') {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'communication-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'notifications'] });
    }
    
    if (entityType === 'booking') {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'facilities'] });
    }
    
    if (entityType === 'team') {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'dashboard'] });
    }
    
    if (entityType === 'finance') {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'finances'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'dashboard'] });
    }
  };

  return {
    notifyNewMessage,
    notifyNewAnnouncement,
    notifyNewBooking,
    notifyNewMember,
    notifyMembershipApproved,
    notifyNewPlayer,
    notifyTeamChange,
    notifyFinanceTransaction,
    notifySystemCritical,
    notifyUserInvitation,
    invalidateRelevantCache
  };
}

// Export für direkten Import in Komponenten
export const notificationTriggers = {
  newMessage: (recipientCount: number, messageType: string = 'Nachricht') => {
    // Direct trigger ohne Hook für Server-Side oder externe Calls
    if (typeof window !== 'undefined' && window.navigator && 'serviceWorker' in window.navigator) {
      new Notification(`${messageType} versendet`, {
        body: `Neue ${messageType.toLowerCase()} an ${recipientCount} Empfänger gesendet`,
        icon: '/favicon.ico'
      });
    }
  }
};