import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoles } from '@/hooks/useRoles';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Crown, 
  AlertTriangle,
  Calendar,
  Globe,
  Plus
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Club Details Modal
interface ClubDetailsModalProps {
  club: any;
  open: boolean;
  onClose: () => void;
}

export function ClubDetailsModal({ club, open, onClose }: ClubDetailsModalProps) {
  if (!club) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Verein Details
          </DialogTitle>
          <DialogDescription>
            Detaillierte Informationen über {club.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Vereinsname</Label>
              <p className="text-sm text-muted-foreground">{club.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">E-Mail</Label>
              <p className="text-sm text-muted-foreground">{club.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Telefon</Label>
              <p className="text-sm text-muted-foreground">{club.phone || 'Nicht angegeben'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Website</Label>
              <p className="text-sm text-muted-foreground">{club.website || 'Nicht angegeben'}</p>
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{club.userCount || 0}</div>
              <div className="text-sm text-muted-foreground">Benutzer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{club.memberCount || 0}</div>
              <div className="text-sm text-muted-foreground">Mitglieder</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                {club.subscriptionPlan || 'Free'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Plan</div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <Label className="text-sm font-medium">Beschreibung</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {club.description || 'Keine Beschreibung verfügbar'}
            </p>
          </div>

          {/* Address */}
          <div>
            <Label className="text-sm font-medium">Adresse</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {club.address || 'Keine Adresse angegeben'}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Schließen</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Club Modal
interface EditClubModalProps {
  club: any;
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading?: boolean;
}

export function EditClubModal({ club, open, onClose, onSave, isLoading }: EditClubModalProps) {
  const [formData, setFormData] = useState({
    name: club?.name || '',
    email: club?.email || '',
    phone: club?.phone || '',
    website: club?.website || '',
    description: club?.description || '',
    address: club?.address || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!club) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Verein bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Informationen für {club.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Vereinsname *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">E-Mail-Adresse *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Deactivate Club Dialog
interface DeactivateClubDialogProps {
  club: any;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeactivateClubDialog({ club, open, onClose, onConfirm, isLoading }: DeactivateClubDialogProps) {
  if (!club) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Verein deaktivieren
          </DialogTitle>
          <DialogDescription>
            Sind Sie sicher, dass Sie "{club.name}" deaktivieren möchten?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg">
            <p className="text-sm text-destructive">
              <strong>Warnung:</strong> Diese Aktion wird den Verein und alle zugehörigen Daten deaktivieren. 
              Der Verein kann später wieder aktiviert werden.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm"><strong>Betroffene Daten:</strong></p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>{club.userCount || 0} Benutzer</li>
              <li>{club.memberCount || 0} Mitglieder</li>
              <li>Alle Teams und Spieler</li>
              <li>Alle Buchungen und Events</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Wird deaktiviert...' : 'Deaktivieren'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// User Details Modal
interface UserDetailsModalProps {
  user: any;
  open: boolean;
  onClose: () => void;
}

export function UserDetailsModal({ user, open, onClose }: UserDetailsModalProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Benutzer Details
          </DialogTitle>
          <DialogDescription>
            Detaillierte Informationen über {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Benutzer-ID</Label>
              <p className="text-sm text-muted-foreground">{user.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">E-Mail</Label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Erstellt am</Label>
              <p className="text-sm text-muted-foreground">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('de-DE') : 'Unbekannt'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                {user.isActive ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Club Memberships */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Vereinszugehörigkeiten</Label>
            {user.clubs && user.clubs.length > 0 ? (
              <div className="space-y-2">
                {user.clubs.map((club: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{club.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {club.roleDisplayName || club.roleName || 'Mitglied'}
                      </p>
                    </div>
                    <Badge variant="outline">{club.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Vereinszugehörigkeiten</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Schließen</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit User Modal
interface EditUserModalProps {
  user: any;
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading?: boolean;
}

export function EditUserModal({ user, open, onClose, onSave, isLoading }: EditUserModalProps) {
  const { roles, isLoading: rolesLoading, error: rolesError } = useRoles();
  
  // Debug logging removed for production
  const [formData, setFormData] = useState({
    email: user?.email || '',
    isActive: user?.isActive ?? true,
    clubMemberships: user?.memberships || user?.clubs || [],
  });

  const [allClubs, setAllClubs] = useState<any[]>([]);
  const [newMembership, setNewMembership] = useState({
    clubId: '',
    roleId: 3, // Default to club-administrator role
    status: 'active'
  });

  // Reset form when user changes
  useEffect(() => {
    if (user && open) {
      setFormData({
        email: user.email || '',
        isActive: user.isActive ?? true,
        clubMemberships: user.memberships || user.clubs || [],
      });
    }
  }, [user, open]);

  // Fetch all clubs for the dropdown
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await fetch('/api/super-admin/clubs');
        if (response.ok) {
          const clubs = await response.json();
          setAllClubs(clubs);
        }
      } catch (error) {

      }
    };
    if (open) {
      fetchClubs();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      clubMemberships: formData.clubMemberships
    });
  };

  const handleAddMembership = () => {
    if (!newMembership.clubId) return;
    
    const club = allClubs.find(c => c.id.toString() === newMembership.clubId);
    if (!club) return;

    // Check if membership already exists
    const exists = formData.clubMemberships.some((m: any) => m.clubId === parseInt(newMembership.clubId));
    if (exists) return;

    const membership = {
      clubId: parseInt(newMembership.clubId),
      clubName: club.name,
      roleId: newMembership.roleId,
      status: newMembership.status,
      isNew: true // Mark as new for API handling
    };

    setFormData(prev => ({
      ...prev,
      clubMemberships: [...prev.clubMemberships, membership]
    }));

    setNewMembership({ clubId: '', roleId: 1, status: 'active' });
  };

  const handleRemoveMembership = (index: number) => {
    const membership = formData.clubMemberships[index];
    if (membership.isNew) {
      // Remove from list if it was just added
      setFormData(prev => ({
        ...prev,
        clubMemberships: prev.clubMemberships.filter((_: any, i: number) => i !== index)
      }));
    } else {
      // Mark for deletion if it exists in database
      setFormData(prev => ({
        ...prev,
        clubMemberships: prev.clubMemberships.map((m: any, i: number) => 
          i === index ? { ...m, toDelete: true } : m
        )
      }));
    }
  };

  const handleUpdateMembership = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      clubMemberships: prev.clubMemberships.map((m: any, i: number) => 
        i === index ? { ...m, [field]: value, isModified: !m.isNew } : m
      )
    }));
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Benutzer bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Informationen für {user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Grundlegende Informationen</h3>
            
            <div>
              <Label htmlFor="email">E-Mail-Adresse *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
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
          </div>

          <Separator />

          {/* Club Memberships */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Vereinszugehörigkeiten
            </h3>
            
            {/* Existing Memberships */}
            <div className="space-y-3">
              {formData.clubMemberships.map((membership: any, index: number) => (
                <div key={index} className={cn(
                  "p-4 border rounded-lg bg-gray-50/50 transition-all duration-200",
                  membership.toDelete ? "opacity-50 bg-red-50 border-red-200" : "hover:bg-gray-50"
                )}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{membership.clubName}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMembership(index)}
                        className={cn(
                          "h-8 px-3 text-xs font-medium rounded-md transition-colors",
                          membership.toDelete 
                            ? "text-green-700 hover:text-green-800 hover:bg-green-100" 
                            : "text-red-600 hover:text-red-700 hover:bg-red-100"
                        )}
                      >
                        {membership.toDelete ? "Wiederherstellen" : "Entfernen"}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Rolle</Label>
                        <Select
                          value={membership.roleId?.toString() || '3'}
                          onValueChange={(value) => handleUpdateMembership(index, 'roleId', parseInt(value))}
                          disabled={membership.toDelete}
                        >
                          <SelectTrigger className="w-full h-10 bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-colors">
                            <SelectValue placeholder="Rolle wählen..." />
                          </SelectTrigger>
                          <SelectContent className="max-w-xs">
                            {rolesLoading ? (
                              <SelectItem value="loading" disabled>
                                Lade Rollen...
                              </SelectItem>
                            ) : roles && roles.length > 0 ? (
                              roles.map((role: any) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.displayName}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-roles" disabled>
                                Keine Rollen verfügbar
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <Select
                          value={membership.status}
                          onValueChange={(value) => handleUpdateMembership(index, 'status', value)}
                          disabled={membership.toDelete}
                        >
                          <SelectTrigger className="w-full h-10 bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-colors">
                            <SelectValue placeholder="Status wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Aktiv
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                Inaktiv
                              </div>
                            </SelectItem>
                            <SelectItem value="suspended">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Gesperrt
                              </div>
                            </SelectItem>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                Ausstehend
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Membership */}
            <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="h-4 w-4 text-blue-600" />
                <Label className="text-sm font-medium text-gray-800">Neue Vereinszugehörigkeit hinzufügen</Label>
                <span className="text-xs text-gray-500">({allClubs.length} Vereine verfügbar)</span>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Verein</Label>
                    <Select
                      value={newMembership.clubId}
                      onValueChange={(value) => setNewMembership({ ...newMembership, clubId: value })}
                    >
                      <SelectTrigger className="h-10 bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="Verein wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {allClubs.length === 0 ? (
                          <SelectItem value="no-clubs" disabled>
                            Lade Vereine...
                          </SelectItem>
                        ) : (
                          allClubs
                            .filter(club => !formData.clubMemberships.some((m: any) => m.clubId === club.id && !m.toDelete))
                            .map((club) => (
                              <SelectItem key={club.id} value={club.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-3 w-3" />
                                  {club.name}
                                </div>
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Rolle</Label>
                    <Select
                      value={newMembership.roleId?.toString()}
                      onValueChange={(value) => setNewMembership({ ...newMembership, roleId: parseInt(value) })}
                    >
                      <SelectTrigger className="h-10 bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="Rolle wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesLoading ? (
                          <SelectItem value="loading" disabled>
                            Lade Rollen...
                          </SelectItem>
                        ) : roles && roles.length > 0 ? (
                          roles.map((role: any) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.displayName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-roles" disabled>
                            Keine Rollen verfügbar
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <Select
                      value={newMembership.status}
                      onValueChange={(value) => setNewMembership({ ...newMembership, status: value })}
                    >
                      <SelectTrigger className="h-10 bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="Status wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Aktiv
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            Inaktiv
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddMembership}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors flex items-center gap-2"
                    disabled={!newMembership.clubId || !newMembership.roleId}
                  >
                    <Plus className="h-4 w-4" />
                    Hinzufügen
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Deactivate User Dialog
interface DeactivateUserDialogProps {
  user: any;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeactivateUserDialog({ user, open, onClose, onConfirm, isLoading }: DeactivateUserDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Benutzer deaktivieren
          </DialogTitle>
          <DialogDescription>
            Sind Sie sicher, dass Sie "{user.email}" deaktivieren möchten?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg">
            <p className="text-sm text-destructive">
              <strong>Warnung:</strong> Dieser Benutzer wird deaktiviert und kann sich nicht mehr anmelden. 
              Der Benutzer kann später wieder aktiviert werden.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm"><strong>Benutzer-Details:</strong></p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>E-Mail: {user.email}</li>
              <li>Benutzer-ID: {user.id}</li>
              <li>Vereinszugehörigkeiten werden beibehalten</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Wird deaktiviert...' : 'Deaktivieren'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}