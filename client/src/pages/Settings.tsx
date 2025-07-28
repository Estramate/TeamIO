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
  Activity
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

  // Club data query mit allen Feldern
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

        {/* Allgemein Tab */}
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
                {/* Vereinsname */}
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

                {/* Vereinskürzel */}
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
                  <p className="text-xs text-muted-foreground">
                    Kurzes Kürzel für die Anzeige in der Sidebar (max. 10 Zeichen)
                  </p>
                </div>
              </div>

              {/* Beschreibung */}
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

              {/* Kontaktinformationen */}
              <div>
                <h3 className="text-lg font-medium mb-4">Kontaktinformationen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* E-Mail */}
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

                  {/* Telefonnummer */}
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

                {/* Adresse */}
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

          {/* Vereinsstatistiken */}
          <Card>
            <CardHeader>
              <CardTitle>Vereinsstatistiken</CardTitle>
              <CardDescription>
                Übersicht über wichtige Kennzahlen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{clubData.memberCount}</div>
                  <div className="text-sm text-muted-foreground">Mitglieder</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{clubData.foundedYear}</div>
                  <div className="text-sm text-muted-foreground">Gründungsjahr</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{new Date(clubData.createdAt).getFullYear()}</div>
                  <div className="text-sm text-muted-foreground">In ClubFlow seit</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.floor((Date.now() - new Date(clubData.updatedAt).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-muted-foreground">Tage seit Update</div>
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
                Logo Ihres Vereins für die Anzeige in der Sidebar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="logoUrl">Logo-URL</Label>
                  {editMode ? (
                    <Input
                      id="logoUrl"
                      type="url"
                      value={clubData.logoUrl}
                      onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  ) : (
                    <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border rounded-md bg-muted">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{clubData.logoUrl || 'Nicht angegeben'}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <Label>Vorschau</Label>
                  <div className="flex items-center justify-center w-32 h-32 border rounded-lg bg-muted">
                    {clubData.logoUrl && !isLogoError ? (
                      <img
                        src={clubData.logoUrl}
                        alt="Vereinslogo"
                        className="max-w-full max-h-full object-contain rounded"
                        onError={() => setIsLogoError(true)}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Image className="h-8 w-8 mx-auto mb-2" />
                        <span className="text-sm">Kein Logo</span>
                      </div>
                    )}
                  </div>
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Primärfarbe */}
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primärfarbe</Label>
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <>
                        <Input
                          id="primaryColor"
                          type="color"
                          value={clubData.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          className="w-16 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={clubData.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: clubData.primaryColor }}
                        />
                        <span className="font-mono">{clubData.primaryColor}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sekundärfarbe */}
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Sekundärfarbe</Label>
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <>
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={clubData.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          className="w-16 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={clubData.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          placeholder="#64748b"
                          className="flex-1"
                        />
                      </>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: clubData.secondaryColor }}
                        />
                        <span className="font-mono">{clubData.secondaryColor}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Akzentfarbe */}
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Akzentfarbe</Label>
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <>
                        <Input
                          id="accentColor"
                          type="color"
                          value={clubData.accentColor}
                          onChange={(e) => handleInputChange('accentColor', e.target.value)}
                          className="w-16 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={clubData.accentColor}
                          onChange={(e) => handleInputChange('accentColor', e.target.value)}
                          placeholder="#10b981"
                          className="flex-1"
                        />
                      </>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: clubData.accentColor }}
                        />
                        <span className="font-mono">{clubData.accentColor}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Farbvorschau */}
              <div className="p-4 border rounded-lg bg-gradient-to-r from-slate-50 to-slate-100">
                <h4 className="font-medium mb-3">Vorschau</h4>
                <div className="flex items-center gap-4">
                  <div 
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: clubData.primaryColor }}
                  >
                    Primärer Button
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: clubData.secondaryColor }}
                  >
                    Sekundärer Button
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: clubData.accentColor }}
                  >
                    Akzent Button
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Erweitert Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gründungsjahr</CardTitle>
              <CardDescription>
                Jahresangabe der Vereinsgründung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="foundedYear">Gründungsjahr</Label>
                {editMode ? (
                  <Input
                    id="foundedYear"
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={clubData.foundedYear}
                    onChange={(e) => handleInputChange('foundedYear', parseInt(e.target.value) || new Date().getFullYear())}
                    placeholder="z.B. 1975"
                  />
                ) : (
                  <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border rounded-md bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{clubData.foundedYear}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Systemdaten</CardTitle>
              <CardDescription>
                Informationen über die Erstellung und letzte Aktualisierung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Erstellt am</Label>
                  <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border rounded-md bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(clubData.createdAt).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Zuletzt aktualisiert</Label>
                  <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border rounded-md bg-muted">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(clubData.updatedAt).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Gefährlicher Bereich</CardTitle>
              <CardDescription>
                Diese Aktionen können nicht rückgängig gemacht werden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={editMode}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Verein löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
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