import { db } from "./db";
import { clubs, members, teams, teamMemberships, facilities, finances, events } from "@shared/schema";

export async function seedSVOberglan1975() {
  console.log("🌱 Seeding SV Oberglan 1975 with real data...");

  try {
    // Create the club with official colors (typical Austrian football club colors)
    const [club] = await db.insert(clubs).values({
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

    // Create facilities based on typical Austrian football club setup
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

    // Create teams based on real KFV data
    const [herrenTeam] = await db.insert(teams).values({
      clubId: club.id,
      name: "SV Oberglan Herren",
      category: "Herren",
      ageGroup: "Erwachsene",
      gender: "male",
      description: "Hauptmannschaft, spielt in der 1. Klasse C",
      maxMembers: 25,
      season: "2024/25",
      status: "active"
    }).returning();

    const [frauenTeam] = await db.insert(teams).values({
      clubId: club.id,
      name: "SV Oberglan Damen",
      category: "Damen",
      ageGroup: "Erwachsene", 
      gender: "female",
      description: "Damenmannschaft, spielt in der Kärntner Frauen Liga",
      maxMembers: 20,
      season: "2024/25",
      status: "active"
    }).returning();

    const [u15Team] = await db.insert(teams).values({
      clubId: club.id,
      name: "SG SV Oberglan/SV Moosburg/ASKÖ Wölfnitz U15",
      category: "Jugend",
      ageGroup: "U15",
      gender: "mixed",
      description: "Jugendmannschaft U15 als Spielgemeinschaft",
      maxMembers: 18,
      season: "2024/25",
      status: "active"
    }).returning();

    // Add real officials/Funktionäre based on KFV data
    const officials = [
      {
        firstName: "Manuel Josef",
        lastName: "Vaschauner",
        email: "manuel.vaschauner@gmx.at",
        phone: "0676/651 41 10",
        birthDate: new Date("1990-01-01"),
        membershipNumber: "OBM001",
        role: "Obmann",
        status: "active"
      },
      {
        firstName: "Andreas",
        lastName: "Hartner", 
        phone: "0664/122 31 34",
        membershipNumber: "PRE001",
        role: "Präsident",
        status: "active"
      },
      {
        firstName: "Peter",
        lastName: "Tengg",
        phone: "0664/461 07 20",
        membershipNumber: "OBM002",
        role: "Obmann Stv.",
        status: "active"
      },
      {
        firstName: "Rene",
        lastName: "Hartner",
        membershipNumber: "SEK001",
        role: "Sektionsleiter",
        status: "active"
      },
      {
        firstName: "Christine",
        lastName: "Gaggl",
        email: "christine.gaggl@ktn.gv.at",
        phone: "0664/303 80 16",
        membershipNumber: "SEK002",
        role: "Sektionsleiterin Frauen",
        status: "active"
      },
      {
        firstName: "Diethard",
        lastName: "Knes",
        phone: "0650/386 27 35",
        membershipNumber: "KAS001",
        role: "Kassier",
        status: "active"
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
        birthDate: official.birthDate,
        membershipNumber: official.membershipNumber,
        status: official.status,
        joinDate: new Date("2020-01-01"),
        notes: `Funktionär: ${official.role}`
      }).returning();
      createdOfficials.push(member);
    }

    // Add trainers based on KFV data
    const trainers = [
      {
        firstName: "Hans Florian",
        lastName: "Zuschlag",
        email: "florian.zuschlag@gmx.at",
        phone: "0664/124 41 90",
        membershipNumber: "TRA001",
        role: "Trainer KM",
        license: "UEFA-B-Lizenz"
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

      // Assign trainers to teams
      if (trainer.role.includes("KM") && !trainer.role.includes("FR")) {
        await db.insert(teamMemberships).values({
          teamId: herrenTeam.id,
          memberId: member.id,
          role: "trainer",
          status: "active"
        });
      } else if (trainer.role.includes("FR")) {
        await db.insert(teamMemberships).values({
          teamId: frauenTeam.id,
          memberId: member.id,
          role: "trainer",
          status: "active"
        });
      }
    }

    // Add some typical players
    const players = [
      { firstName: "Christopher", lastName: "Buttazoni", position: "Stürmer", jerseyNumber: 9 },
      { firstName: "Maximilian", lastName: "Bürger", position: "Mittelfeld", jerseyNumber: 8 },
      { firstName: "Michael", lastName: "Rebernig", position: "Kapitän", jerseyNumber: 10 },
      { firstName: "Thomas", lastName: "Müller", position: "Verteidigung", jerseyNumber: 4 },
      { firstName: "Stefan", lastName: "Kogler", position: "Torwart", jerseyNumber: 1 },
      { firstName: "Andreas", lastName: "Steiner", position: "Mittelfeld", jerseyNumber: 6 },
      { firstName: "Philipp", lastName: "Wagner", position: "Verteidigung", jerseyNumber: 3 },
      { firstName: "Daniel", lastName: "Huber", position: "Stürmer", jerseyNumber: 11 }
    ];

    for (const player of players) {
      const [member] = await db.insert(members).values({
        clubId: club.id,
        firstName: player.firstName,
        lastName: player.lastName,
        membershipNumber: `SPL${player.jerseyNumber.toString().padStart(3, '0')}`,
        status: "active",
        joinDate: new Date("2023-08-01"),
        birthDate: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
      }).returning();

      await db.insert(teamMemberships).values({
        teamId: herrenTeam.id,
        memberId: member.id,
        role: player.lastName === "Rebernig" ? "captain" : "player",
        position: player.position,
        jerseyNumber: player.jerseyNumber,
        status: "active"
      });
    }

    // Add some typical club finances
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

    // Add some events
    await db.insert(events).values([
      {
        clubId: club.id,
        teamId: herrenTeam.id,
        title: "Heimspiel vs. SV Feldkirchen",
        description: "1. Klasse C Meisterschaftsspiel",
        startDate: new Date("2025-03-15T15:00:00"),
        endDate: new Date("2025-03-15T17:00:00"),
        location: "Hauptplatz SV Oberglan",
        type: "match",
        status: "scheduled"
      },
      {
        clubId: club.id,
        teamId: herrenTeam.id,
        title: "Training Herrenmannschaft",
        description: "Wöchentliches Training",
        startDate: new Date("2025-01-28T19:00:00"),
        endDate: new Date("2025-01-28T20:30:00"),
        location: "Hauptplatz SV Oberglan",
        type: "training",
        status: "scheduled"
      },
      {
        clubId: club.id,
        title: "Jahreshauptversammlung",
        description: "Ordentliche Jahreshauptversammlung des Vereins",
        startDate: new Date("2025-02-20T19:00:00"),
        endDate: new Date("2025-02-20T21:00:00"),
        location: "Vereinsheim",
        type: "meeting",
        status: "scheduled"
      }
    ]);

    console.log(`✅ Created ${createdOfficials.length} officials`);
    console.log(`✅ Created ${createdTrainers.length} trainers`);
    console.log(`✅ Created ${players.length} players`);
    console.log(`✅ Created 3 teams`);
    console.log(`✅ Created 2 facilities`);
    console.log(`✅ Created 4 financial entries`);
    console.log(`✅ Created 3 events`);
    
    console.log("🎉 SV Oberglan 1975 successfully seeded with real data!");
    return club;

  } catch (error) {
    console.error("❌ Error seeding SV Oberglan 1975:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSVOberglan1975()
    .then(() => {
      console.log("Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}