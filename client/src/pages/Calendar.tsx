import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Gift, Users, MoreHorizontal, Edit, Trash2, AlertCircle, Check, X } from "lucide-react";
import { BookingForm } from "@/components/BookingForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays, startOfWeek, endOfWeek, startOfDay, endOfDay, getMonth, getDate, isAfter, compareAsc } from "date-fns";
import { de } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

// Calendar view types
type CalendarView = 'month' | 'week' | '3day' | 'day';

// Form schemas
const eventFormSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Startdatum ist erforderlich"),
  endDate: z.string().optional(),
  teamId: z.union([z.string(), z.number()]).optional(),
  location: z.string().optional(),
});

const bookingFormSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().optional(),
  facilityId: z.string().min(1, "Anlage ist erforderlich"),
  teamId: z.string().optional(),
  startTime: z.string().min(1, "Startzeit ist erforderlich"),
  endTime: z.string().min(1, "Endzeit ist erforderlich"),
  type: z.enum(["training", "game", "event", "maintenance"]),
  status: z.enum(["confirmed", "pending", "cancelled"]),
  participants: z.number().optional(),
  cost: z.number().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  recurring: z.boolean().optional(),
  recurringPattern: z.string().optional(),
  recurringUntil: z.string().optional(),
});

// Color schemes matching bookings page - updated to avoid conflicts
const getBookingTypeColor = (type: string) => {
  switch (type) {
    case 'training': return 'bg-blue-500';
    case 'match': return 'bg-orange-500';    // Hellorange für Spiele
    case 'game': return 'bg-orange-500';     // Alias für 'match'
    case 'event': return 'bg-purple-500';
    case 'maintenance': return 'bg-amber-500';  // Amber für Wartung
    default: return 'bg-gray-500';
  }
};

const getBookingTypeIcon = (type: string) => {
  switch (type) {
    case 'training': return '⚽';
    case 'game': return '🏆';
    case 'event': return '🎉';
    case 'maintenance': return '🔧';
    default: return '📅';
  }
};

