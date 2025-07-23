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
import { Users, Search, Plus, Edit, Trash2, LayoutGrid, List, Mail, Phone, Calendar, MapPin, User, AlertCircle, MoreHorizontal, Grid3X3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Form validation schema
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
});

type MemberFormData = z.infer<typeof memberFormSchema>;

export default function Members() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
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
        window.location.href = "/api/login";
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
    enabled: !!selectedClub?.id,
    retry: false,
  });

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (memberData: MemberFormData) => {
      await apiRequest("POST", `/api/clubs/${selectedClub?.id}/members`, memberData);
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: "Mitglied wurde erfolgreich erstellt",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'members'] });
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
          window.location.href = "/api/login";
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
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: "Mitglied wurde erfolgreich aktualisiert",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'members'] });
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
          window.location.href = "/api/login";
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
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'members'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'members'] });
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
          window.location.href = "/api/login";
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
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.membershipNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle member actions
  const handleAddMember = () => {
    setSelectedMember(null);
    form.reset();
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

  // Status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
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
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Mitglieder suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-xl border bg-background"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-10 rounded-xl border bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
                <SelectItem value="suspended">Gesperrt</SelectItem>
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
                <Grid3X3 className="h-4 w-4" />
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
            <Button 
              onClick={handleAddMember}
              className="bg-primary hover:bg-primary/90"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredMembers.map((member: any) => (
            <Card key={member.id} className="group hover:shadow-lg transition-all duration-300 border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:scale-[1.02] cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-base font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors hover:underline"
                      onClick={() => handleViewMember(member)}
                    >
                      {member.firstName} {member.lastName}
                    </h3>
                    {member.email && (
                      <p className="text-xs text-muted-foreground flex items-center mt-1 truncate">
                        <Mail className="w-3 h-3 mr-1 shrink-0" />
                        {member.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge variant={getStatusBadgeVariant(member.status)} className="text-xs">
                      {getStatusLabel(member.status)}
                    </Badge>
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
                              <User className="h-4 w-4 mr-2" />
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
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  {member.membershipNumber && (
                    <p className="flex items-center truncate">
                      <User className="w-3 h-3 mr-1 shrink-0" />
                      Nr: {member.membershipNumber}
                    </p>
                  )}
                  {member.phone && (
                    <p className="flex items-center truncate">
                      <Phone className="w-3 h-3 mr-1 shrink-0" />
                      {member.phone}
                    </p>
                  )}
                  {member.joinDate && (
                    <p className="flex items-center truncate">
                      <Calendar className="w-3 h-3 mr-1 shrink-0" />
                      {new Date(member.joinDate).toLocaleDateString('de-DE')}
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
                      Kontakt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Beigetreten
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredMembers.map((member: any) => (
                    <tr key={member.id} className="group hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div 
                            className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors hover:underline"
                            onClick={() => handleViewMember(member)}
                          >
                            {member.firstName} {member.lastName}
                          </div>
                          {member.membershipNumber && (
                            <div className="text-sm text-muted-foreground">
                              #{member.membershipNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{member.email}</div>
                        <div className="text-sm text-muted-foreground">{member.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(member.status)}>
                          {getStatusLabel(member.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {member.joinDate ? new Date(member.joinDate).toLocaleDateString('de-DE') : '-'}
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
                                  <User className="h-4 w-4 mr-2" />
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Modal */}
      <Dialog open={memberModalOpen} onOpenChange={setMemberModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {selectedMember ? 'Mitglied bearbeiten' : 'Neues Mitglied'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Vorname *</FormLabel>
                      <FormControl>
                        <Input placeholder="Max" {...field} className="bg-background border-border text-foreground" />
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
                      <FormLabel className="text-foreground">Nachname *</FormLabel>
                      <FormControl>
                        <Input placeholder="Mustermann" {...field} className="bg-background border-border text-foreground" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

              <DialogFooter className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setMemberModalOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90"
                  disabled={createMemberMutation.isPending || updateMemberMutation.isPending}
                >
                  {createMemberMutation.isPending || updateMemberMutation.isPending 
                    ? "Speichern..." 
                    : selectedMember ? "Aktualisieren" : "Erstellen"
                  }
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  handleEditMember(viewingMember);
                }}
                className="shrink-0"
              >
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {viewingMember && (
            <div className="space-y-6 mt-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <Badge variant={getStatusBadgeVariant(viewingMember.status)}>
                  {getStatusLabel(viewingMember.status)}
                </Badge>
              </div>

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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}