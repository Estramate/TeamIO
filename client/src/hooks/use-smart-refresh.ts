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

  // Stille Cache-Aktualisierung nach Benutzeraktionen
  const refreshAfterAction = (entityType: 'message' | 'notification' | 'communication' | 'chat') => {
    if (!selectedClub?.id) return;

    // Verwende prefetchQuery statt invalidateQueries für stille Updates
    const silentRefresh = async () => {
      try {
        switch (entityType) {
          case 'message':
          case 'communication':
            await queryClient.prefetchQuery({
              queryKey: ['/api/clubs', selectedClub.id, 'messages'],
              staleTime: 0,
            });
            await queryClient.prefetchQuery({
              queryKey: ['/api/clubs', selectedClub.id, 'communication-stats'],
              staleTime: 0,
            });
            break;
            
          case 'notification':
            await queryClient.prefetchQuery({
              queryKey: ['/api/clubs', selectedClub.id, 'notifications'],
              staleTime: 0,
            });
            break;
            
          case 'chat':
            // Chat-Daten nur prefetchen wenn Chat aktiv ist
            const chatQueries = queryClient.getQueriesData({
              queryKey: [`/api/clubs/${selectedClub.id}/chat`],
            });
            if (chatQueries.length > 0) {
              await queryClient.prefetchQuery({
                queryKey: [`/api/clubs/${selectedClub.id}/chat/rooms`],
                staleTime: 0,
              });
            }
            break;
        }
      } catch (error) {
        // Stille Fehlerbehandlung
        console.debug('Silent refresh error:', error);
      }
    };

    // Verzögerter Refresh um Race Conditions zu vermeiden
    setTimeout(silentRefresh, 1000);
  };

  // Page Visibility API - Refresh wenn Tab wieder aktiv wird
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedClub?.id) {
        // Stiller Refresh aller wichtigen Daten wenn Tab wieder fokussiert wird
        setTimeout(() => {
          refreshAfterAction('communication');
          refreshAfterAction('notification');
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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