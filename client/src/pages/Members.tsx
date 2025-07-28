import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Search, Plus, Edit, Trash2, LayoutGrid, List, Mail, Phone, Calendar, MapPin, User, AlertCircle, MoreHorizontal, Grid3X3, X, MoreVertical, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { useToast } from "@/hooks/use-toast";
import { useNotificationTriggers } from "@/utils/notificationTriggers";
import { apiRequest } from "@/lib/queryClient";
import { invalidateEntityData } from "@/lib/cache-invalidation";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Form validation schema mit Datumsvalidierung
const memberFormSchema = z.object({
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  membershipNumber: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  joinDate: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Prüfe dass Geburtsdatum nicht in der Zukunft liegt
  if (data.birthDate) {
    const birthDate = new Date(data.birthDate);
    const today = new Date();
    return birthDate <= today;
  }
  return true;
}, {
  message: "Geburtsdatum darf nicht in der Zukunft liegen",
  path: ["birthDate"]
}).refine((data) => {
  // Prüfe dass Beitrittsdatum nicht vor Geburtsdatum liegt
  if (data.joinDate && data.birthDate) {
    const birthDate = new Date(data.birthDate);
    const joinDate = new Date(data.joinDate);
    return joinDate >= birthDate;
  }
  return true;
}, {
  message: "Beitrittsdatum darf nicht vor dem Geburtsdatum liegen",
  path: ["joinDate"]
});

type MemberFormData = z.infer<typeof memberFormSchema>;

