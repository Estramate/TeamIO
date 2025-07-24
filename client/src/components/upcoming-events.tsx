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

  const { data: bookings = [] } = useQuery({
    queryKey: ['/api/clubs', clubId, 'bookings'],
    enabled: !!clubId,
    retry: false,
  }) as { data: any[] };

  // Kombiniere Events und Buchungen für anstehende Termine
  const allUpcomingItems = [
    ...events.map((event: any) => ({
      ...event,
      date: event.startDate,
      type: 'event'
    })),
    ...bookings.map((booking: any) => ({
      ...booking,
      date: booking.startTime,
      type: 'booking'
    }))
  ];

  // Filtere nur zukünftige Termine (einschließlich heute)
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Beginne bei heute Mitternacht
  
  const upcomingEvents = allUpcomingItems
    .filter((item: any) => new Date(item.date) >= now)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 h-full flex flex-col">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Nächste Termine</h3>
      
      {upcomingEvents.length === 0 ? (
        <div className="text-center py-4 flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Keine anstehenden Termine</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto">
          {upcomingEvents.map((item: any, index: number) => {
            const itemDate = new Date(item.date);
            // Prüfe auf valides Datum
            if (isNaN(itemDate.getTime())) {
              return null;
            }
            const dayOfWeek = format(itemDate, 'EEEEEE', { locale: de }).toUpperCase();
            const dayOfMonth = format(itemDate, 'd');
            const time = format(itemDate, 'HH:mm');
            
            return (
              <div key={`${item.type}-${item.id}`} className="flex items-center space-x-3">
                <div className={`text-center rounded-lg p-2 min-w-0 ${
                  index === 0 ? 'bg-blue-50' : 
                  index === 1 ? 'bg-green-50' : 
                  index === 2 ? 'bg-purple-50' :
                  index === 3 ? 'bg-orange-50' : 'bg-gray-50'
                }`}>
                  <p className={`text-xs font-medium ${
                    index === 0 ? 'text-blue-600' :
                    index === 1 ? 'text-green-600' : 
                    index === 2 ? 'text-purple-600' :
                    index === 3 ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {dayOfWeek}
                  </p>
                  <p className={`text-lg font-bold ${
                    index === 0 ? 'text-blue-700' :
                    index === 1 ? 'text-green-700' : 
                    index === 2 ? 'text-purple-700' :
                    index === 3 ? 'text-orange-700' : 'text-gray-700'
                  }`}>
                    {dayOfMonth}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {time} - {item.location || (item.type === 'booking' ? 'Training/Spiel' : 'Ort TBA')}
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
