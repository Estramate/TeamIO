import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface UpcomingEventsProps {
  clubId: number;
}

export default function UpcomingEvents({ clubId }: UpcomingEventsProps) {
  const { data: events = [] } = useQuery({
    queryKey: ['/api/clubs', clubId, 'events'],
    enabled: !!clubId,
    retry: false,
  }) as { data: any[] };

  // Get next 3 upcoming events
  const upcomingEvents = events
    .filter((event: any) => new Date(event.startDate) > new Date())
    .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Nächste Termine</h3>
      
      {upcomingEvents.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">Keine anstehenden Termine</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingEvents.map((event: any, index: number) => {
            const eventDate = new Date(event.startDate);
            const dayOfWeek = format(eventDate, 'EEEEEE', { locale: de }).toUpperCase();
            const dayOfMonth = format(eventDate, 'd');
            const time = format(eventDate, 'HH:mm');
            
            return (
              <div key={event.id} className="flex items-center space-x-3">
                <div className={`text-center rounded-lg p-2 min-w-0 ${
                  index === 0 ? 'bg-blue-50' : 
                  index === 1 ? 'bg-green-50' : 'bg-purple-50'
                }`}>
                  <p className={`text-xs font-medium ${
                    index === 0 ? 'text-blue-600' :
                    index === 1 ? 'text-green-600' : 'text-purple-600'
                  }`}>
                    {dayOfWeek}
                  </p>
                  <p className={`text-lg font-bold ${
                    index === 0 ? 'text-blue-700' :
                    index === 1 ? 'text-green-700' : 'text-purple-700'
                  }`}>
                    {dayOfMonth}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {time} - {event.location || 'Ort TBA'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <button className="w-full mt-4 text-center text-primary hover:text-primary/80 text-sm font-medium">
        Alle Termine anzeigen
      </button>
    </div>
  );
}
