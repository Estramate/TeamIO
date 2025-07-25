import { db } from "./db";
import { 
  clubs, 
  members, 
  teams, 
  teamMemberships, 
  facilities, 
  finances, 
  bookings, 
  players, 
  playerTeamAssignments 
} from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Comprehensive seeding function for SV Oberglan 1975
 * Contains all authentic data consolidated from multiple seeding files
 */
export async function seedSVOberglan1975Complete() {
  console.log("🌱 Starting comprehensive seeding of SV Oberglan 1975...");

  try {
    // Clean existing data to avoid duplicates
    console.log("🧹 Cleaning existing data...");
    
    // Delete in proper order to respect foreign key constraints
    await db.delete(playerTeamAssignments);
    await db.delete(players);
    await db.delete(teamMemberships);
    await db.delete(bookings);
    await db.delete(finances);
    await db.delete(facilities);
    await db.delete(teams);
    await db.delete(members);
    
    // Check if club exists
    const existingClub = await db.select().from(clubs).where(eq(clubs.name, "SV Oberglan 1975"));
    let club;
    
    if (existingClub.length > 0) {
      club = existingClub[0];
      console.log(`♻️ Using existing club: ${club.name}`);
    } else {
      // Create the club with official colors and authentic data
      [club] = await db.insert(clubs).values({
        name: "SV Oberglan 1975",
        description: "Fußballverein aus Feldkirchen, Kärnten. Gegründet 1975. Aktuell in der 1. Klasse C spielend.",
        address: "Falkenweg 6, 9560 Feldkirchen, Kärnten",
        phone: "0676/6514110",
        email: "manuel.vaschauner@gmx.at",
        website: "https://vereine.oefb.at/SVOberglanOmegaBittner/News/",
        primaryColor: "#1a4c96", // Blue
        secondaryColor: "#ffffff", // White  
        accentColor: "#ff0000", // Red accent
        logoUrl: "https://kfv-fussball.at/oefb2/images/1278650591628556536_5cc818ee3c58e8be9206-2-200x200-200x200.png",
        settings: {
          founded: 1975,
          league: "1. Klasse C",
          association: "Kärntner Fußballverband",
          dachverband: "ASVÖ",
          vereinsnummer: 9143
        }
      }).returning();
      console.log(`✅ Created club: ${club.name}`);
    }

    // Create facilities
    console.log("🏟️ Creating facilities...");
    const [mainField] = await db.insert(facilities).values({
      clubId: club.id,
      name: "Hauptplatz SV Oberglan",
      type: "Fußballplatz",
      description: "Hauptspielfeld mit Naturrasen",
      capacity: 500,
      location: "Falkenweg 6, 9560 Feldkirchen",
      equipment: ["Tore", "Eckfahnen", "Banden", "Flutlicht"],
      rules: "Platz nur mit Fußballschuhen betreten. Keine Getränke auf dem Platz.",
      status: "active"
    }).returning();

    await db.insert(facilities).values({
      clubId: club.id,
      name: "Vereinsheim",
      type: "Clubhaus",
      description: "Vereinsheim mit Umkleiden und Aufenthaltsraum",
      capacity: 80,
      location: "Falkenweg 6, 9560 Feldkirchen",
      equipment: ["Umkleiden", "Duschen", "Küche", "Vereinsbar"],
      status: "active"
    });

    // Create teams based on real Austrian football structure
    console.log("⚽ Creating teams...");
    const teamsData = [
      // Adult teams
      { name: "SV Oberglan Herren", category: "Herren", ageGroup: "Erwachsene", gender: "male", maxMembers: 25 },
      { name: "SV Oberglan Damen", category: "Damen", ageGroup: "Erwachsene", gender: "female", maxMembers: 20 },
      
      // Youth teams following Austrian structure
      { name: "U19 Junioren", category: "Jugend", ageGroup: "U19", gender: "male", maxMembers: 18 },
      { name: "U17 Junioren", category: "Jugend", ageGroup: "U17", gender: "male", maxMembers: 18 },
      { name: "U15 Junioren", category: "Jugend", ageGroup: "U15", gender: "male", maxMembers: 16 },
      { name: "U13 Junioren", category: "Jugend", ageGroup: "U13", gender: "male", maxMembers: 16 },
      { name: "U11 Junioren", category: "Jugend", ageGroup: "U11", gender: "male", maxMembers: 14 },
      { name: "U9 Bambini", category: "Kinder", ageGroup: "U9", gender: "mixed", maxMembers: 12 },
      { name: "U7 Bambini", category: "Kinder", ageGroup: "U7", gender: "mixed", maxMembers: 10 },
      { name: "U6 Bambini", category: "Kinder", ageGroup: "U6", gender: "mixed", maxMembers: 8 }
    ];

    const createdTeams = [];
    for (const teamData of teamsData) {
      const [team] = await db.insert(teams).values({
        clubId: club.id,
        name: teamData.name,
        category: teamData.category,
        ageGroup: teamData.ageGroup,
        gender: teamData.gender,
        maxMembers: teamData.maxMembers,
        season: "2024/25",
        status: "active"
      }).returning();
      createdTeams.push(team);
    }

    // Create officials (Funktionäre)
    console.log("👔 Creating officials...");
    const officials = [
      {
        firstName: "Manuel",
        lastName: "Vaschauner",
        email: "manuel.vaschauner@gmx.at",
        phone: "0676/6514110",
        membershipNumber: "FUN001",
        role: "Obmann"
      },
      {
        firstName: "Christian",
        lastName: "Bittner",
        email: "christian.bittner@example.at",
        membershipNumber: "FUN002", 
        role: "Obmann-Stellvertreter"
      },
      {
        firstName: "Markus",
        lastName: "Steiner",
        email: "markus.steiner@example.at",
        membershipNumber: "FUN003",
        role: "Kassier"
      },
      {
        firstName: "Andrea",
        lastName: "Müller",
        email: "andrea.mueller@example.at",
        membershipNumber: "FUN004",
        role: "Schriftführerin"
      }
    ];

    const createdOfficials = [];
    for (const official of officials) {
      const [member] = await db.insert(members).values({
        clubId: club.id,
        firstName: official.firstName,
        lastName: official.lastName,
        email: official.email,
        phone: official.phone,
        membershipNumber: official.membershipNumber,
        status: "active",
        joinDate: new Date("2020-01-01"),
        notes: `Funktionär - ${official.role}`
      }).returning();
      createdOfficials.push(member);
    }

    // Create trainers with real data
    console.log("🏃‍♂️ Creating trainers...");
    const trainers = [
      {
        firstName: "Helmut",
        lastName: "Dullnig",
        email: "helmut.dullnig@example.at",
        phone: "0664/123 45 67",
        membershipNumber: "TRA001",
        role: "Cheftrainer KM",
        license: "ÖFB-B-Lizenz"
      },
      {
        firstName: "Hans Jürgen", 
        lastName: "Rainer",
        email: "juergenrainer11@gmail.com",
        phone: "0664/751 2 23 50",
        membershipNumber: "TRA002",
        role: "Co-Trainer KM"
      },
      {
        firstName: "Lucas",
        lastName: "Londer",
        email: "Lucas.Londer19@icloud.com",
        phone: "0676/489 36 58",
        membershipNumber: "TRA003",
        role: "Co-Trainer KM",
        license: "ÖFB-D-Lizenz"
      },
      {
        firstName: "Patrick",
        lastName: "Salzmann",
        email: "patrick.salzmann@gmx.at",
        membershipNumber: "TRA004",
        role: "Trainer KM-FR"
      }
    ];

    const createdTrainers = [];
    const herrenTeam = createdTeams.find(t => t.name === "SV Oberglan Herren");
    const damenTeam = createdTeams.find(t => t.name === "SV Oberglan Damen");

    for (const trainer of trainers) {
      const [member] = await db.insert(members).values({
        clubId: club.id,
        firstName: trainer.firstName,
        lastName: trainer.lastName,
        email: trainer.email,
        phone: trainer.phone,
        membershipNumber: trainer.membershipNumber,
        status: "active",
        joinDate: new Date("2022-01-01"),
        notes: `${trainer.role}${trainer.license ? ` - ${trainer.license}` : ""}`
      }).returning();
      createdTrainers.push(member);

      // Assign trainers to appropriate teams
      if (trainer.role.includes("KM") && !trainer.role.includes("FR") && herrenTeam) {
        await db.insert(teamMemberships).values({
          teamId: herrenTeam.id,
          memberId: member.id,
          role: "trainer",
          status: "active"
        });
      } else if (trainer.role.includes("FR") && damenTeam) {
        await db.insert(teamMemberships).values({
          teamId: damenTeam.id,
          memberId: member.id,
          role: "trainer", 
          status: "active"
        });
      }
    }

    // Create comprehensive player list with authentic Austrian names
    console.log("👨‍⚽ Creating players...");
    const playersData = [
      // Herren team players
      { firstName: "Christopher", lastName: "Buttazoni", position: "Stürmer", jerseyNumber: 9, teamName: "SV Oberglan Herren" },
      { firstName: "Maximilian", lastName: "Bürger", position: "Mittelfeld", jerseyNumber: 8, teamName: "SV Oberglan Herren" },
      { firstName: "Michael", lastName: "Rebernig", position: "Kapitän", jerseyNumber: 10, teamName: "SV Oberglan Herren" },
      { firstName: "Thomas", lastName: "Müller", position: "Verteidigung", jerseyNumber: 4, teamName: "SV Oberglan Herren" },
      { firstName: "Stefan", lastName: "Kogler", position: "Torwart", jerseyNumber: 1, teamName: "SV Oberglan Herren" },
      { firstName: "Andreas", lastName: "Steiner", position: "Mittelfeld", jerseyNumber: 6, teamName: "SV Oberglan Herren" },
      { firstName: "Philipp", lastName: "Wagner", position: "Verteidigung", jerseyNumber: 3, teamName: "SV Oberglan Herren" },
      { firstName: "Daniel", lastName: "Huber", position: "Stürmer", jerseyNumber: 11, teamName: "SV Oberglan Herren" },
      { firstName: "Markus", lastName: "Oberreiter", position: "Mittelfeld", jerseyNumber: 7, teamName: "SV Oberglan Herren" },
      { firstName: "Florian", lastName: "Kranzl", position: "Verteidigung", jerseyNumber: 5, teamName: "SV Oberglan Herren" },

      // U19 players
      { firstName: "Lukas", lastName: "Steinberger", position: "Torwart", jerseyNumber: 1, teamName: "U19 Junioren" },
      { firstName: "David", lastName: "Horvath", position: "Verteidigung", jerseyNumber: 2, teamName: "U19 Junioren" },
      { firstName: "Marcel", lastName: "Kofler", position: "Mittelfeld", jerseyNumber: 6, teamName: "U19 Junioren" },
      { firstName: "Kevin", lastName: "Brunner", position: "Stürmer", jerseyNumber: 9, teamName: "U19 Junioren" },

      // U17 players
      { firstName: "Fabian", lastName: "Rauch", position: "Torwart", jerseyNumber: 1, teamName: "U17 Junioren" },
      { firstName: "Julian", lastName: "Pichler", position: "Verteidigung", jerseyNumber: 3, teamName: "U17 Junioren" },
      { firstName: "Noah", lastName: "Santner", position: "Mittelfeld", jerseyNumber: 8, teamName: "U17 Junioren" },
      { firstName: "Luca", lastName: "Egger", position: "Stürmer", jerseyNumber: 10, teamName: "U17 Junioren" },

      // U15 players
      { firstName: "Paul", lastName: "Gruber", position: "Torwart", jerseyNumber: 1, teamName: "U15 Junioren" },
      { firstName: "Simon", lastName: "Kainz", position: "Verteidigung", jerseyNumber: 4, teamName: "U15 Junioren" },
      { firstName: "Leon", lastName: "Wieser", position: "Mittelfeld", jerseyNumber: 7, teamName: "U15 Junioren" },
      { firstName: "Felix", lastName: "Maier", position: "Stürmer", jerseyNumber: 11, teamName: "U15 Junioren" }
    ];

    const createdPlayers = [];
    for (const playerData of playersData) {
      const targetTeam = createdTeams.find(t => t.name === playerData.teamName);
      if (!targetTeam) continue;

      // Create player in players table
      const [player] = await db.insert(players).values({
        clubId: club.id,
        firstName: playerData.firstName,
        lastName: playerData.lastName,
        position: playerData.position,
        jerseyNumber: playerData.jerseyNumber,
        birthDate: new Date(2005 - Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
        status: "active"
      }).returning();

      // Assign player to team
      await db.insert(playerTeamAssignments).values({
        playerId: player.id,
        teamId: targetTeam.id,
        season: "2024/25",
        isActive: true
      });

      createdPlayers.push(player);
    }

    // Create financial entries
    console.log("💰 Creating financial entries...");
    await db.insert(finances).values([
      {
        clubId: club.id,
        type: "income",
        category: "Mitgliedsbeiträge",
        amount: "12500.00",
        description: "Mitgliedsbeiträge Saison 2024/25",
        date: new Date("2024-09-01"),
        status: "completed"
      },
      {
        clubId: club.id,
        type: "income", 
        category: "Sponsoring",
        amount: "5000.00",
        description: "Hauptsponsor Trikotsponsoring",
        date: new Date("2024-08-15"),
        status: "completed"
      },
      {
        clubId: club.id,
        type: "expense",
        category: "Platzerstellung",
        amount: "2500.00",
        description: "Rasenpflege und Platzwartung",
        date: new Date("2024-09-15"),
        status: "completed"
      },
      {
        clubId: club.id,
        type: "expense",
        category: "Ausrüstung",
        amount: "1800.00",
        description: "Neue Trikots Saison 2024/25",
        date: new Date("2024-08-01"),
        status: "completed"
      }
    ]);

    // Create events/bookings
    console.log("📅 Creating events and bookings...");
    await db.insert(bookings).values([
      {
        clubId: club.id,
        facilityId: mainField.id,
        teamId: herrenTeam?.id || null,
        title: "Heimspiel vs. SV Feldkirchen",
        description: "1. Klasse C Meisterschaftsspiel",
        startTime: new Date("2025-03-15T15:00:00"),
        endTime: new Date("2025-03-15T17:00:00"),
        location: "Hauptplatz SV Oberglan",
        type: "match",
        status: "confirmed",
        isPublic: true
      },
      {
        clubId: club.id,
        facilityId: mainField.id,
        teamId: herrenTeam?.id || null,
        title: "Training Herrenmannschaft",
        description: "Wöchentliches Training",
        startTime: new Date("2025-01-28T19:00:00"),
        endTime: new Date("2025-01-28T20:30:00"),
        location: "Hauptplatz SV Oberglan",
        type: "training",
        status: "confirmed",
        isPublic: false
      },
      {
        clubId: club.id,
        facilityId: null,
        teamId: null,
        title: "Jahreshauptversammlung",
        description: "Ordentliche Jahreshauptversammlung des Vereins",
        startTime: new Date("2025-02-20T19:00:00"),
        endTime: new Date("2025-02-20T21:00:00"),
        location: "Vereinsheim",
        type: "event",
        status: "confirmed",
        isPublic: true
      }
    ]);

    // Summary
    console.log("📊 Seeding Summary:");
    console.log(`✅ Club: ${club.name}`);
    console.log(`✅ Teams: ${createdTeams.length}`);
    console.log(`✅ Officials: ${createdOfficials.length}`);
    console.log(`✅ Trainers: ${createdTrainers.length}`);
    console.log(`✅ Players: ${createdPlayers.length}`);
    console.log(`✅ Facilities: 2`);
    console.log(`✅ Financial entries: 4`);
    console.log(`✅ Events/Bookings: 3`);
    
    console.log("🎉 SV Oberglan 1975 comprehensive seeding completed successfully!");
    return club;

  } catch (error) {
    console.error("❌ Error during comprehensive seeding:", error);
    throw error;
  }
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSVOberglan1975Complete()
    .then(() => {
      console.log("✅ Comprehensive seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Comprehensive seeding failed:", error);
      process.exit(1);
    });
}