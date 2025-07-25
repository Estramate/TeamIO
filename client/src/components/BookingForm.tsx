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
import { apiRequest } from "@/lib/queryClient";
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
      startTime: editingBooking?.startTime ? new Date(editingBooking.startTime).toISOString().slice(0, 16) : "",
      endTime: editingBooking?.endTime ? new Date(editingBooking.endTime).toISOString().slice(0, 16) : "",
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
  const { data: facilities } = useQuery({
    queryKey: [`/api/clubs/${selectedClubId}/facilities`],
  });

  const { data: teams } = useQuery({
    queryKey: [`/api/clubs/${selectedClubId}/teams`],
  });

  // Mutations
  const createBookingMutation = useMutation({
    mutationFn: (bookingData: any) => apiRequest('POST', `/api/clubs/${selectedClubId}/bookings`, bookingData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClubId}/bookings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClubId}/events`] });
      
      if ((data as any).createdCount && (data as any).createdCount > 1) {
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
    mutationFn: (bookingData: any) => apiRequest('PUT', `/api/clubs/${selectedClubId}/bookings/${editingBooking.id}`, bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClubId}/bookings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClubId}/events`] });
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
    mutationFn: (data: { facilityId: number; startTime: string; endTime: string; excludeBookingId?: number }) =>
      apiRequest('POST', `/api/clubs/${selectedClubId}/bookings/check-availability`, data),
  });

  // Availability check function
  const checkAvailability = () => {
    if (!form.getValues('startTime') || !form.getValues('endTime') || !form.getValues('facilityId')) {
      setAvailabilityStatus({
        available: false,
        message: 'Bitte füllen Sie alle Felder (Anlage, Startzeit, Endzeit) aus.'
      });
      return;
    }

    setIsCheckingAvailability(true);

    checkAvailabilityMutation.mutate({
      facilityId: parseInt(form.getValues('facilityId')),
      startTime: form.getValues('startTime'),
      endTime: form.getValues('endTime'),
      excludeBookingId: editingBooking?.id
    }, {
      onSuccess: (data: any) => {
        setAvailabilityStatus({
          available: data.available,
          message: data.message
        });
        setIsCheckingAvailability(false);
      },
      onError: (error: any) => {
        setAvailabilityStatus({
          available: false,
          message: error.message || 'Fehler bei der Verfügbarkeitsprüfung'
        });
        setIsCheckingAvailability(false);
      }
    });
  };

  // Form submit handler
  const handleSubmit = (data: BookingFormData) => {
    const bookingData = {
      ...data,
      facilityId: data.facilityId ? parseInt(data.facilityId) : null,
      teamId: data.teamId && data.teamId !== "" ? parseInt(data.teamId) : null,
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
                    {(facilities as any[])?.map((facility) => (
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
                    <SelectItem value="">Kein Team</SelectItem>
                    {teams?.map((team: any) => (
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
              <div className="flex items-center">
                {availabilityStatus.available ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                <span className="text-sm font-medium">
                  {availabilityStatus.message}
                </span>
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

        {/* Wiederkehrende Buchungen Sektion */}
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