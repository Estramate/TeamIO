import { db } from "./db";
import { clubs, members, teams, facilities, events, finances, players, playerTeamAssignments, teamMemberships } from "@shared/schema";

export async function seedOberglan() {
  console.log("🌱 Seeding SV Oberglan 1975 data...");

  try {
    // Create SV Oberglan club
    const [club] = await db.insert(clubs).values({
      name: "SV Oberglan 1975",
      description: "Sportverein Oberglan 1975 - Traditionsverein im Herzen von Oberösterreich",
      address: "Sportplatz 1, 4040 Oberglan",
      phone: "+43 732 123456",
      email: "info@sv-oberglan.at",
      website: "https://www.sv-oberglan.at",
      foundedYear: 1975,
      primaryColor: "#1e40af",
      secondaryColor: "#ffffff",
      logoUrl: "/logo-sv-oberglan.png"
    }).returning();

    console.log(`✅ Created club: ${club.name}`);

    // Create main teams
    const teamsData = [
      {
        clubId: club.id,
        name: "Kampfmannschaft Herren",
        category: "senior",
        gender: "male",
        description: "Erste Mannschaft der Herren",
        maxMembers: 25,
        season: "2024/25"
      },
      {
        clubId: club.id,
        name: "KM-FR Damen",
        category: "senior", 
        gender: "female",
        description: "Kampfmannschaft Frauen",
        maxMembers: 22,
        season: "2024/25"
      },
      {
        clubId: club.id,
        name: "Reserve Herren",
        category: "reserve",
        gender: "male", 
        description: "Reserve Mannschaft der Herren",
        maxMembers: 20,
        season: "2024/25"
      },
      {
        clubId: club.id,
        name: "Jugend U17",
        category: "youth",
        ageGroup: "U17",
        gender: "male",
        description: "Nachwuchsmannschaft U17",
        maxMembers: 18,
        season: "2024/25"
      }
    ];

    const insertedTeams = await db.insert(teams).values(teamsData).returning();
    console.log(`✅ Created ${insertedTeams.length} teams`);

    // Create facilities
    const facilitiesData = [
      {
        clubId: club.id,
        name: "Hauptplatz",
        type: "field",
        description: "Hauptspielfeld mit Naturrasen",
        capacity: 500,
        location: "Sportanlage Oberglan",
        maxConcurrentBookings: 1
      },
      {
        clubId: club.id,
        name: "Trainingsplatz",
        type: "field", 
        description: "Nebenplatz für Training",
        capacity: 100,
        location: "Sportanlage Oberglan",
        maxConcurrentBookings: 2
      },
      {
        clubId: club.id,
        name: "Vereinsheim",
        type: "building",
        description: "Vereinslokal mit Küche und Bar",
        capacity: 80,
        location: "Sportanlage Oberglan",
        maxConcurrentBookings: 1
      }
    ];

    await db.insert(facilities).values(facilitiesData);
    console.log(`✅ Created ${facilitiesData.length} facilities`);

    console.log("✅ SV Oberglan 1975 base data seeding completed!");
    return club;
    
  } catch (error) {
    console.error("❌ SV Oberglan seeding failed:", error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedOberglan().then(() => {
    console.log("🎉 SV Oberglan seeding finished!");
    process.exit(0);
  }).catch(error => {
    console.error("❌ SV Oberglan seeding failed:", error);
    process.exit(1);
  });
}