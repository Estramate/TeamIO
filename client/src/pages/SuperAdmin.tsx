import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSuperAdminStatus } from '@/components/SuperAdminBadge';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toastService } from '@/lib/toast-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { usePage } from '@/contexts/PageContext';
import { 
  Crown, 
  Building2, 
  Users, 
  Shield, 
  Plus, 
  Settings, 
  UserPlus,
  Mail,
  Phone,
  Globe,
  MapPin,
  Palette,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import {
  ClubDetailsModal,
  EditClubModal,
  DeactivateClubDialog,
  UserDetailsModal,
  EditUserModal,
  DeactivateUserDialog,
} from '@/components/SuperAdminModals';
import {
  EmailSettingsModal,
  SubscriptionManagementModal,
} from '@/components/SuperAdminDataModals';

export default function SuperAdminPage() {
  const { data: superAdminStatus, isLoading } = useSuperAdminStatus();
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showClubDetails, setShowClubDetails] = useState<any>(null);
  const [showEditClub, setShowEditClub] = useState<any>(null);
  const [showDeactivateClub, setShowDeactivateClub] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState<any>(null);
  const [showEditUser, setShowEditUser] = useState<any>(null);
  const [showDeactivateUser, setShowDeactivateUser] = useState<any>(null);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [showSubscriptionSettings, setShowSubscriptionSettings] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const { setPage } = usePage();
  
  // Set page title
  React.useEffect(() => {
    setPage('Super Administrator', 'Plattform-weite Verwaltung und Übersicht');
  }, [setPage]);

  // Redirect if not super admin
  if (!isLoading && !(superAdminStatus as any)?.isSuperAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Zugriff verweigert</h2>
            <p className="text-muted-foreground">
              Sie benötigen Super-Administrator-Berechtigungen für diese Seite.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get all clubs for management
  const { data: allClubs } = useQuery({
    queryKey: ['/api/super-admin/clubs'],
    enabled: (superAdminStatus as any)?.isSuperAdmin,
  });

  // Get all users for admin assignment
  const { data: allUsers } = useQuery({
    queryKey: ['/api/super-admin/users'],
    enabled: (superAdminStatus as any)?.isSuperAdmin,
  });

  // Create club mutation
  const createClubMutation = useMutation({
    mutationFn: async (clubData: any) => {
      return apiRequest('POST', '/api/super-admin/clubs', clubData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/clubs'] });
      setShowCreateClub(false);
      toastService.success(
        "Verein erfolgreich erstellt",
        "Der neue Verein wurde angelegt und ist bereit für die Nutzung."
      );
    },
    onError: (error: any) => {
      toastService.error(
        "Fehler beim Erstellen",
        error.message || "Der Verein konnte nicht erstellt werden."
      );
    },
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async (adminData: any) => {
      return apiRequest('POST', '/api/super-admin/create-admin', adminData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      setShowCreateAdmin(false);
      toastService.success(
        "Administrator erfolgreich erstellt",
        "Der neue Vereinsadministrator wurde angelegt und per E-Mail benachrichtigt."
      );
    },
    onError: (error: any) => {
      toastService.error(
        "Fehler beim Erstellen",
        error.message || "Der Administrator konnte nicht erstellt werden."
      );
    },
  });

  // Update club mutation
  const updateClubMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PUT', `/api/super-admin/clubs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/clubs'] });
      setShowEditClub(null);
      toastService.success(
        "Verein erfolgreich aktualisiert",
        "Die Vereinsdaten wurden erfolgreich gespeichert."
      );
    },
    onError: (error: any) => {
      toastService.error(
        "Fehler beim Speichern",
        error.message || "Die Vereinsdaten konnten nicht gespeichert werden."
      );
    },
  });

  // Deactivate club mutation
  const deactivateClubMutation = useMutation({
    mutationFn: async (clubId: number) => {
      return apiRequest('POST', `/api/super-admin/clubs/${clubId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/clubs'] });
      setShowDeactivateClub(null);
      toastService.success(
        "Verein deaktiviert",
        "Der Verein wurde erfolgreich deaktiviert."
      );
    },
    onError: (error: any) => {
      toastService.error(
        "Fehler beim Deaktivieren",
        error.message || "Der Verein konnte nicht deaktiviert werden."
      );
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest('PUT', `/api/super-admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      setShowEditUser(null);
      toastService.success(
        "Benutzer erfolgreich aktualisiert",
        "Die Benutzerdaten wurden erfolgreich gespeichert."
      );
    },
    onError: (error: any) => {
      toastService.error(
        "Fehler beim Speichern",
        error.message || "Die Benutzerdaten konnten nicht gespeichert werden."
      );
    },
  });

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('POST', `/api/super-admin/users/${userId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      setShowDeactivateUser(null);
      toastService.success(
        "Benutzer deaktiviert",
        "Der Benutzer wurde erfolgreich deaktiviert."
      );
    },
    onError: (error: any) => {
      toastService.error(
        "Fehler beim Deaktivieren",
        error.message || "Der Benutzer konnte nicht deaktiviert werden."
      );
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Lade Super-Administrator-Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Status Badge */}
      <div className="flex justify-end">
        <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
          <Crown className="h-3 w-3 mr-1" />
          Vollzugriff
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktive Vereine</p>
                <p className="text-2xl font-bold">{(allClubs as any[])?.length || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamt-Benutzer</p>
                <p className="text-2xl font-bold">{(allUsers as any[])?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administratoren</p>
                <p className="text-2xl font-bold">
                  {(allUsers as any[])?.filter((user: any) => 
                    user.memberships?.some((m: any) => m.role === 'club-administrator')
                  ).length || 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="clubs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clubs">Vereinsverwaltung</TabsTrigger>
          <TabsTrigger value="users">Benutzerverwaltung</TabsTrigger>
          <TabsTrigger value="settings">Plattform-Einstellungen</TabsTrigger>
        </TabsList>

        {/* Clubs Management */}
        <TabsContent value="clubs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vereine verwalten</CardTitle>
                  <CardDescription>
                    Erstellen und verwalten Sie alle Vereine auf der Plattform
                  </CardDescription>
                </div>
                <Dialog open={showCreateClub} onOpenChange={setShowCreateClub}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Neuer Verein
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Neuen Verein erstellen</DialogTitle>
                      <DialogDescription>
                        Erstellen Sie einen neuen Verein mit allen erforderlichen Einstellungen
                      </DialogDescription>
                    </DialogHeader>
                    <CreateClubForm 
                      onSubmit={createClubMutation.mutate}
                      isLoading={createClubMutation.isPending}
                      onCancel={() => setShowCreateClub(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ClubsTable 
                clubs={allClubs as any[]}
                onViewDetails={setShowClubDetails}
                onEdit={setShowEditClub}
                onDeactivate={setShowDeactivateClub}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Benutzer verwalten</CardTitle>
                  <CardDescription>
                    Verwalten Sie alle Benutzer und erstellen Sie neue Administratoren
                  </CardDescription>
                </div>
                <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Neuer Administrator
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Neuen Administrator erstellen</DialogTitle>
                      <DialogDescription>
                        Erstellen Sie einen neuen Vereinsadministrator
                      </DialogDescription>
                    </DialogHeader>
                    <CreateAdminForm 
                      clubs={allClubs as any[]}
                      onSubmit={createAdminMutation.mutate}
                      isLoading={createAdminMutation.isPending}
                      onCancel={() => setShowCreateAdmin(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <UsersTable 
                users={allUsers as any[]} 
                onViewDetails={setShowUserDetails}
                onEdit={setShowEditUser}
                onDeactivate={setShowDeactivateUser}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plattform-Einstellungen</CardTitle>
              <CardDescription>
                Globale Einstellungen für die gesamte ClubFlow-Plattform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">E-Mail-Einstellungen</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      SendGrid-Integration und E-Mail-Templates
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowEmailSettings(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Konfigurieren
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Subscription-Verwaltung</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Plan-Limits und Preise verwalten
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowSubscriptionSettings(true)}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Verwalten
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Dialogs */}
      {showClubDetails && (
        <ClubDetailsModal 
          club={showClubDetails} 
          open={!!showClubDetails} 
          onClose={() => setShowClubDetails(null)} 
        />
      )}

      {showEditClub && (
        <EditClubModal 
          club={showEditClub} 
          open={!!showEditClub} 
          onClose={() => setShowEditClub(null)}
          onSave={(data) => {
            console.log('Update club:', data);
            setShowEditClub(null);
          }}
        />
      )}

      {showDeactivateClub && (
        <DeactivateClubDialog 
          club={showDeactivateClub} 
          open={!!showDeactivateClub} 
          onClose={() => setShowDeactivateClub(null)}
          onConfirm={() => {
            console.log('Deactivate club:', showDeactivateClub.id);
            setShowDeactivateClub(null);
          }}
        />
      )}

      {showUserDetails && (
        <UserDetailsModal 
          user={showUserDetails} 
          open={!!showUserDetails} 
          onClose={() => setShowUserDetails(null)} 
        />
      )}

      {showEditUser && (
        <EditUserModal 
          user={showEditUser} 
          open={!!showEditUser} 
          onClose={() => setShowEditUser(null)}
          onSave={(data) => {
            console.log('Update user:', data);
            setShowEditUser(null);
          }}
        />
      )}

      {showDeactivateUser && (
        <DeactivateUserDialog 
          user={showDeactivateUser} 
          open={!!showDeactivateUser} 
          onClose={() => setShowDeactivateUser(null)}
          onConfirm={() => {
            console.log('Deactivate user:', showDeactivateUser.id);
            setShowDeactivateUser(null);
          }}
        />
      )}

      {/* Email Settings Modal */}
      <EmailSettingsModal 
        open={showEmailSettings} 
        onClose={() => setShowEmailSettings(false)} 
      />

      {/* Subscription Settings Modal */}
      <SubscriptionManagementModal 
        open={showSubscriptionSettings} 
        onClose={() => setShowSubscriptionSettings(false)} 
      />


    </div>
  );
}

// Create Club Form Component
function CreateClubForm({ onSubmit, isLoading, onCancel }: { 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#10b981',
    planId: 2, // Default to Starter plan (ID 2)
  });

  // Fetch available subscription plans
  const { data: subscriptionPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      return response.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Vereinsname *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="z.B. SV Musterhausen 1975"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="email">E-Mail-Adresse *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="info@verein.de"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Kurze Beschreibung des Vereins..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="address">Adresse</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Straße, PLZ Ort"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+49 123 456789"
          />
        </div>
        
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://www.verein.de"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Vereinsfarben</Label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="primaryColor" className="text-xs">Primärfarbe</Label>
            <div className="flex items-center gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="h-8 w-16"
              />
              <Input
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="secondaryColor" className="text-xs">Sekundärfarbe</Label>
            <div className="flex items-center gap-2">
              <Input
                id="secondaryColor"
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="h-8 w-16"
              />
              <Input
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="accentColor" className="text-xs">Akzentfarbe</Label>
            <div className="flex items-center gap-2">
              <Input
                id="accentColor"
                type="color"
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                className="h-8 w-16"
              />
              <Input
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plan Selection */}
      <div>
        <Label htmlFor="planId" className="text-sm font-medium mb-3 block">Subscription-Plan *</Label>
        <Select value={formData.planId.toString()} onValueChange={(value) => setFormData({ ...formData, planId: parseInt(value) })}>
          <SelectTrigger>
            <SelectValue placeholder={plansLoading ? "Lade Pläne..." : "Subscription-Plan auswählen"} />
          </SelectTrigger>
          <SelectContent>
            {plansLoading ? (
              <SelectItem value="loading" disabled>
                Lade verfügbare Pläne...
              </SelectItem>
            ) : (
              subscriptionPlans?.map((plan: any) => (
                <SelectItem key={plan.id} value={plan.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{plan.displayName}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      €{plan.monthlyPrice}/Monat
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Standard: Starter-Plan. Kann später geändert werden.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Wird erstellt...' : 'Verein erstellen'}
        </Button>
      </div>
    </form>
  );
}

// Create Admin Form Component
function CreateAdminForm({ clubs, onSubmit, isLoading, onCancel }: { 
  clubs: any[]; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    clubId: '',
    sendWelcomeEmail: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Vorname *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Max"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="lastName">Nachname *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Mustermann"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">E-Mail-Adresse *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="admin@verein.de"
          required
        />
      </div>

      <div>
        <Label htmlFor="clubId">Verein *</Label>
        <Select value={formData.clubId} onValueChange={(value) => setFormData({ ...formData, clubId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Verein auswählen" />
          </SelectTrigger>
          <SelectContent>
            {clubs?.map((club) => (
              <SelectItem key={club.id} value={club.id.toString()}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="sendWelcomeEmail"
          checked={formData.sendWelcomeEmail}
          onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
          className="h-4 w-4"
        />
        <Label htmlFor="sendWelcomeEmail" className="text-sm">
          Willkommens-E-Mail mit Anmeldedaten senden
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isLoading || !formData.clubId}>
          {isLoading ? 'Wird erstellt...' : 'Administrator erstellen'}
        </Button>
      </div>
    </form>
  );
}

// Clubs Table Component
function ClubsTable({ clubs, onViewDetails, onEdit, onDeactivate }: { 
  clubs: any[]; 
  onViewDetails: (club: any) => void;
  onEdit: (club: any) => void;
  onDeactivate: (club: any) => void;
}) {
  const { data: clubSubscriptions } = useQuery({
    queryKey: ['/api/super-admin/club-subscriptions'],
    enabled: !!clubs?.length,
  });

  if (!clubs?.length) {
    return (
      <div className="text-center py-8">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Noch keine Vereine erstellt</p>
      </div>
    );
  }

  const getClubSubscription = (clubId: number) => {
    if (!clubSubscriptions) return { planType: 'professional', displayName: 'Professional', endDate: null };
    const subscription = clubSubscriptions.find((sub: any) => sub.clubId === clubId);
    if (!subscription) return { planType: 'professional', displayName: 'Professional', endDate: null };
    
    // Map planType to displayName if displayName is missing
    const displayNameMap: any = {
      'free': 'Gratis',
      'starter': 'Starter',
      'professional': 'Professional', 
      'enterprise': 'Enterprise'
    };
    
    return {
      ...subscription,
      displayName: subscription.displayName || displayNameMap[subscription.planType] || subscription.planType
    };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">Verein</th>
            <th className="text-left p-3">Benutzer</th>
            <th className="text-left p-3">Plan</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Läuft bis</th>
            <th className="text-left p-3">Erstellt</th>
            <th className="text-left p-3">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {clubs.map((club) => (
            <tr key={club.id} className="border-b hover:bg-muted/50">
              <td className="p-3">
                <div>
                  <div className="font-medium">{club.name}</div>
                  <div className="text-sm text-muted-foreground">{club.email}</div>
                </div>
              </td>
              <td className="p-3">
                <Badge variant="outline">{club.userCount || club.memberCount || 0}</Badge>
              </td>
              <td className="p-3">
                <Badge variant="secondary">{getClubSubscription(club.id).displayName}</Badge>
              </td>
              <td className="p-3">
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aktiv
                </Badge>
              </td>
              <td className="p-3">
                <time className="text-sm text-muted-foreground">
                  {getClubSubscription(club.id).endDate ? 
                    new Date(getClubSubscription(club.id).endDate).toLocaleDateString('de-DE') : 
                    'Unbegrenzt'
                  }
                </time>
              </td>
              <td className="p-3">
                <time className="text-sm text-muted-foreground">
                  {new Date(club.createdAt).toLocaleDateString('de-DE')}
                </time>
              </td>
              <td className="p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(club)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Details anzeigen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(club)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => onDeactivate(club)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deaktivieren
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Users Table Component
function UsersTable({ users, onViewDetails, onEdit, onDeactivate }: { 
  users: any[]; 
  onViewDetails: (user: any) => void;
  onEdit: (user: any) => void;
  onDeactivate: (user: any) => void;
}) {
  if (!users?.length) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Noch keine Benutzer registriert</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">Benutzer</th>
            <th className="text-left p-3">Verein</th>
            <th className="text-left p-3">Rolle</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Letzte Anmeldung</th>
            <th className="text-left p-3">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-muted/50">
              <td className="p-3">
                <div>
                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </td>
              <td className="p-3">
                <div className="text-sm">
                  {user.memberships?.map((m: any) => m.clubName).join(', ') || 'Kein Verein'}
                </div>
              </td>
              <td className="p-3">
                <div className="space-y-1">
                  {user.memberships?.map((m: any) => (
                    <Badge key={m.clubId} variant="outline" className="text-xs">
                      {m.role === 'club-administrator' ? 'Vereinsadministrator' : 
                       m.role === 'administrator' ? 'Administrator' :
                       m.role === 'member' ? 'Mitglied' : 
                       m.role === 'trainer' ? 'Trainer' : m.role}
                    </Badge>
                  )) || <Badge variant="secondary">Gast</Badge>}
                </div>
              </td>
              <td className="p-3">
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </td>
              <td className="p-3">
                <time className="text-sm text-muted-foreground">
                  {user.lastLoginAt ? 
                    new Date(user.lastLoginAt).toLocaleDateString('de-DE') : 
                    'Nie'
                  }
                </time>
              </td>
              <td className="p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(user)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Details anzeigen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => onDeactivate(user)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deaktivieren
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}