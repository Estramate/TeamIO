import { storage } from "./storage";

// Real SV Oberglan players from OEFB website
const svOberglanPlayers = [
  // Torhüter
  {
    firstName: "Martin",
    lastName: "Napetschnig", 
    jerseyNumber: 31,
    position: "Tor",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_dc6461a95d24f8355af2-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Anel",
    lastName: "Sandal",
    jerseyNumber: 1,
    position: "Tor", 
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_0e22a0807b2f7abd40bd-1,0-100x100.png",
    team: "KM"
  },
  
  // Verteidigung  
  {
    firstName: "Thomas",
    lastName: "Krainer",
    jerseyNumber: 17,
    position: "Verteidigung",
    nationality: "Österreich", 
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_96aa8b8aa54018269453-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Elias", 
    lastName: "Mainhard",
    jerseyNumber: 3,
    position: "Verteidigung",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_f9304c2b98adc0c8be5f-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Thomas Christian",
    lastName: "Tatschl",
    jerseyNumber: 13,
    position: "Verteidigung",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_89ddf50f54ab5813d2e2-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Denis",
    lastName: "Tomic",
    jerseyNumber: 4,
    position: "Verteidigung",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_3abedd01f4192566d27f-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Dominik",
    lastName: "Wurmdobler", 
    jerseyNumber: 16,
    position: "Verteidigung",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_c84bec49d01640c0a6a2-1,0-100x100.png",
    team: "KM"
  },

  // Mittelfeld
  {
    firstName: "Sandro Jose",
    lastName: "Ferreira Da Silva",
    jerseyNumber: 9,
    position: "Mittelfeld",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_1fe6853496e04ceec003-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Konstantin Anton",
    lastName: "Gruber",
    jerseyNumber: 12,
    position: "Mittelfeld",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_4842d65eee92df7ce82f-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Sergej",
    lastName: "Lazic",
    jerseyNumber: 25,
    position: "Mittelfeld",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_39db0a1742cb779faeab-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Hannes Alois",
    lastName: "Petutschnig",
    jerseyNumber: 15,
    position: "Mittelfeld",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_cb235acc3101222d5cd7-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Niklas Julian",
    lastName: "Rainer",
    jerseyNumber: 11,
    position: "Mittelfeld",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_cef8b482b8d978b82d12-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "David",
    lastName: "Tamegger",
    jerseyNumber: 7,
    position: "Mittelfeld",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_21d64e3a001604761956-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Betim",
    lastName: "Tifek",
    jerseyNumber: 18,
    position: "Mittelfeld",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_8c845122515dad15ef92-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Daniel",
    lastName: "Wernig",
    jerseyNumber: 99,
    position: "Mittelfeld",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_2bf770d50490ef0f8446-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Nikolaus Johannes",
    lastName: "Ziehaus",
    jerseyNumber: 29,
    position: "Mittelfeld",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_1895331db7e96b1acc49-1,0-100x100.png",
    team: "KM"
  },

  // Sturm
  {
    firstName: "Martin",
    lastName: "Hinteregger",
    jerseyNumber: 6,
    position: "Sturm",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_834d5689f4d4e8e3740f-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Andreas",
    lastName: "Katic",
    jerseyNumber: 23,
    position: "Sturm",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_7e536ec047d2d69e4181-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Maximilian Gert",
    lastName: "Rupitsch",
    jerseyNumber: 19,
    position: "Sturm",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_9bb603ad9e3a3dfd5ad3-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Andre Albert",
    lastName: "Zitterer",
    jerseyNumber: 22,
    position: "Sturm",
    nationality: "Österreich", 
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_a634e408cbd18cfd5f19-1,0-100x100.png",
    team: "KM"
  },

  // Weitere Spieler
  {
    firstName: "Maximilian Erwin Michael",
    lastName: "Bürger",
    jerseyNumber: null,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_f513ab9707c5db50202e-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Thomas",
    lastName: "Dietrichsteiner",
    jerseyNumber: 5,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_1950629019c28eee23d0-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Christoph",
    lastName: "Freithofnig",
    jerseyNumber: 10,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_4a02ac92b4fa1c435dd1-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Gerald",
    lastName: "Kohlweg",
    jerseyNumber: null,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_c589f9932fa7b3657a46-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Eric", 
    lastName: "Mainhard",
    jerseyNumber: null,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_95f74226a7d37305c15c-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Marco",
    lastName: "Messner",
    jerseyNumber: null,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_973b7636a58d1bb1f6a0-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Marcel",
    lastName: "Ogertschnig",
    jerseyNumber: null,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_8a0bc2b8d63240d07f60-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Noah",
    lastName: "Rabensteiner",
    jerseyNumber: 17,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_a6f8cfb09ab83e0ef110-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Julian Karl",
    lastName: "Reichenhauser", 
    jerseyNumber: null,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_3879c9f82dd53cdca0b0-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Manuel Josef",
    lastName: "Vaschauner",
    jerseyNumber: 19,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_28bd2506201f5f077162-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Christopher",
    lastName: "Wadl",
    jerseyNumber: null,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_dec99f2b5f2ec48d49d2-1,0-100x100.png",
    team: "KM"
  },
  {
    firstName: "Florian Alexander",
    lastName: "Zitterer",
    jerseyNumber: null,
    position: "",
    nationality: "Österreich",
    status: "active" as const,
    profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_b7bdaf15444b294edc63-1,0-100x100.png",
    team: "KM"
  }
];

export async function seedPlayers() {
  try {
    console.log("Seeding players for SV Oberglan...");
    
    // Find SV Oberglan club
    const clubs = await storage.getClubs();
    const svOberglan = clubs.find(club => club.name === "SV Oberglan 1975");
    
    if (!svOberglan) {
      throw new Error("SV Oberglan 1975 club not found");
    }

    // Get teams to map players
    const teams = await storage.getTeams(svOberglan.id);
    const kmTeam = teams.find(team => team.name === "Kampfmannschaft");
    
    if (!kmTeam) {
      throw new Error("Kampfmannschaft team not found");
    }

    // Check existing players instead of deleting all
    const existingPlayers = await storage.getPlayers(svOberglan.id);

    // Create players only if they don't exist
    let createdCount = 0;
    for (const playerData of svOberglanPlayers) {
      const existingPlayer = existingPlayers.find(p => 
        p.firstName === playerData.firstName && p.lastName === playerData.lastName
      );
      
      if (!existingPlayer) {
        const player = await storage.createPlayer({
          clubId: svOberglan.id,
          firstName: playerData.firstName,
          lastName: playerData.lastName,
          jerseyNumber: playerData.jerseyNumber,
          position: playerData.position,
          nationality: playerData.nationality,
          status: playerData.status,
          profileImageUrl: playerData.profileImageUrl || null,
          birthDate: null,
          height: null,
          weight: null,
          preferredFoot: null,
          contractStart: null,
          contractEnd: null,
          phone: null,
          email: null
        });

        // Assign player to KM team
        await storage.assignPlayerToTeam({
          playerId: player.id,
          teamId: kmTeam.id,
          season: "2024/25",
          isActive: true
        });
        
        createdCount++;
        console.log(`Created player: ${player.firstName} ${player.lastName}`);
      } else {
        console.log(`→ Player already exists: ${playerData.firstName} ${playerData.lastName}`);
      }
    }

    console.log(`Successfully seeded ${createdCount} players for SV Oberglan`);
    return createdCount;
    
  } catch (error) {
    console.error("Error seeding players:", error);
    throw error;
  }
}