import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Mail, 
  Crown,
  Euro,
  Users,
  Settings,
  Bell,
  Edit2,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Form schemas for CRUD operations
const priceAdjustmentSchema = z.object({
  planId: z.string().min(1, "Plan ist erforderlich"),
  monthlyPrice: z.string().min(1, "Monatspreis ist erforderlich"),
  yearlyPrice: z.string().min(1, "Jahrespreis ist erforderlich"),
  displayName: z.string().min(1, "Anzeigename ist erforderlich"),
  description: z.string().optional(),
});

const planLimitsSchema = z.object({
  planId: z.string().min(1, "Plan ist erforderlich"),
  maxMembers: z.string().optional(),
  features: z.object({
    basicManagement: z.boolean(),
    teamManagement: z.boolean(),
    facilityBooking: z.boolean(),
    financialReports: z.boolean(),
    advancedReports: z.boolean(),
    automatedEmails: z.boolean(),
    apiAccess: z.boolean(),
    prioritySupport: z.boolean(),
    whiteLabel: z.boolean(),
    customIntegrations: z.boolean(),
    multiAdmin: z.boolean(),
    bulkImport: z.boolean(),
    exportData: z.boolean(),
    smsNotifications: z.boolean(),
    customFields: z.boolean(),
  }),
});

const upgradeNotificationSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  message: z.string().min(1, "Nachricht ist erforderlich"),
  targetPlan: z.enum(['starter', 'professional', 'enterprise']),
  triggerCondition: z.enum(['memberLimit', 'featureUsage', 'timeLimit']),
  triggerValue: z.string().optional(),
  isActive: z.boolean(),
});

type PriceAdjustmentForm = z.infer<typeof priceAdjustmentSchema>;
type PlanLimitsForm = z.infer<typeof planLimitsSchema>;
type UpgradeNotificationForm = z.infer<typeof upgradeNotificationSchema>;

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
                  <div className="text-2xl font-bold">{(emailStats as any)?.sent?.toLocaleString() || 0}</div>
                  <div className="text-sm text-muted-foreground">Gesendet</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{(emailStats as any)?.deliveryRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Zugestellt</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{(emailStats as any)?.bounces || 0}</div>
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

  // State for individual modals
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isPlanLimitsModalOpen, setIsPlanLimitsModalOpen] = useState(false);
  const [isUpgradeNotificationModalOpen, setIsUpgradeNotificationModalOpen] = useState(false);

  // Action handlers that open modals
  const handlePriceAdjustment = () => {
    setIsPriceModalOpen(true);
  };

  const handlePlanLimitsEdit = () => {
    setIsPlanLimitsModalOpen(true);
  };

  const handleUpgradeNotifications = () => {
    setIsUpgradeNotificationModalOpen(true);
  };

  // Debug revenue calculation
  if (analytics && (analytics as any)?.revenue) {
    console.log('🔍 SUBSCRIPTION MODAL DEBUG - Revenue Calculation:');
    console.log('Analytics data:', analytics);
    console.log('Current revenue:', (analytics as any)?.revenue?.current);
    console.log('Previous revenue:', (analytics as any)?.revenue?.previous);
    console.log('Full analytics object:', JSON.stringify(analytics, null, 2));
  }

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
                  <div className="text-2xl font-bold text-blue-600">{(analytics as any)?.planCounts?.free || 0}</div>
                  <div className="text-sm text-blue-600">Free Plans</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{(analytics as any)?.planCounts?.starter || 0}</div>
                  <div className="text-sm text-green-600">Starter Plans</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{(analytics as any)?.planCounts?.professional || 0}</div>
                  <div className="text-sm text-purple-600">Professional Plans</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{(analytics as any)?.planCounts?.enterprise || 0}</div>
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
            {analytics ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">€{(analytics as any)?.revenue?.current || 0}</div>
                  <div className="text-sm text-green-600">Monatliches Einkommen</div>
                  <div className="text-xs text-green-500 mt-1">
                    Monatlich + Jährlich (anteilig)
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">€{(analytics as any)?.revenue?.previous || 0}</div>
                  <div className="text-sm text-blue-600">Vorheriger Monat</div>
                  <div className="text-xs text-blue-500 mt-1">
                    Ohne unbegrenzte Pläne
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Keine Umsatz-Daten verfügbar
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
                onClick={handlePriceAdjustment}
              >
                Preise anpassen
              </Button>
              <Button 
                variant="outline"
                onClick={handlePlanLimitsEdit}
              >
                Plan-Limits bearbeiten
              </Button>
              <Button 
                variant="outline"
                onClick={handleUpgradeNotifications}
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

      {/* Sub-Modals */}
      <PriceAdjustmentModal 
        open={isPriceModalOpen} 
        onClose={() => setIsPriceModalOpen(false)} 
      />
      <PlanLimitsModal 
        open={isPlanLimitsModalOpen} 
        onClose={() => setIsPlanLimitsModalOpen(false)} 
      />
      <UpgradeNotificationModal 
        open={isUpgradeNotificationModalOpen} 
        onClose={() => setIsUpgradeNotificationModalOpen(false)} 
      />
    </Dialog>
  );
}

// Individual CRUD Modal Components

interface PriceAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
}

