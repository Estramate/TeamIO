import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Plus, Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Bookings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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

  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'bookings'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: facilities = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'facilities'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const filteredBookings = bookings.filter((booking: any) => {
    const matchesSearch = 
      booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesType = typeFilter === 'all' || booking.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bitte wählen Sie einen Verein aus, um Buchungen zu verwalten.
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
            Buchung hinzufügen
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buchungen suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="confirmed">Bestätigt</SelectItem>
              <SelectItem value="pending">Ausstehend</SelectItem>
              <SelectItem value="cancelled">Storniert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="match">Spiel</SelectItem>
              <SelectItem value="event">Veranstaltung</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bookings Content */}
      {isBookingsLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Buchungen gefunden</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? "Versuchen Sie, Ihre Suchkriterien anzupassen."
              : "Beginnen Sie mit dem Hinzufügen Ihrer ersten Buchung."}
          </p>
          {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
            <Button className="mt-4 bg-primary-500 hover:bg-primary-600">
              <Plus className="w-4 h-4 mr-2" />
              Erste Buchung hinzufügen
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking: any) => {
            const facility = facilities.find((f: any) => f.id === booking.facilityId);
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            
            return (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {booking.title}
                      </h3>
                      {booking.description && (
                        <p className="text-sm text-gray-600 mb-3">{booking.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{format(startTime, 'dd.MM.yyyy', { locale: de })}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{facility?.name || 'Unbekannte Anlage'}</span>
                        </div>
                        {booking.participants && (
                          <div className="flex items-center">
                            <span>{booking.participants} Teilnehmer</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        variant={
                          booking.status === 'confirmed' ? 'default' :
                          booking.status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {booking.status === 'confirmed' ? 'Bestätigt' :
                         booking.status === 'pending' ? 'Ausstehend' : 'Storniert'}
                      </Badge>
                      <Badge variant="outline">
                        {booking.type === 'training' ? 'Training' :
                         booking.type === 'match' ? 'Spiel' : 'Veranstaltung'}
                      </Badge>
                    </div>
                  </div>
                  
                  {booking.contactPerson && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Kontaktperson:</span> {booking.contactPerson}
                        {booking.contactEmail && (
                          <span className="ml-2">({booking.contactEmail})</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      Bearbeiten
                    </Button>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
