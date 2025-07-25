import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { teams, players, playerTeamAssignments, clubs } from "../shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Team structure data from OEFB website
const teamsData = [
  {
    name: "KM",
    category: "senior",
    ageGroup: "senior",
    gender: "male",
    description: "Kampfmannschaft",
    season: "2025/26"
  },
  {
    name: "KM 1b", 
    category: "senior",
    ageGroup: "senior",
    gender: "male",
    description: "Kampfmannschaft 1b",
    season: "2025/26"
  },
  {
    name: "Frauen Kleinfeld",
    category: "senior", 
    ageGroup: "senior",
    gender: "female",
    description: "Kampfmannschaft Fr. - Kleinfeld",
    season: "2025/26"
  },
  {
    name: "KM-FR",
    category: "senior",
    ageGroup: "senior", 
    gender: "female",
    description: "Kampfmannschaft Fr.",
    season: "2025/26"
  },
  // Youth teams without players (but still create the teams for completeness)
  {
    name: "U15",
    category: "youth",
    ageGroup: "U15",
    gender: "mixed",
    description: "SG SV Oberglan / SV Moosburg / ASKÖ Wölfnitz",
    season: "2025/26"
  },
  {
    name: "U13",
    category: "youth",
    ageGroup: "U13", 
    gender: "mixed",
    description: "SG ASKÖ Wölfnitz / SV Oberglan / SV Moosburg",
    season: "2025/26"
  },
  {
    name: "U12A",
    category: "youth",
    ageGroup: "U12",
    gender: "mixed", 
    description: "SG SV Moosburg / SV Oberglan A",
    season: "2025/26"
  },
  {
    name: "U12B",
    category: "youth",
    ageGroup: "U12",
    gender: "mixed",
    description: "SG SV Moosburg / SV Oberglan B", 
    season: "2025/26"
  },
  {
    name: "U11",
    category: "youth",
    ageGroup: "U11",
    gender: "mixed",
    description: "SG SV Oberglan / SV Moosburg",
    season: "2025/26"
  },
  {
    name: "U10A",
    category: "youth",
    ageGroup: "U10",
    gender: "mixed",
    description: "SG SV Oberglan / SV Moosburg A",
    season: "2025/26"
  },
  {
    name: "U10B",
    category: "youth",
    ageGroup: "U10", 
    gender: "mixed",
    description: "SG SV Oberglan / SV Moosburg B",
    season: "2025/26"
  },
  {
    name: "U9",
    category: "youth",
    ageGroup: "U09",
    gender: "mixed",
    description: "SV Moosburg / SV Oberglan",
    season: "2025/26"
  },
  {
    name: "U8", 
    category: "youth",
    ageGroup: "U08",
    gender: "mixed",
    description: "SG SV Moosburg / SV Oberglan",
    season: "2025/26"
  },
  {
    name: "U7",
    category: "youth",
    ageGroup: "U07",
    gender: "mixed",
    description: "SG SV Oberglan / SV Moosburg",
    season: "2025/26"
  },
  {
    name: "U6",
    category: "youth",
    ageGroup: "U06", 
    gender: "mixed",
    description: "SG SV Oberglan / SV Moosburg",
    season: "2025/26"
  }
];

