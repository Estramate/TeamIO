import { storage } from "./storage";

// Alle Spielerdaten aus den OEFB-Seiten extrahiert
const allTeamPlayers = {
  // KM 1b Team - 38 Spieler
  "KM 1b": [
    {
      firstName: "Marcel",
      lastName: "Ogertschnig",
      jerseyNumber: null,
      position: "Tor",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_8a0bc2b8d63240d07f60-1,0-100x100.png"
    },
    {
      firstName: "Tristan",
      lastName: "Reichel",
      jerseyNumber: null,
      position: "Tor",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_b6e39d444c7dcfa052e3-1,0-100x100.png"
    },
    {
      firstName: "Paul",
      lastName: "Ankner",
      jerseyNumber: 1,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_711b10ca0c3ba737c776-1,0-100x100.png"
    },
    {
      firstName: "Florian",
      lastName: "Bidovec",
      jerseyNumber: 15,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_92179d3df8094fdc9d67-1,0-100x100.png"
    },
    {
      firstName: "Christopher",
      lastName: "Buttazoni",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_ab0f91eed97ee7794a94-1,0-100x100.png"
    },
    {
      firstName: "Maximilian Erwin Michael",
      lastName: "Bürger",
      jerseyNumber: 4,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_f513ab9707c5db50202e-1,0-100x100.png"
    },
    {
      firstName: "Kilian Peter Alexander",
      lastName: "De Vries",
      jerseyNumber: 5,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_a2d43a4c9e0478a41c0e-1,0-100x100.png"
    },
    {
      firstName: "Thomas",
      lastName: "Dietrichsteiner",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_1950629019c28eee23d0-1,0-100x100.png"
    },
    {
      firstName: "Manolo Mario",
      lastName: "Drussnitzer",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_2d6438c9c29be77957f6-1,0-100x100.png"
    },
    {
      firstName: "Adam",
      lastName: "El Nemer",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_f0246df4119ec13f3803-1,0-100x100.png"
    },
    {
      firstName: "Anton Lorenz",
      lastName: "Erlacher",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_5c88133682d953e23845-1,0-100x100.png"
    },
    {
      firstName: "Konstantin Anton",
      lastName: "Gruber",
      jerseyNumber: 6,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_4842d65eee92df7ce82f-1,0-100x100.png"
    },
    {
      firstName: "Elias Rene Peter",
      lastName: "Hausharter",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_f2be6c3c66071e9f40a9-1,0-100x100.png"
    },
    {
      firstName: "Cedric Diego",
      lastName: "Hinteregger",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_6d4b5305d6505bbaf6b6-1,0-100x100.png"
    },
    {
      firstName: "Georg",
      lastName: "Hruschka",
      jerseyNumber: 7,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_7a28fd5d091761c337e2-1,0-100x100.png"
    },
    {
      firstName: "Jan",
      lastName: "Jackisch",
      jerseyNumber: 16,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_3ad23eb81c8d800b9dff-1,0-100x100.png"
    },
    {
      firstName: "Julian Markus",
      lastName: "Jäger",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_90d514af612daf1ac57b-1,0-100x100.png"
    },
    {
      firstName: "Andreas",
      lastName: "Katic",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_7e536ec047d2d69e4181-1,0-100x100.png"
    },
    {
      firstName: "Marcel Andre",
      lastName: "Kattnig",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_933f74e7f6b5fc30c105-1,0-100x100.png"
    },
    {
      firstName: "Ben",
      lastName: "Kogler",
      jerseyNumber: 9,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_820f1925ed6744966ade-1,0-100x100.png"
    },
    {
      firstName: "Michael",
      lastName: "Kogler",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_bca2424f8de05214ddce-1,0-100x100.png"
    },
    {
      firstName: "Krisztián",
      lastName: "Kovács",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_4023c120f4072f36f96e-1,0-100x100.png"
    },
    {
      firstName: "Jonas",
      lastName: "Kraiger",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_4d30f02d375edf821e24-1,0-100x100.png"
    },
    {
      firstName: "Simon",
      lastName: "Kraiger",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_9ec03e8889a5def44737-1,0-100x100.png"
    },
    {
      firstName: "Nikolaos",
      lastName: "Legat",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_92d4c79d4653f6b41883-1,0-100x100.png"
    },
    {
      firstName: "Elias",
      lastName: "Mainhard",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_f9304c2b98adc0c8be5f-1,0-100x100.png"
    },
    {
      firstName: "Thomas",
      lastName: "Matheuschitz",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_17eb0bc93ec274046f68-1,0-100x100.png"
    },
    {
      firstName: "Emanuel Dargo",
      lastName: "Milic",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_3b15dab395c71d724d6d-1,0-100x100.png"
    },
    {
      firstName: "Bastian Timo",
      lastName: "Mitterböck",
      jerseyNumber: 14,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_c7a3047d5cd7dcf6987f-1,0-100x100.png"
    },
    {
      firstName: "Herbert",
      lastName: "Mühlbacher",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_e617e24e4bb28a7a362f-1,0-100x100.png"
    },
    {
      firstName: "Sandro Michael",
      lastName: "Perisutti",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_ef8245c670337a5fa847-1,0-100x100.png"
    },
    {
      firstName: "Nico Mario",
      lastName: "Proprentner",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_cbeef8d09020255d6f1a-1,0-100x100.png"
    },
    {
      firstName: "Noah",
      lastName: "Rabensteiner",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_a6f8cfb09ab83e0ef110-1,0-100x100.png"
    },
    {
      firstName: "Rainer",
      lastName: "Schmid",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_6f2785f0e2b0a200557c-1,0-100x100.png"
    },
    {
      firstName: "Simon",
      lastName: "Schmölzer",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_3ddeb343b8217e15faae-1,0-100x100.png"
    },
    {
      firstName: "Matthias",
      lastName: "Sgonz",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_53213f50176388ed5a1f-1,0-100x100.png"
    },
    {
      firstName: "Lukas",
      lastName: "Stecher",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_d7d6e7c6ea5c5863ee1e-1,0-100x100.png"
    }
  ],

  // Frauen Kleinfeld Team - 14 Spielerinnen
  "Frauen Kleinfeld": [
    {
      firstName: "Raphaela Anke",
      lastName: "Cramaro",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_3eed0669c8a918900e5c-1,0-100x100.png"
    },
    {
      firstName: "Elizabet",
      lastName: "Gjoni",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_6257c67c5a5fe21e63e5-1,0-100x100.png"
    },
    {
      firstName: "Isil",
      lastName: "Kandemir",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_39c4695e876cb379eec2-1,0-100x100.png"
    },
    {
      firstName: "Lorina Elena",
      lastName: "Klammer",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_ed14b1ad7126e0e64131-1,0-100x100.png"
    },
    {
      firstName: "Lea",
      lastName: "Konrad",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_fad4ee69f261d1b1e39a-1,0-100x100.png"
    },
    {
      firstName: "Lana",
      lastName: "Lucic",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_9b3b2e98ae5399341d0c-1,0-100x100.png"
    },
    {
      firstName: "Nazanin",
      lastName: "Majidi",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_0c10424e470d9c41978f-1,0-100x100.png"
    },
    {
      firstName: "Lina",
      lastName: "Oberhauser",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_8a71543d224a7c8b948a-1,0-100x100.png"
    },
    {
      firstName: "Lara Emma",
      lastName: "Oschgan",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_eff8328eddd01294c3c8-1,0-100x100.png"
    },
    {
      firstName: "Berfu Rüveyda",
      lastName: "Pekel",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_8ad672198661449422ce-1,0-100x100.png"
    },
    {
      firstName: "Tamari",
      lastName: "Pinter",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_f03e67ca84eb3b7a95e2-1,0-100x100.png"
    },
    {
      firstName: "Amelie",
      lastName: "Schernthaner",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_e240e46d4eacef6d39c7-1,0-100x100.png"
    },
    {
      firstName: "Zehra",
      lastName: "Signak",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_b4f0fb04cd03ae83b446-1,0-100x100.png"
    },
    {
      firstName: "Miriam",
      lastName: "Steiner",
      jerseyNumber: null,
      position: "",
      nationality: "Österreich",
      status: "active" as const,
      profileImageUrl: "https://vereine.oefb.at/vereine3/person/images/834733022602002384_62c64a5da93f959cf9d9-1,0-100x100.png"
    }
  ]
};

