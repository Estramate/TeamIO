import { Users, UsersRound, Calendar, Euro, TrendingUp, TrendingDown, Clock } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    memberCount: number;
    teamCount: number;
    todayBookingsCount: number;
    pendingBookingsCount: number;
    monthlyBudget: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Mitglieder",
      value: stats.memberCount,
      change: "+3 diese Woche",
      changeType: "positive" as const,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
    },
    {
      title: "Teams",
      value: stats.teamCount,
      change: "+1 diese Woche",
      changeType: "positive" as const,
      icon: UsersRound,
      iconBg: "bg-green-100",
      iconColor: "text-green-500",
    },
    {
      title: "Buchungen heute",
      value: stats.todayBookingsCount,
      change: `${stats.pendingBookingsCount} ausstehend`,
      changeType: "neutral" as const,
      icon: Calendar,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
    },
    {
      title: "Monatsbudget",
      value: `€${stats.monthlyBudget.toLocaleString()}`,
      change: stats.monthlyBudget >= 0 ? "+€180 vs. Vormonat" : "-€180 vs. Vormonat",
      changeType: stats.monthlyBudget >= 0 ? "positive" : "negative" as const,
      icon: Euro,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const ChangeIcon = card.changeType === "positive" ? TrendingUp : 
                          card.changeType === "negative" ? TrendingDown : Clock;
        
        return (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className={`text-sm mt-1 flex items-center ${
                  card.changeType === "positive" ? "text-green-500" :
                  card.changeType === "negative" ? "text-red-500" :
                  "text-orange-500"
                }`}>
                  <ChangeIcon className="w-3 h-3 mr-1" />
                  {card.change}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <Icon className={`text-lg ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