// Players data extracted from OEFB pages
const kmPlayers = [
  { name: "Martin Napetschnig", jerseyNumber: 31, position: "Tor" },
  { name: "Anel Sandal", jerseyNumber: 1, position: "Tor" },
  { name: "Thomas Krainer", jerseyNumber: 17, position: "Verteidigung" },
  { name: "Elias Mainhard", jerseyNumber: 3, position: "Verteidigung" },
  { name: "Thomas Christian Tatschl", jerseyNumber: 13, position: "Verteidigung" },
  { name: "Denis Tomic", jerseyNumber: 4, position: "Verteidigung" },
  { name: "Dominik Wurmdobler", jerseyNumber: 16, position: "Verteidigung" },
  { name: "Sandro Jose Ferreira Da Silva", jerseyNumber: 9, position: "Mittelfeld" },
  { name: "Konstantin Anton Gruber", jerseyNumber: 12, position: "Mittelfeld" },
  { name: "Sergej Lazic", jerseyNumber: 25, position: "Mittelfeld" },
  { name: "Hannes Alois Petutschnig", jerseyNumber: 15, position: "Mittelfeld" },
  { name: "Niklas Julian Rainer", jerseyNumber: 11, position: "Mittelfeld" },
  { name: "David Tamegger", jerseyNumber: 7, position: "Mittelfeld" },
  { name: "Betim Tifek", jerseyNumber: 18, position: "Mittelfeld" },
  { name: "Daniel Wernig", jerseyNumber: 99, position: "Mittelfeld" },
  { name: "Nikolaus Johannes Ziehaus", jerseyNumber: 29, position: "Mittelfeld" },
  { name: "Martin Hinteregger", jerseyNumber: 6, position: "Sturm" },
  { name: "Andreas Katic", jerseyNumber: 23, position: "Sturm" },
  { name: "Maximilian Gert Rupitsch", jerseyNumber: 19, position: "Sturm" },
  { name: "Andre Albert Zitterer", jerseyNumber: 22, position: "Sturm" },
  { name: "Maximilian Erwin Michael Bürger", jerseyNumber: null, position: null },
  { name: "Thomas Dietrichsteiner", jerseyNumber: 5, position: null },
  { name: "Christoph Freithofnig", jerseyNumber: 10, position: null },
  { name: "Gerald Kohlweg", jerseyNumber: null, position: null },
  { name: "Eric Mainhard", jerseyNumber: null, position: null },
  { name: "Marco Messner", jerseyNumber: null, position: null },
  { name: "Marcel Ogertschnig", jerseyNumber: null, position: null },
  { name: "Noah Rabensteiner", jerseyNumber: 17, position: null },
  { name: "Julian Karl Reichenhauser", jerseyNumber: null, position: null },
  { name: "Manuel Josef Vaschauner", jerseyNumber: 19, position: null },
  { name: "Christopher Wadl", jerseyNumber: null, position: null },
  { name: "Florian Alexander Zitterer", jerseyNumber: null, position: null }
];

const km1bPlayers = [
  { name: "Marcel Ogertschnig", jerseyNumber: null, position: "Tor" },
  { name: "Tristan Reichel", jerseyNumber: null, position: "Tor" },
  { name: "Paul Ankner", jerseyNumber: 1, position: null },
  { name: "Florian Bidovec", jerseyNumber: 15, position: null },
  { name: "Christopher Buttazoni", jerseyNumber: null, position: null },
  { name: "Maximilian Erwin Michael Bürger", jerseyNumber: null, position: null },
  { name: "Kilian Peter Alexander De Vries", jerseyNumber: null, position: null },
  { name: "Thomas Dietrichsteiner", jerseyNumber: null, position: null },
  { name: "Manolo Mario Drussnitzer", jerseyNumber: null, position: null },
  { name: "Adam El Nemer", jerseyNumber: null, position: null },
  { name: "Anton Lorenz Erlacher", jerseyNumber: null, position: null },
  { name: "Konstantin Anton Gruber", jerseyNumber: null, position: null },
  { name: "Elias Rene Peter Hausharter", jerseyNumber: 22, position: null },
  { name: "Cedric Diego Hinteregger", jerseyNumber: null, position: null },
  { name: "Georg Hruschka", jerseyNumber: 7, position: null },
  { name: "Jan Jackisch", jerseyNumber: null, position: null },
  { name: "Julian Markus Jäger", jerseyNumber: null, position: null },
  { name: "Andreas Katic", jerseyNumber: null, position: null },
  { name: "Marcel Andre Kattnig", jerseyNumber: null, position: null },
  { name: "Ben Kogler", jerseyNumber: null, position: null },
  { name: "Michael Kogler", jerseyNumber: null, position: null },
  { name: "Krisztián Kovács", jerseyNumber: null, position: null },
  { name: "Jonas Kraiger", jerseyNumber: null, position: null },
  { name: "Simon Kraiger", jerseyNumber: null, position: null },
  { name: "Nikolaos Legat", jerseyNumber: null, position: null },
  { name: "Elias Mainhard", jerseyNumber: 11, position: null },
  { name: "Thomas Matheuschitz", jerseyNumber: null, position: null },
  { name: "Emanuel Dargo Milic", jerseyNumber: null, position: null },
  { name: "Bastian Timo Mitterböck", jerseyNumber: null, position: null },
  { name: "Herbert Mühlbacher", jerseyNumber: null, position: null },
  { name: "Sandro Michael Perisutti", jerseyNumber: null, position: null },
  { name: "Nico Mario Proprentner", jerseyNumber: null, position: null },
  { name: "Noah Rabensteiner", jerseyNumber: null, position: null },
  { name: "Rainer Schmid", jerseyNumber: null, position: null }
];

