import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertCircle, Building, Users, MapPin, Plus, Search, Edit, Trash2, MoreHorizontal, LayoutGrid, List, Eye, Car, Dumbbell, Home, Trees, Utensils } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFacilitySchema, type Facility } from "@shared/schema";
import { z } from "zod";

// Form Schema - create a separate form schema that handles string inputs
const facilityFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  type: z.string().min(1, "Typ ist erforderlich"),
  description: z.string().optional(),
  capacity: z.string().optional(),
  location: z.string().optional(),
  maxConcurrentBookings: z.string().min(1, "Maximale Buchungen sind erforderlich"),
  status: z.string().default("active"),
});

type FacilityFormData = z.infer<typeof facilityFormSchema>;

export default function Facilities() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { setPage } = usePage();
  const queryClient = useQueryClient();

  // Set page title
  useEffect(() => {
    setPage("Anlagen", "Verwalten Sie Ihre Vereinsanlagen und Einrichtungen");
  }, [setPage]);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [facilityModalOpen, setFacilityModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<Facility | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [viewingFacility, setViewingFacility] = useState<Facility | null>(null);

  const form = useForm<FacilityFormData>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      capacity: "",
      location: "",
      maxConcurrentBookings: "1",
      status: "active",
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

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte wählen Sie einen Verein aus, um Anlagen zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  // Data fetching
  const { data: facilities = [], isLoading: isFacilitiesLoading } = useQuery<Facility[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'facilities'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  // Mutations
  const createFacilityMutation = useMutation({
    mutationFn: (data: FacilityFormData) => 
      apiRequest('POST', `/api/clubs/${selectedClub?.id}/facilities`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'facilities'] });
      setFacilityModalOpen(false);
      form.reset();
      setSelectedFacility(null);
      toast({
        title: "Erfolg",
        description: "Anlage wurde erfolgreich erstellt",
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
        description: "Anlage konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const updateFacilityMutation = useMutation({
    mutationFn: (data: FacilityFormData) => 
      apiRequest('PATCH', `/api/clubs/${selectedClub?.id}/facilities/${selectedFacility?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'facilities'] });
      setFacilityModalOpen(false);
      form.reset();
      setSelectedFacility(null);
      toast({
        title: "Erfolg",
        description: "Anlage wurde erfolgreich aktualisiert",
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
        description: "Anlage konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const deleteFacilityMutation = useMutation({
    mutationFn: (facilityId: number) => 
      apiRequest('DELETE', `/api/clubs/${selectedClub?.id}/facilities/${facilityId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'facilities'] });
      setDeleteDialogOpen(false);
      setFacilityToDelete(null);
      toast({
        title: "Erfolg",
        description: "Anlage wurde erfolgreich gelöscht",
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
        description: "Anlage konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const filteredFacilities = facilities.filter((facility) => {
    const matchesSearch = 
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (facility.type && facility.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (facility.description && facility.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || facility.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || facility.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Event handlers
  const handleCreateFacility = () => {
    setSelectedFacility(null);
    form.reset();
    setFacilityModalOpen(true);
  };

  const handleEditFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    form.reset({
      name: facility.name,
      type: facility.type || '',
      description: facility.description || '',
      capacity: facility.capacity ? String(facility.capacity) : "",
      location: facility.location || '',
      maxConcurrentBookings: facility.maxConcurrentBookings ? String(facility.maxConcurrentBookings) : "1",
      status: facility.status || 'active',
    });
    setFacilityModalOpen(true);
  };

  const handleDeleteFacility = (facility: Facility) => {
    setFacilityToDelete(facility);
    setDeleteDialogOpen(true);
  };

  const toggleFacilityStatusMutation = useMutation({
    mutationFn: ({ facilityId, data }: { facilityId: number; data: FacilityFormData }) => 
      apiRequest('PATCH', `/api/clubs/${selectedClub?.id}/facilities/${facilityId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'facilities'] });
      toast({
        title: "Erfolg",
        description: "Anlagen-Status wurde erfolgreich aktualisiert",
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
        description: "Anlagen-Status konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = (facility: Facility) => {
    const newStatus = (facility.status === 'active' || facility.status === 'available') ? 'inactive' : 'active';
    toggleFacilityStatusMutation.mutate({
      facilityId: facility.id,
      data: {
        name: facility.name,
        type: facility.type || '',
        description: facility.description || undefined,
        capacity: facility.capacity ? String(facility.capacity) : undefined,
        location: facility.location || undefined,
        maxConcurrentBookings: facility.maxConcurrentBookings ? String(facility.maxConcurrentBookings) : "1",
        status: newStatus,
      }
    });
  };

  const handleViewFacility = (facility: Facility) => {
    setViewingFacility(facility);
    setIsDetailDialogOpen(true);
  };

  const onSubmit = (data: FacilityFormData) => {
    // Transform form data to match API schema
    const facilityData: any = {
      name: data.name,
      type: data.type,
      description: data.description || undefined,
      capacity: data.capacity ? Number(data.capacity) : undefined,
      location: data.location || undefined,
      maxConcurrentBookings: data.maxConcurrentBookings ? Number(data.maxConcurrentBookings) : 1,
      status: data.status || "active",
    };

    if (selectedFacility) {
      updateFacilityMutation.mutate(facilityData);
    } else {
      createFacilityMutation.mutate(facilityData);
    }
  };

  const confirmDelete = () => {
    if (facilityToDelete) {
      deleteFacilityMutation.mutate(facilityToDelete.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'available': // Handle old "available" status as active
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Aktiv</Badge>;
      case 'maintenance':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Wartung</Badge>;
      case 'inactive':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Inaktiv</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFacilityIcon = (name: string) => {
    const lowerName = name?.toLowerCase() || '';
    
    // Spezifische Arena/Stadion Icons
    if (lowerName.includes('arena') || lowerName.includes('stadion')) {
      return '🏟️';
    }
    
    // Trainingsplatz/Platz Icons
    if (lowerName.includes('trainingsplatz') || lowerName.includes('platz')) {
      return '⚽';
    }
    
    // Jugendplatz
    if (lowerName.includes('jugend')) {
      return '👶';
    }
    
    // Vereinsheim/Clubhaus
    if (lowerName.includes('vereinsheim') || lowerName.includes('clubhaus') || lowerName.includes('heim')) {
      return '🏠';
    }
    
    // Umkleidekabinen/Kabinen
    if (lowerName.includes('umkleide') || lowerName.includes('kabine')) {
      return '👕';
    }
    
    // Parkplatz
    if (lowerName.includes('parkplatz') || lowerName.includes('parking')) {
      return '🅿️';
    }
    
    // Kantine/Restaurant/Küche
    if (lowerName.includes('kantine') || lowerName.includes('restaurant') || lowerName.includes('küche')) {
      return '🍽️';
    }
    
    // Fitness/Gym
    if (lowerName.includes('fitness') || lowerName.includes('gym') || lowerName.includes('kraft')) {
      return '💪';
    }
    
    // Halle/Sporthalle
    if (lowerName.includes('halle') || lowerName.includes('sport')) {
      return '🏟️';
    }
    
    // Büro/Verwaltung
    if (lowerName.includes('büro') || lowerName.includes('verwaltung') || lowerName.includes('office')) {
      return '🏢';
    }
    
    // Default für alle anderen
    return '🏢';
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'field':
      case 'platz':
        return <Building className="w-4 h-4" />;
      case 'gym':
      case 'halle':
        return <Building className="w-4 h-4" />;
      case 'pool':
      case 'schwimmbad':
        return <Building className="w-4 h-4" />;
      default:
        return <Building className="w-4 h-4" />;
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'field':
        return 'Platz';
      case 'gym':
        return 'Halle';
      case 'pool':
        return 'Schwimmbad';
      case 'facility':
        return 'Anlage';
      case 'clubhouse':
      case 'clubhaus':
        return 'Vereinsheim';  
      default:
        return type || 'Nicht angegeben';
    }
  };

  if (isLoading || !selectedClub) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Lade Anlagen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
      {/* Header Section with Search, Filters and Add Button */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Anlagen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-xl border bg-background"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl border bg-background">
                <SelectValue placeholder="Typ wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="field">Platz</SelectItem>
                <SelectItem value="gym">Halle</SelectItem>
                <SelectItem value="pool">Schwimmbad</SelectItem>
                <SelectItem value="court">Court</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl border bg-background">
                <SelectValue placeholder="Status wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="maintenance">Wartung</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
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
              onClick={handleCreateFacility} 
              className="w-full sm:w-auto sm:ml-auto h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Anlage hinzufügen
            </Button>
          </div>
        </div>
      </div>

      {/* Facilities Grid/List */}
      {isFacilitiesLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Lade Anlagen...</p>
          </div>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Anlagen gefunden</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? "Keine Anlagen entsprechen den aktuellen Filterkriterien."
                : "Beginnen Sie mit der Erstellung Ihrer ersten Anlage."}
            </p>
            {(!searchTerm && typeFilter === 'all' && statusFilter === 'all') && (
              <Button onClick={handleCreateFacility}>
                <Plus className="w-4 h-4 mr-2" />
                Erste Anlage erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFacilities.map((facility) => (
            <Card 
              key={facility.id} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md overflow-hidden"
            >
              {/* Einfacher grauer Header - schlicht und modern */}
              <div className="h-2 bg-gradient-to-r from-muted to-muted/80"></div>
              
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getFacilityIcon(facility.name)}</span>
                      <h3 
                        className="text-lg font-semibold text-foreground truncate cursor-pointer hover:underline"
                        onClick={() => handleViewFacility(facility)}
                        title={facility.name}
                      >
                        {facility.name}
                      </h3>
                    </div>
                    
                    {facility.location && (
                      <p className="text-sm text-muted-foreground mb-3">
                        📍 {facility.location}
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
                      <DropdownMenuItem onClick={() => handleViewFacility(facility)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditFacility(facility)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(facility)}
                        disabled={toggleFacilityStatusMutation.isPending}
                        className={(facility.status === 'active' || facility.status === 'available') ? "text-orange-600 focus:text-orange-600" : "text-green-600 focus:text-green-600"}
                      >
                        {(facility.status === 'active' || facility.status === 'available') ? (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Deaktivieren
                          </>
                        ) : (
                          <>
                            <Building className="h-4 w-4 mr-2" />
                            Aktivieren
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteFacility(facility)}
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
                  {getStatusBadge(facility.status || 'active')}
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {getTypeDisplayName(facility.type || '')}
                  </Badge>
                </div>

                {/* Facility Details */}
                <div className="space-y-3 text-sm">
                  {facility.capacity && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Kapazität
                      </span>
                      <span className="font-medium">{facility.capacity}</span>
                    </div>
                  )}

                  {facility.type && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Typ
                      </span>
                      <span className="font-medium">{getTypeDisplayName(facility.type)}</span>
                    </div>
                  )}

                  {facility.description && (
                    <div className="pt-3 mt-3 border-t border-border">
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {facility.description}
                      </p>
                    </div>
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
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Kapazität
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Standort
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredFacilities.map((facility) => (
                    <tr key={facility.id} className="group hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getTypeIcon(facility.type || '')}
                          <div className="ml-3">
                            <div 
                              className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors hover:underline"
                              onClick={() => handleViewFacility(facility)}
                            >
                              {facility.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{getTypeDisplayName(facility.type || '')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground flex items-center">
                          {facility.capacity ? (
                            <>
                              <Users className="w-4 h-4 mr-1" />
                              {facility.capacity}
                            </>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground flex items-center">
                          {facility.location ? (
                            <>
                              <MapPin className="w-4 h-4 mr-1" />
                              {facility.location}
                            </>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(facility.status || 'active')}
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
                            <DropdownMenuItem onClick={() => handleViewFacility(facility)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditFacility(facility)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(facility)}
                              disabled={toggleFacilityStatusMutation.isPending}
                              className={(facility.status === 'active' || facility.status === 'available') ? "text-orange-600 focus:text-orange-600" : "text-green-600 focus:text-green-600"}
                            >
                              {(facility.status === 'active' || facility.status === 'available') ? (
                                <>
                                  <Building className="mr-2 h-4 w-4" />
                                  Deaktivieren
                                </>
                              ) : (
                                <>
                                  <Building className="mr-2 h-4 w-4" />
                                  Aktivieren
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteFacility(facility)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

      {/* Create/Edit Facility Dialog */}
      <Dialog open={facilityModalOpen} onOpenChange={setFacilityModalOpen}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="facility-dialog-description">
          <DialogHeader>
            <DialogTitle>
              {selectedFacility ? 'Anlage bearbeiten' : 'Neue Anlage'}
            </DialogTitle>
            <div id="facility-dialog-description" className="sr-only">
              {selectedFacility ? 'Bearbeiten Sie die Anlagendetails' : 'Erstellen Sie eine neue Anlage für Ihren Verein'}
            </div>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Anlagenname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Anlagentyp auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="field">Platz</SelectItem>
                        <SelectItem value="gym">Halle</SelectItem>
                        <SelectItem value="pool">Schwimmbad</SelectItem>
                        <SelectItem value="court">Court</SelectItem>
                        <SelectItem value="track">Laufbahn</SelectItem>
                        <SelectItem value="other">Sonstige</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Beschreibung der Anlage" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kapazität</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Maximale Anzahl Personen" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standort</FormLabel>
                    <FormControl>
                      <Input placeholder="Standort/Adresse" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxConcurrentBookings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximale zeitgleiche Buchungen</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="Anzahl zeitgleicher Buchungen" 
                        {...field}
                        value={field.value || "1"}
                        onChange={(e) => field.onChange(e.target.value)}
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Aktiv</SelectItem>
                        <SelectItem value="maintenance">Wartung</SelectItem>
                        <SelectItem value="inactive">Inaktiv</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFacilityModalOpen(false)}>
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  disabled={createFacilityMutation.isPending || updateFacilityMutation.isPending}
                >
                  {createFacilityMutation.isPending || updateFacilityMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {selectedFacility ? 'Aktualisieren...' : 'Erstellen...'}
                    </>
                  ) : (
                    selectedFacility ? 'Aktualisieren' : 'Erstellen'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anlage löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie die Anlage "{facilityToDelete?.name}" löschen möchten?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Facility Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getTypeIcon(viewingFacility?.type || '')}
                <div>
                  <div className="text-xl font-bold">
                    {viewingFacility?.name}
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Anlagendetails
                  </div>
                </div>
              </div>
              {viewingFacility && (
                <div className="mt-1">
                  {getStatusBadge(viewingFacility.status || 'active')}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewingFacility && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Typ</h4>
                  <p className="mt-1">{viewingFacility.type || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                  <div className="mt-1">
                    {getStatusBadge(viewingFacility.status || 'active')}
                  </div>
                </div>
                {viewingFacility.capacity && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Kapazität</h4>
                    <p className="mt-1 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {viewingFacility.capacity} Personen
                    </p>
                  </div>
                )}
                {viewingFacility.location && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Standort</h4>
                    <p className="mt-1 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {viewingFacility.location}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Max. zeitgleiche Buchungen</h4>
                  <p className="mt-1 flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {viewingFacility.maxConcurrentBookings || 1} Buchung(en)
                  </p>
                </div>
              </div>
              {viewingFacility.description && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Beschreibung</h4>
                  <p className="mt-1 text-sm">{viewingFacility.description}</p>
                </div>
              )}
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
                if (viewingFacility) handleEditFacility(viewingFacility);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Bearbeiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}