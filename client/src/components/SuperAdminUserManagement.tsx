import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Crown, Shield, Users, Search, AlertTriangle, Plus } from 'lucide-react';

interface SuperAdminUserManagementProps {
  open: boolean;
  onClose: () => void;
}

export function SuperAdminUserManagement({ open, onClose }: SuperAdminUserManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all super administrators
  const { data: superAdmins = [], isLoading: loadingSuperAdmins } = useQuery({
    queryKey: ['/api/super-admin/administrators'],
    enabled: open
  });

  // Fetch all users for search
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/super-admin/all-users'],
    enabled: open && searchQuery.length > 2
  });

  // Grant super admin access mutation
  const grantSuperAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/super-admin/grant/${userId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Super-Administrator-Berechtigung erteilt",
        description: "Der Benutzer hat jetzt Super-Administrator-Rechte."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/administrators'] });
      setSelectedUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Erteilen der Berechtigung",
        description: error.message || "Die Super-Administrator-Berechtigung konnte nicht erteilt werden.",
        variant: "destructive"
      });
    }
  });

  // Revoke super admin access mutation
  const revokeSuperAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/super-admin/revoke/${userId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Super-Administrator-Berechtigung entzogen",
        description: "Der Benutzer hat keine Super-Administrator-Rechte mehr."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/administrators'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Entziehen der Berechtigung",
        description: error.message || "Die Super-Administrator-Berechtigung konnte nicht entzogen werden.",
        variant: "destructive"
      });
    }
  });

  const handleToggleSuperAdmin = async (userId: string, currentStatus: boolean) => {
    if (currentStatus) {
      // Confirm revocation
      if (window.confirm('Möchten Sie wirklich die Super-Administrator-Berechtigung für diesen Benutzer entziehen?')) {
        revokeSuperAdminMutation.mutate(userId);
      }
    } else {
      grantSuperAdminMutation.mutate(userId);
    }
  };

  const filteredUsers = allUsers.filter((user: any) => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Super-Administrator-Verwaltung
          </DialogTitle>
          <DialogDescription>
            Verwalten Sie Super-Administrator-Berechtigungen für die gesamte Plattform.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Current Super Administrators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Aktuelle Super-Administratoren ({superAdmins.length})
              </CardTitle>
              <CardDescription>
                Benutzer mit vollständigen Plattform-Administrationsrechten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSuperAdmins ? (
                <div className="text-center py-4">Lädt Super-Administratoren...</div>
              ) : superAdmins.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Keine Super-Administratoren gefunden
                </div>
              ) : (
                <div className="space-y-3">
                  {superAdmins.map((admin: any) => (
                    <div 
                      key={admin.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          <Crown className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {admin.firstName} {admin.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {admin.email}
                          </div>
                          {admin.superAdminGrantedAt && (
                            <div className="text-xs text-muted-foreground">
                              Berechtigt seit: {new Date(admin.superAdminGrantedAt).toLocaleDateString('de-DE')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Super Admin
                        </Badge>
                        <Switch
                          checked={true}
                          onCheckedChange={() => handleToggleSuperAdmin(admin.id, true)}
                          disabled={revokeSuperAdminMutation.isPending}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add New Super Administrator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Neuen Super-Administrator hinzufügen
              </CardTitle>
              <CardDescription>
                Suchen Sie nach Benutzern und erteilen Sie Super-Administrator-Berechtigungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nach Benutzern suchen (E-Mail, Name)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchQuery.length > 2 && (
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {loadingUsers ? (
                    <div className="text-center py-4">Sucht Benutzer...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Keine Benutzer gefunden
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredUsers.map((user: any) => {
                        const isSuperAdmin = superAdmins.some((admin: any) => admin.id === user.id);
                        return (
                          <div 
                            key={user.id}
                            className="flex items-center justify-between p-3 hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <Users className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isSuperAdmin ? (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  Bereits Super Admin
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleToggleSuperAdmin(user.id, false)}
                                  disabled={grantSuperAdminMutation.isPending}
                                >
                                  <Crown className="h-4 w-4 mr-1" />
                                  Berechtigung erteilen
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning Section */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800">Wichtiger Hinweis</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Super-Administratoren haben vollständigen Zugriff auf alle Vereine, Benutzer und 
                    Plattform-Einstellungen. Vergeben Sie diese Berechtigung nur an vertrauenswürdige Personen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Schließen</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}