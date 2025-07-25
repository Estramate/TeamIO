import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { Player, insertPlayerSchema, type InsertPlayer, Team } from "@shared/schema";
import { z } from "zod";
import { CalendarDays, Calendar, UserPlus, Users, MoreHorizontal, Eye, Edit2, Trash2, MapPin, Phone, Mail, LayoutGrid, List, Search, Filter, Activity, XCircle, CheckCircle2 } from "lucide-react";

const positionOptions = [
  { value: "Tor", label: "Tor" },
  { value: "Verteidigung", label: "Verteidigung" },
  { value: "Mittelfeld", label: "Mittelfeld" },
  { value: "Sturm", label: "Sturm" },
];

// Erweiterte Spieler-Validierung mit Datumslogik
const playerFormSchema = insertPlayerSchema.omit({ clubId: true }).refine((data) => {
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
  // Prüfe dass Vertragsende nicht vor Vertragsbeginn liegt
  if (data.contractEnd && data.contractStart) {
    const contractStart = new Date(data.contractStart);
    const contractEnd = new Date(data.contractEnd);
    return contractEnd >= contractStart;
  }
  return true;
}, {
  message: "Vertragsende darf nicht vor dem Vertragsbeginn liegen",
  path: ["contractEnd"]
}).refine((data) => {
  // Prüfe dass Vertragsbeginn nicht vor Geburtsdatum liegt
  if (data.contractStart && data.birthDate) {
    const birthDate = new Date(data.birthDate);
    const contractStart = new Date(data.contractStart);
    return contractStart >= birthDate;
  }
  return true;
}, {
  message: "Vertragsbeginn darf nicht vor dem Geburtsdatum liegen",
  path: ["contractStart"]
});

const statusOptions = [
  { value: "active", label: "Aktiv" },
  { value: "injured", label: "Verletzt" },
  { value: "suspended", label: "Gesperrt" },
  { value: "inactive", label: "Inaktiv" },
];

const footOptions = [
  { value: "left", label: "Links" },
  { value: "right", label: "Rechts" },
  { value: "both", label: "Beide" },
];

