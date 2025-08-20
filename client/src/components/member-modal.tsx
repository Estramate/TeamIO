import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useClub } from "@/hooks/use-club";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Users, User, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const memberSchema = z.object({
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  membershipNumber: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  notes: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberModalProps {
  open: boolean;
  onClose: () => void;
  member?: any;
  onSuccess?: () => void;
}

export default function MemberModal({ open, onClose, member, onSuccess }: MemberModalProps) {
  const { toast } = useToast();
  const { selectedClub } = useClub();
  const queryClient = useQueryClient();
  const [selectedTeamMemberships, setSelectedTeamMemberships] = useState<Array<{teamId: number, role: string}>>([]);

  // Form setup
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      birthDate: "",
      address: "",
      membershipNumber: "",
      status: "active",
      notes: "",
    },
  });

  // Load teams for this club
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id && open,
  });

  // Load current team memberships
  const { data: teamMemberships = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'team-memberships'],
    enabled: !!selectedClub?.id && open,
  });

  // Initialize form and team memberships when modal opens
  useEffect(() => {
    if (member && open) {
      // Reset form with member data
      form.reset({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        email: member.email || "",
        phone: member.phone || "",
        birthDate: member.birthDate || "",
        address: member.address || "",
        membershipNumber: member.membershipNumber || "",
        status: member.status || "active",
        notes: member.notes || "",
      });

      // Load current team memberships (using correct field name)
      if (teamMemberships && (teamMemberships as any[]).length > 0) {
        const memberSpecificMemberships = (teamMemberships as any[]).filter((tm: any) => tm.memberId === member.id);
        const currentMemberships = memberSpecificMemberships
          .map((tm: any) => ({ teamId: tm.teamId, role: tm.role || tm.membershipRole || 'trainer' }));
        setSelectedTeamMemberships(currentMemberships);
      }
    } else if (!member && open) {
      // Reset for new member
      form.reset();
      setSelectedTeamMemberships([]);
    }
  }, [member, open, teamMemberships, form]);

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (memberData: MemberFormData) => {
      const response = await apiRequest("POST", `/api/clubs/${selectedClub?.id}/members`, {
        ...memberData,
        teamMemberships: selectedTeamMemberships,
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401 || response.status === 403) {
          throw new Error("Nicht autorisiert");
        }
        throw new Error("Fehler beim Erstellen des Mitglieds");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mitglied erstellt",
        description: "Das neue Mitglied wurde erfolgreich erstellt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'team-memberships'] });
      onClose();
      form.reset();
      setSelectedTeamMemberships([]);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (memberData: MemberFormData) => {
      if (!member) throw new Error("Kein Mitglied ausgewählt");
      
      const response = await apiRequest("PUT", `/api/clubs/${selectedClub?.id}/members/${member.id}`, {
        ...memberData,
        teamMemberships: selectedTeamMemberships,
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401 || response.status === 403) {
          throw new Error("Nicht autorisiert");
        }
        throw new Error("Fehler beim Aktualisieren des Mitglieds");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mitglied aktualisiert",
        description: "Die Mitgliederdaten wurden erfolgreich aktualisiert.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'team-memberships'] });
      onClose();
      form.reset();
      setSelectedTeamMemberships([]);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: MemberFormData) => {
    if (member) {
      updateMemberMutation.mutate(data);
    } else {
      createMemberMutation.mutate(data);
    }
  };

  const handleTeamToggle = (teamId: number) => {
    const isCurrentlyAssigned = selectedTeamMemberships.some(tm => tm.teamId === teamId);
    
    if (isCurrentlyAssigned) {
      setSelectedTeamMemberships(prev => prev.filter(tm => tm.teamId !== teamId));
    } else {
      setSelectedTeamMemberships(prev => [...prev, { teamId, role: 'trainer' }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                {member ? 'Mitglied bearbeiten' : 'Neues Mitglied'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {member ? 'Bearbeiten Sie die Mitgliederdaten und Team-Zuordnungen' : 'Erstellen Sie ein neues Mitglied und ordnen Sie es Teams zu'}
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Persönliche Daten</h4>
                  <p className="text-xs text-muted-foreground">Grundlegende Informationen des Mitglieds</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-xl bg-gradient-to-br from-muted/30 to-muted/20">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Vorname *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Max" 
                          {...field} 
                          className="bg-background border-border text-foreground focus:border-green-500 focus:ring-green-500/20" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Nachname *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Mustermann" 
                          {...field} 
                          className="bg-background border-border text-foreground focus:border-green-500 focus:ring-green-500/20" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">E-Mail</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="max@example.com" 
                          type="email" 
                          {...field} 
                          className="bg-background border-border text-foreground focus:border-green-500 focus:ring-green-500/20" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Telefon</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+43 123 456 789" 
                          {...field} 
                          className="bg-background border-border text-foreground focus:border-green-500 focus:ring-green-500/20" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Geburtsdatum</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="bg-background border-border text-foreground focus:border-green-500 focus:ring-green-500/20" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="membershipNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Mitgliedsnummer</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="M001" 
                          {...field} 
                          className="bg-background border-border text-foreground focus:border-green-500 focus:ring-green-500/20" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border text-foreground focus:border-green-500 focus:ring-green-500/20">
                            <SelectValue placeholder="Status auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Aktiv</SelectItem>
                          <SelectItem value="inactive">Inaktiv</SelectItem>
                          <SelectItem value="suspended">Gesperrt</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-foreground font-medium">Adresse</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Musterstraße 123, 1234 Musterstadt" 
                          {...field} 
                          className="bg-background border-border text-foreground focus:border-green-500 focus:ring-green-500/20" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Team Assignments */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Team-Zuordnungen</h4>
                  <p className="text-xs text-muted-foreground">Wählen Sie Teams und Funktionen aus</p>
                </div>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto border rounded-xl p-4 bg-gradient-to-br from-muted/30 to-muted/20">
                {(teams as any[]).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Keine Teams verfügbar</p>
                  </div>
                ) : (
                  (teams as any[]).map((team: any) => {
                    const currentAssignment = selectedTeamMemberships.find(tm => tm.teamId === team.id);
                    const isAssigned = !!currentAssignment;
                    const currentRole = currentAssignment?.role || 'trainer';
                    
                    return (
                      <div key={team.id} className="group relative">
                        <div className={`
                          flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                          ${isAssigned 
                            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-sm' 
                            : 'bg-card border-border hover:border-muted-foreground/30 hover:shadow-sm'
                          }
                        `}>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant={isAssigned ? "destructive" : "outline"}
                              size="sm"
                              className={`
                                h-8 px-3 rounded-lg transition-all duration-200
                                ${isAssigned 
                                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                                  : 'border-border hover:bg-muted/50 text-foreground'
                                }
                              `}
                              onClick={() => handleTeamToggle(team.id)}
                            >
                              {isAssigned ? 'Entfernen' : 'Zuordnen'}
                            </Button>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{team.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {team.category === 'youth' ? 'Jugend' : 
                                   team.category === 'amateur' ? 'Amateur' : 
                                   team.category === 'professional' ? 'Profi' : 
                                   'Erwachsene'}
                                </Badge>
                              </div>
                              {team.ageGroup && (
                                <p className="text-xs text-muted-foreground mt-1">{team.ageGroup}</p>
                              )}
                            </div>
                          </div>
                          
                          {isAssigned && (
                            <div className="flex items-center gap-2">
                              <Select
                                value={currentRole}
                                onValueChange={(role) => {
                                  setSelectedTeamMemberships(prev => 
                                    prev.map(tm => 
                                      tm.teamId === team.id ? { ...tm, role } : tm
                                    )
                                  );
                                }}
                              >
                                <SelectTrigger className="w-36 h-8 text-xs bg-white dark:bg-background border-blue-200 dark:border-blue-800">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="trainer">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      Trainer
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="co-trainer">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                      Co-Trainer
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="assistant">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                      Assistenz
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="manager">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                      Manager
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="physiotherapist">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      Physiotherapeut
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="doctor">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                                      Arzt
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                
                {selectedTeamMemberships.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-xs">{selectedTeamMemberships.length}</span>
                      </div>
                      Team{selectedTeamMemberships.length !== 1 ? 's' : ''} zugeordnet
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Notizen</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Zusätzliche Notizen zum Mitglied..." 
                        {...field} 
                        className="bg-background border-border text-foreground focus:border-green-500 focus:ring-green-500/20 min-h-[80px]" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex gap-3 pt-6 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border-border hover:bg-muted/50"
              >
                <X className="w-4 h-4 mr-2" />
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/25"
                disabled={createMemberMutation.isPending || updateMemberMutation.isPending}
              >
                {createMemberMutation.isPending || updateMemberMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Speichern...
                  </>
                ) : (
                  <>
                    {member ? 'Aktualisieren' : 'Erstellen'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}