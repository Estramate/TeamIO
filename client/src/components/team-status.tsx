import { useQuery } from "@tanstack/react-query";
import { Users, Target, Trophy, TrendingUp } from "lucide-react";

interface TeamStatusProps {
  clubId: number;
}

export default function TeamStatus({ clubId }: TeamStatusProps) {
  // Sehr aggressive Cache-Einstellungen da Teams/Players selten ändern
  const { data: teams, isLoading: teamsLoading, error: teamsError } = useQuery({
    queryKey: ['/api/clubs', clubId, 'teams'],
    enabled: !!clubId,
    retry: false,
    staleTime: 30 * 60 * 1000, // 30 Minuten Cache
  });

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['/api/clubs', clubId, 'players'],
    enabled: !!clubId,
    retry: false,
    staleTime: 30 * 60 * 1000, // 30 Minuten Cache
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/clubs', clubId, 'bookings'],
    enabled: !!clubId,
    retry: false,
    staleTime: 20 * 60 * 1000, // 20 Minuten Cache
  });

  const { data: events } = useQuery({
    queryKey: ['/api/clubs', clubId, 'events'],
    enabled: !!clubId,
    retry: false,
    staleTime: 20 * 60 * 1000, // 20 Minuten Cache
  });

  // Handle loading state
  const isLoading = teamsLoading || playersLoading || bookingsLoading;
  
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-card rounded-lg border p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Handle error state with null checks
  if (teamsError || !teams || !Array.isArray(teams)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Teams konnten nicht geladen werden</p>
      </div>
    );
  }

  // Safe array operations with null checks
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safePlayers = Array.isArray(players) ? players : [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeEvents = Array.isArray(events) ? events : [];

  // Calculate meaningful statistics with null checks
  const activeTeams = safeTeams.filter(team => team && team.status === 'active');
  const activePlayers = safePlayers.filter(player => player && player.status === 'active');
  
  // Nächste Woche berechnen
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingTrainings = safeBookings.filter(booking => 
    booking && 
    booking.type === 'training' && 
    booking.startTime &&
    new Date(booking.startTime) <= nextWeek && 
    new Date(booking.startTime) >= new Date()
  ).length;
  
  const upcomingMatches = [...safeBookings, ...safeEvents].filter(item => 
    item && 
    (item.type === 'match' || (item.title && item.title.toLowerCase().includes('spiel'))) && 
    (item.startTime || item.startDate) &&
    new Date(item.startTime || item.startDate) <= nextWeek && 
    new Date(item.startTime || item.startDate) >= new Date()
  ).length;

  const stats = [
    {
      title: "Trainings (7 Tage)",
      value: upcomingTrainings,
      icon: Target,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "Spiele (7 Tage)",
      value: upcomingMatches,
      icon: Trophy,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      title: "Aktive Spieler",
      value: activePlayers.length,
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      title: "Gesamt-Teams",
      value: activeTeams.length,
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 h-[280px] max-h-[280px] flex flex-col">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex-shrink-0">Team-Status</h3>
      
      <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <div
              key={index}
              className={`${stat.bg} dark:bg-card rounded-lg p-3 border border-border/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 min-h-0 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2 min-h-0">
                <Icon className={`${stat.color} h-4 w-4 flex-shrink-0`} />
                <span className={`${stat.color} text-lg font-bold truncate ml-1`}>
                  {stat.value}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium leading-tight line-clamp-2">
                {stat.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}