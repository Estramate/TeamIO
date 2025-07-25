import { db } from "./db";
import { clubs, members, teams, teamMemberships, facilities, finances, events, players, bookings, playerTeamAssignments } from "@shared/schema";

export async function seedTestData() {
  console.log("🌱 Seeding with test data...");

  try {
    // Create test club
    const [club] = await db.insert(clubs).values({
      name: "Test Sports Club",
      description: "A demonstration sports club for testing the TeamIO management system.",
      address: "123 Sports Street, Test City, TC 12345",
      phone: "+1-555-0123",
      email: "info@testsportsclub.com",
      website: "https://testsportsclub.com",
      primaryColor: "#2563eb", // Blue
      secondaryColor: "#ffffff", // White  
      accentColor: "#dc2626", // Red accent
      logoUrl: null,
      settings: {
        founded: 2010,
        league: "Test League Division 1",
        association: "Test Sports Association",
        maxMembers: 500
      }
    }).returning();

    console.log(`✅ Created club: ${club.name}`);

    // Create test facilities
    const [mainField] = await db.insert(facilities).values({
      clubId: club.id,
      name: "Main Field",
      type: "Football Field",
      description: "Primary grass field for matches and training",
      capacity: 2000,
      location: "123 Sports Street, Test City",
      equipment: ["Goals", "Corner flags", "Floodlights", "Scoreboard"],
      rules: "Football boots required. No food or drinks on field.",
      status: "active"
    }).returning();

    await db.insert(facilities).values([
      {
        clubId: club.id,
        name: "Training Ground",
        type: "Training Field",
        description: "Secondary field for training sessions",
        capacity: 100,
        location: "Behind main field",
        equipment: ["Training goals", "Cones", "Practice equipment"],
        status: "active"
      },
      {
        clubId: club.id,
        name: "Clubhouse",
        type: "Building",
        description: "Main clubhouse with changing rooms and social area",
        capacity: 150,
        location: "123 Sports Street, Test City",
        equipment: ["Changing rooms", "Showers", "Kitchen", "Meeting room", "Bar"],
        status: "active"
      }
    ]);

    // Create test teams
    const [seniorsTeam] = await db.insert(teams).values({
      clubId: club.id,
      name: "Seniors Team",
      category: "Senior",
      ageGroup: "Adult",
      gender: "male",
      description: "First team competing in the main league",
      maxMembers: 25,
      season: "2024/25",
      status: "active"
    }).returning();

    const [reservesTeam] = await db.insert(teams).values({
      clubId: club.id,
      name: "Reserves Team",
      category: "Reserve",
      ageGroup: "Adult",
      gender: "male",
      description: "Reserve team for development players",
      maxMembers: 20,
      season: "2024/25",
      status: "active"
    }).returning();

    const [ladiesTeam] = await db.insert(teams).values({
      clubId: club.id,
      name: "Ladies Team",
      category: "Senior",
      ageGroup: "Adult",
      gender: "female",
      description: "Women's first team",
      maxMembers: 20,
      season: "2024/25",
      status: "active"
    }).returning();

    const [youthTeam] = await db.insert(teams).values({
      clubId: club.id,
      name: "Youth Team U18",
      category: "Youth",
      ageGroup: "U18",
      gender: "mixed",
      description: "Under 18 development team",
      maxMembers: 18,
      season: "2024/25",
      status: "active"
    }).returning();

    // Create test members
    const testMembers = [
      {
        clubId: club.id,
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@email.com",
        phone: "+1-555-0101",
        address: "456 Oak Avenue, Test City",
        birthDate: "1990-05-15",
        joinDate: "2023-01-15",
        membershipType: "full",
        status: "active",
        emergencyContact: "Jane Smith - +1-555-0102"
      },
      {
        clubId: club.id,
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@email.com",
        phone: "+1-555-0103",
        address: "789 Pine Street, Test City",
        birthDate: "1988-08-22",
        joinDate: "2023-03-10",
        membershipType: "full",
        status: "active",
        emergencyContact: "Mike Johnson - +1-555-0104"
      },
      {
        clubId: club.id,
        firstName: "Michael",
        lastName: "Brown",
        email: "michael.brown@email.com",
        phone: "+1-555-0105",
        address: "321 Elm Drive, Test City",
        birthDate: "1995-12-03",
        joinDate: "2023-06-20",
        membershipType: "social",
        status: "active",
        emergencyContact: "Lisa Brown - +1-555-0106"
      },
      {
        clubId: club.id,
        firstName: "Emma",
        lastName: "Wilson",
        email: "emma.wilson@email.com",
        phone: "+1-555-0107",
        address: "654 Maple Lane, Test City",
        birthDate: "1992-04-18",
        joinDate: "2023-09-05",
        membershipType: "full",
        status: "active",
        emergencyContact: "Tom Wilson - +1-555-0108"
      },
      {
        clubId: club.id,
        firstName: "David",
        lastName: "Taylor",
        email: "david.taylor@email.com",
        phone: "+1-555-0109",
        address: "987 Cedar Road, Test City",
        birthDate: "1985-11-30",
        joinDate: "2022-08-15",
        membershipType: "full",
        status: "active",
        emergencyContact: "Anna Taylor - +1-555-0110"
      }
    ];

    const insertedMembers = await db.insert(members).values(testMembers).returning();
    console.log(`✅ Created ${insertedMembers.length} test members`);

    // Create test players
    const testPlayers = [
      {
        clubId: club.id,
        firstName: "Alex",
        lastName: "Rodriguez",
        email: "alex.rodriguez@email.com",
        phone: "+1-555-0201",
        address: "111 Sports Avenue, Test City",
        birthDate: "1998-03-12",
        position: "Forward",
        shirtNumber: 9,
        height: 180,
        weight: 75,
        contractStart: "2024-01-01",
        contractEnd: "2025-12-31",
        salary: "2500.00",
        status: "active"
      },
      {
        clubId: club.id,
        firstName: "Maria",
        lastName: "Garcia",
        email: "maria.garcia@email.com",
        phone: "+1-555-0202",
        address: "222 Athletic Street, Test City",
        birthDate: "1996-07-25",
        position: "Midfielder",
        shirtNumber: 8,
        height: 165,
        weight: 60,
        contractStart: "2024-01-01",
        contractEnd: "2025-12-31",
        salary: "2200.00",
        status: "active"
      },
      {
        clubId: club.id,
        firstName: "James",
        lastName: "Anderson",
        email: "james.anderson@email.com",
        phone: "+1-555-0203",
        address: "333 Champions Road, Test City",
        birthDate: "1994-09-08",
        position: "Defender",
        shirtNumber: 4,
        height: 185,
        weight: 80,
        contractStart: "2023-07-01",
        contractEnd: "2025-06-30",
        salary: "2800.00",
        status: "active"
      },
      {
        clubId: club.id,
        firstName: "Sophie",
        lastName: "Miller",
        email: "sophie.miller@email.com",
        phone: "+1-555-0204",
        address: "444 Victory Lane, Test City",
        birthDate: "1999-01-14",
        position: "Goalkeeper",
        shirtNumber: 1,
        height: 175,
        weight: 70,
        contractStart: "2024-01-01",
        contractEnd: "2026-12-31",
        salary: "2000.00",
        status: "active"
      },
      {
        clubId: club.id,
        firstName: "Ryan",
        lastName: "Thompson",
        email: "ryan.thompson@email.com",
        phone: "+1-555-0205",
        address: "555 Stadium Street, Test City",
        birthDate: "2005-06-20",
        position: "Midfielder",
        shirtNumber: 10,
        height: 170,
        weight: 65,
        contractStart: "2024-08-01",
        contractEnd: "2025-07-31",
        salary: "800.00",
        status: "active"
      }
    ];

    const insertedPlayers = await db.insert(players).values(testPlayers).returning();
    console.log(`✅ Created ${insertedPlayers.length} test players`);

    // Create team memberships for members
    await db.insert(teamMemberships).values([
      { clubId: club.id, teamId: seniorsTeam.id, memberId: insertedMembers[0].id, role: "member", joinDate: new Date("2024-01-01") },
      { clubId: club.id, teamId: seniorsTeam.id, memberId: insertedMembers[1].id, role: "member", joinDate: new Date("2023-07-01") },
      { clubId: club.id, teamId: ladiesTeam.id, memberId: insertedMembers[2].id, role: "member", joinDate: new Date("2024-01-01") },
      { clubId: club.id, teamId: youthTeam.id, memberId: insertedMembers[3].id, role: "member", joinDate: new Date("2024-08-01") }
    ]);

    // Create player team assignments using the proper table
    await db.insert(playerTeamAssignments).values([
      { playerId: insertedPlayers[0].id, teamId: seniorsTeam.id, season: "2024/25", isActive: true },
      { playerId: insertedPlayers[2].id, teamId: seniorsTeam.id, season: "2024/25", isActive: true },
      { playerId: insertedPlayers[1].id, teamId: ladiesTeam.id, season: "2024/25", isActive: true },
      { playerId: insertedPlayers[3].id, teamId: ladiesTeam.id, season: "2024/25", isActive: true },
      { playerId: insertedPlayers[4].id, teamId: youthTeam.id, season: "2024/25", isActive: true }
    ]);

    // Create test events
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(events).values([
      {
        clubId: club.id,
        teamId: seniorsTeam.id,
        title: "League Match vs City FC",
        description: "Home league match against City FC",
        startDate: nextWeek,
        endDate: nextWeek,
        location: "Main Field",
        type: "match",
        status: "scheduled"
      },
      {
        clubId: club.id,
        teamId: seniorsTeam.id,
        title: "Team Training",
        description: "Weekly team training session",
        startDate: today,
        endDate: today,
        location: "Training Ground",
        type: "training",
        status: "scheduled"
      },
      {
        clubId: club.id,
        teamId: null,
        title: "Annual General Meeting",
        description: "Club's annual general meeting for all members",
        startDate: nextMonth,
        endDate: nextMonth,
        location: "Clubhouse",
        type: "meeting",
        status: "scheduled"
      }
    ]);

    // Create test bookings
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    await db.insert(bookings).values([
      {
        clubId: club.id,
        facilityId: mainField.id,
        teamId: seniorsTeam.id,
        memberId: null,
        title: "Training Session",
        description: "Regular team training",
        startTime: new Date(tomorrow.getTime() + 18.5 * 60 * 60 * 1000), // 18:30
        endTime: new Date(tomorrow.getTime() + 20 * 60 * 60 * 1000), // 20:00
        type: "training",
        status: "confirmed",
        notes: "Bring training equipment"
      }
    ]);

    // Create test financial records
    await db.insert(finances).values([
      {
        clubId: club.id,
        category: "membership_fees",
        subcategory: "annual_membership",
        amount: "150.00",
        type: "income",
        description: "Annual membership fee - John Smith",
        date: "2024-01-15",
        dueDate: "2024-01-15",
        status: "paid",
        paymentMethod: "bank_transfer",
        memberId: insertedMembers[0].id
      },
      {
        clubId: club.id,
        category: "equipment",
        subcategory: "training_equipment",
        amount: "-350.00",
        type: "expense",
        description: "Training cones and equipment purchase",
        date: "2024-01-20",
        dueDate: "2024-01-20",
        status: "paid",
        paymentMethod: "credit_card"
      },
      {
        clubId: club.id,
        category: "facilities",
        subcategory: "maintenance",
        amount: "-1200.00",
        type: "expense",
        description: "Field maintenance and grass cutting",
        date: "2024-01-10",
        dueDate: "2024-01-15",
        status: "paid",
        paymentMethod: "bank_transfer"
      }
    ]);

    console.log("✅ Test data seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Test data seeding failed:", error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData().then(() => {
    console.log("🎉 Test data seeding finished!");
    process.exit(0);
  }).catch(error => {
    console.error("❌ Test data seeding failed:", error);
    process.exit(1);
  });
}