function PriceAdjustmentModal({ open, onClose }: PriceAdjustmentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiRequest(`/api/admin/subscription-plans/${selectedPlan}/price`, {
        method: 'PATCH',
        body: { price: parseFloat(newPrice) }
      });
      
      toast({
        title: "Preis erfolgreich aktualisiert",
        description: `Der Preis für den gewählten Plan wurde auf €${newPrice} gesetzt.`
      });
      
      setSelectedPlan('');
      setNewPrice('');
      onClose();
    } catch (error) {
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Der Preis konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Preise anpassen</DialogTitle>
          <DialogDescription>
            Passen Sie die Preise für Abonnement-Pläne an.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="plan-select">Plan auswählen</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie einen Plan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Plan</SelectItem>
                <SelectItem value="premium">Premium Plan</SelectItem>
                <SelectItem value="enterprise">Enterprise Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="new-price">Neuer Preis (€)</Label>
            <Input
              id="new-price"
              type="number"
              step="0.01"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="29.99"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !selectedPlan || !newPrice}>
              {isLoading ? "Wird gespeichert..." : "Preis aktualisieren"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PlanLimitsModalProps {
  open: boolean;
  onClose: () => void;
}

function PlanLimitsModal({ open, onClose }: PlanLimitsModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [memberLimit, setMemberLimit] = useState<string>('');
  const [eventLimit, setEventLimit] = useState<string>('');
  const [storageLimit, setStorageLimit] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiRequest(`/api/admin/subscription-plans/${selectedPlan}/limits`, {
        method: 'PATCH',
        body: {
          memberLimit: parseInt(memberLimit) || null,
          eventLimit: parseInt(eventLimit) || null,
          storageLimit: parseInt(storageLimit) || null
        }
      });
      
      toast({
        title: "Limits erfolgreich aktualisiert",
        description: "Die Plan-Limits wurden erfolgreich gespeichert."
      });
      
      setSelectedPlan('');
      setMemberLimit('');
      setEventLimit('');
      setStorageLimit('');
      onClose();
    } catch (error) {
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Die Limits konnten nicht aktualisiert werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan-Limits bearbeiten</DialogTitle>
          <DialogDescription>
            Definieren Sie die Nutzungslimits für verschiedene Abonnement-Pläne.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="plan-select-limits">Plan auswählen</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie einen Plan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Plan</SelectItem>
                <SelectItem value="premium">Premium Plan</SelectItem>
                <SelectItem value="enterprise">Enterprise Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="member-limit">Mitglieder-Limit</Label>
              <Input
                id="member-limit"
                type="number"
                min="1"
                value={memberLimit}
                onChange={(e) => setMemberLimit(e.target.value)}
                placeholder="100 (leer = unbegrenzt)"
              />
            </div>
            
            <div>
              <Label htmlFor="event-limit">Event-Limit pro Monat</Label>
              <Input
                id="event-limit"
                type="number"
                min="1"
                value={eventLimit}
                onChange={(e) => setEventLimit(e.target.value)}
                placeholder="50 (leer = unbegrenzt)"
              />
            </div>
            
            <div>
              <Label htmlFor="storage-limit">Speicher-Limit (GB)</Label>
              <Input
                id="storage-limit"
                type="number"
                min="1"
                step="0.1"
                value={storageLimit}
                onChange={(e) => setStorageLimit(e.target.value)}
                placeholder="10 (leer = unbegrenzt)"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !selectedPlan}>
              {isLoading ? "Wird gespeichert..." : "Limits aktualisieren"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface UpgradeNotificationModalProps {
  open: boolean;
  onClose: () => void;
}

function UpgradeNotificationModal({ open, onClose }: UpgradeNotificationModalProps) {
  const [targetPlan, setTargetPlan] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiRequest('/api/admin/upgrade-notifications', {
        method: 'POST',
        body: {
          targetPlan,
          message,
          discountPercent: discountPercent ? parseInt(discountPercent) : null,
          validUntil: validUntil ? new Date(validUntil).toISOString() : null
        }
      });
      
      toast({
        title: "Upgrade-Benachrichtigung gesendet",
        description: "Die Benachrichtigung wurde an alle berechtigten Benutzer gesendet."
      });
      
      setTargetPlan('');
      setMessage('');
      setDiscountPercent('');
      setValidUntil('');
      onClose();
    } catch (error) {
      toast({
        title: "Fehler beim Senden",
        description: "Die Benachrichtigung konnte nicht gesendet werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upgrade-Benachrichtigung</DialogTitle>
          <DialogDescription>
            Senden Sie personalisierte Upgrade-Benachrichtigungen an Benutzer.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="target-plan">Ziel-Plan</Label>
            <Select value={targetPlan} onValueChange={setTargetPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie den Ziel-Plan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="premium">Premium Plan</SelectItem>
                <SelectItem value="enterprise">Enterprise Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notification-message">Benachrichtigungs-Text</Label>
            <Textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Entdecken Sie neue Funktionen mit unserem Premium-Plan..."
              rows={4}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount">Rabatt (%)</Label>
              <Input
                id="discount"
                type="number"
                min="1"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="20"
              />
            </div>
            
            <div>
              <Label htmlFor="valid-until">Gültig bis</Label>
              <Input
                id="valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !targetPlan || !message}>
              {isLoading ? "Wird gesendet..." : "Benachrichtigung senden"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}