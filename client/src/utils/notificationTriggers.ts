import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

/**
 * Smart Notification Triggers für wichtige Vereinsaktionen
 * NUR VISUELLE BENACHRICHTIGUNGEN - Sound komplett deaktiviert auf Benutzerwunsch
 */

export function useNotificationTriggers() {
  const queryClient = useQueryClient();

  // Neue Mitteilung versendet - NUR VISUELLE BENACHRICHTIGUNG OHNE SOUND
  const notifyNewMessage = (recipientCount: number, messageType: string = 'Nachricht') => {
    toast({
      title: `${messageType} versendet`,
      description: `Neue ${messageType.toLowerCase()} an ${recipientCount} Empfänger gesendet`,
      variant: 'default',
    });
  };

  // Neue Ankündigung erstellt - NUR VISUELLE BENACHRICHTIGUNG OHNE SOUND
  const notifyNewAnnouncement = (title: string, priority: string) => {
    toast({
      title: 'Ankündigung erstellt',
      description: `"${title}" wurde erfolgreich veröffentlicht`,
      variant: 'default',
    });
  };

  // Mitglied hinzugefügt - NUR VISUELLE BENACHRICHTIGUNG OHNE SOUND
  const notifyMemberAdded = (memberName: string, teamName?: string) => {
    const message = teamName 
      ? `${memberName} wurde zu Team "${teamName}" hinzugefügt`
      : `${memberName} wurde als neues Mitglied hinzugefügt`;
    
    toast({
      title: 'Mitglied hinzugefügt',
      description: message,
      variant: 'default',
    });
  };

  // Team erstellt - NUR VISUELLE BENACHRICHTIGUNG OHNE SOUND
  const notifyTeamCreated = (teamName: string, playerCount: number) => {
    toast({
      title: 'Team erstellt',
      description: `Team "${teamName}" mit ${playerCount} Spielern erstellt`,
      variant: 'default',
    });
  };

  // Finanz-Transaktion - NUR VISUELLE BENACHRICHTIGUNG OHNE SOUND
  const notifyFinanceTransaction = (amount: number, type: 'Einnahme' | 'Ausgabe', description?: string) => {
    toast({
      title: `${type} verbucht`,
      description: `${type}: €${amount}${description ? ` - ${description}` : ''}`,
      variant: 'default',
    });
  };

  // Buchung erstellt - NUR VISUELLE BENACHRICHTIGUNG OHNE SOUND
  const notifyBookingCreated = (facilityName: string, date: string) => {
    toast({
      title: 'Buchung erstellt',
      description: `${facilityName} für ${date} gebucht`,
      variant: 'default',
    });
  };

  // Cache invalidation - Hintergrund-Funktionalität ohne UI-Störung
  const invalidateRelevantCache = (keys: string[]) => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  return {
    notifyNewMessage,
    notifyNewAnnouncement,
    notifyMemberAdded,
    notifyTeamCreated,
    notifyFinanceTransaction,
    notifyBookingCreated,
    invalidateRelevantCache,
  };
}