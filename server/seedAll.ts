import { seedTeams } from "./seedTeams";
import { seedPlayers } from "./seedPlayers";
import { seedAllTeamsPlayers } from "./seedAllTeams";

async function seedAll() {
  try {
    console.log("Starting complete seeding process for SV Oberglan...");
    
    // First seed teams
    console.log("Step 1: Seeding teams...");
    await seedTeams();
    
    // Then seed KM players
    console.log("Step 2: Seeding KM players...");
    await seedPlayers();
    
    // Finally seed all other teams players
    console.log("Step 3: Seeding additional teams players...");
    await seedAllTeamsPlayers();
    
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