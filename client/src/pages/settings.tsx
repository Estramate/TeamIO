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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Club, 
  Database, 
  Shield, 
  Bell, 
  Palette, 
  Globe,
  Save,
  Download,
  Upload,
  Trash2,
  AlertTriangle
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { setPage } = usePage();
  const queryClient = useQueryClient();
  
  const [clubSettings, setClubSettings] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    membershipReminders: true,
    eventReminders: true,
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showMemberList: false,
    allowMemberContact: true,
    dataRetention: '2-years',
  });

  // Set page title and redirect if not authenticated
  useEffect(() => {
    setPage("Einstellungen", selectedClub ? `Verwalten Sie die Einstellungen für ${selectedClub.name}` : "Bitte wählen Sie einen Verein aus");
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

  // Load club data when club is selected
  useEffect(() => {
    if (selectedClub) {
      setClubSettings({
        name: selectedClub.name || '',
        description: selectedClub.description || '',
        address: selectedClub.address || '',
        phone: selectedClub.phone || '',
        email: selectedClub.email || '',
        website: selectedClub.website || '',
        logo: selectedClub.logo || '',
      });
    }
  }, [selectedClub]);

  const updateClubMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "PUT",
        `/api/clubs/${selectedClub?.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: "Vereinseinstellungen wurden aktualisiert",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
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
        description: "Fehler beim Aktualisieren der Einstellungen",
        variant: "destructive",
      });
    },
  });

  const seedDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/seed-data");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Erfolg",
        description: `Testdaten wurden erstellt. Musterverein: ${data.club.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
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
        description: "Fehler beim Erstellen der Testdaten",
        variant: "destructive",
      });
    },
  });

  const handleSaveClubSettings = () => {
    if (!selectedClub) {
      toast({
        title: "Fehler",
        description: "Kein Verein ausgewählt",
        variant: "destructive",
      });
      return;
    }

    updateClubMutation.mutate(clubSettings);
  };

  const handleSeedData = () => {
    if (confirm("Möchten Sie wirklich Testdaten erstellen? Dies erstellt einen Musterverein mit Beispieldaten.")) {
      seedDataMutation.mutate();
    }
  };

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <div className="text-center py-12">
          <SettingsIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte wählen Sie einen Verein aus, um Einstellungen zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          <TabsTrigger value="privacy">Datenschutz</TabsTrigger>
          <TabsTrigger value="appearance">Erscheinungsbild</TabsTrigger>
          <TabsTrigger value="data">Daten</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Club className="w-5 h-5 mr-2" />
                Vereinsinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vereinsname *
                  </label>
                  <Input
                    value={clubSettings.name}
                    onChange={(e) => setClubSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Name des Vereins"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail-Adresse
                  </label>
                  <Input
                    type="email"
                    value={clubSettings.email}
                    onChange={(e) => setClubSettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="info@verein.de"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <Input
                    type="tel"
                    value={clubSettings.phone}
                    onChange={(e) => setClubSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+49 123 456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <Input
                    type="url"
                    value={clubSettings.website}
                    onChange={(e) => setClubSettings(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.verein.de"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <Textarea
                  value={clubSettings.description}
                  onChange={(e) => setClubSettings(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beschreibung des Vereins..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <Textarea
                  value={clubSettings.address}
                  onChange={(e) => setClubSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Straße, PLZ Ort"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveClubSettings}
                  disabled={updateClubMutation.isPending}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateClubMutation.isPending ? 'Speichern...' : 'Änderungen speichern'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Benachrichtigungseinstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">E-Mail-Benachrichtigungen</h4>
                    <p className="text-sm text-gray-500">Erhalten Sie wichtige Updates per E-Mail</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Push-Benachrichtigungen</h4>
                    <p className="text-sm text-gray-500">Sofortige Benachrichtigungen im Browser</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Wöchentliche Berichte</h4>
                    <p className="text-sm text-gray-500">Erhalten Sie einen wöchentlichen Überblick</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Mitgliedschaftserinnerungen</h4>
                    <p className="text-sm text-gray-500">Erinnerungen für Beitragszahlungen</p>
                  </div>
                  <Switch
                    checked={notifications.membershipReminders}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, membershipReminders: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Veranstaltungserinnerungen</h4>
                    <p className="text-sm text-gray-500">Erinnerungen vor Terminen und Events</p>
                  </div>
                  <Switch
                    checked={notifications.eventReminders}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, eventReminders: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Datenschutz & Sicherheit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Öffentliches Vereinsprofil</h4>
                    <p className="text-sm text-gray-500">Vereinsinformationen öffentlich sichtbar machen</p>
                  </div>
                  <Switch
                    checked={privacy.publicProfile}
                    onCheckedChange={(checked) => 
                      setPrivacy(prev => ({ ...prev, publicProfile: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Mitgliederliste anzeigen</h4>
                    <p className="text-sm text-gray-500">Mitgliederliste für andere Mitglieder sichtbar</p>
                  </div>
                  <Switch
                    checked={privacy.showMemberList}
                    onCheckedChange={(checked) => 
                      setPrivacy(prev => ({ ...prev, showMemberList: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Mitgliederkontakt erlauben</h4>
                    <p className="text-sm text-gray-500">Anderen Mitgliedern Kontaktaufnahme ermöglichen</p>
                  </div>
                  <Switch
                    checked={privacy.allowMemberContact}
                    onCheckedChange={(checked) => 
                      setPrivacy(prev => ({ ...prev, allowMemberContact: checked }))
                    }
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Datenschutz-Informationen</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Alle Daten werden verschlüsselt gespeichert</p>
                  <p>• Keine Weitergabe an Dritte ohne Einwilligung</p>
                  <p>• DSGVO-konforme Datenverarbeitung</p>
                  <p>• Automatische Löschung nach Datenaufbewahrungszeit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Erscheinungsbild
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Theme-Einstellungen</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer border-2 border-primary-500">
                    <CardContent className="p-4 text-center">
                      <div className="w-full h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mb-3"></div>
                      <h5 className="font-medium text-gray-900">Standard Blau</h5>
                      <Badge variant="default" className="mt-2">Aktiv</Badge>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer border-2 border-gray-200 hover:border-gray-300">
                    <CardContent className="p-4 text-center">
                      <div className="w-full h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mb-3"></div>
                      <h5 className="font-medium text-gray-900">Vereinsgrün</h5>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer border-2 border-gray-200 hover:border-gray-300">
                    <CardContent className="p-4 text-center">
                      <div className="w-full h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-lg mb-3"></div>
                      <h5 className="font-medium text-gray-900">Sportrot</h5>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Logo hochladen</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Logo auswählen
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG oder SVG bis zu 2MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Datenmanagement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Daten exportieren</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Mitgliederdaten exportieren
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Finanzdaten exportieren
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Vollständiges Backup
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Daten importieren</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Upload className="w-4 h-4 mr-2" />
                      Mitgliederdaten importieren
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Upload className="w-4 h-4 mr-2" />
                      Backup wiederherstellen
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                System & Entwicklung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start">
                  <Database className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">PostgreSQL Integration</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Diese Anwendung nutzt PostgreSQL für die Datenspeicherung mit vollständiger Multi-Verein-Unterstützung.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Testdaten & Entwicklung</h4>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">Musterverein erstellen</h5>
                        <p className="text-sm text-gray-500 mt-1">
                          Erstellt einen Beispielverein mit Testdaten für die Entwicklung
                        </p>
                      </div>
                      <Button 
                        onClick={handleSeedData}
                        disabled={seedDataMutation.isPending}
                        className="bg-primary-500 hover:bg-primary-600"
                      >
                        {seedDataMutation.isPending ? 'Erstelle...' : 'Testdaten erstellen'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">✓ Vollständige CRUD</div>
                      <div className="text-gray-500">Alle Operationen</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">✓ Multi-Verein</div>
                      <div className="text-gray-500">Mehrere Clubs</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">✓ Rollen-System</div>
                      <div className="text-gray-500">45+ Rollen</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">✓ Authentifizierung</div>
                      <div className="text-gray-500">Replit Auth</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900">Gefahr Zone</h4>
                      <p className="text-sm text-red-700 mt-1 mb-4">
                        Diese Aktionen können nicht rückgängig gemacht werden.
                      </p>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Verein löschen
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
