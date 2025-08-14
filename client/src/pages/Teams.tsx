import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNotificationTriggers } from "@/utils/notificationTriggers";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { usePermissions } from "@/hooks/use-permissions";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { invalidateEntityData } from "@/lib/cache-invalidation";
import { FeatureGate, MemberLimitWarning } from "@/components/FeatureGate";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ProtectedButton } from "@/components/ui/protected-button";
import { ProtectedForm } from "@/components/ui/protected-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  UsersRound, 
  Search, 
  Plus, 
  Users, 
  LayoutGrid, 
  List, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  Trophy
} from "lucide-react";

// Form Schema
const teamFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  category: z.string().optional(),
  ageGroup: z.string().optional(),
  gender: z.string().optional(),
  description: z.string().optional(),
  maxMembers: z.number().optional(),
  status: z.string().default("active"),
  season: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

export default function Teams() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { invalidateRelevantCache } = useNotificationTriggers();
  const { setPage } = usePage();
  const queryClient = useQueryClient();
  const permissions = usePermissions();

  // Set page title
  useEffect(() => {
    setPage("Teams", "Verwalten Sie Ihre Vereinsteams und Kategorien");
  }, [setPage]);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<any>(null);
  const [selectedTrainers, setSelectedTrainers] = useState<{id: number, role: string}[]>([]);

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      category: "",
      ageGroup: "",
      gender: "",
      description: "",
      status: "active",
      season: "2024/25",
    },
  });

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

  const { data: teams = [], isLoading: isTeamsLoading } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id && isAuthenticated,
  });

  // Load players for counting
  const { data: players = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'players'],
    enabled: !!selectedClub?.id && isAuthenticated,
    retry: false,
  });

  // Load members for trainer selection
  const { data: members = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'members'],
    enabled: !!selectedClub?.id && isAuthenticated,
    retry: false,
  });

  // Load team memberships
  const { data: teamMemberships = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'team-memberships'],
    enabled: !!selectedClub?.id && isAuthenticated,
    retry: false,
  });

  // Update selected trainers when teamMemberships change and we have a selected team
  useEffect(() => {
    if (selectedTeam && teamMemberships.length > 0 && teamModalOpen) {
      console.log('🔄 Updating trainers for team:', selectedTeam.id, 'from memberships:', teamMemberships);
      const currentTrainers = teamMemberships
        .filter((tm: any) => 
          tm.teamId === selectedTeam.id && 
          ['trainer', 'co-trainer', 'assistant', 'manager', 'physiotherapist', 'doctor'].includes(tm.membershipRole)
        )
        .map((tm: any) => ({ id: tm.memberId, role: tm.membershipRole }))
        // Remove duplicates based on id and role combination
        .filter((trainer, index, self) => 
          index === self.findIndex(t => t.id === trainer.id && t.role === trainer.role)
        );
      console.log('✅ Setting selected trainers:', currentTrainers);
      setSelectedTrainers(currentTrainers);
    }
  }, [selectedTeam, teamMemberships, teamModalOpen]);

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: TeamFormData) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...teamData,
          maxMembers: teamData.maxMembers ? Number(teamData.maxMembers) : null,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create team');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      const teamName = variables.name;
      
      // Trigger intelligent notification - team created
      // notifyTeamChange(teamName, 'erstellt'); // Function not available
      
      invalidateEntityData(queryClient, selectedClub?.id!, 'teams');
      // invalidateRelevantCache('team', selectedClub?.id); // Not using cache invalidation here
      
      setTeamModalOpen(false);
      setSelectedTeam(null);
      form.reset();
      
      toast({
        title: "Erfolg",
        description: "Team wurde erfolgreich erstellt",
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
        description: "Team konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async (teamData: TeamFormData) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/teams/${selectedTeam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...teamData,
          maxMembers: teamData.maxMembers ? Number(teamData.maxMembers) : null,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update team');
      }
      return response.json();
    },
    onSuccess: () => {
      invalidateEntityData(queryClient, selectedClub?.id!, 'teams');
      setTeamModalOpen(false);
      setSelectedTeam(null);
      form.reset();
      toast({
        title: "Erfolg", 
        description: "Team wurde erfolgreich aktualisiert",
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
        description: "Team konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  // Status toggle mutation for teams
  const toggleTeamStatusMutation = useMutation({
    mutationFn: async ({ teamId, newStatus }: { teamId: number; newStatus: string }) => {
      await apiRequest("PUT", `/api/clubs/${selectedClub?.id}/teams/${teamId}`, { status: newStatus });
    },
    onSuccess: () => {
      invalidateEntityData(queryClient, selectedClub?.id!, 'teams');
      toast({
        title: "Erfolg",
        description: "Team-Status wurde erfolgreich geändert",
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

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/teams/${teamId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete team');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'teams'] });
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
      toast({
        title: "Erfolg",
        description: "Team wurde erfolgreich gelöscht",
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
        description: "Team konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  const filteredTeams = teams.filter((team: any) => {
    const matchesSearch = 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.ageGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || team.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddTeam = () => {
    setSelectedTeam(null);
    form.reset({
      name: "",
      category: "",
      ageGroup: "",
      gender: "",
      description: "",
      status: "active",
      season: "2024/25",
    });
    setSelectedTrainers([]);
    setTeamModalOpen(true);
  };

  const handleEditTeam = (team: any) => {
    setSelectedTeam(team);
    form.reset({
      name: team.name,
      category: team.category || "",
      ageGroup: team.ageGroup || "",
      gender: team.gender || "",
      description: team.description || "",
      maxMembers: team.maxMembers || undefined,
      status: team.status,
      season: team.season || "2024/25",
    });
    
    // Load current trainers/staff for this team with their roles
    console.log('🔍 Loading trainers for team:', team.id, 'from teamMemberships:', teamMemberships);
    const currentTrainers = teamMemberships
      .filter((tm: any) => 
        tm.teamId === team.id && 
        ['trainer', 'co-trainer', 'assistant', 'manager', 'physiotherapist', 'doctor'].includes(tm.membershipRole)
      )
      .map((tm: any) => ({ id: tm.memberId, role: tm.membershipRole }))
      // Remove duplicates based on id and role combination
      .filter((trainer, index, self) => 
        index === self.findIndex(t => t.id === trainer.id && t.role === trainer.role)
      );
    console.log('✅ Found current trainers:', currentTrainers);
    setSelectedTrainers(currentTrainers);
    
    setTeamModalOpen(true);
  };

  const handleDeleteTeam = (team: any) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const handleToggleTeamStatus = (team: any) => {
    const newStatus = team.status === 'active' ? 'inactive' : 'active';
    toggleTeamStatusMutation.mutate({
      teamId: team.id,
      newStatus
    });
  };

  const handleViewTeam = (team: any) => {
    setViewingTeam(team);
    setIsDetailDialogOpen(true);
  };

  // Update team memberships for trainers
  const updateTeamMembershipsMutation = useMutation({
    mutationFn: async ({ teamId, trainers }: { teamId: number; trainers: {id: number, role: string}[] }) => {
      // Remove existing trainer/staff memberships for this team
      await fetch(`/api/teams/${teamId}/trainers`, {
        method: 'DELETE',
      });

      // Add new trainer memberships with specific roles
      for (const trainer of trainers) {
        await fetch(`/api/teams/${teamId}/memberships`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            memberId: trainer.id,
            role: trainer.role,
            status: 'active',
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'team-memberships'] });
    },
  });

  const handleSubmit = async (data: TeamFormData) => {
    try {
      let team;
      if (selectedTeam) {
        team = await updateTeamMutation.mutateAsync(data);
      } else {
        team = await createTeamMutation.mutateAsync(data);
      }
      
      // Update trainer assignments
      const teamId = selectedTeam?.id || team.id;
      if (teamId && selectedTrainers.length >= 0) {
        await updateTeamMembershipsMutation.mutateAsync({
          teamId,
          trainers: selectedTrainers
        });
      }
    } catch (error) {

    }
  };

  const confirmDelete = () => {
    if (teamToDelete) {
      deleteTeamMutation.mutate(teamToDelete.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
        return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Aktiv</Badge>;
      case 'inactive': 
        return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Inaktiv</Badge>;
      case 'suspended': 
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Suspendiert</Badge>;
      default: 
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">{status}</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'inactive': return 'Inaktiv';
      case 'suspended': return 'Suspendiert';
      default: return status;
    }
  };

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <UsersRound className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground px-4">
            Bitte wählen Sie einen Verein aus, um Teams zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="teamManagement">
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
        {/* Header Section with Search, Filters and Add Button */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Teams suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-xl border bg-background"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl border bg-background">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  <SelectItem value="youth">Jugend</SelectItem>
                  <SelectItem value="erwachsene">Erwachsene</SelectItem>
                  <SelectItem value="amateur">Amateur</SelectItem>
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
                  <LayoutGrid className="h-4 w-4" />
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
              <ProtectedButton 
                requiresCreate={true}
                onClick={handleAddTeam} 
                className="w-full sm:w-auto sm:ml-auto h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Team hinzufügen
              </ProtectedButton>
            </div>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div>
          {isTeamsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">Keine Teams gefunden</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || categoryFilter !== 'all' 
                  ? "Versuchen Sie, Ihre Suchkriterien anzupassen."
                  : "Beginnen Sie mit dem Hinzufügen Ihres ersten Teams."}
              </p>
              {!searchTerm && categoryFilter === 'all' && (
                <Button onClick={handleAddTeam} className="mt-4 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Erstes Team hinzufügen
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTeams.map((team: any) => (
                <Card 
                  key={team.id} 
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md overflow-hidden"
                >
                  {/* Einfacher grauer Header - schlicht und modern */}
                  <div className="h-2 bg-gradient-to-r from-muted to-muted/80"></div>
                  
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🏆</span>
                          <h3 
                            className="text-lg font-semibold text-foreground truncate cursor-pointer hover:underline"
                            onClick={() => handleViewTeam(team)}
                            title={team.name}
                          >
                            {team.name}
                          </h3>
                        </div>
                        
                        {team.season && (
                          <p className="text-sm text-muted-foreground mb-3">
                            Saison {team.season}
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
                          <DropdownMenuItem onClick={() => handleViewTeam(team)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleTeamStatus(team)}
                            disabled={toggleTeamStatusMutation.isPending}
                            className={team.status === 'active' ? "text-orange-600 focus:text-orange-600" : "text-green-600 focus:text-green-600"}
                          >
                            {team.status === 'active' ? (
                              <>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Deaktivieren
                              </>
                            ) : (
                              <>
                                <Trophy className="h-4 w-4 mr-2" />
                                Aktivieren
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTeam(team)}
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
                      {getStatusBadge(team.status)}
                      {team.category && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {team.category === 'youth' ? 'Jugend' :
                           team.category === 'erwachsene' ? 'Erwachsene' : 
                           team.category === 'amateur' ? 'Amateur' : team.category}
                        </Badge>
                      )}
                    </div>

                    {/* Team Details */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between py-1">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Spieler
                        </span>
                        <span className="font-medium">
                          {(players as any[]).filter(p => p.teams?.some((t: any) => t.id === team.id)).length}
                        </span>
                      </div>

                      {team.ageGroup && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Altersgruppe
                          </span>
                          <span className="font-medium">{team.ageGroup}</span>
                        </div>
                      )}

                      {team.gender && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Geschlecht
                          </span>
                          <span className="font-medium">
                            {team.gender === 'male' ? 'Männlich' :
                             team.gender === 'female' ? 'Weiblich' :
                             team.gender === 'mixed' ? 'Gemischt' : team.gender}
                          </span>
                        </div>
                      )}

                      {team.description && (
                        <div className="pt-3 mt-3 border-t border-border">
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            {team.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden border-muted/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Kategorie & Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Spieler & Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Saison
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border/30">
                      {filteredTeams.map((team: any) => (
                        <tr key={team.id} className="group hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-4">
                              <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-sm">
                                  <Trophy className="h-6 w-6 text-primary/80" />
                                </div>
                                {team.category && (
                                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
                                    {team.category === 'youth' ? 'J' :
                                     team.category === 'erwachsene' ? 'E' : 
                                     team.category === 'amateur' ? 'A' : team.category.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div 
                                  className="font-semibold text-base cursor-pointer hover:text-primary hover:underline transition-colors"
                                  onClick={() => handleViewTeam(team)}
                                >
                                  {team.name}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {team.ageGroup && `${team.ageGroup}`}
                                  {team.gender && (
                                    <>
                                      {team.ageGroup && " • "}
                                      {team.gender === 'male' ? 'Männlich' :
                                       team.gender === 'female' ? 'Weiblich' :
                                       team.gender === 'mixed' ? 'Gemischt' : team.gender}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              {team.category && (
                                <Badge variant="secondary" className="text-xs shadow-sm">
                                  {team.category === 'youth' ? 'Jugend' :
                                   team.category === 'erwachsene' ? 'Erwachsene' : 
                                   team.category === 'amateur' ? 'Amateur' : team.category}
                                </Badge>
                              )}
                              <div>
                                {getStatusBadge(team.status)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                  {(players as any[]).filter(p => p.teams?.some((t: any) => t.id === team.id)).length} Spieler
                                </span>
                                {team.maxMembers && (
                                  <span className="text-muted-foreground text-xs">
                                    / {team.maxMembers} max
                                  </span>
                                )}
                              </div>
                              {team.description && (
                                <div className="text-xs text-muted-foreground line-clamp-2 max-w-48">
                                  {team.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                  {(players as any[]).filter(p => p.teams?.some((t: any) => t.id === team.id)).length} Spieler
                                </span>
                                {team.maxMembers && (
                                  <span className="text-muted-foreground text-xs">
                                    / {team.maxMembers} max
                                  </span>
                                )}
                              </div>
                              {team.description && (
                                <div className="text-xs text-muted-foreground line-clamp-2 max-w-48">
                                  {team.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium">
                              {team.season && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-green-600" />
                                  <span>{team.season}</span>
                                </div>
                              )}
                              {!team.season && (
                                <span className="text-muted-foreground">Keine Saison</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 opacity-70 hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleEditTeam(team)}
                                  disabled={!permissions?.canEdit}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleTeamStatus(team)}
                                  disabled={toggleTeamStatusMutation.isPending}
                                  className={team.status === 'active' ? "text-orange-600 focus:text-orange-600" : "text-green-600 focus:text-green-600"}
                                >
                                  {team.status === 'active' ? (
                                    <>
                                      <Users className="h-4 w-4 mr-2" />
                                      Deaktivieren
                                    </>
                                  ) : (
                                    <>
                                      <Users className="h-4 w-4 mr-2" />
                                      Aktivieren
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteTeam(team)}
                                  disabled={!permissions?.canDelete}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Team Add/Edit Modal */}
      <Dialog open={teamModalOpen} onOpenChange={setTeamModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTeam ? 'Team bearbeiten' : 'Neues Team hinzufügen'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. 1. Herren" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategorie wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="youth">Jugend</SelectItem>
                          <SelectItem value="erwachsene">Erwachsene</SelectItem>
                          <SelectItem value="amateur">Amateur</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ageGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altersgruppe</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. U16, Ü35" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geschlecht</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Geschlecht wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Herren</SelectItem>
                          <SelectItem value="female">Damen</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxMembers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max. Mitglieder</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="z.B. 25" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="season"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saison</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. 2024/25" {...field} />
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
                        placeholder="Beschreibung des Teams..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Trainerstab Auswahl */}
              <div className="space-y-3">
                <FormLabel>Trainerstab</FormLabel>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {members.filter((member: any) => member.status === 'active').length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Keine aktiven Mitglieder gefunden</p>
                    </div>
                  ) : (
                    members
                      .filter((member: any) => member.status === 'active')
                      .map((member: any) => {
                        const isSelected = selectedTrainers.some(t => t.id === member.id);
                        const currentRole = selectedTrainers.find(t => t.id === member.id)?.role || 'trainer';
                        
                        return (
                          <div key={member.id} className="flex items-center space-x-2 p-2 border rounded-md">
                            <Checkbox
                              id={`trainer-${member.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTrainers([...selectedTrainers, { id: member.id, role: 'trainer' }]);
                                } else {
                                  setSelectedTrainers(selectedTrainers.filter(t => t.id !== member.id));
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`trainer-${member.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer block"
                              >
                                {member.firstName} {member.lastName}
                                {member.email && (
                                  <span className="text-muted-foreground text-xs block">({member.email})</span>
                                )}
                              </label>
                            </div>
                            {isSelected && (
                              <Select
                                value={currentRole}
                                onValueChange={(role) => {
                                  setSelectedTrainers(prev => 
                                    prev.map(t => t.id === member.id ? { ...t, role } : t)
                                  );
                                }}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="trainer">Trainer</SelectItem>
                                  <SelectItem value="co-trainer">Co-Trainer</SelectItem>
                                  <SelectItem value="assistant">Assistenz</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="physiotherapist">Physiotherapeut</SelectItem>
                                  <SelectItem value="doctor">Arzt</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
                {selectedTrainers.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedTrainers.length} Trainer ausgewählt
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTeamModalOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTeamMutation.isPending || updateTeamMutation.isPending}
                >
                  {createTeamMutation.isPending || updateTeamMutation.isPending ? 'Speichern...' : 'Speichern'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team löschen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Sind Sie sicher, dass Sie das Team "{teamToDelete?.name}" löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteTeamMutation.isPending}
            >
              {deleteTeamMutation.isPending ? 'Lösche...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">🏆</span>
                <div>
                  <div className="text-xl font-bold">
                    {viewingTeam?.name}
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Teamdetails
                  </div>
                </div>
              </div>
              {viewingTeam && (
                <div className="mt-1">
                  {getStatusBadge(viewingTeam.status)}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {viewingTeam && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {viewingTeam.category && (
                  <Badge variant="secondary">
                    {viewingTeam.category === 'youth' ? 'Jugend' :
                     viewingTeam.category === 'erwachsene' ? 'Erwachsene' : 'Amateur'}
                  </Badge>
                )}
                {viewingTeam.ageGroup && (
                  <Badge variant="outline">{viewingTeam.ageGroup}</Badge>
                )}
                {viewingTeam.gender && (
                  <Badge variant="outline">
                    {viewingTeam.gender === 'male' ? 'Herren' :
                     viewingTeam.gender === 'female' ? 'Damen' : 'Mixed'}
                  </Badge>
                )}

              </div>
              
              {viewingTeam.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Beschreibung</h4>
                  <p className="text-sm text-muted-foreground">{viewingTeam.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Max. Mitglieder:</span>
                  <p className="text-muted-foreground">{viewingTeam.maxMembers || 'Nicht festgelegt'}</p>
                </div>
                <div>
                  <span className="font-medium">Saison:</span>
                  <p className="text-muted-foreground">{viewingTeam.season || 'Nicht festgelegt'}</p>
                </div>
              </div>
              
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
                    handleEditTeam(viewingTeam);
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
    </FeatureGate>
  );
}
