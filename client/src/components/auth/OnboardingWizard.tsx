/**
 * Onboarding wizard for new users without club membership
 * Guides users through club selection or creation
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, MapPin, Mail, Globe, Search } from 'lucide-react';
import type { Club } from '@shared/schema';

interface OnboardingWizardProps {
  onComplete: (clubId?: number) => void;
  isOpen: boolean;
}

export function OnboardingWizard({ onComplete, isOpen }: OnboardingWizardProps) {
  const [step, setStep] = useState<'welcome' | 'browse' | 'create' | 'join'>('welcome');
  const [searchQuery, setSearchQuery] = useState('');
  const [newClubData, setNewClubData] = useState({
    name: '',
    description: '',
    address: '',
    email: '',
    website: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available clubs
  const { data: clubs, isLoading } = useQuery({
    queryKey: ['/api/clubs'],
    enabled: isOpen && (step === 'browse' || step === 'join'),
  });

  // Create new club mutation
  const createClubMutation = useMutation({
    mutationFn: async (clubData: typeof newClubData) => {
      const response = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clubData),
      });
      if (!response.ok) throw new Error('Failed to create club');
      return response.json();
    },
    onSuccess: (club) => {
      toast({
        title: "Verein erfolgreich erstellt",
        description: `${club.name} wurde erfolgreich erstellt.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
      onComplete(club.id);
    },
    onError: () => {
      toast({
        title: "Fehler beim Erstellen",
        description: "Der Verein konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Join club mutation
  const joinClubMutation = useMutation({
    mutationFn: async (clubId: number) => {
      const response = await fetch(`/api/clubs/${clubId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'member' }),
      });
      if (!response.ok) throw new Error('Failed to join club');
      return response.json();
    },
    onSuccess: (membership) => {
      toast({
        title: "Erfolgreich beigetreten",
        description: "Sie sind dem Verein erfolgreich beigetreten.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
      onComplete(membership.clubId);
    },
    onError: () => {
      toast({
        title: "Fehler beim Beitreten",
        description: "Sie konnten dem Verein nicht beitreten.",
        variant: "destructive",
      });
    },
  });

  const filteredClubs = (clubs as Club[] || []).filter((club: Club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClub = () => {
    if (!newClubData.name.trim()) {
      toast({
        title: "Name erforderlich",
        description: "Bitte geben Sie einen Vereinsnamen ein.",
        variant: "destructive",
      });
      return;
    }
    createClubMutation.mutate(newClubData);
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <Users className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">Willkommen bei TeamIO!</h2>
        <p className="text-muted-foreground">
          Sie sind erfolgreich angemeldet. Möchten Sie einem bestehenden Verein beitreten oder einen neuen Verein erstellen?
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          className="h-auto p-4 text-left"
          onClick={() => setStep('browse')}
        >
          <div>
            <Search className="w-5 h-5 mb-2" />
            <div className="font-semibold">Verein suchen</div>
            <div className="text-xs text-muted-foreground">Bestehenden Verein finden</div>
          </div>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 text-left"
          onClick={() => setStep('create')}
        >
          <div>
            <Plus className="w-5 h-5 mb-2" />
            <div className="font-semibold">Verein erstellen</div>
            <div className="text-xs text-muted-foreground">Neuen Verein gründen</div>
          </div>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 text-left"
          onClick={() => onComplete()}
        >
          <div>
            <Users className="w-5 h-5 mb-2" />
            <div className="font-semibold">Später entscheiden</div>
            <div className="text-xs text-muted-foreground">Ohne Verein fortfahren</div>
          </div>
        </Button>
      </div>
    </div>
  );

  const renderBrowseStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Vereine durchsuchen</h2>
        <Button variant="outline" size="sm" onClick={() => setStep('welcome')}>
          Zurück
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Verein suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Lade Vereine...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredClubs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine Vereine gefunden</p>
            </div>
          ) : (
            filteredClubs.map((club: Club) => (
              <Card key={club.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{club.name}</h3>
                      {club.description && (
                        <p className="text-sm text-muted-foreground mt-1">{club.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {club.address && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {club.address}
                          </div>
                        )}
                        {club.email && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {club.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => joinClubMutation.mutate(club.id)}
                      disabled={joinClubMutation.isPending}
                    >
                      Beitreten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderCreateStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Neuen Verein erstellen</h2>
        <Button variant="outline" size="sm" onClick={() => setStep('welcome')}>
          Zurück
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="club-name">Vereinsname *</Label>
          <Input
            id="club-name"
            value={newClubData.name}
            onChange={(e) => setNewClubData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="z.B. SV Musterhausen 1920"
          />
        </div>

        <div>
          <Label htmlFor="club-description">Beschreibung</Label>
          <Textarea
            id="club-description"
            value={newClubData.description}
            onChange={(e) => setNewClubData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Kurze Beschreibung des Vereins..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="club-address">Adresse</Label>
          <Input
            id="club-address"
            value={newClubData.address}
            onChange={(e) => setNewClubData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Vereinsadresse"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="club-email">E-Mail</Label>
            <Input
              id="club-email"
              type="email"
              value={newClubData.email}
              onChange={(e) => setNewClubData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="info@verein.de"
            />
          </div>
          <div>
            <Label htmlFor="club-website">Website</Label>
            <Input
              id="club-website"
              type="url"
              value={newClubData.website}
              onChange={(e) => setNewClubData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://www.verein.de"
            />
          </div>
        </div>

        <Button 
          onClick={handleCreateClub}
          disabled={createClubMutation.isPending || !newClubData.name.trim()}
          className="w-full"
        >
          {createClubMutation.isPending ? 'Erstelle Verein...' : 'Verein erstellen'}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vereinsauswahl</DialogTitle>
          <DialogDescription>
            Wählen Sie einen Verein aus oder erstellen Sie einen neuen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {step === 'welcome' && renderWelcomeStep()}
          {step === 'browse' && renderBrowseStep()}
          {step === 'create' && renderCreateStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}