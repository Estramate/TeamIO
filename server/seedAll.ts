import { seedClean } from "./seedClean";
import { seedPlayers } from "./seedPlayers";
import { seedAllTeamsPlayers } from "./seedAllTeams";

async function seedAll() {
  try {
    console.log("🚀 Starting complete seeding process for SV Oberglan...");
    
    // Clean team seeding (avoid duplicates)
    console.log("Step 1: Clean team seeding...");
    await seedClean();
    
    // Seed KM players
    console.log("Step 2: Seeding KM players...");
    await seedPlayers();
    
    // Seed additional team players
    console.log("Step 3: Seeding additional team players...");
    await seedAllTeamsPlayers();
    
    console.log("✅ Complete seeding process finished successfully!");
    
  } catch (error) {
    console.error("❌ Seeding process failed:", error);
    throw error;
  }
}

seedAll().then(() => {
  console.log("🎉 All done!");
  process.exit(0);
}).catch(error => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});