export default function Players() {
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const { selectedClub } = useClub();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPage } = usePage();

  useEffect(() => {
    setPage("Spieler", "Verwalten Sie alle Spieler des Vereins");
  }, [setPage]);

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte wählen Sie einen Verein aus, um Spieler zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  // Fetch players
  const { data: players = [], isLoading, error } = useQuery({
    queryKey: [`/api/clubs/${selectedClub.id}/players`],
    enabled: !!selectedClub?.id,
  });

  // Fetch teams for assignments
  const { data: teams = [] } = useQuery({
    queryKey: [`/api/clubs/${selectedClub.id}/teams`],
    enabled: !!selectedClub?.id,
  });

  // Form for creating/editing players
  const form = useForm<InsertPlayer>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      jerseyNumber: undefined,
      position: "",
      birthDate: "",
      phone: "",
      email: "",
      address: "",
      nationality: "",
      profileImageUrl: "",
      height: undefined,
      weight: undefined,
      preferredFoot: "",
      status: "active",
      contractStart: "",
      contractEnd: "",
      salary: undefined,
      notes: "",
    },
  });

  // Create player mutation
  const createPlayerMutation = useMutation({
    mutationFn: async (data: InsertPlayer) => {
      return await apiRequest("POST", `/api/clubs/${selectedClub.id}/players`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClub.id}/players`] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Erfolg",
        description: "Spieler wurde erfolgreich erstellt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Fehler beim Erstellen des Spielers.",
        variant: "destructive",
      });
    },
  });

  // Update player mutation
  const updatePlayerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertPlayer }) => {
      return await apiRequest("PATCH", `/api/clubs/${selectedClub}/players/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClub}/players`] });
      setIsCreateDialogOpen(false);
      setEditingPlayer(null);
      form.reset();
      toast({
        title: "Erfolg",
        description: "Spieler wurde erfolgreich aktualisiert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Spielers.",
        variant: "destructive",
      });
    },
  });

  // Status toggle mutation for players
  const togglePlayerStatusMutation = useMutation({
    mutationFn: async ({ playerId, newStatus }: { playerId: number; newStatus: string }) => {
      return await apiRequest("PATCH", `/api/clubs/${selectedClub}/players/${playerId}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClub}/players`] });
      toast({
        title: "Erfolg",
        description: "Spieler-Status wurde erfolgreich geändert",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden",
        variant: "destructive",
      });
    },
  });

  // Delete player mutation
  const deletePlayerMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/clubs/${selectedClub}/players/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClub}/players`] });
      toast({
        title: "Erfolg",
        description: "Spieler wurde erfolgreich gelöscht.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Spielers.",
        variant: "destructive",
      });
    },
  });

  // Get player teams data from the player object directly
  const getPlayerTeams = (player: Player) => {
    return (player as any).teams || [];
  };

  // Filter players 
  const filteredPlayers = (players as Player[]).filter((player: Player) => {
    const matchesSearch = 
      player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.jerseyNumber && player.jerseyNumber.toString().includes(searchTerm));
    
    const matchesPosition = positionFilter === "all" || player.position === positionFilter;
    const matchesStatus = statusFilter === "all" || player.status === statusFilter;
    
    // Team filter
    const matchesTeam = selectedTeam === "all" || 
      getPlayerTeams(player).some((team: any) => team.id.toString() === selectedTeam);
    
    return matchesSearch && matchesPosition && matchesStatus && matchesTeam;
  });

  // Get unique teams that have players
  const teamsWithPlayers = (teams as Team[]).map((team: Team) => {
    const playersInTeam = (players as Player[]).filter(player => 
      getPlayerTeams(player).some((playerTeam: any) => playerTeam.id === team.id)
    );
    return { ...team, playerCount: playersInTeam.length };
  }).filter((team: any) => team.playerCount > 0);

  const onSubmit = (data: InsertPlayer) => {
    if (editingPlayer) {
      updatePlayerMutation.mutate({ id: editingPlayer.id, data });
    } else {
      createPlayerMutation.mutate(data);
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    form.reset({
      firstName: player.firstName,
      lastName: player.lastName,
      jerseyNumber: player.jerseyNumber || undefined,
      position: player.position || "",
      birthDate: player.birthDate || "",
      phone: player.phone || "",
      email: player.email || "",
      address: player.address || "",
      nationality: player.nationality || "",
      profileImageUrl: player.profileImageUrl || undefined,
      height: player.height || undefined,
      weight: player.weight || undefined,
      preferredFoot: player.preferredFoot || "",
      status: player.status,
      contractStart: player.contractStart || "",
      contractEnd: player.contractEnd || "",
      salary: player.salary ? player.salary.toString() : undefined,
      notes: player.notes || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (player: Player) => {
    if (confirm(`Möchten Sie ${player.firstName} ${player.lastName} wirklich löschen?`)) {
      deletePlayerMutation.mutate(player.id);
    }
  };

  const handleViewPlayer = (player: Player) => {
    setViewingPlayer(player);
    setIsDetailDialogOpen(true);
  };

  const handleTogglePlayerStatus = (player: Player) => {
    const newStatus = player.status === 'active' ? 'inactive' : 'active';
    togglePlayerStatusMutation.mutate({
      playerId: player.id,
      newStatus
    });
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "Tor": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Verteidigung": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Mittelfeld": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Sturm": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Status badge variant - unified with teams and members
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
      case 'injured':
      case 'suspended':
        return 'destructive';
      default:
        return 'destructive';
    }
  };

  // Keep getStatusColor for positions (not status)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "injured": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "suspended": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "inactive": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
  };

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte wählen Sie einen Verein aus, um Spieler zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-background p-6">
        {/* Header Section with Search, Filters and Add Button */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Name oder Trikotnummer suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-xl border bg-background"
                />
              </div>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl border bg-background">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Positionen</SelectItem>
                  {positionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32 h-10 rounded-xl border bg-background">
                  <SelectValue placeholder="Status" />
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
              <Button 
                onClick={() => { setEditingPlayer(null); form.reset(); setIsCreateDialogOpen(true); }}
                className="w-full sm:w-auto sm:ml-auto h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Spieler hinzufügen
              </Button>
            </div>
          </div>
        </div>

        {/* Team Filter Pills */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTeam("all")}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                selectedTeam === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Alle Teams ({(players as Player[]).length})
            </button>
            {teamsWithPlayers.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id.toString())}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  selectedTeam === team.id.toString()
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {team.name} ({(team as any).playerCount})
              </button>
            ))}
          </div>
        </div>

      {/* Content Section - Scrollable */}
      <div>
        {/* Players Content */}
          {isLoading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-muted rounded w-full"></div>
                        <div className="h-2 bg-muted rounded w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Spieler</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-full"></div>
                            <div>
                              <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                              <div className="h-3 bg-muted rounded w-16"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><div className="h-3 bg-muted rounded w-20"></div></TableCell>
                        <TableCell><div className="h-3 bg-muted rounded w-16"></div></TableCell>
                        <TableCell><div className="h-3 bg-muted rounded w-32"></div></TableCell>
                        <TableCell><div className="h-8 w-8 bg-muted rounded"></div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )
          ) : filteredPlayers.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredPlayers.map((player: Player) => (
                  <Card 
                    key={player.id} 
                    className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md overflow-hidden"
                  >
                    {/* Einfacher grauer Header - einheitlich mit anderen Seiten */}
                    <div className="h-2 bg-gradient-to-r from-muted to-muted/80"></div>
                    
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Profilbild oder Avatar */}
                            <div className="relative shrink-0">
                              {player.profileImageUrl ? (
                                <img
                                  src={player.profileImageUrl}
                                  alt={`${player.firstName} ${player.lastName}`}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-muted/20"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.style.display = 'none';
                                    img.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center ${player.profileImageUrl ? 'hidden' : ''}`}>
                                <Users className="h-6 w-6 text-muted-foreground" />
                              </div>
                              {player.jerseyNumber && (
                                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                  {player.jerseyNumber}
                                </div>
                              )}
                            </div>
                            
                            {/* Name und Position */}
                            <div className="min-w-0">
                              <h3 
                                className="text-lg font-semibold text-foreground truncate cursor-pointer hover:underline"
                                onClick={() => handleViewPlayer(player)}
                                title={`${player.firstName} ${player.lastName}`}
                              >
                                {player.firstName} {player.lastName}
                              </h3>
                              {player.position && (
                                <p className="text-sm text-muted-foreground">
                                  {player.position}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewPlayer(player)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(player)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(player)}
                              className={player.status === 'active' ? "text-orange-600 focus:text-orange-600" : "text-green-600 focus:text-green-600"}
                            >
                              {player.status === 'active' ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Deaktivieren
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Aktivieren
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(player)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Status und Teams */}
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant={getStatusBadgeVariant(player.status)}>
                          {statusOptions.find(s => s.value === player.status)?.label || player.status}
                        </Badge>
                        {getPlayerTeams(player).length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {getPlayerTeams(player).length} Team{getPlayerTeams(player).length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      {/* Player Details */}
                      <div className="space-y-3 text-sm">
                        {/* Teams */}
                        {getPlayerTeams(player).length > 0 && (
                          <div className="flex items-center justify-between py-1">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Teams
                            </span>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {getPlayerTeams(player).slice(0, 2).map((team: any) => (
                                <span key={team.id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                                  {team.name}
                                </span>
                              ))}
                              {getPlayerTeams(player).length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{getPlayerTeams(player).length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Alter */}
                        {player.birthDate && (
                          <div className="flex items-center justify-between py-1">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Alter
                            </span>
                            <span className="font-medium">
                              {new Date().getFullYear() - new Date(player.birthDate).getFullYear()} Jahre
                            </span>
                          </div>
                        )}

                        {/* Physische Daten */}
                        {(player.height || player.weight) && (
                          <div className="flex items-center justify-between py-1">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Physik
                            </span>
                            <span className="font-medium">
                              {player.height && `${player.height}cm`}
                              {player.height && player.weight && " • "}
                              {player.weight && `${player.weight}kg`}
                            </span>
                          </div>
                        )}

                        {/* Nationalität */}
                        {player.nationality && (
                          <div className="flex items-center justify-between py-1">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Land
                            </span>
                            <span className="font-medium">{player.nationality}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="overflow-hidden border-muted/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">Spieler</TableHead>
                      <TableHead className="font-semibold">Position & Status</TableHead>
                      <TableHead className="font-semibold">Teams & Details</TableHead>
                      <TableHead className="font-semibold">Kontakt</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.map((player: Player) => (
                      <TableRow key={player.id} className="group hover:bg-primary/5 transition-colors border-muted/30">
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="relative shrink-0">
                              {player.profileImageUrl ? (
                                <img
                                  src={player.profileImageUrl}
                                  alt={`${player.firstName} ${player.lastName}`}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.style.display = 'none';
                                    img.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20 flex items-center justify-center ${player.profileImageUrl ? 'hidden' : ''}`}>
                                <Users className="h-5 w-5 text-primary/60" />
                              </div>
                              {player.jerseyNumber && (
                                <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
                                  {player.jerseyNumber}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div 
                                className="font-semibold text-base cursor-pointer hover:text-primary hover:underline transition-colors"
                                onClick={() => handleViewPlayer(player)}
                              >
                                {player.firstName} {player.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {player.nationality && `${player.nationality}`}
                                {player.birthDate && (
                                  <>
                                    {player.nationality && " • "}
                                    {new Date().getFullYear() - new Date(player.birthDate).getFullYear()} Jahre
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            {player.position && (
                              <span className={`inline-block text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${getPositionColor(player.position)}`}>
                                {player.position}
                              </span>
                            )}
                            <div>
                              <Badge variant={getStatusBadgeVariant(player.status)} className="shadow-sm">
                                {statusOptions.find(s => s.value === player.status)?.label || player.status}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            {/* Teams */}
                            {getPlayerTeams(player).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {getPlayerTeams(player).slice(0, 3).map((team: any, idx: number) => (
                                  <span key={team.id} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                                    {team.name}
                                  </span>
                                ))}
                                {getPlayerTeams(player).length > 3 && (
                                  <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded-md">
                                    +{getPlayerTeams(player).length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Physical Stats */}
                            {(player.height || player.weight) && (
                              <div className="text-xs text-muted-foreground">
                                {player.height && `${player.height}cm`}
                                {player.height && player.weight && " • "}
                                {player.weight && `${player.weight}kg`}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {player.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-primary" />
                                <span>{player.phone}</span>
                              </div>
                            )}
                            {player.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-primary" />
                                <span className="truncate max-w-32">{player.email}</span>
                              </div>
                            )}
                            {!player.phone && !player.email && (
                              <span className="text-muted-foreground/60">Keine Kontaktdaten</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-70 hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(player)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleTogglePlayerStatus(player)}
                                disabled={togglePlayerStatusMutation.isPending}
                                className={player.status === 'active' ? "text-orange-600 focus:text-orange-600" : "text-green-600 focus:text-green-600"}
                              >
                                {player.status === 'active' ? (
                                  <>
                                    <Users className="mr-2 h-4 w-4" />
                                    Deaktivieren
                                  </>
                                ) : (
                                  <>
                                    <Users className="mr-2 h-4 w-4" />
                                    Aktivieren
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(player)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Keine Spieler gefunden</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {searchTerm || positionFilter !== "all" || statusFilter !== "all" || selectedTeam !== "all"
                    ? "Keine Spieler entsprechen den aktuellen Filterkriterien. Versuchen Sie andere Filter."
                    : "Noch keine Spieler hinzugefügt. Fügen Sie den ersten Spieler hinzu."}
                </p>
                {!searchTerm && positionFilter === "all" && statusFilter === "all" && selectedTeam === "all" && (
                  <Button onClick={() => { setEditingPlayer(null); form.reset(); setIsCreateDialogOpen(true); }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ersten Spieler hinzufügen
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Player Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="relative">
                    {viewingPlayer?.profileImageUrl ? (
                      <img
                        src={viewingPlayer.profileImageUrl}
                        alt={`${viewingPlayer.firstName} ${viewingPlayer.lastName}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-muted"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          img.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20 flex items-center justify-center ${viewingPlayer?.profileImageUrl ? 'hidden' : ''}`}>
                      <Users className="h-6 w-6 text-primary/60" />
                    </div>
                    {viewingPlayer?.jerseyNumber && (
                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
                        {viewingPlayer.jerseyNumber}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xl font-bold">
                      {viewingPlayer?.firstName} {viewingPlayer?.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Spielerdetails
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              {viewingPlayer && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Grunddaten</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vorname:</span>
                          <span className="font-medium">{viewingPlayer.firstName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nachname:</span>
                          <span className="font-medium">{viewingPlayer.lastName}</span>
                        </div>
                        {viewingPlayer.jerseyNumber && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trikotnummer:</span>
                            <span className="font-medium">#{viewingPlayer.jerseyNumber}</span>
                          </div>
                        )}
                        {viewingPlayer.position && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Position:</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPositionColor(viewingPlayer.position)}`}>
                              {viewingPlayer.position}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(viewingPlayer.status)}`}>
                            {statusOptions.find(s => s.value === viewingPlayer.status)?.label || viewingPlayer.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Persönliche Daten</h3>
                      
                      <div className="space-y-3">
                        {viewingPlayer.birthDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Geburtsdatum:
                            </span>
                            <span className="font-medium">
                              {new Date(viewingPlayer.birthDate).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        )}
                        {viewingPlayer.nationality && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Nationalität:
                            </span>
                            <span className="font-medium">{viewingPlayer.nationality}</span>
                          </div>
                        )}
                        {viewingPlayer.height && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Größe:</span>
                            <span className="font-medium">{viewingPlayer.height} cm</span>
                          </div>
                        )}
                        {viewingPlayer.weight && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gewicht:</span>
                            <span className="font-medium">{viewingPlayer.weight} kg</span>
                          </div>
                        )}
                        {viewingPlayer.preferredFoot && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bevorzugter Fuß:</span>
                            <span className="font-medium">
                              {footOptions.find(f => f.value === viewingPlayer.preferredFoot)?.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {(viewingPlayer.phone || viewingPlayer.email || viewingPlayer.address) && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Kontaktdaten</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewingPlayer.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm text-muted-foreground">Telefon</div>
                              <div className="font-medium">{viewingPlayer.phone}</div>
                            </div>
                          </div>
                        )}
                        {viewingPlayer.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm text-muted-foreground">E-Mail</div>
                              <div className="font-medium">{viewingPlayer.email}</div>
                            </div>
                          </div>
                        )}
                        {viewingPlayer.address && (
                          <div className="flex items-start gap-3 md:col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="text-sm text-muted-foreground">Adresse</div>
                              <div className="font-medium">{viewingPlayer.address}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contract Info */}
                  {(viewingPlayer.contractStart || viewingPlayer.contractEnd || viewingPlayer.salary) && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Vertragsdaten</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {viewingPlayer.contractStart && (
                          <div>
                            <div className="text-sm text-muted-foreground">Vertragsbeginn</div>
                            <div className="font-medium">
                              {new Date(viewingPlayer.contractStart).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                        )}
                        {viewingPlayer.contractEnd && (
                          <div>
                            <div className="text-sm text-muted-foreground">Vertragsende</div>
                            <div className="font-medium">
                              {new Date(viewingPlayer.contractEnd).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                        )}
                        {viewingPlayer.salary && (
                          <div>
                            <div className="text-sm text-muted-foreground">Gehalt</div>
                            <div className="font-medium">{viewingPlayer.salary.toLocaleString('de-DE')} €</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Teams */}
                  {getPlayerTeams(viewingPlayer).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Teams</h3>
                      <div className="flex flex-wrap gap-2">
                        {getPlayerTeams(viewingPlayer).map((team) => (
                          <Badge key={team.id} variant="secondary" className="text-sm">
                            {team.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {viewingPlayer.notes && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Notizen</h3>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{viewingPlayer.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        handleEdit(viewingPlayer);
                      }}
                      variant="outline"
                      className="mr-2"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </Button>
                    <Button
                      onClick={() => setIsDetailDialogOpen(false)}
                    >
                      Schließen
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Create/Edit Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlayer ? "Spieler bearbeiten" : "Neuen Spieler hinzufügen"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Grunddaten</h3>
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vorname*</FormLabel>
                            <FormControl>
                              <Input placeholder="Vorname" {...field} />
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
                            <FormLabel>Nachname*</FormLabel>
                            <FormControl>
                              <Input placeholder="Nachname" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="jerseyNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trikotnummer</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1-99" 
                                {...field} 
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Position wählen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {positionOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Weitere Daten</h3>
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Geburtsdatum</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationalität</FormLabel>
                            <FormControl>
                              <Input placeholder="Österreich" {...field} value={field.value || ""} />
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
                              <Input placeholder="+43 664 123 456" {...field} value={field.value || ""} />
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
                              <Input type="email" placeholder="spieler@example.com" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Abbrechen
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPlayerMutation.isPending || updatePlayerMutation.isPending}
                    >
                      {editingPlayer ? "Aktualisieren" : "Erstellen"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
    </>
  );
}