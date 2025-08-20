/**
 * Users Management Page - Only accessible by administrators
 * Allows managing club members, roles, and permissions
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoles, getRoleOptions, formatRoleBadge } from '@/hooks/use-roles';
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
import { FeatureGate } from "@/components/FeatureGate";
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
  X,
  List,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { InviteUserDialog } from '@/components/InviteUserDialog';
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
  success: (message: string) => {},
  error: (message: string) => {},
  info: (message: string) => {}
};

export default function Users() {
  const { selectedClub } = useClub();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPage } = usePage();
  
  // Load roles for role management
  const { data: roles, isLoading: rolesLoading } = useRoles();
  
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
  const [assignmentMember, setAssignmentMember] = useState<any | null>(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);

  // Fetch club members with user details
  const { data: members = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'users'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  // Fetch available members for assignment
  const { data: availableMembers = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'available-members'],
    enabled: !!selectedClub?.id && showAssignmentDialog,
    retry: false,
  });

  // Fetch available players for assignment  
  const { data: availablePlayers = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'available-players'],
    enabled: !!selectedClub?.id && showAssignmentDialog,
    retry: false,
  });

  // Get all players for multiple assignments (including already assigned ones)
  const { data: allPlayers = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'players'],
    enabled: !!selectedClub?.id && showAssignmentDialog,
    retry: false,
  });



  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: number }) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roleId }),
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

  // Assign user to member mutation
  const assignUserToMemberMutation = useMutation({
    mutationFn: async ({ userId, memberId }: { userId: string; memberId: number }) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/users/${userId}/assign-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ memberId }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Fehler beim Zuweisen des Accounts');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account zugewiesen",
        description: "Der Benutzeraccount wurde erfolgreich dem Mitglied zugewiesen.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'available-members'] });
      setShowAssignmentDialog(false);
      setAssignmentMember(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign user to player mutation
  const assignUserToPlayerMutation = useMutation({
    mutationFn: async ({ userId, playerId }: { userId: string; playerId: number }) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/users/${userId}/assign-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ playerId }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Fehler beim Zuweisen des Accounts');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account zugewiesen",
        description: "Der Benutzeraccount wurde erfolgreich dem Spieler zugewiesen.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'available-players'] });
      setShowAssignmentDialog(false);
      setAssignmentMember(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // New mutation for adding multiple player assignments
  const addPlayerAssignmentMutation = useMutation({
    mutationFn: async ({ userId, playerId, relationshipType = 'parent' }: { userId: string; playerId: number; relationshipType?: string }) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/users/${userId}/add-player-assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ playerId, relationshipType }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Fehler beim Hinzufügen der Spieler-Zuweisung');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      const { playerId, relationshipType } = variables;
      toast({
        title: "Spieler hinzugefügt",
        description: "Der Spieler wurde erfolgreich zum Benutzeraccount hinzugefügt.",
      });
      
      // Update assignment member data immediately
      if (assignmentMember && allPlayers) {
        const addedPlayer = allPlayers.find((p: any) => p.id === playerId);
        if (addedPlayer) {
          const newAssignment = {
            playerId: addedPlayer.id,
            name: `${addedPlayer.lastName}, ${addedPlayer.firstName}`,
            relationshipType: relationshipType || 'parent'
          };
          
          setAssignmentMember({
            ...assignmentMember,
            multiplePlayerAssignments: [
              ...(assignmentMember.multiplePlayerAssignments || []),
              newAssignment
            ]
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'users'] });
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClub?.id}/users/${assignmentMember?.id}/player-assignments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'players'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'available-players'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // New mutation for removing specific player assignments
  const removePlayerAssignmentMutation = useMutation({
    mutationFn: async ({ userId, playerId }: { userId: string; playerId: number }) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/users/${userId}/player-assignment/${playerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Fehler beim Entfernen der Spieler-Zuweisung');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      const { playerId } = variables;
      toast({
        title: "Spieler entfernt",
        description: "Die Spieler-Zuweisung wurde erfolgreich entfernt.",
      });
      // Update assignment member data immediately
      if (assignmentMember) {
        setAssignmentMember({
          ...assignmentMember,
          multiplePlayerAssignments: assignmentMember.multiplePlayerAssignments?.filter((a: any) => a.playerId !== playerId) || []
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'users'] });
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClub?.id}/users/${assignmentMember?.id}/player-assignments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'players'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'available-players'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove user assignment mutation
  const removeUserAssignmentMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/users/${userId}/assignment`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Fehler beim Entfernen der Zuweisung');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Zuweisung entfernt",
        description: "Die Account-Zuweisung wurde erfolgreich entfernt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'available-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'available-players'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user details mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { 
      userId: string; 
      userData: {
        firstName?: string;
        lastName?: string;
        email?: string;
        roleId?: number;
        status?: string;
      }
    }) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Fehler beim Aktualisieren der Benutzerdaten');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Benutzer aktualisiert",
        description: "Die Benutzerdaten wurden erfolgreich aktualisiert.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'users'] });
      setShowEditDialog(false);
      setSelectedUser(null);
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
      `${member.lastName}, ${member.firstName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    // Use the formatRoleBadge from use-roles hook if roles are loaded
    if (roles && !rolesLoading) {
      return <Badge variant={role === 'club-administrator' ? 'destructive' : 'outline'}>
        {formatRoleBadge(role, roles)}
      </Badge>;
    }
    
    // Fallback for when roles are loading
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
    <FeatureGate feature="basicManagement">
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
                {roles && !rolesLoading ? (
                  roles.map((role: any) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.displayName}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="club-administrator">Vereins-Administrator</SelectItem>
                    <SelectItem value="coach">Trainer</SelectItem>
                    <SelectItem value="member">Mitglied</SelectItem>
                  </>
                )}
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Mitglieder</CardTitle>
                <CardDescription>
                  Alle Mitglieder des Vereins mit ihren Rollen und Status
                </CardDescription>
              </div>
              <InviteUserDialog 
                clubId={selectedClub?.id || 0}
                trigger={
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Mail className="h-4 w-4 mr-2" />
                    Benutzer einladen
                  </Button>
                }
              />
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
                          {getRoleIcon(member.roleDisplayName || member.roleName)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">
                            {member.lastName}, {member.firstName}
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
                            setSelectedUser({
                              ...member,
                              role: member.roleName, // Add compatibility field
                              roleId: member.roleId
                            });
                            setShowEditDialog(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Benutzer bearbeiten
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
                              if (confirm(`${member.lastName}, ${member.firstName} wirklich aus dem Verein entfernen?`)) {
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
                            {getRoleBadge(member.roleDisplayName || member.roleName)}
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

                      {/* Assignment Info */}
                      {member.assignedTo && (
                        <div className="flex items-start gap-2 text-sm">
                          <User className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <div className="text-muted-foreground text-xs">Zuweisung</div>
                            <div className="font-medium text-xs flex items-center gap-1">
                              {member.assignedType === 'member' ? '👤' : 
                               member.assignedType === 'multiple_players' ? '⚽ 👥' : '⚽'} 
                              {member.assignedTo}
                            </div>
                            {member.multiplePlayerAssignments && member.multiplePlayerAssignments.length > 1 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                📋 {member.multiplePlayerAssignments.length} Spieler-Zuweisungen
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
                    <TableHead>Zugewiesener Account</TableHead>
                    <TableHead>Beigetreten</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.roleDisplayName || member.roleName)}
                          {member.lastName}, {member.firstName}
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{getRoleBadge(member.roleDisplayName || member.roleName)}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        {member.isSuperAdmin ? (
                          <Badge variant="default" className="text-xs bg-purple-100 text-purple-800">
                            🛡️ Super Admin
                          </Badge>
                        ) : member.assignedTo ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
                              {member.assignedType === 'member' ? '👤 Mitglied' : 
                               member.assignedType === 'multiple_players' ? '⚽ Mehrere' : '⚽ Spieler'}: {member.assignedTo}
                            </Badge>
                            {member.multiplePlayerAssignments && member.multiplePlayerAssignments.length > 1 && (
                              <div className="text-xs text-muted-foreground">
                                📋 {member.multiplePlayerAssignments.length} Spieler-Zuweisungen
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Nicht zugewiesen</span>
                        )}
                      </TableCell>
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
                          
                          {/* User Assignment - Hide for Super Admins */}
                          {!member.isSuperAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setAssignmentMember(member);
                                setShowAssignmentDialog(true);
                              }}
                              title="Account zuweisen"
                              data-testid={`button-assign-user-${member.id}`}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Edit Role */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => {
                              setSelectedUser({
                                ...member,
                                role: member.roleName, // Add compatibility field
                                roleId: member.roleId
                              });
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
                              if (confirm(`${member.lastName}, ${member.firstName} wirklich aus dem Verein entfernen?`)) {
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Details von {selectedUser?.lastName}, {selectedUser?.firstName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 py-4">
              {/* User Info Section */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedUser.assignedTo || 'Keine Zuweisung'}
                  </Badge>
                  {selectedUser.isSuperAdmin && (
                    <Badge variant="default" className="text-xs bg-purple-600">
                      Super Admin
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div><strong>E-Mail:</strong> {selectedUser.email}</div>
                  <div><strong>Status:</strong> {selectedUser.status === 'active' ? 'Aktiv' : 'Inaktiv'}</div>
                </div>
              </div>

              {/* Basic User Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input
                    id="firstName"
                    value={selectedUser.firstName || ''}
                    onChange={(e) => setSelectedUser({ 
                      ...selectedUser, 
                      firstName: e.target.value 
                    })}
                    placeholder="Vorname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input
                    id="lastName"
                    value={selectedUser.lastName || ''}
                    onChange={(e) => setSelectedUser({ 
                      ...selectedUser, 
                      lastName: e.target.value 
                    })}
                    placeholder="Nachname"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={selectedUser.email || ''}
                  onChange={(e) => setSelectedUser({ 
                    ...selectedUser, 
                    email: e.target.value 
                  })}
                  placeholder="user@example.com"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Rolle</Label>
                <Select
                  value={selectedUser.roleId?.toString() || '1'}
                  onValueChange={(value) => {
                    const selectedRole = roles?.find((r: any) => r.id === parseInt(value));
                    setSelectedUser({ 
                      ...selectedUser, 
                      roleId: parseInt(value),
                      role: selectedRole?.name || '',
                      roleDisplayName: selectedRole?.displayName || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles && !rolesLoading ? (
                      roles.map((role: any) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.displayName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Lade Rollen...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedUser.status || 'active'}
                  onValueChange={(value) => setSelectedUser({ 
                    ...selectedUser, 
                    status: value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Assignment Section */}
              {!selectedUser.isSuperAdmin && (
                <div className="space-y-3">
                  <Label>Account-Zuweisung</Label>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-sm">
                      <strong>Aktuell:</strong> {selectedUser.assignedTo || 'Nicht zugewiesen'}
                    </div>
                    {selectedUser.assignedTo && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Typ: {selectedUser.assignedType === 'member' ? 'Mitglied' : 
                              selectedUser.assignedType === 'multiple_players' ? 'Mehrere Spieler' : 'Spieler'}
                      </div>
                    )}
                    {selectedUser.multiplePlayerAssignments && selectedUser.multiplePlayerAssignments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs font-medium">Spieler-Zuweisungen:</div>
                        {selectedUser.multiplePlayerAssignments.map((assignment: any) => (
                          <div key={assignment.playerId} className="text-xs text-muted-foreground">
                            ⚽ {assignment.name} ({assignment.relationshipType})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAssignmentMember(selectedUser);
                        setShowAssignmentDialog(true);
                        setShowEditDialog(false);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {selectedUser.assignedTo ? 'Zuweisung ändern' : 'Zuweisung hinzufügen'}
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUser?.id) {
                      updateUserMutation.mutate({
                        userId: selectedUser.id,
                        userData: {
                          firstName: selectedUser.firstName,
                          lastName: selectedUser.lastName,
                          email: selectedUser.email,
                          roleId: selectedUser.roleId,
                          status: selectedUser.status
                        }
                      });
                    }
                  }}
                  disabled={updateUserMutation.isPending || !selectedUser?.id}
                >
                  {updateUserMutation.isPending ? 'Speichere...' : 'Speichern'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Assignment Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Account zuweisen</DialogTitle>
            <DialogDescription>
              Weisen Sie den Account von {assignmentMember?.lastName}, {assignmentMember?.firstName} einem Mitglied oder Spieler zu.
            </DialogDescription>
          </DialogHeader>
          
          {assignmentMember && (
            <div className="space-y-6 py-4">
              {/* Current Assignment Status */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-semibold mb-2">Aktuelle Zuweisungen:</div>
                
                {/* Member Assignment */}
                {assignmentMember.memberId && (
                  <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      👤 Mitglied-Zuweisung
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {assignmentMember.assignedType === 'member' ? assignmentMember.assignedTo : 'Zugewiesen'}
                    </div>
                  </div>
                )}

                {/* Multiple Player Assignments */}
                {assignmentMember.multiplePlayerAssignments && assignmentMember.multiplePlayerAssignments.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">⚽ Spieler-Zuweisungen ({assignmentMember.multiplePlayerAssignments.length}):</div>
                    {assignmentMember.multiplePlayerAssignments.map((assignment: any) => (
                      <div key={assignment.playerId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/30 rounded">
                        <div className="text-sm">
                          <span className="font-medium">{assignment.name}</span>
                          <span className="text-muted-foreground ml-2">({assignment.relationshipType})</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removePlayerAssignmentMutation.mutate({
                            userId: assignmentMember.id,
                            playerId: assignment.playerId
                          })}
                          disabled={removePlayerAssignmentMutation.isPending}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Keine Spieler-Zuweisungen</div>
                )}

                {/* Remove all assignments button */}
                {(assignmentMember.assignedTo || (assignmentMember.multiplePlayerAssignments && assignmentMember.multiplePlayerAssignments.length > 0)) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      removeUserAssignmentMutation.mutate(assignmentMember.id);
                      setShowAssignmentDialog(false);
                    }}
                    disabled={removeUserAssignmentMutation.isPending}
                  >
                    {removeUserAssignmentMutation.isPending ? 'Entferne...' : 'Alle Zuweisungen entfernen'}
                  </Button>
                )}
              </div>

              {/* New Assignment Section */}
              <div className="space-y-4">
                <div className="text-sm font-medium">Neue Zuweisung erstellen:</div>
                
                {/* Assign to Member */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span>👤</span> Als Mitglied zuweisen
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-2">
                    {availableMembers && availableMembers.length > 0 ? (
                      availableMembers.map((member: any) => (
                        <Button
                          key={member.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => {
                            assignUserToMemberMutation.mutate({ 
                              userId: assignmentMember.id, 
                              memberId: member.id 
                            });
                            setShowAssignmentDialog(false);
                          }}
                          disabled={assignUserToMemberMutation.isPending}
                        data-testid={`button-assign-member-${member.id}`}
                      >
                        👤 {member.lastName}, {member.firstName}
                      </Button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine verfügbaren Mitglieder</p>
                  )}
                </div>
              </div>

                {/* Add Player Assignments */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span>⚽</span> Spieler zuweisen
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-2">
                    {allPlayers && allPlayers.length > 0 ? (
                      allPlayers
                        .filter(player => !assignmentMember.multiplePlayerAssignments?.some((assignment: any) => assignment.playerId === player.id))
                        .map((player: any) => (
                        <Button
                          key={player.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => {
                            addPlayerAssignmentMutation.mutate({ 
                              userId: assignmentMember.id, 
                              playerId: player.id,
                              relationshipType: 'parent'
                            });
                          }}
                          disabled={addPlayerAssignmentMutation.isPending}
                          data-testid={`button-add-player-${player.id}`}
                        >
                          <div className="flex flex-col items-start">
                            <span>➕ {player.lastName}, {player.firstName}</span>
                            {player.teamName && (
                              <span className="text-xs text-muted-foreground">Team: {player.teamName}</span>
                            )}
                          </div>
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Alle Spieler bereits zugewiesen</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignmentDialog(false);
                    setAssignmentMember(null);
                  }}
                  data-testid="button-close-assignment-dialog"
                >
                  Schließen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </FeatureGate>
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
  roleId: z.number().min(1, 'Bitte wählen Sie eine Rolle aus'),
});

type InvitationForm = z.infer<typeof invitationSchema>;

// Email Invitation Component
function InviteUserForm({ clubId }: { clubId: number }) {
  const form = useForm<InvitationForm>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: '',
      roleId: 1, // Default to member role ID
    },
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: roles } = useRoles();

  const inviteMutation = useMutation({
    mutationFn: async (data: InvitationForm) => {
      const response = await fetch(`/api/clubs/${clubId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Fehler beim Senden der Einladung');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Einladung gesendet",
        description: "Die E-Mail-Einladung wurde erfolgreich versendet.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
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
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">Rolle zuweisen</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Rolle auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles && roles.map((role: any) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.displayName || role.name}
                        </SelectItem>
                      ))}
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

