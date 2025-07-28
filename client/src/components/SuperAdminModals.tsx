import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

// Club Details Modal Component
export function ClubDetailsModal({ club, open, onClose }: { club: any; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {club.name}
          </DialogTitle>
          <DialogDescription>
            Detaillierte Informationen über den Verein
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">E-Mail</Label>
              <p className="text-sm">{club.email || 'Nicht angegeben'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Telefon</Label>
              <p className="text-sm">{club.phone || 'Nicht angegeben'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Website</Label>
              <p className="text-sm">{club.website || 'Nicht angegeben'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Adresse</Label>
              <p className="text-sm">{club.address || 'Nicht angegeben'}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Mitglieder</Label>
              <p className="text-sm">{club.memberCount || 0}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Erstellt am</Label>
              <p className="text-sm">{new Date(club.createdAt).toLocaleDateString('de-DE')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Aktiv
              </Badge>
            </div>
          </div>
        </div>
        
        {club.description && (
          <div className="mt-4">
            <Label className="text-sm font-medium text-muted-foreground">Beschreibung</Label>
            <p className="text-sm mt-1">{club.description}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Edit Club Modal Component
export function EditClubModal({ club, open, onClose, onSave, isLoading }: { 
  club: any; 
  open: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: club.name || '',
    description: club.description || '',
    address: club.address || '',
    phone: club.phone || '',
    email: club.email || '',
    website: club.website || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Vereinsname *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-email">E-Mail-Adresse *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.verein.de"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-address">Adresse</Label>
            <Input
              id="edit-address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Beschreibung</Label>
            <Textarea
              id="edit-description"
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

// Deactivate Club Dialog Component
export function DeactivateClubDialog({ club, open, onClose, onConfirm, isLoading }: { 
  club: any; 
  open: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Verein deaktivieren
          </DialogTitle>
          <DialogDescription>
            Sind Sie sicher, dass Sie den Verein "{club.name}" deaktivieren möchten?
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Warnung: Diese Aktion hat schwerwiegende Folgen
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc space-y-1 ml-5">
                  <li>Alle Mitglieder verlieren den Zugang</li>
                  <li>Buchungen und Events werden deaktiviert</li>
                  <li>Finanzielle Daten bleiben erhalten</li>
                  <li>Diese Aktion kann rückgängig gemacht werden</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Wird deaktiviert...' : 'Verein deaktivieren'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// User Details Modal Component
export function UserDetailsModal({ user, open, onClose }: { user: any; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {user.firstName} {user.lastName}
          </DialogTitle>
          <DialogDescription>
            Detaillierte Benutzerinformationen
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">E-Mail</Label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Benutzer-ID</Label>
              <p className="text-sm font-mono">{user.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Registriert am</Label>
              <p className="text-sm">{new Date(user.createdAt).toLocaleDateString('de-DE')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Letzte Anmeldung</Label>
              <p className="text-sm">
                {user.lastLoginAt ? 
                  new Date(user.lastLoginAt).toLocaleDateString('de-DE') : 
                  'Nie'
                }
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Vereinsmitgliedschaften</Label>
              <div className="space-y-1">
                {user.memberships?.length ? (
                  user.memberships.map((membership: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline">{membership.clubName}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {membership.role === 'club-administrator' ? 'Admin' : membership.role}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Vereinsmitgliedschaften</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit User Modal Component
export function EditUserModal({ user, open, onClose, onSave, isLoading }: { 
  user: any; 
  open: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    isActive: user.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Benutzer bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Informationen für {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-firstName">Vorname *</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-lastName">Nachname *</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-user-email">E-Mail-Adresse *</Label>
            <Input
              id="edit-user-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="edit-isActive" className="text-sm">
              Benutzer ist aktiv
            </Label>
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

// Deactivate User Dialog Component
export function DeactivateUserDialog({ user, open, onClose, onConfirm, isLoading }: { 
  user: any; 
  open: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Benutzer deaktivieren
          </DialogTitle>
          <DialogDescription>
            Sind Sie sicher, dass Sie den Benutzer "{user.firstName} {user.lastName}" deaktivieren möchten?
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Folgen der Deaktivierung
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc space-y-1 ml-5">
                  <li>Benutzer kann sich nicht mehr anmelden</li>
                  <li>Alle aktiven Sessions werden beendet</li>
                  <li>Vereinsmitgliedschaften bleiben bestehen</li>
                  <li>Diese Aktion kann rückgängig gemacht werden</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Wird deaktiviert...' : 'Benutzer deaktivieren'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}