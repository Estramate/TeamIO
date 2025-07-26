import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { isUnauthorizedError } from "@/lib/authUtils";
import StatsCards from "@/components/stats-cards";
import ActivityFeed from "@/components/activity-feed";
import UpcomingEvents from "@/components/upcoming-events";
import TeamStatus from "@/components/team-status";


export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { setPage } = usePage();

  // Set page title and redirect if not authenticated
  useEffect(() => {
    setPage("Dashboard", selectedClub ? `Willkommen zurück, hier ist die Übersicht für ${selectedClub.name}` : "Bitte wählen Sie einen Verein aus");
  }, [setPage, selectedClub]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'dashboard'],
    enabled: !!selectedClub?.id && isAuthenticated,
    retry: false,
  }) as { data: any, isLoading: boolean };

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
        <div className="text-center py-12">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Willkommen bei ClubFlow</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">Bitte wählen Sie einen Verein aus, um zu beginnen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
      {isDashboardLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl shadow-sm p-4 sm:p-6 border border-border animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <StatsCards stats={dashboardData?.stats || {}} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8 mb-8">
            <div className="lg:col-span-2 flex flex-col gap-4 lg:h-[calc(100vh-320px)]">
              <div className="h-96 lg:h-[calc(50%-8px)]">
                <ActivityFeed activities={dashboardData?.activities || []} />
              </div>
              <div className="h-80 lg:h-[calc(50%-8px)]">
                <div className="bg-card rounded-xl shadow-sm border border-border h-full flex flex-col p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                      Kommunikation
                    </h3>
                    <button className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium">
                      Alle anzeigen
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3">
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50">
                        <span className="w-5 h-5 text-blue-500">📅</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Training-Erinnerung</p>
                        <p className="text-xs text-muted-foreground">Nächstes Training heute um 18:30</p>
                        <p className="text-xs text-muted-foreground mt-1">vor 2 Stunden</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-green-50">
                        <span className="w-5 h-5 text-green-500">👥</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Mitglieder-Updates</p>
                        <p className="text-xs text-muted-foreground">19 aktive Mitglieder</p>
                        <p className="text-xs text-muted-foreground mt-1">vor 4 Stunden</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-orange-50">
                        <span className="w-5 h-5 text-orange-500">🔔</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Vereinsmitteilung</p>
                        <p className="text-xs text-muted-foreground">Neue Vereinsordnung verfügbar</p>
                        <p className="text-xs text-muted-foreground mt-1">vor 1 Tag</p>
                      </div>
                    </div>
                  </div>
                  

                </div>
              </div>
            </div>
            
            <div className="space-y-4 sm:space-y-6 flex flex-col lg:h-[calc(100vh-320px)]">
              <div className="h-80 lg:h-[calc(50%-8px)]">
                <UpcomingEvents clubId={selectedClub.id} />
              </div>
              <div className="h-96 lg:h-[calc(50%-8px)]">
                <TeamStatus clubId={selectedClub.id} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
