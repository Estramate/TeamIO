import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useClub } from "@/hooks/use-club";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Switch } from "@/components/ui/switch";

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
}

export default function MemberModal({ open, onClose, member }: MemberModalProps) {
  const { toast } = useToast();
  const { selectedClub } = useClub();
  const queryClient = useQueryClient();
  const [selectedTeamMemberships, setSelectedTeamMemberships] = useState<Array<{teamId: number, role: string}>>([]);

  // Load teams for this club
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clubs/${selectedClub?.id}/teams`);
      return response.json();
    },
    enabled: !!selectedClub?.id && open,
  });

  // Load current team memberships
  const { data: teamMemberships = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'team-memberships'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clubs/${selectedClub?.id}/team-memberships`);
      return response.json();
    },
    enabled: !!selectedClub?.id && open,
  });

  // Initialize team memberships when modal opens
  useEffect(() => {
    if (member && teamMemberships.length > 0 && open) {
      console.log('🔍 [MEMBER MODAL] Loading team memberships for member:', member.id, 'All teamMemberships:', teamMemberships);
      const memberSpecificMemberships = teamMemberships.filter((tm: any) => tm.memberId === member.id);
      console.log('📋 [MEMBER MODAL] Member-specific memberships:', memberSpecificMemberships);
      
      const currentMemberships = teamMemberships
        .filter((tm: any) => 
          tm.memberId === member.id && 
          (tm.membershipRole === 'trainer' || tm.membershipRole === 'co-trainer')
        )
        .map((tm: any) => ({ teamId: tm.teamId, role: tm.membershipRole }));
      console.log('✅ [MEMBER MODAL] Found current memberships:', currentMemberships);
      setSelectedTeamMemberships(currentMemberships);
    } else if (open) {
      console.log('🔄 [MEMBER MODAL] Resetting memberships - member:', !!member, 'teamMemberships.length:', teamMemberships.length, 'open:', open);
      setSelectedTeamMemberships([]);
    }
  }, [member, teamMemberships, open]);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: member?.firstName || "",
      lastName: member?.lastName || "",
      email: member?.email || "",
      phone: member?.phone || "",
      birthDate: member?.birthDate || "",
      address: member?.address || "",
      membershipNumber: member?.membershipNumber || "",
      status: member?.status || "active",
      notes: member?.notes || "",
    },
  });

  // Reset form when member changes
  useEffect(() => {
    if (member && open) {
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
    } else if (!member && open) {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        birthDate: "",
        address: "",
        membershipNumber: "",
        status: "active",
        notes: "",
      });
      setSelectedTeamMemberships([]);
    }
  }, [member, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      const response = await apiRequest(
        "POST",
        `/api/clubs/${selectedClub?.id}/members`,
        {
          ...data,
          joinDate: new Date().toISOString().split('T')[0],
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: "Mitglied wurde erfolgreich erstellt",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'members'] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Fehler",
        description: "Fehler beim Erstellen des Mitglieds",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      // Update member data
      const response = await apiRequest(
        "PUT",
        `/api/clubs/${selectedClub?.id}/members/${member.id}`,
        data
      );
      
      // Handle team memberships updates for existing member
      if (member) {
        const existingTrainerMemberships = teamMemberships.filter((tm: any) => 
          tm.memberId === member.id && (tm.role === 'trainer' || tm.role === 'co-trainer')
        );
        
        // Remove all existing trainer/co-trainer memberships first
        for (const membership of existingTrainerMemberships) {
          try {
            await apiRequest("DELETE", `/api/teams/${membership.teamId}/trainers`);
          } catch (error) {
            console.log('Error removing old team trainers:', error);
          }
        }
        
        // Add new team memberships
        for (const teamMembership of selectedTeamMemberships) {
          try {
            await apiRequest("POST", `/api/teams/${teamMembership.teamId}/memberships`, {
              memberId: member.id,
              role: teamMembership.role,
              position: teamMembership.role,
            });
          } catch (error) {
            console.log('Error adding team membership:', error);
          }
        }
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: "Mitglied wurde erfolgreich aktualisiert",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'team-memberships'] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Mitglieds",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MemberFormData) => {
    if (!selectedClub) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie zuerst einen Verein aus",
        variant: "destructive",
      });
      return;
    }

    if (member) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleTeamToggle = (teamId: number, role: string) => {
    const existingIndex = selectedTeamMemberships.findIndex(tm => tm.teamId === teamId);
    
    if (existingIndex >= 0) {
      // Update role or remove if same role
      const existing = selectedTeamMemberships[existingIndex];
      if (existing.role === role) {
        // Remove assignment
        setSelectedTeamMemberships(prev => prev.filter(tm => tm.teamId !== teamId));
      } else {
        // Update role
        setSelectedTeamMemberships(prev => prev.map(tm => 
          tm.teamId === teamId ? { ...tm, role } : tm
        ));
      }
    } else {
      // Add new assignment
      setSelectedTeamMemberships(prev => [...prev, { teamId, role }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {member ? "Mitglied bearbeiten" : "Neues Mitglied hinzufügen"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vorname *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Nachname *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
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
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
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
                    <FormLabel>Geburtsdatum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Mitgliedsnummer</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Team Assignments - Only show when editing existing member */}
            {member && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Team-Zuordnungen</h4>
                    <p className="text-xs text-muted-foreground">Wählen Sie Teams und Funktionen aus</p>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto border rounded-xl p-4 bg-gradient-to-br from-muted/30 to-muted/20">
                  {teams.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Keine Teams verfügbar</p>
                    </div>
                  ) : (
                    teams.map((team: any) => {
                      const currentAssignment = selectedTeamMemberships.find(tm => tm.teamId === team.id);
                      const isAssigned = !!currentAssignment;
                      
                      return (
                        <div
                          key={team.id}
                          className="flex items-center justify-between p-4 rounded-xl border bg-card/50 hover:bg-card/80 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant={isAssigned ? "default" : "outline"}
                                size="sm"
                                onClick={() => isAssigned 
                                  ? handleTeamToggle(team.id, currentAssignment.role) 
                                  : handleTeamToggle(team.id, 'trainer')
                                }
                                className={isAssigned ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                              >
                                {isAssigned ? 'Entfernen' : 'Zuordnen'}
                              </Button>
                              
                              <div>
                                <h4 className="font-medium text-sm">{team.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {team.category} • {team.ageGroup}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {isAssigned && (
                            <div className="flex items-center gap-2">
                              <Select
                                value={currentAssignment.role}
                                onValueChange={(role) => handleTeamToggle(team.id, role)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="trainer">Trainer</SelectItem>
                                  <SelectItem value="co-trainer">Co-Trainer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Speichern..."
                  : member
                  ? "Aktualisieren"
                  : "Mitglied speichern"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
