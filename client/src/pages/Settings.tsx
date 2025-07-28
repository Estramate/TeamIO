import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Settings as SettingsIcon, 
  Club, 
  Save,
  Trash2,
  Edit2,
  MapPin,
  Mail,
  Phone,
  Link,
  Image,
  Type,
  Palette,
  RefreshCw,
  Check,
  X
} from "lucide-react";

interface ClubSettings {
  name: string;
  shortName: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  settings: any;
}

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { setPage } = usePage();
  const queryClient = useQueryClient();
  
  const [clubSettings, setClubSettings] = useState<ClubSettings>({
    name: '',
    shortName: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#10b981',
    settings: {}
  });

  const [editMode, setEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Set page title and redirect if not authenticated
  useEffect(() => {
    setPage("Vereinseinstellungen", selectedClub ? `Einstellungen für ${selectedClub.name}` : "Bitte wählen Sie einen Verein aus");
  }, [setPage, selectedClub]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Nicht authentifiziert",
        description: "Sie sind abgemeldet. Melden Sie sich erneut an...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 2000);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Club settings query
  const { data: club, isLoading: clubLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id],
    enabled: !!selectedClub,
  });

  // Initialize club settings when club data is loaded
  useEffect(() => {
    if (club) {
      setClubSettings({
        name: club.name || '',
        shortName: club.shortName || '',
        description: club.description || '',
        address: club.address || '',
        phone: club.phone || '',
        email: club.email || '',
        website: club.website || '',
        logoUrl: club.logoUrl || '',
        primaryColor: club.primaryColor || '#3b82f6',
        secondaryColor: club.secondaryColor || '#64748b',
        accentColor: club.accentColor || '#10b981',
        settings: club.settings || {}
      });
    }
  }, [club]);

  // Update club mutation
  const updateClubMutation = useMutation({
    mutationFn: (updatedSettings: Partial<ClubSettings>) =>
      apiRequest(`/api/clubs/${selectedClub?.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedSettings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
      toast({
        title: "Erfolgreich gespeichert",
        description: "Die Vereinseinstellungen wurden aktualisiert.",
      });
      setEditMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Speichern der Einstellungen.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateClubMutation.mutate(clubSettings);
  };

  const handleInputChange = (field: keyof ClubSettings, value: string) => {
    setClubSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancelEdit = () => {
    // Reset to original values
    if (club) {
      setClubSettings({
        name: club.name || '',
        shortName: club.shortName || '',
        description: club.description || '',
        address: club.address || '',
        phone: club.phone || '',
        email: club.email || '',
        website: club.website || '',
        logoUrl: club.logoUrl || '',
        primaryColor: club.primaryColor || '#3b82f6',
        secondaryColor: club.secondaryColor || '#64748b',
        accentColor: club.accentColor || '#10b981',
        settings: club.settings || {}
      });
    }
    setEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Weiterleitung zur Anmeldung...</div>
      </div>
    );
  }

  if (!selectedClub) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <SettingsIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte wählen Sie einen Verein aus, um die Einstellungen zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  if (clubLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Lade Vereinsdaten...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <SettingsIcon className="w-6 h-6 mr-2" />
            Vereinseinstellungen
          </h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie die Informationen und das Erscheinungsbild Ihres Vereins
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                disabled={updateClubMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Abbrechen
              </Button>
              <Button 
                onClick={handleSaveSettings}
                disabled={updateClubMutation.isPending}
              >
                {updateClubMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Speichern
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Bearbeiten
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center">
            <Club className="w-4 h-4 mr-2" />
            Allgemein
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Design
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Erweitert
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grundinformationen</CardTitle>
              <CardDescription>
                Grundlegende Informationen über Ihren Verein
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center">
                    <Type className="w-4 h-4 mr-2" />
                    Vereinsname *
                  </Label>
                  <Input
                    id="name"
                    value={clubSettings.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!editMode}
                    placeholder="z.B. SV Oberglan 1975"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortName" className="flex items-center">
                    <Type className="w-4 h-4 mr-2" />
                    Vereinskürzel
                  </Label>
                  <Input
                    id="shortName"
                    value={clubSettings.shortName}
                    onChange={(e) => handleInputChange('shortName', e.target.value)}
                    disabled={!editMode}
                    placeholder="z.B. SVO"
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kurzes Kürzel für die Anzeige in der Sidebar (max. 10 Zeichen)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center">
                  <Type className="w-4 h-4 mr-2" />
                  Beschreibung
                </Label>
                <Textarea
                  id="description"
                  value={clubSettings.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!editMode}
                  placeholder="Beschreibung Ihres Vereins..."
                  rows={4}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    E-Mail-Adresse
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={clubSettings.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!editMode}
                    placeholder="kontakt@verein.de"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Telefonnummer
                  </Label>
                  <Input
                    id="phone"
                    value={clubSettings.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!editMode}
                    placeholder="+43 676 123 45 67"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Adresse
                </Label>
                <Textarea
                  id="address"
                  value={clubSettings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!editMode}
                  placeholder="Straße 123, 1234 Stadt, Land"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center">
                  <Link className="w-4 h-4 mr-2" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={clubSettings.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  disabled={!editMode}
                  placeholder="https://www.verein.de"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vereinslogo</CardTitle>
              <CardDescription>
                Logo für Ihren Verein (wird in der Sidebar und anderen Bereichen angezeigt)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center overflow-hidden">
                  {clubSettings.logoUrl ? (
                    <img 
                      src={clubSettings.logoUrl} 
                      alt="Vereinslogo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <Label htmlFor="logoUrl" className="flex items-center">
                    <Image className="w-4 h-4 mr-2" />
                    Logo-URL
                  </Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={clubSettings.logoUrl}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    disabled={!editMode}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Empfohlene Größe: 200x200px oder größer (quadratisch)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vereinsfarben</CardTitle>
              <CardDescription>
                Passen Sie das Farbschema Ihres Vereins an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="flex items-center">
                    <Palette className="w-4 h-4 mr-2" />
                    Primärfarbe
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={clubSettings.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      disabled={!editMode}
                      className="w-12 h-10 p-1 rounded cursor-pointer"
                    />
                    <Input
                      value={clubSettings.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      disabled={!editMode}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor" className="flex items-center">
                    <Palette className="w-4 h-4 mr-2" />
                    Sekundärfarbe
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={clubSettings.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      disabled={!editMode}
                      className="w-12 h-10 p-1 rounded cursor-pointer"
                    />
                    <Input
                      value={clubSettings.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      disabled={!editMode}
                      placeholder="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor" className="flex items-center">
                    <Palette className="w-4 h-4 mr-2" />
                    Akzentfarbe
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={clubSettings.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      disabled={!editMode}
                      className="w-12 h-10 p-1 rounded cursor-pointer"
                    />
                    <Input
                      value={clubSettings.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      disabled={!editMode}
                      placeholder="#10b981"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Farbvorschau</h4>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: clubSettings.primaryColor }}
                  />
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: clubSettings.secondaryColor }}
                  />
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: clubSettings.accentColor }}
                  />
                  <span className="text-sm text-muted-foreground">
                    Primär / Sekundär / Akzent
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vereinsinformationen</CardTitle>
              <CardDescription>
                Erweiterte Informationen und Statistiken zu Ihrem Verein
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{club?.id}</div>
                  <div className="text-sm text-muted-foreground">Vereins-ID</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {new Date(club?.createdAt).toLocaleDateString('de-DE')}
                  </div>
                  <div className="text-sm text-muted-foreground">Erstellt am</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {new Date(club?.updatedAt).toLocaleDateString('de-DE')}
                  </div>
                  <div className="text-sm text-muted-foreground">Zuletzt geändert</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Badge variant="outline" className="text-xs">
                    Aktiv
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible Aktionen - Vorsicht beim Verwenden dieser Funktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Verein löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Verein wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten des Vereins 
                      "{club?.name}" werden unwiderruflich gelöscht.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        toast({
                          title: "Funktion nicht verfügbar",
                          description: "Die Löschfunktion ist noch nicht implementiert.",
                          variant: "destructive",
                        });
                        setShowDeleteDialog(false);
                      }}
                    >
                      Endgültig löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}