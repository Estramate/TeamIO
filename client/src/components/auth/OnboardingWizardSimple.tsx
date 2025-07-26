/**
 * Simplified Onboarding wizard for new users without club membership
 * Temporary fix to allow users to access the system
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface OnboardingWizardSimpleProps {
  onComplete: (clubId?: number) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export function OnboardingWizardSimple({ onComplete, onClose, isOpen }: OnboardingWizardSimpleProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && onClose) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Willkommen bei ClubFlow!
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Sie sind erfolgreich angemeldet. Beginnen Sie jetzt mit der Vereinsverwaltung.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Erkunden Sie ClubFlow</CardTitle>
              <CardDescription>
                Entdecken Sie alle Funktionen der professionellen Vereinsverwaltung.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => onComplete()} 
                className="w-full"
                size="lg"
              >
                Dashboard öffnen
              </Button>
            </CardContent>
          </Card>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Sie können später einem Verein beitreten oder einen neuen erstellen.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}