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
  });

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Status</h3>
      
      {teams.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">Keine Teams vorhanden</p>
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
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    status.color === "green" ? "bg-green-100" :
                    status.color === "yellow" ? "bg-yellow-100" :
                    "bg-red-100"
                  }`}>
                    <StatusIcon className={`text-sm ${
                      status.color === "green" ? "text-green-500" :
                      status.color === "yellow" ? "text-yellow-500" :
                      "text-red-500"
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{team.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {memberCount}/{team.maxMembers || 20}
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      <button className="w-full mt-4 text-center text-blue-500 hover:text-blue-600 text-sm font-medium">
        Team Management öffnen
      </button>
    </div>
  );
}
