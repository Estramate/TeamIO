import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { DataSyncIndicator } from "@/components/DataSyncIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Database, Zap } from "lucide-react";

export function GlobalSyncStatus() {
  const {
    isOnline,
    isSyncing,
    hasActiveQueries,
    hasActiveMutations,
    lastSyncTime,
    syncProgress
  } = useSyncStatus();

  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Noch nie synchronisiert';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Gerade synchronisiert';
    if (diffInSeconds < 3600) return `Vor ${Math.floor(diffInSeconds / 60)} Minuten`;
    if (diffInSeconds < 86400) return `Vor ${Math.floor(diffInSeconds / 3600)} Stunden`;
    return `Vor ${Math.floor(diffInSeconds / 86400)} Tagen`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Main Sync Indicator */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Datensynchronisation</h3>
            <DataSyncIndicator showLabel={false} className="scale-90" />
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Active Operations */}
          {isSyncing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Synchronisation läuft...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          {/* Detailed Status */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              <span>Abfragen: {isFetching}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              <span>Updates: {isMutating}</span>
            </div>
          </div>

          {/* Last Sync Time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatLastSync()}</span>
          </div>

          {/* Status Badges */}
          <div className="flex gap-1 flex-wrap">
            {hasActiveQueries && (
              <Badge variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Lädt Daten
              </Badge>
            )}
            {hasActiveMutations && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Speichert
              </Badge>
            )}
            {!isSyncing && isOnline && (
              <Badge variant="default" className="text-xs bg-green-500">
                Aktuell
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Minimal version for sidebar
export function SidebarSyncStatus() {
  const { isSyncing, isOnline } = useSyncStatus();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  if (!isSyncing && isOnline) return null;

  return (
    <div className="px-3 py-2 border-t border-border">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        {isSyncing ? (
          <span>Synchronisiere... ({isFetching + isMutating} aktiv)</span>
        ) : (
          <span>Offline</span>
        )}
      </div>
    </div>
  );
}