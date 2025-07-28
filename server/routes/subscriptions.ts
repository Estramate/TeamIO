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
import { sendPlanChangeNotification, sendPlanChangeConfirmation } from "../lib/plan-change-notifications";
import { requiresSuperAdmin, hasSuperAdminAccess } from "../lib/super-admin";

const router = Router();

// Club admin middleware - CLUB-SPECIFIC: Only allows access to own club's subscription
const requiresClubAdmin = async (req: any, res: any, next: any) => {
  const clubId = parseInt(req.params.clubId);
  const userId = req.user.claims?.sub || req.user.id;
  
  if (!clubId || !userId) {
    return res.status(400).json({ error: "Missing club ID or user ID" });
  }
  
  try {
    const { storage } = await import("../storage");
    
    // Check if user is admin of THIS SPECIFIC CLUB
    const adminMembership = await storage.getUserClubMembership(userId, clubId);
    if (!adminMembership || adminMembership.role !== 'club-administrator') {
      return res.status(403).json({ error: 'You must be a club administrator to access subscription management' });
    }
    
    console.log(`✅ Club admin access granted for user ${userId} to club ${clubId}`);
    next();
  } catch (error) {
    console.error("Error checking admin permissions:", error);
    return res.status(500).json({ error: "Failed to verify permissions" });
  }
};

// Apply authentication to all routes except specific ones
router.use((req, res, next) => {
  // Skip authentication for public routes
  if (req.method === 'GET' && (
    req.path === '/plans' || 
    req.path === '/plans/comparison' ||
    req.path === '/super-admin/status'
  )) {
    return next();
  }
  return isAuthenticated(req, res, next);
});

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

