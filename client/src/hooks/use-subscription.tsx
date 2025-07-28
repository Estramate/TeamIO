/**
 * React hooks for subscription management
 */

import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClub } from "./use-club";
import { 
  ClubSubscriptionManager, 
  createSubscriptionManager,
  FeatureName,
  UseSubscriptionResult
} from "@shared/lib/subscription-manager";
import type { 
  ClubSubscription, 
  SubscriptionPlan, 
  SubscriptionUsage 
} from "@shared/schemas/subscriptions";

interface SubscriptionContextType extends UseSubscriptionResult {}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

// Provider component
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { selectedClub } = useClub();
  const [subscriptionManager, setSubscriptionManager] = useState<ClubSubscriptionManager | null>(null);

  // Fetch subscription data for current club
  const {
    data: subscriptionData,
    isLoading,
    error,
    refetch,
  } = useQuery<{
    subscription: ClubSubscription | null;
    plan: SubscriptionPlan | null;
    usage: SubscriptionUsage | null;
  }>({
    queryKey: ['/api/subscriptions/club', selectedClub?.id],
    enabled: !!selectedClub?.id,
    retry: false, // Don't retry on 403 errors
    throwOnError: false, // Don't throw errors for non-admin users
  });

  // Update subscription manager when data changes
  useEffect(() => {
    if (subscriptionData) {
      const manager = createSubscriptionManager(
        subscriptionData.subscription,
        subscriptionData.plan,
        subscriptionData.usage ? {
          members: subscriptionData.usage.memberCount,
          teams: subscriptionData.usage.teamCount,
          facilities: subscriptionData.usage.facilityCount,
          storage: subscriptionData.usage.storageUsed,
        } : undefined
      );
      setSubscriptionManager(manager);
    } else if (error && (error as any)?.status === 403) {
      // User doesn't have admin rights - use default free plan
      const manager = createSubscriptionManager(null, null);
      setSubscriptionManager(manager);
    } else {
      // Default to free plan if no subscription
      const manager = createSubscriptionManager(null, null);
      setSubscriptionManager(manager);
    }
  }, [subscriptionData, error]);

  const hasFeature = (feature: FeatureName): boolean => {
    return subscriptionManager?.hasFeature(feature) || false;
  };

  const canAddMembers = (currentCount: number): boolean => {
    return subscriptionManager?.canAddMembers(currentCount) || false;
  };

  const value: SubscriptionContextType = {
    subscriptionManager: subscriptionManager || createSubscriptionManager(null, null),
    hasFeature,
    canAddMembers,
    isLoading,
    error,
    refetch,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Hook to access subscription context
export function useSubscription(): UseSubscriptionResult {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Hook for feature gating
export function useFeatureGate(feature: FeatureName) {
  const { hasFeature, subscriptionManager } = useSubscription();
  const { selectedClub } = useClub();
  
  return {
    hasAccess: !selectedClub || hasFeature(feature), // Allow all features if no club selected
    planType: subscriptionManager.getCurrentPlan(),
    upgrade: () => {
      // Navigate to upgrade page
      window.location.href = '/subscription/upgrade';
    }
  };
}

// Hook for member limits
export function useMemberLimits() {
  const { subscriptionManager, canAddMembers } = useSubscription();
  
  return {
    canAddMembers,
    remainingMembers: subscriptionManager.getRemainingMembers(),
    currentPlan: subscriptionManager.getCurrentPlan(),
    memberLimit: subscriptionManager.getCurrentUsage().members,
  };
}

// Hook for billing information
export function useBilling() {
  const { subscriptionManager } = useSubscription();
  
  return {
    nextBillingDate: subscriptionManager.getNextBillingDate(),
    isTrialing: subscriptionManager.isTrialing(),
    isExpired: subscriptionManager.isExpired(),
    canUpgrade: subscriptionManager.canUpgrade(),
    canDowngrade: subscriptionManager.canDowngrade(),
    status: subscriptionManager.getSubscriptionStatus(),
  };
}

// Hook for plan comparison
export function usePlanComparison() {
  const { subscriptionManager } = useSubscription();
  
  return {
    plans: subscriptionManager.getPlanComparison(),
    currentPlan: subscriptionManager.getCurrentPlan(),
    features: subscriptionManager.getFeatureList(),
  };
}