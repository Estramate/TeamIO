import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClub } from "@/hooks/use-club";
import { useSubscription } from "@/hooks/use-subscription";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Euro, 
  Target,
  Activity,
  Clock,
  Award,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { de } from "date-fns/locale";

interface AdvancedStatsGridProps {
  stats?: {
    memberCount?: number;
    teamCount?: number;
    todayBookingsCount?: number;
    pendingBookingsCount?: number;
    monthlyBudget?: number;
    totalRevenue?: number;
    totalExpenses?: number;
    averageBookingValue?: number;
    averageUtilization?: number;
    bookingSuccessRate?: number;
    memberEngagement?: number;
    weeklyBookings?: number;
    monthlyBookings?: number;
    memberChanges?: {
      thisWeek: number;
      previousWeek: number;
      weeklyChange: number;
    };
    teamChanges?: {
      thisWeek: number;
      previousWeek: number;
      weeklyChange: number;
    };
    bookingChanges?: {
      thisWeek: number;
      previousWeek: number;
      weeklyChange: number;
    };
    utilizationChanges?: {
      change: number;
      period: string;
    };
    bookingTrends?: any[];
    membershipTrends?: any[];
    facilityUtilization?: any[];
    financialOverview?: any;
  };
}

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  changeType: "positive" | "negative" | "neutral";
  icon: any;
  iconBg: string;
  iconColor: string;
  description?: string;
  trend?: number[];
  requiresPlan?: string[];
}

