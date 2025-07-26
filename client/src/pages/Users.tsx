/**
 * Users Management Page - Only accessible by administrators
 * Allows managing club members, roles, and permissions
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useClub } from '@/hooks/use-club';
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
  AlertTriangle
} from 'lucide-react';
import type { User, Member } from '@shared/schema';

export default function Users() {
  const { selectedClub } = useClub();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member' | 'coach'>('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Fetch club members with user details
  const { data: members, isLoading } = useQuery({
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
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'coach': return <UserCog className="h-4 w-4" />;
      default: return <UsersIcon className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="destructive">Administrator</Badge>;
      case 'coach': return <Badge variant="secondary">Trainer</Badge>;
      default: return <Badge variant="outline">Mitglied</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Aktiv</Badge>;
      case 'inactive': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Inaktiv</Badge>;
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Mitglieder, Rollen und Berechtigungen für {selectedClub.name}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Suche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <SelectItem value="inactive">Inaktiv</SelectItem>
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
                <SelectItem value="coach">Trainer</SelectItem>
                <SelectItem value="member">Mitglied</SelectItem>
              </SelectContent>
            </Select>

            {/* Stats */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UsersIcon className="h-4 w-4" />
              {filteredMembers.length} von {members?.length || 0} Mitgliedern
            </div>
          </div>
        </CardContent>
      </Card>

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
                          {member.status === 'pending' && (
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
  );
}