// GET /api/subscriptions/club/:clubId - Get club subscription details (admin only)
router.get("/club/:clubId", requiresClubAdmin, asyncHandler(async (req: any, res: any) => {
  try {
    const clubId = parseInt(req.params.clubId);
    
    if (isNaN(clubId)) {
      return res.status(400).json({ error: "Invalid club ID" });
    }

    console.log(`Fetching subscription for club ${clubId}`);
    const subscriptionData = await subscriptionStorage.getClubSubscription(clubId);
    console.log('Subscription data:', subscriptionData);
    
    res.json(subscriptionData);
  } catch (error) {
    console.error('Error in /api/subscriptions/club/:clubId:', error);
    res.status(500).json({ 
      error: "Failed to fetch club subscription", 
      details: error.message 
    });
  }
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
  requiresClubAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const clubId = parseInt(req.params.clubId);
      
      if (isNaN(clubId)) {
        return res.status(400).json({ error: "Invalid club ID" });
      }

      const { planType, billingInterval, ...subscriptionData } = req.body;
      const user = req.user;

      // Get current subscription for comparison
      const currentSubscription = await subscriptionStorage.getClubSubscription(clubId);
      const oldPlan = currentSubscription?.subscription?.planType || 'free';

      // Get the plan by type
      const plan = await subscriptionStorage.getSubscriptionPlanByType(planType);
      if (!plan) {
        return res.status(400).json({ error: "Invalid plan type" });
      }

      // For plan downgrades or critical changes, require super admin approval
      const planHierarchy = { free: 0, starter: 1, professional: 2, enterprise: 3 };
      const isDowngrade = planHierarchy[oldPlan as keyof typeof planHierarchy] > planHierarchy[planType as keyof typeof planHierarchy];
      const isEnterpriseChange = oldPlan === 'enterprise' || planType === 'enterprise';
      
      if ((isDowngrade || isEnterpriseChange) && !hasSuperAdminAccess(user)) {
        return res.status(403).json({ 
          error: "Super administrator approval required",
          message: "Plan downgrades and Enterprise plan changes require super administrator approval. Please contact support.",
          requiresSuperAdmin: true
        });
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

        // Send notifications if plan changed
        if (oldPlan !== planType) {
          const { getStorage } = await import("../storage");
          const storage = getStorage();
          const club = await storage.getClub(clubId);
          const userInfo = await storage.getUser(user.claims?.sub);

          await sendPlanChangeNotification({
            clubName: club?.name || `Club ${clubId}`,
            clubId,
            userEmail: userInfo?.email || user.email || 'unknown@example.com',
            userName: userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : 'Unknown User',
            oldPlan,
            newPlan: planType,
            billingInterval: billingInterval || 'monthly',
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });

          await sendPlanChangeConfirmation({
            clubName: club?.name || `Club ${clubId}`,
            clubId,
            userEmail: userInfo?.email || user.email || 'unknown@example.com',
            userName: userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : 'Unknown User',
            oldPlan,
            newPlan: planType,
            billingInterval: billingInterval || 'monthly',
            timestamp: new Date()
          });
        }
        
        res.json({
          ...updatedSubscription,
          notifications: {
            adminNotified: oldPlan !== planType,
            userNotified: oldPlan !== planType
          }
        });
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

        // Send notifications for new subscription
        if (oldPlan !== planType) {
          const { getStorage } = await import("../storage");
          const storage = getStorage();
          const club = await storage.getClub(clubId);
          const userInfo = await storage.getUser(user.claims?.sub);

          await sendPlanChangeNotification({
            clubName: club?.name || `Club ${clubId}`,
            clubId,
            userEmail: userInfo?.email || user.email || 'unknown@example.com',
            userName: userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : 'Unknown User',
            oldPlan,
            newPlan: planType,
            billingInterval: billingInterval || 'monthly',
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });

          await sendPlanChangeConfirmation({
            clubName: club?.name || `Club ${clubId}`,
            clubId,
            userEmail: userInfo?.email || user.email || 'unknown@example.com',
            userName: userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : 'Unknown User',
            oldPlan,
            newPlan: planType,
            billingInterval: billingInterval || 'monthly',
            timestamp: new Date()
          });
        }
        
        res.json({
          ...newSubscription,
          notifications: {
            adminNotified: oldPlan !== planType,
            userNotified: oldPlan !== planType
          }
        });
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

// Super Admin Status route moved to main routes.ts to avoid auth middleware

// PUT /api/subscriptions/super-admin/force-plan/:clubId - Force plan change (super admin only)
router.put("/super-admin/force-plan/:clubId",
  requiresSuperAdmin,
  asyncHandler(async (req: any, res: any) => {
    try {
      const clubId = parseInt(req.params.clubId);
      const { planType, billingInterval, reason } = req.body;
      
      if (isNaN(clubId)) {
        return res.status(400).json({ error: "Invalid club ID" });
      }

      // Get current subscription for comparison
      const currentSubscription = await subscriptionStorage.getClubSubscription(clubId);
      const oldPlan = currentSubscription?.subscription?.planType || 'free';

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

      let result;
      if (currentSubscription.subscription) {
        // Update existing subscription
        result = await subscriptionStorage.updateClubSubscription(
          currentSubscription.subscription.id,
          {
            planId: plan.id,
            billingInterval: billingInterval || 'monthly',
            currentPeriodStart,
            currentPeriodEnd,
            status: 'active',
          }
        );
      } else {
        // Create new subscription
        result = await subscriptionStorage.createClubSubscription({
          clubId,
          planId: plan.id,
          billingInterval: billingInterval || 'monthly',
          currentPeriodStart,
          currentPeriodEnd,
          status: 'active',
        });
      }

      // Log the super admin action
      const { getStorage } = await import("../storage");
      const storage = getStorage();
      const club = await storage.getClub(clubId);
      
      console.log(`SUPER ADMIN ACTION: Plan force-changed by ${req.user.email} for club ${club?.name} (${oldPlan} → ${planType}). Reason: ${reason || 'No reason provided'}`);

      res.json({
        success: true,
        subscription: result,
        plan: plan,
        action: 'super-admin-force-change',
        oldPlan,
        newPlan: planType,
        reason: reason || 'No reason provided'
      });
    } catch (error) {
      console.error("Error force-changing plan:", error);
      res.status(500).json({ error: "Failed to force-change plan" });
    }
  }));

export default router;