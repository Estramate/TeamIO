import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClub } from '@/hooks/use-club';

interface BackgroundSyncConfig {
  enabled: boolean;
  intervals: {
    critical: number;    // 30 seconds - wichtige Daten
    normal: number;      // 2 minutes - normale Updates  
    low: number;         // 5 minutes - weniger wichtige Daten
  };
}

const DEFAULT_CONFIG: BackgroundSyncConfig = {
  enabled: false, // DEAKTIVIERT - Keine automatischen Background-Syncs mehr nach Chat-Entfernung
  intervals: {
    critical: 30 * 1000,   // 30 Sekunden
    normal: 2 * 60 * 1000,  // 2 Minuten  
    low: 5 * 60 * 1000,     // 5 Minuten
  }
};

/**
 * Background Sync Hook - Lädt Daten unsichtbar im Hintergrund
 * ohne UI zu stören oder Reloads zu verursachen
 */
export function useBackgroundSync(config: Partial<BackgroundSyncConfig> = {}) {
  const queryClient = useQueryClient();
  const { selectedClub } = useClub();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const intervalsRef = useRef<{
    critical?: NodeJS.Timeout;
    normal?: NodeJS.Timeout;
    low?: NodeJS.Timeout;
  }>({});

  // Hintergrund-Synchronisation für kritische Daten
  const syncCriticalData = async () => {
    if (!selectedClub?.id || !finalConfig.enabled) return;
    
    try {
      // Stille Invalidierung - ohne UI-Update-Trigger
      await queryClient.prefetchQuery({
        queryKey: ['/api/clubs', selectedClub.id, 'notifications'],
        staleTime: 0, // Immer fresh laden
      });
      
      await queryClient.prefetchQuery({
        queryKey: ['/api/clubs', selectedClub.id, 'communication-stats'],
        staleTime: 0,
      });
    } catch (error) {
      // Stille Fehlerbehandlung - kein UI-Feedback

    }
  };

  // Hintergrund-Synchronisation für normale Daten
  const syncNormalData = async () => {
    if (!selectedClub?.id || !finalConfig.enabled) return;
    
    try {
      await queryClient.prefetchQuery({
        queryKey: ['/api/clubs', selectedClub.id, 'messages'],
        staleTime: 0,
      });
      
      await queryClient.prefetchQuery({
        queryKey: ['/api/clubs', selectedClub.id, 'announcements'],
        staleTime: 0,
      });
    } catch (error) {

    }
  };

  // Hintergrund-Synchronisation für weniger wichtige Daten
  const syncLowPriorityData = async () => {
    if (!selectedClub?.id || !finalConfig.enabled) return;
    
    try {
      // Chat-Räume Sync entfernt - Live Chat System vollständig deaktiviert
    } catch (error) {
    }
  };

  // Setup Background Intervals
  useEffect(() => {
    if (!finalConfig.enabled || !selectedClub?.id) {
      // Clear alle Intervals wenn disabled
      Object.values(intervalsRef.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
      intervalsRef.current = {};
      return;
    }

    // Kritische Daten alle 30 Sekunden
    intervalsRef.current.critical = setInterval(syncCriticalData, finalConfig.intervals.critical);
    
    // Normale Daten alle 2 Minuten
    intervalsRef.current.normal = setInterval(syncNormalData, finalConfig.intervals.normal);
    
    // Weniger wichtige Daten alle 5 Minuten
    intervalsRef.current.low = setInterval(syncLowPriorityData, finalConfig.intervals.low);

    // Sofortige erste Synchronisation
    syncCriticalData();
    syncNormalData();
    syncLowPriorityData();

    return () => {
      Object.values(intervalsRef.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
      intervalsRef.current = {};
    };
  }, [selectedClub?.id, finalConfig.enabled]);

  return {
    syncNow: () => {
      syncCriticalData();
      syncNormalData();
      syncLowPriorityData();
    },
    config: finalConfig
  };
}