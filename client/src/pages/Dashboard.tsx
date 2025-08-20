import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { useSubscription } from "@/hooks/use-subscription";
import { isUnauthorizedError } from "@/lib/authUtils";
import StatsCards from "@/components/stats-cards";
import ActivityFeed from "@/components/activity-feed";
import UpcomingEvents from "@/components/upcoming-events";
import TeamStatus from "@/components/team-status";
import AdvancedStatsGrid from "@/components/analytics/advanced-stats-grid";
import ChartsSection from "@/components/analytics/charts-section";
import KPIDashboard from "@/components/analytics/kpi-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Target, Activity } from "lucide-react";
import { ContextualHelp, HelpIcon } from "@/components/ui/contextual-help";
import { getHelpContent } from "@/lib/help-content";


export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { setPage } = usePage();
  const { subscriptionManager } = useSubscription();
  const [activeTab, setActiveTab] = useState("overview");

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

  // Get subscription features
  const hasAdvancedReports = subscriptionManager?.hasFeature('advancedReports') ?? false;
  const hasFinancialReports = subscriptionManager?.hasFeature('financialReports') ?? false;
  const currentPlan = subscriptionManager?.getCurrentPlan() || 'free';
  const planType = typeof currentPlan === 'string' ? currentPlan : currentPlan;

  // Prepare analytics data
  const analyticsData = {
    stats: dashboardData?.stats || {},
    bookingTrends: dashboardData?.bookingTrends || [],
    membershipGrowth: dashboardData?.membershipGrowth || [],
    facilityUsage: dashboardData?.facilityUsage || [],
    financialData: dashboardData?.financialData || []
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
      {isDashboardLoading ? (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="bg-card rounded-xl shadow-sm p-6 border border-border animate-pulse max-w-md mx-auto">
              <div className="h-4 bg-muted rounded w-3/4 mb-3 mx-auto"></div>
              <div className="h-8 bg-muted rounded w-1/2 mb-2 mx-auto"></div>
              <div className="h-3 bg-muted rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6" data-testid="dashboard-tabs">
            <ContextualHelp
              content="Übersicht über die wichtigsten Vereinsstatistiken und Aktivitäten. Alle Daten werden in Echtzeit aus der Datenbank geladen."
              type="info"
            >
              <TabsTrigger value="overview" className="flex items-center space-x-2" data-testid="tab-overview">
                <BarChart3 className="w-4 h-4" />
                <span>Übersicht</span>
              </TabsTrigger>
            </ContextualHelp>
            
            <ContextualHelp
              content={hasAdvancedReports ? 
                "Erweiterte Analysen und Trends für professionelle Vereinsführung mit detaillierten Insights." :
                "Erweiterte Analytics sind im Professional+ Plan verfügbar. Upgrade für detaillierte Analysen und Trends."
              }
              type={hasAdvancedReports ? "feature" : "warning"}
            >
              <TabsTrigger 
                value="analytics" 
                className="flex items-center space-x-2" 
                disabled={!hasAdvancedReports}
                data-testid="tab-analytics"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Analytics {!hasAdvancedReports && "🔒"}</span>
              </TabsTrigger>
            </ContextualHelp>
            
            <ContextualHelp
              content="Key Performance Indikatoren helfen Ihnen, die Leistung Ihres Vereins zu messen. Grün bedeutet über dem Ziel, Orange unter dem Ziel."
              type="tip"
              title="KPI Dashboard"
            >
              <TabsTrigger 
                value="kpis" 
                className="flex items-center space-x-2"
                data-testid="tab-kpis"
              >
                <Target className="w-4 h-4" />
                <span>KPIs</span>
              </TabsTrigger>
            </ContextualHelp>
            
            <ContextualHelp
              content="Detaillierte Leistungsanalysen mit Benchmarks und Vergleichsdaten für optimierte Vereinsführung."
              type="info"
              title="Leistungsanalyse"
            >
              <TabsTrigger 
                value="performance" 
                className="flex items-center space-x-2"
                data-testid="tab-performance"
              >
                <Activity className="w-4 h-4" />
                <span>Leistung</span>
              </TabsTrigger>
            </ContextualHelp>
          </TabsList>

          <TabsContent value="overview" className="space-y-6" data-testid="overview-content">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold">Vereinsstatistiken</h2>
                <HelpIcon 
                  content="Diese Übersicht zeigt die wichtigsten Kennzahlen Ihres Vereins in Echtzeit. Alle Daten werden direkt aus der Datenbank berechnet und automatisch aktualisiert."
                  type="info"
                />
              </div>
            </div>
            <AdvancedStatsGrid stats={analyticsData.stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 flex flex-col gap-4 lg:h-[calc(100vh-400px)]">
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
                      {dashboardData?.communicationFeed?.length > 0 ? (
                        dashboardData.communicationFeed.map((item: any, index: number) => (
                          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50">
                              <span className="w-5 h-5 text-blue-500">{item.icon || '📅'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{item.timestamp}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">Keine Kommunikations-Updates für {selectedClub.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">Nachrichten und Ankündigungen erscheinen hier</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 sm:space-y-6 flex flex-col lg:h-[calc(100vh-400px)]">
                <div className="h-80 lg:h-[calc(50%-8px)]">
                  <UpcomingEvents clubId={selectedClub.id} />
                </div>
                <div className="h-96 lg:h-[calc(50%-8px)]">
                  <TeamStatus clubId={selectedClub.id} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6" data-testid="analytics-content">
            <ChartsSection data={analyticsData} />
          </TabsContent>

          <TabsContent value="kpis" className="space-y-6" data-testid="kpis-content">
            <KPIDashboard data={{ currentMetrics: analyticsData.stats, historicalData: [], benchmarks: {} }} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6" data-testid="performance-content">
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Performance-Metriken
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Detaillierte Leistungsanalysen werden hier verfügbar sein. 
                Verfolgen Sie Effizienz, Auslastung und Optimierungspotentiale.
              </p>
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Bald verfügbar
              </button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
