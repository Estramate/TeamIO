import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { de } from "date-fns/locale";

export default function Calendar() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { setPage } = usePage();

  // Set page title
  useEffect(() => {
    setPage("Kalender", "Übersicht über alle Termine und Veranstaltungen");
  }, [setPage]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: events = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'events'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'bookings'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  // Combine events and bookings for calendar display
  const allEvents = [
    ...events.map((event: any) => ({
      ...event,
      date: new Date(event.startDate),
      time: format(new Date(event.startDate), 'HH:mm'),
      endTime: event.endDate ? format(new Date(event.endDate), 'HH:mm') : null,
      source: 'event'
    })),
    ...bookings.map((booking: any) => ({
      ...booking,
      date: new Date(booking.startTime),
      time: format(new Date(booking.startTime), 'HH:mm'),
      endTime: format(new Date(booking.endTime), 'HH:mm'),
      source: 'booking'
    }))
  ];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return allEvents.filter(event => isSameDay(event.date, date));
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte wählen Sie einen Verein aus, um den Kalender zu verwenden.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <div className="mb-6">
        <div className="flex items-center justify-end">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Termin hinzufügen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(currentDate, 'MMMM yyyy', { locale: de })}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Heute
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative p-2 min-h-[80px] text-left border border-gray-100 hover:bg-gray-50 transition-colors
                        ${!isSameMonth(day, currentDate) ? 'text-gray-300 bg-gray-50' : ''}
                        ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
                        ${isToday ? 'bg-blue-100 font-semibold' : ''}
                      `}
                    >
                      <div className="text-sm">{format(day, 'd')}</div>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event, index) => (
                          <div
                            key={index}
                            className={`text-xs px-1 py-0.5 rounded truncate ${
                              event.source === 'event' 
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {event.time} {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} weitere
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate 
                  ? format(selectedDate, 'dd. MMMM yyyy', { locale: de })
                  : 'Heute'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">Keine Termine</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((event, index) => (
                    <div key={index} className="border-l-4 border-l-blue-500 pl-3 py-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </h4>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>
                              {event.time}
                              {event.endTime && ` - ${event.endTime}`}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={event.source === 'event' ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {event.source === 'event' ? 'Termin' : 'Buchung'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nächste Termine</CardTitle>
            </CardHeader>
            <CardContent>
              {isEventsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {allEvents
                    .filter(event => event.date >= new Date())
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 5)
                    .map((event, index) => (
                      <div key={index} className="pb-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(event.date, 'dd.MM.yyyy', { locale: de })} um {event.time}
                            </p>
                          </div>
                          <Badge 
                            variant={event.source === 'event' ? 'default' : 'secondary'}
                            className="ml-2"
                          >
                            {event.source === 'event' ? 'Termin' : 'Buchung'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
