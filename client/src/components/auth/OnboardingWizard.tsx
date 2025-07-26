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
import type { Club } from '@shared/schemas';
import { useClubStore } from '@/lib/clubStore';

interface OnboardingWizardProps {
  onComplete: (clubId?: number) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export function OnboardingWizard({ onComplete, onClose, isOpen }: OnboardingWizardProps) {
  const [step, setStep] = useState<'welcome' | 'browse' | 'create'>('welcome');
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
  const { setSelectedClub } = useClubStore();

  // Get available clubs
  const { data: clubs, isLoading } = useQuery({
    queryKey: ['/api/clubs/public'],
    enabled: isOpen && step === 'browse',
    retry: false,
  });



  // Join club mutation
  const joinClubMutation = useMutation({
    mutationFn: async (clubId: number) => {
      const response = await fetch(`/api/clubs/${clubId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'member' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to join club');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Beitrittsanfrage gesendet",
        description: "Ihre Mitgliedschaftsanfrage wurde erfolgreich gesendet und wartet auf die Genehmigung des Administrators.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
      // Don't set selected club since membership is inactive and needs approval
      onComplete(); // Go to dashboard without club selection
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Beitreten",
        description: error.message || "Sie konnten dem Verein nicht beitreten.",
        variant: "destructive",
      });
    },
  });

  // Create club mutation
  const createClubMutation = useMutation({
    mutationFn: async (clubData: typeof newClubData) => {
      const response = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clubData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create club');
      }
      
      return response.json();
    },
    onSuccess: (newClub) => {
      toast({
        title: "Verein erstellt",
        description: `${newClub.name} wurde erfolgreich erstellt.`,
      });
      setSelectedClub(newClub);
      queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
      onComplete(newClub.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Erstellen",
        description: error.message || "Der Verein konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const handleCreateClub = () => {
    if (newClubData.name.trim()) {
      createClubMutation.mutate(newClubData);
    }
  };

  const filteredClubs = (clubs as Club[] || []).filter((club: Club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const renderWelcomeStep = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-lg">
          <Users className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Willkommen bei ClubFlow!
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Sie sind erfolgreich angemeldet. Beginnen Sie jetzt mit der Vereinsverwaltung, indem Sie einem bestehenden Verein beitreten.
          </p>
        </div>
      </div>
      
      <div className="max-w-lg mx-auto">
        <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 cursor-pointer group" onClick={() => setStep('browse')}>
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Search className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-2xl mb-3">Einem Verein beitreten</h3>
            <p className="text-muted-foreground leading-relaxed">
              Durchsuchen Sie bestehende Vereine und stellen Sie einen Beitrittsantrag. Nach der Genehmigung erhalten Sie Zugang zu allen Vereinsfunktionen.
            </p>
            <Button size="lg" className="mt-6 px-8">
              Vereine durchsuchen
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="pt-8 border-t border-border">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
            <strong>Hinweis:</strong> Die Erstellung neuer Vereine ist Administratoren vorbehalten. 
            Ihr Beitrittsantrag wird vom Vereinsadministrator geprüft und genehmigt.
          </p>
        </div>
      </div>
    </div>
  );

  const renderBrowseStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Verein finden</h2>
        <p className="text-muted-foreground">Suchen Sie nach einem bestehenden Verein, dem Sie beitreten möchten.</p>
      </div>
      
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          placeholder="Name oder Ort des Vereins eingeben..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-base border-2 focus:border-primary rounded-lg"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Lade Vereine...</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredClubs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Keine Vereine gefunden</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Versuchen Sie es mit anderen Suchbegriffen oder erstellen Sie einen neuen Verein.
              </p>
              <p className="text-sm text-muted-foreground">
                Können Sie Ihren Verein nicht finden? Kontaktieren Sie den Administrator, um einen neuen Verein hinzuzufügen.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClubs.map((club: Club) => (
                <Card key={club.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-card">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="h-7 w-7 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-xl text-foreground truncate mb-1">{club.name}</h3>
                            <Badge variant="secondary" className="text-xs font-medium">Sportverein</Badge>
                          </div>
                        </div>
                        
                        {club.description && (
                          <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-3">
                            {club.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {club.address && (
                            <div className="flex items-center gap-2 min-w-0">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{club.address}</span>
                            </div>
                          )}
                          {club.email && (
                            <div className="flex items-center gap-2 min-w-0">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{club.email}</span>
                            </div>
                          )}
                          {club.website && (
                            <div className="flex items-center gap-2 min-w-0">
                              <Globe className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{club.website}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => joinClubMutation.mutate(club.id)}
                        disabled={joinClubMutation.isPending}
                        className="px-8 py-3 h-auto font-semibold text-base flex-shrink-0"
                        size="lg"
                      >
                        {joinClubMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Beitreten...
                          </>
                        ) : (
                          'Beitreten'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-center pt-8 border-t border-border">
        <Button variant="outline" onClick={() => setStep('welcome')} className="px-8">
          Zurück zur Auswahl
        </Button>
      </div>
    </div>
  );

  const renderCreateStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Neuen Verein erstellen</h2>
        <p className="text-muted-foreground">Gründen Sie Ihren Verein und starten Sie mit der professionellen Verwaltung.</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div>
              <Label htmlFor="club-name" className="text-base font-semibold">Vereinsname *</Label>
              <Input
                id="club-name"
                value={newClubData.name}
                onChange={(e) => setNewClubData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. SV Musterhausen 1920"
                className="mt-2 h-12 text-base border-2 focus:border-primary"
              />
            </div>

            <div>
              <Label htmlFor="club-description" className="text-base font-semibold">Beschreibung</Label>
              <Textarea
                id="club-description"
                value={newClubData.description}
                onChange={(e) => setNewClubData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beschreiben Sie Ihren Verein, seine Ziele und Besonderheiten..."
                rows={4}
                className="mt-2 text-base border-2 focus:border-primary resize-none"
              />
            </div>

            <div>
              <Label htmlFor="club-address" className="text-base font-semibold">Adresse</Label>
              <Input
                id="club-address"
                value={newClubData.address}
                onChange={(e) => setNewClubData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Straße, PLZ Ort"
                className="mt-2 h-12 text-base border-2 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="club-email" className="text-base font-semibold">E-Mail-Adresse</Label>
                <Input
                  id="club-email"
                  type="email"
                  value={newClubData.email}
                  onChange={(e) => setNewClubData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="kontakt@meinverein.de"
                  className="mt-2 h-12 text-base border-2 focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="club-website" className="text-base font-semibold">Website (optional)</Label>
                <Input
                  id="club-website"
                  type="url"
                  value={newClubData.website}
                  onChange={(e) => setNewClubData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.meinverein.de"
                  className="mt-2 h-12 text-base border-2 focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleCreateClub}
                disabled={createClubMutation.isPending || !newClubData.name.trim()}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                {createClubMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Erstelle Verein...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Verein erstellen
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center pt-6 border-t border-border">
        <Button variant="outline" onClick={() => setStep('welcome')} className="px-8">
          Zurück zur Auswahl
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && onClose) {
        // When dialog is closed via X button or Escape, use onClose callback
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold">Vereinsauswahl</DialogTitle>
          <DialogDescription className="text-base">
            Wählen Sie einen Verein aus, um mit ClubFlow zu beginnen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-2">
          {step === 'welcome' && renderWelcomeStep()}
          {step === 'browse' && renderBrowseStep()}
          {step === 'create' && renderCreateStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}