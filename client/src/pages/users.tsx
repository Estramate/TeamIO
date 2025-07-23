import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  UserCog, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Users,
  Settings,
  Crown,
  Key
} from "lucide-react";
import { CLUB_ROLES, PERMISSIONS } from "@/lib/constants";

export default function UsersPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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

  const { data: clubUsers = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'users'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const filteredUsers = clubUsers.filter((user: any) => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      'club-administrator': 'Club-Administrator',
      'president': 'Präsident',
      'vice-president': 'Vizepräsident',
      'treasurer': 'Kassier',
      'secretary': 'Schriftführer',
      'sports-director': 'Sportwart',
      'youth-leader': 'Jugendleiter',
      'board-member': 'Vorstandsmitglied',
      'head-coach': 'Cheftrainer',
      'coach': 'Trainer',
      'team-manager': 'Teammanager',
      'member': 'Mitglied',
    };
    return roleNames[role] || role;
  };

  const getRoleIcon = (role: string) => {
    if (['club-administrator', 'president'].includes(role)) return Crown;
    if (['treasurer', 'secretary', 'board-member'].includes(role)) return Shield;
    if (['head-coach', 'coach', 'team-manager'].includes(role)) return UserCog;
    return Users;
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditUserModalOpen(true);
  };

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="text-center py-12">
          <UserCog className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bitte wählen Sie einen Verein aus, um Benutzer zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Benutzerverwaltung</h2>
            <p className="text-sm text-gray-500 mt-1">
              Verwalten Sie Benutzer und Berechtigungen für {selectedClub.name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => setInviteModalOpen(true)}
              className="bg-primary-500 hover:bg-primary-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Benutzer einladen
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Benutzer</TabsTrigger>
          <TabsTrigger value="roles">Rollen & Berechtigungen</TabsTrigger>
          <TabsTrigger value="audit">Aktivitätsprotokoll</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Benutzer suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Rolle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Rollen</SelectItem>
                  <SelectItem value="club-administrator">Club-Administrator</SelectItem>
                  <SelectItem value="president">Präsident</SelectItem>
                  <SelectItem value="vice-president">Vizepräsident</SelectItem>
                  <SelectItem value="treasurer">Kassier</SelectItem>
                  <SelectItem value="coach">Trainer</SelectItem>
                  <SelectItem value="member">Mitglied</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                  <SelectItem value="suspended">Gesperrt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Grid */}
          {isUsersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Benutzer gefunden</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? "Versuchen Sie, Ihre Suchkriterien anzupassen."
                  : "Laden Sie Benutzer zu Ihrem Verein ein."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user: any) => {
                const RoleIcon = getRoleIcon(user.role);
                
                return (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <RoleIcon className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {user.firstName || user.email?.split('@')[0] || 'Unbekannt'}
                            </h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={user.status === 'active' ? 'default' : 
                                  user.status === 'inactive' ? 'secondary' : 'destructive'}
                        >
                          {user.status === 'active' ? 'Aktiv' :
                           user.status === 'inactive' ? 'Inaktiv' : 'Gesperrt'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Rolle:</span>
                          <span className="font-medium text-gray-900">
                            {getRoleDisplayName(user.role)}
                          </span>
                        </div>
                        {user.joinedAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Beigetreten:</span>
                            <span className="text-gray-900">
                              {new Date(user.joinedAt).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Handle remove user
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Rollen und Berechtigungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Vorstand & Führung */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                      Vorstand & Führung
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm space-y-1">
                      <div className="font-medium text-gray-900">Club-Administrator</div>
                      <div className="font-medium text-gray-900">Präsident</div>
                      <div className="font-medium text-gray-900">Vizepräsident</div>
                      <div className="font-medium text-gray-900">Kassier</div>
                      <div className="font-medium text-gray-900">Schriftführer</div>
                      <div className="font-medium text-gray-900">Sportwart</div>
                      <div className="font-medium text-gray-900">Jugendleiter</div>
                      <div className="font-medium text-gray-900">Vorstandsmitglied</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trainer & Betreuer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <UserCog className="w-5 h-5 mr-2 text-blue-500" />
                      Trainer & Betreuer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm space-y-1">
                      <div className="font-medium text-gray-900">Cheftrainer</div>
                      <div className="font-medium text-gray-900">Trainer</div>
                      <div className="font-medium text-gray-900">Co-Trainer</div>
                      <div className="font-medium text-gray-900">Torwarttrainer</div>
                      <div className="font-medium text-gray-900">Jugendtrainer</div>
                      <div className="font-medium text-gray-900">Teammanager</div>
                      <div className="font-medium text-gray-900">Physiotherapeut</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Verwaltung & Organisation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-green-500" />
                      Verwaltung
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm space-y-1">
                      <div className="font-medium text-gray-900">Mitgliederverwaltung</div>
                      <div className="font-medium text-gray-900">Veranstaltungskoordinator</div>
                      <div className="font-medium text-gray-900">Marketing/PR</div>
                      <div className="font-medium text-gray-900">Platzwart</div>
                      <div className="font-medium text-gray-900">Zeugwart</div>
                      <div className="font-medium text-gray-900">Ausschussmitglied</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitätsprotokoll</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Key className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aktivitätsprotokoll</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Hier werden alle Benutzeraktivitäten und Änderungen protokolliert.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite User Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Benutzer einladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail-Adresse
              </label>
              <Input placeholder="benutzer@beispiel.de" type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rolle zuweisen
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Rolle auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Mitglied</SelectItem>
                  <SelectItem value="coach">Trainer</SelectItem>
                  <SelectItem value="team-manager">Teammanager</SelectItem>
                  <SelectItem value="board-member">Vorstandsmitglied</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button variant="outline" onClick={() => setInviteModalOpen(false)}>
                Abbrechen
              </Button>
              <Button className="bg-primary-500 hover:bg-primary-600">
                Einladung senden
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
