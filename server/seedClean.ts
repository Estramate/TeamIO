import { storage } from "./storage";

// Sauberes Seeding-System - nur einmalig ausführen
export async function seedClean() {
  try {
    console.log("🧹 Starting clean seeding process...");
    
    // Find SV Oberglan club
    const clubs = await storage.getClubs();
    const svOberglan = clubs.find(club => club.name === "SV Oberglan 1975");
    
    if (!svOberglan) {
      throw new Error("SV Oberglan 1975 club not found");
    }

    console.log("✓ Club found, proceeding with clean seeding");
    
    // OEFB offizielle Teams (exakt nach der Website)
    const officialTeams = [
      { name: "Kampfmannschaft", description: "Erste Mannschaft des SV Oberglan 1975", category: "Herren", ageGroup: "Erwachsene" },
      { name: "KM 1b", description: "Reserve Mannschaft", category: "Herren", ageGroup: "Erwachsene" },
      { name: "Frauen Kleinfeld", description: "Damenmannschaft Kleinfeld", category: "Frauen", ageGroup: "Erwachsene" },
      { name: "KM-FR", description: "Damenmannschaft", category: "Frauen", ageGroup: "Erwachsene" },
      { name: "Challenge", description: "Challenge Team", category: "Herren", ageGroup: "Erwachsene" },
      { name: "U15", description: "SG SV Oberglan / SV Moosburg / ASKÖ Wölfnitz", category: "Jugend", ageGroup: "U15" },
      { name: "U13", description: "SG ASKÖ Wölfnitz / SV Oberglan / SV Moosburg", category: "Jugend", ageGroup: "U13" },
      { name: "U12A", description: "U12 A-Team", category: "Jugend", ageGroup: "U12" },
      { name: "U12B", description: "U12 B-Team", category: "Jugend", ageGroup: "U12" },
      { name: "U11", description: "U11 Team", category: "Jugend", ageGroup: "U11" },
      { name: "U10A", description: "U10 A-Team", category: "Jugend", ageGroup: "U10" },
      { name: "U10B", description: "U10 B-Team", category: "Jugend", ageGroup: "U10" },
      { name: "U9", description: "U9 Team", category: "Jugend", ageGroup: "U9" },
      { name: "U8", description: "U8 Team", category: "Jugend", ageGroup: "U8" },
      { name: "U7", description: "U7 Team", category: "Jugend", ageGroup: "U7" },
      { name: "U6", description: "U6 Team", category: "Jugend", ageGroup: "U6" }
    ];

    console.log(`📋 Processing ${officialTeams.length} official teams from OEFB...`);
    
    // Teams nur erstellen wenn sie nicht existieren
    for (const teamData of officialTeams) {
      const existingTeams = await storage.getTeams(svOberglan.id);
      const existingTeam = existingTeams.find(t => t.name === teamData.name);
      
      if (!existingTeam) {
        await storage.createTeam({
          clubId: svOberglan.id,
          name: teamData.name,
          description: teamData.description,
          category: teamData.category,
          ageGroup: teamData.ageGroup,
          homeVenue: null,
          coach: null,
          assistantCoach: null,
          founded: null,
          league: null,
          division: null
        });
        console.log(`✓ Created team: ${teamData.name}`);
      } else {
        console.log(`→ Team already exists: ${teamData.name}`);
      }
    }

    console.log("✅ Clean seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Clean seeding failed:", error);
    throw error;
  }
}

// Hauptfunktion
async function main() {
  await seedClean();
}

main().catch(console.error);