export default function Members() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { notifyNewMember, invalidateRelevantCache } = useNotificationTriggers();
  const { setPage } = usePage();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTeamMemberships, setSelectedTeamMemberships] = useState<{teamId: number, role: string}[]>([]);
  const [viewingMember, setViewingMember] = useState<any>(null);

  // Set page title and redirect if not authenticated
  useEffect(() => {
    setPage("Mitglieder", selectedClub ? `Verwalten Sie die Mitglieder von ${selectedClub.name}` : "Bitte wählen Sie einen Verein aus");
  }, [setPage, selectedClub]);

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

  // Form setup
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      birthDate: "",
      address: "",
      membershipNumber: "",
      status: "active",
      joinDate: "",
      notes: "",
    },
  });

  // Fetch members
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'members'],
    enabled: !!selectedClub?.id && isAuthenticated,
    retry: false,
  });

  // Load teams for team assignments
  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id && isAuthenticated,
    retry: false,
  });

  // Load team memberships
  const { data: teamMemberships = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'team-memberships'],
    enabled: !!selectedClub?.id && isAuthenticated,
    retry: false,
  });

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (memberData: MemberFormData) => {
      await apiRequest("POST", `/api/clubs/${selectedClub?.id}/members`, memberData);
    },
    onSuccess: (_, variables) => {
      const memberName = `${variables.firstName} ${variables.lastName}`;
      
      // Trigger intelligent notification
      notifyNewMember(memberName);
      
      toast({
        title: "Erfolg",
        description: "Mitglied wurde erfolgreich erstellt",
      });
      
      // Smart cache invalidation
      invalidateRelevantCache('member', selectedClub?.id);
      invalidateEntityData(queryClient, selectedClub?.id!, 'members');
      
      setMemberModalOpen(false);
      form.reset();
      setSelectedMember(null);
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

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (memberData: MemberFormData) => {
      await apiRequest("PUT", `/api/clubs/${selectedClub?.id}/members/${selectedMember.id}`, memberData);
      
      // Update team memberships if any are selected
      if (selectedTeamMemberships.length >= 0) {
        // Remove existing trainer/co-trainer memberships for this member
        const existingMemberships = teamMemberships.filter((tm: any) => 
          tm.memberId === selectedMember.id && 
          (tm.role === 'trainer' || tm.role === 'co-trainer')
        );
        
        for (const membership of existingMemberships) {
          await fetch(`/api/teams/${membership.teamId}/memberships/${membership.id}`, {
            method: 'DELETE',
          });
        }

        // Add new team memberships
        for (const teamMembership of selectedTeamMemberships) {
          await fetch(`/api/teams/${teamMembership.teamId}/memberships`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              memberId: selectedMember.id,
              role: teamMembership.role,
              status: 'active',
            }),
          });
        }
      }
    },
    onSuccess: (_, variables) => {
      const memberName = `${variables.firstName} ${variables.lastName}`;
      
      // Trigger notification for membership update
      notifyNewMember(memberName, 'aktualisiert');
      
      toast({
        title: "Erfolg",
        description: "Mitglied wurde erfolgreich aktualisiert",
      });
      
      // Smart cache invalidation
      invalidateRelevantCache('member', selectedClub?.id);
      invalidateEntityData(queryClient, selectedClub?.id!, 'members');
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'team-memberships'] });
      
      setMemberModalOpen(false);
      form.reset();
      setSelectedMember(null);
      setSelectedTeamMemberships([]);
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

  // Status toggle mutation
  const toggleMemberStatusMutation = useMutation({
    mutationFn: async ({ memberId, newStatus }: { memberId: number; newStatus: string }) => {
      await apiRequest("PUT", `/api/clubs/${selectedClub?.id}/members/${memberId}`, { status: newStatus });
    },
    onSuccess: () => {
      invalidateEntityData(queryClient, selectedClub?.id!, 'members');
      toast({
        title: "Erfolg",
        description: "Status wurde erfolgreich geändert",
      });
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
        description: "Status konnte nicht geändert werden",
        variant: "destructive",
      });
    },
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest("DELETE", `/api/clubs/${selectedClub?.id}/members/${memberId}`);
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: "Mitglied wurde erfolgreich gelöscht",
      });
      invalidateEntityData(queryClient, selectedClub?.id!, 'members');
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
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
        description: "Fehler beim Löschen des Mitglieds",
        variant: "destructive",
      });
    },
  });

  // Filter members
  const filteredMembers = (members as any[]).filter((member: any) => {
    const matchesSearch = 
      (member.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.membershipNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle member actions
  const handleAddMember = () => {
    setSelectedMember(null);
    form.reset();
    setSelectedTeamMemberships([]);
    setMemberModalOpen(true);
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    form.reset({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      email: member.email || "",
      phone: member.phone || "",
      birthDate: member.birthDate || "",
      address: member.address || "",
      membershipNumber: member.membershipNumber || "",
      status: member.status || "active",
      joinDate: member.joinDate || "",
      notes: member.notes || "",
    });
    
    // Load current team memberships for this member (trainer/co-trainer roles only)
    const currentMemberships = teamMemberships
      .filter((tm: any) => 
        tm.memberId === member.id && 
        (tm.role === 'trainer' || tm.role === 'co-trainer')
      )
      .map((tm: any) => ({ teamId: tm.teamId, role: tm.role }));
    setSelectedTeamMemberships(currentMemberships);
    
    setMemberModalOpen(true);
  };

  const handleDeleteMember = (member: any) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleViewMember = (member: any) => {
    setViewingMember(member);
    setIsDetailDialogOpen(true);
  };

  const handleToggleStatus = (member: any) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    toggleMemberStatusMutation.mutate({
      memberId: member.id,
      newStatus
    });
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      deleteMemberMutation.mutate(memberToDelete.id);
    }
  };

  const handleSubmit = (data: MemberFormData) => {
    if (selectedMember) {
      updateMemberMutation.mutate(data);
    } else {
      createMemberMutation.mutate(data);
    }
  };

  // Status badge function
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
        return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Aktiv</Badge>;
      case 'inactive': 
        return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Inaktiv</Badge>;
      case 'suspended': 
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Gesperrt</Badge>;
      default: 
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">{status}</Badge>;
    }
  };

  // Status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'inactive':
        return 'Inaktiv';
      case 'suspended':
        return 'Gesperrt';
      default:
        return status;
    }
  };

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte wählen Sie einen Verein aus, um Mitglieder zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      {/* Header Section with Search, Filters and Add Button */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Mitglieder suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-xl border bg-background"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl border bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
                <SelectItem value="suspended">Gesperrt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-xl border bg-background p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3 rounded-lg flex-1 sm:flex-none"
              >
                <Grid3X3 className="h-4 w-4" />
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
              onClick={handleAddMember}
              className="w-full sm:w-auto sm:ml-auto h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Mitglied hinzufügen
            </Button>
          </div>
        </div>
      </div>

      {/* Members Content */}
      {isMembersLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Keine Mitglieder gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm || statusFilter !== 'all' 
              ? "Versuchen Sie, Ihre Suchkriterien anzupassen."
              : "Beginnen Sie mit dem Hinzufügen Ihres ersten Mitglieds."}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button 
              onClick={handleAddMember}
              className="mt-4 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Erstes Mitglied hinzufügen
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member: any) => {
            // Get team memberships for this member
            const memberTeams = teamMemberships
              .filter((tm: any) => tm.memberId === member.id)
              .map((tm: any) => {
                const team = teams.find((t: any) => t.id === tm.teamId);
                return team ? { ...team, role: tm.role } : null;
              })
              .filter(Boolean);

            return (
              <Card key={member.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md overflow-hidden">
                {/* Einfacher grauer Header - schlicht und modern */}
                <div className="h-2 bg-gradient-to-r from-muted to-muted/80"></div>
                
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">👤</span>
                        <h3 
                          className="text-lg font-semibold text-foreground truncate cursor-pointer hover:underline"
                          onClick={() => handleViewMember(member)}
                          title={`${member.firstName} ${member.lastName}`}
                        >
                          {member.firstName} {member.lastName}
                        </h3>
                      </div>
                      
                      {member.membershipNumber && (
                        <p className="text-sm text-muted-foreground mb-3">
                          Mitglied #{member.membershipNumber}
                        </p>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewMember(member)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditMember(member)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(member)}
                          disabled={toggleMemberStatusMutation.isPending}
                          className={member.status === 'active' ? "text-orange-600 focus:text-orange-600" : "text-green-600 focus:text-green-600"}
                        >
                          {member.status === 'active' ? (
                            <>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Deaktivieren
                            </>
                          ) : (
                            <>
                              <User className="h-4 w-4 mr-2" />
                              Aktivieren
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMember(member)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    {getStatusBadge(member.status)}
                  </div>

                  {/* Contact Information - Kompakter Stil */}
                  <div className="space-y-3 text-sm">
                    {member.email && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Mail className="h-3 w-3 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-muted-foreground">E-Mail</div>
                          <div className="font-medium truncate" title={member.email}>{member.email}</div>
                        </div>
                      </div>
                    )}
                    
                    {member.phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Phone className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-muted-foreground">Telefon</div>
                          <div className="font-medium truncate" title={member.phone}>{member.phone}</div>
                        </div>
                      </div>
                    )}
                    
                    {member.joinDate && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Calendar className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-muted-foreground">Beitritt</div>
                          <div className="font-medium">
                            {new Date(member.joinDate).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {member.address && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <MapPin className="h-3 w-3 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-muted-foreground">Adresse</div>
                          <div className="font-medium line-clamp-2" title={member.address}>{member.address}</div>
                        </div>
                      </div>
                    )}

                    {/* Team Memberships */}
                    {memberTeams.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                          <Users className="h-3 w-3 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Teams</div>
                          <div className="flex flex-wrap gap-1">
                            {memberTeams.slice(0, 2).map((team: any, idx: number) => (
                              <span key={`${member.id}-team-${team.id}-${idx}`} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                                {team.name}
                              </span>
                            ))}
                            {memberTeams.length > 2 && (
                              <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md">
                                +{memberTeams.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}


                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600/10 to-blue-700/10 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Mitglied
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Kontakt & Details
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Teams & Rollen
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredMembers.map((member: any) => {
                    // Get team memberships for this member
                    const memberTeams = teamMemberships
                      .filter((tm: any) => tm.memberId === member.id)
                      .map((tm: any) => {
                        const team = teams.find((t: any) => t.id === tm.teamId);
                        return team ? { ...team, role: tm.role } : null;
                      })
                      .filter(Boolean);

                    return (
                      <tr key={member.id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-blue-100/30 dark:hover:from-blue-950/30 dark:hover:to-blue-900/20 transition-all duration-200">
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </div>
                            <div>
                              <div 
                                className="text-sm font-semibold text-foreground cursor-pointer hover:text-blue-600 transition-colors hover:underline"
                                onClick={() => handleViewMember(member)}
                                title="Details anzeigen"
                              >
                                {member.firstName} {member.lastName}
                              </div>
                              {member.membershipNumber && (
                                <div className="text-xs text-muted-foreground font-medium">
                                  Mitglied #{member.membershipNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            {member.email && (
                              <div className="flex items-center text-sm text-foreground">
                                <Mail className="w-3 h-3 mr-2 text-purple-600" />
                                <span className="truncate max-w-xs" title={member.email}>{member.email}</span>
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center text-sm text-foreground">
                                <Phone className="w-3 h-3 mr-2 text-green-600" />
                                <span>{member.phone}</span>
                              </div>
                            )}
                            {member.joinDate && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3 mr-2 text-orange-600" />
                                <span>Seit {new Date(member.joinDate).toLocaleDateString('de-DE')}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            {memberTeams.length > 0 ? (
                              <div className="max-w-xs">
                                {memberTeams.slice(0, 2).map((team: any, idx: number) => (
                                  <div key={`${member.id}-table-team-${team.id}-${idx}`} className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-950/30 rounded-md px-2 py-1 mb-1">
                                    <span className="font-medium text-foreground truncate flex-1">{team.name}</span>
                                    <Badge variant="outline" className="text-xs ml-2 shrink-0">
                                      {team.role === 'trainer' ? 'Trainer' : 
                                       team.role === 'co-trainer' ? 'Co-Trainer' :
                                       team.role === 'assistant' ? 'Assistenz' :
                                       team.role === 'manager' ? 'Manager' :
                                       team.role === 'physiotherapist' ? 'Physio' :
                                       team.role === 'doctor' ? 'Arzt' : team.role}
                                    </Badge>
                                  </div>
                                ))}
                                {memberTeams.length > 2 && (
                                  <div className="text-xs text-muted-foreground text-center py-1">
                                    +{memberTeams.length - 2} weitere Teams
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">
                                Keine Team-Zuordnungen
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {getStatusBadge(member.status)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewMember(member)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleStatus(member)}
                                  disabled={toggleMemberStatusMutation.isPending}
                                  className={member.status === 'active' ? "text-orange-600 focus:text-orange-600" : "text-green-600 focus:text-green-600"}
                                >
                                  {member.status === 'active' ? (
                                    <>
                                      <AlertCircle className="h-4 w-4 mr-2" />
                                      Deaktivieren
                                    </>
                                  ) : (
                                    <>
                                      <User className="h-4 w-4 mr-2" />
                                      Aktivieren
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteMember(member)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Modal */}
      <Dialog open={memberModalOpen} onOpenChange={setMemberModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  {selectedMember ? 'Mitglied bearbeiten' : 'Neues Mitglied'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedMember ? 'Bearbeiten Sie die Mitgliederdaten und Team-Zuordnungen' : 'Erstellen Sie ein neues Mitglied und ordnen Sie es Teams zu'}
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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">E-Mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="max@example.com" {...field} className="bg-background border-border text-foreground" />
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
                      <FormLabel className="text-foreground">Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="+49 123 456789" {...field} className="bg-background border-border text-foreground" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Geburtsdatum</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-background border-border text-foreground" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="joinDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Beitrittsdatum</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-background border-border text-foreground" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="membershipNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Mitgliedsnummer</FormLabel>
                      <FormControl>
                        <Input placeholder="M001" {...field} className="bg-background border-border text-foreground" />
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
                      <FormLabel className="text-foreground">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Status wählen" />
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
                    <FormLabel className="text-foreground">Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Musterstraße 123, 12345 Musterstadt" {...field} className="bg-background border-border text-foreground" />
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
                    <FormLabel className="text-foreground">Notizen</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Zusätzliche Informationen..." {...field} className="bg-background border-border text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                                variant={isAssigned ? "default" : "outline"}
                                size="sm"
                                className={`
                                  h-8 px-3 rounded-lg transition-all duration-200
                                  ${isAssigned 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                                    : 'hover:bg-muted'
                                  }
                                `}
                                onClick={() => {
                                  if (isAssigned) {
                                    setSelectedTeamMemberships(prev => 
                                      prev.filter(tm => tm.teamId !== team.id)
                                    );
                                  } else {
                                    setSelectedTeamMemberships(prev => [
                                      ...prev,
                                      { teamId: team.id, role: 'trainer' }
                                    ]);
                                  }
                                }}
                              >
                                {isAssigned ? 'Zugeordnet' : 'Zuordnen'}
                              </Button>
                              
                              <div>
                                <div className="font-medium text-sm text-foreground">{team.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {team.category && `${team.category} • `}
                                  {team.ageGroup || 'Erwachsene'}
                                </div>
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

              <DialogFooter className="flex gap-3 pt-6 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setMemberModalOpen(false)}
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
                      {selectedMember ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Aktualisieren
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Erstellen
                        </>
                      )}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-destructive" />
              Mitglied löschen
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Sind Sie sicher, dass Sie <strong className="text-foreground">{memberToDelete?.firstName} {memberToDelete?.lastName}</strong> löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMemberMutation.isPending}
            >
              {deleteMemberMutation.isPending ? "Löschen..." : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary/60" />
                </div>
                <div>
                  <div className="text-xl font-bold">
                    {viewingMember?.firstName} {viewingMember?.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Mitgliederdetails
                  </div>
                </div>
              </div>
              {viewingMember && (
                <div className="mt-1">
                  {getStatusBadge(viewingMember.status)}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {viewingMember && (
            <div className="space-y-6 mt-6">


              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewingMember.membershipNumber && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Mitgliedsnummer</label>
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{viewingMember.membershipNumber}</span>
                    </div>
                  </div>
                )}
                
                {viewingMember.joinDate && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Beitrittsdatum</label>
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{new Date(viewingMember.joinDate).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Kontaktinformationen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingMember.email && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">E-Mail</label>
                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{viewingMember.email}</span>
                      </div>
                    </div>
                  )}
                  
                  {viewingMember.phone && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Telefon</label>
                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{viewingMember.phone}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Persönliche Informationen</h3>
                <div className="grid grid-cols-1 gap-4">
                  {viewingMember.birthDate && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Geburtsdatum</label>
                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(viewingMember.birthDate).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                  )}
                  
                  {viewingMember.address && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{viewingMember.address}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {viewingMember.notes && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notizen</h3>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingMember.notes}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button
                  onClick={() => setIsDetailDialogOpen(false)}
                  variant="outline"
                >
                  Schließen
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    handleEditMember(viewingMember);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
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