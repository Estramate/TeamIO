import { storage } from "./storage";

// Real SV Oberglan teams from OEFB website  
const svOberglanTeams = [
  {
    name: "Kampfmannschaft",
    category: "Herren",
    ageGroup: "Erwachsene",
    description: "Erste Mannschaft des SV Oberglan 1975",
    shortName: "KM"
  },
  {
    name: "KM 1b", 
    category: "Herren",
    ageGroup: "Erwachsene",
    description: "Reserve Mannschaft",
    shortName: "KM 1b"
  },
  {
    name: "Challenge",
    category: "Herren", 
    ageGroup: "Erwachsene",
    description: "Challenge Team",
    shortName: "Res"
  },
  {
    name: "U15",
    category: "Jugend",
    ageGroup: "U15",
    description: "SG SV Oberglan / SV Moosburg / ASKÖ Wölfnitz",
    shortName: "U15"
  },
  {
    name: "U13",
    category: "Jugend",
    ageGroup: "U13", 
    description: "SG ASKÖ Wölfnitz / SV Oberglan / SV Moosburg",
    shortName: "U13"
  },
  {
    name: "U12A",
    category: "Jugend",
    ageGroup: "U12",
    description: "U12 A-Team",
    shortName: "U12A"
  },
  {
    name: "U12B",
    category: "Jugend",
    ageGroup: "U12",
    description: "U12 B-Team", 
    shortName: "U12B"
  },
  {
    name: "U11",
    category: "Jugend",
    ageGroup: "U11",
    description: "U11 Team",
    shortName: "U11"
  },
  {
    name: "U10A", 
    category: "Jugend",
    ageGroup: "U10",
    description: "U10 A-Team",
    shortName: "U10A"
  },
  {
    name: "U10B",
    category: "Jugend", 
    ageGroup: "U10",
    description: "U10 B-Team",
    shortName: "U10B"
  },
  {
    name: "U9",
    category: "Jugend",
    ageGroup: "U9",
    description: "U9 Team",
    shortName: "U9"
  },
  {
    name: "U8",
    category: "Jugend",
    ageGroup: "U8", 
    description: "U8 Team",
    shortName: "U8"
  },
  {
    name: "U7",
    category: "Jugend",
    ageGroup: "U7",
    description: "U7 Team",
    shortName: "U7"
  },
  {
    name: "U6",
    category: "Jugend", 
    ageGroup: "U6",
    description: "U6 Team",
    shortName: "U6"
  },
  {
    name: "Frauen Kleinfeld",
    category: "Frauen",
    ageGroup: "Erwachsene",
    description: "Damenmannschaft Kleinfeld",
    shortName: "KM-FR"
  },
  {
    name: "KM-FR",
    category: "Frauen",
    ageGroup: "Erwachsene", 
    description: "Damenmannschaft",
    shortName: "KM-FR-1"
  }
];

export async function seedTeams() {
  try {
    console.log("Seeding teams for SV Oberglan...");
    
    // Find SV Oberglan club
    const clubs = await storage.getClubs();
    const svOberglan = clubs.find(club => club.name === "SV Oberglan 1975");
    
    if (!svOberglan) {
      throw new Error("SV Oberglan 1975 club not found");
    }

    // Clear existing teams - skip deletion to avoid FK constraints
    console.log("Skipping team deletion to preserve existing data integrity");

    // Create teams
    const createdTeams = [];
    for (const teamData of svOberglanTeams) {
      const team = await storage.createTeam({
        clubId: svOberglan.id,
        name: teamData.name,
        category: teamData.category,
        ageGroup: teamData.ageGroup,
        description: teamData.description,
        season: "2024/25",
        status: "active"
      });
      createdTeams.push({ ...team, shortName: teamData.shortName });
      console.log(`Created team: ${team.name}`);
    }

    console.log(`Successfully seeded ${createdTeams.length} teams for SV Oberglan`);
    return createdTeams;
    
  } catch (error) {
    console.error("Error seeding teams:", error);
    throw error;
  }
}

// Run if called directly (removed require check for ES modules)