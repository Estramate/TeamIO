import { useQuery } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Crown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Email Settings Modal with real data
interface EmailSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function EmailSettingsModal({ open, onClose }: EmailSettingsModalProps) {
  const { data: emailStats, isLoading } = useQuery({
    queryKey: ['/api/super-admin/email-stats'],
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mail-Einstellungen
          </DialogTitle>
          <DialogDescription>
            Konfigurieren Sie SendGrid-Integration und E-Mail-Templates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* SendGrid Configuration */}
          <div>
            <h3 className="text-lg font-medium mb-3">SendGrid-Konfiguration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">API-Schlüssel Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Konfiguriert</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Verifizierte Absender E-Mail</Label>
                <p className="text-sm text-muted-foreground mt-1">club.flow.2025@gmail.com</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Email Templates */}
          <div>
            <h3 className="text-lg font-medium mb-3">E-Mail-Templates</h3>
            <div className="space-y-3">
              {[
                { name: 'Benutzer-Einladung', description: 'Template für neue Benutzerregistrierungen' },
                { name: 'Passwort-Reset', description: 'Template für Passwort-Zurücksetzung' },
                { name: 'Willkommen-E-Mail', description: 'Template für neue Vereinsmitglieder' }
              ].map((template, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Bearbeiten
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Email Statistics with real data */}
          <div>
            <h3 className="text-lg font-medium mb-3">E-Mail-Statistiken (letzten 30 Tage)</h3>
            {isLoading ? (
              <div className="text-center py-4">Wird geladen...</div>
            ) : emailStats ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{emailStats.sent.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Gesendet</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{emailStats.deliveryRate}%</div>
                  <div className="text-sm text-muted-foreground">Zugestellt</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{emailStats.bounces}</div>
                  <div className="text-sm text-muted-foreground">Bounces</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Keine Statistiken verfügbar
              </div>
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

// Subscription Management Modal with real data
interface SubscriptionManagementModalProps {
  open: boolean;
  onClose: () => void;
}

export function SubscriptionManagementModal({ open, onClose }: SubscriptionManagementModalProps) {
  const { toast } = useToast();
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/super-admin/subscription-analytics'],
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription-Verwaltung
          </DialogTitle>
          <DialogDescription>
            Verwalten Sie Plan-Limits, Preise und Subscription-Einstellungen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Available Plans */}
          <div>
            <h3 className="text-lg font-medium mb-3">Verfügbare Pläne</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'Free', price: '€0', limit: 'bis 50 Benutzer' },
                { name: 'Starter', price: '€19', limit: 'bis 150 Benutzer' },
                { name: 'Professional', price: '€49', limit: 'bis 500 Benutzer' },
                { name: 'Enterprise', price: '€99', limit: 'Unbegrenzt' }
              ].map((plan, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className="font-medium">{plan.name}</div>
                  <div className="text-2xl font-bold my-2">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">{plan.limit}</div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Subscription Overview with real data */}
          <div>
            <h3 className="text-lg font-medium mb-3">Subscription-Übersicht</h3>
            {isLoading ? (
              <div className="text-center py-4">Wird geladen...</div>
            ) : analytics ? (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analytics.planCounts?.free || 0}</div>
                  <div className="text-sm text-blue-600">Free Plans</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics.planCounts?.starter || 0}</div>
                  <div className="text-sm text-green-600">Starter Plans</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{analytics.planCounts?.professional || 0}</div>
                  <div className="text-sm text-purple-600">Professional Plans</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{analytics.planCounts?.enterprise || 0}</div>
                  <div className="text-sm text-orange-600">Enterprise Plans</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Keine Subscription-Daten verfügbar
              </div>
            )}
          </div>

          <Separator />

          {/* Monthly Revenue with real data */}
          <div>
            <h3 className="text-lg font-medium mb-3">Umsatz-Übersicht</h3>
            {analytics && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">€{analytics.revenue?.current || 0}</div>
                  <div className="text-sm text-green-600">Monatliches Einkommen</div>
                  <div className="text-xs text-green-500 mt-1">
                    Monatlich + Jährlich (anteilig)
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">€{analytics.revenue?.previous || 0}</div>
                  <div className="text-sm text-blue-600">Vorheriger Monat</div>
                  <div className="text-xs text-blue-500 mt-1">
                    Ohne unbegrenzte Pläne
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div>
            <h3 className="text-lg font-medium mb-3">Aktionen</h3>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Preise anpassen",
                    description: "Funktion in Entwicklung - Preisanpassungen werden über die Datenbank verwaltet.",
                  });
                }}
              >
                Preise anpassen
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Plan-Limits bearbeiten", 
                    description: "Benutzer-Limits können in der Plan-Konfiguration angepasst werden.",
                  });
                }}
              >
                Plan-Limits bearbeiten
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Upgrade-Benachrichtigungen",
                    description: "E-Mail-System für Upgrade-Erinnerungen wird implementiert.",
                  });
                }}
              >
                Upgrade-Benachrichtigungen
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Schließen</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}