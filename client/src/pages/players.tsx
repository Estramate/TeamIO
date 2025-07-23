import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePage } from "@/contexts/PageContext";
import { useClubStore } from "@/lib/clubStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertPlayerSchema, type Player, type InsertPlayer, type Team } from "@shared/schema";
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Users,
  Trophy,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Ruler,
  Weight,
  Target,
  Activity
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const positionOptions = [
  { value: "Tor", label: "Torwart" },
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
  
  const { selectedClub } = useClubStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPage } = usePage();

  useEffect(() => {
    setPage("Spieler", "Verwalten Sie alle Spieler des Vereins");
  }, [setPage]);

  // Fetch players
  const { data: players = [], isLoading, error } = useQuery({
    queryKey: [`/api/clubs/${selectedClub}/players`],
    enabled: !!selectedClub,
  });

  // Debug logging
  console.log("Selected Club:", selectedClub);
  console.log("Players data:", players);
  console.log("Loading:", isLoading);
  console.log("Error:", error);

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
        title: "Spieler erstellt",
        description: "Der Spieler wurde erfolgreich hinzugefügt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Spieler konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Update player mutation
  const updatePlayerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPlayer> }) => {
      return await apiRequest(`/api/players/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClub}/players`] });
      setEditingPlayer(null);
      form.reset();
      toast({
        title: "Spieler aktualisiert",
        description: "Die Spielerdaten wurden erfolgreich gespeichert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Spieler konnte nicht aktualisiert werden.",
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
        title: "Spieler gelöscht",
        description: "Der Spieler wurde erfolgreich entfernt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Spieler konnte nicht gelöscht werden.",
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
    <div className="flex-1 overflow-y-auto bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-end">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { setEditingPlayer(null); form.reset(); }}
                className="bg-primary hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Spieler hinzufügen
              </Button>
            </DialogTrigger>
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
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Status wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statusOptions.map((option) => (
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

                  {/* Contact & Personal Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Kontakt & Persönliche Daten</h3>
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
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon</FormLabel>
                          <FormControl>
                            <Input placeholder="+43 664 123 456" {...field} />
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
                            <Input type="email" placeholder="spieler@example.com" {...field} />
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
                            <Input placeholder="Österreich" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="profileImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profilbild URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Physical & Technical Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Physische & Technische Daten</h3>
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Größe (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="180" 
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
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gewicht (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="75" 
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
                      name="preferredFoot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bevorzugter Fuß</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Fuß wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {footOptions.map((option) => (
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

                  {/* Contract & Additional Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Vertrag & Zusätzliche Daten</h3>
                    <FormField
                      control={form.control}
                      name="contractStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vertragsbeginn</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contractEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vertragsende</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gehalt (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="1500.00" 
                              {...field} 
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="Musterstraße 123, 1234 Musterstadt" {...field} />
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
                        <Textarea 
                          placeholder="Zusätzliche Informationen über den Spieler..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Spieler suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
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
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
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
        </CardContent>
      </Card>

      {/* Players List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Lädt Spieler...</div>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Keine Spieler gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Noch keine Spieler hinzugefügt.
          </p>
          <Button 
            className="mt-4"
            onClick={() => { setEditingPlayer(null); form.reset(); setIsCreateDialogOpen(true); }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Ersten Spieler hinzufügen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player: Player) => (
          <Card key={player.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={player.profileImageUrl || ""} alt={`${player.firstName} ${player.lastName}`} />
                    <AvatarFallback>
                      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {player.firstName} {player.lastName}
                    </h3>
                    {player.jerseyNumber && (
                      <div className="text-2xl font-bold text-muted-foreground">
                        #{player.jerseyNumber}
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(player)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(player)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {player.position && (
                    <Badge className={getPositionColor(player.position)}>
                      {player.position}
                    </Badge>
                  )}
                  <Badge className={getStatusColor(player.status)}>
                    {statusOptions.find(s => s.value === player.status)?.label || player.status}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2 text-sm text-muted-foreground">
                  {player.birthDate && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(player.birthDate).toLocaleDateString('de-DE')}
                    </div>
                  )}
                  {player.nationality && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {player.nationality}
                    </div>
                  )}
                  {player.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {player.phone}
                    </div>
                  )}
                  {player.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {player.email}
                    </div>
                  )}
                  {player.height && (
                    <div className="flex items-center">
                      <Ruler className="h-4 w-4 mr-2" />
                      {player.height} cm
                    </div>
                  )}
                  {player.weight && (
                    <div className="flex items-center">
                      <Weight className="h-4 w-4 mr-2" />
                      {player.weight} kg
                    </div>
                  )}
                  {player.preferredFoot && (
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      {footOptions.find(f => f.value === player.preferredFoot)?.label || player.preferredFoot}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
}