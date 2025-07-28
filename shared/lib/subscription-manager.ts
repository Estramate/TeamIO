/**
 * Subscription Management Utilities
 * Handles feature access, plan validation, and billing logic
 */

import { 
  SubscriptionPlan, 
  ClubSubscription, 
  PLAN_FEATURES, 
  MEMBER_LIMITS,
  PLAN_PRICING 
} from "@shared/schemas/subscriptions";

export type FeatureName = keyof typeof PLAN_FEATURES.free;
export type PlanType = keyof typeof PLAN_FEATURES;

export interface SubscriptionService {
  // Feature access
  hasFeature(feature: FeatureName): boolean;
  canAddMembers(currentCount: number): boolean;
  getRemainingMembers(): number | null;
  
  // Plan information
  getCurrentPlan(): PlanType;
  getPlanDetails(): SubscriptionPlan | null;
  getSubscriptionStatus(): string;
  
  // Billing
  getNextBillingDate(): Date | null;
  isTrialing(): boolean;
  isExpired(): boolean;
  canUpgrade(): boolean;
  canDowngrade(): boolean;
  
  // Usage tracking
  trackFeatureAccess(feature: FeatureName, metadata?: any): void;
  getCurrentUsage(): {
    members: number;
    teams: number;
    facilities: number;
    storage: number;
  };
}

export class ClubSubscriptionManager implements SubscriptionService {
  private subscription: ClubSubscription | null;
  private plan: SubscriptionPlan | null;
  private currentUsage: {
    members: number;
    teams: number;
    facilities: number;
    storage: number;
  };

  constructor(
    subscription: ClubSubscription | null,
    plan: SubscriptionPlan | null,
    usage?: {
      members: number;
      teams: number;
      facilities: number;
      storage: number;
    }
  ) {
    this.subscription = subscription;
    this.plan = plan;
    this.currentUsage = usage || {
      members: 0,
      teams: 0,
      facilities: 0,
      storage: 0,
    };
  }

  // Feature access methods
  hasFeature(feature: FeatureName): boolean {
    if (!this.plan) return PLAN_FEATURES.free[feature];
    
    const planType = this.plan.planType as PlanType;
    return PLAN_FEATURES[planType]?.[feature] || false;
  }

  canAddMembers(currentCount: number): boolean {
    if (!this.plan) return currentCount < MEMBER_LIMITS.free;
    
    const planType = this.plan.planType as PlanType;
    const limit = MEMBER_LIMITS[planType];
    
    // Unlimited members
    if (limit === null) return true;
    
    return currentCount < limit;
  }

  getRemainingMembers(): number | null {
    if (!this.plan) return MEMBER_LIMITS.free - this.currentUsage.members;
    
    const planType = this.plan.planType as PlanType;
    const limit = MEMBER_LIMITS[planType];
    
    // Unlimited members
    if (limit === null) return null;
    
    return Math.max(0, limit - this.currentUsage.members);
  }

  // Plan information
  getCurrentPlan(): PlanType {
    return (this.plan?.planType as PlanType) || 'free';
  }

  getPlanDetails(): SubscriptionPlan | null {
    return this.plan;
  }

  getSubscriptionStatus(): string {
    return this.subscription?.status || 'inactive';
  }

  // Billing methods
  getNextBillingDate(): Date | null {
    return this.subscription?.currentPeriodEnd || null;
  }

  isTrialing(): boolean {
    if (!this.subscription?.trialEnd) return false;
    return new Date() < this.subscription.trialEnd;
  }

  isExpired(): boolean {
    if (!this.subscription) return true;
    
    const now = new Date();
    return (
      this.subscription.status === 'expired' ||
      (this.subscription.currentPeriodEnd && now > this.subscription.currentPeriodEnd)
    );
  }

  canUpgrade(): boolean {
    const currentPlan = this.getCurrentPlan();
    const planHierarchy: PlanType[] = ['free', 'starter', 'professional', 'enterprise'];
    const currentIndex = planHierarchy.indexOf(currentPlan);
    return currentIndex < planHierarchy.length - 1;
  }

  canDowngrade(): boolean {
    const currentPlan = this.getCurrentPlan();
    const planHierarchy: PlanType[] = ['free', 'starter', 'professional', 'enterprise'];
    const currentIndex = planHierarchy.indexOf(currentPlan);
    return currentIndex > 0;
  }

  // Usage tracking
  trackFeatureAccess(feature: FeatureName, metadata?: any): void {
    // This would typically make an API call to log feature access
    console.log(`Feature accessed: ${feature}`, metadata);
  }

  getCurrentUsage() {
    return this.currentUsage;
  }

