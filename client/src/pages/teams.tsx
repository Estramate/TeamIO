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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<any>(null);

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
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: teams = [], isLoading: isTeamsLoading } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'teams'] });
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
          window.location.href = "/api/login";
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
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'teams'] });
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
          window.location.href = "/api/login";
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
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'teams'] });
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
          window.location.href = "/api/login";
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
          window.location.href = "/api/login";
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

  const handleSubmit = (data: TeamFormData) => {
    if (selectedTeam) {
      updateTeamMutation.mutate(data);
    } else {
      createTeamMutation.mutate(data);
    }
  };

  const confirmDelete = () => {
    if (teamToDelete) {
      deleteTeamMutation.mutate(teamToDelete.id);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
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
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <div className="text-center py-12">
          <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte wählen Sie einen Verein aus, um Teams zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-background p-6">
        {/* Header Section with Search, Filters and Add Button */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Teams suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-xl border bg-background"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 h-10 rounded-xl border bg-background">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  <SelectItem value="youth">Jugend</SelectItem>
                  <SelectItem value="senior">Senioren</SelectItem>
                  <SelectItem value="amateur">Amateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex rounded-xl border bg-background p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 px-3 rounded-lg"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 px-3 rounded-lg"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Add Button */}
              <Button onClick={handleAddTeam} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Team hinzufügen
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div>
          {isTeamsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredTeams.map((team: any) => (
                <Card key={team.id} className="group hover:shadow-lg transition-all duration-300 border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:scale-[1.02] cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-base font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors hover:underline"
                          onClick={() => handleViewTeam(team)}
                        >
                          {team.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          {team.category && (
                            <Badge variant="secondary" className="text-xs">
                              {team.category}
                            </Badge>
                          )}
                          {team.ageGroup && (
                            <Badge variant="outline" className="text-xs">
                              {team.ageGroup}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleTeamStatus(team)}
                              disabled={toggleTeamStatusMutation.isPending}
                              className="text-orange-600 focus:text-orange-600"
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
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusBadgeVariant(team.status)}>
                          {getStatusLabel(team.status)}
                        </Badge>
                        {team.maxMembers && (
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            Max: {team.maxMembers}
                          </span>
                        )}
                      </div>
                      {team.season && (
                        <p className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {team.season}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Kategorie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Saison
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredTeams.map((team: any) => (
                        <tr key={team.id} className="group hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div 
                                className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors hover:underline"
                                onClick={() => handleViewTeam(team)}
                              >
                                {team.name}
                              </div>
                              {team.ageGroup && (
                                <div className="text-sm text-muted-foreground">
                                  {team.ageGroup}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-foreground">{team.category || '-'}</div>
                            {team.gender && (
                              <div className="text-sm text-muted-foreground">{team.gender}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStatusBadgeVariant(team.status)}>
                              {getStatusLabel(team.status)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {team.season || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                                <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleTeamStatus(team)}
                                  disabled={toggleTeamStatusMutation.isPending}
                                  className="text-orange-600 focus:text-orange-600"
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
                          <SelectItem value="senior">Senioren</SelectItem>
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
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {viewingTeam?.name}
            </DialogTitle>
          </DialogHeader>
          
          {viewingTeam && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {viewingTeam.category && (
                  <Badge variant="secondary">
                    {viewingTeam.category === 'youth' ? 'Jugend' :
                     viewingTeam.category === 'senior' ? 'Senioren' : 'Amateur'}
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
                <Badge variant={getStatusBadgeVariant(viewingTeam.status)}>
                  {getStatusLabel(viewingTeam.status)}
                </Badge>
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
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    handleEditTeam(viewingTeam);
                  }}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="flex-1"
                >
                  Schließen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
