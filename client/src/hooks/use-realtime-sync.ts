import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClub } from '@/hooks/use-club';

interface RealtimeMessage {
  type: 'data_update' | 'cache_invalidate' | 'sync_request';
  entity: string;
  clubId: number;
  data?: any;
  timestamp: number;
}

/**
 * Real-time Sync Hook - WebSocket-basierte stille Datenaktualisierung
 * Ermöglicht nahtlose Updates ohne sichtbare Reloads
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { selectedClub } = useClub();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // WebSocket Connection Setup - VOLLSTÄNDIG DEAKTIVIERT
  const connectWebSocket = () => {
    // KOMPLETT DEAKTIVIERT - Keine WebSocket-Verbindungen nach Chat-Entfernung

    return;
  };

  // Handle Real-time Updates
  const handleRealtimeUpdate = (message: RealtimeMessage) => {
    if (message.clubId !== selectedClub?.id) return;

    switch (message.type) {
      case 'data_update':
        // Stille Datenaktualisierung ohne UI-Störung
        handleDataUpdate(message.entity, message.data);
        break;
        
      case 'cache_invalidate':
        // Stille Cache-Invalidierung
        handleCacheInvalidate(message.entity);
        break;
        
      case 'sync_request':
        // Background-Synchronisation
        handleSyncRequest(message.entity);
        break;
    }
  };

  // Stille Datenaktualisierung
  const handleDataUpdate = async (entity: string, data: any) => {
    if (!selectedClub?.id) return;

    try {
      const queryKey = getQueryKey(entity, selectedClub.id);
      
      // Setze neue Daten direkt in Cache ohne Refetch
      queryClient.setQueryData(queryKey, data);
      
    } catch (error) {

    }
  };

  // Stille Cache-Invalidierung
  const handleCacheInvalidate = async (entity: string) => {
    if (!selectedClub?.id) return;

    try {
      const queryKey = getQueryKey(entity, selectedClub.id);
      
      // Prefetch neue Daten im Hintergrund
      await queryClient.prefetchQuery({
        queryKey,
        staleTime: 0,
      });
      
    } catch (error) {

    }
  };

  // Background-Synchronisation
  const handleSyncRequest = async (entity: string) => {
    if (!selectedClub?.id) return;

    try {
      const queryKey = getQueryKey(entity, selectedClub.id);
      
      // Stille Hintergrund-Synchronisation
      await queryClient.prefetchQuery({
        queryKey,
        staleTime: 0,
      });
      
    } catch (error) {

    }
  };

  // Query Key Helper
  const getQueryKey = (entity: string, clubId: number): any[] => {
    switch (entity) {
      case 'messages':
        return ['/api/clubs', clubId, 'messages'];
      case 'notifications':
        return ['/api/clubs', clubId, 'notifications'];
      case 'communication-stats':
        return ['/api/clubs', clubId, 'communication-stats'];
      case 'announcements':
        return ['/api/clubs', clubId, 'announcements'];
      case 'chat-rooms':
        // Chat-Rooms vollständig entfernt - kein Live Chat System mehr verfügbar
        return [];
      default:
        return ['/api/clubs', clubId, entity];
    }
  };

  // Setup WebSocket Connection
  useEffect(() => {
    if (selectedClub?.id) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedClub?.id]);

  // Trigger Manual Update
  const triggerUpdate = (entity: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && selectedClub?.id) {
      wsRef.current.send(JSON.stringify({
        type: 'request_update',
        entity,
        clubId: selectedClub.id,
        timestamp: Date.now()
      }));
    }
  };

  return {
    isConnected,
    triggerUpdate,
    reconnect: connectWebSocket
  };
}