  // Helper methods
  getFeatureList(): Array<{ name: FeatureName; enabled: boolean; description: string }> {
    const features: Array<{ name: FeatureName; enabled: boolean; description: string }> = [
      { name: 'basicManagement', enabled: this.hasFeature('basicManagement'), description: 'Grundlegende Vereinsverwaltung' },
      { name: 'teamManagement', enabled: this.hasFeature('teamManagement'), description: 'Team-Management' },
      { name: 'facilityBooking', enabled: this.hasFeature('facilityBooking'), description: 'Anlagen-Buchungssystem' },
      { name: 'financialReports', enabled: this.hasFeature('financialReports'), description: 'Finanzberichte' },
      { name: 'advancedReports', enabled: this.hasFeature('advancedReports'), description: 'Erweiterte Berichte' },
      { name: 'automatedEmails', enabled: this.hasFeature('automatedEmails'), description: 'Automatisierte E-Mails' },
      { name: 'apiAccess', enabled: this.hasFeature('apiAccess'), description: 'API-Zugang' },
      { name: 'prioritySupport', enabled: this.hasFeature('prioritySupport'), description: 'Priority-Support' },
      { name: 'whiteLabel', enabled: this.hasFeature('whiteLabel'), description: 'White-Label-Option' },
      { name: 'customIntegrations', enabled: this.hasFeature('customIntegrations'), description: 'Custom-Integrationen' },
      { name: 'multiAdmin', enabled: this.hasFeature('multiAdmin'), description: 'Mehrere Administratoren' },
      { name: 'bulkImport', enabled: this.hasFeature('bulkImport'), description: 'Bulk-Import' },
      { name: 'exportData', enabled: this.hasFeature('exportData'), description: 'Daten-Export' },
      { name: 'smsNotifications', enabled: this.hasFeature('smsNotifications'), description: 'SMS-Benachrichtigungen' },
      { name: 'customFields', enabled: this.hasFeature('customFields'), description: 'Benutzerdefinierte Felder' },
    ];

    return features;
  }

  getPlanComparison(): Array<{
    planType: PlanType;
    name: string;
    price: { monthly: number; yearly: number };
    memberLimit: number | null;
    features: Array<{ name: FeatureName; enabled: boolean }>;
  }> {
    const plans: PlanType[] = ['free', 'starter', 'professional', 'enterprise'];
    const planNames = {
      free: 'Kostenlos',
      starter: 'Vereins-Starter',
      professional: 'Vereins-Professional',
      enterprise: 'Vereins-Enterprise'
    };

    return plans.map(planType => ({
      planType,
      name: planNames[planType],
      price: PLAN_PRICING[planType],
      memberLimit: MEMBER_LIMITS[planType],
      features: Object.keys(PLAN_FEATURES[planType]).map(feature => ({
        name: feature as FeatureName,
        enabled: PLAN_FEATURES[planType][feature as FeatureName]
      }))
    }));
  }
}

// Factory function to create subscription manager
export function createSubscriptionManager(
  subscription: ClubSubscription | null,
  plan: SubscriptionPlan | null,
  usage?: {
    members: number;
    teams: number;
    facilities: number;
    storage: number;
  }
): ClubSubscriptionManager {
  return new ClubSubscriptionManager(subscription, plan, usage);
}

// Feature gate decorator for React components
export function withFeatureGate(
  feature: FeatureName,
  fallbackComponent?: any
) {
  return function <P extends object>(Component: any) {
    return function FeatureGatedComponent(props: P) {
      // This would be implemented with a context that provides subscription manager
      // For now, we'll assume it's available via a hook
      // const subscriptionManager = useSubscription();
      
      // if (!subscriptionManager.hasFeature(feature)) {
      //   return fallbackComponent ? createElement(fallbackComponent, props) : null;
      // }
      
      return Component(props);
    };
  };
}

// Hook for feature checking (would be implemented in React context)
export interface UseSubscriptionResult {
  subscriptionManager: ClubSubscriptionManager;
  hasFeature: (feature: FeatureName) => boolean;
  canAddMembers: (currentCount: number) => boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Utility functions
export function formatPlanName(planType: PlanType): string {
  const names = {
    free: 'Kostenlos',
    starter: 'Vereins-Starter',
    professional: 'Vereins-Professional',
    enterprise: 'Vereins-Enterprise'
  };
  return names[planType];
}

export function formatPrice(amount: number, interval: 'monthly' | 'yearly'): string {
  const intervalText = interval === 'monthly' ? '/Monat' : '/Jahr';
  return amount === 0 ? 'Kostenlos' : `€${amount}${intervalText}`;
}

export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  return (monthlyPrice * 12) - yearlyPrice;
}