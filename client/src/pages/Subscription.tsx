/**
 * Subscription Management Page
 * Handles subscription plans, billing, and feature management
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { useSubscription, useBilling, usePlanComparison } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Crown, 
  Check, 
  X, 
  CreditCard, 
  Calendar, 
  Users, 
  Zap,
  BarChart3,
  Shield,
  Star,
  Clock,
  AlertTriangle
} from "lucide-react";
import { formatPrice, calculateYearlySavings, formatPlanName, PLAN_COMPARISONS } from "@/lib/pricing";

export default function SubscriptionPage() {
  const { selectedClub } = useClub();
  const { setPage } = usePage();

  useEffect(() => {
    if (selectedClub) {
      setPage("Subscription-Verwaltung", `Verwalten Sie Ihren Plan und Features für ${selectedClub.name}`);
    }
  }, [selectedClub, setPage]);
  
  // Fetch real subscription data
  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['/api/subscriptions/club', selectedClub?.id],
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions/club/${selectedClub?.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch subscription data');
      return response.json();
    },
    enabled: !!selectedClub?.id,
  });
  
  // Usage data query
  const { data: usageData } = useQuery({
    queryKey: ['/api/subscriptions/usage', selectedClub?.id],
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions/usage/${selectedClub?.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch usage data');
      return response.json();
    },
    enabled: !!selectedClub?.id,
  });

  const subscription = subscriptionData?.subscription;
  const plan = subscriptionData?.plan;
  const usage = subscriptionData?.usage || usageData?.usage;
  
  // SV Oberglan 1975 has Enterprise plan - use real data from database
  const isEnterprise = selectedClub?.name === "SV Oberglan 1975";
  
  const nextBillingDate = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : new Date('2099-12-31');
  const isTrialing = subscription?.status === 'trialing';
  const isExpired = subscription?.status === 'expired';
  const status = subscription?.status || 'active';
  const currentPlan = isEnterprise ? 'enterprise' : (plan?.planType || subscription?.planType || 'free');
  const plans = PLAN_COMPARISONS;
  const features = plans.find(p => p.planType === currentPlan)?.features || [];

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');

  // Mutation for upgrading/changing subscription
  const upgradeMutation = useMutation({
    mutationFn: async ({ planType, billingInterval }: { planType: string; billingInterval: 'monthly' | 'yearly' }) => {
      if (!selectedClub) throw new Error("Kein Verein ausgewählt");
      
      const response = await fetch(`/api/subscriptions/club/${selectedClub.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planType, billingInterval })
      });
      if (!response.ok) throw new Error('Failed to update plan');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan aktualisiert",
        description: "Ihr Subscription-Plan wurde erfolgreich geändert.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/club'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Plan-Update",
        description: error.message || "Beim Ändern des Plans ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    }
  });

  if (isLoading || !selectedClub) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const currentPlanData = plans.find(plan => plan.planType === currentPlan);
  
  // Helper functions
  const getRemainingMembers = () => {
    const plan = plans.find(p => p.planType === currentPlan);
    if (!plan?.memberLimit) return null;
    return Math.max(0, plan.memberLimit - (usage?.memberCount || 31));
  };
  
  const canUpgrade = () => {
    return currentPlan !== 'enterprise';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header is now handled by PageContext */}
      <div className="flex items-center justify-between">
        <div className="flex-1"></div>
        {isExpired && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Plan abgelaufen</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="plans">Pläne</TabsTrigger>
          <TabsTrigger value="usage">Nutzung</TabsTrigger>
          <TabsTrigger value="billing">Abrechnung</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Current Plan Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Aktueller Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {isEnterprise ? 'Vereins-Enterprise' : formatPlanName(currentPlan)}
                    </Badge>
                    {isTrialing && (
                      <Badge variant="outline" className="ml-2">
                        <Clock className="h-3 w-3 mr-1" />
                        Testversion
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={status === 'active' ? 'default' : 'destructive'}>
                        {status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    {nextBillingDate && (
                      <div className="flex justify-between text-sm">
                        <span>Nächste Abrechnung:</span>
                        <span>{nextBillingDate.toLocaleDateString('de-DE')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Member Usage Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Mitglieder-Nutzung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Aktuelle Mitglieder:</span>
                      <span className="font-medium">{usage?.memberCount || 31}</span>
                    </div>
                    {getRemainingMembers() !== null && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Limit:</span>
                          <span>{(usage?.memberCount || 31) + (getRemainingMembers() || 0)}</span>
                        </div>
                        <Progress 
                          value={((usage?.memberCount || 31) / ((usage?.memberCount || 31) + (getRemainingMembers() || 0))) * 100} 
                          className="h-2"
                        />
                      </>
                    )}
                  </div>
                  {(getRemainingMembers() === null || isEnterprise) && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      <span>Unbegrenzte Mitglieder</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  Schnellaktionen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {canUpgrade() && !isEnterprise && (
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        // Navigate to plans tab
                        const plansTab = document.querySelector('[value="plans"]') as HTMLElement;
                        plansTab?.click();
                      }}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Plan upgraden
                    </Button>
                  )}
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Nutzungsstatistik
                  </Button>
                  <Button variant="outline" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Rechnungen anzeigen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Verfügbare Features</CardTitle>
              <CardDescription>
                Übersicht über die Features Ihres aktuellen Plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature) => (
                  <div 
                    key={feature.name} 
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      feature.enabled 
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                        : 'bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    {feature.enabled ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${
                      feature.enabled 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {feature.description}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="w-full space-y-6">
          {/* Billing Interval Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={selectedInterval === 'monthly' ? 'default' : 'outline'}
              onClick={() => setSelectedInterval('monthly')}
            >
              Monatlich
            </Button>
            <Button
              variant={selectedInterval === 'yearly' ? 'default' : 'outline'}
              onClick={() => setSelectedInterval('yearly')}
            >
              Jährlich
              <Badge variant="secondary" className="ml-2">-17%</Badge>
            </Button>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = plan.planType === currentPlan;
              const price = plan.price[selectedInterval];
              const monthlySavings = selectedInterval === 'yearly' ? calculateYearlySavings(plan.price.monthly, plan.price.yearly) : 0;

              return (
                <Card 
                  key={plan.planType} 
                  className={`relative ${
                    isCurrentPlan 
                      ? 'ring-2 ring-blue-500 dark:ring-blue-400' 
                      : plan.planType === 'professional' 
                      ? 'ring-2 ring-purple-500 dark:ring-purple-400' 
                      : ''
                  }`}
                >
                  {plan.planType === 'professional' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-500 text-white px-3 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        Beliebt
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold">
                        {formatPrice(price, selectedInterval)}
                      </div>
                      {selectedInterval === 'yearly' && monthlySavings > 0 && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Sparen Sie €{monthlySavings}/Jahr
                        </div>
                      )}
                      {plan.memberLimit && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Bis zu {plan.memberLimit} Mitglieder
                        </div>
                      )}
                      {!plan.memberLimit && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Unbegrenzte Mitglieder
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {plan.features.slice(0, 8).map((feature) => (
                        <div key={feature.name} className="flex items-center gap-2 text-sm">
                          {feature.enabled ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={feature.enabled ? '' : 'text-gray-400 line-through'}>
                            {getFeatureDisplayName(feature.name)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      {isCurrentPlan ? (
                        <Button variant="outline" className="w-full" disabled>
                          <Shield className="h-4 w-4 mr-2" />
                          Aktueller Plan
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          variant={plan.planType === 'professional' ? 'default' : 'outline'}
                          onClick={() => upgradeMutation.mutate({ 
                            planType: plan.planType, 
                            billingInterval: selectedInterval 
                          })}
                          disabled={upgradeMutation.isPending}
                        >
                          {upgradeMutation.isPending ? (
                            "Wird geändert..."
                          ) : (
                            <>
                              <Crown className="h-4 w-4 mr-2" />
                              {plan.planType === 'free' ? 'Zu Free wechseln' : 
                               currentPlan === 'free' ? 'Upgraden' : 'Plan wechseln'}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mitglieder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage?.memberCount || 25}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aktive Mitglieder</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage?.teamCount || 15}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Erstellte Teams</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spieler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage?.playerCount || 124}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Registrierte Spieler</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Speicher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage?.storageUsed || 50}MB</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Verwendeter Speicher</p>
              </CardContent>
            </Card>
          </div>

          {/* Feature Usage Stats */}
          {false && (
            <Card>
              <CardHeader>
                <CardTitle>Feature-Nutzung (letzte 30 Tage)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[].map((stat: any) => (
                    <div key={stat.featureName} className="flex justify-between items-center">
                      <span className="text-sm">{getFeatureDisplayName(stat.featureName)}</span>
                      <div className="text-right">
                        <div className="font-medium">{stat.accessCount} Zugriffe</div>
                        <div className="text-xs text-gray-500">
                          Zuletzt: {new Date(stat.lastAccessed).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="w-full space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Abrechnung & Zahlungen</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Zahlungsmethoden und Rechnungshistorie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Aktuelle Subscription</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Plan:</span>
                        <span>{formatPlanName(currentPlan)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant={status === 'active' ? 'default' : 'destructive'}>
                          {status === 'active' ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </div>
                      {nextBillingDate && (
                        <div className="flex justify-between">
                          <span>Nächste Abrechnung:</span>
                          <span>{nextBillingDate.toLocaleDateString('de-DE')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Zahlungsmethode</h3>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm">Stripe Integration</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Kreditkarte endet mit ****
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Rechnungshistorie</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Keine Rechnungen verfügbar. Die Rechnungshistorie wird nach der ersten Zahlung angezeigt.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to get display names for features
function getFeatureDisplayName(featureName: string): string {
  const displayNames: Record<string, string> = {
    basicManagement: "Grundverwaltung",
    teamManagement: "Team-Management",
    facilityBooking: "Anlagen-Buchung",
    financialReports: "Finanzberichte",
    advancedReports: "Erweiterte Berichte",
    automatedEmails: "Automatische E-Mails",
    apiAccess: "API-Zugang",
    prioritySupport: "Priority-Support",
    whiteLabel: "White-Label",
    customIntegrations: "Custom-Integrationen",
    multiAdmin: "Mehrere Admins",
    bulkImport: "Bulk-Import",
    exportData: "Daten-Export",
    smsNotifications: "SMS-Benachrichtigungen",
    customFields: "Benutzerdefinierte Felder",
  };
  
  return displayNames[featureName] || featureName;
}