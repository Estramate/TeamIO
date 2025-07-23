import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useClubStore } from "@/lib/clubStore";
import { usePage } from "@/contexts/PageContext";
import { Player, insertPlayerSchema, type InsertPlayer } from "@shared/schema";
import {
  Search,
  UserPlus,
  Users,
  MoreHorizontal,
  Edit2,
  Trash2,
} from "lucide-react";

const positionOptions = [
  { value: "Tor", label: "Tor" },
  { value: "Verteidigung", label: "Verteidigung" },
  { value: "Mittelfeld", label: "Mittelfeld" },
  { value: "Sturm", label: "Sturm" },
];

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
  
  const { selectedClub, setSelectedClub } = useClubStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPage } = usePage();

  // Auto-select first club if none selected
  const { data: clubs } = useQuery({
    queryKey: ["/api/clubs"],
  });

  useEffect(() => {
    if (clubs && clubs.length > 0 && !selectedClub) {
      setSelectedClub(clubs[0].id);
    }
  }, [clubs, selectedClub, setSelectedClub]);

  useEffect(() => {
    setPage("Spieler", "Verwalten Sie alle Spieler des Vereins");
  }, [setPage]);

  // Fetch players
  const { data: players = [], isLoading, error } = useQuery({
    queryKey: [`/api/clubs/${selectedClub}/players`],
    enabled: !!selectedClub,
  });

  // Fetch teams for assignments
  const { data: teams = [] } = useQuery({
    queryKey: [`/api/clubs/${selectedClub}/teams`],
    enabled: !!selectedClub,
  });

  // Form for creating/editing players
  const form = useForm<InsertPlayer>({
    resolver: zodResolver(insertPlayerSchema.omit({ clubId: true })),
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
      return await apiRequest(`/api/clubs/${selectedClub}/players`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClub}/players`] });
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
      return await apiRequest(`/api/players/${id}`, "PATCH", data);
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

  // Delete player mutation
  const deletePlayerMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/players/${id}`, "DELETE");
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

  // Filter players 
  const filteredPlayers = (players as Player[]).filter((player: Player) => {
    const matchesSearch = 
      player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.jerseyNumber && player.jerseyNumber.toString().includes(searchTerm));
    
    const matchesPosition = positionFilter === "all" || player.position === positionFilter;
    const matchesStatus = statusFilter === "all" || player.status === statusFilter;
    
    return matchesSearch && matchesPosition && matchesStatus;
  });

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
      profileImageUrl: player.profileImageUrl || "",
      height: player.height || undefined,
      weight: player.weight || undefined,
      preferredFoot: player.preferredFoot || "",
      status: player.status,
      contractStart: player.contractStart || "",
      contractEnd: player.contractEnd || "",
      salary: player.salary ? Number(player.salary) : undefined,
      notes: player.notes || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (player: Player) => {
    if (confirm(`Möchten Sie ${player.firstName} ${player.lastName} wirklich löschen?`)) {
      deletePlayerMutation.mutate(player.id);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "injured": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "suspended": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "inactive": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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
    <div className="flex-1 overflow-hidden bg-background">
      {/* Header Section - Fixed */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Spieler</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Lade Spieler..." : `${filteredPlayers.length} von ${(players as Player[]).length} Spielern`}
              </p>
            </div>
            <Button 
              onClick={() => { setEditingPlayer(null); form.reset(); setIsCreateDialogOpen(true); }}
              className="shrink-0"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Hinzufügen
            </Button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Name oder Trikotnummer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
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
                <SelectTrigger className="w-28 h-9">
                  <SelectValue />
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
          </div>
        </div>
      </div>

      {/* Content Section - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Players Grid */}
          {isLoading ? (
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
          ) : filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredPlayers.map((player: Player) => (
                <Card key={player.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-muted/50 hover:border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          {player.profileImageUrl ? (
                            <img
                              src={player.profileImageUrl}
                              alt={`${player.firstName} ${player.lastName}`}
                              className="w-12 h-12 rounded-full object-cover border-2 border-muted"
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
                            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
                              {player.jerseyNumber}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                            {player.firstName} {player.lastName}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {player.position && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPositionColor(player.position)}`}>
                                {player.position}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(player.status)}`}>
                              {statusOptions.find(s => s.value === player.status)?.label || player.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(player)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Bearbeiten
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
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {player.nationality && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          </div>
                          <span className="truncate">{player.nationality}</span>
                        </div>
                      )}
                      {(player.height || player.weight) && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          </div>
                          <span>
                            {player.height && `${player.height}cm`}
                            {player.height && player.weight && " • "}
                            {player.weight && `${player.weight}kg`}
                          </span>
                        </div>
                      )}
                      {player.preferredFoot && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                          </div>
                          <span>{footOptions.find(f => f.value === player.preferredFoot)?.label}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Keine Spieler gefunden</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {searchTerm || positionFilter !== "all" || statusFilter !== "all"
                    ? "Keine Spieler entsprechen den aktuellen Filterkriterien. Versuchen Sie andere Filter."
                    : "Noch keine Spieler hinzugefügt. Fügen Sie den ersten Spieler hinzu."}
                </p>
                {!searchTerm && positionFilter === "all" && statusFilter === "all" && (
                  <Button onClick={() => { setEditingPlayer(null); form.reset(); setIsCreateDialogOpen(true); }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ersten Spieler hinzufügen
                  </Button>
                )}
              </div>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}