export default function AdvancedStatsGrid({ stats }: AdvancedStatsGridProps) {
  const { selectedClub } = useClub();
  const { subscriptionManager } = useSubscription();
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d");

  // Feature availability checks
  const hasAdvancedReports = subscriptionManager?.hasFeature('advancedReports') ?? false;
  const hasFinancialReports = subscriptionManager?.hasFeature('financialReports') ?? false;
  const hasBasicManagement = subscriptionManager?.hasFeature('basicManagement') ?? false;

  const currentPlan = subscriptionManager?.getCurrentPlan() || 'free';
  const planType = currentPlan;

  // Calculate advanced metrics from real data
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100);
  };

  const getUtilizationRate = () => {
    return stats?.averageUtilization || 0;
  };

  const getBookingSuccessRate = () => {
    return stats?.bookingSuccessRate || 0;
  };

  const getMemberEngagement = () => {
    return stats?.memberEngagement || 0;
  };

  // Generate change text from real data
  const getMemberChangeText = () => {
    const change = stats?.memberChanges?.weeklyChange || 0;
    if (change === 0) return "Keine Änderung diese Woche";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change} diese Woche`;
  };

  const getTeamChangeText = () => {
    const change = stats?.teamChanges?.weeklyChange || 0;
    if (change === 0) return "Keine Änderung diese Woche";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change} diese Woche`;
  };

  const getBookingChangeText = () => {
    const change = stats?.bookingChanges?.weeklyChange || 0;
    if (change === 0) return "Gleich wie letzte Woche";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change} vs. Vorwoche`;
  };

  const getActivityLevel = () => {
    const weeklyBookings = stats?.weeklyBookings || 0;
    const monthlyBookings = stats?.monthlyBookings || 0;
    if (monthlyBookings >= 50) return "Sehr hoch";
    if (monthlyBookings >= 30) return "Hoch";
    if (monthlyBookings >= 15) return "Mittel";
    if (monthlyBookings >= 5) return "Niedrig";
    return "Sehr niedrig";
  };

  // Generate basic stats for all plans (ALL DATA FROM DATABASE)
  const basicStats: StatCard[] = [
    {
      id: "members",
      title: "Aktive Mitglieder",
      value: stats?.memberCount || 0,
      change: getMemberChangeText(),
      changeType: (stats?.memberChanges?.weeklyChange || 0) >= 0 ? "positive" : "negative",
      icon: Users,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      description: "Registrierte Vereinsmitglieder",
    },
    {
      id: "teams",
      title: "Teams",
      value: stats?.teamCount || 0,
      change: getTeamChangeText(),
      changeType: (stats?.teamChanges?.weeklyChange || 0) >= 0 ? "positive" : "negative",
      icon: Award,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      description: "Aktive Mannschaften",
    },
    {
      id: "bookings-today",
      title: "Buchungen heute",
      value: stats?.todayBookingsCount || 0,
      change: `${stats?.pendingBookingsCount || 0} ausstehend`,
      changeType: "neutral",
      icon: Calendar,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      description: "Anlagenbuchungen heute",
    },
    {
      id: "activity",
      title: "Aktivität",
      value: getActivityLevel(),
      change: getBookingChangeText(),
      changeType: (stats?.bookingChanges?.weeklyChange || 0) >= 0 ? "positive" : "negative",
      icon: Activity,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      description: "Vereinsaktivität Level",
    }
  ];

  // Real calculation functions for advanced stats
  const getUtilizationChangeText = () => {
    const change = stats?.utilizationChanges?.change || 0;
    if (change === 0) return "Unverändert vs. Vormonat";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change}% vs. Vormonat`;
  };

  const getBookingSuccessChangeText = () => {
    // Calculate based on recent trend - simplified for now
    const currentRate = stats?.bookingSuccessRate || 0;
    if (currentRate >= 90) return "Stabil auf hohem Niveau";
    if (currentRate >= 75) return "Gute Performance";
    if (currentRate >= 50) return "Durchschnittliche Rate";
    return "Verbesserung nötig";
  };

  const getEngagementChangeText = () => {
    const currentEngagement = stats?.memberEngagement || 0;
    const weeklyBookings = stats?.weeklyBookings || 0;
    const monthlyBookings = stats?.monthlyBookings || 0;
    
    // Simple trend calculation
    if (weeklyBookings * 4 > monthlyBookings) return "Steigender Trend";
    if (weeklyBookings * 4 < monthlyBookings * 0.8) return "Sinkender Trend";
    return "Stabiler Trend";
  };

  // Advanced stats for higher tier plans (ALL DATA FROM DATABASE)
  // Enterprise plan gets all advanced stats, no restrictions
  const advancedStats: StatCard[] = (planType === 'enterprise' || hasAdvancedReports) ? [
    {
      id: "utilization",
      title: "Anlagenauslastung",
      value: `${getUtilizationRate()}%`,
      change: getUtilizationChangeText(),
      changeType: (stats?.utilizationChanges?.change || 0) >= 0 ? "positive" : "negative",
      icon: Target,
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      description: "Durchschnittliche Auslastung",
      requiresPlan: ["professional", "enterprise"]
    },
    {
      id: "booking-success",
      title: "Buchungserfolg",
      value: `${getBookingSuccessRate()}%`,
      change: getBookingSuccessChangeText(),
      changeType: (stats?.bookingSuccessRate || 0) >= 75 ? "positive" : "neutral",
      icon: BarChart3,
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      description: "Bestätigungsrate",
      requiresPlan: ["professional", "enterprise"]
    },
    {
      id: "engagement",
      title: "Mitglieder-Engagement",
      value: `${getMemberEngagement()}%`,
      change: getEngagementChangeText(),
      changeType: stats?.weeklyBookings && stats?.monthlyBookings && (stats.weeklyBookings * 4 > stats.monthlyBookings) ? "positive" : "neutral",
      icon: Activity,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      description: "Aktivitätsrate",
      requiresPlan: ["starter", "professional", "enterprise"]
    }
  ] : [];

  // Real financial change calculations
  const getRevenueChangeText = () => {
    const currentRevenue = stats?.totalRevenue || 0;
    const monthlyBudget = stats?.monthlyBudget || 0;
    
    if (currentRevenue === 0) return "Noch keine Erlöse";
    if (monthlyBudget >= 0) return `+€${Math.abs(monthlyBudget)} Gewinn`;
    return `€${Math.abs(monthlyBudget)} Defizit`;
  };

  const getBookingValueChangeText = () => {
    const avgValue = stats?.averageBookingValue || 0;
    const weeklyBookings = stats?.weeklyBookings || 0;
    const monthlyBookings = stats?.monthlyBookings || 0;
    
    if (avgValue === 0) return "Keine kostenpflichtigen Buchungen";
    if (weeklyBookings > monthlyBookings / 4) return "Steigender Trend";
    return "Stabiler Wert";
  };

  // Financial stats for plans with financial reports (ALL DATA FROM DATABASE)
  // Enterprise plan gets all financial stats, no restrictions  
  const financialStats: StatCard[] = (planType === 'enterprise' || hasFinancialReports) ? [
    {
      id: "revenue",
      title: "Monatserlös",
      value: `€${(stats?.totalRevenue || 0).toLocaleString()}`,
      change: getRevenueChangeText(),
      changeType: (stats?.monthlyBudget || 0) >= 0 ? "positive" : "negative",
      icon: Euro,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      description: "Gesamterlöse diesen Monat",
      requiresPlan: ["starter", "professional", "enterprise"]
    },
    {
      id: "avg-revenue",
      title: "Ø Buchungswert",
      value: `€${(stats?.averageBookingValue || 0).toFixed(2)}`,
      change: getBookingValueChangeText(),
      changeType: stats?.weeklyBookings && stats?.monthlyBookings && (stats.weeklyBookings > stats.monthlyBookings / 4) ? "positive" : "neutral",
      icon: TrendingUp,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      description: "Durchschnittlicher Buchungswert",
      requiresPlan: ["professional", "enterprise"]
    }
  ] : [];

  // Combine all available stats based on subscription
  const allStats = [...basicStats, ...advancedStats, ...financialStats];

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card rounded-xl shadow-sm p-4 sm:p-6 border border-border">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Lade Dashboard-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector for Advanced Plans */}
      {hasAdvancedReports && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Analytics Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Detaillierte Einblicke für {selectedClub?.name}
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
            {[
              { label: "7 Tage", value: "7d" },
              { label: "30 Tage", value: "30d" },
              { label: "90 Tage", value: "90d" }
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value as any)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedPeriod === period.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`period-selector-${period.value}`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {allStats.map((card) => {
          const Icon = card.icon;
          const ChangeIcon = card.changeType === "positive" ? TrendingUp : 
                            card.changeType === "negative" ? TrendingDown : Clock;
          
          // Check if card requires higher plan
          const isLocked = card.requiresPlan && !card.requiresPlan.includes(planType);
          
          return (
            <div 
              key={card.id} 
              className={`bg-card rounded-xl shadow-sm p-4 sm:p-6 border border-border transition-all hover:shadow-md ${
                isLocked ? "opacity-60 relative overflow-hidden" : ""
              }`}
              data-testid={`stats-card-${card.id}`}
            >
              {isLocked && (
                <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
                      <LineChart className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Upgrade erforderlich
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                    {isLocked ? "---" : card.value}
                  </p>
                  {card.change && (
                    <p className={`text-sm flex items-center ${
                      card.changeType === "positive" ? "text-green-500" :
                      card.changeType === "negative" ? "text-red-500" :
                      "text-orange-500"
                    }`}>
                      <ChangeIcon className="w-3 h-3 mr-1" />
                      {isLocked ? "Gesperrt" : card.change}
                    </p>
                  )}
                  {card.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Prompt for Free/Starter Plans */}
      {!hasAdvancedReports && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-2">
                Erweiterte Analytics freischalten
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Erhalten Sie detaillierte Einblicke in Anlagenauslastung, Effizienz-Scores, 
                erweiterte Finanzberichte und vieles mehr.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {["Trend-Analysen", "Effizienz-Metriken", "Vergleichsberichte", "Export-Funktionen"].map((feature) => (
                  <span key={feature} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md">
                    {feature}
                  </span>
                ))}
              </div>
              <button 
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                data-testid="upgrade-analytics-button"
              >
                Jetzt upgraden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}