const frauenKleinfeldPlayers = [
  { name: "Raphaela Anke Cramaro", jerseyNumber: null, position: null },
  { name: "Elizabet Gjoni", jerseyNumber: null, position: null },
  { name: "Isil Kandemir", jerseyNumber: null, position: null },
  { name: "Lorina Elena Klammer", jerseyNumber: null, position: null },
  { name: "Lea Konrad", jerseyNumber: null, position: null },
  { name: "Lana Lucic", jerseyNumber: null, position: null },
  { name: "Nazanin Majidi", jerseyNumber: null, position: null },
  { name: "Lina Oberhauser", jerseyNumber: null, position: null },
  { name: "Lara Emma Oschgan", jerseyNumber: null, position: null },
  { name: "Berfu Rüveyda Pekel", jerseyNumber: null, position: null },
  { name: "Tamari Pinter", jerseyNumber: null, position: null },
  { name: "Amelie Schernthaner", jerseyNumber: null, position: null },
  { name: "Zehra Signak", jerseyNumber: null, position: null },
  { name: "Miriam Steiner", jerseyNumber: null, position: null }
];

const kmfrPlayers = [
  { name: "Maya Ndidi Bader", jerseyNumber: 27, position: "Verteidigung" },
  { name: "Lea Biedermann", jerseyNumber: 3, position: null },
  { name: "Hannah Dualde Feichter", jerseyNumber: 55, position: null },
  { name: "Lena Dualde Feichter", jerseyNumber: 16, position: null },
  { name: "Jennifer Eberhard", jerseyNumber: 6, position: null },
  { name: "Nina Felsberger", jerseyNumber: 4, position: null },
  { name: "Nicole Dominique Gatternig", jerseyNumber: 7, position: null },
  { name: "Sabine Haas", jerseyNumber: 15, position: null },
  { name: "Nadja Hehle", jerseyNumber: 31, position: null },
  { name: "Stefanie Huber", jerseyNumber: 19, position: null },
  { name: "Larissa Lea Kassin", jerseyNumber: 9, position: null },
  { name: "Hanna Marie Kofler", jerseyNumber: 23, position: null },
  { name: "Leonie Kummer", jerseyNumber: null, position: null },
  { name: "Nataly Joy Mayer", jerseyNumber: 77, position: null },
  { name: "Nina Mele", jerseyNumber: null, position: null },
  { name: "Loren Mikitsch", jerseyNumber: 18, position: null },
  { name: "Anna Lea Modre", jerseyNumber: 12, position: null },
  { name: "Lisa Mramor", jerseyNumber: 13, position: null },
  { name: "Emily Nigerl", jerseyNumber: 20, position: null },
  { name: "Yvonne Poderschnig", jerseyNumber: 24, position: null },
  { name: "Kimberly Prutej", jerseyNumber: 1, position: null },
  { name: "Tatjana Sabitzer", jerseyNumber: 10, position: null },
  { name: "Michelle Schmautz", jerseyNumber: 26, position: null },
  { name: "Lisa Striessnig", jerseyNumber: 22, position: null },
  { name: "Marie Christin Sulle", jerseyNumber: 21, position: null },
  { name: "Laura Tschernoschek", jerseyNumber: 17, position: null },
  { name: "Kerstin Valenta", jerseyNumber: null, position: null },
  { name: "Sophie Verbnjak", jerseyNumber: 14, position: null }
];

