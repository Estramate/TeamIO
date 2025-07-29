import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClub } from '@/hooks/use-club';

/**
 * Smart Refresh Hook - Intelligente, unsichtbare Datenaktualisierung
 * Aktualisiert Daten im Hintergrund ohne UI-Störungen
 */
export function useSmartRefresh() {
  const queryClient = useQueryClient();
  const { selectedClub } = useClub();

  // DEAKTIVIERTE Cache-Aktualisierung - keine automatischen Refreshs mehr
  const refreshAfterAction = (entityType: 'message' | 'notification' | 'communication' | 'chat') => {
    // VOLLSTÄNDIG DEAKTIVIERT - Keine automatischen Background-Refreshs nach Chat-Entfernung
    console.debug(`Smart refresh für ${entityType} übersprungen - System deaktiviert um Tab-Störungen zu vermeiden`);
    return;
  };

  // Page Visibility API - DEAKTIVIERT um Tab-Störungen zu vermeiden
  useEffect(() => {
    // VOLLSTÄNDIG DEAKTIVIERT - Keine automatischen Page Visibility Refreshs
    console.debug('Page Visibility Refresh deaktiviert - verhindert Tab-Störungen');
  }, [selectedClub?.id]);

  // Connection Status - Refresh bei Netzwerk-Wiederherstellung
  useEffect(() => {
    const handleOnline = () => {
      if (selectedClub?.id) {
        // Vollständiger stiller Refresh nach Netzwerk-Wiederherstellung
        refreshAfterAction('communication');
        refreshAfterAction('notification');
        refreshAfterAction('chat');
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [selectedClub?.id]);

  return {
    refreshAfterAction,
    refreshAll: () => {
      refreshAfterAction('communication');
      refreshAfterAction('notification');
      refreshAfterAction('chat');
    }
  };
}