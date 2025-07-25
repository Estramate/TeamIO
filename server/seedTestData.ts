import { db } from "./db";
import { clubs, members, teams, teamMemberships, facilities, finances, events, players, bookings, playerTeamAssignments } from "@shared/schema";

export async function seedTestData() {
  console.log("🌱 Seeding with test data...");

  try {
    // Create test club
    const testClub = {
      name: "Test Sports Club",
      shortName: "TSC",
      description: "A test sports club for demonstration purposes",
      email: "info@testsportsclub.com",
      phone: "+49 123 456789",
      website: "https://testsportsclub.com",
      address: "Test Street 123, 12345 Test City",
      founded: "2000-01-01",
      colors: "Blue, White",
      logo: "",
      status: "active"
    };

    const [club] = await db.insert(clubs).values(testClub).returning();
    console.log(`✅ Created club: ${club.name}`);

    // Create test members
    const testMembers = [
      {
        clubId: club.id,
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@email.com",
        phone: "+49 123 111111",
        birthDate: "1985-03-15",
        address: "Member Street 1, 12345 Test City",
        membershipNumber: "TSC001",
        status: "active",
        joinDate: "2024-01-01",
        paysMembershipFee: true
      },
      {
        clubId: club.id,
        firstName: "Emma",
        lastName: "Johnson",
        email: "emma.johnson@email.com",
        phone: "+49 123 222222",
        birthDate: "1990-07-20",
        address: "Member Street 2, 12345 Test City",
        membershipNumber: "TSC002",
        status: "active",
        joinDate: "2023-06-15",
        paysMembershipFee: true
      },
      {
        clubId: club.id,
        firstName: "Michael",
        lastName: "Brown",
        email: "michael.brown@email.com",
        phone: "+49 123 333333",
        birthDate: "1988-11-10",
        address: "Member Street 3, 12345 Test City",
        membershipNumber: "TSC003",
        status: "active",
        joinDate: "2023-09-01",
        paysMembershipFee: true
      },
      {
        clubId: club.id,
        firstName: "Sarah",
        lastName: "Davis",
        email: "sarah.davis@email.com",
        phone: "+49 123 444444",
        birthDate: "2005-12-05",
        address: "Member Street 4, 12345 Test City",
        membershipNumber: "TSC004",
        status: "active",
        joinDate: "2024-02-01",
        paysMembershipFee: true
      },
      {
        clubId: club.id,
        firstName: "Robert",
        lastName: "Wilson",
        email: "robert.wilson@email.com",
        phone: "+49 123 555555",
        birthDate: "1975-04-25",
        address: "Member Street 5, 12345 Test City",
        membershipNumber: "TSC005",
        status: "active",
        joinDate: "2020-01-01",
        paysMembershipFee: true
      }
    ];

    const insertedMembers = await db.insert(members).values(testMembers).returning();
    console.log(`✅ Created ${insertedMembers.length} test members`);

    // Create test teams
    const testTeams = [
      {
        clubId: club.id,
        name: "Seniors Team",
        category: "senior",
        ageGroup: "Senior",
        gender: "mixed",
        description: "Main senior team for competitive matches",
        maxMembers: 25,
        status: "active",
        season: "2024/25"
      },
      {
        clubId: club.id,
        name: "Ladies Team",
        category: "senior",
        ageGroup: "Senior",
        gender: "female",
        description: "Women's competitive team",
        maxMembers: 20,
        status: "active",
        season: "2024/25"
      },
      {
        clubId: club.id,
        name: "Youth Team U19",
        category: "youth",
        ageGroup: "U19",
        gender: "mixed",
        description: "Youth development team",
        maxMembers: 18,
        status: "active",
        season: "2024/25"
      },
      {
        clubId: club.id,
        name: "Veterans Team",
        category: "veteran",
        ageGroup: "40+",
        gender: "mixed",
        description: "Team for experienced players",
        maxMembers: 20,
        status: "active",
        season: "2024/25"
      }
    ];

    const insertedTeams = await db.insert(teams).values(testTeams).returning();
    console.log(`✅ Created ${insertedTeams.length} test teams`);

    const [seniorsTeam, ladiesTeam, youthTeam, veteransTeam] = insertedTeams;

    // Create test facilities
    const testFacilities = [
      {
        clubId: club.id,
        name: "Main Field",
        type: "field",
        description: "Main grass field for matches and training",
        capacity: 500,
        location: "Central area",
        maxConcurrentBookings: 1,
        status: "available"
      },
      {
        clubId: club.id,
        name: "Training Ground",
        type: "field",
        description: "Artificial turf field for training sessions",
        capacity: 200,
        location: "Behind main field",
        maxConcurrentBookings: 2,
        status: "available"
      },
      {
        clubId: club.id,
        name: "Clubhouse",
        type: "building",
        description: "Main clubhouse with meeting rooms",
        capacity: 100,
        location: "Main entrance",
        maxConcurrentBookings: 3,
        status: "available"
      }
    ];

    const insertedFacilities = await db.insert(facilities).values(testFacilities).returning();
    console.log(`✅ Created ${insertedFacilities.length} test facilities`);

    const [mainField, trainingGround, clubhouse] = insertedFacilities;

    // Create test players
    const testPlayers = [
      {
        clubId: club.id,
        firstName: "Alex",
        lastName: "Mueller",
        jerseyNumber: 10,
        position: "Mittelfeld",
        birthDate: "1995-06-12",
        phone: "+49 123 777777",
        email: "alex.mueller@email.com",
        address: "Player Street 1, 12345 Test City",
        nationality: "German",
        height: 180,
        weight: 75,
        contractStart: "2024-01-01",
        contractEnd: "2025-12-31",
        salary: "2500.00",
        status: "active"
      },
      {
        clubId: club.id,
        firstName: "Lisa",
        lastName: "Weber",
        jerseyNumber: 7,
        position: "Sturm",
        birthDate: "1998-09-18",
        phone: "+49 123 888888",
        email: "lisa.weber@email.com",
        address: "Player Street 2, 12345 Test City",
        nationality: "German",
        height: 165,
        weight: 60,
        contractStart: "2024-01-01",
        contractEnd: "2025-12-31",
        salary: "2200.00",
        status: "active"
      },
      {
        clubId: club.id,
        firstName: "Thomas",
        lastName: "Fischer",
        jerseyNumber: 1,
        position: "Tor",
        birthDate: "1992-02-28",
        phone: "+49 123 999999",
        email: "thomas.fischer@email.com",
        address: "Player Street 3, 12345 Test City",
        nationality: "German",
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
        lastName: "Klein",
        jerseyNumber: 5,
        position: "Verteidigung",
        birthDate: "1997-11-03",
        phone: "+49 123 101010",
        email: "sophie.klein@email.com",
        address: "Player Street 4, 12345 Test City",
        nationality: "German",
        height: 175,
        weight: 70,
        contractStart: "2024-01-01",
        contractEnd: "2026-12-31",
        salary: "2000.00",
        status: "active"
      },
      {
        clubId: club.id,
        firstName: "Max",
        lastName: "Richter",
        jerseyNumber: 11,
        position: "Sturm",
        birthDate: "2005-04-14",
        phone: "+49 123 121212",
        email: "max.richter@email.com",
        address: "Player Street 5, 12345 Test City",
        nationality: "German",
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
      { teamId: seniorsTeam.id, memberId: insertedMembers[0].id, role: "member", joinDate: new Date("2024-01-01") },
      { teamId: seniorsTeam.id, memberId: insertedMembers[1].id, role: "member", joinDate: new Date("2023-07-01") },
      { teamId: ladiesTeam.id, memberId: insertedMembers[2].id, role: "member", joinDate: new Date("2024-01-01") },
      { teamId: youthTeam.id, memberId: insertedMembers[3].id, role: "member", joinDate: new Date("2024-08-01") }
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
    return club;

  } catch (error) {
    console.error("❌ Error during test data seeding:", error);
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