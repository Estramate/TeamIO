/**
 * Seed script to populate subscription plans in the database
 */

import { db } from "../db";
import { subscriptionPlans } from "@shared/schemas/subscriptions";
import { PLAN_FEATURES, PLAN_PRICING } from "@shared/schemas/subscriptions";

async function seedSubscriptionPlans() {
  try {
    console.log("🌱 Seeding subscription plans...");

    // Clear existing plans
    await db.delete(subscriptionPlans);

    // Insert new plans
    const plans = [
      {
        name: "free",
        displayName: "Kostenlos",
        planType: "free" as const,
        description: "Perfekt für kleine Vereine, um ClubFlow auszuprobieren",
        monthlyPrice: "0.00",
        yearlyPrice: "0.00",
        maxMembers: 50,
        features: PLAN_FEATURES.free,
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "starter",
        displayName: "Vereins-Starter",
        planType: "starter" as const,
        description: "Ideal für wachsende Vereine mit erweiterten Funktionen",
        monthlyPrice: "19.00",
        yearlyPrice: "190.00",
        maxMembers: 150,
        features: PLAN_FEATURES.starter,
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "professional",
        displayName: "Vereins-Professional",
        planType: "professional" as const,
        description: "Vollständige Lösung für professionelle Vereinsverwaltung",
        monthlyPrice: "49.00",
        yearlyPrice: "490.00",
        maxMembers: 500,
        features: PLAN_FEATURES.professional,
        isActive: true,
        sortOrder: 3,
      },
      {
        name: "enterprise",
        displayName: "Vereins-Enterprise",
        planType: "enterprise" as const,
        description: "Maßgeschneiderte Lösung für große Vereine und Verbände",
        monthlyPrice: "99.00",
        yearlyPrice: "990.00",
        maxMembers: null, // unlimited
        features: PLAN_FEATURES.enterprise,
        isActive: true,
        sortOrder: 4,
      },
    ];

    const insertedPlans = await db.insert(subscriptionPlans).values(plans).returning();

    console.log(`✅ Successfully seeded ${insertedPlans.length} subscription plans:`);
    insertedPlans.forEach(plan => {
      console.log(`   - ${plan.displayName} (${plan.planType}): €${plan.monthlyPrice}/Monat`);
    });

    return insertedPlans;
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSubscriptionPlans()
    .then(() => {
      console.log("🎉 Subscription plans seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export { seedSubscriptionPlans };