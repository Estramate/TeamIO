import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClub } from "@/hooks/use-club";
import { useSubscription } from "@/hooks/use-subscription";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  Lock,
  Zap,
  Target,
  ArrowRight
} from "lucide-react";
import { format, subDays, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { de } from "date-fns/locale";

interface ChartsSectionProps {
  data?: {
    bookingTrends?: any[];
    membershipGrowth?: any[];
    facilityUsage?: any[];
    financialData?: any[];
  };
}

interface ChartConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  requiresPlan: string[];
  chartType: "bar" | "line" | "pie" | "area";
  mockData: any[];
}

export default function ChartsSection({ data }: ChartsSectionProps) {
  const { selectedClub } = useClub();
  const { subscriptionManager } = useSubscription();
  const [selectedChart, setSelectedChart] = useState<string>("bookings");

  // Feature checks
  const hasAdvancedReports = subscriptionManager?.hasFeature('advancedReports') ?? false;
  const hasFinancialReports = subscriptionManager?.hasFeature('financialReports') ?? false;
  const currentPlan = subscriptionManager?.getCurrentPlan() || { planType: 'free' };
  const planType = currentPlan.planType || 'free';

  // Chart configurations with subscription requirements
  const chartConfigs: ChartConfig[] = [
    {
      id: "bookings",
      title: "Buchungstrends",
      description: "Wöchentliche Buchungsentwicklung",
      icon: Calendar,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      requiresPlan: ["free", "starter", "professional", "enterprise"], // Available for all
      chartType: "bar",
      mockData: data?.bookingTrends || [
        { week: "KW 1", bookings: 45, revenue: 675 },
        { week: "KW 2", bookings: 52, revenue: 780 },
        { week: "KW 3", bookings: 48, revenue: 720 },
        { week: "KW 4", bookings: 61, revenue: 915 },
        { week: "KW 5", bookings: 58, revenue: 870 },
        { week: "KW 6", bookings: 65, revenue: 975 },
      ]
    },
    {
      id: "utilization",
      title: "Anlagenauslastung",
      description: "Nutzung nach Anlagen und Tageszeit",
      icon: Target,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      requiresPlan: ["professional", "enterprise"],
      chartType: "pie",
      mockData: data?.facilityUsage || [
        { facility: "Hauptplatz", utilization: 85, hours: 42 },
        { facility: "Trainingsplatz 1", utilization: 72, hours: 36 },
        { facility: "Trainingsplatz 2", utilization: 68, hours: 34 },
        { facility: "Halle", utilization: 91, hours: 48 },
      ]
    },
    {
      id: "membership",
      title: "Mitgliederwachstum",
      description: "Monatliche Entwicklung der Mitgliederzahlen",
      icon: TrendingUp,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      requiresPlan: ["starter", "professional", "enterprise"],
      chartType: "line",
      mockData: data?.membershipGrowth || [
        { month: "Okt", members: 180, new: 8, leaving: 3 },
        { month: "Nov", members: 185, new: 12, leaving: 7 },
        { month: "Dez", members: 190, new: 15, leaving: 10 },
        { month: "Jan", members: 195, new: 18, leaving: 13 },
        { month: "Feb", members: 200, new: 14, leaving: 9 },
        { month: "Mär", members: 205, new: 11, leaving: 6 },
      ]
    },
    {
      id: "financial",
      title: "Finanzübersicht",
      description: "Einnahmen und Ausgaben Entwicklung",
      icon: BarChart3,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      requiresPlan: ["professional", "enterprise"],
      chartType: "area",
      mockData: data?.financialData || [
        { month: "Jan", income: 2800, expenses: 2200, profit: 600 },
        { month: "Feb", income: 3200, expenses: 2400, profit: 800 },
        { month: "Mär", income: 3600, expenses: 2600, profit: 1000 },
        { month: "Apr", income: 3100, expenses: 2500, profit: 600 },
        { month: "Mai", income: 3800, expenses: 2700, profit: 1100 },
        { month: "Jun", income: 4200, expenses: 2900, profit: 1300 },
      ]
    }
  ];

  // Filter charts based on subscription
  const availableCharts = chartConfigs.filter(chart => 
    chart.requiresPlan.includes(planType)
  );
  
  const lockedCharts = chartConfigs.filter(chart => 
    !chart.requiresPlan.includes(planType)
  );

  const selectedChartConfig = chartConfigs.find(c => c.id === selectedChart);

  const renderChart = (config: ChartConfig, isLocked: boolean = false) => {
    if (isLocked) {
      return (
        <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
          <div className="text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <h4 className="font-medium text-muted-foreground mb-2">Premium Feature</h4>
            <p className="text-sm text-muted-foreground/70 mb-4 max-w-xs">
              {config.description} ist verfügbar ab dem Professional Plan.
            </p>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Plan upgraden
            </button>
          </div>
        </div>
      );
    }

    // Simple mock chart visualization
    switch (config.chartType) {
      case "bar":
        return (
          <div className="h-64 flex items-end justify-center space-x-3 px-4">
            {config.mockData.map((item, idx) => {
              const height = Math.max((item.bookings / 70) * 100, 10);
              return (
                <div key={idx} className="flex flex-col items-center space-y-2">
                  <div 
                    className="bg-primary/80 rounded-t-md w-8 transition-all hover:bg-primary"
                    style={{ height: `${height}%` }}
                    title={`${item.week}: ${item.bookings} Buchungen`}
                  ></div>
                  <span className="text-xs text-muted-foreground">{item.week}</span>
                </div>
              );
            })}
          </div>
        );

      case "pie":
        return (
          <div className="h-64 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {config.mockData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `hsl(${idx * 90}, 60%, 60%)` }}
                  ></div>
                  <div>
                    <p className="font-medium text-sm">{item.facility}</p>
                    <p className="text-xs text-muted-foreground">{item.utilization}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "line":
        return (
          <div className="h-64 flex items-end justify-center space-x-6 px-4">
            {config.mockData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <div 
                    className="bg-purple-500/80 rounded-full w-3 h-3"
                    style={{ marginBottom: `${(item.members / 250) * 100}px` }}
                  ></div>
                  {idx < config.mockData.length - 1 && (
                    <div className="absolute top-1.5 left-6 w-6 h-0.5 bg-purple-500/40"></div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{item.month}</span>
              </div>
            ))}
          </div>
        );

      case "area":
        return (
          <div className="h-64 flex items-end justify-center space-x-4 px-4">
            {config.mockData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-1">
                <div className="relative w-8">
                  <div 
                    className="bg-red-200 dark:bg-red-900/40 rounded-t-sm"
                    style={{ height: `${(item.expenses / 5000) * 100}px` }}
                  ></div>
                  <div 
                    className="bg-emerald-500/80 rounded-t-sm"
                    style={{ height: `${(item.profit / 5000) * 100}px` }}
                  ></div>
                </div>
                <span className="text-xs text-muted-foreground">{item.month}</span>
              </div>
            ))}
          </div>
        );

      default:
        return <div className="h-64 bg-muted/20 rounded-lg"></div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart Navigation */}
      <div className="flex flex-wrap gap-2">
        {availableCharts.map((chart) => {
          const Icon = chart.icon;
          const isSelected = selectedChart === chart.id;
          
          return (
            <button
              key={chart.id}
              onClick={() => setSelectedChart(chart.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`chart-selector-${chart.id}`}
            >
              <Icon className="w-4 h-4" />
              <span>{chart.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Chart Display */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        {selectedChartConfig && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                  <selectedChartConfig.icon className="w-5 h-5" />
                  <span>{selectedChartConfig.title}</span>
                </h3>
                <p className="text-sm text-muted-foreground">{selectedChartConfig.description}</p>
              </div>
              
              {availableCharts.find(c => c.id === selectedChart) && (
                <div className="flex items-center space-x-2">
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-md">
                    Verfügbar
                  </span>
                </div>
              )}
            </div>

            {renderChart(selectedChartConfig, !availableCharts.find(c => c.id === selectedChart))}
          </>
        )}
      </div>

      {/* Locked Charts Preview */}
      {lockedCharts.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground">Weitere Analytics verfügbar</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedCharts.map((chart) => {
              const Icon = chart.icon;
              
              return (
                <div key={chart.id} className="bg-card rounded-xl shadow-sm border border-border p-6 opacity-75">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${chart.iconBg} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${chart.iconColor}`} />
                      </div>
                      <div>
                        <h5 className="font-medium text-foreground">{chart.title}</h5>
                        <p className="text-sm text-muted-foreground">{chart.description}</p>
                      </div>
                    </div>
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  {renderChart(chart, true)}
                </div>
              );
            })}
          </div>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <span>Upgrade für erweiterte Analytics</span>
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Schalten Sie alle Charts frei und erhalten Sie detaillierte Einblicke in 
                  Ihre Vereinsaktivitäten, Finanzen und Leistung.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {lockedCharts.map(chart => (
                    <li key={chart.id} className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>{chart.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center space-x-2">
                <span>Upgraden</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}