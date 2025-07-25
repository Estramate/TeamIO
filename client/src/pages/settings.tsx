import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
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
  
  const [clubSettings, setClubSettings] = useState({
    name: '',
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
        window.location.href = '/api/login';
      }, 2000);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Club settings query
  const { data: club, isLoading: clubLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id],
    queryFn: () => selectedClub ? apiRequest(`/api/clubs/${selectedClub.id}`) : null,
    enabled: !!selectedClub,
  });

  // Initialize club settings when club data is loaded
  useEffect(() => {
    if (club) {
      setClubSettings({
        name: club.name || '',
      });
    }
  }, [club]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Laden...</div>
    </div>;
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Weiterleitung zur Anmeldung...</div>
    </div>;
  }

  if (!selectedClub) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bitte wählen Sie einen Verein aus, um die Einstellungen zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <SettingsIcon className="w-6 h-6 mr-2" />
          Einstellungen
        </h1>
        <p className="text-gray-600 mt-1">Verwalten Sie die Vereinseinstellungen und Systemkonfiguration</p>
      </div>

      <Tabs defaultValue="club" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="club" className="flex items-center">
            <Club className="w-4 h-4 mr-2" />
            Verein
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="w-4 h-4 mr-2" />
            Benachrichtigungen
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Datenschutz
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Design
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center">
            <Database className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="club" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Club className="w-5 h-5 mr-2" />
                Vereinsinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="club-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Vereinsname
                </label>
                <Input
                  id="club-name"
                  value={clubSettings.name}
                  onChange={(e) => setClubSettings(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Vereinsname eingeben"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button className="bg-primary-500 hover:bg-primary-600">
                  <Save className="w-4 h-4 mr-2" />
                  Änderungen speichern
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
            <CardContent className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    {key === 'emailNotifications' && 'E-Mail-Benachrichtigungen'}
                    {key === 'pushNotifications' && 'Push-Benachrichtigungen'}
                    {key === 'weeklyReports' && 'Wöchentliche Berichte'}
                    {key === 'membershipReminders' && 'Mitgliedschaftserinnerungen'}
                    {key === 'eventReminders' && 'Ereigniserinnerungen'}
                  </label>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
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
            <CardContent className="space-y-4">
              {Object.entries(privacy).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    {key === 'publicProfile' && 'Öffentliches Profil'}
                    {key === 'showMemberList' && 'Mitgliederliste anzeigen'}
                    {key === 'allowMemberContact' && 'Mitgliederkontakt erlauben'}
                    {key === 'dataRetention' && 'Datenaufbewahrung'}
                  </label>
                  {typeof value === 'boolean' ? (
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  ) : (
                    <Badge variant="outline">{value}</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Design & Darstellung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <Palette className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900">Design-System</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Das Design basiert auf modernen UI-Komponenten mit Tailwind CSS und Shadcn/UI.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="w-8 h-8 bg-primary-500 rounded mx-auto mb-2"></div>
                  <div className="text-sm font-medium">Primary</div>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="w-8 h-8 bg-secondary-500 rounded mx-auto mb-2"></div>
                  <div className="text-sm font-medium">Secondary</div>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="w-8 h-8 bg-gray-500 rounded mx-auto mb-2"></div>
                  <div className="text-sm font-medium">Neutral</div>
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