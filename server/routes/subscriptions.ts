/**
 * Subscription and billing API routes
 */

import { Router } from "express";
import { z } from "zod";
import { subscriptionStorage } from "../lib/subscription-storage";
import { 
  insertSubscriptionPlanSchema,
  insertClubSubscriptionSchema,
  insertFeatureAccessLogSchema,
  PLAN_FEATURES,
  MEMBER_LIMITS,
  PLAN_PRICING
} from "@shared/schemas/subscriptions";
import { isAuthenticated } from "../replitAuth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Apply authentication to all routes
router.use(isAuthenticated);

// GET /api/subscriptions/plans - Get all available subscription plans
router.get("/plans", asyncHandler(async (req: any, res: any) => {
  try {
    const plans = await subscriptionStorage.getSubscriptionPlans();
    res.json(plans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
}));

// GET /api/subscriptions/plans/comparison - Get plan comparison data
router.get("/plans/comparison", asyncHandler(async (req: any, res: any) => {
  try {
    const plans = await subscriptionStorage.getSubscriptionPlans();
    
    const comparison = plans.map(plan => ({
      ...plan,
      memberLimit: MEMBER_LIMITS[plan.planType as keyof typeof MEMBER_LIMITS],
      pricing: PLAN_PRICING[plan.planType as keyof typeof PLAN_PRICING],
      featureList: Object.entries(plan.features).map(([feature, enabled]) => ({
        name: feature,
        enabled,
        description: getFeatureDescription(feature)
      }))
    }));

    res.json(comparison);
  } catch (error) {
    console.error("Error fetching plan comparison:", error);
    res.status(500).json({ error: "Failed to fetch plan comparison" });
  }
}));

// GET /api/subscriptions/club/:clubId - Get club subscription details
router.get("/club/:clubId", asyncHandler(async (req: any, res: any) => {
  const clubId = parseInt(req.params.clubId);
  
  if (isNaN(clubId)) {
    return res.status(400).json({ error: "Invalid club ID" });
  }

  const subscriptionData = await subscriptionStorage.getClubSubscription(clubId);
  
  res.json(subscriptionData);
}));

// GET /api/subscriptions/club - Get current club subscription (from session)
router.get("/club", asyncHandler(async (req: any, res: any) => {
  const user = req.user;
  if (!user || !user.selectedClub) {
    return res.status(401).json({ error: "No club selected" });
  }

  const subscriptionData = await subscriptionStorage.getClubSubscription(user.selectedClub.id);
  
  res.json(subscriptionData);
}));

// POST /api/subscriptions/club/:clubId - Create or update club subscription
const createSubscriptionSchema = insertClubSubscriptionSchema.extend({
  planType: z.enum(['free', 'starter', 'professional', 'enterprise']),
  billingInterval: z.enum(['monthly', 'yearly']).optional().default('monthly'),
});

router.post("/club/:clubId", 
  asyncHandler(async (req: any, res: any) => {
    try {
      const clubId = parseInt(req.params.clubId);
      
      if (isNaN(clubId)) {
        return res.status(400).json({ error: "Invalid club ID" });
      }

      const { planType, billingInterval, ...subscriptionData } = req.body;

      // Get the plan by type
      const plan = await subscriptionStorage.getSubscriptionPlanByType(planType);
      if (!plan) {
        return res.status(400).json({ error: "Invalid plan type" });
      }

      // Calculate period dates
      const now = new Date();
      const currentPeriodStart = now;
      const currentPeriodEnd = new Date(now);
      
      if (billingInterval === 'yearly') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }

      // Check if club already has a subscription
      const existingSubscription = await subscriptionStorage.getClubSubscription(clubId);
      
      if (existingSubscription.subscription) {
        // Update existing subscription
        const updatedSubscription = await subscriptionStorage.updateClubSubscription(
          existingSubscription.subscription.id,
          {
            planId: plan.id,
            billingInterval,
            currentPeriodStart,
            currentPeriodEnd,
            status: 'active',
            ...subscriptionData,
          }
        );
        
        res.json(updatedSubscription);
      } else {
        // Create new subscription
        const newSubscription = await subscriptionStorage.createClubSubscription({
          clubId,
          planId: plan.id,
          billingInterval,
          currentPeriodStart,
          currentPeriodEnd,
          status: 'active',
          ...subscriptionData,
        });
        
        res.json(newSubscription);
      }
    } catch (error) {
      console.error("Error creating/updating subscription:", error);
      res.status(500).json({ error: "Failed to create/update subscription" });
    }
  }));

// PUT /api/subscriptions/club/:clubId/cancel - Cancel club subscription
const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
  cancelAt: z.string().datetime().optional(),
});

