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

  const { data: teams = [], isLoading: isTeamsLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: TeamFormData) => {
      return await apiRequest(`/api/clubs/${selectedClub?.id}/teams`, {
        method: 'POST',
        body: JSON.stringify({
          ...teamData,
          maxMembers: teamData.maxMembers ? Number(teamData.maxMembers) : null,
        }),
      });
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
      return await apiRequest(`/api/clubs/${selectedClub?.id}/teams/${selectedTeam.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...teamData,
          maxMembers: teamData.maxMembers ? Number(teamData.maxMembers) : null,
        }),
      });
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

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      return await apiRequest(`/api/clubs/${selectedClub?.id}/teams/${teamId}`, {
        method: 'DELETE',
      });
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
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header Section - Fixed */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Search and Filter */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Teams suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48 bg-background border-input">
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
              </div>

              <div className="flex items-center gap-3 ml-4">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`min-w-[40px] h-8 px-2 rounded-md transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`min-w-[40px] h-8 px-2 rounded-md transition-all ${
                      viewMode === 'list' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <List className="w-4 h-4" />
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
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-auto p-6">
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
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                          {team.category === 'youth' ? 'Jugend' :
                           team.category === 'senior' ? 'Senioren' : 'Amateur'}
                        </Badge>
                      )}
                      {team.ageGroup && (
                        <Badge variant="outline">{team.ageGroup}</Badge>
                      )}
                      {team.gender && (
                        <Badge variant="outline">
                          {team.gender === 'male' ? 'Herren' :
                           team.gender === 'female' ? 'Damen' : 'Mixed'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={team.status === 'active' ? 'default' : 'secondary'}
                  >
                    {team.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {team.description && (
                  <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>0/{team.maxMembers || 20} Mitglieder</span>
                  </div>
                  <span className="text-xs">
                    {team.season && `Saison: ${team.season}`}
                  </span>
                </div>
                
                <div className="mt-4 flex items-center justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    Bearbeiten
                  </Button>
                  <Button variant="outline" size="sm">
                    Mitglieder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
