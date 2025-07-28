import { useState, useEffect } from "react";
import { usePage } from "@/contexts/PageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataSyncIndicator } from "@/components/DataSyncIndicator";
import { GlobalSyncStatus } from "@/components/GlobalSyncStatus";
import { useSyncStatus, useClubDataSyncStatus } from "@/hooks/use-sync-status";
import { useClub } from "@/hooks/use-club";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Zap, Activity, Wifi, WifiOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function SyncDemo() {
  const { selectedClub } = useClub();
  const queryClient = useQueryClient();
  const page = usePage();
  
  const [simulateOffline, setSimulateOffline] = useState(false);

  // Set page metadata using effect
  useEffect(() => {
    page.setTitle("Sync-Demonstration");
    page.setSubtitle("Real-time Datensynchronisation testen");
  }, [page]);

  // Get sync status
  const syncStatus = useSyncStatus();
  const clubSyncStatus = useClubDataSyncStatus(selectedClub?.id);

  // Demo queries that we can trigger
  const { data: clubData, isLoading: isClubLoading, refetch: refetchClub } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id],
    enabled: !!selectedClub?.id,
  });

  const { data: members, isLoading: isMembersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'members'],
    enabled: !!selectedClub?.id,
  });

  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'dashboard'],
    enabled: !!selectedClub?.id,
  });

  // Demo mutation
  const updateClubMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulate a slow API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Update erfolgreich",
        description: "Die Vereinsdaten wurden aktualisiert.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id] });
    }
  });

  const triggerMultipleQueries = async () => {
    await Promise.all([
      refetchClub(),
      refetchMembers(),
      refetchStats(),
    ]);
  };

  const triggerMutation = () => {
    updateClubMutation.mutate({ name: 'Updated Club Name' });
  };

  const simulateNetworkIssue = () => {
    setSimulateOffline(true);
    toast({
      title: "Offline-Modus simuliert",
      description: "Sync-Status zeigt jetzt Offline-Zustand",
      variant: "destructive"
    });
    
    setTimeout(() => {
      setSimulateOffline(false);
      toast({
        title: "Verbindung wiederhergestellt",
        description: "Sync-Status ist wieder online",
      });
    }, 5000);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync-Demonstration</h1>
          <p className="text-muted-foreground mt-2">
            Teste die Real-time Datensynchronisation mit verschiedenen Szenarien
          </p>
        </div>
        <DataSyncIndicator />
      </div>

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Globaler Sync-Status
            </CardTitle>
            <CardDescription>
              Übersicht über alle aktiven Datensynchronisationen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GlobalSyncStatus />
          </CardContent>
        </Card>

        {/* Club-specific Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Verein-spezifischer Status
            </CardTitle>
            <CardDescription>
              Synchronisation für den ausgewählten Verein
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Club Data Sync</span>
              {clubSyncStatus.isClubDataSyncing ? (
                <Badge variant="secondary">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Lädt
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-500">
                  Aktuell
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span>Abfragen: {clubSyncStatus.activeClubQueries}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <span>Updates: {clubSyncStatus.activeClubMutations}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test-Szenarien</CardTitle>
          <CardDescription>
            Verschiedene Aktionen zum Testen der Sync-Indikatoren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={triggerMultipleQueries}
              disabled={isClubLoading || isMembersLoading || isStatsLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${(isClubLoading || isMembersLoading || isStatsLoading) ? 'animate-spin' : ''}`} />
              Mehrere Abfragen
            </Button>

            <Button 
              onClick={triggerMutation}
              disabled={updateClubMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className={`h-4 w-4 ${updateClubMutation.isPending ? 'animate-pulse' : ''}`} />
              Mutation testen
            </Button>

            <Button 
              onClick={simulateNetworkIssue}
              disabled={simulateOffline}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {simulateOffline ? (
                <WifiOff className="h-4 w-4" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              {simulateOffline ? 'Offline...' : 'Offline simulieren'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Aktueller Sync-Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {syncStatus.hasActiveQueries ? 'JA' : 'NEIN'}
              </div>
              <div className="text-sm text-muted-foreground">Aktive Abfragen</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {syncStatus.hasActiveMutations ? 'JA' : 'NEIN'}
              </div>
              <div className="text-sm text-muted-foreground">Aktive Updates</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {syncStatus.isOnline ? 'ONLINE' : 'OFFLINE'}
              </div>
              <div className="text-sm text-muted-foreground">Verbindung</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {Math.round(syncStatus.syncProgress)}%
              </div>
              <div className="text-sm text-muted-foreground">Fortschritt</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Implementierungs-Details</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h4>Funktionsweise</h4>
          <ul>
            <li><strong>useIsFetching():</strong> Zählt aktive Query-Requests</li>
            <li><strong>useIsMutating():</strong> Zählt aktive Mutation-Requests</li>
            <li><strong>Online/Offline Detection:</strong> navigator.onLine + Event Listeners</li>
            <li><strong>Progress Simulation:</strong> Animierter Fortschrittsbalken während Operationen</li>
          </ul>
          
          <h4>Komponenten</h4>
          <ul>
            <li><strong>DataSyncIndicator:</strong> Kompakter Status mit Icon und Label</li>
            <li><strong>GlobalSyncStatus:</strong> Detaillierte Übersicht mit Metriken</li>
            <li><strong>SidebarSyncStatus:</strong> Minimale Anzeige für Sidebar</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}