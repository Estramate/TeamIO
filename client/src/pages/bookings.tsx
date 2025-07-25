import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Booking, Facility, Team } from "@shared/schema";
import { bookingFormSchema } from "@shared/schema";
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
import { BookingForm } from "@/components/BookingForm";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Badge color functions
const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'training':
      return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100';
    case 'match':
      return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100';
    case 'event':
      return 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100';
    case 'maintenance':
      return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100';
  }
};

// Local form data type that matches the schema's string inputs before transformation
interface BookingFormData {
  title: string;
  description?: string;
  facilityId: string;
  teamId?: string;
  memberId?: string;
  type: string;
  startTime: string;
  endTime: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  participants?: string;
  cost?: string;
  status?: string;
  notes?: string;
  // Wiederkehrende Buchungen
  recurring?: boolean;
  recurringPattern?: string;
  recurringUntil?: string;
}

export default function Bookings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { setPage } = usePage();
  const queryClient = useQueryClient();

  // Set page title
  useEffect(() => {
    setPage("Buchungen", "Verwalten Sie Ihre Anlagenbuchungen und Termine");
  }, [setPage]);
  
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
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
  const [availabilityStatus, setAvailabilityStatus] = useState<{ available: boolean; message?: string; maxConcurrent?: number; currentBookings?: number } | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      facilityId: "",
      teamId: "",
      type: "training",
      status: "confirmed",
      startTime: "",
      endTime: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      notes: "",
      participants: "",
      cost: "",
      // Wiederholungsfelder
      recurring: false,
      recurringPattern: "",
      recurringUntil: ""
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

  // Helper function to get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'training':
        return <span className="text-lg">🏃</span>;
      case 'match':
        return <span className="text-lg">⚽</span>;
      case 'event':
        return <span className="text-lg">🎉</span>;
      case 'maintenance':
        return <span className="text-lg">🔧</span>;
      default:
        return <span className="text-lg">📅</span>;
    }
  };

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
        // Wiederholungsfelder
        recurring: bookingData.recurring || false,
        recurringPattern: bookingData.recurringPattern || undefined,
        recurringUntil: bookingData.recurringUntil || undefined,
      };
      
      return apiRequest("POST", `/api/clubs/${selectedClub?.id}/bookings`, cleanedData);
    },
    onSuccess: (response) => {
      // Unterschiedliche Toast-Nachrichten für normale vs. wiederkehrende Buchungen
      if (response.count && response.count > 1) {
        toast({
          title: "Erfolg",
          description: `${response.count} wiederkehrende Buchungen wurden erfolgreich erstellt`,
        });
      } else {
        toast({
          title: "Erfolg",
          description: "Buchung wurde erfolgreich erstellt",
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['/api/clubs', selectedClub?.id, 'bookings']
      });
      setBookingModalOpen(false);
      setSelectedBooking(null);
      form.reset();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      console.error("DEBUG: Create booking error:", error);
      const errorMessage = error.response?.data?.message || "Buchung konnte nicht erstellt werden.";
      toast({
        title: "Fehler",
        description: errorMessage,
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
        // Wiederholungsfelder
        recurring: bookingData.recurring || false,
        recurringPattern: bookingData.recurringPattern || undefined,
        recurringUntil: bookingData.recurringUntil || undefined,
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
      console.error("DEBUG: Update booking error:", error);
      const errorMessage = error.response?.data?.message || "Buchung konnte nicht aktualisiert werden.";
      toast({
        title: "Fehler",
        description: errorMessage,
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

  // Check availability mutation
  const checkAvailabilityMutation = useMutation({
    mutationFn: async ({ facilityId, startTime, endTime, excludeBookingId }: { 
      facilityId: number; 
      startTime: string; 
      endTime: string; 
      excludeBookingId?: number;
    }) => {
      const response = await apiRequest("POST", `/api/clubs/${selectedClub?.id}/bookings/check-availability`, {
        facilityId,
        startTime,
        endTime,
        excludeBookingId
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      console.log("DEBUG: Availability check result:", data);
      setIsCheckingAvailability(false);
      setAvailabilityStatus({
        available: data.available || false,
        maxConcurrent: data.maxConcurrent || 1,
        currentBookings: data.currentBookings || 0,
        message: data.available 
          ? `Verfügbar (${data.currentBookings || 0}/${data.maxConcurrent || 1} Buchungen)`
          : `Nicht verfügbar (${data.currentBookings || 0}/${data.maxConcurrent || 1} Buchungen)`
      });
    },
    onError: (error: any) => {
      console.error("DEBUG: Availability check error:", error);
      setIsCheckingAvailability(false);
      setAvailabilityStatus({
        available: false,
        message: "Fehler bei der Verfügbarkeitsprüfung"
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

  // Function to check availability
  const checkAvailability = () => {
    const facilityId = form.getValues("facilityId");
    const startTime = form.getValues("startTime");
    const endTime = form.getValues("endTime");
    
    if (facilityId && startTime && endTime) {
      console.log("DEBUG: Checking availability for:", { facilityId, startTime, endTime });
      setIsCheckingAvailability(true);
      checkAvailabilityMutation.mutate({ 
        facilityId: parseInt(facilityId), 
        startTime: new Date(startTime).toISOString(), 
        endTime: new Date(endTime).toISOString(),
        excludeBookingId: selectedBooking?.id
      });
    } else {
      setAvailabilityStatus(null);
    }
  };

  const handleCreateBooking = () => {
    setSelectedBooking(null);
    setAvailabilityStatus(null);
    form.reset();
    setBookingModalOpen(true);
  };

  // Helper function to convert UTC date to local datetime-local format
  const formatForDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString);
    // Subtract timezone offset to get local time representation
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    console.log('Editing booking with times:', { startTime: booking.startTime, endTime: booking.endTime });
    console.log('Formatted for form:', { 
      startTime: formatForDateTimeLocal(String(booking.startTime)), 
      endTime: formatForDateTimeLocal(String(booking.endTime)) 
    });
    
    form.reset({
      title: booking.title,
      description: booking.description || "",
      facilityId: booking.facilityId ? booking.facilityId.toString() : "",
      teamId: booking.teamId ? booking.teamId.toString() : undefined,
      type: booking.type,
      status: booking.status,
      startTime: formatForDateTimeLocal(String(booking.startTime)),
      endTime: formatForDateTimeLocal(String(booking.endTime)),
      contactPerson: booking.contactPerson || "",
      contactEmail: booking.contactEmail || "",
      contactPhone: booking.contactPhone || "",
      participants: booking.participants ? booking.participants.toString() : undefined,
      cost: booking.cost ? booking.cost : undefined,
      notes: booking.notes || "",
      // Wiederholungsfelder
      recurring: booking.recurring || false,
      recurringPattern: booking.recurringPattern || "",
      recurringUntil: booking.recurringUntil ? new Date(booking.recurringUntil).toISOString().split('T')[0] : ""
    });
    setBookingModalOpen(true);
  };

  const handleDeleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (bookingToDelete) {
      deleteBookingMutation.mutate(bookingToDelete.id);
    }
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
    console.log('Form submission - original data:', data);
    
    // Convert datetime-local to proper ISO strings preserving local time
    const processedData = {
      ...data,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
    };
    
    console.log('Form submission - processed data:', processedData);
    
    if (selectedBooking) {
      updateBookingMutation.mutate({ ...processedData, id: selectedBooking.id });
    } else {
      createBookingMutation.mutate(processedData);
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
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">{status}</Badge>;
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

      {/* Header Section with Search, Filters and Add Button */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buchungen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-xl border bg-background"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl border bg-background">
                <SelectValue placeholder="Typ wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl border bg-background">
                <SelectValue placeholder="Status wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={facilityFilter} onValueChange={setFacilityFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl border bg-background">
                <SelectValue placeholder="Anlage wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Anlagen</SelectItem>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id.toString()}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-xl border bg-background p-1">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-8 px-3 rounded-lg flex-1 sm:flex-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 px-3 rounded-lg flex-1 sm:flex-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Add Button */}
            <Button 
              onClick={handleCreateBooking} 
              className="w-full sm:w-auto sm:ml-auto h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buchung hinzufügen
            </Button>
          </div>
        </div>
      </div>

      {/* Bookings Content */}
      {isBookingsLoading ? (
        <div className="space-y-3 sm:space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm sm:text-base font-medium text-foreground">Keine Buchungen gefunden</h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground px-4">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? "Versuchen Sie, Ihre Suchkriterien anzupassen."
              : "Beginnen Sie mit dem Hinzufügen Ihrer ersten Buchung."}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBookings.map((booking: any) => {
            const facility = facilities.find((f: any) => f.id === booking.facilityId);
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            
            // Typ-spezifische Farben - keine Überschneidung mit Status-Farben
            const getTypeColor = (type: string) => {
              switch (type) {
                case 'training': return 'from-blue-500 to-blue-600';
                case 'match': return 'from-orange-500 to-orange-600';  // Hellorange für Spiele
                case 'event': return 'from-purple-500 to-purple-600';
                case 'maintenance': return 'from-amber-500 to-amber-600';  // Dunkleres Gelb für Wartung
                default: return 'from-gray-500 to-gray-600';
              }
            };

            const getTypeBadgeColor = (type: string) => {
              switch (type) {
                case 'training': return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100';
                case 'match': return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100';  // Hellorange
                case 'event': return 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100';
                case 'maintenance': return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100';  // Amber statt Orange
                default: return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100';
              }
            };

            const getTypeIcon = (type: string) => {
              switch (type) {
                case 'training': return '🏃‍♀️';
                case 'match': return '⚽';
                case 'event': return '🎉';
                case 'maintenance': return '🔧';
                default: return '📅';
              }
            };
            
            return (
              <Card key={booking.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md overflow-hidden">
                {/* Typ-spezifischer farbiger Header */}
                <div className={`h-2 bg-gradient-to-r ${getTypeColor(booking.type)}`}></div>
                
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getTypeIcon(booking.type)}</span>
                        <h3 
                          className="text-lg font-semibold text-foreground truncate cursor-pointer hover:underline"
                          onClick={() => handleViewBooking(booking)}
                          title={booking.title}
                        >
                          {booking.title}
                        </h3>
                      </div>
                      
                      {booking.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{booking.description}</p>
                      )}
                    </div>
                    
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
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      <span className="font-medium">{format(startTime, 'dd.MM.yyyy', { locale: de })}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      <span className="font-medium">
                        {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2 text-primary" />
                      <span className="font-medium truncate">{facility?.name || 'Unbekannte Anlage'}</span>
                    </div>
                    
                    {booking.participants && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-2 text-primary" />
                        <span className="font-medium">{booking.participants} Teilnehmer</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Badge 
                      className={`${getTypeBadgeColor(booking.type)} font-medium`}
                    >
                      {booking.type === 'training' ? 'Training' :
                       booking.type === 'match' ? 'Spiel' : 
                       booking.type === 'event' ? 'Veranstaltung' : 'Wartung'}
                    </Badge>
                    
                    <Badge 
                      className={
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100' : 
                        'bg-red-100 text-red-700 border-red-200 hover:bg-red-100'
                      }
                    >
                      {booking.status === 'confirmed' ? 'Bestätigt' :
                       booking.status === 'pending' ? 'Ausstehend' : 'Storniert'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Tabellenansicht
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Titel</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Datum</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Zeit</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Anlage</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Typ</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Teilnehmer</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking: any, index: number) => {
                  const facility = facilities.find((f: any) => f.id === booking.facilityId);
                  const startTime = new Date(booking.startTime);
                  const endTime = new Date(booking.endTime);
                  
                  const getTypeBadgeColor = (type: string) => {
                    switch (type) {
                      case 'training': return 'bg-blue-100 text-blue-700 border-blue-200';
                      case 'match': return 'bg-orange-100 text-orange-700 border-orange-200';  // Hellorange
                      case 'event': return 'bg-purple-100 text-purple-700 border-purple-200';
                      case 'maintenance': return 'bg-amber-100 text-amber-700 border-amber-200';  // Amber
                      default: return 'bg-gray-100 text-gray-700 border-gray-200';
                    }
                  };
                  
                  return (
                    <tr key={booking.id} className={`hover:bg-muted/50 transition-colors ${index !== filteredBookings.length - 1 ? 'border-b' : ''}`}>
                      <td className="py-3 px-4">
                        <div 
                          className="font-medium text-foreground cursor-pointer hover:text-primary hover:underline transition-colors"
                          onClick={() => handleViewBooking(booking)}
                          title={booking.title}
                        >
                          {booking.title}
                        </div>
                        {booking.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">{booking.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {format(startTime, 'dd.MM.yyyy', { locale: de })}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {facility?.name || 'Unbekannte Anlage'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getTypeBadgeColor(booking.type)} text-xs`}>
                          {booking.type === 'training' ? 'Training' :
                           booking.type === 'match' ? 'Spiel' : 
                           booking.type === 'event' ? 'Veranstaltung' : 'Wartung'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          className={`text-xs ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100' : 
                            'bg-red-100 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {booking.status === 'confirmed' ? 'Bestätigt' :
                           booking.status === 'pending' ? 'Ausstehend' : 'Storniert'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {booking.participants || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

          <BookingForm
            editingBooking={selectedBooking}
            onSuccess={() => setBookingModalOpen(false)}
            onCancel={() => setBookingModalOpen(false)}
            selectedClubId={selectedClub.id}
          />
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
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Booking Detail Dialog */}
      <Dialog open={!!viewingBooking} onOpenChange={() => setViewingBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              {viewingBooking?.title}
            </DialogTitle>
            <DialogDescription>
              Buchungsdetails und Informationen
            </DialogDescription>
          </DialogHeader>

          {viewingBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">ALLGEMEINE INFORMATIONEN</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Titel:</span>
                      <span className="text-sm font-medium">{viewingBooking.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Typ:</span>
                      <Badge className={`${getTypeBadgeColor(viewingBooking.type)} text-xs`}>
                        {viewingBooking.type === 'training' ? 'Training' :
                         viewingBooking.type === 'match' ? 'Spiel' : 
                         viewingBooking.type === 'event' ? 'Veranstaltung' : 'Wartung'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge 
                        className={`text-xs ${
                          viewingBooking.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100' :
                          viewingBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100' : 
                          'bg-red-100 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {viewingBooking.status === 'confirmed' ? 'Bestätigt' :
                         viewingBooking.status === 'pending' ? 'Ausstehend' : 'Storniert'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">ZEIT & ORT</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Datum:</span>
                      <span className="text-sm font-medium">
                        {format(new Date(viewingBooking.startTime), 'dd.MM.yyyy', { locale: de })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Zeit:</span>
                      <span className="text-sm font-medium">
                        {format(new Date(viewingBooking.startTime), 'HH:mm')} - {format(new Date(viewingBooking.endTime), 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Anlage:</span>
                      <span className="text-sm font-medium">
                        {facilities.find(f => f.id === viewingBooking.facilityId)?.name || 'Unbekannte Anlage'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {(viewingBooking.description || viewingBooking.participants || viewingBooking.cost) && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">ZUSÄTZLICHE DETAILS</h4>
                  <div className="space-y-3">
                    {viewingBooking.description && (
                      <div>
                        <span className="text-sm text-muted-foreground">Beschreibung:</span>
                        <p className="text-sm mt-1">{viewingBooking.description}</p>
                      </div>
                    )}
                    {viewingBooking.participants && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Teilnehmer:</span>
                        <span className="text-sm font-medium">{viewingBooking.participants}</span>
                      </div>
                    )}
                    {viewingBooking.cost && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Kosten:</span>
                        <span className="text-sm font-medium">€{viewingBooking.cost}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(viewingBooking.contactPerson || viewingBooking.contactEmail || viewingBooking.contactPhone) && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">KONTAKT</h4>
                  <div className="space-y-3">
                    {viewingBooking.contactPerson && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Person:</span>
                        <span className="text-sm font-medium">{viewingBooking.contactPerson}</span>
                      </div>
                    )}
                    {viewingBooking.contactEmail && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">E-Mail:</span>
                        <span className="text-sm font-medium">{viewingBooking.contactEmail}</span>
                      </div>
                    )}
                    {viewingBooking.contactPhone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Telefon:</span>
                        <span className="text-sm font-medium">{viewingBooking.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewingBooking.notes && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">NOTIZEN</h4>
                  <p className="text-sm">{viewingBooking.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewingBooking(null)}>
                  Schließen
                </Button>
                <Button onClick={() => {
                  setViewingBooking(null);
                  handleEditBooking(viewingBooking);
                }}>
                  Bearbeiten
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
