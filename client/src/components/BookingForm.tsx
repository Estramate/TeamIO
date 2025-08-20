import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotificationTriggers } from "@/utils/notificationTriggers";
import { apiRequest } from "@/lib/queryClient";
import { invalidateEntityData } from "@/lib/cache-invalidation";
import { z } from "zod";

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

interface BookingFormProps {
  editingBooking?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  selectedClubId: number;
}

export function BookingForm({ editingBooking, onSuccess, onCancel, selectedClubId }: BookingFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { notifyBookingCreated, invalidateRelevantCache } = useNotificationTriggers();

  // Helper function to safely format date for datetime-local input
  const formatDateForInput = (dateValue: any, baseDate?: any): string => {
    if (!dateValue) return "";
    
    try {
      // Handle different date formats
      let date: Date;
      
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        // Handle time-only values (like "19:00")
        if (dateValue.match(/^\d{2}:\d{2}$/)) {
          // Processing time-only value for booking
          // If we have a time-only value, we need to combine it with a date
          const referenceDate = baseDate ? new Date(baseDate) : new Date();
          const [hours, minutes] = dateValue.split(':');
          date = new Date(referenceDate);
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          // Formatted time-only for booking
        } else {
          date = new Date(dateValue);
        }
      } else {
        return "";
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {

        return "";
      }
      
      // Convert to local time for datetime-local input
      // Subtract timezone offset to get local time representation
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const formatted = localDate.toISOString().slice(0, 16);
      return formatted;
    } catch (error) {
      // Date formatting error handled internally
      return "";
    }
  };
  
  // Availability check states
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    message: string;
    maxConcurrent?: number;
    currentBookings?: number;
  } | null>(null);

  // Form setup
  const form = useForm<BookingFormData>({
    defaultValues: {
      title: editingBooking?.title || "",
      facilityId: editingBooking?.facilityId?.toString() || "",
      teamId: editingBooking?.teamId?.toString() || "",
      type: editingBooking?.type || "training",
      status: editingBooking?.status || "confirmed",
      startTime: formatDateForInput(editingBooking?.startTime),
      endTime: formatDateForInput(editingBooking?.endTime, editingBooking?.startTime),
      participants: editingBooking?.participants?.toString() || "",
      cost: editingBooking?.cost?.toString() || "",
      description: editingBooking?.description || "",
      contactPerson: editingBooking?.contactPerson || "",
      contactEmail: editingBooking?.contactEmail || "",
      contactPhone: editingBooking?.contactPhone || "",
      notes: editingBooking?.notes || "",
      recurring: false,
      recurringPattern: "",
      recurringUntil: "",
    },
  });

  // Data queries
  const { data: facilities = [], isLoading: facilitiesLoading } = useQuery<any[]>({
    queryKey: [`/api/clubs/${selectedClubId}/facilities`],
    enabled: !!selectedClubId,
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: [`/api/clubs/${selectedClubId}/teams`],
    enabled: !!selectedClubId,
  });

  // Mutations
  const createBookingMutation = useMutation({
    mutationFn: (bookingData: any) => apiRequest('POST', `/api/clubs/${selectedClubId}/bookings`, bookingData),
    onSuccess: (data, variables) => {
      const bookingTitle = variables.title;
      const isRecurring = (data as any).createdCount && (data as any).createdCount > 1;
      
      // Trigger intelligent notification
      const facility = facilities.find(f => f.id === parseInt(variables.facilityId));
      const facilityName = facility?.name || 'Anlage';
      const date = new Date(variables.startTime).toLocaleDateString('de-DE');
      notifyBookingCreated(facilityName, date);
      
      // Invalidate alle booking-relevanten Queries
      invalidateEntityData(queryClient, selectedClubId, 'bookings');
      invalidateRelevantCache([`/api/clubs/${selectedClubId}/bookings`]);
      
      if (isRecurring) {
        toast({
          title: "Wiederkehrende Buchungen erstellt",
          description: `${(data as any).createdCount} Buchungen wurden erfolgreich erstellt.`,
        });
      } else {
        toast({
          title: "Buchung erstellt",
          description: "Die Buchung wurde erfolgreich hinzugefügt.",
        });
      }
      
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Erstellen der Buchung",
        variant: "destructive",
      });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: (bookingData: any) => {
      // API request debugging (use debugConfig.ts to enable)
      // logApiRequest('PATCH', `/api/clubs/${selectedClubId}/bookings/${editingBooking.id}`, bookingData);
      return apiRequest('PATCH', `/api/clubs/${selectedClubId}/bookings/${editingBooking.id}`, bookingData);
    },
    onSuccess: () => {
      // CRITICAL FIX: Force immediate cache refresh with correct query keys
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClubId, 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClubId, 'events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClubId, 'dashboard'] });
      
      // Force immediate refetch to update timeline
      queryClient.refetchQueries({ queryKey: ['/api/clubs', selectedClubId, 'bookings'] });
      
      // Cache operation debugging (use debugConfig.ts to enable)
      // logCacheOperation('invalidate+refetch', ['/api/clubs', selectedClubId, 'bookings'], 'after BookingForm update');
      
      toast({
        title: "Buchung aktualisiert",
        description: "Die Buchung wurde erfolgreich aktualisiert.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Aktualisieren der Buchung",
        variant: "destructive",
      });
    },
  });

  const checkAvailabilityMutation = useMutation({
    mutationFn: async (data: { facilityId: number; startTime: string; endTime: string; excludeBookingId?: number }) => {
      const response = await apiRequest('POST', `/api/clubs/${selectedClubId}/bookings/check-availability`, data);
      const jsonData = await response.json();
      // JSON data parsed successfully
      return jsonData;
    },
  });

  // Availability check function
  const checkAvailability = () => {
    const startTime = form.getValues('startTime');
    const endTime = form.getValues('endTime');
    const facilityId = form.getValues('facilityId');

    if (!startTime || !endTime || !facilityId) {
      setAvailabilityStatus({
        available: false,
        message: 'Bitte füllen Sie alle Felder (Anlage, Startzeit, Endzeit) aus.'
      });
      return;
    }

    setIsCheckingAvailability(true);

    // Convert datetime-local to proper ISO strings for the API
    const startTimeISO = new Date(startTime).toISOString();
    const endTimeISO = new Date(endTime).toISOString();

    checkAvailabilityMutation.mutate({
      facilityId: parseInt(facilityId),
      startTime: startTimeISO,
      endTime: endTimeISO,
      excludeBookingId: editingBooking?.id
    }, {
      onSuccess: (data: any) => {
        // Availability check successful
        
        // Erweiterte Anzeige mit Buchungszählung
        let message = data.message;
        if (data.maxConcurrent && typeof data.currentBookings === 'number') {
          const currentCount = editingBooking ? data.currentBookings : data.currentBookings + 1;
          message = `${data.available ? 'Verfügbar' : 'Nicht verfügbar'} (${currentCount}/${data.maxConcurrent} Buchungen)`;
        }
        
        setAvailabilityStatus({
          available: data.available,
          message: message,
          maxConcurrent: data.maxConcurrent,
          currentBookings: data.currentBookings
        });
        setIsCheckingAvailability(false);
      },
      onError: (error: any) => {
        // Availability check error handled
        setAvailabilityStatus({
          available: false,
          message: error.response?.data?.message || error.message || 'Fehler bei der Verfügbarkeitsprüfung'
        });
        setIsCheckingAvailability(false);
      }
    });
  };

  // Form submit handler with availability check
  const handleSubmit = async (data: BookingFormData) => {
    // Automatische Verfügbarkeitsprüfung vor dem Speichern
    if (data.facilityId && data.startTime && data.endTime) {
      try {
        const response = await apiRequest('POST', `/api/clubs/${selectedClubId}/bookings/check-availability`, {
          facilityId: parseInt(data.facilityId),
          startTime: new Date(data.startTime).toISOString(),
          endTime: new Date(data.endTime).toISOString(),
          excludeBookingId: editingBooking?.id
        });
        
        const availabilityData = await response.json();
        
        if (!availabilityData.available) {
          toast({
            title: "Buchung nicht möglich",
            description: `Die Anlage ist zu diesem Zeitpunkt nicht verfügbar. ${availabilityData.message || ''}`,
            variant: "destructive",
          });
          return; // Speichern abbrechen
        }
      } catch (error) {

        toast({
          title: "Verfügbarkeitsprüfung fehlgeschlagen",
          description: "Die Verfügbarkeit konnte nicht geprüft werden. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        });
        return; // Speichern abbrechen
      }
    }

    const bookingData = {
      ...data,
      facilityId: data.facilityId ? parseInt(data.facilityId) : null,
      teamId: data.teamId && data.teamId !== "" && data.teamId !== "none" ? parseInt(data.teamId) : null,
      participants: data.participants ? parseInt(data.participants) : undefined,
      cost: data.cost ? parseFloat(data.cost) : undefined,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      recurringUntil: data.recurringUntil ? new Date(data.recurringUntil).toISOString() : null,
    };

    if (editingBooking) {
      updateBookingMutation.mutate(bookingData);
    } else {
      createBookingMutation.mutate(bookingData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titel *</FormLabel>
                <FormControl>
                  <Input placeholder="Buchungstitel" {...field} value={field.value || ""} />
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
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Anlage auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(facilities as any[])?.map((facility: any) => (
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="teamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team (optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kein Team" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Kein Team</SelectItem>
                    {(teams as any[])?.map((team: any) => (
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
                      <SelectValue placeholder="Training" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="game">Spiel</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="maintenance">Wartung</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Bestätigt" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="confirmed">Bestätigt</SelectItem>
                    <SelectItem value="pending">Ausstehend</SelectItem>
                    <SelectItem value="cancelled">Abgesagt</SelectItem>
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
                  <Input 
                    type="datetime-local" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      setAvailabilityStatus(null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endzeit *</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      setAvailabilityStatus(null);
                    }}
                  />
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
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  value={field.value?.toString() || ""}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Availability Check Section */}
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">Verfügbarkeitsprüfung</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={checkAvailability}
              disabled={isCheckingAvailability || checkAvailabilityMutation.isPending}
            >
              {isCheckingAvailability || checkAvailabilityMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Prüfe...
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Verfügbarkeit prüfen
                </>
              )}
            </Button>
          </div>
          
          {availabilityStatus && (
            <div className={`p-3 rounded-md border ${
              availabilityStatus.available 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {availabilityStatus.available ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    {availabilityStatus.message}
                  </span>
                  {availabilityStatus.maxConcurrent && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Maximale Buchungen: {availabilityStatus.maxConcurrent}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
                  value={field.value || ""}
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
                  <Input placeholder="Name" {...field} value={field.value || ""} />
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
                  <Input type="email" placeholder="email@beispiel.de" {...field} value={field.value || ""} />
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
                  <Input placeholder="+49 123 456789" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Wiederkehrende Buchungen Sektion - nur bei Neuanlage */}
        {!editingBooking && (
          <div className="bg-muted/30 p-4 rounded-lg border">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="recurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">Wiederkehrende Buchung</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Diese Buchung automatisch wiederholen
                      </div>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value || false}
                        onChange={field.onChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('recurring') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recurringPattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wiederholungsmuster *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Muster auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Täglich</SelectItem>
                            <SelectItem value="weekly">Wöchentlich</SelectItem>
                            <SelectItem value="monthly">Monatlich</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurringUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wiederholung bis *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        )}

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
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button 
            type="submit" 
            disabled={createBookingMutation.isPending || updateBookingMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {editingBooking ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </div>
      </form>
    </Form>
  );
}