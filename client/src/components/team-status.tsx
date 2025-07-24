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

  // Calculate team statistics
  const activeTeams = teams.filter(team => team.status === 'active');
  const activePlayers = players.filter(player => player.status === 'active');
  const totalGoals = players.reduce((sum, player) => sum + (player.goals || 0), 0);
  const totalAssists = players.reduce((sum, player) => sum + (player.assists || 0), 0);

  const stats = [
    {
      title: "Aktive Teams",
      value: activeTeams.length,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "Aktive Spieler",
      value: activePlayers.length,
      icon: Target,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      title: "Tore (Saison)",
      value: totalGoals,
      icon: Trophy,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      title: "Assists (Saison)",
      value: totalAssists,
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-50",
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

      {activeTeams.length > 0 && (
        <div className="mt-6 flex-1 overflow-y-auto">
          <h4 className="text-sm font-medium text-foreground mb-3">Aktive Teams</h4>
          <div className="space-y-2">
            {activeTeams.slice(0, 3).map((team: any) => (
              <div key={team.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{team.name}</span>
                <span className="text-muted-foreground">
                  {team.category && `${team.category} • `}{team.ageGroup || 'Alle Altersgruppen'}
                </span>
              </div>
            ))}
            {activeTeams.length > 3 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                +{activeTeams.length - 3} weitere Teams
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}