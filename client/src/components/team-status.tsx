import { useQuery } from "@tanstack/react-query";
import { Check, AlertTriangle, X } from "lucide-react";

interface TeamStatusProps {
  clubId: number;
}

export default function TeamStatus({ clubId }: TeamStatusProps) {
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/clubs', clubId, 'teams'],
    enabled: !!clubId,
    retry: false,
  }) as { data: any[] };

  const getTeamStatus = (memberCount: number, maxMembers: number) => {
    const percentage = (memberCount / maxMembers) * 100;
    
    if (percentage >= 90) {
      return { icon: Check, color: "green", label: "Vollständig" };
    } else if (percentage >= 70) {
      return { icon: AlertTriangle, color: "yellow", label: "Gut besetzt" };
    } else {
      return { icon: X, color: "red", label: "Unterbesetzt" };
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Team Status</h3>
      
      {teams.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">Keine Teams vorhanden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.slice(0, 5).map((team: any) => {
            // Mock member count for demonstration
            const memberCount = Math.floor(Math.random() * (team.maxMembers || 20)) + 1;
            const status = getTeamStatus(memberCount, team.maxMembers || 20);
            const StatusIcon = status.icon;
            
            return (
              <div key={team.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                    status.color === "green" ? "bg-green-100 dark:bg-green-900/30" :
                    status.color === "yellow" ? "bg-yellow-100 dark:bg-yellow-900/30" :
                    "bg-red-100 dark:bg-red-900/30"
                  }`}>
                    <StatusIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${
                      status.color === "green" ? "text-green-500 dark:text-green-400" :
                      status.color === "yellow" ? "text-yellow-500 dark:text-yellow-400" :
                      "text-red-500 dark:text-red-400"
                    }`} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-foreground truncate">{team.name}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {memberCount}/{team.maxMembers || 20}
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      <button className="w-full mt-4 text-center text-primary hover:text-primary/80 text-sm font-medium">
        Team Management öffnen
      </button>
    </div>
  );
}