export async function seedAllTeamsPlayers() {
  try {
    console.log("Seeding additional teams with players...");
    
    // Find SV Oberglan club
    const clubs = await storage.getClubs();
    const svOberglan = clubs.find(club => club.name === "SV Oberglan 1975");
    
    if (!svOberglan) {
      throw new Error("SV Oberglan 1975 club not found");
    }

    // Get all teams
    const teams = await storage.getTeams(svOberglan.id);
    
    let totalCreated = 0;
    
    for (const [teamName, players] of Object.entries(allTeamPlayers)) {
      const team = teams.find(t => t.name === teamName);
      
      if (!team) {
        console.log(`Warning: Team ${teamName} not found, skipping...`);
        continue;
      }
      
      console.log(`Processing team: ${teamName} with ${players.length} players`);
      
      for (const playerData of players) {
        // Check if player already exists
        const existingPlayers = await storage.getPlayers(svOberglan.id);
        const existingPlayer = existingPlayers.find(p => 
          p.firstName === playerData.firstName && p.lastName === playerData.lastName
        );
        
        let player;
        if (existingPlayer) {
          player = existingPlayer;
          console.log(`Player ${playerData.firstName} ${playerData.lastName} already exists`);
        } else {
          // Create new player
          player = await storage.createPlayer({
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
          
          totalCreated++;
          console.log(`Created new player: ${player.firstName} ${player.lastName}`);
        }

        // Assign player to team (if not already assigned)
        try {
          await storage.assignPlayerToTeam({
            playerId: player.id,
            teamId: team.id,
            season: "2024/25",
            isActive: true
          });
          console.log(`Assigned ${player.firstName} ${player.lastName} to ${teamName}`);
        } catch (error) {
          // Ignore duplicate assignment errors
          console.log(`Assignment already exists for ${player.firstName} ${player.lastName} in ${teamName}`);
        }
      }
    }

    console.log(`Successfully processed additional teams. Created ${totalCreated} new players.`);
    return totalCreated;
    
  } catch (error) {
    console.error("Error seeding additional teams:", error);
    throw error;
  }
}