import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Booking, Facility, Team } from "@shared/schema";
import { insertBookingSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Filter,
  AlertCircle,
  MoreHorizontal,
  Grid3x3,
  List,
  Eye,
  ToggleLeft,
  ToggleRight,
  CalendarDays,
  Building,
  Trophy,
  Check,
  X,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Form Schema
const bookingFormSchema = insertBookingSchema.extend({
  facilityId: z.coerce.number().min(1, "Anlage ist erforderlich"),
  teamId: z.coerce.number().optional(),
  participants: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  startTime: z.string().min(1, "Startzeit ist erforderlich"),
  endTime: z.string().min(1, "Endzeit ist erforderlich"),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

export default function Bookings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "training",
      status: "confirmed",
      startTime: "",
      endTime: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      notes: "",
    },
  });

  // Type and status options
  const typeOptions = [
    { value: "training", label: "Training" },
    { value: "match", label: "Spiel" },
    { value: "event", label: "Veranstaltung" },
    { value: "maintenance", label: "Wartung" },
  ];

  const statusOptions = [
    { value: "confirmed", label: "Bestätigt" },
    { value: "pending", label: "Ausstehend" },
    { value: "cancelled", label: "Abgesagt" },
  ];

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

  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'bookings'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'facilities'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: BookingFormData) => {
      const cleanedData = {
        ...bookingData,
        clubId: selectedClub?.id,
        startTime: new Date(bookingData.startTime).toISOString(),
        endTime: new Date(bookingData.endTime).toISOString(),
        contactEmail: bookingData.contactEmail || undefined,
        teamId: bookingData.teamId || undefined,
        participants: bookingData.participants || undefined,
        cost: bookingData.cost ? String(bookingData.cost) : undefined,
      };
      
      return apiRequest("POST", `/api/clubs/${selectedClub?.id}/bookings`, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/clubs', selectedClub?.id, 'bookings']
      });
      setBookingModalOpen(false);
      setSelectedBooking(null);
      form.reset();
      toast({
        title: "Erfolg",
        description: "Buchung wurde erfolgreich erstellt.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Fehler",
        description: "Buchung konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, ...bookingData }: BookingFormData & { id: number }) => {
      const cleanedData = {
        ...bookingData,
        startTime: new Date(bookingData.startTime).toISOString(),
        endTime: new Date(bookingData.endTime).toISOString(),
        contactEmail: bookingData.contactEmail || undefined,
        teamId: bookingData.teamId || undefined,
        participants: bookingData.participants || undefined,
        cost: bookingData.cost ? String(bookingData.cost) : undefined,
      };
      
      return apiRequest("PATCH", `/api/clubs/${selectedClub?.id}/bookings/${id}`, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/clubs', selectedClub?.id, 'bookings']
      });
      setBookingModalOpen(false);
      setSelectedBooking(null);
      form.reset();
      toast({
        title: "Erfolg",
        description: "Buchung wurde erfolgreich aktualisiert.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Fehler",
        description: "Buchung konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/clubs/${selectedClub?.id}/bookings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/clubs', selectedClub?.id, 'bookings']
      });
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
      toast({
        title: "Erfolg",
        description: "Buchung wurde erfolgreich gelöscht.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Fehler",
        description: "Buchung konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/clubs/${selectedClub?.id}/bookings/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/clubs', selectedClub?.id, 'bookings']
      });
      toast({
        title: "Erfolg",
        description: "Status wurde erfolgreich geändert.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden.",
        variant: "destructive",
      });
    },
  });

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesType = typeFilter === 'all' || booking.type === typeFilter;
    const matchesFacility = facilityFilter === 'all' || booking.facilityId === parseInt(facilityFilter);
    
    return matchesSearch && matchesStatus && matchesType && matchesFacility;
  });

  const handleCreateBooking = () => {
    setSelectedBooking(null);
    form.reset();
    setBookingModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    form.reset({
      title: booking.title,
      description: booking.description || "",
      facilityId: booking.facilityId,
      teamId: booking.teamId || undefined,
      type: booking.type,
      status: booking.status,
      startTime: format(new Date(booking.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(booking.endTime), "yyyy-MM-dd'T'HH:mm"),
      contactPerson: booking.contactPerson || "",
      contactEmail: booking.contactEmail || "",
      contactPhone: booking.contactPhone || "",
      participants: booking.participants || undefined,
      cost: booking.cost ? parseFloat(booking.cost) : undefined,
      notes: booking.notes || "",
    });
    setBookingModalOpen(true);
  };

  const handleDeleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  const handleViewBooking = (booking: Booking) => {
    setViewingBooking(booking);
    setIsDetailDialogOpen(true);
  };

  const handleToggleStatus = (booking: Booking) => {
    const newStatus = booking.status === 'confirmed' ? 'cancelled' : 'confirmed';
    toggleStatusMutation.mutate({ id: booking.id, status: newStatus });
  };

  const onSubmit = (data: BookingFormData) => {
    if (selectedBooking) {
      updateBookingMutation.mutate({ ...data, id: selectedBooking.id });
    } else {
      createBookingMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Bestätigt</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Ausstehend</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Abgesagt</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'training':
        return <Badge variant="outline" className="border-blue-200 text-blue-700">Training</Badge>;
      case 'match':
        return <Badge variant="outline" className="border-green-200 text-green-700">Spiel</Badge>;
      case 'event':
        return <Badge variant="outline" className="border-purple-200 text-purple-700">Event</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="border-orange-200 text-orange-700">Wartung</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

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
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Buchungen</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Verwalten Sie Anlagenbuchungen und Reservierungen</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex rounded-lg border border-border bg-background p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 px-3 flex-1 sm:flex-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 px-3 flex-1 sm:flex-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleCreateBooking} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Neue Buchung
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buchungen suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
            <SelectTrigger className="w-full sm:w-48">
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
                  
                  <div className="flex items-center justify-end mt-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewBooking(booking)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Details anzeigen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditBooking(booking)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(booking)}
                          className={booking.status === 'confirmed' ? 'text-orange-600' : 'text-green-600'}
                        >
                          {booking.status === 'confirmed' ? (
                            <><X className="mr-2 h-4 w-4" />Stornieren</>
                          ) : (
                            <><Check className="mr-2 h-4 w-4" />Bestätigen</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteBooking(booking)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Booking Dialog */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBooking ? 'Buchung bearbeiten' : 'Neue Buchung erstellen'}
            </DialogTitle>
            <DialogDescription>
              {selectedBooking 
                ? 'Bearbeiten Sie die Details der ausgewählten Buchung.'
                : 'Erstellen Sie eine neue Buchung für eine Anlage.'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titel *</FormLabel>
                      <FormControl>
                        <Input placeholder="Buchungstitel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facilityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anlage *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Anlage auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {facilities.map((facility) => (
                            <SelectItem key={facility.id} value={facility.id.toString()}>
                              {facility.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team (optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Team auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Kein Team</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Typ auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {typeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Startzeit *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endzeit *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teilnehmer</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Anzahl Teilnehmer"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kosten (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Zusätzliche Informationen zur Buchung..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontaktperson</FormLabel>
                      <FormControl>
                        <Input placeholder="Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@beispiel.de" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="+49 123 456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notizen</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Interne Notizen..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setBookingModalOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  disabled={createBookingMutation.isPending || updateBookingMutation.isPending}
                >
                  {createBookingMutation.isPending || updateBookingMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Speichern...
                    </>
                  ) : (
                    selectedBooking ? 'Aktualisieren' : 'Erstellen'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buchung löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie die Buchung "{bookingToDelete?.title}" löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookingToDelete && deleteBookingMutation.mutate(bookingToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteBookingMutation.isPending}
            >
              {deleteBookingMutation.isPending ? 'Löschen...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Booking Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Buchungsdetails
            </DialogTitle>
          </DialogHeader>
          
          {viewingBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Titel</Label>
                  <p className="text-sm font-medium">{viewingBooking.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(viewingBooking.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Typ</Label>
                  <div className="mt-1">
                    {getTypeBadge(viewingBooking.type)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Anlage</Label>
                  <p className="text-sm">
                    {facilities.find(f => f.id === viewingBooking.facilityId)?.name || 'Unbekannte Anlage'}
                  </p>
                </div>
              </div>

              {viewingBooking.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Beschreibung</Label>
                  <p className="text-sm mt-1">{viewingBooking.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Startzeit</Label>
                  <p className="text-sm">
                    {format(new Date(viewingBooking.startTime), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Endzeit</Label>
                  <p className="text-sm">
                    {format(new Date(viewingBooking.endTime), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
              </div>

              {(viewingBooking.participants || viewingBooking.cost) && (
                <div className="grid grid-cols-2 gap-4">
                  {viewingBooking.participants && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Teilnehmer</Label>
                      <p className="text-sm">{viewingBooking.participants}</p>
                    </div>
                  )}
                  {viewingBooking.cost && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Kosten</Label>
                      <p className="text-sm">{viewingBooking.cost} €</p>
                    </div>
                  )}
                </div>
              )}

              {(viewingBooking.contactPerson || viewingBooking.contactEmail || viewingBooking.contactPhone) && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Kontaktinformationen</Label>
                  <div className="mt-2 space-y-1">
                    {viewingBooking.contactPerson && (
                      <p className="text-sm">
                        <span className="font-medium">Person:</span> {viewingBooking.contactPerson}
                      </p>
                    )}
                    {viewingBooking.contactEmail && (
                      <p className="text-sm">
                        <span className="font-medium">E-Mail:</span> {viewingBooking.contactEmail}
                      </p>
                    )}
                    {viewingBooking.contactPhone && (
                      <p className="text-sm">
                        <span className="font-medium">Telefon:</span> {viewingBooking.contactPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {viewingBooking.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notizen</Label>
                  <p className="text-sm mt-1">{viewingBooking.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Schließen
            </Button>
            {viewingBooking && (
              <Button onClick={() => {
                setIsDetailDialogOpen(false);
                handleEditBooking(viewingBooking);
              }}>
                Bearbeiten
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
