import { useQuery } from "@tanstack/react-query";
import { Users, Target, Trophy, TrendingUp } from "lucide-react";

interface TeamStatusProps {
  clubId: number;
}

export default function TeamStatus({ clubId }: TeamStatusProps) {
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/clubs', clubId, 'teams'],
    enabled: !!clubId,
    retry: false,
  }) as { data: any[] };

  const { data: players = [] } = useQuery({
    queryKey: ['/api/clubs', clubId, 'players'],
    enabled: !!clubId,
    retry: false,
  }) as { data: any[] };

  const { data: bookings = [] } = useQuery({
    queryKey: ['/api/clubs', clubId, 'bookings'],
    enabled: !!clubId,
    retry: false,
  }) as { data: any[] };

  const { data: events = [] } = useQuery({
    queryKey: ['/api/clubs', clubId, 'events'],
    enabled: !!clubId,
    retry: false,
  }) as { data: any[] };

  // Calculate meaningful statistics
  const activeTeams = teams.filter(team => team.status === 'active');
  const activePlayers = players.filter(player => player.status === 'active');
  
  // Nächste Woche berechnen
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingTrainings = bookings.filter(booking => 
    booking.type === 'training' && 
    new Date(booking.startTime) <= nextWeek && 
    new Date(booking.startTime) >= new Date()
  ).length;
  
  const upcomingMatches = [...bookings, ...events].filter(item => 
    (item.type === 'match' || item.title?.toLowerCase().includes('spiel')) && 
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
    <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 h-full flex flex-col">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Team-Status</h3>
      
      <div className="grid grid-cols-2 gap-4 flex-shrink-0">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <div key={index} className="text-center">
              <div className={`w-12 h-12 mx-auto ${stat.bg} rounded-full flex items-center justify-center mb-2`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.title}</p>
            </div>
          );
        })}
      </div>


    </div>
  );
}