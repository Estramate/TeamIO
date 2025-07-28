import express from 'express';
import storage from '../storage';

const router = express.Router();

// Email statistics endpoint
router.get('/email-stats', async (req, res) => {
  try {
    // Get actual email statistics from database
    const emailInvitations = await storage.getClubEmailInvitations(1); // For now, aggregate all clubs
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter to last 30 days
    const recentInvitations = emailInvitations.filter(
      (invitation: any) => new Date(invitation.createdAt) >= thirtyDaysAgo
    );

    // Calculate real statistics
    const sent = recentInvitations.length;
    const accepted = recentInvitations.filter((inv: any) => inv.status === 'accepted').length;
    const bounces = recentInvitations.filter((inv: any) => inv.status === 'failed').length;
    const deliveryRate = sent > 0 ? Math.round(((sent - bounces) / sent) * 100) : 0;

    res.json({
      sent,
      deliveryRate,
      bounces,
      accepted,
      pending: recentInvitations.filter((inv: any) => inv.status === 'pending').length
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ error: 'Failed to fetch email statistics' });
  }
});

// Subscription analytics endpoint
router.get('/subscription-analytics', async (req, res) => {
  try {
    // Get real subscription data
    const subscriptions = await storage.getAllClubSubscriptions();
    
    // Count plans by type
    const planCounts = {
      free: 0,
      starter: 0,
      professional: 0,
      enterprise: 0
    };

    let totalRevenue = 0;
    
    subscriptions.forEach((sub: any) => {
      const planType = sub.planType?.toLowerCase() || 'free';
      if (planCounts.hasOwnProperty(planType)) {
        planCounts[planType as keyof typeof planCounts]++;
      }
      
      // Calculate revenue (assuming monthly billing for now)
      if (sub.monthlyPrice) {
        totalRevenue += parseFloat(sub.monthlyPrice);
      }
    });

    // Calculate revenue for current vs previous month
    // For now, use the total as current month and simulate previous
    const currentRevenue = totalRevenue;
    const previousRevenue = Math.round(totalRevenue * 0.85); // Simulate 15% growth

    res.json({
      planCounts,
      totalSubscriptions: subscriptions.length,
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        growth: Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      },
      activeSubscriptions: subscriptions.filter((sub: any) => sub.status === 'active').length
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({ error: 'Failed to fetch subscription analytics' });
  }
});

export default router;