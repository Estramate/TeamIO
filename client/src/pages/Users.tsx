/**
 * Users Management Page - Only accessible by administrators
 * Allows managing club members, roles, and permissions
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useClub } from '@/hooks/use-club';
import { usePage } from '@/contexts/PageContext';
import { apiRequest } from '@/lib/queryClient';
import { 
  UserCog, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  Users as UsersIcon,

  AlertTriangle,
  Mail,
  Send,
  User,
  UserCheck,
  UserX,
  Activity,
  AlertCircle,
  LayoutGrid,
  List,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Simple loading component
const LoadingSpinner = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
};

// Simple toast service helper
const toastService = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message),
  info: (message: string) => console.info('ℹ️', message)
};

export default function Users() {
  const { selectedClub } = useClub();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPage } = usePage();
  
  // Set page title
  useEffect(() => {
    setPage("Benutzerverwaltung", "Verwalten Sie Mitglieder, Rollen und Berechtigungen für " + (selectedClub?.name || "Ihren Verein"));
  }, [setPage, selectedClub?.name]);
  
  // For tabbed navigation
  const [activeTab, setActiveTab] = useState('users');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member' | 'coach' | 'club-administrator'>('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Fetch club members with user details
  const { data: members = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'users'],
    enabled: !!selectedClub?.id,
    retry: false,
  });



  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: number; role: string }) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Fehler beim Aktualisieren der Rolle');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rolle aktualisiert",
        description: "Die Benutzerrolle wurde erfolgreich aktualisiert.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'users'] });
      setShowEditDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update member status mutation (approve/reject)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ memberId, status }: { memberId: number; status: 'active' | 'inactive' }) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/members/${memberId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Fehler beim Aktualisieren des Status');
      }
      
      return response.json();
    },
    onSuccess: (_, { status }) => {
      toast({
        title: status === 'active' ? "Mitgliedschaft genehmigt" : "Mitgliedschaft abgelehnt",
        description: status === 'active' 
          ? "Das Mitglied wurde erfolgreich genehmigt und kann nun auf das System zugreifen."
          : "Die Mitgliedschaft wurde abgelehnt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Fehler beim Entfernen des Mitglieds');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mitglied entfernt",
        description: "Das Mitglied wurde erfolgreich aus dem Verein entfernt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  // Filter members based on search and filters
  const filteredMembers = (members as any[] || []).filter((member: any) => {
    const matchesSearch = searchQuery === '' || 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && member.status === 'inactive') ||
      member.status === statusFilter;
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': 
      case 'club-administrator': return <Shield className="h-4 w-4" />;
      case 'coach': return <UserCog className="h-4 w-4" />;
      default: return <UsersIcon className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="destructive">Administrator</Badge>;
      case 'club-administrator': return <Badge variant="destructive">Vereins-Administrator</Badge>;
      case 'coach': return <Badge variant="secondary">Trainer</Badge>;
      default: return <Badge variant="outline">Mitglied</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Aktiv</Badge>;
      case 'inactive': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
      case 'pending': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!selectedClub) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Kein Verein ausgewählt</h3>
          <p className="text-muted-foreground">
            Bitte wählen Sie einen Verein aus, um die Benutzerverwaltung zu nutzen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Suche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Nach Name oder E-Mail suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Rolle filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Rollen</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="club-administrator">Vereins-Administrator</SelectItem>
                <SelectItem value="coach">Trainer</SelectItem>
                <SelectItem value="member">Mitglied</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Karten
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Liste
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UsersIcon className="h-4 w-4" />
              {filteredMembers.length} von {members?.length || 0} Mitgliedern
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Mitglieder
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Aktivitätsprotokoll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Members Table */}
          <Card>
            <CardHeader>
              <CardTitle>Mitglieder</CardTitle>
              <CardDescription>
                Alle Mitglieder des Vereins mit ihren Rollen und Status
              </CardDescription>
            </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Mitglieder gefunden</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'Keine Mitglieder entsprechen den aktuellen Filterkriterien.'
                  : 'Dieser Verein hat noch keine Mitglieder.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gray-50 dark:bg-gray-800/50 rounded-t-lg pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getRoleIcon(member.role)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">
                            {member.firstName} {member.lastName}
                          </h3>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Menü öffnen</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(member);
                            setShowEditDialog(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Rolle bearbeiten
                          </DropdownMenuItem>
                          {(member.status === 'pending' || member.status === 'inactive') && (
                            <>
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ memberId: member.membershipId, status: 'active' })}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Genehmigen
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ memberId: member.membershipId, status: 'inactive' })}>
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                Ablehnen
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              if (confirm(`${member.firstName} ${member.lastName} wirklich aus dem Verein entfernen?`)) {
                                removeMemberMutation.mutate(member.membershipId);
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Entfernen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="space-y-3">
                      {/* Status Badge */}
                      <div className="flex justify-start">
                        {getStatusBadge(member.status)}
                      </div>
                      
                      {/* Email */}
                      <div className="flex items-start gap-2 text-sm">
                        <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-muted-foreground text-xs">E-Mail</div>
                          <div className="font-medium text-xs truncate">
                            {member.email}
                          </div>
                        </div>
                      </div>
                      
                      {/* Role */}
                      <div className="flex items-start gap-2 text-sm">
                        <Shield className="w-4 h-4 text-purple-600 mt-0.5" />
                        <div>
                          <div className="text-muted-foreground text-xs">Rolle</div>
                          <div className="mt-1">
                            {getRoleBadge(member.role)}
                          </div>
                        </div>
                      </div>

                      {/* Join Date */}
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-600 mt-0.5" />
                        <div>
                          <div className="text-muted-foreground text-xs">Beigetreten</div>
                          <div className="font-medium text-xs">
                            {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('de-DE') : 'Nicht verfügbar'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Beigetreten</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          {member.firstName} {member.lastName}
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('de-DE') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve/Reject for pending members */}
                          {(member.status === 'pending' || member.status === 'inactive') && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => updateStatusMutation.mutate({ memberId: member.membershipId, status: 'active' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => updateStatusMutation.mutate({ memberId: member.membershipId, status: 'inactive' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {/* Edit Role */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => {
                              setSelectedUser(member);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {/* Remove Member */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`${member.firstName} ${member.lastName} wirklich aus dem Verein entfernen?`)) {
                                removeMemberMutation.mutate(member.membershipId);
                              }
                            }}
                            disabled={removeMemberMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {selectedClub && <ActivityLogTab clubId={selectedClub.id} viewMode={viewMode} />}
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rolle bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie die Rolle von {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rolle</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Mitglied</SelectItem>
                    <SelectItem value="coach">Trainer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="club-administrator">Vereins-Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUser) {
                      updateRoleMutation.mutate({
                        memberId: selectedUser.membershipId,
                        role: selectedUser.role
                      });
                    }
                  }}
                  disabled={updateRoleMutation.isPending}
                >
                  {updateRoleMutation.isPending ? 'Speichern...' : 'Speichern'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

// Activity Log Component
function ActivityLogTab({ clubId, viewMode }: { clubId: number, viewMode: 'grid' | 'list' }) {
  
  const { data: logs = [], isLoading, error } = useQuery<any[]>({
    queryKey: [`/api/clubs/${clubId}/activity-logs`],
    enabled: !!clubId,
    retry: false,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_invited':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'user_approved':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'user_rejected':
        return <UserX className="h-4 w-4 text-red-500" />;
      case 'role_changed':
        return <Shield className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">Fehler beim Laden der Aktivitätslogs</p>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'Unbekannter Fehler'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-green-600" />
          Aktivitätsprotokoll
        </CardTitle>
        <CardDescription>
          Chronologische Übersicht aller Benutzeraktivitäten und Systemereignisse.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2">
              Keine Aktivitätslogs vorhanden
            </p>
            <p className="text-muted-foreground">
              Aktivitäten werden hier angezeigt, sobald Benutzeraktionen stattfinden.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
            {logs.map((log: any) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="bg-gray-50 dark:bg-gray-800/50 rounded-t-lg pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-white dark:bg-gray-900 rounded-full border">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight">
                        {log.description}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {log.userFirstName && log.userLastName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UsersIcon className="h-4 w-4" />
                      von {log.userFirstName} {log.userLastName}
                    </div>
                  )}
                  {log.metadata && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <details className="cursor-pointer">
                        <summary>Details anzeigen</summary>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {logs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-shrink-0 mt-1 p-1.5 bg-white dark:bg-gray-900 rounded-full border">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium mb-1">
                      {log.description}
                    </p>
                    <time className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                      {formatDate(log.createdAt)}
                    </time>
                  </div>
                  {log.userFirstName && log.userLastName && (
                    <p className="text-xs text-muted-foreground">
                      von {log.userFirstName} {log.userLastName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Invitation Form Schema
const invitationSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  role: z.enum(['member', 'trainer', 'club-administrator']).default('member'),
});

type InvitationForm = z.infer<typeof invitationSchema>;

// Email Invitation Component
function InviteUserForm({ clubId }: { clubId: number }) {
  const form = useForm<InvitationForm>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InvitationForm) => {
      return await apiRequest('POST', `/api/clubs/${clubId}/invite`, data);
    },
    onSuccess: () => {
      toastService.success('Einladung erfolgreich versendet!');
      form.reset();
    },
    onError: (error) => {
      console.error('Invitation error:', error);
      toastService.error('Fehler beim Senden der Einladung: ' + error.message);
    },
  });

  const onSubmit = (data: InvitationForm) => {
    inviteMutation.mutate(data);
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg border shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Benutzer per E-Mail einladen
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Senden Sie eine Einladung an neue Benutzer, um dem Verein beizutreten.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">E-Mail-Adresse</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="beispiel@email.com"
                      type="email"
                      className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">Rolle zuweisen</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Rolle auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Mitglied</SelectItem>
                      <SelectItem value="trainer">Trainer</SelectItem>
                      <SelectItem value="club-administrator">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={inviteMutation.isPending}
          >
            {inviteMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Einladung senden
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

