import { seedTeams } from "./seedTeams";
import { seedPlayers } from "./seedPlayers";

async function seedAll() {
  try {
    console.log("Starting complete seeding process for SV Oberglan...");
    
    // First seed teams
    console.log("Step 1: Seeding teams...");
    await seedTeams();
    
    // Then seed players
    console.log("Step 2: Seeding players...");
    await seedPlayers();
    
    console.log("✓ Complete seeding process finished successfully!");
    
  } catch (error) {
    console.error("❌ Seeding process failed:", error);
    throw error;
  }
}

seedAll().then(() => {
  console.log("All done!");
  process.exit(0);
}).catch(error => {
  console.error("Seeding failed:", error);
  process.exit(1);
});