router.put("/club/:clubId/cancel",
  asyncHandler(async (req: any, res: any) => {
    try {
      const clubId = parseInt(req.params.clubId);
      
      if (isNaN(clubId)) {
        return res.status(400).json({ error: "Invalid club ID" });
      }

      const { reason, cancelAt } = req.body;

      const existingSubscription = await subscriptionStorage.getClubSubscription(clubId);
      
      if (!existingSubscription.subscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      const canceledSubscription = await subscriptionStorage.cancelClubSubscription(
        existingSubscription.subscription.id,
        reason
      );
      
      res.json(canceledSubscription);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  }));

// GET /api/subscriptions/usage/:clubId - Get usage statistics
router.get("/usage/:clubId", asyncHandler(async (req: any, res: any) => {
  const clubId = parseInt(req.params.clubId);
  
  if (isNaN(clubId)) {
    return res.status(400).json({ error: "Invalid club ID" });
  }

  const usage = await subscriptionStorage.getCurrentUsage(clubId);
  const featureStats = await subscriptionStorage.getFeatureAccessStats(clubId);
  
  res.json({
    usage,
    featureStats,
  });
}));

// POST /api/subscriptions/feature-access - Log feature access
router.post("/feature-access",
  asyncHandler(async (req: any, res: any) => {
    const user = req.user;
    if (!user || !user.selectedClub) {
      return res.status(401).json({ error: "No club selected" });
    }

    const log = await subscriptionStorage.logFeatureAccess({
      ...req.body,
      clubId: user.selectedClub.id,
      userId: user.id,
    });
    
    res.json(log);
  })
);

// PUT /api/subscriptions/usage/:clubId - Update usage metrics
const updateUsageSchema = z.object({
  memberCount: z.number().optional(),
  teamCount: z.number().optional(),
  facilityCount: z.number().optional(),
  messagesSent: z.number().optional(),
  emailsSent: z.number().optional(),
  smsSent: z.number().optional(),
  apiCalls: z.number().optional(),
  storageUsed: z.number().optional(),
});

router.put("/usage/:clubId",
  asyncHandler(async (req: any, res: any) => {
    const clubId = parseInt(req.params.clubId);
    
    if (isNaN(clubId)) {
      return res.status(400).json({ error: "Invalid club ID" });
    }

    await subscriptionStorage.updateUsageMetrics(clubId, req.body);
    
    res.json({ success: true });
  })
);

// Helper function to get feature descriptions
function getFeatureDescription(featureName: string): string {
  const descriptions: Record<string, string> = {
    basicManagement: "Grundlegende Vereinsverwaltung",
    teamManagement: "Team-Management",
    facilityBooking: "Anlagen-Buchungssystem",
    financialReports: "Finanzberichte",
    advancedReports: "Erweiterte Berichte",
    automatedEmails: "Automatisierte E-Mails",
    apiAccess: "API-Zugang",
    prioritySupport: "Priority-Support",
    whiteLabel: "White-Label-Option",
    customIntegrations: "Custom-Integrationen",
    multiAdmin: "Mehrere Administratoren",
    bulkImport: "Bulk-Import",
    exportData: "Daten-Export",
    smsNotifications: "SMS-Benachrichtigungen",
    customFields: "Benutzerdefinierte Felder",
  };
  
  return descriptions[featureName] || featureName;
}

export default router;