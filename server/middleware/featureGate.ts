/**
 * Backend feature gating middleware for subscription-based access control
 */

import { subscriptionStorage } from "../lib/subscription-storage";
import type { FeatureName } from "@shared/lib/subscription-manager";

export function requiresFeature(feature: FeatureName) {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const clubId = parseInt(req.params.clubId || req.params.id);
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      if (!clubId || isNaN(clubId)) {
        return res.status(400).json({ error: "Valid club ID required" });
      }
      
      // Get club subscription data
      const subscriptionData = await subscriptionStorage.getClubSubscription(clubId);
      
      if (!subscriptionData?.plan) {
        // Default to free plan if no subscription found
        const hasFeatureAccess = checkFeatureAccess(feature, 'free');
        if (!hasFeatureAccess) {
          return res.status(403).json({ 
            error: "Feature not available in free plan",
            feature,
            requiredPlan: getRequiredPlan(feature),
            upgradeUrl: `/subscription`
          });
        }
      } else {
        // Check if current plan has access to the feature
        const planType = subscriptionData.plan.planType;
        const hasFeatureAccess = checkFeatureAccess(feature, planType);
        
        if (!hasFeatureAccess) {
          return res.status(403).json({ 
            error: `Feature '${feature}' not available in ${planType} plan`,
            feature,
            currentPlan: planType,
            requiredPlan: getRequiredPlan(feature),
            upgradeUrl: `/subscription`
          });
        }
      }
      
      // Verify user has access to the club
      const storage = (await import("../storage")).default;
      const membership = await storage.getUserClubMembership(userId, clubId);
      
      if (!membership || membership.status !== 'active') {
        return res.status(403).json({ error: "You must be an active member of this club" });
      }
      
      next();
    } catch (error) {
      console.error('Feature gate middleware error:', error);
      return res.status(500).json({ error: "Failed to verify feature access" });
    }
  };
}

function checkFeatureAccess(feature: FeatureName, planType: string): boolean {
  const planFeatures: Record<string, FeatureName[]> = {
    free: ['basicManagement'],
    starter: ['basicManagement', 'teamManagement', 'facilityBooking', 'multiAdmin', 'bulkImport', 'exportData', 'customFields'],
    professional: ['basicManagement', 'teamManagement', 'facilityBooking', 'financialReports', 'advancedReports', 'automatedEmails', 'multiAdmin', 'bulkImport', 'exportData', 'customFields', 'smsNotifications'],
    enterprise: ['basicManagement', 'teamManagement', 'facilityBooking', 'financialReports', 'advancedReports', 'automatedEmails', 'apiAccess', 'prioritySupport', 'whiteLabel', 'customIntegrations', 'multiAdmin', 'bulkImport', 'exportData', 'customFields', 'smsNotifications']
  };
  
  const availableFeatures = planFeatures[planType] || planFeatures.free;
  return availableFeatures.includes(feature);
}

function getRequiredPlan(feature: FeatureName): string {
  const featureRequirements: Record<FeatureName, string> = {
    basicManagement: 'free',
    teamManagement: 'starter',
    facilityBooking: 'starter', 
    financialReports: 'professional',
    advancedReports: 'professional',
    automatedEmails: 'professional',
    apiAccess: 'enterprise',
    prioritySupport: 'enterprise',
    whiteLabel: 'enterprise',
    customIntegrations: 'enterprise',
    multiAdmin: 'starter',
    bulkImport: 'starter',
    exportData: 'starter',
    customFields: 'starter',
    smsNotifications: 'professional'
  };
  
  return featureRequirements[feature] || 'professional';
}