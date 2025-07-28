import { useEffect, useState } from 'react';
import { useQueryClient, useIsFetching, useIsMutating } from '@tanstack/react-query';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  hasActiveQueries: boolean;
  hasActiveMutations: boolean;
  lastSyncTime: Date | null;
  syncProgress: number;
}

export function useSyncStatus(): SyncStatus {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update last sync time when operations complete
  useEffect(() => {
    if (isFetching === 0 && isMutating === 0 && isOnline) {
      setLastSyncTime(new Date());
      setSyncProgress(100);
    }
  }, [isFetching, isMutating, isOnline]);

  // Simulate progress for active operations
  useEffect(() => {
    if (isFetching > 0 || isMutating > 0) {
      setSyncProgress(0);
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isFetching, isMutating]);

  return {
    isOnline,
    isSyncing: isFetching > 0 || isMutating > 0,
    hasActiveQueries: isFetching > 0,
    hasActiveMutations: isMutating > 0,
    lastSyncTime,
    syncProgress
  };
}

// Hook for monitoring specific query patterns
export function useClubDataSyncStatus(clubId?: number) {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({
    predicate: (query) => {
      if (!clubId) return false;
      const queryKey = query.queryKey;
      return Array.isArray(queryKey) && queryKey.includes(clubId);
    }
  });

  const isMutating = useIsMutating({
    predicate: (mutation) => {
      if (!clubId) return false;
      // Check if mutation is related to this club
      const variables = mutation.state.variables as any;
      return variables?.clubId === clubId;
    }
  });

  return {
    isClubDataSyncing: isFetching > 0 || isMutating > 0,
    activeClubQueries: isFetching,
    activeClubMutations: isMutating
  };
}