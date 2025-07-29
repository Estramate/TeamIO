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

type PriceAdjustmentForm = z.infer<typeof priceAdjustmentSchema>;
type PlanLimitsForm = z.infer<typeof planLimitsSchema>;

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

  // Action handlers that open modals
  const handlePriceAdjustment = () => {
    setIsPriceModalOpen(true);
  };

  const handlePlanLimitsEdit = () => {
    setIsPlanLimitsModalOpen(true);
  };

  // Debug revenue calculation
  if (analytics && (analytics as any)?.revenue) {

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
  const [newMonthlyPrice, setNewMonthlyPrice] = useState<string>('');
  const [newYearlyPrice, setNewYearlyPrice] = useState<string>('');
  const [billingInterval, setBillingInterval] = useState<string>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real subscription plans from database
  const { data: subscriptionPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/super-admin/subscription-plans'],
    enabled: open,
  });

  // Debug subscription plans data
  if (subscriptionPlans) {

  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const priceToUpdate = billingInterval === 'yearly' ? parseFloat(newYearlyPrice) : parseFloat(newMonthlyPrice);
      
      await apiRequest('POST', '/api/super-admin/subscription-plans/update-price', {
        planType: selectedPlan,
        price: priceToUpdate,
        interval: billingInterval
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/subscription-analytics'] });
      
      toast({
        title: "Preis erfolgreich aktualisiert",
        description: `Der ${billingInterval === 'yearly' ? 'Jahres' : 'Monats'}preis für ${selectedPlan} wurde auf €${priceToUpdate} gesetzt.`
      });
      
      setSelectedPlan('');
      setNewMonthlyPrice('');
      setNewYearlyPrice('');
      onClose();
    } catch (error: any) {
      toast({
        title: "Fehler beim Aktualisieren",
        description: error.message || "Der Preis konnte nicht aktualisiert werden.",
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
        
        {plansLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Lade Subscription-Pläne...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="plan-select">Plan auswählen</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie einen Plan..." />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionPlans?.map((plan: any) => (
                    <SelectItem key={plan.planType} value={plan.planType}>
                      {plan.displayName} - {plan.planType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="billing-interval">Abrechnungsintervall</Label>
              <Select value={billingInterval} onValueChange={setBillingInterval}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {billingInterval === 'monthly' ? (
              <div>
                <Label htmlFor="monthly-price">Neuer Monatspreis (€)</Label>
                <Input
                  id="monthly-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newMonthlyPrice}
                  onChange={(e) => setNewMonthlyPrice(e.target.value)}
                  placeholder="19.99"
                  required
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="yearly-price">Neuer Jahrespreis (€)</Label>
                <Input
                  id="yearly-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newYearlyPrice}
                  onChange={(e) => setNewYearlyPrice(e.target.value)}
                  placeholder="199.99"
                  required
                />
              </div>
            )}

            {/* Show current price for selected plan */}
            {selectedPlan && subscriptionPlans && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium">Aktueller Preis:</Label>
                {(() => {
                  const plan = subscriptionPlans.find((p: any) => p.planType === selectedPlan);
                  if (!plan) return null;
                  const currentPrice = billingInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
                  return (
                    <p className="text-sm text-muted-foreground">
                      €{currentPrice} / {billingInterval === 'yearly' ? 'Jahr' : 'Monat'}
                    </p>
                  );
                })()}
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading || !selectedPlan || (billingInterval === 'monthly' ? !newMonthlyPrice : !newYearlyPrice)}>
                {isLoading ? "Wird gespeichert..." : "Preis aktualisieren"}
              </Button>
            </div>
          </form>
        )}
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
  const queryClient = useQueryClient();

  // Fetch real subscription plans from database
  const { data: subscriptionPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/super-admin/subscription-plans'],
    enabled: open,
  });

  // Debug subscription plans data
  if (subscriptionPlans) {


  }

  // Update form when plan is selected
  const handlePlanSelect = (planType: string) => {
    setSelectedPlan(planType);
    if (subscriptionPlans) {
      const plan = subscriptionPlans.find((p: any) => p.planType === planType);
      if (plan) {
        setMemberLimit(plan.maxMembers?.toString() || '');
        setEventLimit(''); // Could be added to schema later
        setStorageLimit(''); // Could be added to schema later
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiRequest('POST', '/api/super-admin/subscription-plans/update-limits', {
        planType: selectedPlan,
        limits: {
          memberLimit: memberLimit ? parseInt(memberLimit) : null,
          eventLimit: eventLimit ? parseInt(eventLimit) : null,
          storageLimit: storageLimit ? parseInt(storageLimit) : null
        }
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/subscription-analytics'] });
      
      toast({
        title: "Limits erfolgreich aktualisiert",
        description: "Die Plan-Limits wurden erfolgreich gespeichert."
      });
      
      setSelectedPlan('');
      setMemberLimit('');
      setEventLimit('');
      setStorageLimit('');
      onClose();
    } catch (error: any) {
      toast({
        title: "Fehler beim Aktualisieren",
        description: error.message || "Die Limits konnten nicht aktualisiert werden.",
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
        
        {plansLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Lade Subscription-Pläne...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="plan-select-limits">Plan auswählen</Label>
              <Select value={selectedPlan} onValueChange={handlePlanSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie einen Plan..." />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionPlans?.map((plan: any) => (
                    <SelectItem key={plan.planType} value={plan.planType}>
                      {plan.displayName} - {plan.planType}
                    </SelectItem>
                  ))}
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
                <p className="text-sm text-muted-foreground mt-1">
                  Hinweis: Event-Limits sind noch nicht im Schema implementiert
                </p>
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
                <p className="text-sm text-muted-foreground mt-1">
                  Hinweis: Speicher-Limits sind noch nicht im Schema implementiert
                </p>
              </div>
            </div>

            {/* Show current limits for selected plan */}
            {selectedPlan && subscriptionPlans && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium">Aktuelle Limits:</Label>
                {(() => {
                  const plan = subscriptionPlans.find((p: any) => p.planType === selectedPlan);
                  if (!plan) return null;
                  return (
                    <div className="text-sm text-muted-foreground space-y-1 mt-2">
                      <p>Mitglieder: {plan.maxMembers || 'Unbegrenzt'}</p>
                      <p>Events: Noch nicht konfiguriert</p>
                      <p>Speicher: Noch nicht konfiguriert</p>
                    </div>
                  );
                })()}
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading || !selectedPlan}>
                {isLoading ? "Wird gespeichert..." : "Limits aktualisieren"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

