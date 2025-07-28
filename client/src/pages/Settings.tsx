import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
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
  X,
  Calendar,
  Clock,
  Users,
  Activity,
  Settings as SettingsIcon
} from "lucide-react";

interface ClubData {
  id: number;
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
  foundedYear: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const queryClient = useQueryClient();
  
  const [clubData, setClubData] = useState<ClubData>({
    id: 0,
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
    settings: {},
    foundedYear: new Date().getFullYear(),
    memberCount: 0,
    createdAt: '',
    updatedAt: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [isLogoError, setIsLogoError] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  // Club data query
  const { data: club, isLoading: clubLoading, error } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id],
    queryFn: async () => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch club data');
      return response.json();
    },
    enabled: !!selectedClub?.id,
  });

  // Initialize club data when loaded
  useEffect(() => {
    if (club) {
      setClubData({
        id: club.id || 0,
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
        settings: club.settings || {},
        foundedYear: club.foundedYear || new Date().getFullYear(),
        memberCount: club.memberCount || 0,
        createdAt: club.createdAt || '',
        updatedAt: club.updatedAt || ''
      });
      setIsLogoError(false);
    }
  }, [club]);

  // Update club mutation
  const updateClubMutation = useMutation({
    mutationFn: async (updatedData: Partial<ClubData>) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update club');
      }
      
      return response.json();
    },
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
    updateClubMutation.mutate(clubData);
  };

  const handleInputChange = (field: keyof ClubData, value: string | number) => {
    setClubData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancelEdit = () => {
    // Reset to original values
    if (club) {
      setClubData({
        id: club.id || 0,
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
        settings: club.settings || {},
        foundedYear: club.foundedYear || new Date().getFullYear(),
        memberCount: club.memberCount || 0,
        createdAt: club.createdAt || '',
        updatedAt: club.updatedAt || ''
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Kein Verein ausgewählt</h2>
          <p className="text-muted-foreground">Bitte wählen Sie einen Verein aus, um die Einstellungen zu verwalten.</p>
        </div>
      </div>
    );
  }

  if (clubLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Vereinsdaten werden geladen...</div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Fehler beim Laden</h2>
          <p className="text-muted-foreground">Die Vereinsdaten konnten nicht geladen werden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vereinseinstellungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie die Informationen und das Erscheinungsbild Ihres Vereins
          </p>
        </div>
        <div className="flex items-center gap-3">
          {editMode ? (
            <>
              <Button 
                onClick={handleCancelEdit}
                variant="outline"
                disabled={updateClubMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
              <Button 
                onClick={handleSaveSettings}
                disabled={updateClubMutation.isPending}
              >
                {updateClubMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Speichern
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="advanced">Erweitert</TabsTrigger>
        </TabsList>

        {/* General Tab */}
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
                {/* Club Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Vereinsname *</Label>
                  {editMode ? (
                    <Input
                      id="name"
                      value={clubData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="z.B. SV Oberglan 1975"
                    />
                  ) : (
                    <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border rounded-md bg-muted">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      <span>{clubData.name || 'Nicht angegeben'}</span>
                    </div>
                  )}
                </div>

                {/* Short Name */}
                <div className="space-y-2">
                  <Label htmlFor="shortName">Vereinskürzel</Label>
                  {editMode ? (
                    <Input
                      id="shortName"
                      value={clubData.shortName}
                      onChange={(e) => handleInputChange('shortName', e.target.value)}
                      placeholder="z.B. SVO"
                      maxLength={10}
                    />
                  ) : (
                    <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border rounded-md bg-muted">
                      <Badge variant="secondary">{clubData.shortName || 'N/A'}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                {editMode ? (
                  <Textarea
                    id="description"
                    value={clubData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Beschreibung Ihres Vereins..."
                    rows={3}
                  />
                ) : (
                  <div className="min-h-[80px] px-3 py-2 border rounded-md bg-muted">
                    <p>{clubData.description || 'Keine Beschreibung verfügbar'}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Kontaktinformationen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail-Adresse</Label>
                    {editMode ? (
                      <Input
                        id="email"
                        type="email"
                        value={clubData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="kontakt@verein.de"
                      />
                    ) : (
                      <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border rounded-md bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{clubData.email || 'Nicht angegeben'}</span>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefonnummer</Label>
                    {editMode ? (
                      <Input
                        id="phone"
                        value={clubData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+49 123 456789"
                      />
                    ) : (
                      <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border rounded-md bg-muted">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{clubData.phone || 'Nicht angegeben'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2 mt-6">
                  <Label htmlFor="address">Adresse</Label>
                  {editMode ? (
                    <Textarea
                      id="address"
                      value={clubData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Straße 123, 12345 Stadt, Land"
                      rows={2}
                    />
                  ) : (
                    <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border rounded-md bg-muted">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{clubData.address || 'Nicht angegeben'}</span>
                    </div>
                  )}
                </div>

                {/* Website */}
                <div className="space-y-2 mt-6">
                  <Label htmlFor="website">Website</Label>
                  {editMode ? (
                    <Input
                      id="website"
                      type="url"
                      value={clubData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.verein.de"
                    />
                  ) : (
                    <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border rounded-md bg-muted">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      {clubData.website ? (
                        <a href={clubData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {clubData.website}
                        </a>
                      ) : (
                        <span>Nicht angegeben</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Vereinsstatistiken</CardTitle>
              <CardDescription>
                Aktuelle Zahlen und Informationen über Ihren Verein
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-md">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{clubData.memberCount}</div>
                  <div className="text-sm text-muted-foreground">Mitglieder</div>
                </div>
                
                <div className="text-center p-4 border rounded-md">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{clubData.foundedYear}</div>
                  <div className="text-sm text-muted-foreground">Gegründet</div>
                </div>
                
                <div className="text-center p-4 border rounded-md">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{new Date(clubData.createdAt).getFullYear()}</div>
                  <div className="text-sm text-muted-foreground">ClubFlow beigetreten</div>
                </div>
                
                <div className="text-center p-4 border rounded-md">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold">
                    {clubData.updatedAt ? new Date(clubData.updatedAt).toLocaleDateString('de-DE') : 'Heute'}
                  </div>
                  <div className="text-sm text-muted-foreground">Letztes Update</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vereinslogo</CardTitle>
              <CardDescription>
                Laden Sie das Logo Ihres Vereins hoch oder geben Sie eine URL an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  {clubData.logoUrl && !isLogoError ? (
                    <img 
                      src={clubData.logoUrl} 
                      alt="Vereinslogo" 
                      className="w-full h-full object-contain rounded"
                      onError={() => setIsLogoError(true)}
                    />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  {editMode ? (
                    <Input
                      id="logoUrl"
                      value={clubData.logoUrl}
                      onChange={(e) => {
                        handleInputChange('logoUrl', e.target.value);
                        setIsLogoError(false);
                      }}
                      placeholder="https://example.com/logo.png"
                    />
                  ) : (
                    <div className="min-h-[40px] px-3 py-2 border rounded-md bg-muted flex items-center">
                      <span>{clubData.logoUrl || 'Kein Logo konfiguriert'}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Farbschema</CardTitle>
              <CardDescription>
                Passen Sie die Farben Ihres Vereins an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primärfarbe</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: clubData.primaryColor }}
                    />
                    {editMode ? (
                      <Input
                        id="primaryColor"
                        type="color"
                        value={clubData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                    ) : (
                      <span className="font-mono text-sm">{clubData.primaryColor}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Sekundärfarbe</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: clubData.secondaryColor }}
                    />
                    {editMode ? (
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={clubData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                    ) : (
                      <span className="font-mono text-sm">{clubData.secondaryColor}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Akzentfarbe</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: clubData.accentColor }}
                    />
                    {editMode ? (
                      <Input
                        id="accentColor"
                        type="color"
                        value={clubData.accentColor}
                        onChange={(e) => handleInputChange('accentColor', e.target.value)}
                        className="w-20 h-10"
                      />
                    ) : (
                      <span className="font-mono text-sm">{clubData.accentColor}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vereinsdaten</CardTitle>
              <CardDescription>
                Erweiterte Einstellungen und Statistiken
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="foundedYear">Gründungsjahr</Label>
                  {editMode ? (
                    <Input
                      id="foundedYear"
                      type="number"
                      value={clubData.foundedYear}
                      onChange={(e) => handleInputChange('foundedYear', parseInt(e.target.value) || new Date().getFullYear())}
                      min="1800"
                      max={new Date().getFullYear()}
                    />
                  ) : (
                    <div className="min-h-[40px] px-3 py-2 border rounded-md bg-muted flex items-center">
                      <span>{clubData.foundedYear}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memberCount">Mitgliederzahl</Label>
                  {editMode ? (
                    <Input
                      id="memberCount"
                      type="number"
                      value={clubData.memberCount}
                      onChange={(e) => handleInputChange('memberCount', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  ) : (
                    <div className="min-h-[40px] px-3 py-2 border rounded-md bg-muted flex items-center">
                      <span>{clubData.memberCount} Mitglieder</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Gefahrenzone</CardTitle>
              <CardDescription>
                Irreversible Aktionen - Vorsicht geboten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Verein löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Verein wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion kann nicht rückgängig gemacht werden. Der Verein und alle
                      zugehörigen Daten werden dauerhaft gelöscht.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        toast({
                          title: "Nicht implementiert",
                          description: "Die Löschfunktion ist noch nicht verfügbar.",
                          variant: "destructive",
                        });
                        setShowDeleteDialog(false);
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Löschen
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