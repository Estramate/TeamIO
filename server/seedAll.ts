import { seedTestData } from "./seedTestData";

async function seedAll() {
  try {
    console.log("🚀 Starting test data seeding process...");
    
    // Seed with generic test data
    console.log("Seeding with test club and sample data...");
    await seedTestData();
    
    console.log("✅ Test data seeding process finished successfully!");
    
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