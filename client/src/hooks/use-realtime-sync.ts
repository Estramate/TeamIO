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

  // WebSocket Connection Setup
  const connectWebSocket = () => {
    if (!selectedClub?.id) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.debug('🔗 Real-time sync connected');
        
        // Registriere für Club-spezifische Updates
        wsRef.current?.send(JSON.stringify({
          type: 'subscribe',
          clubId: selectedClub.id,
          entities: ['messages', 'notifications', 'communication-stats', 'chat']
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          handleRealtimeUpdate(message);
        } catch (error) {
          console.debug('WebSocket message parse error:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.debug('🔗 Real-time sync disconnected');
        
        // Auto-reconnect nach 5 Sekunden
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.debug('WebSocket error:', error);
      };

    } catch (error) {
      console.debug('WebSocket connection error:', error);
    }
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
      console.debug('Data update error:', error);
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
      console.debug('Cache invalidate error:', error);
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
      console.debug('Sync request error:', error);
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
        return [`/api/clubs/${clubId}/chat/rooms`];
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