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
  AlertTriangle,
  TrendingUp,
  FileText,
  Download,
  Eye
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

  // Club registered users query
  const { data: clubUsers } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'users'],
    queryFn: async () => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/users`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch club users');
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
  
  // State management
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  const [showUsageStats, setShowUsageStats] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showPlanUpgrade, setShowPlanUpgrade] = useState(false);

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
  const getRemainingUsers = () => {
    const plan = plans.find(p => p.planType === currentPlan);
    if (!plan?.memberLimit) return null;
    const totalManagedUsers = (usage?.memberCount || 0) + (usage?.playerCount || 0);
    return Math.max(0, plan.memberLimit - totalManagedUsers);
  };
  
  const canUpgrade = () => {
    return currentPlan !== 'enterprise';
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Alert for expired plan */}
      {isExpired && (
        <div className="p-4 bg-red-100 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Plan abgelaufen</span>
          </div>
        </div>
      )}

      <div className="flex-1 p-6">
        <Tabs defaultValue="overview" className="w-full h-full flex flex-col space-y-6">
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
                  Verwaltete Benutzer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Gesamt verwaltete Benutzer:</span>
                      <span className="font-medium">{(usage?.memberCount || 0) + (usage?.playerCount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>→ Mitglieder:</span>
                      <span>{usage?.memberCount || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>→ Spieler:</span>
                      <span>{usage?.playerCount || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>→ Registrierte aktive Benutzer:</span>
                      <span>{usage?.registeredActiveUsers || 0}</span>
                    </div>
                    {getRemainingUsers() !== null && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Limit:</span>
                          <span>{((usage?.memberCount || 0) + (usage?.playerCount || 0)) + (getRemainingUsers() || 0)}</span>
                        </div>
                        <Progress 
                          value={(((usage?.memberCount || 0) + (usage?.playerCount || 0)) / (((usage?.memberCount || 0) + (usage?.playerCount || 0)) + (getRemainingUsers() || 0))) * 100} 
                          className="h-2"
                        />
                      </>
                    )}
                  </div>
                  {(getRemainingUsers() === null || isEnterprise) && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      <span>Unbegrenzte Benutzer</span>
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
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowUsageStats(true)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Nutzungsstatistik
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowBilling(true)}
                  >
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
                <div className="text-2xl font-bold">{usage?.memberCount || 0}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aktive Mitglieder</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage?.teamCount || 0}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Erstellte Teams</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spieler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage?.playerCount || 0}</div>
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

        {/* Usage Statistics Dialog */}
        <Dialog open={showUsageStats} onOpenChange={setShowUsageStats}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Nutzungsstatistik - {selectedClub?.name}
              </DialogTitle>
              <DialogDescription>
                Detaillierte Übersicht über Ihre Nutzung und verbleibende Kapazitäten
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Current Usage Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                      <div className="text-2xl font-bold">{usage?.memberCount || 0}</div>
                      <div className="text-sm text-muted-foreground">Mitglieder</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Shield className="h-8 w-8 mx-auto text-green-500 mb-2" />
                      <div className="text-2xl font-bold">{usage?.playerCount || 0}</div>
                      <div className="text-sm text-muted-foreground">Spieler</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                      <div className="text-2xl font-bold">{(usage?.memberCount || 0) + (usage?.playerCount || 0)}</div>
                      <div className="text-sm text-muted-foreground">Verwaltete Benutzer</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Limits */}
              <Card>
                <CardHeader>
                  <CardTitle>Plankapazität</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentPlanData?.memberLimit ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span>Verwaltete Benutzer</span>
                          <span className="font-mono">
                            {(usage?.memberCount || 0) + (usage?.playerCount || 0)} / {currentPlanData.memberLimit}
                          </span>
                        </div>
                        <Progress 
                          value={((usage?.memberCount || 0) + (usage?.playerCount || 0)) / currentPlanData.memberLimit * 100} 
                          className="h-2"
                        />
                        <div className="text-sm text-muted-foreground">
                          {getRemainingUsers()} freie Plätze verbleibend
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <Check className="h-8 w-8 mx-auto text-green-500 mb-2" />
                        <div className="font-medium">Unbegrenzter Zugang</div>
                        <div className="text-sm text-muted-foreground">Enterprise Plan - keine Benutzerlimits</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Feature Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Feature-Nutzung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature) => (
                      <div key={feature.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {feature.enabled ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm">{feature.description}</span>
                        </div>
                        <Badge variant={feature.enabled ? "default" : "secondary"}>
                          {feature.enabled ? "Aktiv" : "Nicht verfügbar"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Billing Dialog */}
        <Dialog open={showBilling} onOpenChange={setShowBilling}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                Rechnungen & Abrechnungen
              </DialogTitle>
              <DialogDescription>
                Übersicht über Ihre Subscription-Rechnungen und Zahlungen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Current Subscription Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aktuelle Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span className="font-medium">{formatPlanName(currentPlan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                        {status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Nächste Abrechnung:</span>
                      <span className="font-medium">
                        {isEnterprise ? "Dauerhaft kostenlos bis 2099" : nextBillingDate.toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    {!isEnterprise && currentPlanData?.pricing && (
                      <div className="flex justify-between">
                        <span>Preis:</span>
                        <span className="font-medium">
                          {formatPrice(currentPlanData.pricing.monthly)}/Monat
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Invoice History (Mock data for demo) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rechnungshistorie</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEnterprise ? (
                    <div className="text-center py-8">
                      <Crown className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                      <h3 className="font-medium text-lg mb-2">Enterprise-Kunde</h3>
                      <p className="text-muted-foreground">
                        Als SV Oberglan 1975 haben Sie permanenten kostenlosen Enterprise-Zugang.
                        Es fallen keine Rechnungen an.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Januar 2025</div>
                          <div className="text-sm text-muted-foreground">Professional Plan</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">€49,00</div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Dezember 2024</div>
                          <div className="text-sm text-muted-foreground">Professional Plan</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">€49,00</div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
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