import { Users, Calendar, Euro, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Activity {
  type: string;
  description: string;
  timestamp: string;
  icon: string;
}

interface ActivityFeedProps {
  activities?: Activity[];
}

export default function ActivityFeed({ activities = [] }: ActivityFeedProps) {
  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case "user-plus":
        return Users;
      case "calendar":
        return Calendar;
      case "euro-sign":
        return Euro;
      case "exclamation-triangle":
        return AlertTriangle;
      default:
        return Users;
    }
  };

  const getActivityIconBg = (iconType: string) => {
    switch (iconType) {
      case "user-plus":
        return "bg-blue-100 text-blue-500";
      case "calendar":
        return "bg-green-100 text-green-500";
      case "euro-sign":
        return "bg-orange-100 text-orange-500";
      case "exclamation-triangle":
        return "bg-red-100 text-red-500";
      default:
        return "bg-blue-100 text-blue-500";
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Neueste Aktivitäten</h3>
          </div>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Noch keine Aktivitäten vorhanden</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Neueste Aktivitäten</h3>
          <button className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium">
            Alle anzeigen
          </button>
        </div>
        
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.icon);
            const iconClasses = getActivityIconBg(activity.icon);
            
            return (
              <div key={index} className="flex items-start space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconClasses}`}>
                  <Icon className="text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true, 
                      locale: de 
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
