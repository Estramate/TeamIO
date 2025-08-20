import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Building2, User, Mail, Phone, Globe, MapPin, Calendar, Users, Crown } from 'lucide-react';

// Club Details Modal
export function ClubDetailsModal({ club, open, onClose }: { club: any; open: boolean; onClose: () => void }) {
  if (!club) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {club.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Vereinsname</Label>
              <p className="mt-1">{club.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">E-Mail</Label>
              <p className="mt-1">{club.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Mitglieder</Label>
              <p className="mt-1">
                <Badge variant="outline">{club.memberCount || 0}</Badge>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Erstellt am</Label>
              <p className="mt-1">{new Date(club.createdAt).toLocaleDateString('de-DE')}</p>
            </div>
          </div>
          
          {club.description && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Beschreibung</Label>
              <p className="mt-1 text-sm">{club.description}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Club Modal
export function EditClubModal({ club, open, onClose, onSave, isLoading }: { 
  club: any; 
  open: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = React.useState({
    name: club?.name || '',
    email: club?.email || '',
    description: club?.description || '',
  });

  React.useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || '',
        email: club.email || '',
        description: club.description || '',
      });
    }
  }, [club]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!club) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verein bearbeiten</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
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
export function DeactivateClubDialog({ club, open, onClose, onConfirm, isLoading }: {
  club: any;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!club) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Verein deaktivieren</AlertDialogTitle>
          <AlertDialogDescription>
            Sind Sie sicher, dass Sie den Verein "{club.name}" deaktivieren möchten? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Wird deaktiviert...' : 'Deaktivieren'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// User Details Modal
export function UserDetailsModal({ user, open, onClose }: { user: any; open: boolean; onClose: () => void }) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {user.firstName} {user.lastName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
              <p className="mt-1">{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">E-Mail</Label>
              <p className="mt-1">{user.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Benutzer-ID</Label>
              <p className="mt-1 font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Letzter Login</Label>
              <p className="mt-1">
                {user.lastLoginAt ? 
                  new Date(user.lastLoginAt).toLocaleDateString('de-DE') : 
                  'Nie'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit User Modal
export function EditUserModal({ user, open, onClose, onSave, isLoading }: { 
  user: any; 
  open: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = React.useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Benutzer bearbeiten</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Vorname *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nachname *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
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
export function DeactivateUserDialog({ user, open, onClose, onConfirm, isLoading }: {
  user: any;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Benutzer deaktivieren</AlertDialogTitle>
          <AlertDialogDescription>
            Sind Sie sicher, dass Sie den Benutzer "{user.firstName} {user.lastName}" deaktivieren möchten? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Wird deaktiviert...' : 'Deaktivieren'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}