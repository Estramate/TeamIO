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
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'dashboard'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Willkommen bei TeamIO</h2>
          <p className="text-muted-foreground mb-6">Bitte wählen Sie einen Verein aus, um zu beginnen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">

      {isDashboardLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl shadow-sm p-6 border border-border animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <StatsCards stats={dashboardData?.stats} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <ActivityFeed activities={dashboardData?.activities} />
            
            <div className="space-y-6">
              <UpcomingEvents clubId={selectedClub.id} />
              <TeamStatus clubId={selectedClub.id} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