async function importTeamsAndPlayers() {
  console.log("🏆 Starting SV Oberglan 1975 Teams and Players Import...");
  
  try {
    // Get SV Oberglan 1975 club
    const club = await db.select().from(clubs).where(eq(clubs.name, "SV Oberglan 1975")).limit(1);
    if (club.length === 0) {
      throw new Error("SV Oberglan 1975 club not found. Please create the club first.");
    }
    const clubId = club[0].id;
    console.log(`✅ Found club: ${club[0].name} (ID: ${clubId})`);

    // Create teams
    console.log("\n📋 Creating teams...");
    const createdTeams: { [key: string]: number } = {};
    
    for (const teamData of teamsData) {
      console.log(`Creating team: ${teamData.name}`);
      
      // Check if team exists
      const existingTeam = await db.select().from(teams)
        .where(eq(teams.name, teamData.name))
        .limit(1);
      
      if (existingTeam.length > 0) {
        console.log(`⚠️ Team ${teamData.name} already exists, skipping...`);
        createdTeams[teamData.name] = existingTeam[0].id;
        continue;
      }
      
      const [newTeam] = await db.insert(teams).values({
        clubId,
        name: teamData.name,
        category: teamData.category,
        ageGroup: teamData.ageGroup,
        gender: teamData.gender,
        description: teamData.description,
        season: teamData.season,
        status: "active"
      }).returning();
      
      createdTeams[teamData.name] = newTeam.id;
      console.log(`✅ Created team: ${teamData.name} (ID: ${newTeam.id})`);
    }

    // Helper function to create players and assignments
    const createPlayersForTeam = async (teamName: string, playersData: any[]) => {
      console.log(`\n⚽ Creating players for ${teamName}...`);
      const teamId = createdTeams[teamName];
      
      for (const playerData of playersData) {
        const nameParts = playerData.name.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ");
        
        // Check if player already exists (to handle duplicates across teams)
        const existingPlayer = await db.select().from(players)
          .where(eq(players.firstName, firstName))
          .limit(1);
        
        let playerId: number;
        
        if (existingPlayer.length > 0 && existingPlayer[0].lastName === lastName) {
          // Player exists, use existing player
          playerId = existingPlayer[0].id;
          console.log(`🔄 Using existing player: ${firstName} ${lastName} (ID: ${playerId})`);
        } else {
          // Create new player
          const [newPlayer] = await db.insert(players).values({
            clubId,
            firstName,
            lastName,
            jerseyNumber: playerData.jerseyNumber,
            position: playerData.position,
            status: "active",
            contractStart: new Date("2025-01-01"),
            contractEnd: new Date("2025-12-31")
          }).returning();
          
          playerId = newPlayer.id;
          console.log(`✅ Created player: ${firstName} ${lastName} (ID: ${playerId})`);
        }
        
        // Check if player-team assignment already exists
        const existingAssignment = await db.select().from(playerTeamAssignments)
          .where(eq(playerTeamAssignments.playerId, playerId))
          .limit(1);
        
        if (existingAssignment.length === 0 || existingAssignment[0].teamId !== teamId) {
          // Create player-team assignment
          await db.insert(playerTeamAssignments).values({
            playerId,
            teamId,
            season: "2025/26",
            isActive: true
          });
          console.log(`🔗 Assigned player ${firstName} ${lastName} to team ${teamName}`);
        } else {
          console.log(`⚠️ Assignment already exists for ${firstName} ${lastName} in ${teamName}`);
        }
      }
    };

    // Create players for each team with data
    await createPlayersForTeam("KM", kmPlayers);
    await createPlayersForTeam("KM 1b", km1bPlayers);
    await createPlayersForTeam("Frauen Kleinfeld", frauenKleinfeldPlayers);
    await createPlayersForTeam("KM-FR", kmfrPlayers);

    console.log("\n🎉 Import completed successfully!");
    console.log("📊 Import Summary:");
    console.log(`- Teams created: ${Object.keys(createdTeams).length}`);
    console.log(`- KM players: ${kmPlayers.length}`);
    console.log(`- KM 1b players: ${km1bPlayers.length}`);
    console.log(`- Frauen Kleinfeld players: ${frauenKleinfeldPlayers.length}`);
    console.log(`- KM-FR players: ${kmfrPlayers.length}`);
    console.log(`- Total players with data: ${kmPlayers.length + km1bPlayers.length + frauenKleinfeldPlayers.length + kmfrPlayers.length}`);
    
  } catch (error) {
    console.error("❌ Import failed:", error);
    throw error;
  }
}

// Run the import if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importTeamsAndPlayers().catch(console.error);
}

export { importTeamsAndPlayers };