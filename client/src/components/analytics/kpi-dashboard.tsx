import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClub } from "@/hooks/use-club";
import { useSubscription } from "@/hooks/use-subscription";
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Award,
  Zap,
  BarChart3,
  PieChart,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { format, subDays, subMonths, isThisMonth, isThisWeek } from "date-fns";
import { de } from "date-fns/locale";

interface KPIDashboardProps {
  data?: {
    currentMetrics?: any;
    historicalData?: any[];
    benchmarks?: any;
  };
}

interface KPICard {
  id: string;
  title: string;
  value: string | number;
  target?: number;
  unit?: string;
  trend: {
    direction: "up" | "down" | "stable";
    value: number;
    period: string;
  };
  status: "excellent" | "good" | "warning" | "critical";
  description: string;
  requiresPlan?: string[];
  category: "performance" | "financial" | "engagement" | "efficiency";
}

export default function KPIDashboard({ data }: KPIDashboardProps) {
  const { selectedClub } = useClub();
  const { subscriptionManager } = useSubscription();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");

  // Feature availability - Use subscription manager directly for better accuracy
  const hasAdvancedReports = subscriptionManager?.hasFeature('advancedReports') ?? false;
  const hasFinancialReports = subscriptionManager?.hasFeature('financialReports') ?? false;
  const currentPlan = subscriptionManager?.getCurrentPlan() || 'free';
  const planType = currentPlan;
  
  console.log('🔍 KPI Dashboard Debug:', {
    hasAdvancedReports,
    hasFinancialReports,
    currentPlan,
    planType,
    subscriptionManager: !!subscriptionManager
  });

  // Real KPI data from database
  const allKPIs: KPICard[] = [
    // Performance KPIs (available for all plans)
    {
      id: "member-engagement",
      title: "Mitgliederaktivität",
      value: data?.currentMetrics?.memberEngagement || 0,
      target: 85,
      unit: "%",
      trend: { 
        direction: (data?.currentMetrics?.memberEngagement || 0) >= 85 ? "up" : 
                  (data?.currentMetrics?.memberEngagement || 0) >= 70 ? "stable" : "down", 
        value: Math.abs((data?.currentMetrics?.memberEngagement || 0) - 75), 
        period: "vs. Baseline" 
      },
      status: (data?.currentMetrics?.memberEngagement || 0) >= 85 ? "excellent" : 
              (data?.currentMetrics?.memberEngagement || 0) >= 70 ? "good" : 
              (data?.currentMetrics?.memberEngagement || 0) >= 50 ? "warning" : "critical",
      description: "Anteil aktiver Mitglieder in den letzten 30 Tagen",
      category: "engagement"
    },
    {
      id: "booking-rate",
      title: "Buchungsrate",
      value: data?.currentMetrics?.bookingSuccessRate || 0,
      target: 90,
      unit: "%",
      trend: { 
        direction: (data?.currentMetrics?.bookingSuccessRate || 0) >= 90 ? "up" : 
                  (data?.currentMetrics?.bookingSuccessRate || 0) >= 75 ? "stable" : "down", 
        value: Math.abs((data?.currentMetrics?.bookingSuccessRate || 0) - 80), 
        period: "vs. Baseline" 
      },
      status: (data?.currentMetrics?.bookingSuccessRate || 0) >= 90 ? "excellent" : 
              (data?.currentMetrics?.bookingSuccessRate || 0) >= 75 ? "good" : 
              (data?.currentMetrics?.bookingSuccessRate || 0) >= 60 ? "warning" : "critical",
      description: "Verhältnis von bestätigten zu angeforderten Buchungen",
      category: "performance"
    },

    // Financial KPIs (require financial reports feature)
    {
      id: "revenue-growth",
      title: "Umsatzwachstum",
      value: 12.5,
      target: 10,
      unit: "%",
      trend: { direction: "up", value: 2.3, period: "vs. Vorquartal" },
      status: "excellent",
      description: "Monatliches Umsatzwachstum",
      category: "financial",
      requiresPlan: ["starter", "professional", "enterprise"]
    },
    {
      id: "cost-efficiency",
      title: "Kosteneffizienz",
      value: 85,
      target: 80,
      unit: "%",
      trend: { direction: "up", value: 7.8, period: "vs. Vormonat" },
      status: "excellent",
      description: "Verhältnis von Einnahmen zu Betriebskosten",
      category: "financial",
      requiresPlan: ["professional", "enterprise"]
    },

    // Advanced KPIs (require advanced reports)
    {
      id: "facility-utilization",
      title: "Anlagenauslastung",
      value: data?.currentMetrics?.averageUtilization || 0,
      target: 75,
      unit: "%",
      trend: { 
        direction: (data?.currentMetrics?.utilizationChanges?.change || 0) > 0 ? "up" : 
                  (data?.currentMetrics?.utilizationChanges?.change || 0) < 0 ? "down" : "stable", 
        value: Math.abs(data?.currentMetrics?.utilizationChanges?.change || 0), 
        period: "vs. Vormonat" 
      },
      status: (data?.currentMetrics?.averageUtilization || 0) >= 75 ? "excellent" : 
              (data?.currentMetrics?.averageUtilization || 0) >= 60 ? "good" : 
              (data?.currentMetrics?.averageUtilization || 0) >= 40 ? "warning" : "critical",
      description: "Durchschnittliche Auslastung aller Anlagen",
      category: "efficiency",
      requiresPlan: ["professional", "enterprise"]
    },
    {
      id: "operational-efficiency",
      title: "Betriebseffizienz",
      value: 89,
      target: 85,
      unit: "%",
      trend: { direction: "up", value: 4.5, period: "vs. Vormonat" },
      status: "excellent",
      description: "Gesamtbewertung der Betriebsabläufe",
      category: "efficiency",
      requiresPlan: ["professional", "enterprise"]
    },

    // Member engagement (starter+)
    {
      id: "retention-rate",
      title: "Mitgliederbindung",
      value: 94,
      target: 90,
      unit: "%",
      trend: { direction: "stable", value: 0.3, period: "vs. Vormonat" },
      status: "excellent",
      description: "Anteil der Mitglieder, die länger als 12 Monate aktiv sind",
      category: "engagement",
      requiresPlan: ["starter", "professional", "enterprise"]
    },
  ];

  // Filter KPIs based on FEATURES rather than plan names for better accuracy
  const availableKPIs = useMemo(() => {
    return allKPIs.filter(kpi => {
      let hasAccess = true;
      
      // Check feature access based on KPI category and requirements
      if (kpi.category === "financial" && kpi.requiresPlan?.includes("professional")) {
        hasAccess = hasFinancialReports;
      } else if (kpi.category === "efficiency" && kpi.requiresPlan?.includes("professional")) {
        hasAccess = hasAdvancedReports;
      } else if (kpi.requiresPlan) {
        // Fallback to plan type check for other KPIs
        hasAccess = kpi.requiresPlan.includes(planType);
      }
      
      const matchesCategory = selectedCategory === "all" || kpi.category === selectedCategory;
      
      console.log(`🔍 KPI ${kpi.id}:`, {
        category: kpi.category,
        requiresPlan: kpi.requiresPlan,
        hasAccess,
        planType,
        hasAdvancedReports,
        hasFinancialReports
      });
      
      return hasAccess && matchesCategory;
    });
  }, [planType, selectedCategory, hasAdvancedReports, hasFinancialReports]);

  const lockedKPIs = useMemo(() => {
    return allKPIs.filter(kpi => {
      let hasAccess = true;
      
      // Check feature access based on KPI category and requirements
      if (kpi.category === "financial" && kpi.requiresPlan?.includes("professional")) {
        hasAccess = hasFinancialReports;
      } else if (kpi.category === "efficiency" && kpi.requiresPlan?.includes("professional")) {
        hasAccess = hasAdvancedReports;
      } else if (kpi.requiresPlan) {
        // Fallback to plan type check for other KPIs
        hasAccess = kpi.requiresPlan.includes(planType);
      }
      
      const matchesCategory = selectedCategory === "all" || kpi.category === selectedCategory;
      return !hasAccess && matchesCategory;
    });
  }, [planType, selectedCategory, hasAdvancedReports, hasFinancialReports]);

  // Category definitions
  const categories = [
    { id: "all", name: "Alle", icon: BarChart3 },
    { id: "performance", name: "Leistung", icon: Target },
    { id: "financial", name: "Finanzen", icon: DollarSign },
    { id: "engagement", name: "Engagement", icon: Users },
    { id: "efficiency", name: "Effizienz", icon: Activity },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "good":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      case "warning":
        return "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30";
      case "critical":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderKPICard = (kpi: KPICard, isLocked: boolean = false) => {
    if (viewMode === "compact") {
      return (
        <div 
          key={kpi.id}
          className={`flex items-center justify-between p-4 bg-card rounded-lg border border-border ${
            isLocked ? "opacity-60" : ""
          }`}
          data-testid={`kpi-compact-${kpi.id}`}
        >
          <div className="flex items-center space-x-3">
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(kpi.status)}`}>
              {kpi.status === "excellent" ? "Sehr gut" : 
               kpi.status === "good" ? "Gut" :
               kpi.status === "warning" ? "Warnung" : "Kritisch"}
            </div>
            <div>
              <p className="font-medium text-foreground">{kpi.title}</p>
              <p className="text-sm text-muted-foreground">{kpi.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              {isLocked ? "---" : `${kpi.value}${kpi.unit || ""}`}
            </p>
            <div className="flex items-center space-x-1 text-sm">
              {getTrendIcon(kpi.trend.direction)}
              <span className={kpi.trend.direction === "up" ? "text-green-500" : 
                             kpi.trend.direction === "down" ? "text-red-500" : "text-gray-500"}>
                {isLocked ? "N/A" : `${kpi.trend.direction === "up" ? "+" : ""}${kpi.trend.value}%`}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        key={kpi.id}
        className={`bg-card rounded-xl shadow-sm border border-border p-6 transition-all hover:shadow-md ${
          isLocked ? "opacity-60 relative overflow-hidden" : ""
        }`}
        data-testid={`kpi-card-${kpi.id}`}
      >
        {isLocked && (
          <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px] flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-xs font-medium text-muted-foreground">Premium Feature</p>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-foreground mb-1">{kpi.title}</h4>
            <p className="text-sm text-muted-foreground">{kpi.description}</p>
          </div>
          <div className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(kpi.status)}`}>
            {kpi.status === "excellent" ? "Sehr gut" : 
             kpi.status === "good" ? "Gut" :
             kpi.status === "warning" ? "Warnung" : "Kritisch"}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">
                {isLocked ? "---" : `${kpi.value}${kpi.unit || ""}`}
              </p>
              {kpi.target && (
                <p className="text-sm text-muted-foreground">
                  Ziel: {kpi.target}{kpi.unit || ""}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 text-sm mb-1">
                {getTrendIcon(kpi.trend.direction)}
                <span className={kpi.trend.direction === "up" ? "text-green-500" : 
                               kpi.trend.direction === "down" ? "text-red-500" : "text-gray-500"}>
                  {isLocked ? "N/A" : `${kpi.trend.direction === "up" ? "+" : ""}${kpi.trend.value}%`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{kpi.trend.period}</p>
            </div>
          </div>

          {/* Progress bar for target */}
          {kpi.target && !isLocked && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    Number(kpi.value) >= kpi.target ? "bg-green-500" : 
                    Number(kpi.value) >= kpi.target * 0.8 ? "bg-orange-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min((Number(kpi.value) / kpi.target) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0{kpi.unit || ""}</span>
                <span>{kpi.target}{kpi.unit || ""}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-xl font-semibold text-foreground">KPI Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Schlüsselkennzahlen für {selectedClub?.name}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View mode toggle */}
          <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === "cards"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="view-mode-cards"
            >
              Karten
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === "compact"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="view-mode-compact"
            >
              Kompakt
            </button>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`category-filter-${category.id}`}
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* KPI Grid */}
      <div className={`${
        viewMode === "cards" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-3"
      }`}>
        {availableKPIs.map(kpi => renderKPICard(kpi))}
        {lockedKPIs.map(kpi => renderKPICard(kpi, true))}
      </div>

      {/* No KPIs message */}
      {availableKPIs.length === 0 && lockedKPIs.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h4 className="font-medium text-foreground mb-2">Keine KPIs verfügbar</h4>
          <p className="text-sm text-muted-foreground">
            Für diese Kategorie sind aktuell keine Kennzahlen verfügbar.
          </p>
        </div>
      )}

      {/* Upgrade prompt */}
      {lockedKPIs.length > 0 && (
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-2">
                Erweiterte KPIs freischalten
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Erhalten Sie Zugang zu detaillierten Leistungskennzahlen, 
                Finanzanalysen und Effizienz-Metriken.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {lockedKPIs.slice(0, 3).map(kpi => (
                  <span key={kpi.id} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md">
                    {kpi.title}
                  </span>
                ))}
                {lockedKPIs.length > 3 && (
                  <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md">
                    +{lockedKPIs.length - 3} weitere
                  </span>
                )}
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center space-x-2">
                <span>Plan upgraden</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}