export default function Calendar() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { setPage } = usePage();
  const queryClient = useQueryClient();

  // Set page title
  useEffect(() => {
    setPage("Kalender", "Übersicht über alle Termine und Veranstaltungen");
  }, [setPage]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  
  // Calendar availability state
  const [calendarAvailabilityStatus, setCalendarAvailabilityStatus] = useState<{ available: boolean; message?: string; maxConcurrent?: number; currentBookings?: number } | null>(null);
  const [isCheckingCalendarAvailability, setIsCheckingCalendarAvailability] = useState(false);
  
  // Drag & Drop state
  const [draggedEvent, setDraggedEvent] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [snapPreview, setSnapPreview] = useState<{ hour: number; visible: boolean }>({ hour: 0, visible: false });
  const [resizingEvent, setResizingEvent] = useState<any>(null);
  const [resizeDirection, setResizeDirection] = useState<'start' | 'end' | null>(null);
  const [resizeStartY, setResizeStartY] = useState<number>(0);
  const [resizeStartTime, setResizeStartTime] = useState<Date | null>(null);
  const [resizeEndTime, setResizeEndTime] = useState<Date | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Data fetching
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

  const { data: members = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'members'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'players'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: facilities = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'facilities'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  // Forms
  const eventForm = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      teamId: "",
      location: "",
    },
  });

  const bookingForm = useForm({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      facilityId: "",
      teamId: "",
      startTime: "",
      endTime: "",
      type: "training" as const,
      status: "confirmed" as const,
      participants: undefined,
      cost: undefined,
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      notes: "",
      recurring: false,
      recurringPattern: "",
      recurringUntil: "",
    },
  });

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/clubs/${selectedClub?.id}/events`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'events'] });
      setShowEventModal(false);
      eventForm.reset();
      toast({ title: "Termin erstellt", description: "Der Termin wurde erfolgreich erstellt." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message || "Termin konnte nicht erstellt werden.", variant: "destructive" });
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest('PATCH', `/api/clubs/${selectedClub?.id}/events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'events'] });
      setShowEventModal(false);
      setEditingEvent(null);
      eventForm.reset();
      toast({ title: "Termin aktualisiert", description: "Der Termin wurde erfolgreich aktualisiert." });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/clubs/${selectedClub?.id}/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'events'] });
      toast({ title: "Termin gelöscht", description: "Der Termin wurde erfolgreich gelöscht." });
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/clubs/${selectedClub?.id}/bookings`, data),
    onSuccess: (response: any) => {
      // Invalidate alle booking-relevanten Queries
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'events'] });
      setShowBookingModal(false);
      bookingForm.reset();
      
      // Handle recurring booking success message
      if (response.createdCount && response.createdCount > 1) {
        toast({ 
          title: "Wiederkehrende Buchungen erstellt", 
          description: `${response.createdCount} Buchungen wurden erfolgreich erstellt.` 
        });
      } else {
        toast({ title: "Buchung erstellt", description: "Die Buchung wurde erfolgreich erstellt." });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Fehler", 
        description: error.message || "Buchung konnte nicht erstellt werden.", 
        variant: "destructive" 
      });
    }
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest('PATCH', `/api/clubs/${selectedClub?.id}/bookings/${id}`, data),
    onSuccess: () => {
      // Invalidate alle booking-relevanten Queries
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'events'] });
      setShowBookingModal(false);
      setEditingBooking(null);
      bookingForm.reset();
      toast({ title: "Buchung aktualisiert", description: "Die Buchung wurde erfolgreich aktualisiert." });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/clubs/${selectedClub?.id}/bookings/${id}`),
    onSuccess: () => {
      // Invalidate alle booking-relevanten Queries
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'events'] });
      toast({ title: "Buchung gelöscht", description: "Die Buchung wurde erfolgreich gelöscht." });
    },
  });



  // Helper functions
  const getBirthdays = (date: Date) => {
    const birthdays: any[] = [];
    
    [...(members as any[]), ...(players as any[])].forEach(person => {
      if (person.birthDate) {
        const birthDate = new Date(person.birthDate);
        if (getMonth(birthDate) === getMonth(date) && getDate(birthDate) === getDate(date)) {
          birthdays.push({
            name: `${person.firstName} ${person.lastName}`,
            type: 'birthday',
            isPlayer: !!(person as any).position
          });
        }
      }
    });
    
    return birthdays;
  };

  // Get facility name for booking
  const getFacilityName = (facilityId: number) => {
    const facility = (facilities as any[]).find(f => f.id === facilityId);
    return facility?.name || 'Unbekannte Anlage';
  };

  // Get booking type label
  const getBookingTypeLabel = (type: string) => {
    switch (type) {
      case 'training': return 'Training';
      case 'match': return 'Spiel';
      case 'game': return 'Spiel';
      case 'event': return 'Veranstaltung';
      case 'maintenance': return 'Wartung';
      default: return 'Sonstiges';
    }
  };

  // Generate time slots for daily views (6:00 - 24:00)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        position: ((hour - 6) / 18) * 100 // Percentage position from 6:00 to 24:00
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Helper function to calculate event position and height in time grid
  const getEventTimePosition = (event: any) => {
    let startHour = 8; // Default start hour
    let endHour = 9;   // Default end hour (1 hour duration)
    
    if (event.source === 'booking') {
      // For bookings, parse the time strings
      if (event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        startHour = hours + minutes / 60;
      }
      if (event.endTime) {
        const [hours, minutes] = event.endTime.split(':').map(Number);
        endHour = hours + minutes / 60;
      }
    } else if (event.source === 'event') {
      // For events, use the date and time
      const startTime = new Date(event.startDate || event.date);
      const endTime = new Date(event.endDate || event.date);
      
      startHour = startTime.getHours() + startTime.getMinutes() / 60;
      endHour = endTime.getHours() + endTime.getMinutes() / 60;
    }
    
    // Clamp to 6:00-24:00 range
    const clampedStart = Math.max(6, Math.min(24, startHour));
    const clampedEnd = Math.max(clampedStart + 0.5, Math.min(24, endHour)); // Minimum 30min duration
    
    // Calculate pixel positions (each hour = 50px)
    const top = (clampedStart - 6) * 50; // Pixels from top
    const height = (clampedEnd - clampedStart) * 50; // Height in pixels
    
    return { top, height: Math.max(height, 25) }; // Minimum 25px height for visibility
  };

  // Helper function to calculate overlapping events layout
  const calculateEventLayout = (events: any[]) => {
    if (events.length === 0) return [];
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => {
      const aPos = getEventTimePosition(a);
      const bPos = getEventTimePosition(b);
      return aPos.top - bPos.top;
    });

    // Create groups of overlapping events
    const groups: any[][] = [];
    
    sortedEvents.forEach(event => {
      const eventPos = getEventTimePosition(event);
      const eventStart = eventPos.top;
      const eventEnd = eventPos.top + eventPos.height;
      
      // Find if this event overlaps with any existing group
      let foundGroup = false;
      
      for (const group of groups) {
        const groupOverlaps = group.some(groupEvent => {
          const groupPos = getEventTimePosition(groupEvent);
          const groupStart = groupPos.top;
          const groupEnd = groupPos.top + groupPos.height;
          
          // Check for any overlap
          return !(eventEnd <= groupStart || eventStart >= groupEnd);
        });
        
        if (groupOverlaps) {
          group.push(event);
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        groups.push([event]);
      }
    });

    // Layout each group
    const layoutEvents: any[] = [];
    
    groups.forEach(group => {
      const groupSize = group.length;
      
      group.forEach((event, index) => {
        const eventPos = getEventTimePosition(event);
        const width = 100 / groupSize;
        const left = index * width;
        
        layoutEvents.push({
          ...event,
          ...eventPos,
          column: index,
          totalColumns: groupSize,
          width,
          left
        });
      });
    });

    return layoutEvents;
  };

  // Drag & Drop handlers
  const handleDragStart = (event: any, e: React.DragEvent) => {
    setDraggedEvent(event);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setIsDragging(false);
    setSnapPreview({ hour: 0, visible: false });
  };

  // State to prevent modal opening during resize
  const [isResizing, setIsResizing] = useState(false);



  // Resize handlers - only for end time (extending events)
  const handleResizeStart = (event: any, direction: 'end', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizingEvent(event);
    setResizeDirection('end');
    setResizeStartY(e.clientY);
    setResizeStartTime(new Date(event.startTime));
    
    console.log('Resize start - original event:', event);
    console.log('Original startTime:', event.startTime, 'endTime:', event.endTime);
    
    if (event.endTime) {
      if (typeof event.endTime === 'string' && event.endTime.includes(':') && !event.endTime.includes('T')) {
        // Time string like "20:00" - combine with start date but stay in local time
        const [hours, minutes] = event.endTime.split(':').map(Number);
        const startDate = new Date(event.startTime);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), hours, minutes || 0, 0, 0);
        setResizeEndTime(endDate);
        console.log('Parsed time string endTime:', endDate);
      } else {
        const endDate = new Date(event.endTime);
        setResizeEndTime(endDate);
        console.log('Parsed ISO endTime:', endDate);
      }
    }
    
    const moveHandler = (e: MouseEvent) => handleResizeMove(e);
    const upHandler = (e: MouseEvent) => handleResizeEnd(e);
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
    
    // Store handlers on the event listeners directly for proper cleanup
    const cleanup = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };
    
    // Store cleanup function
    (window as any).resizeCleanup = cleanup;
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingEvent || resizeDirection !== 'end' || !resizeEndTime) return;
    
    const deltaY = e.clientY - resizeStartY;
    const hourDelta = deltaY / 50; // 50px per hour
    const snappedHourDelta = Math.round(hourDelta * 2) / 2; // Snap to 30-minute intervals
    
    const newEndTime = new Date(resizeEndTime.getTime() + snappedHourDelta * 60 * 60 * 1000);
    const hour = newEndTime.getHours() + (newEndTime.getMinutes() / 60);
    
    if (hour >= 6 && hour <= 24) {
      setSnapPreview({ hour, visible: true });
    }
  };

  const handleResizeEnd = (e: MouseEvent) => {
    if (!resizingEvent || !resizeDirection) return;
    
    const deltaY = e.clientY - resizeStartY;
    const hourDelta = deltaY / 50;
    const snappedHourDelta = Math.round(hourDelta * 2) / 2;
    
    console.log('Resize end - deltaY:', deltaY, 'hourDelta:', hourDelta, 'snappedHourDelta:', snappedHourDelta);
    console.log('Resize direction:', resizeDirection, 'resizeStartTime:', resizeStartTime, 'resizeEndTime:', resizeEndTime);
    
    let newStartTime = resizeStartTime;
    let newEndTime = resizeEndTime;
    
    if (resizeDirection === 'start' && resizeStartTime) {
      newStartTime = new Date(resizeStartTime.getTime() + snappedHourDelta * 60 * 60 * 1000);
      console.log('New start time:', newStartTime);
    } else if (resizeDirection === 'end' && resizeEndTime) {
      newEndTime = new Date(resizeEndTime.getTime() + snappedHourDelta * 60 * 60 * 1000);
      console.log('New end time:', newEndTime);
    }
    
    // Only handle end time resizing now
    if (resizeDirection === 'end' && newStartTime && newEndTime) {
      // Ensure minimum duration of 30 minutes
      if (newEndTime <= newStartTime) {
        const minDuration = 30 * 60 * 1000; // 30 minutes minimum
        newEndTime = new Date(newStartTime.getTime() + minDuration);
        console.log('Auto-adjusted end time to maintain minimum duration:', newEndTime);
      }
      
      console.log('Updating booking with new end time:', { start: newStartTime, end: newEndTime });
      console.log('Timezone info - start offset:', newStartTime.getTimezoneOffset(), 'end offset:', newEndTime.getTimezoneOffset());
      
      const updateData = {
        title: resizingEvent.title,
        description: resizingEvent.description || '',
        facilityId: resizingEvent.facilityId,
        teamId: resizingEvent.teamId,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
        type: resizingEvent.type,
        status: resizingEvent.status || 'confirmed',
        participants: resizingEvent.participants || 0,
        cost: resizingEvent.cost || null,
        contactPerson: resizingEvent.contactPerson || '',
        contactEmail: resizingEvent.contactEmail || null,
        contactPhone: resizingEvent.contactPhone || '',
        notes: resizingEvent.notes || '',
        recurring: resizingEvent.recurring || false,
        recurringPattern: resizingEvent.recurringPattern || null,
        recurringUntil: resizingEvent.recurringUntil || null
      };
      
      updateBookingMutation.mutate({ id: resizingEvent.id, data: updateData });
    }
    
    // Clean up event listeners
    const cleanup = (window as any).resizeCleanup;
    if (cleanup) cleanup();
    
    // Clean up state
    setResizingEvent(null);
    setResizeDirection(null);
    setResizeStartY(0);
    setResizeStartTime(null);
    setResizeEndTime(null);
    setSnapPreview({ hour: 0, visible: false });
    
    // Delay to prevent modal opening after resize
    setTimeout(() => {
      setIsResizing(false);
    }, 50);
    
    delete (window as any).resizeMoveHandler;
    delete (window as any).resizeUpHandler;
  };

  // Calendar availability check function
  const checkCalendarAvailability = async () => {
    const facilityId = bookingForm.getValues('facilityId');
    const startTime = bookingForm.getValues('startTime');
    const endTime = bookingForm.getValues('endTime');
    
    if (!facilityId || !startTime || !endTime) {
      setCalendarAvailabilityStatus({
        available: false,
        message: "Bitte füllen Sie alle Felder aus"
      });
      return;
    }
    
    setIsCheckingCalendarAvailability(true);
    
    try {
      console.log('Checking availability...', { facilityId, startTime, endTime });
      
      const response = await apiRequest("POST", `/api/clubs/${selectedClub?.id}/bookings/check-availability`, {
        facilityId: parseInt(facilityId),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        excludeBookingId: editingBooking?.id
      });
      
      const data = await response.json();
      console.log('Availability check result:', data);
      
      setCalendarAvailabilityStatus({
        available: data.available || false,
        maxConcurrent: data.maxConcurrent || 1,
        currentBookings: data.currentBookings || 0,
        message: data.available 
          ? `Verfügbar (${data.currentBookings || 0}/${data.maxConcurrent || 1} Buchungen)`
          : `Nicht verfügbar (${data.currentBookings || 0}/${data.maxConcurrent || 1} Buchungen)`
      });
    } catch (error) {
      console.error('Availability check error:', error);
      setCalendarAvailabilityStatus({
        available: false,
        message: "Fehler bei der Verfügbarkeitsprüfung"
      });
    }
    
    setIsCheckingCalendarAvailability(false);
  };

  const handleDrop = (e: React.DragEvent, newDate: Date, newHour?: number) => {
    e.preventDefault();
    if (!draggedEvent) return;

    console.log('Drag & Drop - Original event:', draggedEvent);

    const oldStartTime = new Date(draggedEvent.startTime || draggedEvent.date);
    
    // Handle different endTime formats for duration calculation
    let duration = 2 * 60 * 60 * 1000; // Default 2 hours
    
    try {
      let oldEndTime: Date;
      
      if (draggedEvent.endTime) {
        if (typeof draggedEvent.endTime === 'string' && draggedEvent.endTime.includes(':') && !draggedEvent.endTime.includes('T')) {
          // Handle time-only format like "20:00"
          const [hours, minutes] = draggedEvent.endTime.split(':').map(Number);
          oldEndTime = new Date(oldStartTime);
          oldEndTime.setHours(hours, minutes || 0, 0, 0);
        } else {
          // Handle full datetime format
          oldEndTime = new Date(draggedEvent.endTime);
        }
        
        // Only use calculated duration if dates are valid
        if (!isNaN(oldStartTime.getTime()) && !isNaN(oldEndTime.getTime())) {
          duration = oldEndTime.getTime() - oldStartTime.getTime();
        }
      } else {
        oldEndTime = new Date(draggedEvent.date);
      }
    } catch (error) {
      console.warn('Error calculating duration, using default:', error);
    }

    let newStartTime: Date;
    if (newHour !== undefined) {
      // Time-based drop (day/week view) with 30-minute snapping
      newStartTime = new Date(newDate);
      const hours = Math.floor(newHour);
      const minutes = (newHour % 1) * 60;
      newStartTime.setHours(hours, minutes, 0, 0);
    } else {
      // Date-based drop (month view)
      newStartTime = new Date(newDate);
      newStartTime.setHours(oldStartTime.getHours(), oldStartTime.getMinutes());
    }

    const newEndTime = new Date(newStartTime.getTime() + duration);
    
    console.log('Drag & Drop - New times:', {
      start: newStartTime.toISOString(),
      end: newEndTime.toISOString(),
      duration: duration / (60 * 60 * 1000) + ' hours'
    });

    // Update the event - ensure proper data structure for backend
    if (draggedEvent.source === 'booking') {
      const updateData = {
        title: draggedEvent.title,
        description: draggedEvent.description || '',
        facilityId: draggedEvent.facilityId,
        teamId: draggedEvent.teamId,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
        type: draggedEvent.type,
        status: draggedEvent.status || 'confirmed',
        participants: draggedEvent.participants || 0,
        cost: draggedEvent.cost || null,
        contactPerson: draggedEvent.contactPerson || '',
        contactEmail: draggedEvent.contactEmail || null,
        contactPhone: draggedEvent.contactPhone || '',
        notes: draggedEvent.notes || '',
        recurring: draggedEvent.recurring || false,
        recurringPattern: draggedEvent.recurringPattern || null,
        recurringUntil: draggedEvent.recurringUntil || null
      };
      updateBookingMutation.mutate({ id: draggedEvent.id, data: updateData });
    } else {
      // Events sind jetzt auch Bookings mit type='event'
      const updateData = {
        title: draggedEvent.title,
        description: draggedEvent.description || '',
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
        location: draggedEvent.location || '',
        type: 'event',
        status: 'confirmed'
      };
      updateBookingMutation.mutate({ id: draggedEvent.id, data: updateData });
    }

    setDraggedEvent(null);
    setIsDragging(false);
    setSnapPreview({ hour: 0, visible: false });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const totalHours = (y / rect.height) * 18;
      const snappedHours = Math.round(totalHours * 2) / 2;
      const finalHour = snappedHours + 6;
      
      setSnapPreview({ hour: finalHour, visible: true });
    }
  };

  // Combine events, bookings and birthdays for calendar display
  const allEvents = [
    ...(events as any[]).map((event: any) => ({
      ...event,
      date: new Date(event.startTime), // Events haben startTime, nicht startDate
      time: format(new Date(event.startTime), 'HH:mm'),
      endTime: event.endTime ? format(new Date(event.endTime), 'HH:mm') : null,
      source: 'event',
      color: 'bg-indigo-500',
      icon: '📅',
      typeLabel: 'Termin'
    })),
    ...(bookings as any[]).filter(b => b.status !== 'cancelled').map((booking: any) => ({
      ...booking,
      date: new Date(booking.startTime),
      time: format(new Date(booking.startTime), 'HH:mm'),
      endTime: format(new Date(booking.endTime), 'HH:mm'),
      source: 'booking',
      color: getBookingTypeColor(booking.type),
      icon: getBookingTypeIcon(booking.type),
      typeLabel: getBookingTypeLabel(booking.type),
      facilityName: getFacilityName(booking.facilityId)
    }))
  ];

  // Calendar navigation and event handling
  const getCalendarDays = () => {
    switch (calendarView) {
      case 'day':
        return [currentDate];
      case '3day':
        return [currentDate, addDays(currentDate, 1), addDays(currentDate, 2)];
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
      case 'month':
      default:
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
  };

  const getEventsForDate = (date: Date) => {
    const dayEvents = allEvents.filter(event => isSameDay(event.date, date));
    const birthdays = getBirthdays(date);
    
    return [
      ...dayEvents,
      ...birthdays.map(birthday => ({
        ...birthday,
        date,
        time: '',
        endTime: '',
        source: 'birthday',
        color: 'bg-pink-500',
        icon: '🎂'
      }))
    ];
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const navigateCalendar = (direction: 'prev' | 'next') => {
    switch (calendarView) {
      case 'day':
      case '3day':
        setCurrentDate(addDays(currentDate, direction === 'prev' ? (calendarView === 'day' ? -1 : -3) : (calendarView === 'day' ? 1 : 3)));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, direction === 'prev' ? -7 : 7));
        break;
      case 'month':
        setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        break;
    }
  };

  // Form handlers
  const handleEventSubmit = (data: any) => {
    const processedData = {
      ...data,
      clubId: selectedClub?.id,
      teamId: data.teamId ? Number(data.teamId) : null,
    };

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: processedData });
    } else {
      createEventMutation.mutate(processedData);
    }
  };

  const handleBookingSubmit = (data: any) => {
    console.log('Calendar booking form submitted:', data);
    
    // Create dates in local timezone and convert to proper ISO for backend
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    
    console.log('Calendar local datetime inputs:', { startTime, endTime });
    console.log('Calendar converting to ISO:', { 
      startTimeISO: startTime.toISOString(), 
      endTimeISO: endTime.toISOString() 
    });
    
    const processedData = {
      ...data,
      clubId: selectedClub?.id,
      facilityId: Number(data.facilityId),
      teamId: data.teamId ? Number(data.teamId) : null,
      participants: data.participants ? Number(data.participants) : null,
      cost: data.cost || null,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      // Include recurring fields
      recurring: data.recurring || false,
      recurringPattern: data.recurring ? data.recurringPattern : null,
      recurringUntil: data.recurring && data.recurringUntil ? new Date(data.recurringUntil).toISOString() : null,
    };

    console.log('Calendar processed data:', processedData);

    if (editingBooking) {
      updateBookingMutation.mutate({ id: editingBooking.id, data: processedData });
    } else {
      createBookingMutation.mutate(processedData);
    }
  };

  const openEventModal = (event?: any) => {
    if (event) {
      setEditingEvent(event);
      eventForm.reset({
        title: event.title,
        description: event.description || '',
        startDate: format(new Date(event.startDate), 'yyyy-MM-dd\'T\'HH:mm'),
        endDate: event.endDate ? format(new Date(event.endDate), 'yyyy-MM-dd\'T\'HH:mm') : '',
        teamId: event.teamId || '',
        location: event.location || '',
      });
    } else {
      setEditingEvent(null);
      eventForm.reset();
    }
    setShowEventModal(true);
  };

  // Helper function to convert UTC date to local datetime-local format
  const formatForDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString);
    // Subtract timezone offset to get local time representation
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  };

  const openBookingModal = (booking?: any) => {
    // Reset availability status when opening modal
    setCalendarAvailabilityStatus(null);
    setIsCheckingCalendarAvailability(false);
    
    if (booking) {
      setEditingBooking(booking);
      console.log('Opening booking modal with:', booking);
      console.log('Original startTime:', booking.startTime, 'endTime:', booking.endTime);
      console.log('Formatted for form:', {
        startTime: formatForDateTimeLocal(booking.startTime),
        endTime: formatForDateTimeLocal(booking.endTime)
      });
      
      bookingForm.reset({
        title: booking.title,
        description: booking.description || '',
        facilityId: booking.facilityId.toString(),
        startTime: formatForDateTimeLocal(booking.startTime),
        endTime: formatForDateTimeLocal(booking.endTime),
        type: booking.type,
        status: booking.status,
      });
    } else {
      setEditingBooking(null);
      bookingForm.reset();
    }
    setShowBookingModal(true);
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
      {/* Header with View Controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          {/* View Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex bg-card rounded-xl border p-1">
              {([
                { key: 'month', label: 'Monat' },
                { key: 'week', label: 'Woche' },
                { key: '3day', label: '3 Tage' },
                { key: 'day', label: 'Tag' }
              ] as const).map(({ key, label }) => (
                <Button
                  key={key}
                  variant={calendarView === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarView(key)}
                  className={calendarView === key ? "bg-primary text-primary-foreground" : ""}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => openBookingModal()}
              className="bg-blue-600 hover:bg-blue-700 h-10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buchung
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className={`grid gap-6 ${calendarView === 'month' ? 'lg:grid-cols-4' : ''}`}>
        {/* Main Calendar */}
        <div className={calendarView === 'month' ? 'lg:col-span-3' : ''}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {calendarView === 'month' && format(currentDate, 'MMMM yyyy', { locale: de })}
                  {calendarView === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM.', { locale: de })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM.yyyy', { locale: de })}`}
                  {calendarView === '3day' && `${format(currentDate, 'dd.MM.', { locale: de })} - ${format(addDays(currentDate, 2), 'dd.MM.yyyy', { locale: de })}`}
                  {calendarView === 'day' && format(currentDate, 'EEEE, dd. MMMM yyyy', { locale: de })}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateCalendar('prev')}
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
                    onClick={() => navigateCalendar('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Render Calendar Based on View */}
              {calendarView === 'month' && (
                <>
                  {/* Month View */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {getCalendarDays().map((day) => {
                      const dayEvents = getEventsForDate(day);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            relative p-2 min-h-[80px] text-left border rounded-lg hover:bg-muted/50 transition-all duration-200
                            ${!isSameMonth(day, currentDate) ? 'text-muted-foreground bg-muted/20' : ''}
                            ${isSelected ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20' : 'border-border'}
                            ${isToday ? 'bg-primary/5 font-semibold ring-1 ring-primary/30' : ''}
                          `}
                        >
                          <div className="text-sm mb-1">{format(day, 'd')}</div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((event, index) => (
                              <div
                                key={index}
                                className={`text-xs px-1.5 py-0.5 rounded-full truncate text-white font-medium flex items-center gap-1 ${event.color}`}
                                title={`${event.icon || ''} ${event.typeLabel || event.source} - ${event.time} ${event.title || event.name}${event.facilityName ? ` (${event.facilityName})` : ''}`}
                              >
                                <span className="text-xs">{event.icon}</span>
                                <span className="truncate">
                                  {event.source === 'booking' ? `${event.typeLabel}: ${event.title}` : (event.title || event.name)}
                                </span>
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                                +{dayEvents.length - 3} weitere
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Day View with Timeline */}
              {calendarView === 'day' && (
                <div className="bg-card rounded-lg border">
                  <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-center">
                      {format(currentDate, 'EEEE, dd. MMMM yyyy', { locale: de })}
                    </h3>
                  </div>
                  
                  <div className="flex h-[900px] overflow-y-auto">
                    {/* Time column */}
                    <div className="w-20 border-r bg-muted/20">
                      {timeSlots.map((slot) => (
                        <div
                          key={slot.hour}
                          className="h-[50px] flex items-start justify-center text-xs text-muted-foreground pt-1"
                          style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }}
                        >
                          {slot.label}
                        </div>
                      ))}
                    </div>
                    
                    {/* Events column */}
                    <div 
                      className="flex-1 relative overflow-hidden"
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const totalHours = (y / rect.height) * 18;
                        // Snap to 30-minute intervals
                        const snappedHours = Math.round(totalHours * 2) / 2;
                        const finalHour = snappedHours + 6;
                        console.log('Day view drop - totalHours:', totalHours, 'snapped:', snappedHours, 'final:', finalHour);
                        handleDrop(e, currentDate, finalHour);
                      }}
                    >
                      {/* Hour grid lines */}
                      {timeSlots.map((slot) => (
                        <div
                          key={slot.hour}
                          className="absolute inset-x-0 h-[1px] border-b border-border/30"
                          style={{ top: `${(slot.hour - 6) * 50}px` }}
                        />
                      ))}
                      
                      {/* Snap preview line for day view */}
                      {snapPreview.visible && snapPreview.hour >= 6 && snapPreview.hour <= 24 && (
                        <div
                          className="absolute inset-x-0 border-t-2 border-red-500 border-dashed z-50 pointer-events-none"
                          style={{ 
                            top: `${(snapPreview.hour - 6) * 50}px`,
                            boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)'
                          }}
                        >
                          <div className="absolute -left-2 -top-1 w-4 h-2 bg-red-500 rounded-sm"></div>
                          <div className="absolute -right-2 -top-1 w-4 h-2 bg-red-500 rounded-sm"></div>
                          <span className="absolute -top-6 left-4 text-xs font-medium text-red-500 bg-white dark:bg-gray-800 px-1 rounded shadow-sm">
                            {String(Math.floor(snapPreview.hour)).padStart(2, '0')}:{snapPreview.hour % 1 === 0.5 ? '30' : '00'}
                          </span>
                        </div>
                      )}
                      
                      {/* Events with proper pixel positioning */}
                      {calculateEventLayout(getEventsForDate(currentDate)).map((event, index) => {
                        return (
                          <div
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(event, e)}
                            onDragEnd={handleDragEnd}
                            className={`absolute rounded-md p-2 text-white cursor-move hover:opacity-90 transition-all ${event.color} ${
                              isDragging && draggedEvent?.id === event.id ? 'opacity-50' : ''
                            }`}
                            style={{
                              top: `${event.top}px`,
                              height: `${event.height}px`,
                              left: `calc(${event.left}% + 8px)`,
                              width: `calc(${event.width}% - 16px)`,
                              minHeight: '25px',
                              zIndex: 10 + index,
                            }}
                            onClick={() => {
                              // Don't open modal if we just finished resizing
                              if (isResizing) return;
                              
                              if (event.source === 'event') {
                                setEditingEvent(event);
                                setShowEventModal(true);
                              } else if (event.source === 'booking') {
                                // Reset form with booking data for day view - handle endTime correctly
                                const formatSafeDate = (dateValue: any) => {
                                  if (!dateValue) return '';
                                  try {
                                    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
                                    return isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd\'T\'HH:mm');
                                  } catch {
                                    return '';
                                  }
                                };
                                
                                // Handle endTime - if it's just time string, combine with startTime date
                                let endTimeFormatted = '';
                                console.log('Day view processing endTime:', event.endTime, 'startTime:', event.startTime);
                                
                                if (event.endTime) {
                                  if (event.endTime.includes('T') || event.endTime.includes('-')) {
                                    // Full datetime
                                    endTimeFormatted = formatSafeDate(event.endTime);
                                  } else if (event.endTime.includes(':')) {
                                    // Just time like "20:00", combine with startTime date
                                    try {
                                      const startDate = new Date(event.startTime);
                                      const [hours, minutes] = event.endTime.split(':').map(Number);
                                      const endDate = new Date(startDate);
                                      endDate.setHours(hours, minutes || 0, 0, 0);
                                      endTimeFormatted = format(endDate, 'yyyy-MM-dd\'T\'HH:mm');
                                      console.log('Day view formatted endTime:', endTimeFormatted);
                                    } catch (error) {
                                      console.error('Day view error formatting endTime:', error);
                                      endTimeFormatted = '';
                                    }
                                  }
                                }
                                
                                console.log('Day view final endTimeFormatted:', endTimeFormatted);
                                
                                bookingForm.reset({
                                  title: event.title || '',
                                  description: event.description || '',
                                  facilityId: event.facilityId?.toString() || '',
                                  teamId: event.teamId?.toString() || '',
                                  startTime: formatSafeDate(event.startTime || event.start || event.startDateTime),
                                  endTime: endTimeFormatted,
                                  type: event.type || 'training',
                                  status: event.status || 'confirmed',
                                  participants: event.participants || 0,
                                  cost: event.cost || 0,
                                  contactPerson: event.contactPerson || '',
                                  contactEmail: event.contactEmail || '',
                                  contactPhone: event.contactPhone || '',
                                  notes: event.notes || '',
                                });
                                setEditingBooking(event);
                                setShowBookingModal(true);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2 text-xs font-medium">
                              <span>{event.icon}</span>
                              <span className="truncate">
                                {event.source === 'booking' ? `${event.typeLabel}: ${event.title}` : (event.title || event.name)}
                              </span>
                            </div>
                            {event.time && (
                              <div className="text-xs opacity-90 mt-1">
                                {event.time}
                                {event.endTime && ` - ${event.endTime}`}
                              </div>
                            )}
                            {event.facilityName && event.height >= 60 && (
                              <div className="text-xs opacity-80 mt-1 truncate">
                                📍 {event.facilityName}
                              </div>
                            )}
                            
                            {/* Resize handle - only bottom for extending end time */}
                            {event.source === 'booking' && event.height >= 40 && (
                              <div
                                className="absolute inset-x-0 bottom-0 h-3 cursor-ns-resize flex items-center justify-center group"
                                onMouseDown={(e) => handleResizeStart(event, 'end', e)}
                              >
                                <div className="w-8 h-1 bg-white/40 rounded-full group-hover:bg-white/80 transition-colors">
                                  <div className="w-full h-full bg-white/60 rounded-full"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {getEventsForDate(currentDate).length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground mt-4">Keine Termine für diesen Tag</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Week/3-Day Views with Timeline */}
              {(calendarView === 'week' || calendarView === '3day') && (
                <div className="bg-card rounded-lg border">
                  {/* Header with days */}
                  <div className="flex border-b">
                    <div className="w-20 border-r"></div>
                    {getCalendarDays().map((day) => {
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div key={day.toISOString()} className={`flex-1 p-3 text-center border-r border-border ${isToday ? 'bg-primary/5' : ''}`}>
                          <div className="text-sm font-medium">
                            {format(day, 'EEE', { locale: de })}
                          </div>
                          <div className={`text-lg ${isToday ? 'font-bold text-primary' : ''}`}>
                            {format(day, 'dd')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Timeline grid */}
                  <div className="flex h-[900px] overflow-y-auto">
                    {/* Time column */}
                    <div className="w-20 border-r bg-muted/20">
                      {timeSlots.map((slot) => (
                        <div
                          key={slot.hour}
                          className="h-[50px] flex items-start justify-center text-xs text-muted-foreground pt-1"
                          style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }}
                        >
                          {slot.label}
                        </div>
                      ))}
                    </div>
                    
                    {/* Days columns */}
                    {getCalendarDays().map((day) => {
                      const dayEvents = getEventsForDate(day);
                      return (
                        <div 
                          key={day.toISOString()} 
                          className="flex-1 relative border-r border-border"
                          onDragOver={handleDragOver}
                          onDrop={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const y = e.clientY - rect.top;
                            const totalHours = (y / rect.height) * 18;
                            // Snap to 30-minute intervals
                            const snappedHours = Math.round(totalHours * 2) / 2;
                            const finalHour = snappedHours + 6;
                            console.log('Week view drop - totalHours:', totalHours, 'snapped:', snappedHours, 'final:', finalHour);
                            handleDrop(e, day, finalHour);
                          }}
                        >
                          {/* Hour grid lines */}
                          {timeSlots.map((slot) => (
                            <div
                              key={slot.hour}
                              className="absolute inset-x-0 h-[1px] border-b border-border/30"
                              style={{ top: `${(slot.hour - 6) * 50}px` }}
                            />
                          ))}
                          
                          {/* Snap preview line for week view */}
                          {snapPreview.visible && snapPreview.hour >= 6 && snapPreview.hour <= 24 && (
                            <div
                              className="absolute inset-x-0 border-t-2 border-red-500 border-dashed z-50 pointer-events-none"
                              style={{ 
                                top: `${(snapPreview.hour - 6) * 50}px`,
                                boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)'
                              }}
                            >
                              <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                              <div className="absolute -right-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                          )}
                          
                          {/* Events with overlap handling */}
                          {calculateEventLayout(dayEvents).map((event, index) => {
                            return (
                              <div
                                key={index}
                                draggable
                                onDragStart={(e) => handleDragStart(event, e)}
                                onDragEnd={handleDragEnd}
                                className={`absolute rounded-md p-1 text-white cursor-move hover:opacity-90 transition-all ${event.color} ${
                                  isDragging && draggedEvent?.id === event.id ? 'opacity-50' : ''
                                }`}
                                style={{
                                  top: `${event.top}px`,
                                  height: `${event.height}px`,
                                  left: `calc(${event.left}% + 2px)`,
                                  width: `calc(${event.width}% - 4px)`,
                                  minHeight: '25px',
                                  zIndex: 10 + index,
                                }}
                                onClick={() => {
                                  // Don't open modal if we just finished resizing
                                  if (isResizing) return;
                                  
                                  if (event.source === 'event') {
                                    setEditingEvent(event);
                                    setShowEventModal(true);
                                  } else if (event.source === 'booking') {
                                    // Reset form with booking data - handle endTime correctly
                                    const formatSafeDate = (dateValue: any) => {
                                      if (!dateValue) return '';
                                      try {
                                        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
                                        return isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd\'T\'HH:mm');
                                      } catch {
                                        return '';
                                      }
                                    };
                                    
                                    // Handle endTime - if it's just time string, combine with startTime date
                                    let endTimeFormatted = '';
                                    console.log('Processing endTime:', event.endTime, 'startTime:', event.startTime);
                                    
                                    if (event.endTime) {
                                      if (event.endTime.includes('T') || event.endTime.includes('-')) {
                                        // Full datetime
                                        endTimeFormatted = formatSafeDate(event.endTime);
                                      } else if (event.endTime.includes(':')) {
                                        // Just time like "20:00", combine with startTime date
                                        try {
                                          const startDate = new Date(event.startTime);
                                          const [hours, minutes] = event.endTime.split(':').map(Number);
                                          const endDate = new Date(startDate);
                                          endDate.setHours(hours, minutes || 0, 0, 0);
                                          endTimeFormatted = format(endDate, 'yyyy-MM-dd\'T\'HH:mm');
                                          console.log('Formatted endTime:', endTimeFormatted);
                                        } catch (error) {
                                          console.error('Error formatting endTime:', error);
                                          endTimeFormatted = '';
                                        }
                                      }
                                    }
                                    
                                    console.log('Final endTimeFormatted:', endTimeFormatted);
                                    
                                    bookingForm.reset({
                                      title: event.title || '',
                                      description: event.description || '',
                                      facilityId: event.facilityId?.toString() || '',
                                      teamId: event.teamId?.toString() || '',
                                      startTime: formatSafeDate(event.startTime || event.start || event.startDateTime),
                                      endTime: endTimeFormatted,
                                      type: event.type || 'training',
                                      status: event.status || 'confirmed',
                                      participants: event.participants || 0,
                                      cost: event.cost || 0,
                                      contactPerson: event.contactPerson || '',
                                      contactEmail: event.contactEmail || '',
                                      contactPhone: event.contactPhone || '',
                                      notes: event.notes || '',
                                    });
                                    setEditingBooking(event);
                                    setShowBookingModal(true);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-1 text-xs font-medium truncate">
                                  <span>{event.icon}</span>
                                  <span className="truncate">
                                    {event.source === 'booking' ? `${event.typeLabel}: ${event.title}` : (event.title || event.name)}
                                    {event.facilityName && event.height < 60 && ` @ ${event.facilityName}`}
                                  </span>
                                </div>
                                {event.time && event.height >= 50 && (
                                  <div className="text-xs opacity-90 mt-1">
                                    {event.time}
                                    {event.endTime && ` - ${event.endTime}`}
                                  </div>
                                )}
                                {event.facilityName && event.height >= 60 && (
                                  <div className="text-xs opacity-80 mt-1 truncate">
                                    📍 {event.facilityName}
                                  </div>
                                )}
                                
                                {/* Resize handle for week view - only bottom for extending end time */}
                                {event.source === 'booking' && event.height >= 30 && (
                                  <div
                                    className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize flex items-center justify-center group"
                                    onMouseDown={(e) => handleResizeStart(event, 'end', e)}
                                  >
                                    <div className="w-6 h-0.5 bg-white/40 rounded-full group-hover:bg-white/80 transition-colors">
                                      <div className="w-full h-full bg-white/60 rounded-full"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Events Sidebar - Only in month view */}
        {calendarView === 'month' && (
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
                    <CalendarIcon className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mt-2">Keine Termine</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event, index) => (
                      <div key={index} className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        {/* Header with type badge - similar to booking cards */}
                        <div className={`rounded-t-lg -m-4 mb-3 p-3 ${event.color}`}>
                          <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{event.icon}</span>
                              <span className="text-sm font-medium">
                                {event.typeLabel || (event.source === 'event' ? 'Termin' : event.source === 'booking' ? 'Buchung' : 'Geburtstag')}
                              </span>
                            </div>
                            {event.time && (
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {event.time}
                                  {event.endTime && ` - ${event.endTime}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">
                            {event.source === 'booking' ? event.title : (event.title || event.name)}
                          </h4>
                          
                          {(event.facilityName || event.location) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{event.facilityName || event.location}</span>
                            </div>
                          )}
                          
                          {event.description && (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          )}
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
                {(() => {
                  const upcomingEvents = allEvents
                    .filter(event => isAfter(event.date, new Date()) || isSameDay(event.date, new Date()))
                    .sort((a, b) => compareAsc(a.date, b.date))
                    .slice(0, 5);

                  return upcomingEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mt-2">Keine kommenden Termine</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents.map((event, index) => (
                        <div key={index} className="bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                          {/* Compact header */}
                          <div className={`rounded-lg -m-3 mb-2 p-2 ${event.color}`}>
                            <div className="flex items-center justify-between text-white">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{event.icon}</span>
                                <span className="text-xs font-medium">
                                  {event.typeLabel || (event.source === 'event' ? 'Termin' : event.source === 'booking' ? 'Buchung' : 'Geburtstag')}
                                </span>
                              </div>
                              <div className="text-xs">
                                {format(event.date, 'dd.MM')}
                                {event.time && ` • ${event.time}`}
                              </div>
                            </div>
                          </div>
                          
                          {/* Compact content */}
                          <div className="space-y-1">
                            <h5 className="text-sm font-medium text-foreground truncate">
                              {event.source === 'booking' ? event.title : (event.title || event.name)}
                            </h5>
                            
                            {(event.facilityName || event.location) && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{event.facilityName || event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Event Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Termin bearbeiten' : 'Neuer Termin'}</DialogTitle>
          </DialogHeader>
          <Form {...eventForm}>
            <form onSubmit={eventForm.handleSubmit(handleEventSubmit)} className="space-y-4">
              <FormField
                control={eventForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel *</FormLabel>
                    <FormControl>
                      <Input placeholder="Titel eingeben" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={eventForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Beschreibung eingeben" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={eventForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Startdatum *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={eventForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enddatum</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={eventForm.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Team auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Kein Team</SelectItem>
                          {(teams as any[]).map((team) => (
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
                  control={eventForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ort</FormLabel>
                      <FormControl>
                        <Input placeholder="Ort eingeben" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEventModal(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={createEventMutation.isPending || updateEventMutation.isPending}>
                  {editingEvent ? 'Aktualisieren' : 'Erstellen'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={(open) => {
        setShowBookingModal(open);
        if (!open) {
          // Reset availability status when closing modal
          setCalendarAvailabilityStatus(null);
          setIsCheckingCalendarAvailability(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBooking ? 'Buchung bearbeiten' : 'Neue Buchung erstellen'}</DialogTitle>
            <p className="text-sm text-muted-foreground">{editingBooking ? 'Bearbeiten Sie die Details der ausgewählten Buchung.' : 'Erstellen Sie eine neue Buchung für eine Anlage.'}</p>
          </DialogHeader>

          <BookingForm
            editingBooking={editingBooking}
            onSuccess={() => setShowBookingModal(false)}
            onCancel={() => setShowBookingModal(false)}
            selectedClubId={selectedClub.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
